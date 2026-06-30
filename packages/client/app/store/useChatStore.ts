import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ChatStore, ChatMessages, ChatDetail } from '@/app/lib/type'
import { UUID } from '@/app/lib/util'
import { config } from '@/app/lib/config'
import { CHAT_STORE_KEY } from '@/app/lib/constant'
import {
	getChatList,
	addChat,
	removeChat,
	updateChatTitle,
	saveChatChild,
	resetChat,
	getChatChildList
} from '@/app/lib/indexedDB'

/**
 * 定义默认的状态
 **/
const defaultState = {
	setting: {
		model: config.ds.defaultModel,
		temperature: 0.8,
		maxTokens: 2048
	},
	messages: [],
	historys: [],
	webSearch: false,
	thinking: false,
	knowledge: false,
	currentChatId: null,
	// 当前角色ID(不需要持久化)
	currentRoleId: null,
	// 当前对话数据(不需要持久化)
	currentChatData: null
}

/**
 * 初始化获取本地存储的状态（只考虑客户端）
 */
const initialState = () => {
	if (typeof window !== 'undefined') {
		const chatStore = localStorage.getItem(CHAT_STORE_KEY)
		if (chatStore) {
			return JSON.parse(chatStore || '{}')?.state || {}
		}
	}
	return defaultState
}

/**
 * 对话相关管理，包含对话设置，消息列表，当前对话ID等
 */
export const useChatStore: any = create<ChatStore>()(
	// 使用 persist 中间件实现状态持久化
	persist(
		// store 的初始状态和状态更新方法
		(set, get) => ({
			// 初始化数据
			...initialState(),
			// 更新设置
			updateSetting: (prefs) =>
				// 使用函数式更新，获取当前状态并合并新的偏好设置
				set({
					setting: { ...get().setting, ...prefs }
				}),
			// 更新联网搜索
			updateWebSearch: (webSearch: boolean) => set({ webSearch }),
			// 更新深度思考
			updateThinking: (thinking: boolean) => set({ thinking }),
			// 更新知识库开关
			updateKnowledge: (knowledge: boolean) => set({ knowledge }),
			// 创建当前聊天ID
			createCurrentChatId: () => {
				// 生成唯一ID
				const newId = UUID()
				set({ currentChatId: newId, currentRoleId: null, currentChatData: null, historys: [] })
			},
			// 更新当前聊天ID
			updateCurrentChatId: async (chatId: string) => {
				const historys = (await getChatChildList(chatId)) || []
				set({
					currentChatId: chatId,
					currentRoleId: null,
					currentChatData: get().messages.find((item) => item.chatId === chatId) || null,
					historys
				})
			},
			// 更新当前角色ID
			updateCurrentRoleId: (roleId: string) => {
				const updateData: Record<string, any> = {
					currentRoleId: roleId
				}
				// 当角色ID不为空时，则需要清空当前对话并新建对话
				if (roleId) {
					updateData.currentChatId = UUID()
				}
				set(updateData)
			},
			// 添加新消息
			addMessage: async (newMessage: ChatMessages) => {
				set({
					messages: [{ ...newMessage }, ...get().messages]
				})
				await addChat(newMessage, newMessage.chatId)
			},
			// 删除消息
			removeMessage: async (id: string) => {
				set({
					currentChatData: id === get().currentChatId ? null : get().currentChatData,
					messages: get().messages.filter((item) => item.chatId !== id),
					historys: id === get().currentChatId ? [] : get().historys || []
				})
				await removeChat(id)
				if (id === get().currentChatId) {
					get().createCurrentChatId()
					get().updateCurrentRoleId('')
				}
			},
			// 更新消息标题
			updateMessageTitle: async (id: string, title: string, isPersist: boolean = false) => {
				set((state) => ({
					messages: state.messages.map((e) => (e.chatId === id ? { ...e, title, isAutoTitle: true } : e))
				}))
				if (isPersist) {
					await updateChatTitle(id, title)
				}
			},
			// 添加子消息
			addMessageChild: (item: ChatDetail) => {
				set({
					historys: [...get().historys, item]
				})
			},
			// 更新子消息(只会更新最后一条)
			updateMessageChild: (item: ChatDetail) => {
				const lastItem = get().historys[get().historys.length - 1]
				const newHistorys = [...get().historys.slice(0, -1), { ...lastItem, ...item }]
				set({
					historys: newHistorys
				})
			},
			// 保存子消息持久化
			saveMessageChild: async (chatId: string, item: ChatDetail) => {
				const lastItem = get().historys[get().historys.length - 1]
				const newHistorys = [...get().historys.slice(0, -1), { ...lastItem, ...item }]
				await saveChatChild(chatId, newHistorys)
			},
			// 加载对话
			loadMessages: async () => {
				const messages = (await getChatList()) || []
				const currentChatId = get().currentChatId
				let historys: ChatDetail[] = []
				let currentChatData: ChatMessages | null = null
				if (currentChatId) {
					historys = (await getChatChildList(currentChatId)) || []
					currentChatData = messages.find((item) => item.chatId === currentChatId) || null
				}
				set({
					messages,
					currentChatData,
					historys
				})
				// 如果当前聊天 ID 不在消息列表中，自动创建
				if (!messages.some((item) => item.chatId === currentChatId)) {
					get().createCurrentChatId()
				}
			},
			// 清除全部消息
			resetMessages: () => {
				set({ currentChatId: null, currentRoleId: null, currentChatData: null, messages: [], historys: [] })
				resetChat()
			}
		}),
		{
			// 本地存储的键名，用于在存储中标识该 store 的数据
			name: CHAT_STORE_KEY,
			// 配置存储方式
			storage: createJSONStorage(() => {
				// 3. 服务端安全处理
				// 检查是否在服务端环境（window 对象不存在）
				if (typeof window === 'undefined') {
					// 在服务端返回一个模拟的存储对象，避免使用 localStorage 报错
					return {
						// 获取存储项，返回 null
						getItem: () => Promise.resolve(null),
						// 设置存储项，不做任何操作
						setItem: () => Promise.resolve(),
						// 移除存储项，不做任何操作
						removeItem: () => Promise.resolve()
					}
				}
				// 在客户端使用 localStorage 进行存储
				return localStorage
			}),
			// 指定哪些状态属性需要持久化，排除方法
			partialize: (state) => ({
				setting: state.setting,
				currentChatId: state.currentChatId
			}),
			// 状态迁移函数
			migrate: (persistedState, version) => {
				// 这里可以根据版本号进行状态迁移
				return persistedState
			},
			// 状态版本号，用于状态迁移
			version: 0
		}
	)
)
