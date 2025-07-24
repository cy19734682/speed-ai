import React, { useEffect, useState } from 'react'
import { useChatStore, useGeneralStore } from '@/app/store'
import { ChatSettingIcon } from '@/app/lib/type'
import BodyPortal from '@/app/components/commons/BodyPortal'
import { CloseIcon } from '@/app/styles/SvgIcon'
import { models } from '@/app/lib/constant'

/**
 * 对话设置组件
 * @constructor
 */
export default function ChatSettingsModel(): [false | JSX.Element] {
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

	// 处理键盘事件（ESC键关闭模态框）
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (isModalSettingOpen) {
					closeModal()
				}
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isModalSettingOpen])

	return [
		// 弹窗内容
		isModalSettingOpen && (
			<BodyPortal>
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
					<div className="bg-white lg:p-8 p-4 rounded-2xl shadow-2xl w-[600px] max-w-[90%] max-h-[85%] space-y-8 relative overflow-hidden">
						{/* 顶部关闭按钮和标题 */}
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold text-gray-900">模型设置</h2>
							<button
								className="text-gray-600 hover:text-gray-900 p-2 rounded-full transition-colors duration-200"
								onClick={closeModal}
							>
								<CloseIcon />
							</button>
						</div>
						{/* 设置项 */}
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
									max="1"
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
								<label className="block text-base font-medium text-gray-800 mb-3">
									最大长度: {chatSetting?.maxTokens}
								</label>
								<input
									type="range"
									min="256"
									max="2048"
									step="128"
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
						</div>
					</div>
				</div>
			</BodyPortal>
		)
	]
}
