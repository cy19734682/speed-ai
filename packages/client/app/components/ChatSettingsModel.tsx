import React, { useEffect, useState } from 'react'
import { useChatStore, useGeneralStore } from '@/app/store'
import { ChatSettingIcon } from '@/app/lib/type'
import { models } from '@/app/lib/constant'
import Modal from '@/app/components/commons/Modal'

/**
 * 对话设置组件
 * @constructor
 */
const ChatSettingsModel: React.FC<any> = () => {
	const { isModalSettingOpen, setIsModalSettingOpen } = useGeneralStore()

	const { setting, updateSetting } = useChatStore()

	const [chatSetting, setChatSetting] = useState<ChatSettingIcon>(setting)
	const closeModal = () => setIsModalSettingOpen(false)

	useEffect(() => {
		updateSetting(chatSetting)
	}, [chatSetting])

	const handleChange = (name: string, value: any) => {
		setChatSetting((prev) => ({ ...prev, [name]: value }))
	}

	return (
		<Modal isOpen={isModalSettingOpen} onClose={closeModal} title="模型设置" className="w-[600px]">
			<div className="space-y-8">
				{/* 模型选择 */}
				<div>
					<label className="block text-base font-medium text-gray-800 mb-3">模型</label>
					<div className="flex border border-gray-300 rounded-lg overflow-hidden">
						{models &&
							models.map((item) => (
								<button
									key={item.value}
									className={`flex-1 p-4 flex justify-center items-center ${
										chatSetting?.model === item.value ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
									} hover:bg-blue-100 transition-colors duration-200`}
									onClick={() => handleChange('model', item.value)}
								>
									{item.icon && <item.icon cls="w-6 h-6 mr-2" />}
									<span className="flex flex-col">
										{item.name}
										<span className="text-xs mt-1">{item.description}</span>
									</span>
								</button>
							))}
					</div>
				</div>

				{/* 创意度设置 */}
				<div>
					<label className="block text-base font-medium text-gray-800 mb-3">
						创意度: {chatSetting?.temperature?.toFixed(1)}
					</label>
					<input
						type="range"
						min="0"
						max="2"
						step="0.1"
						value={chatSetting?.temperature}
						onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
						className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none"
					/>
					<div className="flex justify-between text-sm text-gray-600 mt-3">
						<span>严谨</span>
						<span>平衡</span>
						<span>创意</span>
					</div>
				</div>

				{/* 最大长度设置 */}
				<div>
					<label className="block text-base font-medium text-gray-800 mb-3">最大长度: {chatSetting?.maxTokens}</label>
					<input
						type="range"
						min="1024"
						max="8192"
						step="16"
						value={chatSetting?.maxTokens}
						onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
						className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none"
					/>
					<div className="flex justify-between text-sm text-gray-600 mt-3">
						<span>简短</span>
						<span>适中</span>
						<span>详细</span>
					</div>
				</div>

				{/* 上下文深度设置 */}
				<div>
					<label className="block text-base font-medium text-gray-800 mb-3">
						上下文数量: {chatSetting?.contextDeep}
					</label>
					<input
						type="range"
						min="1"
						max="10"
						step="1"
						value={chatSetting?.contextDeep}
						onChange={(e) => handleChange('contextDeep', parseInt(e.target.value))}
						className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none"
					/>
					<div className="flex justify-between text-sm text-gray-600 mt-3">
						<span>简单</span>
						<span>适中</span>
						<span>精确</span>
					</div>
				</div>
			</div>
		</Modal>
	)
}
export default ChatSettingsModel
