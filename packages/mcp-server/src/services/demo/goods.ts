import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

export const server = new McpServer({
  name: "mcp-server-sse",
  version: "1.0.0",
  description: "MCP工具",
});

const PRODUCTS: any[] = [
  {
    id: 1,
    name: "智能手表Galaxy",
    price: 1299,
    description: "健康监测，运动追踪，支持多种应用",
  },
  {
    id: 2,
    name: "无线蓝牙耳机Pro",
    price: 899,
    description: "主动降噪，30小时续航，IPX7防水",
  },
  {
    id: 3,
    name: "便携式移动电源",
    price: 299,
    description: "20000mAh大容量，支持快充，轻薄设计",
  },
  {
    id: 4,
    name: "华为MateBook X Pro",
    price: 1599,
    description: "14.2英寸全面屏，3:2比例，100% sRGB色域",
  },
];

const INVENTORY: any[] = [
  {
    productId: 1,
    quantity: 100,
  },
  {
    productId: 2,
    quantity: 50,
  },
  {
    productId: 3,
    quantity: 200,
  },
  {
    productId: 4,
    quantity: 150,
  },
];

const GET_PRODUCTS = {
  name: "get_products",
  description: "获取所有产品信息",
  paramsSchema: {}
};
const GET_INVENTORY = {
  name: "get_inventory",
  description: "获取所有产品的库存信息",
  paramsSchema: {}
};
/**
 * 获取所有产品信息
 */
const handleGetProducts = async () => {
  return PRODUCTS
};
/**
 * 获取所有库存信息
 */
const handleGetInventory = async () => {
  return INVENTORY.map((item: any) => {
    const product = PRODUCTS.find((p: any) => p.id === item.productId);
    return {
      ...item,
      product,
    };
  })
};

const GOODS_TOOLS = [
  {
    tool: GET_PRODUCTS,
    handler: async () => {
      return await handleGetProducts();
    }
  },
  {
    tool: GET_INVENTORY,
    handler: async () => {
      return await handleGetInventory();
    }
  }
]

export default GOODS_TOOLS