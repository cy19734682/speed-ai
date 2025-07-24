import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import goodsServer from './goods'
import fileServer from './file'

export const server = new McpServer({
  name: "mcp-sse-demo",
  version: "1.0.0",
  description: "MCP模拟数据工具",
});

const tools = [ ...goodsServer, ...fileServer]

tools.forEach((item:any) => {
  const {tool, handler} = item
  server.tool(tool.name, tool.description, tool.paramsSchema, async (params: any): Promise<any> => {
    try {
      const ret = await handler(params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(ret),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: error.message }),
          },
        ],
      };
    }
  })
})