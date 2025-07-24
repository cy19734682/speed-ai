import express, { Request, Response, NextFunction } from 'express'
import cron from 'node-cron'
import cors from 'cors'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { server as demoServer } from './services/demo' // 模拟数据
import { server as amapServer } from './services/amap' // 高德地图
import { server as searchServer } from './services/search' // 联网搜索
import { config } from './config'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

// 创建 Express 路由处理器
const router = express.Router()

app.use(cors(config.server.cors))

// 连接保存时间
const DEFAULT_TTL = 5 * 60 * 1000;
// 存储活跃连接
const connections = new Map()

/**
 * 定时清理过期连接
 **/
cron.schedule('*/5 * * * *', () => {
  console.log(`[定时任务执行 - ${new Date().toISOString()}] 存活连接 (${connections.size}个)`)
  for (const [sessionId, transport] of connections.entries()) {
    if (transport.expiresAt && Date.now() > transport.expiresAt) {
      console.log(`[${new Date().toISOString()}] 清理过期连接: ${sessionId}`)
      connections.delete(sessionId)
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
		connections: connections.size
	})
})

/**
 * 服务注册函数（处理SSE连接和消息路由）
 * @param service
 * @param path
 */
const registerMcpService = (service: McpServer, path: string) => {
	// SSE 传输端点 (GET)
	router.get(`/${path}/sse`, async (req, res) => {
    const {authorization} = req.headers
    if (process.env.ACCESS_TOKEN && authorization !== `Bearer ${process.env.ACCESS_TOKEN}`) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    // 实例化SSE传输对象
		const transport: any = new SSEServerTransport(`/mcp/${path}/messages`, res)
		// 获取sessionId
		const sessionId = transport.sessionId
		console.log(`[${new Date().toISOString()}] 新的SSE(${path})连接建立: ${sessionId}`)
    transport.expiresAt = Date.now() + DEFAULT_TTL
		// 注册连接
		connections.set(sessionId, transport)
		// 连接中断处理
		req.on('close', () => {
			console.log(`[${new Date().toISOString()}] SSE(${path})连接关闭: ${sessionId}`)
			connections.delete(sessionId)
		})
		// 将传输对象与MCP服务器连接
		await service.connect(transport)
		console.log(`[${new Date().toISOString()}] MCP(${path})服务器连接成功: ${sessionId}`)
	})

	// 消息接收端点 (POST)
	router.post(`/${path}/messages`, async (req, res) => {
		try {
			console.log(`[${new Date().toISOString()}] 收到客户端(${path})消息:`, req.query)
			const sessionId = req.query.sessionId as string
			// 查找对应的SSE连接并处理消息
			if (connections.size > 0) {
				// 获取第一个可用的传输对象（在生产环境中应该使用更精确的匹配机制）
				const transport: SSEServerTransport = connections.get(sessionId) as SSEServerTransport
				// 使用transport处理消息
				if (transport) {
					await transport.handlePostMessage(req, res)
				} else {
					throw new Error('没有活跃的SSE连接')
				}
			} else {
				throw new Error('没有活跃的SSE连接')
			}
		} catch (error: any) {
			res.status(500).json({ error: '处理消息失败', message: error.message })
		}
	})
}

/**
 * 注册服务路由
 */
registerMcpService(demoServer, 'demo')
registerMcpService(amapServer, 'amap')
registerMcpService(searchServer, 'search')

/**
 * 挂载路由
 */
app.use('/mcp', router)


/**
 * 优雅关闭所有连接
 */
async function closeAllConnections() {
	console.log(`[${new Date().toISOString()}] 关闭所有连接 (${connections.size}个)`)
	for (const [id, transport] of connections.entries()) {
		try {
			// 发送关闭事件
			transport.res.write('event: server_shutdown\ndata: {"reason": "Server is shutting down"}\n\n')
			transport.res.end()
			console.log(`[${new Date().toISOString()}] 已关闭连接: ${id}`)
		} catch (error) {
			console.error(`[${new Date().toISOString()}] 关闭连接失败: ${id}`, error)
		}
	}
	connections.clear()
}

/**
 * 错误处理
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(`[${new Date().toISOString()}] 未处理的异常:`, err)
	res.status(500).json({ error: '服务器内部错误' })
})

/**
 * 优雅关闭
 */
process.on('SIGTERM', async () => {
	console.log(`[${new Date().toISOString()}] 接收到SIGTERM信号，准备关闭`)
	await closeAllConnections()
	server.close(() => {
		console.log(`[${new Date().toISOString()}] 服务器已关闭`)
		process.exit(0)
	})
})

process.on('SIGINT', async () => {
	console.log(`[${new Date().toISOString()}] 接收到SIGINT信号，准备关闭`)
	await closeAllConnections()
	process.exit(0)
})

// 启动服务器
const port = config.server.port
const server = app.listen(port, () => {
	console.log(`[${new Date().toISOString()}] MCP SSE 服务器已启动，地址: http://localhost:${port}`)
  console.log(`- SSE 连接端点: http://localhost:${port}/mcp/xxx/sse`);
})
