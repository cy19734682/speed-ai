import { create } from 'zustand'

type GeneralStore = {
	// H5侧边栏开启状态
	isSidebarOpen: boolean
	// 配置面板开启状态
	isModalSettingOpen: boolean
	// Mcp面板开启状态
	isModalMcpOpen: boolean
	// AI助手面板开启状态
	isModalAssistantOpen: boolean
	setIsSidebarOpen: (open: boolean) => void
	setIsModalSettingOpen: (open: boolean) => void
	setIsModalMcpOpen: (open: boolean) => void
	setIsModalAssistantOpen: (open: boolean) => void
}

/**
 * 通用状态管理(无需持久化)
 */
export const useGeneralStore = create<GeneralStore>()((set) => ({
	isSidebarOpen: false,
	isModalSettingOpen: false,
	isModalMcpOpen: false,
	isModalAssistantOpen: false,
	setIsSidebarOpen: (open) =>
		set((state) => {
			state.isModalSettingOpen = false
			state.isModalMcpOpen = false
			state.isModalAssistantOpen = false
			return { isSidebarOpen: open }
		}),
	setIsModalSettingOpen: (open) =>
		set((state) => {
			state.isSidebarOpen = false
			return { isModalSettingOpen: open }
		}),
	setIsModalMcpOpen: (open) =>
		set((state) => {
			state.isSidebarOpen = false
			return { isModalMcpOpen: open }
		}),
	setIsModalAssistantOpen: (open) =>
		set((state) => {
			state.isSidebarOpen = false
			return { isModalAssistantOpen: open }
		})
}))
