import { apiFetch } from './fetch'
import { formatMcpSchemaTool, handleDeepseekResponse, replyFormat } from '@/app/lib/util'
import { config } from '@/app/lib/config'
import { initMcpClient } from '@/app/lib/mcp-service'
import { nameConversation, structureToolAction } from '@/app/lib/prompts'

/**
 * 处理自动生成标题
 * @param messages
 * @param options
 */
const autoGenerateTitle = async (messages: any, options: Record<string, any> = {}): Promise<any> => {
	const { autoTitle } = options
	if (autoTitle) {
		options.model = 'deepseek-chat'
		options.thinking = false
		messages[0].content = nameConversation(messages[0].content)
	}
}

/**
 * 创建DeepSeek聊天流式对话
 * @param {Array} messages - 聊天消息数组
 * @param {Object} [options] - 选项
 * @param controller - 控制器
 */
export const createDeepSeekChatStream = async (messages: any, options: Record<string, any> = {}, controller: any) => {
	const {
		model,
		temperature = 0.7,
		maxTokens = 2048,
		tools = [],
		webSearch,
		searchTool,
		thinking = false,
		abortCtrl
	} = options
	// 处理联网搜索
	if (webSearch && searchTool?.url) {
		tools.unshift(searchTool)
	}
	// 处理MCP工具
	let funcTools: any[] = []
	for (const tool of tools) {
		const { mcpClient, mcpTools } = await initMcpClient(tool)
		tool.mcpClient = mcpClient
		tool.mcpTools = mcpTools
		funcTools.push(...mcpTools)
	}
	if (funcTools?.length > 0) {
		funcTools = formatMcpSchemaTool(funcTools)
		messages.unshift({
			role: 'system',
			content: structureToolAction()
		})
	}

	// 处理轮次
	let round = 0

	// 处理DeepSeek API调用
	while (true) {
		const response: any = await apiFetch(config.ai.deepseekApiUrl, 'POST', {
			body: {
				model: model || config.ai.defaultModel,
				messages,
				temperature,
				max_tokens: maxTokens,
				stream: true,
				tools: funcTools?.length > 0 ? funcTools : undefined,
				thinking: { type: thinking ? 'enabled' : 'disabled' }
			},
			headers: {
				Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
			},
			controller: abortCtrl,
			timeout: 30000 // 30秒超时
		})
		let thinkTime = 0 // 思考时间
		let startTime: any = null // 开始时间
		let isThinking = false // 是否输出了深度思考
		let isLoading = false // 是否开始
		const toolCalls: any[] = [] // 工具调用
		const assistantMsg: any = { role: 'assistant', content: '', reasoning_content: '' }
		await handleDeepseekResponse(response, (delta) => {
			if (!startTime) {
				startTime = Date.now()
			}
			const reasoningContent = delta?.reasoning_content || ''
			if (reasoningContent) {
				if (!isThinking) {
					isThinking = true
				}
				assistantMsg.reasoning_content += reasoningContent
				// 深度思考
				controller.enqueue(replyFormat('think', { index: round, content: reasoningContent }))
			}
			const content = delta?.content || ''
			if (content) {
				// 计算思考时间
				if (isThinking && !thinkTime) {
					thinkTime = (Date.now() - startTime) / 1000
					controller.enqueue(replyFormat('time', { index: round, content: Number(thinkTime.toFixed(0)) }))
				}
				assistantMsg.content += content
				// 正常对话
				controller.enqueue(replyFormat('middle', { index: round, content }))
			}
			/* tool_calls：按索引增量拼接 */
			if (delta.tool_calls) {
				// 计算思考时间
				if (isThinking && !thinkTime) {
					thinkTime = (Date.now() - startTime) / 1000
					controller.enqueue(replyFormat('time', { index: round, content: Number(thinkTime.toFixed(0)) }))
				}
				// 向前端输入开始加载状态
				if (!isLoading) {
					isLoading = true
					controller.enqueue(replyFormat('loading', { index: round, content: true }))
				}
				for (const tc of delta.tool_calls) {
					const idx = tc.index
					if (!toolCalls[idx]) {
						toolCalls[idx] = { id: tc.id, type: 'function', function: { name: '', arguments: '' } }
					}
					if (tc.function?.name) toolCalls[idx].function.name += tc.function.name
					if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments
				}
			}
		})
		/* 把完整 assistant 消息写入历史 */
		if (toolCalls.length) {
			assistantMsg.tool_calls = toolCalls
		}
		if (isLoading) {
			isLoading = false
			// 向前端输入结束加载状态
			controller.enqueue(replyFormat('loading', { index: round, content: false }))
		}
		messages.push(assistantMsg)
		if (toolCalls.length) {
			const outputTools = []
			for (const tool of toolCalls) {
				const { id, function: func } = tool
				const { name, arguments: args } = func
				const argument = JSON.parse(args)
				const mcpTool = tools.find((e: any) => e.mcpTools.some((tool: any) => tool.name === name)) || null
				const toolName = mcpTool?.name + '(' + name + ')'
				const startTool = { type: 'start', toolName }
				if (searchTool?.tool?.split(',').includes(name)) {
					// 开始调用联网搜索
					controller.enqueue(replyFormat('search', { index: round, content: startTool }))
				} else {
					outputTools.push(startTool)
					// 开始调用MCP工具
					controller.enqueue(replyFormat('tools', { index: round, content: outputTools }))
				}
				const retData = await mcpTool.mcpClient.callTool({
					name,
					arguments: argument
				})
				messages.push({
					role: 'tool',
					tool_call_id: id,
					content: JSON.stringify(retData)
				})
				const endTool: any = { type: 'end', toolName, params: argument, result: retData }
				if (searchTool?.tool?.split(',').includes(name)) {
					// 结束调用联网搜索并向前端输入结果
					endTool.result = JSON.parse(retData.content?.[0]?.text || '[]')
					controller.enqueue(replyFormat('search', { index: round, content: endTool }))
				} else {
					outputTools[outputTools.length - 1] = endTool
					// 结束调用MCP工具
					controller.enqueue(replyFormat('tools', { index: round, content: outputTools }))
				}
			}
			round++
			continue
		}
		break
	}
}

/**
 * 创建DeepSeek对话
 * @param {Array} messages - 聊天消息数组
 * @param {Object} [options] - 选项
 * @returns {Promise<ReadableStream>} 返回可读流
 */
export const createDeepSeekChat = async (messages: any, options: Record<string, any> = {}): Promise<ReadableStream> => {
	return new ReadableStream({
		async start(controller) {
			try {
				// 处理自动生成标题
				await autoGenerateTitle(messages, options)
				// 正常对话
				await createDeepSeekChatStream(messages, options, controller)
			} catch (error) {
				console.error('流处理出错:', error)
				controller.error(error)
			} finally {
				console.log('[DEBUG] ReadableStream finally block executed')
				controller.close()
			}
		}
	})
}
