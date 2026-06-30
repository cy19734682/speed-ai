import { PaginatedGroup, MessagesGroup } from '@/app/lib/type'
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
	try {
		while (true) {
			const { value, done } = await reader.read()
			if (done) break
			const chunk = decoder.decode(value, { stream: true })
			const lines = chunk.split('\n\n').filter((line) => line.trim() !== '')
			for (const line of lines) {
				if (!line.trim()) continue
				try {
					const data = JSON.parse(line)
					// 把回调也包起来，防止“设置 undefined”导致整个流被 abort
					try {
						onMessages(data)
					} catch (cbErr: any) {
						console.error('API接口回调处理失败:', cbErr)
					}
				} catch (parseErr: any) {
					console.warn('API接口JSON 解析失败:', line, parseErr)
				}
			}
		}
	} catch (readerErr: any) {
		//  AbortController 主动取消会走到这里
		if (readerErr.name === 'AbortError') {
			console.log('~~~请求被主动取消~~~~')
			const abortErr = new Error('用户取消请求')
			abortErr.name = 'AbortError'
			throw abortErr
		}
		// 其他 reader 异常继续抛，让外层 finally 处理
		throw readerErr
	} finally {
		reader.releaseLock()
	}
}

/**
 * 处理DeepSeek流式响应
 * 使用行级缓冲 + SSE 事件缓冲，防止 JSON 被数据块边界截断
 * @param response
 * @param onMessages
 */
export const handleDeepseekResponse = async (response: any, onMessages: (arg0: any) => void) => {
	if (!response.ok) {
		const errorData = await response.json()
		// 直接返回错误信息，避免本地抛出异常
		throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
	}
	// 处理流式响应
	const reader = response.body.getReader()
	const decoder = new TextDecoder('utf-8')
	// 行级缓冲区：存放跨数据块的未完整行
	let lineBuffer = ''
	// SSE 事件缓冲区：多条 data: 行拼接成一个完整事件内容（SSE 允许一个事件跨多行 data:）
	let eventBuffer = ''

	try {
		while (true) {
			const { value, done } = await reader.read()
			if (done) break
			// 追加到行级缓冲
			lineBuffer += decoder.decode(value, { stream: true })

			// 逐行处理（行内以 \n 分割）
			let lineEndIndex: number
			while ((lineEndIndex = lineBuffer.indexOf('\n')) !== -1) {
				const rawLine = lineBuffer.slice(0, lineEndIndex)
				lineBuffer = lineBuffer.slice(lineEndIndex + 1)
				// 去除 \r 兼容 Windows 换行
				const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine

				// SSE 规则：空行表示事件结束
				if (line === '') {
					if (eventBuffer.trim() !== '') {
						processSseEvent(eventBuffer, onMessages)
					}
					eventBuffer = ''
					continue
				}

				// SSE 字段行：如果以 "data:" 开头则收集
				if (line.startsWith('data:')) {
					const dataValue = line.slice(5).replace(/^ /, '')
					// 忽略 [DONE] 结束标记
					if (dataValue.trim() === '[DONE]') {
						continue
					}
					// SSE 多行 data 拼接规则：多个 data: 行之间用 \n 连接
					if (eventBuffer !== '') {
						eventBuffer += '\n'
					}
					eventBuffer += dataValue
				}
				// 其他 SSE 字段（id:/event:/retry:）忽略
			}
		}
		// 流结束时处理 eventBuffer 中可能残留的数据
		if (eventBuffer.trim() !== '') {
			processSseEvent(eventBuffer, onMessages)
		}
	} catch (readerErr: any) {
		// AbortController 主动取消会走到这里
		if (readerErr.name === 'AbortError') {
			console.log('~~~DeepSeek请求被主动取消~~~~')
			return
		}
		// 其他 reader 异常继续抛，让外层 finally 处理
		throw readerErr
	} finally {
		reader.releaseLock()
	}
}

/**
 * 处理单个 SSE 事件：解析 JSON 并调用回调
 * 包含防御性检查，避免 choices/delta 为空时崩溃
 */
function processSseEvent(dataStr: string, onMessages: (arg0: any) => void) {
	const trimmed = dataStr.trim()
	if (!trimmed) return
	try {
		const processedData = JSON.parse(trimmed)
		try {
			const choices = processedData.choices
			if (Array.isArray(choices) && choices.length > 0) {
				const delta = choices[0]?.delta
				const finish_reason = choices[0]?.finish_reason
				// delta 可能是空对象（流式开始/结束时的占位），也可能为 undefined
				if (delta?.content || delta?.reasoning_content || delta?.tool_calls || finish_reason) {
					onMessages({ ...delta, finish_reason })
				}
			}
		} catch (cbErr: any) {
			console.error('DeepSeek接口回调处理失败:', cbErr)
		}
	} catch (parseErr: any) {
		console.warn('DeepSeek接口JSON 解析失败:', trimmed.slice(0, 200), parseErr)
	}
}

/**
 * UUID生成
 * @returns {string}
 * @constructor
 */
export function UUID(): string {
	const maxTime = 9007199254740991 // Number.MAX_SAFE_INTEGER
	const reversedTime = (maxTime - Date.now()).toString(16).padStart(12, '0')
	const timeHex = reversedTime.slice(0, 11)
	const firstGroup = timeHex.slice(0, 8)
	const secondGroupPrefix = timeHex.slice(8, 11)
	const secondGroup = secondGroupPrefix + '4'

	const thirdGroup =
		((Math.random() * 4 + 8) | 0).toString(16) +
		Math.floor(Math.random() * 0x1000)
			.toString(16)
			.padStart(3, '0')
	const fourthGroup = Math.floor(Math.random() * 0x10000)
		.toString(16)
		.padStart(4, '0')
	const fifthGroup = Math.floor(Math.random() * 0x1000000000000)
		.toString(16)
		.padStart(12, '0')

	return `${firstGroup}-${secondGroup}-${thirdGroup}-${fourthGroup}-${fifthGroup}`
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
 * @param result
 */
export function replyFormat(type: any, result: any = '') {
	return JSON.stringify({ type, result }) + '\n\n'
}

/**
 * 时间分组工具
 * @param {Array} data - 原始数据数组
 * @param {string} timeKey - 时间字段名
 * @param {Object} pagination - 分页配置 { page: 当前页码, pageSize: 每页条数 }
 * @returns {MessagesGroup} 分组结果和分页信息
 */
export function groupByTime(
	data: any[],
	timeKey: string,
	pagination: { page: number; pageSize: number } = {
		page: 1,
		pageSize: 20
	}
): MessagesGroup {
	const now = new Date()
	const todayStart: any = new Date(now)
	todayStart.setHours(0, 0, 0, 0)
	const yesterdayStart = new Date(todayStart)
	yesterdayStart.setDate(yesterdayStart.getDate() - 1)

	// 定义分组边界
	const timeGroups: Record<string, any> = {
		today: {
			name: '今日',
			test: (d: any) => new Date(d) >= todayStart
		},
		yesterday: {
			name: '昨日',
			test: (d: any) => new Date(d) >= yesterdayStart && new Date(d) < todayStart
		},
		within7Days: {
			name: '7天内',
			test: (d: any) => {
				const weekAgo = new Date(todayStart)
				weekAgo.setDate(weekAgo.getDate() - 7)
				return new Date(d) >= weekAgo && new Date(d) < yesterdayStart
			}
		},
		within30Days: {
			name: '30天内',
			test: (d: any) => {
				const monthAgo = new Date(todayStart)
				monthAgo.setDate(monthAgo.getDate() - 30)
				return new Date(d) >= monthAgo && new Date(d).getTime() < todayStart - 7 * 86400000
			}
		},
		months: {}
	}

	// 分组处理
	const groups: any = {}
	data.forEach((item) => {
		const date = new Date(item[timeKey])
		for (const [key, group] of Object.entries(timeGroups)) {
			if (key !== 'months' && group.test(date)) {
				groups[key] = groups[key] || { name: group.name, data: [] }
				groups[key].data.push(item)
				return
			}
		}
		// 按月分组
		const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
		groups[monthKey] = groups[monthKey] || {
			name: `${date.getFullYear()}年${date.getMonth() + 1}月`,
			data: []
		}
		groups[monthKey].data.push(item)
	})

	// 分组排序（今日->昨日->7天->30天->月份倒序）
	const orderedGroups = [
		groups.today,
		groups.yesterday,
		groups.within7Days,
		groups.within30Days,
		...Object.entries(groups)
			.filter(([key]) => !['today', 'yesterday', 'within7Days', 'within30Days'].includes(key))
			.sort(([a], [b]) => b.localeCompare(a)) // 月份倒序
			.map(([, group]) => group)
	].filter(Boolean)

	// 分页处理
	const startIndex = (pagination.page - 1) * pagination.pageSize
	const paginatedGroups: PaginatedGroup[] = []
	let remainingItems = pagination.pageSize
	let currentPage = pagination.page

	for (const group of orderedGroups) {
		if (remainingItems <= 0) break

		const groupStart = Math.max(0, startIndex - paginatedGroups.flatMap((g) => g.data).length)
		const pageData = group.data.slice(groupStart, groupStart + remainingItems)
		const hasMore = groupStart + remainingItems < group.data.length

		if (pageData.length > 0) {
			paginatedGroups.push({
				name: group.name,
				data: pageData,
				total: group.data.length,
				hasMore: hasMore,
				currentPage: currentPage
			})
			remainingItems -= pageData.length
		}
	}

	return {
		groups: paginatedGroups,
		total: data.length,
		currentPage: pagination.page,
		pageSize: pagination.pageSize,
		hasNextPage: paginatedGroups.flatMap((g) => g.data).length < data.length - startIndex
	}
}

/**
 * 格式化工具调用结果
 */
export async function copyTextToClipboard(text: string): Promise<void> {
	const fallbackCopyTextToClipboard = (text: string): void => {
		const textArea = document.createElement('textarea')
		textArea.value = text
		document.body.appendChild(textArea)
		textArea.select()
		document.execCommand('copy')
		document.body.removeChild(textArea)
	}

	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text)
		return
	}
	try {
		await navigator.clipboard.writeText(text)
	} catch (err) {
		console.error('Clipboard write failed:', err)
		fallbackCopyTextToClipboard(text)
	}
}
