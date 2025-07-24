import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ChatAssistantStore, Assistant } from '@/app/lib/type'
import { CHAT_ASSISTANT_STORE_KEY } from '@/app/lib/constant'

/**
 * 定义默认的状态
 **/
const defaultState = {
	assistants: [
    {
      id: 'default-assistant',
      name: '👤通用助手',
      prompt: '你是一个专业、友好、乐于助人的小助手，通用问题解答、信息查询和日常对话。'
    }
  ]
}

/**
 * 初始化获取本地存储的状态（只考虑客户端）
 */
const initialState = () => {
	if (typeof window !== 'undefined') {
		const chatStore = localStorage.getItem(CHAT_ASSISTANT_STORE_KEY)
		if (chatStore) {
			return JSON.parse(chatStore || '{}')?.state || {}
		}
	}
	return defaultState
}

/**
 * AI助手状态
 */
export const useChatAssistantStore: any = create<ChatAssistantStore>()(
	// 使用 persist 中间件实现状态持久化
	persist(
		// store 的初始状态和状态更新方法
		(set) => ({
			// 初始化数据
			...initialState(),
			// 添加新助手
			addAssistant: (newItem: Assistant) => {
				set((state) => ({
					assistants: [{ ...newItem }, ...state.assistants]
				}))
			},
			// 删除助手
			removeAssistant: (id: string) => {
				set((state) => ({
					assistants: state.assistants.filter((item) => item.id !== id)
				}))
			}, // 更新助手
			updateAssistant: (id: string, item: Assistant) => {
				set((state) => ({
					assistants: state.assistants.map((e) => (e.id === id ? { ...e, ...item } : e))
				}))
			}, // 重置助手
			resetAssistant: () => {
				set(() => ({
					assistants: []
				}))
			}
		}),
		{
			// 本地存储的键名，用于在存储中标识该 store 的数据
			name: CHAT_ASSISTANT_STORE_KEY, // 配置存储方式
			storage: createJSONStorage(() => {
				// 3. 服务端安全处理
				// 检查是否在服务端环境（window 对象不存在）
				if (typeof window === 'undefined') {
					// 在服务端返回一个模拟的存储对象，避免使用 localStorage 报错
					return {
						// 获取存储项，返回 null
						getItem: () => Promise.resolve(null), // 设置存储项，不做任何操作
						setItem: () => Promise.resolve(), // 移除存储项，不做任何操作
						removeItem: () => Promise.resolve()
					}
				}
				// 在客户端使用 localStorage 进行存储
				return localStorage
			}), // 指定哪些状态属性需要持久化，排除方法
			partialize: (state) => ({
				assistants: state.assistants
			}), // 状态迁移函数
			migrate: (persistedState, version) => {
				// 这里可以根据版本号进行状态迁移
				return persistedState
			}, // 状态版本号，用于状态迁移
			version: 0
		}
	)
)
