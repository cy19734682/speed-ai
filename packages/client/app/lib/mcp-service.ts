import { Client as McpClient } from '@modelcontextprotocol/sdk/client'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio'
import type { Tool, McpTool } from './type'

// ───── 缓存配置 ────────────────────────────────────────────────────────
const CACHE_EXPIRY = 5 * 60 * 1000
interface CacheItem<T> {
	data: T
	timestamp: number
}
const cache: Record<string, CacheItem<any>> = {}

// ───── 连接状态控制 ─────────────────────────────────────────────────────
let isConnecting = false
let lastConnectionAttempt = 0

// ───── 辅助函数：构造 HTTP 传输选项 ───────────────────────────────────────────
function buildHttpTransportOptions(transportConfig: Record<string, any>): any {
	const token = (transportConfig.accessToken || '').toString().trim()
	const useOAuth = transportConfig.useOAuth === true

	const opts: any = {}
	if (!token) return opts

	opts.requestInit = async () => ({
		headers: { Authorization: `Bearer ${token}` }
	})

	if (useOAuth) {
		opts.authProvider = {
			tokens: async () => ({ access_token: token, token_type: 'bearer' }),
			clientInformation: async () => ({
				client_name: 'speed-ai',
				client_uri: 'https://github.com/speed-ai',
				redirect_uris: []
			})
		}
		console.log('[MCP] 已启用 authProvider（OAuth 模式）')
	}

	return opts
}

// ───── 辅助函数：构造 stdio 传输选项 ───────────────────────────────────────────
function buildStdioTransportOptions(transportConfig: Record<string, any>): any {
	const { command, env } = transportConfig

	if (!command) {
		throw new Error('[MCP] stdio 模式必须提供 command 字段')
	}

	// 解析完整命令字符串，分离命令和参数
	const trimmedCommand = command.trim()
	if (!trimmedCommand) {
		throw new Error('[MCP] stdio 模式命令不能为空')
	}

	// 按空格分割命令和参数（支持引号包裹的参数）
	const parts: string[] = []
	let current = ''
	let inQuotes = false
	let quoteChar = ''

	for (let i = 0; i < trimmedCommand.length; i++) {
		const char = trimmedCommand[i]

		if ((char === '"' || char === "'") && !inQuotes) {
			inQuotes = true
			quoteChar = char
		} else if (char === quoteChar && inQuotes) {
			inQuotes = false
			quoteChar = ''
		} else if (char === ' ' && !inQuotes) {
			if (current) {
				parts.push(current)
				current = ''
			}
		} else {
			current += char
		}
	}

	if (current) {
		parts.push(current)
	}

	if (parts.length === 0) {
		throw new Error('[MCP] stdio 模式命令解析失败')
	}

	const executable = parts[0]
	const args = parts.slice(1)

	// 解析环境变量
	let parsedEnv: Record<string, string> = {}
	try {
		parsedEnv = typeof env === 'string' ? JSON.parse(env) : typeof env === 'object' ? env : {}
	} catch (e) {
		console.warn('[MCP] env 解析失败，使用空对象', e)
		parsedEnv = {}
	}

	return {
		command: executable,
		args,
		env: parsedEnv
	}
}

/**
 * 提取请求超时配置，未设置时使用默认值 60000ms (60秒)
 * 注意：SDK 默认超时也是 60 秒，此函数允许覆盖
 */
function getRequestTimeout(transportConfig: Record<string, any>): number {
	return Number(transportConfig.requestTimeout) || 60000
}

/**
 * 生成超时错误的友好提示信息
 */
function buildTimeoutSuggestion(connectionType: string, timeoutSec: number): string {
	if (connectionType === 'stdio') {
		return `当前超时 ${timeoutSec}s，建议：1. 检查 MCP 服务命令是否正确、依赖是否已安装 2. 在配置中将 requestTimeout 调大（如 120000）3. 确认本地进程能正常启动并响应`
	}
	return `当前超时 ${timeoutSec}s，建议：1. 在工具配置中将 requestTimeout 调大（如 120000 = 2分钟）2. 检查 MCP 服务器是否正常响应 3. 检查网络连接及防火墙 4. 确认 URL 为正确的 MCP 端点`
}

// ───── 主入口：初始化 MCP 客户端（支持 streamable-http 和 stdio 两种模式） ──────────────────────────────────
export async function initMcpClient(transportConfig: Record<string, any>): Promise<{
	mcpClient: McpClient
	mcpTools: Tool[]
	requestTimeout: number
}> {
	// 获取连接类型，默认为 streamable-http
	const connectionType = transportConfig.connectionType || 'streamable-http'

	if (isConnecting) {
		console.log('[MCP] 已有连接正在进行中，等待 1 秒...')
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	const now = Date.now()
	if (now - lastConnectionAttempt < 2000) {
		throw new Error('[MCP] 连接尝试过于频繁，请稍后重试')
	}

	isConnecting = true
	lastConnectionAttempt = now

	// 从配置中提取超时时间（毫秒），默认 60 秒
	const requestTimeout = getRequestTimeout(transportConfig)

	// 注意：ProtocolOptions 不支持 requestTimeout，超时必须通过每个请求的 RequestOptions 传递
	const mcpClient = new McpClient({ name: 'speed-ai', version: '0.1.0' })

	try {
		let transport: any

		if (connectionType === 'stdio') {
			// stdio 模式：通过本地进程启动 MCP 服务
			const stdioOptions = buildStdioTransportOptions(transportConfig)
			console.log(`[MCP] 尝试 stdio 连接 → ${stdioOptions.command} ${stdioOptions.args.join(' ')}`)
			transport = new StdioClientTransport(stdioOptions)
		} else {
			// streamable-http 模式：通过 HTTP 远程连接
			const url = (transportConfig.url || '').toString().trim()
			if (!url) throw new Error('[MCP] streamable-http 模式 URL 不能为空')

			const httpOptions = buildHttpTransportOptions(transportConfig)
			const targetUrl = new URL(url)
			console.log(`[MCP] 尝试 streamable-http 连接 → ${url}`)
			transport = new StreamableHTTPClientTransport(targetUrl, httpOptions)
		}

		await mcpClient.connect(transport, { timeout: requestTimeout })

		const { tools } = await mcpClient.listTools(undefined, { timeout: requestTimeout })

		const mcpTools: Tool[] = tools.map((tool: any) => ({
			name: tool.name,
			description: tool.description || '',
			input_schema: tool.inputSchema || {}
		}))

		console.log(`[MCP] ✅ 连接成功，工具数量: ${mcpTools.length}`)
		return { mcpClient, mcpTools, requestTimeout }
	} catch (e) {
		const errMsg = (e as Error)?.message || String(e) || '未知错误'
		console.warn(`[MCP] ❌ 连接失败: ${errMsg}`)

		// 超时错误处理（MCP error -32001: Request timed out）
		if (errMsg.includes('-32001') || errMsg.includes('timed out') || errMsg.includes('timeout')) {
			throw new Error(`[MCP 请求超时] ${errMsg}（${buildTimeoutSuggestion(connectionType, requestTimeout / 1000)}）`)
		}

		// stdio 模式错误处理
		if (connectionType === 'stdio') {
			if (errMsg.includes('ENOENT') || errMsg.includes('not found')) {
				throw new Error(`[MCP stdio 连接失败] 命令未找到，请检查 command 是否正确: ${errMsg}`)
			}
			if (errMsg.includes('EACCES') || errMsg.includes('permission denied')) {
				throw new Error(`[MCP stdio 连接失败] 权限不足，请检查命令执行权限: ${errMsg}`)
			}
			throw new Error(`[MCP stdio 连接失败] ${errMsg}（排查：command / args / env / 依赖是否安装）`)
		}

		// streamable-http 模式错误处理
		if (errMsg.includes('401') || errMsg.includes('403')) {
			throw new Error('[MCP 认证失败] 服务器返回 401/403，请检查 accessToken / 认证方式 / useOAuth')
		}
		if (
			errMsg.includes('<!DOCTYPE') ||
			errMsg.includes('<!doctype') ||
			/<html/i.test(errMsg) ||
			errMsg.includes('404') ||
			errMsg.includes('405')
		) {
			throw new Error(
				'[MCP 端点未找到] 返回 HTML / 404 / 405，请检查 URL 是否为 MCP 端点、服务端是否启动、是否支持 POST'
			)
		}
		throw new Error(`[MCP 连接失败] ${errMsg}（排查：URL / 服务端状态 / 网络 / CORS / accessToken）`)
	} finally {
		isConnecting = false
	}
}

// ───── 工具获取接口（带缓存） ───────────────────────────────────────
export async function getTools(params: McpTool): Promise<Tool[]> {
	// 根据连接类型生成不同的缓存 key
	const connectionType = params.connectionType || 'streamable-http'
	const cacheKey = connectionType === 'stdio' ? `mcp_tools_stdio_${params.command}` : `mcp_tools_${params.url}`

	const cachedTools = getFromCache<Tool[]>(cacheKey)
	if (cachedTools && Array.isArray(cachedTools) && cachedTools.length > 0) return cachedTools

	let toolClient: McpClient | null = null
	try {
		const { mcpClient, mcpTools } = await initMcpClient({ ...params })
		toolClient = mcpClient
		addToCache(cacheKey, mcpTools)
		return mcpTools
	} catch (error) {
		console.error('[MCP] 获取工具失败:', error)
		throw error
	} finally {
		if (toolClient) {
			try {
				await toolClient.close()
			} catch {
				/* ignore */
			}
			toolClient = null
		}
	}
}

// ───── 缓存工具函数 ─────────────────────────────────────────────────
function getFromCache<T>(key: string): T | null {
	const item = cache[key]
	if (!item) return null
	if (Date.now() - item.timestamp > CACHE_EXPIRY) {
		delete cache[key]
		return null
	}
	return item.data
}

function addToCache<T>(key: string, data: T): void {
	cache[key] = { data, timestamp: Date.now() }
}

export function clearToolsCache(url: string): void {
	const key = 'mcp_tools_' + url
	if (cache[key]) {
		delete cache[key]
		console.log(`[MCP] 已清除 ${url} 的工具缓存`)
	}
}

export function clearAllToolsCache(): void {
	Object.keys(cache).forEach((k) => delete cache[k])
	console.log('[MCP] 已清除全部工具缓存')
}
