import React, { useState } from 'react'
import { ChatRoundDetail } from '@/app/lib/type'
import { ThinkIcon, ArrowDownIcon } from '@/app/styles/SvgIcon'

interface HTMLPreviewProps {
	message: ChatRoundDetail
}

/**
 * AI思维链消息（深度思考）回复
 * @param param0 
 * @returns 
 */
const MarkdownThinkContent: React.FC<HTMLPreviewProps> = ({ message }) => {
	// 是否正在思考（message.time 为 null/undefined 才算未结束；0 秒也算结束）
	const hasThinkContent = !!message.think
	const hasThinkTime = message.time != null && message.time !== ''
	const isThinking = hasThinkContent && !hasThinkTime
	// 是否思考结束
	const isThinkEnd = hasThinkContent && hasThinkTime
	const [isOpen, setIsOpen] = useState(true)

	return (
		<>
			{(isThinking || isThinkEnd) && (
				<div>
					<div
						className={`w-fit text-[12px] my-2 flex items-center w py-1 px-2 bg-gray-100 rounded-md ${isThinkEnd ? 'cursor-pointer' : ''}`}
						onClick={(e) => {
							e.stopPropagation()
							if (isThinkEnd) {
								setIsOpen(!isOpen)
							}
						}}
					>
						<ThinkIcon cls="mr-1" />
						{isThinking && '正在思考...'}
						{isThinkEnd && `已深度思考（用时${message.time || 0}秒）`}
						{isThinkEnd && (
							<div className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
								<ArrowDownIcon />
							</div>
						)}
					</div>
					<div
						className={`text-sm px-3 my-3 text-[#8b8b8b] whitespace-pre-wrap border-l-2 ${isOpen ? 'block' : 'hidden'}`}
					>
						{message.think}
					</div>
				</div>
			)}
		</>
	)
}

export default MarkdownThinkContent
