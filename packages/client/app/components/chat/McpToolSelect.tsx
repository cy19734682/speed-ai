import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useMcpStore, useChatStore } from '@/app/store'
import { McpTool } from '@/app/lib/type'
import { models } from '@/app/lib/constant'
import {
	ArrowDownIcon,
	WebSearchIcon,
	CheckMarkIcon,
	ThinkIcon,
	McpSettingIcon,
	KnowledgeIcon
} from '@/app/styles/SvgIcon'
import { useToast } from '@/app/components/commons/Toast'

// 导出逻辑（自定义 Hook）
export function useMcpToolSelect() {
	const toast = useToast()
	const {
		setting,
		webSearch,
		thinking,
		knowledge,
		updateWebSearch,
		updateThinking,
		updateKnowledge
	} = useChatStore()
	const { tools, searchTool } = useMcpStore()

	const [mcpList, setMcpList] = useState<McpTool[]>([])
	const [selectedModel, setSelectedModel] = useState<string>(models[0]?.value || '')

	/**
	 * 初始化持久化状态中的工具列表（防止前后端状态不一致导致页面渲染错误）
	 */
	useEffect(() => {
		setMcpList(tools)
	}, [tools])

	/**
	 * 初始化持久化状态中的对话设置（防止前后端状态不一致导致页面渲染错误）
	 */
	useEffect(() => {
		setSelectedModel(setting.model)
	}, [setting])

	/**
	 * MCP联网搜索中禁用了搜索后，重置webSearch
	 */
	useEffect(() => {
		if (!searchTool?.enabled) {
			updateWebSearch(false)
		}
	}, [searchTool])

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
			updateThinking(true)
		}
	}, [currentModel])

	/**
	 * 切换思考模式状态
	 */
	const toggleThinking = () => {
		updateThinking(!thinking)
	}

	/**
	 * 计算启用的工具数量
	 */
	const enabledToolsCount = useMemo(() => {
		return mcpList.filter((tool) => tool.enabled).length || 0
	}, [mcpList])

	/**
	 * 切换联网搜索状态
	 */
	const toggleWebSearch = () => {
		if (!searchTool?.enabled) {
			return toast.warning('请先在MCP配置中启用联网搜索！')
		}
		updateWebSearch(!webSearch)
	}

	/**
	 * 切换知识库开关
	 */
	const toggleKnowledge = () => {
		updateKnowledge(!knowledge)
	}

	return {
		webSearch,
		thinking,
		knowledge,
		selectedModel,
		mcpList,
		enabledToolsCount,
		currentModel,
		toggleThinking,
		toggleWebSearch,
		toggleKnowledge
	}
}

/**
 * MCP工具选择
 * @param param0
 * @returns
 */
const McpToolSelect: React.FC = () => {
	const { updateTool, updateAllTool } = useMcpStore()
	const { setting, updateSetting } = useChatStore()
	const {
		webSearch,
		thinking,
		knowledge,
		selectedModel,
		mcpList,
		enabledToolsCount,
		currentModel,
		toggleThinking,
		toggleWebSearch,
		toggleKnowledge
	} = useMcpToolSelect()

	const [isModelMenuOpen, setIsModelMenuOpen] = useState<boolean>(false)
	const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false)

	// 模型选择按钮元素
	const modelButtonRef = useRef<HTMLButtonElement>(null)
	// 模型选择按钮元素
	const modelMenuRef = useRef<HTMLDivElement>(null)
	// 工具按钮元素
	const toolsButtonRef = useRef<HTMLButtonElement>(null)
	// 工具弹窗元素
	const toolsRef = useRef<HTMLDivElement>(null)

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
	 * 切换工具启用状态
	 */
	const toggleTool = (tool: McpTool) => {
		updateTool(tool.id, { ...tool, enabled: !tool.enabled })
	}

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

	return (
		<>
			<div className="relative">
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
					<ArrowDownIcon cls={`hidden lg:block ml-1 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
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
			<button
				disabled={!!currentModel.isThink}
				onClick={toggleThinking}
				className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors
											 ${!!currentModel.isThink ? 'cursor-not-allowed' : ''}
											 ${
													thinking
														? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-600'
														: 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-50'
												}`}
				aria-label={thinking ? '关闭思考模式' : '开启思考模式'}
				title={thinking ? '关闭思考模式' : '开启思考模式'}
			>
				<ThinkIcon width={20} height={20} />
			</button>
			{/* 联网搜索按钮 - 图标 */}
			<button
				onClick={toggleWebSearch}
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
			{/* 知识库按钮 - 图标 */}
			<button
				onClick={toggleKnowledge}
				className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
					knowledge
						? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-600'
						: 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-50'
				}`}
				aria-label={knowledge ? '关闭知识库' : '开启知识库'}
				title={knowledge ? '关闭知识库' : '开启知识库'}
			>
				<KnowledgeIcon cls="h-6 w-6" />
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
												className={`w-3 h-3 rounded-full mr-2 ${tool.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
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
		</>
	)
}

export default McpToolSelect