import React, { useState, useEffect, createContext, useContext, useCallback, ReactNode, FC } from 'react'
import {CloseIcon} from "@/app/styles/SvgIcon"

// 定义Toast类型
type ToastType = 'success' | 'error' | 'warning' | 'info'

// 单个Toast项接口
interface ToastItem {
	id: string
	message: string
	type: ToastType
	duration: number
}

// Toast方法接口
interface ToastMethods {
	success: (message: string, duration?: number) => void
	error: (message: string, duration?: number) => void
	warning: (message: string, duration?: number) => void
	info: (message: string, duration?: number) => void
}

// Toast上下文接口
interface ToastContextType {
	toast: ToastMethods
}

// 创建Context
const ToastContext = createContext<ToastContextType | null>(null)

// Toast提供者Props
interface ToastProviderProps {
	children: ReactNode
}

// 全局Toast提供者
export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
	const [toasts, setToasts] = useState<ToastItem[]>([])

	const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
		const id = Math.random().toString(36).substr(2, 9)
		setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }])
	}, [])

	const removeToast = useCallback((id: string) => {
		setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
	}, [])

	// 提供多种类型的快捷方法
	const toastMethods: ToastMethods = {
		success: (message, duration) => addToast(message, 'success', duration),
		error: (message, duration) => addToast(message, 'error', duration),
		warning: (message, duration) => addToast(message, 'warning', duration),
		info: (message, duration) => addToast(message, 'info', duration)
	}

	const contextValue: ToastContextType = {
		toast: toastMethods
	}

	return (
		<ToastContext.Provider value={contextValue}>
			{children}
			{/* Toast容器 */}
			<div className="fixed top-0 left-0 right-0 z-[999]">
				{toasts.map((toast) => (
					<ToastItem
						key={toast.id}
						id={toast.id}
						message={toast.message}
						type={toast.type}
						duration={toast.duration}
						onDismiss={removeToast}
					/>
				))}
			</div>
		</ToastContext.Provider>
	)
}

// Toast项Props
interface ToastItemProps {
	id: string
	message: string
	type: ToastType
	duration?: number
	onDismiss: (id: string) => void
}

// 单个Toast项组件
const ToastItem: FC<ToastItemProps> = ({ id, message, type, duration = 3000, onDismiss }) => {
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(false)
			setTimeout(() => onDismiss(id), 300) // 等待退出动画完成
		}, duration)

		return () => clearTimeout(timer)
	}, [duration, id, onDismiss])

	// 根据类型设置样式
	const getTypeStyles = (): string => {
		switch (type) {
			case 'success':
				return 'bg-green-500 text-white'
			case 'error':
				return 'bg-red-500 text-white'
			case 'warning':
				return 'bg-yellow-500 text-gray-900'
			case 'info':
				return 'bg-blue-500 text-white'
			default:
				return 'bg-gray-800 text-white'
		}
	}

	// 获取对应的图标
	const getIcon = () => {
		switch (type) {
			case 'success':
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
					</svg>
				)
			case 'error':
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				)
			case 'warning':
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						></path>
					</svg>
				)
			case 'info':
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
				)
			default:
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
				)
		}
	}

	return (
		<div
			className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
				isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
			}`}
		>
			<div
				className={`${getTypeStyles()} text-sm rounded-lg shadow-lg py-2 px-4 flex items-center min-w-[300px] max-w-md`}
			>
				<div className="mr-3">{getIcon()}</div>
				<div className="flex-1">{message}</div>
				<button
					onClick={() => {
						setIsVisible(false)
						setTimeout(() => onDismiss(id), 300)
					}}
					className="ml-4 text-current cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
					aria-label="关闭提示"
				>
          <CloseIcon cls="w-4 h-4" />
				</button>
			</div>
		</div>
	)
}

// 自定义Hook用于访问toast方法
export const useToast = (): ToastMethods => {
	const context = useContext(ToastContext)
	if (!context) {
		throw new Error('useToast必须在ToastProvider内部使用')
	}
	return context.toast
}
