import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ChatStore, ChatMessages, ChatDetail } from '@/app/lib/type'
import { UUID } from '@/app/lib/util'
import { CHAT_STORE_KEY } from '@/app/lib/constant'

/**
 * 定义默认的状态
 **/
const defaultState = {
	setting: {
		model: 'deepseek-chat',
		temperature: 0.8,
		maxTokens: 2048
	},
	messages: [],
	currentChatId: null,
	// 当前角色ID(不需要持久化)
	currentRoleId: null
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
		(set) => ({
			// 初始化数据
			...initialState(),
			// 更新设置
			updateSetting: (prefs) =>
				// 使用函数式更新，获取当前状态并合并新的偏好设置
				set((state) => ({
					setting: { ...state.setting, ...prefs }
				})),
			// 创建当前聊天ID
			createCurrentChatId: () => {
				// 生成唯一ID
				const newId = UUID()
				set({ currentChatId: newId, currentRoleId: null })
			},
			// 更新当前聊天ID
			updateCurrentChatId: (chatId: string) => {
				set({ currentChatId: chatId, currentRoleId: null })
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
			addMessage: (newMessage: ChatMessages) => {
				set((state) => ({
					messages: [{ ...newMessage }, ...state.messages]
				}))
			},
			// 删除消息
			removeMessage: (id: string) => {
				set((state) => ({
					messages: state.messages.filter((item) => item.chatId !== id)
				}))
			},
			// 更新消息标题
			updateMessageTitle: (id: string, title: string) => {
				set((state) => ({
					messages: state.messages.map((e) => (e.chatId === id ? { ...e, title, isAutoTitle: true } : e))
				}))
			},
			// 移动消息位置
			moveMessage: (fromIndex: number, toIndex: number) => {
				set((state) => {
					const newItems = [...state.messages]
					const [movedItem] = newItems.splice(fromIndex, 1)
					newItems.splice(toIndex, 0, movedItem)
					return { messages: newItems }
				})
			},
			// 清除全部消息
			resetMessages: () => set({ messages: [] }),
			// 添加子消息
			addMessageChild: (chatId: string, item: ChatDetail) => {
				set((state) => {
					return {
						messages: state.messages.map((team) =>
							team.chatId === chatId
								? {
										...team,
										list: [...team.list, { ...item }]
									}
								: team
						)
					}
				})
			},
			// 更新子消息(只会更新最后一条)
			updateMessageChild: (chatId: string, item: ChatDetail) => {
				set((state) => {
					return {
						messages: state.messages.map((team) =>
							team.chatId === chatId
								? {
										...team,
										list: [...team.list.slice(0, -1), { ...team.list[team.list.length - 1], ...item }]
									}
								: team
						)
					}
				})
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
				messages: state.messages,
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
