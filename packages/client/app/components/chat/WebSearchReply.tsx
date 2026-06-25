import React, { useState } from 'react'
import { ChatRoundDetail } from '@/app/lib/type'
import { SearchIcon, ArrowDownIcon, LoadingIcon, SuccessIcon } from '@/app/styles/SvgIcon'

interface HTMLPreviewProps {
	message: ChatRoundDetail
}

/**
 * AI联网搜索结果回复
 * @param param0
 * @returns
 */
const WebSearchContent: React.FC<HTMLPreviewProps> = ({ message }) => {
	// 联网搜索结果
	const { type, toolName, params, result }: any = message.search || {}
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			{toolName?.length > 0 && (
				<div className="relative">
					<div
						className="w-full min-w-[300px] text-xs my-1 flex justify-between items-center py-2 border px-2 rounded-md cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							setIsOpen(!isOpen)
						}}
					>
						<div className="font-bold flex items-center">
							{toolName}
							<SearchIcon cls="text-blue-600 ml-1" />
							{type === 'start' ? <LoadingIcon /> : <SuccessIcon cls="text-green-600 ml-1" />}
						</div>
						<div>
							<ArrowDownIcon cls={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
						</div>
					</div>
					<div className={`flex items-center text-xs pl-2 mt-2 ${isOpen ? 'block' : 'hidden'}`}>
						搜索关键字：
						<span className="text-gray-600 font-bold italic">{params?.query || ''}</span>
					</div>
					<div
						className={`py-2 flex scroll-smooth gap-2 transition-all duration-300 ${isOpen ? 'flex-wrap overflow-x-hidden' : 'flex-nowrap overflow-x-auto'}`}
					>
						{result?.length > 0 &&
							result?.map((item: any, index: number) => (
								<div
									key={item.title + index}
									className={`flex-shrink-0 ${isOpen ? 'w-[170px]' : 'w-40'} h-14 bg-gray-100 rounded-xl p-2 flex flex-col justify-between`}
								>
									<div
										className="cursor-pointer"
										onClick={() => {
											window.open(item.link)
										}}
									>
										<h3 className="text-sm truncate" title={item.title}>
											{index + 1}. {item.title}
										</h3>
										<p className="text-gray-400 text-xs mt-1 truncate" title={item.link}>
											{item.link}
										</p>
									</div>
								</div>
							))}
					</div>
				</div>
			)}
		</>
	)
}

export default WebSearchContent
