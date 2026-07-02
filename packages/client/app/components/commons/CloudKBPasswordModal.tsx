import React, { useEffect, useRef } from 'react'
import Modal from '@/app/components/commons/Modal'

/**
 * 云端知识库密码登录弹窗
 *
 * 通用组件，可在任何需要申请云端权限的地方使用
 *
 * 使用方式：
 *   <CloudKBPasswordModal
 *     isOpen={isOpen}
 *     onClose={handleClose}
 *     onSubmit={(password) => { ... }}
 *     title="使用云端知识库"
 *     description="请输入管理员密码..."
 *   />
 */
interface CloudKBPasswordModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (password: string) => boolean | Promise<boolean>
	title?: string
	description?: string
	inputValue?: string
	onInputChange?: (value: string) => void
}

const CloudKBPasswordModal: React.FC<CloudKBPasswordModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	title = '🔐 使用云端知识库',
	description,
	inputValue,
	onInputChange
}) => {
	const [password, setPassword] = React.useState<string>('')
	const inputRef = useRef<HTMLInputElement>(null)

	// 打开弹窗时清空输入并自动聚焦
	useEffect(() => {
		if (isOpen) {
			setPassword('')
			if (onInputChange) onInputChange('')
			setTimeout(() => inputRef.current?.focus(), 50)
		}
	}, [isOpen, onInputChange])

	// 处理密码提交
	const handleSubmit = async () => {
		const value = inputValue !== undefined ? inputValue : password
		const ok = await onSubmit(value)
		if (ok) {
			setPassword('')
			onClose()
		}
	}

	// 同步外部 inputValue
	React.useEffect(() => {
		if (inputValue !== undefined) {
			setPassword(inputValue)
		}
	}, [inputValue])

	// 处理输入变化
	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const v = e.target.value
		setPassword(v)
		if (onInputChange) onInputChange(v)
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title} className="w-[450px]">
			<div className="space-y-4 p-2">
				<div className="text-sm text-gray-600 leading-relaxed">
					{description || (
						<>
							云端知识库维护功能仅对授权用户开放，请输入管理员密码以获得使用权限。
							<div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
								<div>• 本地知识库：当前用户可维护，数据存储在您本地浏览器</div>
								<div>• 云端知识库：仅限授权用户维护，数据存储在服务端数据库</div>
							</div>
						</>
					)}
				</div>

				<label className="block">
					<span className="block text-sm font-medium mb-1">管理员密码</span>
					<input
						ref={inputRef}
						type="password"
						placeholder="请输入管理员密码"
						value={inputValue !== undefined ? inputValue : password}
						onChange={handlePasswordChange}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleSubmit()
						}}
						className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
					/>
				</label>
			</div>
			<div className="mt-6 flex justify-end gap-2">
				<button
					type="button"
					onClick={onClose}
					className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all text-sm"
				>
					取消
				</button>
				<button
					type="button"
					onClick={handleSubmit}
					className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-all text-sm"
				>
					确认登录
				</button>
			</div>
		</Modal>
	)
}

export default CloudKBPasswordModal
