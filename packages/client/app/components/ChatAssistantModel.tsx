import React, { useEffect, useState } from 'react'
import { useChatAssistantStore, useGeneralStore, useChatStore } from '@/app/store'
import { Assistant } from '@/app/lib/type'
import { UUID } from '@/app/lib/util'
import BodyPortal from '@/app/components/commons/BodyPortal'
import { AddMarkIcon, CloseIcon } from '@/app/styles/SvgIcon'

const initialData = {
	id: '',
	name: '',
	prompt: ''
}

/**
 * AI助手管理
 * @constructor
 */
export default function McpSettingsModel(): [false | JSX.Element] {
	const { isModalAssistantOpen, setIsModalAssistantOpen } = useGeneralStore()
	const { assistants, addAssistant, removeAssistant, updateAssistant } = useChatAssistantStore()
	const { updateCurrentRoleId } = useChatStore()

	const [isChildModalOpen, setIsChildModalOpen] = useState(false)
	const [assistantList, setAssistantList] = useState<Assistant[]>([])
	const [assistantData, setAssistantData] = useState<Assistant>(initialData)

	const closeModal = () => setIsModalAssistantOpen(false)

	useEffect(() => {
		setAssistantList(assistants)
	}, [assistants])

	// 处理键盘事件（ESC键关闭模态框）
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (isChildModalOpen) {
					setIsChildModalOpen(false)
				} else {
					closeModal()
				}
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isChildModalOpen, isModalAssistantOpen])

	/**
	 * 新增、编辑MCP
	 */
	const McpAddOpenModel = ({ item, onClose }: { item: Assistant; onClose: () => void }) => {
		const [accData, setAccData] = useState<Assistant>(item)
		const [error, setError] = useState<string | null>(null)

		useEffect(() => {
			if (error) {
				const timer = setTimeout(() => {
					setError(null)
				}, 1000)
				// 清理定时器
				return () => clearTimeout(timer)
			}
		}, [error])

		// 表单输入赋值
		const handleChange = (name: string, value: any) => {
			setAccData((prev) => ({ ...prev, [name]: value }))
		}

		// 表单提交
		const handleSubmit = () => {
			if (!accData?.name?.trim()) {
				return setError('名称不能为空')
			}
			if (!accData?.prompt?.trim()) {
				return setError('提示语不能为空')
			}

			if (accData.id) {
				updateAssistant(accData.id, { ...accData })
			} else {
				if (assistantList?.some((item: Assistant) => item?.name === accData?.name)) {
					return setError('助手编码已存在！')
				}
				addAssistant({ ...accData, id: UUID() })
			}
			onClose()
		}

		// 删除操作
		const handleRemove = () => {
			removeAssistant(accData.id)
			onClose()
		}

		return (
			<BodyPortal>
				<div className="fixed inset-0 z-[51] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
					<div className="bg-white lg:p-8 p-4 flex flex-col rounded-2xl shadow-2xl w-[750px] max-w-[90%] max-h-[85%] relative overflow-hidden">
						{/* 顶部关闭按钮和标题 */}
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold text-gray-900">{accData?.id ? '编辑助手' : '添加助手'}</h2>
							<button
								className="text-gray-600 hover:text-gray-900 p-2 rounded-full transition-colors duration-200"
								onClick={onClose}
							>
								<CloseIcon />
							</button>
						</div>
						<div className="min-h-[400px] flex-1 overflow-auto px-2 flex flex-col items-center justify-between">
							<div className="relative w-full pt-4 lg:pt-6 space-y-4">
								{error && (
									<div className="absolute top-0 w-full p-2 bg-red-50 text-sm text-red-600 rounded-lg">{error}</div>
								)}
								<label className="block">
									<span className="block font-semibold mb-2">
										<span className="text-red-500">*</span>助手名称
									</span>
									<input
										type="text"
										className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
										placeholder="请输入助手名称"
										value={accData?.name}
										onChange={(e) => handleChange('name', e.target.value)}
									/>
								</label>
								<label className="block">
									<span className="block font-semibold mb-2">
										<span className="text-red-500">*</span>助手设定
									</span>
									<textarea
										className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
										placeholder="你是一个乐于助人的小助手，你会帮助我解决问题。"
										value={accData?.prompt}
										onChange={(e) => handleChange('prompt', e.target.value)}
									/>
								</label>
							</div>
						</div>
						<div className={`relative w-full mt-8 flex ${accData?.id ? 'justify-between' : 'justify-end'}`}>
							{accData?.id && (
								<button className="block px-2 rounded-lg text-sm btn-error" onClick={handleRemove}>
									删除
								</button>
							)}
							<div className="flex justify-between">
								<button className="block px-4 py-2 rounded-lg btn-primary" onClick={handleSubmit}>
									提交
								</button>
							</div>
						</div>
					</div>
				</div>
			</BodyPortal>
		)
	}

	return [
		// 弹窗内容
		isModalAssistantOpen && (
			<>
				<BodyPortal>
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
						<div className="bg-white lg:p-8 p-4 flex flex-col rounded-2xl shadow-2xl w-[850px] max-w-[90%] max-h-[85%] relative overflow-hidden">
							{/* 顶部关闭按钮和标题 */}
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-2xl font-semibold text-gray-900">AI助手管理</h2>
								<button
									className="text-gray-600 hover:text-gray-900 p-2 rounded-full transition-colors duration-200"
									onClick={closeModal}
								>
									<CloseIcon />
								</button>
							</div>
							<div className="min-h-[400px] flex-1 overflow-auto px-2">
								<div className="p-3 flex justify-start items-center">
									<button
										className="text-sm px-3 py-2 btn-primary text-white rounded-md shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center"
										onClick={() => {
											setAssistantData(initialData)
											setIsChildModalOpen(true)
										}}
									>
										<AddMarkIcon />
										<span>添加助手</span>
									</button>
								</div>
								<div className="mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-x-5">
									{assistantList?.map?.((ass: Assistant, index: number) => (
										<div
											className="border border-dashed border-blue-200 hover:border-blue-400 rounded p-3 space-y-3 cursor-pointer"
											key={ass?.id + index}
											onClick={() => {
												updateCurrentRoleId(ass.id)
												closeModal()
											}}
										>
											<div className="flex justify-start items-center" title={ass.name}>
												<div className="truncate flex-1 text-sm">{ass.name}</div>
												<span
													className="text-blue-500 text-sm cursor-pointer hover:text-blue-300"
													onClick={(e: any) => {
														e.stopPropagation()
														setAssistantData(ass)
														setIsChildModalOpen(true)
													}}
												>
													编辑
												</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="flex-1 text-gray-400 text-xs line-clamp-2" title={ass.prompt}>
													{ass.prompt}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</BodyPortal>
				{isChildModalOpen && <McpAddOpenModel item={assistantData} onClose={() => setIsChildModalOpen(false)} />}
			</>
		)
	]
}
