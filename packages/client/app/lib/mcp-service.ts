import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { Tool, McpTool } from './type'

// 缓存过期时间（毫秒）
const CACHE_EXPIRY = 5 * 60 * 1000 // 5分钟

// 连接状态
let isConnecting = false
// 连接重试计数
let lastConnectionAttempt = 0
// 连接重试计数
let connectionRetryCount = 0

// 缓存
interface CacheItem<T> {
	data: T
	timestamp: number
}

const cache: {
	[key: string]: CacheItem<any>
} = {}

/**
 * 初始化 MCP 客户端
 * 添加了连接重试逻辑和错误处理
 */
export async function initMcpClient(transportConfig: Record<string, any>) {
	// 单例实例
	let mcpClient: McpClient | null = null
	lastConnectionAttempt = 0
	connectionRetryCount = 0
	// 防止并发初始化
	if (isConnecting) {
		console.log('已有连接正在进行中，等待...')
		// 等待当前连接尝试完成
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	// 连接冷却时间检查（避免频繁重连）
	const now = Date.now()
	if (now - lastConnectionAttempt < 2000 && connectionRetryCount > 0) {
		console.log('连接尝试过于频繁，稍后重试')
		throw new Error('连接尝试过于频繁，请稍后重试')
	}

	isConnecting = true
	lastConnectionAttempt = now
	connectionRetryCount++

	try {
		console.log(`正在连接到 MCP 服务器 (尝试 #${connectionRetryCount})...`)
		mcpClient = new McpClient({
			name: 'mcp-client',
			version: '0.1.0'
		})
		let options = {}
		if (transportConfig.accessToken) {
			options = {
				authProvider: {
					tokens: async (): Promise<any> => {
						return new Promise<string>((resolve, reject) => {
							// @ts-ignore
							resolve({ access_token: transportConfig.accessToken })
						})
					},
					clientInformation: async (): Promise<any> => {
						return new Promise<string>((resolve, reject) => {
							// @ts-ignore
							reject('ACCESS_TOKEN Unauthorized')
						})
					}
				}
			}
		}
		const transport = new SSEClientTransport(new URL(transportConfig.url), options)
		await mcpClient.connect(transport)
		// 获取可用工具
		const { tools } = await mcpClient.listTools()
		// 转换为我们的工具格式
		const mcpTools: Tool[] = tools.map((tool: any) => ({
			name: tool.name,
			description: tool.description || '',
			input_schema: tool.inputSchema || {}
		}))

		// 重置重试计数
		connectionRetryCount = 0
		console.log('MCP 客户端和工具初始化成功')
		return { mcpClient, mcpTools }
	} catch (error: any) {
		console.error(`初始化 MCP 客户端失败 (尝试 #${connectionRetryCount}):`, error)
		// 关闭连接
		mcpClient?.close()
		mcpClient = null
		if (error?.code === 401) {
			error.message = 'ACCESS_TOKEN Unauthorized'
		}
		throw error
	} finally {
		isConnecting = false
	}
}

/**
 * 获取可用工具
 * 添加了缓存
 */
export async function getTools(params: McpTool) {
	const key = 'mcp_tools_' + params.url
	// 检查缓存
	const cachedTools = getFromCache(key)
	if (cachedTools && Array.isArray(cachedTools) && cachedTools.length > 0) {
		return cachedTools
	}
  let toolClient = null
	try {
		const { mcpClient, mcpTools } = await initMcpClient({ ...params })
    toolClient = mcpClient
		// 缓存工具列表
		addToCache(key, mcpTools)
		return mcpTools
	} catch (error) {
		console.error('获取工具失败:', error)
		throw error
	} finally {
    await toolClient?.close()
    toolClient = null
  }
}

/**
 * 从缓存中获取数据
 */
function getFromCache<T>(key: string): T | null {
	const item = cache[key]
	if (!item) return null

	// 检查缓存是否过期
	if (Date.now() - item.timestamp > CACHE_EXPIRY) {
		delete cache[key]
		return null
	}

	return item.data
}

/**
 * 添加数据到缓存
 */
function addToCache<T>(key: string, data: T): void {
	cache[key] = {
		data,
		timestamp: Date.now()
	}
}
