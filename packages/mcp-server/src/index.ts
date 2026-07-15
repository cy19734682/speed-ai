import express, { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'node:crypto'
import cron from 'node-cron'
import cors from 'cors'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { createServer as createDemoServer } from './services/demo'
import { createServer as createAmapServer } from './services/amap'
import { createServer as createSearchServer } from './services/search'
import { config } from './config'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

app.use(cors(config.server.cors))
app.use(express.json())

// 存储活跃传输对象（按 sessionId 索引）
interface TransportEntry {
	transport: StreamableHTTPServerTransport
	lastActiveAt: number
}
const transports: Map<string, TransportEntry> = new Map()

// 会话超时时间（5分钟）
const SESSION_TIMEOUT = 5 * 60 * 1000

// MCP 服务工厂函数映射（每次会话创建新实例）
const serverFactories: Map<string, () => McpServer> = new Map()
serverFactories.set('demo', createDemoServer)
serverFactories.set('amap', createAmapServer)
serverFactories.set('search', createSearchServer)

/**
 * 定时清理超时会话
 */
cron.schedule('*/5 * * * *', () => {
	const now = Date.now()
	console.log(`[定时任务执行 - ${new Date().toISOString()}] 存活会话 (${transports.size}个)`)

	for (const [sessionId, entry] of transports.entries()) {
		const inactiveTime = now - entry.lastActiveAt
		if (inactiveTime > SESSION_TIMEOUT) {
			console.log(
				`[${new Date().toISOString()}] 会话超时，清理: ${sessionId} (未活动 ${Math.round(inactiveTime / 1000 / 60)} 分钟)`
			)
			entry.transport.close().catch(() => {})
			transports.delete(sessionId)
		} else {
			console.log(`[${new Date().toISOString()}] 会话正常: ${sessionId} (未活动 ${Math.round(inactiveTime / 1000)} 秒)`)
		}
	}
})

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'ok',
		version: '1.0.0',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		activeSessions: transports.size
	})
})

/**
 * POST 端点 - 处理 MCP 请求
 */
app.post('/mcp/:service', async (req, res) => {
	const { service } = req.params
	const sessionId = req.headers['mcp-session-id'] as string | undefined

	if (sessionId) {
		console.log(`[${new Date().toISOString()}] 收到 MCP 请求 (service=${service}, session=${sessionId})`)
	} else {
		console.log(`[${new Date().toISOString()}] 收到 MCP 初始化请求 (service=${service})`)
	}

	// 验证服务是否存在
	const createServer = serverFactories.get(service)
	if (!createServer) {
		res.status(404).json({
			jsonrpc: '2.0',
			error: { code: -32601, message: `Service '${service}' not found` },
			id: null
		})
		return
	}

	// 认证检查
	const { authorization } = req.headers
	if (process.env.ACCESS_TOKEN && authorization !== `Bearer ${process.env.ACCESS_TOKEN}`) {
		res.status(401).json({ error: 'Unauthorized' })
		return
	}

	try {
		let transport: StreamableHTTPServerTransport

		if (sessionId && transports.has(sessionId)) {
			// 复用已存在的传输对象
			const entry = transports.get(sessionId)!
			transport = entry.transport
			entry.lastActiveAt = Date.now()
			console.log(`[${new Date().toISOString()}] 复用已有会话: ${sessionId}`)
		} else if (!sessionId && isInitializeRequest(req.body)) {
			// 新的初始化请求 - 创建新的 MCP Server 实例
			const mcpServer = createServer()

			transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (sid) => {
					console.log(`[${new Date().toISOString()}] 会话初始化完成: ${sid}`)
					transports.set(sid, {
						transport,
						lastActiveAt: Date.now()
					})
				}
			})

			// 会话关闭时清理
			transport.onclose = () => {
				const sid = transport.sessionId
				if (sid && transports.has(sid)) {
					console.log(`[${new Date().toISOString()}] 会话关闭，清理资源: ${sid}`)
					transports.delete(sid)
				}
			}

			// 连接传输对象到 MCP 服务器
			await mcpServer.connect(transport)
			await transport.handleRequest(req, res, req.body)
			return
		} else {
			// 无效请求
			res.status(400).json({
				jsonrpc: '2.0',
				error: {
					code: -32000,
					message: 'Bad Request: No valid session ID provided'
				},
				id: null
			})
			return
		}

		// 处理已有会话的请求
		const entry = transports.get(sessionId)!
		entry.lastActiveAt = Date.now()
		await entry.transport.handleRequest(req, res, req.body)
	} catch (error: any) {
		console.error(`[${new Date().toISOString()}] 处理 MCP 请求失败:`, error)
		if (!res.headersSent) {
			res.status(500).json({
				jsonrpc: '2.0',
				error: { code: -32603, message: 'Internal server error' },
				id: null
			})
		}
	}
})

/**
 * GET 端点 - 支持 SSE 流式响应（用于服务器推送通知）
 */
app.get('/mcp/:service', async (req, res) => {
	const { service } = req.params
	const sessionId = req.headers['mcp-session-id'] as string | undefined

	if (!sessionId || !transports.has(sessionId)) {
		res.status(400).send('Invalid or missing session ID')
		return
	}

	console.log(`[${new Date().toISOString()}] 建立 SSE 流 (service=${service}, session=${sessionId})`)

	const lastEventId = req.headers['last-event-id']
	if (lastEventId) {
		console.log(`客户端重连，Last-Event-ID: ${lastEventId}`)
	}

	const entry = transports.get(sessionId)!
	entry.lastActiveAt = Date.now()
	await entry.transport.handleRequest(req, res)
})

/**
 * DELETE 端点 - 会话终止
 */
app.delete('/mcp/:service', async (req, res) => {
	const { service } = req.params
	const sessionId = req.headers['mcp-session-id'] as string | undefined

	if (!sessionId || !transports.has(sessionId)) {
		res.status(400).send('Invalid or missing session ID')
		return
	}

	console.log(`[${new Date().toISOString()}] 会话终止请求 (service=${service}, session=${sessionId})`)

	try {
		const entry = transports.get(sessionId)!
		entry.lastActiveAt = Date.now()
		await entry.transport.handleRequest(req, res)
	} catch (error: any) {
		console.error('处理会话终止失败:', error)
		if (!res.headersSent) {
			res.status(500).send('Error processing session termination')
		}
	}
})

/**
 * 错误处理
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(`[${new Date().toISOString()}] 未处理的异常:`, err)
	res.status(500).json({ error: '服务器内部错误' })
})

/**
 * 优雅关闭所有连接
 */
async function closeAllConnections() {
	console.log(`[${new Date().toISOString()}] 关闭所有会话 (${transports.size}个)`)
	for (const [id, entry] of transports.entries()) {
		try {
			await entry.transport.close()
			console.log(`[${new Date().toISOString()}] 已关闭会话: ${id}`)
		} catch (error) {
			console.error(`[${new Date().toISOString()}] 关闭会话失败: ${id}`, error)
		}
	}
	transports.clear()
}

/**
 * 优雅关闭
 */
process.on('SIGTERM', async () => {
	console.log(`[${new Date().toISOString()}] 接收到 SIGTERM 信号，准备关闭`)
	await closeAllConnections()
	server.close(() => {
		console.log(`[${new Date().toISOString()}] 服务器已关闭`)
		process.exit(0)
	})
})

process.on('SIGINT', async () => {
	console.log(`[${new Date().toISOString()}] 接收到 SIGINT 信号，准备关闭`)
	await closeAllConnections()
	process.exit(0)
})

// 启动服务器
const port = config.server.port
const server = app.listen(port, () => {
	console.log(`[${new Date().toISOString()}] MCP Streamable HTTP 服务器已启动`)
	console.log(`- 服务端点: http://localhost:${port}/mcp/{service}`)
	console.log(`- 可用服务: demo, amap, search`)
	console.log(`- POST 请求示例: http://localhost:${port}/mcp/demo`)
})
