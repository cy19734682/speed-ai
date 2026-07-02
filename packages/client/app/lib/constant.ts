import { DeepSeekIcon, ThinkIcon } from '@/app/styles/SvgIcon'

/**
 * mcp工具状态的存储键名
 */
export const MCP_STORE_KEY = 'mcp-storage'
/**
 * 对话状态的存储键名
 */
export const CHAT_STORE_KEY = 'chat-storage'
/**
 * 助手状态的存储键名
 */
export const CHAT_ASSISTANT_STORE_KEY = 'chat-assistant-storage'

/**
 * 联网搜索工具的存储键名
 */
export const WEB_SEARCH_KEY = 'web_search'

/**
 * 数据库名称
 */
export const DB_NAME_KEY = 'ChatDB'
/**
 * 数据库版本
 */
export const DB_VERSION_KEY = 1
/**
 * 对话列表存储键名
 */
export const CHAT_LIST_STORE_KEY = 'chatList'
/**
 * 对话详情存储键名
 */
export const CHAT_DETAIL_STORE_KEY = 'chatHistory'
/**
 * 本地知识库存储键名
 */
export const LOCAL_KNOWLEDGE_STORE_KEY = 'localKnowledge'

/**
 * 模型列表
 */
export const models = [
	{
		name: '快速模式',
		value: 'deepseek-v4-flash',
		icon: DeepSeekIcon,
		isThink: false,
		description: '快捷高效的经济之选'
	},
	{
		name: '专家模式',
		value: 'deepseek-v4-pro',
		icon: ThinkIcon,
		isThink: true,
		description: '性能比肩顶级闭源模型'
	}
]