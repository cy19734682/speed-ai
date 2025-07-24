// 对话状态管理
export interface ChatStore {
	// 对话设置
	setting: ChatSettingIcon
	// 对话消息列表
	messages: ChatMessages[]
	// 当前对话ID
	currentChatId: string | null
	// 当前AI助手ID(不需要持久化)
  currentRoleId: string | null
	// 更新对话设置
	updateSetting: (prefs: Partial<ChatStore['setting']>) => void
	// 添加消息
	addMessage: (newItem: ChatMessages) => void
	// 移除消息
	removeMessage: (chatId: string) => void
	// 更新消息标题
	updateMessageTitle: (chatId: string, title: string) => void
	// 移动消息位置
	moveMessage: (fromIndex: number, toIndex: number) => void
	// 添加子消息
	addMessageChild: (chatId: string, item: ChatMessages) => void
	// 更新子消息
	updateMessageChild: (chatId: string, item: ChatMessages) => void
	// 重置消息
	resetMessages: () => void
	// 创建新的聊天ID
	createCurrentChatId: () => void
	// 更新聊天ID
	updateCurrentChatId: (chatId: string) => void
	// 更新角色ID
  updateCurrentRoleId: (roleId: string) => void
}

// MCP状态管理
export interface McpStore {
  searchTool: McpTool
	tools: McpTool[]
	addTool: (newItem: McpTool) => void
	removeTool: (id: string) => void
	updateTool: (id: string, item: McpTool) => void
  updateAllTool: (items: McpTool[]) => void
	resetTool: () => void
  updateSearchTool: (newItem: McpTool) => void
}

// AI对话角色状态管理
export interface ChatAssistantStore {
  assistants: Assistant[]
	addAssistant: (newItem: Assistant) => void
	removeAssistant: (id: string) => void
	updateAssistant: (id: string, item: Assistant) => void
	resetAssistant: () => void
}

// 对话设置
export interface ChatSettingIcon {
  model: string
  temperature: number
  maxTokens: number
  [x: string]: any
}

// 对话详情
export interface ChatDetail {
	chatId: string
	role: 'user' | 'assistant' | 'system'
	createdAt: string
	content: string
	thinkContent?: string
	thinkTime?: string
	searchData?: {
    type: string,
    toolName: string,
    content: any[]
  }
	tools?: any[]
	[x: string]: any
}

// 全部对话
export interface ChatMessages {
	chatId: string
	createdAt: string
	title: string
	isAutoTitle: boolean
	list: ChatDetail[]
	[x: string]: any
}

// MCP工具
export interface McpTool {
	id: string
	code: string
	name: string
	url: string
	tag: string
  description: string
	accessToken: string
  enabled: boolean
	[x: string]: any
}

// AI助手
export interface Assistant {
	id: string
	name: string
  prompt: string
	[x: string]: any
}

// 工具类型
export interface Tool {
  name: string
  description: string
  input_schema: any;
}

export interface DeepSeekTool {
	type: 'function'
	function: Tool
}

// 定义消息类型(DeepSeek官方)
export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
	model: string
	messages: Message[]
	tools?: DeepSeekTool[]
	max_tokens?: number
	temperature?: number
	top_p?: number
	stream?: boolean
	onProgress?: (delta: string) => void
}

export interface TextContent {
	type: 'text'
	text: string
}

export interface ToolUseContent {
	type: 'tool_use'
	name: string
	input: any
}

export interface ChatCompletionResponse {
	id: string
	model: string
	content: (TextContent | ToolUseContent)[]
}

export type DeepSeekClient = {
	messages: {
		create: (options: ChatCompletionOptions) => Promise<ChatCompletionResponse>
	}
}

// 定义工具调用类型
export type ToolCall = {
	function: {
		name: string
		arguments: string
	}
}

// 定义DeepSeek响应的类型
export type DeepSeekResponse = {
	id: string
	choices: Array<{
		message: {
			content: string
			tool_calls?: ToolCall[]
		}
	}>
}


// 菜单类型
export interface MenuItem {
	id: number
	text: string
	action: () => void
	type?: 'normal' | 'edit' | 'delete' // 增加类型，可选
}
