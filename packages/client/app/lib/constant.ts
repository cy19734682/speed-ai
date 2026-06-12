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


/**
 * 联网搜索工具的存储键名
 */
export const WEB_SEARCH_KEY = 'web_search'
