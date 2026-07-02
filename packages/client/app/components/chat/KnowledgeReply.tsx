import React, { useState } from 'react'
import { ChatRoundDetail } from '@/app/lib/type'
import { ArrowDownIcon, LoadingIcon, SuccessIcon } from '@/app/styles/SvgIcon'

interface HTMLPreviewProps {
	message: ChatRoundDetail
	setModalData: (data: any) => void
}

/**
 * AI知识库检索结果回复
 * @param param0
 * @returns
 */
const KnowledgeReplyContent: React.FC<HTMLPreviewProps> = ({ message, setModalData }) => {
	// 知识库检索结果
	const { type, results }: any = message.knowledge || {}
	const [isOpen, setIsOpen] = useState(true)
	return (
		<>
			{(type === 'start' || results?.length > 0) && (
				<div className="relative">
					<div
						className="w-full min-w-[300px] text-xs my-1 flex justify-between items-center py-2 border px-2 rounded-md cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							setIsOpen(!isOpen)
						}}
					>
						<div className="font-bold flex items-center">
							{type === 'start' ? '知识库检索中...' : '知识库检索结果'}
							{type === 'start' ? <LoadingIcon /> : <SuccessIcon cls="text-green-600 ml-1" />}
						</div>
						<div>
							{type === 'end' && <ArrowDownIcon cls={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
						</div>
					</div>
					<div
						className={`py-2 flex flex-wrap scroll-smooth gap-2 transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}
					>
						{results?.length > 0 &&
							results?.map((item: any, index: number) => (
								<div
									key={'knowledge' + index}
									onClick={() => {
										setModalData({ ...item, name: item?.metadata?.name })
									}}
									className={`flex-shrink-0 ${isOpen ? 'w-[170px]' : 'w-40'} cursor-pointer border border-transparent hover:border-blue-500 h-14 bg-gray-100 rounded-xl p-2 flex flex-col justify-between`}
								>
									<h3 className="text-sm truncate" title={item?.metadata?.name}>
										{index + 1}. {item?.metadata?.name}
									</h3>
									<p className="text-gray-400 text-xs mt-1 truncate" title={item?.metadata?.description}>
										{item?.metadata?.description}
									</p>
								</div>
							))}
					</div>
				</div>
			)}
		</>
	)
}

export default KnowledgeReplyContent
