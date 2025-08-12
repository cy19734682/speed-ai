import React, { useEffect, useRef, useState } from 'react'
import { useMcpStore, useGeneralStore } from '@/app/store'
import { McpTool } from '@/app/lib/type'
import { UUID } from '@/app/lib/util'
import { AddMarkIcon } from '@/app/styles/SvgIcon'
import { apiFetch } from '@/app/lib/api/fetch'
import Modal from '@/app/components/commons/Modal'
import { useToast } from '@/app/components/commons/Toast'
import {useConfirm} from "@/app/components/commons/Confirm"

const initialData = {
	id: '',
	code: '',
	name: '',
	url: '',
	tag: '',
	description: '',
	accessToken: '',
	enabled: false
}

/**
 * MCP工具设置组件
 * @constructor
 */
const McpSettingsModel: React.FC<any> = () => {
	const toast = useToast()
  const { confirm } = useConfirm()
	const { isModalMcpOpen, setIsModalMcpOpen } = useGeneralStore()
	const { tools, searchTool, addTool, removeTool, updateTool, updateSearchTool } = useMcpStore()

	const [isChildModalOpen, setIsChildModalOpen] = useState(false)
	const [mcpList, setMcpList] = useState<McpTool[]>([])
	const [mcpData, setMcpData] = useState<McpTool>(initialData)

	const closeModal = () => setIsModalMcpOpen(false)

	useEffect(() => {
		setMcpList(tools)
	}, [tools])

	/**
	 * 切换工具启用状态
	 */
	const toggleTool = (tool: McpTool) => {
		updateTool(tool.id, { ...tool, enabled: !tool.enabled })
	}

	/**
	 * 切换工具启用状态
	 */
	const toggleSearchTool = (tool: McpTool) => {
		updateSearchTool({ ...tool, enabled: !tool.enabled })
	}

	/**
	 * 新增、编辑MCP
	 */
	const McpAddOpenModel = ({ isOpen, item, onClose }: { isOpen: boolean; item: McpTool; onClose: () => void }) => {
		const [mcpTool, setMcpTool] = useState<McpTool>(item)
		const [childTools, setChildTools] = useState<any[]>([])
		const [testLoading, setTestLoading] = useState<boolean>(false)
		const isDelete = mcpTool?.id && mcpTool?.id !== 'web_search'
		const toolListRef = useRef<HTMLDivElement>(null)

		useEffect(() => {
			setMcpTool(item)
		}, [item])

		// 表单输入赋值
		const handleChange = (name: string, value: any) => {
			setMcpTool((prev) => ({ ...prev, [name]: value }))
		}

		// 表单提交
		const handleSubmit = () => {
			if (!mcpTool?.code?.trim()) {
				return toast.warning('编码不能为空')
			}
			if (!mcpTool?.name?.trim()) {
				return toast.warning('名称不能为空')
			}
			if (!mcpTool?.url?.trim()) {
				return toast.warning('URL不能为空')
			}
			if (!mcpTool?.tag?.trim()) {
				return toast.warning('标签不能为空')
			}
			if (!mcpTool?.url?.trim()?.startsWith('http')) {
				return toast.warning('URL格式不正确')
			}
			if (!(childTools.length > 0)) {
				return toast.warning('请先测试MCP连接是否可用！')
			}
			if (mcpTool.id === 'web_search') {
				updateSearchTool({ ...mcpTool, id: searchTool.id })
				toast.success('编辑成功')
			} else if (mcpTool.id) {
				updateTool(mcpTool.id, { ...mcpTool })
				toast.success('编辑成功')
			} else {
				if (childTools?.some((e: McpTool) => e?.code === mcpTool?.code)) {
					return toast.error('MCP编码已存在！')
				}
				addTool({ ...mcpTool, id: UUID() })
				toast.success('添加成功')
			}
			onClose()
		}

		// 删除操作
		const handleRemove = () => {
      confirm({
        title: '删除确认',
        content: '您确定要删除此工具吗？此操作不可撤销。',
        submitConfirm: () => {
          removeTool(mcpTool.id)
          onClose()
          toast.success('删除成功')
        }
      })
		}

		// 测试操作
		const handleTest = async () => {
			setTestLoading(true)
			try {
				if (!mcpTool?.url?.trim()) {
					return toast.warning('URL不能为空')
				}
				if (!mcpTool?.url?.trim()?.startsWith('http')) {
					return toast.warning('URL格式不正确')
				}
				const ret = await apiFetch('/api/tools', 'POST', { body: mcpTool })
				const tool = await ret.json()
				setChildTools(tool)
				setTimeout(() => {
					toolListRef.current?.scrollIntoView({ behavior: 'smooth' })
				}, 100)
			} catch (e: any) {
				toast.error('连接错误：' + (e?.message || e))
			} finally {
				setTestLoading(false)
			}
		}

		const customFooter = (
			<div className={`relative w-full flex ${isDelete ? 'justify-between' : 'justify-end'}`}>
				{isDelete && (
					<button className="block px-2 rounded-lg text-sm btn-error" onClick={handleRemove}>
						删除
					</button>
				)}
				<div className="flex justify-between">
					<button
						className={`block px-4 py-2 rounded-lg mr-2 ${testLoading ? 'btn-disabled' : 'btn-info'}`}
						onClick={handleTest}
					>
						测试
					</button>
					<button className="block px-4 py-2 rounded-lg btn-primary" onClick={handleSubmit}>
						提交
					</button>
				</div>
			</div>
		)

		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				title={mcpTool?.id ? '编辑MCP' : '添加MCP'}
				footer={customFooter}
				className="w-[750px]"
			>
				<div className="flex-1 px-2 flex flex-col items-center justify-between">
					<div className="relative w-full pt-4 lg:pt-6 space-y-4">
						<label className="block">
							<span className="block font-semibold mb-2">
								<span className="text-red-500">*</span>编码
							</span>
							<input
								type="text"
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入MCP编码"
								value={mcpTool?.code}
								onChange={(e) => handleChange('code', e.target.value)}
							/>
						</label>
						<label className="block">
							<span className="block font-semibold mb-2">
								<span className="text-red-500">*</span>名称
							</span>
							<input
								type="text"
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入MCP名称"
								value={mcpTool?.name}
								onChange={(e) => handleChange('name', e.target.value)}
							/>
						</label>
						<label className="block">
							<span className="block font-semibold mb-2">
								<span className="text-red-500">*</span>标签
							</span>
							<input
								type="text"
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入标签"
								value={mcpTool?.tag}
								onChange={(e) => handleChange('tag', e.target.value)}
							/>
						</label>
						<label className="block">
							<span className="block font-semibold mb-2">
								<span className="text-red-500">*</span>URL
							</span>
							<input
								type="text"
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="https://..."
								value={mcpTool?.url}
								onChange={(e) => handleChange('url', e.target.value)}
							/>
						</label>
						<label className="block">
							<span className="block font-semibold mb-2">描述</span>
							<textarea
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入工具描述"
								value={mcpTool?.description}
								onChange={(e) => handleChange('description', e.target.value)}
							/>
						</label>
						<label className="block">
							<span className="block font-semibold mb-2">访问令牌</span>
							<textarea
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入访问令牌"
								value={mcpTool?.accessToken}
								onChange={(e) => handleChange('accessToken', e.target.value)}
							/>
						</label>
					</div>
				</div>
				{childTools?.length > 0 && (
					<div className="w-full mt-4" ref={toolListRef}>
						<h2 className="text-lg font-semibold mb-2">工具列表</h2>
						<div className="flex justify-start flex-wrap">
							{childTools?.map?.((tool: McpTool, index: number) => (
								<div
									className="border border-blue-200 text-blue-600 rounded p-1 mr-2 mb-2 cursor-pointer"
									key={'tool-' + index}
									title={tool.description}
								>
									{tool.name}
								</div>
							))}
						</div>
					</div>
				)}
			</Modal>
		)
	}
	const mcpAddOpenModel = McpAddOpenModel({
		isOpen: isChildModalOpen,
		item: mcpData,
		onClose: () => setIsChildModalOpen(false)
	})

	return (
		<>
			<Modal isOpen={isModalMcpOpen} onClose={closeModal} title="MCP服务器管理" className="w-[850px]">
				<div className="min-h-[400px] flex-1 overflow-auto px-2">
					<div className="mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-x-5">
						<div className="border border-dashed rounded p-3 flex justify-center items-center">
							<button
								className="text-sm px-3 py-2 btn-primary text-white rounded-md shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center"
								onClick={() => {
									setMcpData(initialData)
									setIsChildModalOpen(true)
								}}
							>
								<AddMarkIcon />
								<span>添加MCP</span>
							</button>
						</div>
						<div className="border border-dashed rounded p-3 space-y-3">
							<div className="flex justify-between" title={searchTool.name}>
								<span className="bg-red-100 text-red-500 p-1 text-xs rounded ">联网</span>
								<div className="flex-1 pl-1 text-[15px] truncate">{searchTool.name}</div>
								<div
									className="relative cursor-pointer"
									onClick={() => {
										if (searchTool.url) {
											toggleSearchTool(searchTool)
										}
									}}
								>
									<input
										type="checkbox"
										className="sr-only"
										checked={searchTool.enabled}
										onChange={() => {
											if (searchTool.url) {
												toggleSearchTool(searchTool)
											}
										}}
									/>
									<div
										className={`block w-10 h-5 rounded-full transition-colors ${
											searchTool.enabled ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-300'
										}`}
									></div>
									<div
										className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow ${
											searchTool.enabled ? 'transform translate-x-5' : ''
										}`}
									></div>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="w-[85%] text-xs line-clamp-2 text-gray-500">{searchTool.description}</span>
								<span
									className="text-blue-500 hover:text-blue-300 text-sm cursor-pointer"
									onClick={() => {
										setMcpData(searchTool)
										setIsChildModalOpen(true)
									}}
								>
									编辑
								</span>
							</div>
						</div>
						{mcpList?.map?.((tool: McpTool, index: number) => (
							<div className="border border-dashed rounded p-3 space-y-3" key={tool?.id + index}>
								<div className="flex justify-between" title={tool.name}>
									<span className="bg-blue-100 text-blue-500 p-1 text-xs rounded flex-shrink-0">{tool.tag}</span>
									<div className="truncate flex-1 pl-1 text-[15px]">{tool.name}</div>
									<div className="relative cursor-pointer" onClick={() => toggleTool(tool)}>
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
								<div className="flex items-start justify-between">
									<span className="w-[85%] text-xs line-clamp-2 text-gray-500">{tool.description}</span>
									<span
										className="text-blue-500 hover:text-blue-300 text-sm cursor-pointer"
										onClick={() => {
											setMcpData(tool)
											setIsChildModalOpen(true)
										}}
									>
										编辑
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</Modal>
			{mcpAddOpenModel}
		</>
	)
}
export default McpSettingsModel
