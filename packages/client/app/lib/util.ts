/**
 * 封装处理响应的公共方法
 * @param response
 * @param onMessages
 */
export const handleResponse = async (response: any, onMessages: (arg0: any) => void) => {
	if (!response.ok) {
		const errorData = await response.json()
		// 直接返回错误信息，避免本地抛出异常
		throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
	}
	// 处理流式响应
	const reader = response.body.getReader()
	const decoder = new TextDecoder('utf-8')
	while (true) {
		const { value, done } = await reader.read()
		if (done) break
		const chunk = decoder.decode(value, { stream: true })
		const lines = chunk.split('\n\n').filter((line) => line.trim() !== '')
		for (const line of lines) {
			if (line) {
				try {
					const data = JSON.parse(line)
					// 更新内容
					if (data) {
						onMessages(data)
					}
				} catch (err: any) {
					throw new Error(`解析错误: ${err.message}`)
				}
			}
		}
	}
}

/**
 * UUID生成
 * @returns {string}
 * @constructor
 */
export function UUID(): string {
	let d = new Date().getTime()
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (d + Math.random() * 16) % 16 | 0
		d = Math.floor(d / 16)
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
	})
}

/**
 * 格式化搜索查询
 */
export function formatSearchQuery(result: any) {
	// extract json from response
	const regex = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/g
	const match = result.content.match(regex)
	if (match?.length > 0) {
		const data = JSON.parse(match[0])
		if (data?.action === 'search') {
			return { query: data.query }
		}
	}
	return { query: '' }
}

/**
 * 将MCP结果格式化为AI工具调参数
 */
export function formatMcpSchemaTool(mcpTools: any[]) {
	return mcpTools.map((tool) => ({
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.input_schema
		}
	}))
}

/**
 * 格式化工具调用结果
 */
export function formatToolResult(result: any): string {
	try {
		if (typeof result === 'string') {
			// 尝试解析JSON字符串
			try {
				const parsedResult = JSON.parse(result)
				return JSON.stringify(parsedResult, null, 2)
			} catch {
				return result
			}
		} else if (result && result.content && Array.isArray(result.content)) {
			// 处理MCP结果格式
			return result.content
				.filter((item: any) => item.type === 'text')
				.map((item: any) => {
					try {
						return JSON.stringify(JSON.parse(item.text), null, 2)
					} catch {
						return item.text
					}
				})
				.join('\n')
		} else {
			// 处理其他格式
			return JSON.stringify(result, null, 2)
		}
	} catch (error) {
		console.error('格式化结果出错:', error)
		return String(result)
	}
}

/**
 * 消息回复格式化
 * @param type
 * @param content
 */
export function replyFormat(type: any, content: any = '') {
	return JSON.stringify({ type, content }) + '\n\n'
}
