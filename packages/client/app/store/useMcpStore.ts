import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { McpStore, McpTool } from '@/app/lib/type'
import { MCP_STORE_KEY } from '@/app/lib/constant'

/**
 * 定义默认的状态
 **/
const defaultState = {
	searchTool: {
		id: 'web_search',
    code: 'web_search',
    name: '联网搜索',
    url: '',
    tag: '联网',
    description: '',
    accessToken: '',
    enabled: false
	},
	tools: []
}

/**
 * 初始化获取本地存储的状态（只考虑客户端）
 */
const initialState = () => {
	if (typeof window !== 'undefined') {
		const chatStore = localStorage.getItem(MCP_STORE_KEY)
		if (chatStore) {
			return JSON.parse(chatStore || '{}')?.state || {}
		}
	}
	return defaultState
}

/**
 * Mcp工具管理
 */
export const useMcpStore: any = create<McpStore>()(
	// 使用 persist 中间件实现状态持久化
	persist(
		// store 的初始状态和状态更新方法
		(set) => ({
			// 初始化数据
			...initialState(), // 添加新工具
			addTool: (newTool: McpTool) => {
				set((state) => ({
					tools: [{ ...newTool }, ...state.tools]
				}))
			}, // 删除工具
			removeTool: (id: string) => {
				set((state) => ({
					tools: state.tools.filter((item) => item.id !== id)
				}))
			}, // 更新工具
			updateTool: (id: string, item: McpTool) => {
				set((state) => ({
					tools: state.tools.map((e) => (e.id === id ? { ...e, ...item } : e))
				}))
			}, // 更新工具
			updateAllTool: (updateAllTool: McpTool[]) => {
				set(() => ({
					tools: updateAllTool
				}))
			}, // 重置工具
			resetTool: () => {
				set(() => ({
					tools: []
				}))
			}, // 更新联网搜索MCP工具
			updateSearchTool: (newTool: McpTool) => {
				set(() => ({
					searchTool: newTool
				}))
			}
		}),
		{
			// 本地存储的键名，用于在存储中标识该 store 的数据
			name: MCP_STORE_KEY, // 配置存储方式
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
				tools: state.tools,
				searchTool: state.searchTool
			}), // 状态迁移函数
			migrate: (persistedState, version) => {
				// 这里可以根据版本号进行状态迁移
				return persistedState
			}, // 状态版本号，用于状态迁移
			version: 0
		}
	)
)
