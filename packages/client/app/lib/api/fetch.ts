/**
 * 封装的fetch工具函数
 * @param {string} url - API端点URL
 * @param {string} method - HTTP方法
 * @param {Object} [options] - 选项
 * @returns {Promise<Response>} 返回响应对象
 */
export const apiFetch = async (url: string | URL | Request, method: any, options: any = {}): Promise<Response> => {
	let { body, headers = {}, controller, timeout = 30000 } = options

	const defaultHeaders = {
		'Content-Type': 'application/json'
	}

	if (!controller) {
		controller = new AbortController()
	}
	const timeoutId = setTimeout(() => controller.abort(), timeout)

	const config: Record<string, any> = {
		method,
		headers: { ...defaultHeaders, ...headers },
		signal: controller.signal
	}
	if (body) {
		if (method === 'POST' || method === 'PUT') {
			config.body = JSON.stringify(body)
		}
		if (method === 'GET' || method === 'DELETE') {
			url += '?'
			Object.entries(body).forEach(([k, v]: [string, any]) => {
				url += `${k}=${v}&`
			})
		}
	}
	try {
		const response: Response = await fetch(url, config)
		clearTimeout(timeoutId)
		if (!response.ok) {
			let errorData
			try {
				errorData = await response.json()
			} catch {
				errorData = { error: `API请求失败: ${response.status} ${response.statusText}` }
			}
			throw new Error(errorData.error?.message || errorData.error || 'API请求失败')
		}
		return response
	} catch (error: any) {
		clearTimeout(timeoutId)
		console.error(`API请求错误 (${url}):`, error)
		throw new Error(`网络请求失败: ${error.message}`)
	}
}

/**
 * SSE 流式请求
 * @param url
 * @param options
 */
export async function fetchSSE(url: string, options: Record<string, any> = {}): Promise<any> {
	let { headers = {}, req = {}, controller, timeout = 30000, onMessage } = options
	const defaultHeaders = {
		'Content-Type': 'application/json'
	}
	if (!controller) {
		controller = new AbortController()
	}
	const timeoutId = setTimeout(() => controller.abort(), timeout)
	try {
		return fetch(url, {
			method: 'POST',
			headers: { ...defaultHeaders, ...headers },
			body: JSON.stringify(req),
			signal: controller.signal
		})
			.then(async (response: any) => {
				clearTimeout(timeoutId)
				if (!response.ok) {
					throw new Error(`SSE API error: ${response.status} - ${response?.statusText || 'Unknown error'}`)
				}
				// 处理流式响应
				const reader = response.body.getReader()
				const decoder = new TextDecoder('utf-8')
				while (true) {
					const { value, done } = await reader.read()
					if (done) {
						break
					}
					const chunk = decoder.decode(value)
					const lines = chunk.split('\n\n').filter(Boolean)
					for (const line of lines) {
						onMessage(line)
					}
				}
			})
			.catch((e: any) => {
				if (e.type === 'aborted') {
					throw new Error('\n\n====用户取消请求====')
				} else {
					throw new Error(e)
				}
			})
	} catch (e: any) {
		clearTimeout(timeoutId)
		console.warn(e.message)
	}
}
