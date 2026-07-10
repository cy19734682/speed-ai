'use client'

import React from 'react'
import { useLoadingStore } from '@/app/store'

/**
 * 全局加载遮罩组件
 * 通过useLoadingStore控制显示和隐藏
 */
const GlobalLoading: React.FC = () => {
	const { isLoading, loadingText } = useLoadingStore()

	if (!isLoading) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
			<div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3 shadow-xl">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
				<span className="text-gray-700 font-medium">{loadingText}</span>
			</div>
		</div>
	)
}

export default GlobalLoading