import React, { useEffect, useState } from 'react'
import { useChatAssistantStore, useGeneralStore, useChatStore } from '@/app/store'
import { Assistant } from '@/app/lib/type'
import { UUID } from '@/app/lib/util'
import Modal from '@/app/components/commons/Modal'
import { AddMarkIcon } from '@/app/styles/SvgIcon'
import {useToast} from "@/app/components/commons/Toast"
import {useConfirm} from "@/app/components/commons/Confirm"

const initialData = {
	id: '',
	name: '',
	prompt: ''
}

/**
 * AI助手管理
 * @constructor
 */
const ChatAssistantModel: React.FC<any> = () => {
  const toast = useToast()
  const { confirm } = useConfirm()
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

	/**
	 * 新增、编辑AI助手
	 */
	const AccAddOpenModel = ({ isOpen, item, onClose }: { isOpen: boolean; item: Assistant; onClose: () => void }) => {
		const [accData, setAccData] = useState<Assistant>(item)
    
    useEffect(() => {
      setAccData(item)
    }, [item])
    
		// 表单输入赋值
		const handleChange = (name: string, value: any) => {
			setAccData((prev) => ({ ...prev, [name]: value }))
		}

		// 表单提交
		const handleSubmit = () => {
			if (!accData?.name?.trim()) {
				return toast.error('名称不能为空')
			}
			if (!accData?.prompt?.trim()) {
				return toast.error('提示语不能为空')
			}

			if (accData.id) {
				updateAssistant(accData.id, { ...accData })
        toast.success("修改成功")
			} else {
				if (assistantList?.some((e: Assistant) => e?.name === accData?.name)) {
					return toast.warning('助手编码已存在！')
				}
				addAssistant({ ...accData, id: UUID() })
        toast.success("添加成功")
			}
			onClose()
		}

		// 删除操作
		const handleRemove = () => {
      confirm({
        title: '删除确认',
        content: '您确定要删除此角色吗？此操作不可撤销。',
        submitConfirm: () => {
          removeAssistant(accData.id)
          onClose()
          toast.success("删除成功")
        }
      })
		}

		const customFooter = (
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
		)

		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				title={accData?.id ? '编辑助手' : '添加助手'}
				footer={customFooter}
				className="w-[750px]"
			>
				<div className="min-h-[400px] flex-1 overflow-auto px-2 flex flex-col items-center justify-between">
					<div className="relative w-full pt-4 lg:pt-6 space-y-4">
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
			</Modal>
		)
	}

	const accAddOpenModel = AccAddOpenModel({
		isOpen: isChildModalOpen,
		item: assistantData,
		onClose: () => setIsChildModalOpen(false)
	})
	return (
		<>
			<Modal
				isOpen={isModalAssistantOpen}
				onClose={closeModal}
				title="AI助手管理"
				className="w-[850px]"
			>
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
			</Modal>
			{accAddOpenModel}
		</>
	)
}
export default ChatAssistantModel