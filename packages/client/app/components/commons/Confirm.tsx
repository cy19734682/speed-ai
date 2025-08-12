import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react'
import { CloseIcon } from '@/app/styles/SvgIcon'
import { useStackStore } from '@/app/store'

// ===================== 类型定义 =====================
type ConfirmContent = ReactNode | null

interface ConfirmProps {
	title?: string
	content?: ConfirmContent
	submitConfirm?: () => void
	showCloseButton?: boolean
	closeOnOverlayClick?: boolean
	closeConfirm?: () => void
}

interface ConfirmContextType {
	confirm: (props: ConfirmProps) => void
}

// ===================== 上下文创建 =====================
const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
	const [options, setOptions] = useState<ConfirmProps>({})

	const openConfirm = useCallback((confirmOptions: ConfirmProps) => {
		setOptions(confirmOptions)
	}, [])

	const closeConfirm = useCallback(() => {
		setOptions({})
	}, [])

	const contextValue: ConfirmContextType = {
		confirm: openConfirm
	}

	return (
		<ConfirmContext.Provider value={contextValue}>
			{children}
			{options?.content && (
				<Confirm
					title={options.title}
					content={options.content}
					submitConfirm={options.submitConfirm}
					showCloseButton={options.showCloseButton}
					closeOnOverlayClick={options.closeOnOverlayClick}
					closeConfirm={closeConfirm}
				/>
			)}
		</ConfirmContext.Provider>
	)
}

export const useConfirm = () => {
	const context = useContext(ConfirmContext)
	if (!context) {
		throw new Error('useConfirm必须在ConfirmProvider内部使用')
	}
	return context
}

// ===================== 弹窗组件 =====================
export const Confirm = ({
	title = '',
	content,
	submitConfirm,
	showCloseButton = true,
	closeOnOverlayClick = true,
	closeConfirm
}: ConfirmProps) => {
	const { generateId, stack, pushStack, removeStack } = useStackStore()
	const stackId = useRef<string>(`confirm-${generateId()}`).current
	const [isVisible, setIsVisible] = useState(true)

	const closeConfirmModal = () => {
		setIsVisible(false)
		closeConfirm?.()
	}

	// 向堆栈中添加关闭事件
	useEffect(() => {
		if (isVisible) {
			pushStack({
				id: stackId,
				closeHandler: closeConfirmModal
			})
		}
		return () => {
			removeStack(stackId)
		}
	}, [isVisible, stackId, pushStack, removeStack])

	// 防止背景滚动
	useEffect(() => {
		if (isVisible) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isVisible])

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget && closeOnOverlayClick) {
			closeConfirmModal()
		}
	}
	const handleSubmitClick = () => {
		submitConfirm?.()
		closeConfirmModal()
	}

	return (
		<div
			className={`fixed inset-0 z-[998] flex items-center justify-center p-4 transition-opacity duration-300 ${
				isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
			}`}
			onClick={handleOverlayClick}
		>
			{/* 背景遮罩 */}
			<div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

			{/* 弹窗容器 */}
			<div
				className={`relative z-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				{/* 标题栏 */}
				{(title || showCloseButton) && (
					<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
						{title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
						{showCloseButton && (
							<button
								onClick={closeConfirmModal}
								className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
								aria-label="Close"
							>
								<CloseIcon />
							</button>
						)}
					</div>
				)}

				{/* 内容区域 */}
				<div className="p-6">{content}</div>

				{/* 底部按钮 */}
				<div className="flex space-x-1 justify-end p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
					<button onClick={handleSubmitClick} className="px-4 py-2 btn-primary text-white rounded-lg transition-colors">
						确认
					</button>
					<button onClick={closeConfirmModal} className="px-4 py-2  rounded-lg transition-colors">
						关闭
					</button>
				</div>
			</div>
		</div>
	)
}
