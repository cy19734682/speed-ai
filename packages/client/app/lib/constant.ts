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
 * 模型列表
 */
export const models = [
	{
		name: 'DeepSeek-Chat',
		value: 'deepseek-chat',
		icon: DeepSeekIcon,
		isThink: false,
		description: '通用模型，响应速度快'
	},
	{
		name: 'DeepSeek-Reasoner',
		value: 'deepseek-reasoner',
		icon: ThinkIcon,
		isThink: true,
		description: '推理模型，复杂问题解决'
	}
]


/**
 * 联网搜索工具的存储键名
 */
export const WEB_SEARCH_KEY = 'web_search'
