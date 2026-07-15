import { apiFetch } from './fetch'
import { formatMcpSchemaTool, handleDeepseekResponse, replyFormat } from '@/app/lib/util'
import { config } from '@/app/lib/config'
import { initMcpClient } from '@/app/lib/mcp-service'
import { nameConversation, structureToolAction } from '@/app/lib/prompts'
import { getKB } from '@/app/lib/langchain/cloud'

/**
 * 处理自动生成标题
 * @param messages
 * @param options
 */
const autoGenerateTitle = async (messages: any, options: Record<string, any> = {}): Promise<any> => {
	const { autoTitle } = options
	if (autoTitle) {
		options.model = config.ds.defaultModel
		options.thinking = false
		messages[0].content = nameConversation(messages[0].content)
	}
}

/**
 * 基于知识库检索相关上下文
 * - 云端知识库：运行在服务端（libsql），所有人都可使用
 * - 本地知识库：由前端搜索后通过 options.localKnowledgeResults 传入
 * 两者结果会合并排序后注入到对话
 *
 * 注意：只有「维护」云端知识库（增删改）需要密码权限，
 *       「使用」云端知识库（对话检索）所有人都可以使用
 */
const retrieveKnowledgeContext = async (
	messages: any,
	options: Record<string, any> = {},
	topK = 4
): Promise<Record<string, any>> => {
	try {
		const query = [...messages].reverse().find((m: any) => m.role === 'user')?.content
		if (!query || typeof query !== 'string') return { context: '', results: [] }

		// 1) 云端知识库搜索（仅在 service-side，libsql）
		let cloudResults: any[] = []
		try {
			const kb = await getKB()
			cloudResults = await kb.searchContext(query, topK)
		} catch (e) {
			console.warn('[知识库检索] 云端搜索失败：', e)
		}

		// 2) 本地知识库结果（前端 IndexedDB 已搜索好）
		const localResults: any[] = Array.isArray(options.localKnowledgeResults) ? options.localKnowledgeResults : []

		// 3) 合并并按分数降序排序（展示 topK * 2，方便用户查看更多相关内容）
		const merged = [...cloudResults, ...localResults].sort(
			(a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0)
		)
		const results = merged.slice(0, Math.max(topK * 2, merged.length))

		if (results.length === 0) {
			return { context: '', results: [] }
		}

		const contextStrings = results.map((item: any, index: number) => {
			const name = item.metadata?.name || item.metadata?.source || '未知来源'
			return `[${index + 1}] 来源: ${name} (相关度: ${Number(item.score || 0).toFixed(4)})\n${item.content}`
		})
		const context = `以下是知识库中与您问题相关的资料（请结合这些信息回答，若知识库中没有相关内容则按一般常识回答）：\n${contextStrings.join('\n\n')}`
		return {
			context,
			results
		}
	} catch (e) {
		console.warn('[知识库检索] 失败：', e)
		return {}
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
		knowledge = false,
		abortCtrl
	} = options
	// 处理联网搜索
	if (webSearch && searchTool?.url) {
		tools.unshift(searchTool)
	}
	// 处理MCP工具
	let funcTools: any[] = []
	for (const tool of tools) {
		const { mcpClient, mcpTools, requestTimeout } = await initMcpClient(tool)
		tool.mcpClient = mcpClient
		tool.mcpTools = mcpTools
		tool.requestTimeout = requestTimeout // 保存超时供后续 callTool 使用
		funcTools.push(...mcpTools)
	}
	if (funcTools?.length > 0) {
		funcTools = formatMcpSchemaTool(funcTools)
		messages.unshift({
			role: 'system',
			content: structureToolAction()
		})
	}

	// 创建DeepSeek模型
	const createChatModel = async () => {
		return await apiFetch(config.ds.apiUrl, 'POST', {
			body: {
				model: model || config.ds.defaultModel,
				messages,
				temperature,
				max_tokens: maxTokens,
				stream: true,
				tools: funcTools?.length > 0 ? funcTools : undefined,
				thinking: { type: thinking ? 'enabled' : 'disabled' }
			},
			headers: {
				Authorization: `Bearer ${config.ds.apiKey}`
			},
			controller: abortCtrl,
			timeout: 30000 // 30秒超时
		})
	}

	// 处理轮次
	let round = 0

	// 知识库检索
	if (knowledge) {
		controller.enqueue(replyFormat('knowledge', { index: round, content: { type: 'start' } }))
		const { context, results = [] } = await retrieveKnowledgeContext(messages, options, 5)
		if (context && results?.length > 0) {
			messages.unshift({
				role: 'system',
				content: context
			})
		}
		controller.enqueue(replyFormat('knowledge', { index: round, content: { type: 'end', results } }))
		round++
	}

	// 处理DeepSeek API调用
	while (true) {
		const response: any = await createChatModel()
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
			const finishReason = delta?.finish_reason || ''
			if (finishReason === 'length' || finishReason === 'content_filter') {
				// 模型停止生成 token 的原因
				controller.enqueue(replyFormat('finish', { index: round, content: finishReason }))
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
					controller.enqueue(replyFormat('time', { index: round, content: Number(thinkTime.toFixed(4)) }))
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
					controller.enqueue(replyFormat('time', { index: round, content: Number(thinkTime.toFixed(4)) }))
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
				try {
					// ✅ 关键修复：通过 RequestOptions.timeout 传递请求超时，解决 McpError -32001
					const requestTimeout = mcpTool?.requestTimeout || 60_000
					const retData = await mcpTool.mcpClient.callTool(
						{
							name,
							arguments: argument
						},
						undefined, // resultSchema 可选
						{ timeout: requestTimeout } // RequestOptions
					)
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
				} catch (toolErr) {
					const toolErrMsg = (toolErr as Error)?.message || String(toolErr) || '工具调用失败'
					console.error(`[MCP 工具调用失败] ${toolName}:`, toolErr)

					// 超时错误（MCP error -32001: Request timed out）
					if (toolErrMsg.includes('-32001') || toolErrMsg.includes('timed out') || toolErrMsg.includes('timeout')) {
						const currentTimeout = Math.round((mcpTool?.requestTimeout || 60_000) / 1000)
						const failTool = {
							type: 'error',
							toolName,
							error: `请求超时（当前${currentTimeout}s）请在 MCP 工具配置中调大 requestTimeout`
						}
						if (searchTool?.tool?.split(',').includes(name)) {
							controller.enqueue(replyFormat('search', { index: round, content: failTool }))
						} else {
							outputTools[outputTools.length - 1] = failTool
							controller.enqueue(replyFormat('tools', { index: round, content: outputTools }))
						}
						messages.push({
							role: 'tool',
							tool_call_id: id,
							content: JSON.stringify({ isError: true, error: `工具调用超时，请重试：${toolErrMsg}` })
						})
					} else {
						// 其他错误
						const failTool = { type: 'error', toolName, error: toolErrMsg }
						if (searchTool?.tool?.split(',').includes(name)) {
							controller.enqueue(replyFormat('search', { index: round, content: failTool }))
						} else {
							outputTools[outputTools.length - 1] = failTool
							controller.enqueue(replyFormat('tools', { index: round, content: outputTools }))
						}
						messages.push({
							role: 'tool',
							tool_call_id: id,
							content: JSON.stringify({ isError: true, error: toolErrMsg })
						})
					}
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
				controller.close()
			}
		}
	})
}
