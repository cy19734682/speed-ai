import React, { useState } from 'react'
import useChatContent from '@/app/hooks/useChatContent'
import { ChatDetail } from '@/app/lib/type'
import {
	ThinkIcon,
	ArrowDownIcon,
	LoadingIcon,
	ChatIcon,
	ToTopIcon,
	CloseIcon,
	SendIcon,
	WebSearchIcon,
	McpSettingIcon,
	CheckMarkIcon,
	StopIcon,
	ToolIcon,
	SuccessIcon,
	SearchIcon,
	ErrorIcon
} from '@/app/styles/SvgIcon'
import ChatReply from '@/app/components/commons/ChatReply'
import { models } from '@/app/lib/constant'
import { useToast } from '@/app/components/commons/Toast'
/**
 * 对话主界面
 * @constructor
 */
const ChatInterface: React.FC<any> = () => {
	const toast = useToast()
	const {
		messagesTopRef,
		messagesEndRef,
		scrollTopButtonRef,
		scrollBottomButtonRef,
		chatData,
		error,
		inputValue,
		isProcessing,
		webSearch,
		toolsRef,
		selectedModel,
		isToolsOpen,
		mcpList,
		enabledToolsCount,
		isModelMenuOpen,
		modelButtonRef,
		modelMenuRef,
		toolsButtonRef,
		textareaRef,
		assistantData,
		currentModel,
		setInputValue,
		setError,
		handleSendMessage,
		handleCancel,
		scrollToTop,
		scrollToBottom,
		toggleWenSearch,
		selectModel,
		setIsToolsOpen,
		disEnableAllTools,
		toggleTool,
		setIsModelMenuOpen,
		clearAssistantData
	} = useChatContent()


	/**
	 * AI思维链消息（深度思考）回复
	 * @param chat
	 * @constructor
	 */
	const MarkdownThinkContent = ({ message }: { message: ChatDetail }) => {
		// 是否正在思考
		const isThinking = message.thinkContent && !message.content
		// 是否思考结束
		const isThinkEnd = message.thinkContent && message.content

		const [isOpen, setIsOpen] = useState(true)

		return (
			<>
				{(isThinking || isThinkEnd) && (
					<div>
						<div
							className="w-fit text-[12px] my-2 flex items-center w py-1 px-2 bg-gray-100 rounded-md cursor-pointer"
							onClick={(e) => {
								e.stopPropagation()
								if (isThinkEnd) {
									setIsOpen(!isOpen)
								}
							}}
						>
							<ThinkIcon cls="mr-1" />
							{isThinking && '正在思考...'}
							{isThinkEnd && `已深度思考（用时${message.thinkTime || 0}秒）`}
							{isThinkEnd && (
								<div className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
									<ArrowDownIcon />
								</div>
							)}
						</div>
						<div
							className={`text-sm px-3 my-3 text-[#8b8b8b] whitespace-pre-wrap border-l-2 ${isOpen ? 'block' : 'hidden'}`}
						>
							{message.thinkContent}
						</div>
					</div>
				)}
			</>
		)
	}

	/**
	 * AI联网搜索结果回复
	 * @param chat
	 * @constructor
	 */
	const WebSearchContent = ({ message }: { message: ChatDetail }) => {
		// 联网搜索结果
		const { type, toolName, searchQuery, content }: any = message.searchData || {}
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
							<span className="text-gray-600 font-bold italic">{searchQuery?.query || ''}</span>
						</div>
						<div
							className={`py-2 flex scroll-smooth gap-2 transition-all duration-300 ${isOpen ? 'flex-wrap overflow-x-hidden' : 'flex-nowrap overflow-x-auto'}`}
						>
							{content?.map((item: any, index: number) => (
								<div
									key={item.title}
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

	/**
	 * MCP工具调用结果回复
	 * @param chat
	 * @constructor
	 */
	const McpToolContent = ({ message }: { message: ChatDetail }) => {
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

	return (
		<div className="card h-full flex flex-col">
			<div className="card-header flex justify-between items-center">
				<h2 className="text-xl font-semibold pr-5 truncate">{chatData?.title || '聊天'}</h2>
			</div>
			<div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-4">
				<div ref={messagesTopRef} />
				{!chatData?.list || chatData?.list?.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-[350px] lg:h-[450px] text-center text-gray-500">
						<ChatIcon cls="text-gray-300 mb-3 h-12 w-12" />
						<p>还没有消息。开始一个对话吧！</p>
					</div>
				) : (
					chatData?.list?.map?.((message: ChatDetail, index: number) => (
						<div
							key={message.chatId + index}
							className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} my-2`}
						>
							{message.role !== 'user' && (
								<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
									<span className="text-blue-600 text-xs font-bold">{message.role === 'system' ? 'S' : 'AI'}</span>
								</div>
							)}
							<div
								className={
									message.role === 'user'
										? 'message-user'
										: message.role === 'system'
											? 'message-system'
											: 'message-assistant'
								}
							>
								{message.role === 'assistant' ? (
									<div>
										{/*联网搜索*/}
										<WebSearchContent message={message} />
										{/*MCP工具调用*/}
										<McpToolContent message={message} />
										{!message.thinkContent && !message.content ? ( //未返回结果时显示加载动画
											<div className="ml-2 inline-block">
												<LoadingIcon cls="h-4 w-4" />
											</div>
										) : (
											''
										)}
										{/*AI思维链消息回复*/}
										<MarkdownThinkContent message={message} />
										{/*AI消息回复*/}
										<ChatReply content={message.content} isProcessing={isProcessing}  />
									</div>
								) : (
									<div className="whitespace-pre-wrap">{message.content}</div>
								)}
							</div>
							{message.role === 'user' && (
								<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center ml-2 flex-shrink-0">
									<span className="text-white text-xs font-bold">你</span>
								</div>
							)}
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>
			<div className="relative p-2 lg:p-4">
				{/* 回到顶部按钮 */}
				<button
					ref={scrollTopButtonRef}
					onClick={scrollToTop}
					className="absolute bottom-[100%] mb-16 right-6 p-2 rounded-full bg-gray-300 text-white hidden"
				>
					<ToTopIcon />
				</button>

				{/* 回到底部按钮 */}
				<button
					ref={scrollBottomButtonRef}
					onClick={scrollToBottom}
					className="absolute bottom-[100%] mb-4 right-6 p-2 rounded-full bg-gray-300 text-white hidden rotate-180"
				>
					<ToTopIcon />
				</button>

				{error && (
					<div className="mb-3 p-2 bg-red-50 text-sm text-red-600 rounded-lg">
						<div className="flex items-center">
							<ErrorIcon />
							{error}
							<button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
								<CloseIcon />
							</button>
						</div>
					</div>
				)}

				<div className="pt-2">
					{assistantData && (
						<div className="flex flex-col justify-between pb-2">
							<div className="flex items-center">
								<span className="text-sm font-medium text-gray-700"> {assistantData.name}</span>
								<button
									onClick={clearAssistantData}
									className="flex items-center bg-gray-200 p-1 rounded-full ml-2"
									aria-label="关闭助手"
								>
									<CloseIcon cls="w-4 h-4" />
								</button>
							</div>
							<div className="text-sm text-gray-500 mt-2 line-clamp-2">{assistantData.prompt}</div>
						</div>
					)}
					<div className="flex flex-col border p-2 border-gray-300 rounded-xl shadow-inner bg-white">
						<div className="flex-1 relative">
							<textarea
								ref={textareaRef}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
								placeholder="输入消息..."
								className="w-full focus:outline-none resize-none bg-transparent min-h-16 max-h-32"
								rows={1}
								disabled={isProcessing}
							/>
						</div>
						{/* 底部控制区域 */}
						<div className="flex justify-between items-center mt-1">
							{/* 左侧控制按钮组 */}
							<div className="flex items-center pl-2 space-x-2">
								<div className="relative">
									{/* 模型选择菜单 */}
									<button
										ref={modelButtonRef}
										onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
										className="flex items-center h-9 px-2 py-2 rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
										aria-label="选择模型"
									>
										{currentModel.icon && <currentModel.icon cls="w-6 lg:w-4 h-6 lg:h-4 mr-0 lg:mr-1" />}
										<span className="hidden lg:block text-[13px] font-medium truncate max-w-16 md:max-w-[inherit]">
											{currentModel.name}
										</span>
										<ArrowDownIcon
											cls={`hidden lg:block ml-1 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`}
										/>
									</button>
									{/* 模型选择菜单 - 模拟下拉列表 */}
									{isModelMenuOpen && (
										<div
											ref={modelMenuRef}
											className="absolute bottom-full mb-2 w-52 z-20 bg-white border border-gray-200 rounded-lg shadow-lg"
										>
											<div className="p-2">
												<h3 className="text-xs font-medium text-gray-700 mb-1">选择模型</h3>
												<div className="space-y-1">
													{models &&
														models.map((item) => (
															<button
																key={item.value}
																onClick={() => {
																	selectModel(item.value)
																	setIsModelMenuOpen(false)
																}}
																className={`w-full flex items-center p-2 text-[13px] rounded-md ${
																	selectedModel === item.value
																		? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-medium'
																		: 'hover:bg-gray-50 text-gray-700'
																}`}
															>
																{item.icon && <item.icon cls="w-4 h-4 mr-1" />}
																<span className="flex flex-col items-start">
																	{item.name}
																	<span className="text-xs mt-1">{item.description}</span>
																</span>
																{selectedModel === item.value && <CheckMarkIcon />}
															</button>
														))}
												</div>
											</div>
										</div>
									)}
								</div>

								{/* 联网搜索按钮 - 图标 */}
								<button
									onClick={toggleWenSearch}
									className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
										webSearch
											? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-600'
											: 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-50'
									}`}
									aria-label={webSearch ? '关闭联网搜索' : '开启联网搜索'}
									title={webSearch ? '关闭联网搜索' : '开启联网搜索'}
								>
									<WebSearchIcon />
								</button>

								{/* MCP工具按钮 - 图标 */}
								<div className="relative">
									<button
										ref={toolsButtonRef}
										onClick={() => setIsToolsOpen(!isToolsOpen)}
										className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
											enabledToolsCount > 0
												? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-300 text-indigo-600'
												: 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-50'
										}`}
										aria-label="工具设置"
										title="工具设置"
									>
										<McpSettingIcon />
										{enabledToolsCount > 0 && (
											<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">
												{enabledToolsCount}
											</span>
										)}
									</button>

									{isToolsOpen && (
										<div
											ref={toolsRef}
											className="absolute left-[-50px] lg:left-0 z-10 w-56 max-h-[50vh] bottom-full mb-2 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
										>
											<div className="sticky top-0 p-3 border-b border-gray-200 bg-white z-10">
												<div className="flex justify-between items-center">
													<h3 className="text-sm font-medium text-gray-800">可用工具</h3>
													<div className="flex space-x-1">
														<button
															onClick={() => disEnableAllTools(true)}
															className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
														>
															全选
														</button>
														<button
															onClick={() => disEnableAllTools(false)}
															className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
														>
															清空
														</button>
													</div>
												</div>
											</div>
											<div className="divide-y divide-gray-100 w-full">
												{mcpList.map((tool) => (
													<div
														key={tool.id}
														className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
														onClick={() => toggleTool(tool)}
													>
														<div className="w-[80%]">
															<div className="flex items-center">
																<div
																	className={`w-3 h-3 rounded-full mr-2 ${
																		tool.enabled ? 'bg-green-500' : 'bg-gray-300'
																	}`}
																></div>
																<span className="text-sm font-medium text-gray-800 truncate" title={tool.name}>
																	{tool.name}
																</span>
															</div>
															<p className="text-xs text-gray-500 ml-5 mt-1 truncate" title={tool.description}>
																{tool.description}
															</p>
														</div>
														<div className="relative">
															<input
																type="checkbox"
																className="sr-only"
																checked={tool.enabled}
																onChange={() => toggleTool(tool)}
															/>
															<div
																className={`block w-10 h-5 rounded-full transition-colors ${
																	tool.enabled ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-300'
																}`}
															></div>
															<div
																className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow ${
																	tool.enabled ? 'transform translate-x-5' : ''
																}`}
															></div>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
							{/* 右侧按钮组 */}
							<div className="flex items-center pr-2">
								{/* 发送/停止按钮 */}
								{isProcessing ? (
									<button
										onClick={handleCancel}
										className="ml-1 p-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg flex items-center transition-all shadow-md hover:shadow-lg"
										aria-label="停止生成"
									>
										<StopIcon />
									</button>
								) : (
									<button
										onClick={handleSendMessage}
										disabled={inputValue.trim() === ''}
										className={`ml-1 p-2 rounded-lg flex items-center transition-all shadow-md ${
											inputValue.trim() === ''
												? 'bg-gray-300 text-gray-500 cursor-not-allowed'
												: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-lg'
										}`}
										aria-label="发送消息"
									>
										<SendIcon />
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="mt-2 text-xs text-gray-500 flex justify-between flex-wrap">
					<div>按 Enter 发送，Shift + Enter 换行</div>
					<div className="flex items-center">
						<span className="mr-2">当前配置:</span>
						<span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-xs">{selectedModel}</span>
						{webSearch && (
							<span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-md text-xs ml-1">联网搜索</span>
						)}
						<span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-xs ml-1">
							{enabledToolsCount}个工具
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ChatInterface
