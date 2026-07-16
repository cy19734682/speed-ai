import type React from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { apiFetch } from '@/app/lib/api/fetch'
import { handleResponse, UUID } from '@/app/lib/util'
import { useChatStore, useMcpStore, useChatAssistantStore } from '@/app/store'
import { ChatMessages, ChatDetail, Assistant, Knowledge } from '@/app/lib/type'
import { useMcpToolSelect } from '@/app/components/chat/McpToolSelect'
import { getLocalKB } from '@/app/lib/langchain/local'

export default function useChatContent() {
	const {
		setting,
		messages,
		historys,
		currentChatData,
		currentChatId,
		currentRoleId,
		addMessage,
		addMessageChild,
		updateMessageChild,
		saveMessageChild,
		updateMessageTitle,
		updateCurrentRoleId,
		loadMessages
	} = useChatStore()
	const { webSearch, thinking, knowledge, mcpList } = useMcpToolSelect()
	const { searchTool } = useMcpStore()
	const { assistants } = useChatAssistantStore()

	const [inputValue, setInputValue] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [assistantData, setAssistantData] = useState<any | null>(null)
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const abortControllerRef = useRef<any>(null)
	// 顶部可见元素
	const messagesTopRef = useRef<HTMLDivElement>(null)
	// 底部可见元素
	const messagesEndRef = useRef<HTMLDivElement>(null)
	// 按钮元素引用
	const scrollTopButtonRef = useRef<HTMLButtonElement>(null)
	const scrollBottomButtonRef = useRef<HTMLButtonElement>(null)
	// 输入框元素
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	/**
	 * 初始化时加载对话消息
	 */
	useEffect(() => {
		loadMessages()
	}, [])

	/**
	 * 动态更新浏览器标签页标题
	 * - 当存在对话且有有效标题时，展示对话标题
	 * - 否则使用默认标题
	 */
	useEffect(() => {
		if (typeof document !== 'undefined') {
			const defaultTitle = 'Speed AI - 智能助手'
			const chatTitle = currentChatData?.title?.trim()
			document.title = chatTitle ? `${chatTitle} - Speed AI` : defaultTitle
		}
	}, [currentChatData])

	/**
	 * 当前角色ID变化时新建会话并将AI助手加入对话中
	 */
	useEffect(() => {
		const assData: any = assistants?.find?.((item: Assistant) => item.id === currentRoleId) || null
		if (assData) {
			setAssistantData(assData)
		} else {
			setAssistantData(null)
		}
	}, [currentRoleId, assistants])

	/**
	 * 会话名称自动生成
	 */
	useEffect(() => {
		const chat =
			(useChatStore as any).getState().messages?.find?.((item: ChatMessages) => item.chatId === currentChatId) || null
		const isNeedGenerateTitle = (useChatStore as any)
			.getState()
			.historys?.some?.((item: ChatDetail) => item.role === 'assistant' && item.createdAt)
		if (!isProcessing && isNeedGenerateTitle && !chat?.isAutoTitle) {
			autoGenerateTitle().then()
		}
	}, [currentChatId, isProcessing])

	/**
	 * 判断是否是新消息
	 */
	const isNewChat = useMemo(() => {
		setError(null)
		return !messages?.some((item: ChatMessages) => item.chatId === currentChatId)
	}, [messages, currentChatId])

	/**
	 * 消息变化时滚动到底部并保存消息
	 */
	useEffect(() => {
		setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
		}, 100)
	}, [historys])

	/**
	 * 监听滚动事件
	 */
	useEffect(() => {
		const observer1 = new IntersectionObserver(([entry]) => {
			requestAnimationFrame(() => {
				const shouldShow = !entry.isIntersecting
				if (scrollTopButtonRef.current) {
					scrollTopButtonRef.current.style.display = shouldShow ? 'block' : 'none'
				}
			})
		})
		const observer2 = new IntersectionObserver(([entry]) => {
			requestAnimationFrame(() => {
				const shouldShow = !entry.isIntersecting
				if (scrollBottomButtonRef.current) {
					scrollBottomButtonRef.current.style.display = shouldShow ? 'block' : 'none'
				}
			})
		})
		if (messagesTopRef.current) observer1.observe(messagesTopRef.current)
		if (messagesEndRef.current) observer2.observe(messagesEndRef.current)
		return () => {
			if (messagesTopRef.current) observer1.unobserve(messagesTopRef.current)
			if (messagesEndRef.current) observer2.unobserve(messagesEndRef.current)
		}
	}, [])

	/**
	 * 自动调整文本区域高度
	 */
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [inputValue])

	/**
	 * 回到顶部
	 */
	const scrollToTop = () => {
		messagesTopRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	/**
	 * 回到底部
	 */
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	/**
	 * 根据内容自动生成标题
	 */
	const autoGenerateTitle = async () => {
		const chat =
			(useChatStore as any).getState().messages?.find?.((item: ChatMessages) => item.chatId === currentChatId) || null
		let lineBuffer = ''
		try {
			const userContent = (useChatStore as any)
				.getState()
				.historys?.find((item: ChatDetail) => item.role === 'user')?.content
			const assistantContent = (useChatStore as any)
				.getState()
				.historys.find((item: ChatDetail) => item.role === 'assistant')?.content
			if (!userContent || !assistantContent) {
				return
			}
			const message = {
				role: 'user',
				content: `USER: ${userContent} \n\nAssistant: ${assistantContent?.slice(0, 400)} \n\n`
			}
			const response: any = await apiFetch('/api/chat', 'POST', {
				body: {
					messages: [message],
					options: {
						autoTitle: true,
						model: setting.model,
						temperature: setting.temperature,
						maxTokens: setting.maxTokens
					}
				}
			})
			await handleResponse(response, (data: any) => {
				if (data.result) {
					const { content } = data.result
					if (data.type === 'middle') {
						lineBuffer += content
						updateMessageTitle(chat.chatId, lineBuffer)
					}
				}
			})
		} catch (err: any) {
			setError('自动生成标题失败：' + err.message)
		} finally {
			if (chat?.chatId && lineBuffer) {
				updateMessageTitle(chat.chatId, lineBuffer, true)
			}
		}
	}

	/**
	 * 处理键盘事件
	 */
	const handleKeyDown = async (e: any) => {
		if (e.nativeEvent.isComposing) {
			return
		}
		if (e.key === 'Enter') {
			if (e.shiftKey) {
				return
			}
			e.preventDefault()
			await handleSendMessage()
		}
	}

	/**
	 * 打开文件选择器
	 */
	const handleOpenFilePicker = () => {
		fileInputRef.current?.click()
	}

	/**
	 * 处理文件选择并上传
	 */
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return
		setIsUploading(true)
		try {
			const newFiles: any[] = []
			for (let i = 0; i < files.length; i++) {
				const file = files[i]
				const text = await file.text()
				newFiles.push({
					id: UUID(),
					content: text,
					name: file.name,
					size: file.size,
					type: file.type
				})
			}
			setUploadedFiles((prev) => [...prev, ...newFiles])
		} catch (err: any) {
			setError('上传文件时发生错误：' + err.message)
		} finally {
			setIsUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	/**
	 * 移除已上传的文件
	 */
	const handleRemoveFile = (id: string) => {
		setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
	}

	/**
	 * 处理发送消息
	 * @param isReSend 是否重新发送
	 */
	const handleSendMessage = async (isReSend: boolean = false) => {
		// 防止重复点击
		if (isProcessing) return

		if (isReSend) {
			// 获取当前历史消息列表
			const currentHistorys: ChatDetail[] = (useChatStore as any).getState().historys || []
			// 重新发送：验证历史消息中存在用户消息
			const hasUserMessage = currentHistorys.some((item: ChatDetail) => item.role === 'user')
			if (!hasUserMessage) {
				setError('未找到可重新发送的用户消息')
				return
			}
			// 清空最后一条 assistant 消息的内容，准备重新生成
			const lastIndex = currentHistorys.length - 1
			if (lastIndex >= 0 && currentHistorys[lastIndex].role === 'assistant') {
				updateMessageChild({
					createdAt: '',
					content: '',
					contents: [],
					finish: undefined
				})
			}
		} else {
			// 正常发送：使用输入框内容
			if (!inputValue.trim()) return
			let userMessage = inputValue.trim()
			const shortcutTitle = inputValue.trim()

			// 如果有上传文件，将文件内容拼接到用户消息
			if (uploadedFiles.length > 0) {
				const contexts: string[] = []
				for (let i = 0; i < uploadedFiles.length; i++) {
					const fname = uploadedFiles[i].name ? `【文件：${uploadedFiles[i].name}】` : ''
					contexts.push(`${fname}\n${uploadedFiles[i].content}`)
				}
				const fileContext = `\n---\n以下是用户上传的文件内容（供参考）：\n${contexts.join('\n---\n')}\n---\n请结合上述文件内容回答用户问题。`
				userMessage += fileContext
			}
			// 构造要添加的消息列表
			const msgList: any[] = [
				{
					role: 'user',
					createdAt: new Date().toISOString(),
					shortcutTitle,
					content: userMessage,
					files: uploadedFiles
				},
				{
					role: 'assistant',
					createdAt: '',
					content: '',
					contents: []
				}
			]
			// 新消息
			if (isNewChat) {
				const newMessage: ChatMessages = {
					chatId: currentChatId,
					createdAt: new Date().toISOString(),
					title: shortcutTitle,
					isAutoTitle: false
				}
				addMessage(newMessage)
				if (assistantData) {
					// 拼接助手提示
					msgList.unshift({
						role: 'system',
						createdAt: new Date().toISOString(),
						content: assistantData.content
					})
				}
			}
			// 添加消息到列表
			msgList.forEach((item: any) => {
				addMessageChild(item)
			})
			// 开始对话后去掉所选择的助手
			clearAssistantData()
			// 清空输入框和已上传的文件
			setInputValue('')
			setUploadedFiles([])
		}
		// 设置处理中状态
		setIsProcessing(true)
		let lineBuffer = ''
		let lineThinkBuffer = ''
		const messageList: any[] = []
		try {
			const chatHistorys: ChatDetail[] = (useChatStore as any).getState().historys?.slice?.(0, -1) || []
			const history = chatHistorys.map?.((e: ChatDetail) => ({ role: e.role, content: e.content })) || []
			abortControllerRef.current = new AbortController()

			// 如果开启了知识库开关：先在前端搜索本地知识库（IndexedDB）
			// 然后将本地搜索结果通过 options.localKnowledgeResults 传递给服务端
			// 服务端会将云端知识库 + 本地知识库合并后注入对话
			let localKnowledgeResults: any[] = []
			if (knowledge) {
				try {
					const lastUserMessage = [...history].reverse().find((m: any) => m.role === 'user')
					const queryText = (lastUserMessage?.content || '') as string
					if (queryText.trim()) {
						const localKB = getLocalKB()
						localKnowledgeResults = await localKB.similaritySearch(queryText, 5)
					}
				} catch (e) {
					console.warn('[useChatContent] 本地知识库搜索失败：', e)
				}
			}

			// 发送消息到 API，携带知识库开关、searchTool、本地知识库结果等
			const response: any = await apiFetch('/api/chat', 'POST', {
				controller: abortControllerRef.current,
				body: {
					messages: [...history],
					options: {
						webSearch,
						searchTool,
						thinking,
						knowledge,
						tools: mcpList.filter((item: any) => item.enabled),
						model: setting.model,
						temperature: setting.temperature,
						maxTokens: setting.maxTokens,
						// 本地知识库搜索结果（服务端会与云端合并）
						localKnowledgeResults
					}
				}
			})
			await handleResponse(response, (data: any) => {
				if (data?.result) {
					const { index, content } = data?.result
					if (index === messageList?.length) {
						lineThinkBuffer = ''
						lineBuffer = ''
						messageList.push({})
					}
					if (data.type === 'think') {
						lineThinkBuffer += content
						messageList[index][data.type] = lineThinkBuffer
					} else if (data.type === 'middle') {
						lineBuffer += content
						messageList[index][data.type] = lineBuffer
						updateMessageChild({ content: lineBuffer })
					} else {
						messageList[index][data.type] = content
					}
					updateMessageChild({ contents: messageList })
				}
			})
		} catch (err: any) {
			// 用户主动取消：不显示错误信息，设置 finish = 'cancel'
			const isCancel = err.name === 'AbortError'
			if (!isCancel) {
				setError(err.message)
			}
			if (messageList?.length === 0) {
				messageList.push({})
			}
			messageList[messageList.length - 1].middle = lineBuffer
			messageList[messageList.length - 1].finish = isCancel ? 'cancel' : 'error'
			updateMessageChild({ contents: messageList, content: lineBuffer })
		} finally {
			setIsProcessing(false)
			const lastMessage: any = { createdAt: new Date().toISOString() }
			updateMessageChild(lastMessage)
			saveMessageChild(currentChatId, lastMessage)
		}
	}

	/**
	 * 取消当前请求
	 */
	const handleCancel = () => {
		abortControllerRef.current?.abort?.()
	}

	/**
	 * 清除助手数据
	 */
	const clearAssistantData = () => {
		updateCurrentRoleId('')
	}

	/**
	 * 重新发送当前消息
	 */
	const reSendText = () => {
		handleSendMessage(true)
	}

	return {
		messagesTopRef,
		messagesEndRef,
		currentChatData,
		historys,
		error,
		inputValue,
		isProcessing,
		scrollTopButtonRef,
		scrollBottomButtonRef,
		textareaRef,
		assistantData,
		uploadedFiles,
		isUploading,
		fileInputRef,
		knowledge,
		setInputValue,
		setIsProcessing,
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
	}
}
