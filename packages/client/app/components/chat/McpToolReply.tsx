import React, { useState } from 'react'
import { ChatRoundDetail } from '@/app/lib/type'
import { ToolIcon, ArrowDownIcon, LoadingIcon, SuccessIcon } from '@/app/styles/SvgIcon'

interface HTMLPreviewProps {
	message: ChatRoundDetail
}

/**
 * MCP工具调用结果回复
 * @param param0
 * @returns
 */
const McpToolContent: React.FC<HTMLPreviewProps> = ({ message }) => {
	// 联网搜索结果
	const tools: any[] = message.tools || []

	const McpToolItem = ({ tool }: { tool: any }) => {
		// 联网搜索结果
		const { toolName, type, params, result } = tool || {}
		const [isOpen, setIsOpen] = useState(false)
		return (
			<div className="relative mt-2">
				<div
					className="w-full min-w-[300px] text-xs my-1 flex justify-between items-center py-2 border px-2 rounded-md cursor-pointer"
					onClick={(e) => {
						e.stopPropagation()
						setIsOpen(!isOpen)
					}}
				>
					<div className="font-bold flex items-center">
						{toolName}
						<ToolIcon cls="text-blue-600 ml-1" />
						{type === 'start' ? <LoadingIcon /> : <SuccessIcon cls="text-green-600 ml-1" />}
					</div>
					<div>
						<ArrowDownIcon cls={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
					</div>
				</div>
				<div className={`py-2 border rounded-md transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
					<div className="rounded-xl p-2">
						<div className="text-gray-500 text-sm">参数</div>
						<div className="bg-gray-100 rounded-xl overflow-auto p-2 m-0 text-xs">
							<pre>{JSON.stringify(params, null, 2)}</pre>
						</div>
					</div>
					<div className="rounded-xl p-2">
						<div className="text-gray-500 text-sm">结果</div>
						<div className="bg-gray-100 rounded-xl overflow-auto p-2 m-0 text-xs">
							<pre>{JSON.stringify(result, null, 2)}</pre>
						</div>
					</div>
				</div>
			</div>
		)
	}
	return (
		<>
			{tools?.length > 0 &&
				tools.map((item: any, index: number) => <McpToolItem tool={item} key={item.toolName + index} />)}
		</>
	)
}

export default McpToolContent
