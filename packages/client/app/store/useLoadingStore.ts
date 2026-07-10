import { create } from 'zustand'

type LoadingStore = {
	// 全局加载状态
	isLoading: boolean
	// 加载提示文字
	loadingText: string
	// 显示加载
	showLoading: (text?: string) => void
	// 隐藏加载
	hideLoading: () => void
}

/**
 * 全局加载状态管理
 */
export const useLoadingStore = create<LoadingStore>()((set) => ({
	isLoading: false,
	loadingText: '处理中...',
	showLoading: (text = '处理中...') =>
		set({
			isLoading: true,
			loadingText: text
		}),
	hideLoading: () =>
		set({
			isLoading: false,
			loadingText: '处理中...'
		})
}))