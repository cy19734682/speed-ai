// app/page.js
'use client'

import { useState, useRef, useEffect } from 'react'

export default function AIChatInterface() {
	const [inputValue, setInputValue] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)
	const [useWebSearch, setUseWebSearch] = useState(false)
	const [selectedModel, setSelectedModel] = useState('gpt-4-turbo')
  const [selectedAssistant, setSelectedAssistant] = useState('default');
	const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
	const [chatHistory, setChatHistory] = useState([{ role: 'ai', content: '你好！我是AI助手，请问有什么可以帮您的？' }])
	const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isAssistantMenuOpen, setIsAssistantMenuOpen] = useState(false);
  
	const [tools, setTools] = useState([
		{ id: 'code-interpreter', name: '代码解释器', description: '执行和解释代码', enabled: false },
		{ id: 'document-reader', name: '文档阅读器', description: '阅读和分析文档', enabled: true },
		{ id: 'math-solver', name: '数学求解器', description: '解决数学问题', enabled: false },
		{ id: 'knowledge-graph', name: '知识图谱', description: '查询结构化知识', enabled: true },
		{ id: 'data-visualization', name: '数据可视化', description: '创建图表和图形', enabled: false }
	])

	const textareaRef = useRef(null)
	const toolsRef = useRef(null)
	const toolsButtonRef = useRef(null)
	const modelMenuRef = useRef(null)
	const modelButtonRef = useRef(null)
  const assistantMenuRef = useRef(null);
  const assistantButtonRef = useRef(null);

	const models = [
		{ id: 'gpt-4-turbo', name: 'GPT-4 Turbo', icon: '🤖', color: 'from-indigo-500 to-purple-600' },
		{ id: 'claude-3-opus', name: 'Claude 3 Opus', icon: '🧠', color: 'from-amber-500 to-orange-500' },
		{ id: 'gemini-pro', name: 'Gemini Pro', icon: '✨', color: 'from-blue-500 to-cyan-500' },
		{ id: 'mixtral', name: 'Mixtral 8x7B', icon: '🔮', color: 'from-violet-500 to-fuchsia-500' }
	]
  
  
  // AI助手列表
  const assistants = [
    {
      id: 'default',
      name: '通用助手',
      icon: '👤',
      color: 'from-gray-500 to-gray-700',
      description: '通用问题解答、信息查询和日常对话',
      personality: '专业、友好、乐于助人'
    },
    {
      id: 'tech',
      name: '技术专家',
      icon: '💻',
      color: 'from-blue-500 to-indigo-600',
      description: '编程、系统架构和技术问题解答',
      personality: '逻辑性强、注重细节、技术导向'
    },
    {
      id: 'creative',
      name: '创意伙伴',
      icon: '🎨',
      color: 'from-purple-500 to-pink-600',
      description: '内容创作、故事写作和创意构思',
      personality: '富有想象力、思维开放、善于表达'
    },
    {
      id: 'academic',
      name: '学术助手',
      icon: '📚',
      color: 'from-green-500 to-teal-600',
      description: '学术研究、论文写作和数据分析',
      personality: '严谨、精确、注重事实依据'
    },
    {
      id: 'business',
      name: '商业顾问',
      icon: '💼',
      color: 'from-yellow-500 to-orange-600',
      description: '商业分析、市场策略和财务规划',
      personality: '战略思维、务实、结果导向'
    }
  ];
  
  // 点击外部关闭各种菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) {
        setIsToolsOpen(false);
      }
      
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target) &&
        modelButtonRef.current && !modelButtonRef.current.contains(event.target)) {
        setIsModelMenuOpen(false);
      }
      
      if (assistantMenuRef.current && !assistantMenuRef.current.contains(event.target) &&
        assistantButtonRef.current && !assistantButtonRef.current.contains(event.target)) {
        setIsAssistantMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

	// 自动调整工具列表方向
	useEffect(() => {
		if (isToolsOpen && toolsButtonRef.current) {
			const buttonRect = toolsButtonRef.current.getBoundingClientRect()
			const windowHeight = window.innerHeight

			// 检查按钮下方是否有足够空间显示工具列表
			const spaceBelow = windowHeight - buttonRect.bottom
			const spaceAbove = buttonRect.top

			// 如果下方空间不足，则向上展开
			if (spaceBelow < 300 && spaceAbove > 300) {
				toolsRef.current.classList.add('bottom-full')
				toolsRef.current.classList.remove('top-full')
				toolsRef.current.classList.add('mb-2')
				toolsRef.current.classList.remove('mt-2')
			} else {
				toolsRef.current.classList.add('top-full')
				toolsRef.current.classList.remove('bottom-full')
				toolsRef.current.classList.add('mt-2')
				toolsRef.current.classList.remove('mb-2')
			}
		}
	}, [isToolsOpen])

	const handleSend = () => {
		if (inputValue.trim() === '') return

		// 获取启用的工具
		const enabledTools = tools.filter((tool) => tool.enabled)

		// 添加用户消息到聊天历史
		setChatHistory((prev) => [...prev, { role: 'user', content: inputValue }])

		setIsGenerating(true)
		setInputValue('')

		// 模拟AI响应
		setTimeout(() => {
			let aiResponse = `感谢您的提问！您询问了"${inputValue}"。`

			if (useWebSearch) {
				aiResponse += ' 我已经联网搜索了相关信息。'
			}

			if (enabledTools.length > 0) {
				aiResponse += ` 使用了${enabledTools.length}个工具：${enabledTools.map((t) => t.name).join(', ')}辅助回答。`
			} else {
				aiResponse += ' 基于我的知识进行了回答。'
			}

			setChatHistory((prev) => [...prev, { role: 'ai', content: aiResponse }])
			setIsGenerating(false)
		}, 2000)
	}

	const handleStop = () => {
		setIsGenerating(false)
		setChatHistory((prev) => [...prev, { role: 'system', content: '生成已停止' }])
	}

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const toggleTool = (id) => {
		setTools(tools.map((tool) => (tool.id === id ? { ...tool, enabled: !tool.enabled } : tool)))
	}

	const enableAllTools = () => {
		setTools(tools.map((tool) => ({ ...tool, enabled: true })))
	}

	const disableAllTools = () => {
		setTools(tools.map((tool) => ({ ...tool, enabled: false })))
	}

	const selectModel = (modelId) => {
		setSelectedModel(modelId)
		setIsModelMenuOpen(false)
	}
  
  const selectAssistant = (assistantId) => {
    setSelectedAssistant(assistantId);
    setIsAssistantMenuOpen(false);
  };

	// 自动调整文本区域高度
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [inputValue])

	// 计算启用的工具数量
	const enabledToolsCount = tools.filter((tool) => tool.enabled).length

	// 获取当前模型信息
	const currentModel = models.find((model) => model.id === selectedModel)
  
  // 获取当前助手信息
  const currentAssistant = assistants.find(a => a.id === selectedAssistant);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
			<div className="max-w-4xl mx-auto">
				<header className="text-center mb-8 md:mb-12">
					<h1 className="text-3xl md:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
						AI 智能对话助手
					</h1>
					<p className="mt-3 text-gray-600 max-w-2xl mx-auto">
						支持文本对话、联网搜索和多种工具调用，提供更智能的交互体验
					</p>
				</header>

				<div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
					{/* 聊天历史区域 */}
					<div className="h-[400px] overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
						{chatHistory.map((message, index) => (
							<div
								key={index}
								className={`mb-4 p-4 rounded-xl max-w-[90%] transition-all duration-300 ${
									message.role === 'user'
										? 'bg-gradient-to-r from-blue-50 to-indigo-50 ml-auto border border-blue-100'
										: message.role === 'ai'
											? 'bg-gradient-to-r from-green-50 to-emerald-50 mr-auto border border-green-100'
											: 'bg-yellow-50 mr-auto border border-yellow-100'
								}`}
							>
								<div className="flex items-start">
									<div
										className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 ${
											message.role === 'user'
												? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
												: message.role === 'ai'
													? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
													: 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white'
										}`}
									>
										{message.role === 'user' ? 'U' : message.role === 'ai' ? 'AI' : 'S'}
									</div>
									<div className="text-gray-800">{message.content}</div>
								</div>
							</div>
						))}

						{isGenerating && (
							<div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 mr-auto max-w-[90%] border border-green-100">
								<div className="flex items-start">
									<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center mr-3 flex-shrink-0">
										AI
									</div>
									<div className="flex items-center text-gray-800">
										<span className="font-medium">正在思考中</span>
										<div className="ml-3 flex space-x-1.5">
											<div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce"></div>
											<div
												className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce"
												style={{ animationDelay: '0.2s' }}
											></div>
											<div
												className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce"
												style={{ animationDelay: '0.4s' }}
											></div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* 输入控制区域 - 优化版 */}
					<div className="p-4 border-t border-gray-200">
						{/* 输入框和控制按钮整合在一起 */}
						<div className="flex flex-col border p-2 border-gray-300 rounded-xl shadow-inner bg-white">
							{/* 顶部文本输入区域 */}
							<div className='flex-1 relative'>
								<textarea
									ref={textareaRef}
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="输入消息..."
									className="w-full focus:outline-none resize-none bg-transparent min-h-16 max-h-64"
									rows={1}
									disabled={isGenerating}
								/>
							</div>
							{/* 底部控制区域 */}
							<div className="flex justify-between items-center mt-1">
								{/* 左侧控制按钮组 */}
								<div className="flex items-center pl-2 space-x-1">
                  
                  {/* AI助手选择按钮 */}
                  <div className="relative">
                    <button
                      ref={assistantButtonRef}
                      onClick={() => setIsAssistantMenuOpen(!isAssistantMenuOpen)}
                      className="flex items-center px-2 py-1.5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      aria-label="选择AI助手"
                    >
                      <span className="mr-1">{currentAssistant.icon}</span>
                      <span className="text-xs font-medium hidden md:inline">{currentAssistant.name}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`ml-1 h-4 w-4 transition-transform ${isAssistantMenuOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* AI助手选择菜单 */}
                    {isAssistantMenuOpen && (
                      <div
                        ref={assistantMenuRef}
                        className="absolute bottom-full left-0 mb-2 w-56 z-30 bg-white border border-gray-200 rounded-lg shadow-lg"
                      >
                        <div className="p-2">
                          <h3 className="text-xs font-medium text-gray-700 mb-1">选择AI助手角色</h3>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {assistants.map(assistant => (
                              <button
                                key={assistant.id}
                                onClick={() => selectAssistant(assistant.id)}
                                className={`w-full flex items-start p-2 text-sm rounded-md ${
                                  selectedAssistant === assistant.id
                                    ? 'bg-gradient-to-r from-gray-50 to-blue-50 text-indigo-700 font-medium'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span className="text-lg mr-2">{assistant.icon}</span>
                                <div className="text-left">
                                  <div className="font-medium">{assistant.name}</div>
                                  <div className="text-xs text-gray-500">{assistant.description}</div>
                                </div>
                                {selectedAssistant === assistant.id && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto h-4 w-4 text-green-500 mt-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
									{/* 模型选择按钮 - 整合到输入框 */}
									<div className="relative">
										<button
											ref={modelButtonRef}
											onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
											className="flex items-center px-2 py-1.5 rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
											aria-label="选择模型"
										>
											<span className="mr-1">{currentModel.icon}</span>
											<span className="text-xs font-medium hidden md:inline">{currentModel.name}</span>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className={`ml-1 h-4 w-4 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`}
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
													clipRule="evenodd"
												/>
											</svg>
										</button>

										{/* 模型选择菜单 - 模拟下拉列表 */}
										{isModelMenuOpen && (
											<div
												ref={modelMenuRef}
												className="absolute bottom-full left-0 mb-2 w-48 z-20 bg-white border border-gray-200 rounded-lg shadow-lg"
											>
												<div className="p-2">
													<h3 className="text-xs font-medium text-gray-700 mb-1">选择模型</h3>
													<div className="space-y-1">
														{models.map((model) => (
															<button
																key={model.id}
																onClick={() => selectModel(model.id)}
																className={`w-full flex items-center p-2 text-sm rounded-md ${
																	selectedModel === model.id
																		? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-medium'
																		: 'hover:bg-gray-50 text-gray-700'
																}`}
															>
																<span className="mr-2">{model.icon}</span>
																<span>{model.name}</span>
																{selectedModel === model.id && (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		className="ml-auto h-4 w-4 text-green-500"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																	>
																		<path
																			fillRule="evenodd"
																			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																			clipRule="evenodd"
																		/>
																	</svg>
																)}
															</button>
														))}
													</div>
												</div>
											</div>
										)}
									</div>

									{/* 联网搜索按钮 - 图标 */}
									<button
										onClick={() => setUseWebSearch(!useWebSearch)}
										className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
											useWebSearch
												? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-600'
												: 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-50'
										}`}
										aria-label={useWebSearch ? '关闭联网搜索' : '开启联网搜索'}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
											/>
										</svg>
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
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>

											{enabledToolsCount > 0 && (
												<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">
													{enabledToolsCount}
												</span>
											)}
										</button>

										{isToolsOpen && (
											<div
												ref={toolsRef}
												className="absolute z-10 w-72 max-h-[50vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
											>
												<div className="sticky top-0 p-3 border-b border-gray-200 bg-white z-10">
													<div className="flex justify-between items-center">
														<h3 className="text-sm font-medium text-gray-800">可用工具</h3>
														<div className="flex space-x-1">
															<button
																onClick={enableAllTools}
																className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
															>
																全选
															</button>
															<button
																onClick={disableAllTools}
																className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
															>
																清空
															</button>
														</div>
													</div>
												</div>
												<div className="divide-y divide-gray-100">
													{tools.map((tool) => (
														<div
															key={tool.id}
															className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
															onClick={() => toggleTool(tool.id)}
														>
															<div>
																<div className="flex items-center">
																	<div
																		className={`w-3 h-3 rounded-full mr-2 ${tool.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
																	></div>
																	<span className="text-sm font-medium text-gray-800">{tool.name}</span>
																</div>
																<p className="text-xs text-gray-500 ml-5 mt-1">{tool.description}</p>
															</div>
															<div className="relative">
																<input
																	type="checkbox"
																	className="sr-only"
																	checked={tool.enabled}
																	onChange={() => toggleTool(tool.id)}
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
									{/* 清空按钮 */}
									{inputValue && (
										<button
											onClick={() => setInputValue('')}
											className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
											disabled={isGenerating}
											aria-label="清空输入"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									)}

									{/* 发送/停止按钮 */}
									{isGenerating ? (
										<button
											onClick={handleStop}
											className="ml-1 p-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg flex items-center transition-all shadow-md hover:shadow-lg"
											aria-label="停止生成"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									) : (
										<button
											onClick={handleSend}
											disabled={inputValue.trim() === ''}
											className={`ml-1 p-2 rounded-lg flex items-center transition-all shadow-md ${
												inputValue.trim() === ''
													? 'bg-gray-300 text-gray-500 cursor-not-allowed'
													: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-lg'
											}`}
											aria-label="发送消息"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									)}
								</div>
							</div>
						</div>

						<div className="mt-3 text-xs text-gray-500 flex justify-between">
							<div>按 Enter 发送，Shift + Enter 换行</div>
							<div className="flex items-center">
								<span className="mr-2">当前配置:</span>
								<span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-xs">{currentModel.name}</span>
								{useWebSearch && (
									<span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-md text-xs ml-1">联网搜索</span>
								)}
								{enabledToolsCount > 0 && (
									<span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-xs ml-1">
										{enabledToolsCount}个工具
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="mt-8 text-center text-gray-600 text-sm">
					<p>AI对话输入框组件 - 包含文本输入、模型切换、联网搜索、多工具调用等功能</p>
				</div>
			</div>
		</div>
	)
}
