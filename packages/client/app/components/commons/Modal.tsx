import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { CloseIcon } from '@/app/styles/SvgIcon'
import { useStackStore } from '@/app/store'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	className?: string
	title?: React.ReactNode
	footer?: React.ReactNode
	children: React.ReactNode
	closeOnOutsideClick?: boolean
}

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	footer,
	children,
	closeOnOutsideClick = false,
	className = 'max-w-md'
}) => {
	const { generateId, stack, pushStack, removeStack } = useStackStore()
  const stackId = useRef<string>(`modal-${generateId()}`).current
	const modalRef = useRef<HTMLDivElement>(null)
	const portalRoot = useRef<HTMLElement | null>(null)

	// 创建稳定的关闭函数引用
	const closeSelf = ()=>{
    onClose()
  }
  
  // 向堆栈中添加关闭事件
	useEffect(() => {
		if (isOpen) {
			pushStack({
				id: stackId,
				closeHandler: closeSelf
			})
		}
		return () => {
			removeStack(stackId)
		}
	}, [isOpen, stackId, pushStack, removeStack])

	// 处理点击外部关闭
	useEffect(() => {
		if (!isOpen) return
		const handleOutsideClick = (e: MouseEvent) => {
			if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose()
			}
		}
		if (isOpen) {
			document.addEventListener('mousedown', handleOutsideClick)
		}
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick)
		}
	}, [isOpen, onClose, closeOnOutsideClick])

	// 创建portal容器
	useEffect(() => {
		// 检查是否在浏览器环境
		if (typeof document !== 'undefined') {
			portalRoot.current = document.getElementById('modal-root')
			if (!portalRoot.current) {
				const div = document.createElement('div')
				div.id = 'modal-root'
				document.body.appendChild(div)
				portalRoot.current = div
			}
		}
		// 禁止背景滚动
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	if (!isOpen || !portalRoot.current) return null

	return ReactDOM.createPortal(
		<div className="fixed inset-0 flex z-50 items-center justify-center p-4">
			{/* 半透明遮罩 */}
			<div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

			{/* 模态内容 */}
			<div
				ref={modalRef}
				className={`relative rounded-lg bg-white shadow-xl ${className} max-w-[90%] max-h-[80%] lg:max-h-[95%]`}
			>
				{/* 头部 */}
				{title && (
					<div className="flex items-center justify-between border-b p-4">
						<div className="text-xl font-semibold">{title}</div>
						<button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
							<CloseIcon />
						</button>
					</div>
				)}

				{/* 内容区域 */}
				<div className="relative max-h-[65vh] lg:max-h-[75vh] overflow-auto p-4">{children}</div>

				{/* 底部 */}
				{footer && <div className="border-t p-4">{footer}</div>}
			</div>
		</div>,
		portalRoot.current
	)
}

export default Modal
