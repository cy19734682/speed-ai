import { Client as McpClient } from '@modelcontextprotocol/sdk/client'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp'
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

// ───── 辅助函数：构造传输选项 ───────────────────────────────────────────
function buildTransportOptions(transportConfig: Record<string, any>): any {
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

// ───── 主入口：初始化 MCP 客户端 ──────────────────────────────────
export async function initMcpClient(transportConfig: Record<string, any>): Promise<{
	mcpClient: McpClient
	mcpTools: Tool[]
}> {
	const url = (transportConfig.url || '').toString().trim()
	if (!url) throw new Error('[MCP] URL 不能为空')

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

	const options = buildTransportOptions(transportConfig)
	const targetUrl = new URL(url)

	try {
		const mcpClient = new McpClient({ name: 'speed-ai', version: '0.1.0' })
		const transport = new StreamableHTTPClientTransport(targetUrl, options)
		console.log(`[MCP] 尝试连接 → ${url}`)

		await mcpClient.connect(transport)
		const { tools } = await mcpClient.listTools()
		const mcpTools: Tool[] = tools.map((tool: any) => ({
			name: tool.name,
			description: tool.description || '',
			input_schema: tool.inputSchema || {}
		}))

		console.log(`[MCP] ✅ 连接成功，工具数量: ${mcpTools.length}`)
		return { mcpClient, mcpTools }
	} catch (e) {
		const errMsg = (e as Error)?.message || String(e) || '未知错误'
		console.warn(`[MCP] ❌ 连接失败: ${errMsg}`)

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
	const key = 'mcp_tools_' + params.url
	const cachedTools = getFromCache<Tool[]>(key)
	if (cachedTools && Array.isArray(cachedTools) && cachedTools.length > 0) return cachedTools

	let toolClient: McpClient | null = null
	try {
		const { mcpClient, mcpTools } = await initMcpClient({ ...params })
		toolClient = mcpClient
		addToCache(key, mcpTools)
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
