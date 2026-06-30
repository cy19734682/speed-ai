import React, { useState } from 'react'
import useChatContent from '@/app/hooks/useChatContent'
import { ChatDetail, ChatRoundDetail } from '@/app/lib/type'
import Modal from '@/app/components/commons/Modal'
import {
	LoadingIcon,
	ChatIcon,
	ToTopIcon,
	CloseIcon,
	SendIcon,
	StopIcon,
	ErrorIcon,
	UploadIcon
} from '@/app/styles/SvgIcon'
import ChatReply from '@/app/components/chat/ChatReply'
import UserReply from '@/app/components/chat/UserReply'
import KnowledgeReply from '@/app/components/chat/KnowledgeReply'
import MarkdownThinkReply from '@/app/components/chat/MarkdownThinkReply'
import McpToolReply from '@/app/components/chat/McpToolReply'
import ChatEndReply from '@/app/components/chat/ChatEndReply'
import WebSearchReply from '@/app/components/chat/WebSearchReply'
import McpToolSelect from '@/app/components/chat/McpToolSelect'
import { useMcpToolSelect } from '@/app/components/chat/McpToolSelect'
/**
 * 对话主界面
 * @constructor
 */
const ChatInterface: React.FC<any> = () => {
	const {
		messagesTopRef,
		messagesEndRef,
		scrollTopButtonRef,
		scrollBottomButtonRef,
		currentChatData,
		historys,
		error,
		inputValue,
		isProcessing,
		textareaRef,
		assistantData,
		uploadedFiles,
		isUploading,
		fileInputRef,
		setInputValue,
		setError,
		handleKeyDown,
		handleSendMessage,
		handleCancel,
		scrollToTop,
		scrollToBottom,
		clearAssistantData,
		handleOpenFilePicker,
		handleFileChange,
		handleRemoveFile,
		reSendText
	} = useChatContent()

	const { webSearch, thinking, knowledge, selectedModel, enabledToolsCount } = useMcpToolSelect()

	const [modalData, setModalData] = useState<any>({})

	return (
		<>
			<div className="card h-full flex flex-col">
				<div className="card-header flex justify-between items-center">
					<h2 className="text-xl font-semibold pr-5 truncate">{currentChatData?.title || '聊天'}</h2>
				</div>
				<div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-4">
					<div ref={messagesTopRef} />
					{!historys || historys?.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-[350px] lg:h-[450px] text-center text-gray-500">
							<ChatIcon cls="text-gray-300 mb-3 h-12 w-12" />
							<p>还没有消息。开始一个对话吧！</p>
						</div>
					) : (
						historys?.map?.((message: ChatDetail, index: number) => (
							<div
								key={(message.createdAt || 'history') + index}
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
										message?.contents?.length > 0 ? (
											message?.contents?.map?.((item: ChatRoundDetail, index1: number) => (
												<div key={'assistant-' + index + '-' + index1}>
													{/*AI知识库检索结果回复*/}
													<KnowledgeReply message={item} setModalData={setModalData} />
													{/*AI思维链消息回复*/}
													<MarkdownThinkReply message={item} />
													{/*AI消息回复*/}
													<ChatReply content={item.middle} isProcessing={isProcessing} />
													{/*联网搜索*/}
													<WebSearchReply message={item} />
													{/*MCP工具调用*/}
													<McpToolReply message={item} />
													{/*对话结束回复*/}
													<ChatEndReply message={item} reSendText={reSendText} />
													{/*工具加载中*/}
													{item?.loading ? (
														<div className="ml-2 inline-block">
															<LoadingIcon cls="h-4 w-4" />
														</div>
													) : (
														''
													)}
												</div>
											))
										) : (
											<div className="ml-2 inline-block">
												<LoadingIcon cls="h-4 w-4" />
											</div>
										)
									) : message.role === 'user' ? (
										<UserReply message={message} setModalData={setModalData} />
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
							{/* 已上传文件列表 */}
							{uploadedFiles && uploadedFiles.length > 0 && (
								<div className="flex flex-wrap gap-2 pb-4 border-gray-200">
									{uploadedFiles.map((file: any) => (
										<div
											key={file.id}
											className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100"
											title={file.name}
										>
											<span
												className="max-w-[140px] truncate cursor-pointer hover:underline"
												onClick={() => setModalData(file)}
											>
												{file.name}
											</span>
											<button
												type="button"
												onClick={() => handleRemoveFile(file.id)}
												className="ml-1 text-indigo-500 hover:text-red-600"
												aria-label="移除文件"
											>
												<CloseIcon cls="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							)}
							<div className="flex-1 relative">
								<textarea
									ref={textareaRef}
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={handleKeyDown}
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
									{/* MCP工具按钮 */}
									<McpToolSelect />
								</div>
								{/* 右侧按钮组 */}
								<div className="flex items-center pr-2">
									{/* 上传图标 */}
									<input
										ref={fileInputRef}
										type="file"
										multiple
										accept=".txt,.md,.json,.log,.xml,.js,.ts,.py,.html,.css,.java,.c,.cpp,.go,.rs,.sh,.yml,.yaml,.ini,.conf"
										onChange={handleFileChange}
										className="hidden"
									/>
									<button
										type="button"
										onClick={handleOpenFilePicker}
										title="上传文件（加入对话上下文）"
										aria-label="上传文件"
										className="flex items-center justify-center w-9 h-9 mr-2 rounded-lg border bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-500 hover:bg-gray-50 transition-colors"
									>
										{isUploading ? <LoadingIcon cls="h-5 w-5" /> : <UploadIcon cls="h-5 w-5" />}
									</button>
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
											onClick={() => handleSendMessage()}
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
							{thinking && (
								<span className="bg-green-100 text-green text-en-800 px-2 py-0.5 rounded-md text-xs ml-1">
									深度思考
								</span>
							)}
							{webSearch && (
								<span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-md text-xs ml-1">联网搜索</span>
							)}
							{knowledge && (
								<span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-xs ml-1">知识库</span>
							)}
							<span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-xs ml-1">
								{enabledToolsCount}个工具
							</span>
						</div>
					</div>
				</div>
			</div>
			<Modal
				title={modalData?.name}
				isOpen={!!modalData?.content}
				onClose={() => setModalData({})}
				className="w-[1200px]"
			>
				<div className="relative w-full text-sm h-[60vh] lg:h-[70vh] whitespace-pre-wrap">{modalData?.content}</div>
			</Modal>
		</>
	)
}

export default ChatInterface
