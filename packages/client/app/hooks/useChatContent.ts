import { useState, useEffect, useMemo, useRef } from 'react'
import { apiFetch } from '@/app/lib/api/fetch'
import { handleResponse, UUID } from '@/app/lib/util'
import { useChatStore, useMcpStore, useChatAssistantStore } from '@/app/store'
import { Message, ChatMessages, McpTool, Assistant } from '@/app/lib/type'
import { models } from '@/app/lib/constant'
import { useToast } from '@/app/components/commons/Toast'

export default function useChatContent() {
	const toast = useToast()
	const {
		setting,
		messages,
		currentChatId,
		currentRoleId,
		updateSetting,
		createCurrentChatId,
		addMessage,
		addMessageChild,
		updateMessageChild,
		updateMessageTitle,
		updateCurrentRoleId
	} = useChatStore()
	const { tools, searchTool, updateTool, updateAllTool } = useMcpStore()
	const { assistants } = useChatAssistantStore()

	const [inputValue, setInputValue] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [chatData, setChatData] = useState<ChatMessages | null>(null)
	const [webSearch, setWebSearch] = useState<boolean>(false)
	const [thinking, setThinking] = useState<boolean>(false)
	const [selectedModel, setSelectedModel] = useState<string>('deepseek-chat')
	const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false)
	const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false)
	const [mcpList, setMcpList] = useState<McpTool[]>([])
	const [assistantData, setAssistantData] = useState<Assistant | null>(null)

	const abortControllerRef = useRef<any>(null)
	// 顶部可见元素
	const messagesTopRef = useRef<HTMLDivElement>(null)
	// 底部可见元素
	const messagesEndRef = useRef<HTMLDivElement>(null)
	// 按钮元素引用(不使用useState的原因是messagesTopRef/messagesEndRef组件和列表位于同一父元素，会频繁重新渲染)
	const scrollTopButtonRef = useRef<HTMLButtonElement>(null)
	const scrollBottomButtonRef = useRef<HTMLButtonElement>(null)
	// 模型选择按钮元素
	const modelButtonRef = useRef<HTMLButtonElement>(null)
	// 模型选择按钮元素
	const modelMenuRef = useRef<HTMLDivElement>(null)
	// 工具按钮元素
	const toolsButtonRef = useRef<HTMLButtonElement>(null)
	// 工具弹窗元素
	const toolsRef = useRef<HTMLDivElement>(null)
	// 输入框元素
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	/**
	 * 当前对话ID和对话列表变化时更新聊天数据
	 */
	useEffect(() => {
		const chat = messages?.find?.((item: ChatMessages) => item.chatId === currentChatId) || null
		if (chat) {
			setChatData(chat)
		} else {
			setChatData(null)
		}
	}, [messages, currentChatId])

	/**
	 * 当前角色ID变化时新建会话并将AI助手加入对话中
	 */
	useEffect(() => {
		const assData = assistants?.find?.((item: Assistant) => item.id === currentRoleId) || null
		if (assData) {
			setAssistantData(assData)
		} else {
			setAssistantData(null)
		}
	}, [currentRoleId])

	/**
	 * 会话名称自动生成
	 */
	useEffect(() => {
		const chat = useChatStore.getState().messages?.find?.((item: ChatMessages) => item.chatId === currentChatId) || null
		const isNeedGenerateTitle = chat?.list?.some?.((item: ChatMessages) => item.role === 'assistant' && item.createdAt)
		if (!isProcessing && isNeedGenerateTitle && !chat?.isAutoTitle) {
			autoGenerateTitle().then()
		}
	}, [currentChatId, isProcessing])

	/**
	 * 初始化持久化状态中的对话设置
	 */
	useEffect(() => {
		setSelectedModel(setting.model)
	}, [setting])

	/**
	 * MCP联网搜索中禁用了搜索后，重置webSearch
	 */
	useEffect(() => {
		if (!searchTool?.enabled) {
			setWebSearch(false)
		}
	}, [searchTool])

	/**
	 * 初始化持久化状态中的工具列表
	 */
	useEffect(() => {
		setMcpList(tools)
	}, [tools])

	/**
	 * 计算启用的工具数量
	 */
	const enabledToolsCount = useMemo(() => {
		return mcpList.filter((tool) => tool.enabled).length || 0
	}, [mcpList])

	/**
	 * 判断是否是新消息
	 */
	const isNewChat = useMemo(() => {
		setError(null)
		return !messages?.some((item: ChatMessages) => item.chatId === currentChatId)
	}, [messages, currentChatId])

	/**
	 * 当前模型对象
	 */
	const currentModel: any = useMemo(() => {
		return models.find((item) => item.value === selectedModel) || {}
	}, [selectedModel])

	/**
	 * 判断当前模式是否本身支持思考，支持则设置thinking为true
	 */
	useEffect(() => {
		if (currentModel?.isThink) {
			setThinking(true)
		}
	}, [currentModel])

	/**
	 * 初始化时判断是否存在当前聊天ID，不存在则创建
	 */
	useEffect(() => {
		if (!messages?.some((item: ChatMessages) => item.chatId === currentChatId)) {
			createCurrentChatId()
		}
	}, [])

	/**
	 * 消息变化时滚动到底部并保存消息
	 */
	useEffect(() => {
		setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
		}, 100)
	}, [messages])

	/**
	 * 监听滚动事件
	 */
	useEffect(() => {
		// 创建第一个观察器
		const observer1 = new IntersectionObserver(([entry]) => {
			requestAnimationFrame(() => {
				const shouldShow = !entry.isIntersecting
				if (scrollTopButtonRef.current) {
					scrollTopButtonRef.current.style.display = shouldShow ? 'block' : 'none'
				}
			})
		})
		// 创建第二个观察器
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
	 * 点击外部关闭工具列表
	 */
	useEffect(() => {
		const handleClickOutside = (event: any) => {
			if (
				toolsRef.current &&
				!toolsRef.current.contains(event.target) &&
				toolsButtonRef.current &&
				!toolsButtonRef.current.contains(event.target)
			) {
				setIsToolsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	/**
	 * 点击外部关闭模型选择列表
	 */
	useEffect(() => {
		const handleClickOutside = (event: any) => {
			if (
				modelMenuRef.current &&
				!modelMenuRef.current.contains(event.target) &&
				modelButtonRef.current &&
				!modelButtonRef.current.contains(event.target)
			) {
				setIsModelMenuOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
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
		// 直接访问 store 实例 获取最新状态
		const chat = useChatStore.getState().messages?.find?.((item: ChatMessages) => item.chatId === currentChatId) || null
		try {
			const userContent = chat.list.find((item: ChatMessages) => item.role === 'user')?.content
			const assistantContent = chat.list.find((item: ChatMessages) => item.role === 'assistant')?.content
			if (!userContent || !assistantContent) {
				return
			}
			const message = {
				role: 'user',
				content: `USER: ${userContent} \n\nAssistant: ${assistantContent?.slice(0, 400)} \n\n`
			}
			// 将消息发送到 API
			const response: any = await apiFetch('/api/chat', 'POST', {
				method: 'POST',
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
			let lineBuffer = ''
			await handleResponse(response, (data: any) => {
				if (data.result) {
					const { content } = data.result
					lineBuffer += content
					updateMessageTitle(chat.chatId, lineBuffer)
				}
			})
		} catch (error: any) {
			setError('自动生成标题失败：' + error.message)
		}
	}

	/**
	 * 处理发送消息
	 */
	const handleSendMessage = async () => {
		if (!inputValue.trim() || isProcessing) return
		const userMessage = inputValue.trim()
		setInputValue('')
		setIsProcessing(true)
		// 新消息
		if (isNewChat) {
			const msgList: any[] = [
				{
					chatId: UUID(),
					role: 'user',
					createdAt: new Date().toISOString(),
					content: userMessage
				},
				{
					chatId: UUID(),
					role: 'assistant',
					createdAt: '',
					content: ''
				}
			]
			if (assistantData) {
				// 拼接助手提示
				msgList.unshift({
					chatId: UUID(),
					role: 'system',
					createdAt: new Date().toISOString(),
					content: assistantData.prompt
				})
			}
			const newMessage: ChatMessages = {
				chatId: currentChatId,
				createdAt: new Date().toISOString(),
				title: userMessage,
				isAutoTitle: false,
				list: msgList
			}
			addMessage(newMessage)
		} else {
			addMessageChild(currentChatId, {
				chatId: UUID(),
				role: 'user',
				createdAt: new Date().toISOString(),
				content: userMessage
			})
			addMessageChild(currentChatId, {
				chatId: UUID(),
				role: 'assistant',
				createdAt: new Date().toISOString(),
				contents: []
			})
		}
		// 开始对话后去掉所选择的助手
		clearAssistantData()
		// 直接访问 store 实例 获取最新状态
		const chat = useChatStore.getState().messages?.find?.((item: ChatMessages) => item.chatId === currentChatId) || null
		let lineBuffer = ''
		let lineThinkBuffer = ''
		const messageList: any[] = []
		try {
			const history = chat?.list?.slice?.(0, -1).map?.((e: Message) => ({ role: e.role, content: e.content })) || []
			abortControllerRef.current = new AbortController()
			// 将消息发送到 API
			const response: any = await apiFetch('/api/chat', 'POST', {
				method: 'POST',
				controller: abortControllerRef.current,
				body: {
					messages: [...history],
					options: {
						webSearch,
						searchTool,
						thinking,
						tools: mcpList.filter((item: McpTool) => item.enabled),
						model: setting.model,
						temperature: setting.temperature,
						maxTokens: setting.maxTokens
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
					/**
					 * type 类型
					 * 普通对话：middle
					 * 深度思考：think
					 * 思考时间：time
					 * 联网搜索结果：search
					 * 工具调用结果：tools
					 */
					if (data.type === 'think') {
						lineThinkBuffer += content
						messageList[index][data.type] = lineThinkBuffer
					} else if (data.type === 'middle') {
						lineBuffer += content
						messageList[index][data.type] = lineBuffer
						// 将AI正式回答写入缓存，方便后续使用
						updateMessageChild(chat.chatId, { content: lineBuffer })
					} else {
						messageList[index][data.type] = content
					}
					updateMessageChild(chat.chatId, { contents: messageList })
				}
			})
		} catch (error: any) {
			setError(error.message)
			messageList[messageList.length - 1].content = lineBuffer + `\n\n⚠️ =====异常结束=====`
			updateMessageChild(chat.chatId, { contents: messageList })
		} finally {
			//请求结束
			setIsProcessing(false)
			updateMessageChild(chat.chatId, { createdAt: new Date().toISOString() })
		}
	}

	/**
	 * 取消当前请求
	 */
	const handleCancel = () => {
		abortControllerRef.current?.abort?.()
	}

	/**
	 * 切换工具启用状态
	 */
	const toggleTool = (tool: McpTool) => {
		updateTool(tool.id, { ...tool, enabled: !tool.enabled })
	}

	/**
	 * 切换联网搜索状态
	 */
	const toggleWenSearch = () => {
		if (!searchTool?.enabled) {
			return toast.warning('请先在MCP配置中启用联网搜索！')
		}
		setWebSearch(!webSearch)
	}

	/**
	 * 切换思考模式状态
	 */
	const toggleThinking = () => {
		setThinking(!thinking)
	}

	/**
	 * 选择模型
	 */
	const selectModel = (model: string) => {
		updateSetting({ ...setting, model })
	}

	/**
	 * 全选或取消所有工具
	 */
	const disEnableAllTools = (enabled: boolean) => {
		updateAllTool(mcpList.map((tool) => ({ ...tool, enabled })))
	}

	/**
	 * 清除助手数据
	 */
	const clearAssistantData = () => {
		updateCurrentRoleId(null)
	}

	return {
		messagesTopRef,
		messagesEndRef,
		chatData,
		error,
		inputValue,
		isProcessing,
		scrollTopButtonRef,
		scrollBottomButtonRef,
		setting,
		webSearch,
		thinking,
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
		setIsProcessing,
		setError,
		handleSendMessage,
		handleCancel,
		scrollToTop,
		scrollToBottom,
		toggleWenSearch,
		toggleThinking,
		selectModel,
		setIsToolsOpen,
		disEnableAllTools,
		toggleTool,
		setIsModelMenuOpen,
		clearAssistantData
	}
}
