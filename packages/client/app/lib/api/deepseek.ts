import { apiFetch } from './fetch'
import { formatMcpSchemaTool, formatSearchQuery, replyFormat } from '@/app/lib/util'
import { config } from '@/app/lib/config'
import { initMcpClient } from '@/app/lib/mcp-service'
import {
	answerWithSearchResults,
	nameConversation,
	structureSearchAction,
	structureToolAction
} from '@/app/lib/prompts'

/**
 * 处理联网搜索结果
 * @param originalMessages
 * @param messages
 * @param options
 * @param controller
 */
const handlerSearchResult = async (
	originalMessages: any,
	messages: any,
	options: Record<string, any> = {},
	controller: any
): Promise<any> => {
	let searchClient = null
	const { webSearch, searchTool } = options
	try {
		if (webSearch && searchTool?.url) {
			const { mcpClient, mcpTools } = await initMcpClient(searchTool)
			searchClient = mcpClient
			const data = await createDeepSeekChatResponse(
				[
					{
						role: 'system',
						content: structureSearchAction()
					},
					...originalMessages
				],
				{
					...options,
					model: 'deepseek-chat',
					tools: undefined
				}
			)
			const searchQuery = formatSearchQuery(data)
			if (searchQuery.query) {
				const name = mcpTools?.[0]?.name
				const toolName = searchTool?.name + '(' + mcpTools?.[0]?.name + ')'
				// 开始调用工具
				controller.enqueue(replyFormat('search', { type: 'start', toolName }))
				const searchRet: any = await searchClient.callTool({
					name,
					arguments: searchQuery
				})
				const searchResultContent = JSON.parse(searchRet.content?.[0]?.text || '[]')
				const searchResultMessage = searchResultContent
					.map((it: Record<string, any>, i: number) => {
						return `[webpage ${i + 1} begin]
                  Title: ${it.title}
                  URL: ${it.link}
                  Content: ${it.snippet}
                  [webpage ${i + 1} end]`
					})
					.join('\n')
				// 拼接联网搜索系统参数
				messages.unshift({
					role: 'system',
					content: answerWithSearchResults()
				})
				// 将搜索结果和对话内容结合
				messages[messages.length - 1].content =
					`${searchResultMessage}\nUser Message:\n${messages[messages.length - 1].content}`
				// 结束调用工具并向前端输入结果
				controller.enqueue(replyFormat('search', { type: 'end', toolName, searchQuery, content: searchResultContent }))
			}
		}
	} catch (error: any) {
		throw error
	} finally {
		// 使用完成后关闭MCP客户端连接
		await searchClient?.close()
    searchClient = null
	}
}

/**
 * 处理MCO工具调用结果
 * @param originalMessages
 * @param messages
 * @param options
 * @param controller
 */
const handlerMcpToolResult = async (
	originalMessages: any,
	messages: any,
	options: Record<string, any> = {},
	controller: any
): Promise<any> => {
	const { tools } = options
	const funcTools = []
	try {
		if (tools?.length > 0) {
			for (const tool of tools) {
				const { mcpClient, mcpTools } = await initMcpClient(tool)
				tool.mcpClient = mcpClient
				tool.mcpTools = mcpTools
				funcTools.push(...mcpTools)
			}
			const data: any = await createDeepSeekChatResponse(
				[
					{
						role: 'system',
						content: structureToolAction()
					},
					...originalMessages
				],
				{
					...options,
					model: 'deepseek-chat',
					tools: formatMcpSchemaTool(funcTools)
				}
			)
			const toolCalls = data?.tool_calls || []
			if (toolCalls?.length > 0) {
				messages.push({
					role: 'assistant',
					tool_calls: toolCalls
				})
				const outputTools = []
				for (const tool of toolCalls) {
					const { id, function: func } = tool
					const { name, arguments: args } = func
					const argument = JSON.parse(args)
					const mcpTool = tools.find((e: any) => e.mcpTools.some((tool: any) => tool.name === name)) || null
					const toolName = mcpTool?.name + '(' + name + ')'
					outputTools.push({ type: 'start', toolName })
					// 开始调用工具
					controller.enqueue(replyFormat('tool', outputTools))
					const retData = await mcpTool.mcpClient.callTool({
						name,
						arguments: argument
					})
					messages.push({
						role: 'tool',
						tool_call_id: id,
						content: JSON.stringify(retData)
					})
					outputTools[outputTools.length - 1] = { type: 'end', toolName, params: argument, result: retData }
					// 开始调用工具
					controller.enqueue(replyFormat('tool', outputTools))
				}
			}
		}
	} catch (error: any) {
		throw error
	} finally {
		// 使用完成后关闭MCP客户端连接
		if (options.tools?.length > 0) {
			for (const tool of options.tools) {
				await tool?.mcpClient?.close()
			}
		}
		options.tools = []
	}
}

/**
 * 处理自动生成标题
 * @param messages
 * @param options
 */
const autoGenerateTitle = async (messages: any, options: Record<string, any> = {}): Promise<any> => {
	const { autoTitle } = options
	if (autoTitle) {
		options.model = 'deepseek-chat'
		messages[0].content = nameConversation(messages[0].content)
	}
}

/**
 * 创建数据处理转换流
 * @returns {TransformStream} 转换流
 */
const createDataProcessorStream = (): TransformStream => {
	const decoder = new TextDecoder()
	let thinkTime = 0 // 思考时间
	let startTime: any = null // 开始时间
	let isThinking = false // 是否输出了深度思考

	return new TransformStream({
		async transform(chunk, controller) {
			try {
				if (!startTime) {
					startTime = Date.now()
				}
				const chunkString = decoder.decode(chunk)
				const lines = chunkString.split('\n').filter((line) => line.trim() !== '')

				for (const line of lines) {
					if (line.startsWith('data: ') && !line.includes('[DONE]')) {
						const dataStr = line.substring(6)
						// 处理数据
						const processedData = JSON.parse(dataStr)
						const reasoningContent = processedData?.choices?.[0]?.delta?.reasoning_content || ''
						if (reasoningContent) {
							if (!isThinking) {
								isThinking = true
							}
							// 深度思考
							controller.enqueue(replyFormat('think', reasoningContent))
						}
						const content = processedData?.choices?.[0]?.delta?.content || ''
						if (content) {
							// 计算思考时间(输出了正常对话说明深度思考结束)
							if (content && isThinking && !thinkTime) {
								thinkTime = (Date.now() - startTime) / 1000
								controller.enqueue(replyFormat('time', Number(thinkTime.toFixed(0))))
							}
							// 正常对话
							controller.enqueue(replyFormat('middle', content))
						}
					}
				}
			} catch (error) {
				console.error('流处理错误:', error)
				// 传递原始数据以防处理失败
				controller.enqueue(chunk)
			}
		}
	})
}

/**
 * 创建DeepSeek聊天流式对话
 * @param {Array} messages - 聊天消息数组
 * @param {Object} [options] - 选项
 * @returns {Promise<ReadableStream>} 返回可读流
 */
export const createDeepSeekChatStream = async (
	messages: any,
	options: Record<string, any> = {}
): Promise<ReadableStream> => {
	const { model, temperature = 0.7, maxTokens = 2048, tools } = options
	const response: any = await apiFetch(config.ai.deepseekApiUrl, 'POST', {
		body: {
			model: model || config.ai.defaultModel,
			messages,
			temperature,
			max_tokens: maxTokens,
			stream: true,
			tools: tools?.length > 0 ? tools : undefined
		},
		headers: {
			Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
		},
		timeout: 30000 // 30秒超时
	})
	// 创建数据处理流
	const processorStream = createDataProcessorStream()
	// 组合流处理
	return response.body.pipeThrough(processorStream)
}

/**
 * 创建非流式的DeepSeek聊天响应
 * @param {Array} messages - 聊天消息数组
 * @param {Object} [options] - 选项
 * @returns {Promise<Object>} 返回响应数据
 */
export const createDeepSeekChatResponse = async (
	messages: any[],
	options: Record<string, any> = {}
): Promise<object> => {
	const { model, temperature = 0.7, maxTokens = 2048, tools = [] } = options
	const response: any = await apiFetch(config.ai.deepseekApiUrl, 'POST', {
		body: {
			model: model || config.ai.defaultModel,
			messages,
			tools: tools?.length > 0 ? tools : undefined,
			temperature,
			max_tokens: maxTokens
		},
		headers: {
			Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
		}
	})

	// 处理数据
	const data = await response.json()
	return data?.choices?.[0]?.message || {}
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
				// 原始消息
				const originalMessages = [...messages]
				// 处理自动生成标题
				await autoGenerateTitle(messages, options)
				// 处理联网搜索
				await handlerSearchResult(originalMessages, messages, options, controller)
				// 处理MCP工具调用
				await handlerMcpToolResult(originalMessages, messages, options, controller)
				// 正常对话
				const deepSeekStream = await createDeepSeekChatStream(messages, options)
				const reader = deepSeekStream.getReader()
				while (true) {
					const { done, value } = await reader.read()
					if (done) {
						controller.close()
						break
					}
					controller.enqueue(value)
				}
			} catch (error) {
				console.error('流处理出错:', error)
				controller.error(error)
			} finally {
				controller.close()
			}
		}
	})
}
