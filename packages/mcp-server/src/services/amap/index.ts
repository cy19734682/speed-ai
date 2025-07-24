import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import amapServer from './amap'

export const server = new McpServer({
	name: 'mcp-sse-amap',
	version: '1.0.0',
	description: 'MCP高德地图工具'
})

amapServer.forEach((item: any) => {
	const { tool, handler } = item
	server.tool(tool.name, tool.description, tool.paramsSchema, async (params: any): Promise<any> => {
		try {
			const ret = await handler(params)
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(ret)
					}
				]
			}
		} catch (error: any) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({ error: error.message })
					}
				]
			}
		}
	})
})
