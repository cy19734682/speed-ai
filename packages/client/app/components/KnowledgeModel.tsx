import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useGeneralStore } from '@/app/store'
import { apiFetch } from '@/app/lib/api/fetch'
import { Knowledge } from '@/app/lib/type'
import Modal from '@/app/components/commons/Modal'
import { AddMarkIcon } from '@/app/styles/SvgIcon'
import { useToast } from '@/app/components/commons/Toast'
import { useConfirm } from '@/app/components/commons/Confirm'

const initialData: Knowledge = {
	id: '',
	name: '',
	tags: '',
	description: '',
	content: ''
}

const PAGE_SIZE = 8

/**
 * 知识库管理
 * 支持：手动录入 / 文件导入 / 分页列表
 */
const KnowledgeModel: React.FC<any> = () => {
	const toast = useToast()
	const { confirm } = useConfirm()
	const { isModalKnowledgeOpen, setIsModalKnowledgeOpen } = useGeneralStore()

	const [isChildModalOpen, setIsChildModalOpen] = useState(false)
	const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([])
	const [knowledgeData, setKnowledgeData] = useState<Knowledge>(initialData)
	const [currentPage, setCurrentPage] = useState<number>(1)
	const [totalPages, setTotalPages] = useState<number>(1)
	const [total, setTotal] = useState<number>(0)
	const [loading, setLoading] = useState<boolean>(false)

	const closeModal = () => setIsModalKnowledgeOpen(false)

	// 从 knowledges.ts 的 listDocuments 拉取分页数据
	const fetchKnowledgeList = useCallback(
		async (page: number = currentPage) => {
			setLoading(true)
			try {
				const resp = await apiFetch(`/api/knowledge?page=${page}&pageSize=${PAGE_SIZE}`, 'GET')
				const { success, data } = await resp.json()
				if (success && data) {
					setKnowledgeList(
						(data?.data || []).map((item: any) => ({
							...item,
							...(item?.metadata || {})
						}))
					)
					setTotalPages(data?.totalPages || 1)
					setTotal(data?.total || 0)
					setCurrentPage(data?.page || page)
				}
			} catch (err: any) {
				toast.error('加载失败：' + (err?.message || err))
			} finally {
				setLoading(false)
			}
		},
		[currentPage, toast]
	)

	useEffect(() => {
		if (isModalKnowledgeOpen) {
			fetchKnowledgeList(1)
		}
	}, [isModalKnowledgeOpen])

	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages || page === currentPage) return
		setCurrentPage(page)
		fetchKnowledgeList(page)
	}

	/**
	 * 新增/编辑知识库
	 */
	const KnowledgeAddOpenModel = ({
		isOpen,
		item,
		onClose
	}: {
		isOpen: boolean
		item: Knowledge
		onClose: () => void
	}) => {
		const [knowledgeData, setKnowledgeData] = useState<Knowledge>(item)
		const fileInputRef2 = useRef<HTMLInputElement>(null)

		useEffect(() => {
			setKnowledgeData(item)
		}, [item])

		const handleChange = (name: string, value: any) => {
			setKnowledgeData((prev) => ({ ...prev, [name]: value }))
		}

		// 读取本地文件内容并自动填充
		const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files
			if (!files || files.length === 0) return
			const file = files[0]
			try {
				const text = await file.text()
				setKnowledgeData((prev) => ({
					...prev,
					name: prev.name?.trim() ? prev.name : file.name.replace(/\.[^.]+$/, ''),
					content: text
				}))
				toast.success(`已读取文件：${file.name}`)
			} catch (err) {
				toast.error('文件读取失败')
			} finally {
				if (fileInputRef2.current) fileInputRef2.current.value = ''
			}
		}

		const handleSubmit = async () => {
			if (!knowledgeData?.name?.trim()) {
				return toast.error('名称不能为空')
			}
			if (!knowledgeData?.tags?.trim()) {
				return toast.error('标签不能为空')
			}
			if (!knowledgeData?.description?.trim()) {
				return toast.error('简介不能为空')
			}
			if (!knowledgeData?.content?.trim()) {
				return toast.error('内容不能为空')
			}
			try {
				if (knowledgeData.id) {
					// 编辑：调用 PUT 更新
					const resp = await apiFetch('/api/knowledge', 'PUT', {
						body: {
							id: knowledgeData.id,
							name: knowledgeData.name,
							tags: knowledgeData.tags,
							description: knowledgeData.description,
							content: knowledgeData.content,
							updatedAt: new Date().toISOString()
						}
					})
					const { success, error } = await resp.json()
					if (success) {
						toast.success('修改成功并已重新索引')
						// 刷新列表
						fetchKnowledgeList(currentPage)
						onClose()
					} else {
						toast.error('修改失败：' + (error || '未知错误'))
					}
				} else {
					if (knowledgeList?.some((e: Knowledge) => e?.name === knowledgeData?.name)) {
						return toast.warning('知识库名称已存在！')
					}
					const resp = await apiFetch('/api/knowledge', 'POST', {
						body: {
							name: knowledgeData.name,
							tags: knowledgeData.tags,
							description: knowledgeData.description,
							content: knowledgeData.content
						}
					})
					const { data } = await resp.json()
					if (data?.id) {
						toast.success('添加成功并已索引到向量库')
						// 刷新列表（从第一页开始，以便看到新加入的条目）
						fetchKnowledgeList(1)
						onClose()
					}
				}
			} catch (err: any) {
				toast.error('操作失败：' + (err?.message || err))
			}
		}

		const handleRemove = () => {
			confirm({
				title: '删除确认',
				content: '您确定要删除此知识库吗？此操作不可撤销。',
				submitConfirm: async () => {
					const resp = await apiFetch(`/api/knowledge?id=${encodeURIComponent(knowledgeData.id)}`, 'DELETE')
					const { success, error } = await resp.json()
					if (success) {
						toast.success('删除成功')
						// 刷新当前页；如果当前页变空，返回上一页
						const pageAfterDelete = knowledgeList.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage
						fetchKnowledgeList(pageAfterDelete)
						onClose()
					} else {
						toast.error('删除失败：' + (error || '未知错误'))
					}
				}
			})
		}

		const customFooter = (
			<div className={`relative w-full mt-8 flex ${knowledgeData?.id ? 'justify-between' : 'justify-end'}`}>
				{knowledgeData?.id && (
					<button className="block px-2 rounded-lg text-sm btn-error" onClick={handleRemove}>
						删除
					</button>
				)}
				<div className="flex justify-between">
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
				title={knowledgeData?.id ? '编辑知识库' : '添加知识库'}
				footer={customFooter}
				className="w-[750px]"
			>
				<div className="min-h-[400px] flex-1 overflow-auto px-2 flex flex-col items-center justify-between">
					<div className="relative w-full pt-4 lg:pt-6 space-y-4">
						<label className="block">
							<span className="block font-semibold mb-2">
								<span className="text-red-500">*</span>名称
							</span>
							<input
								type="text"
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入知识库名称"
								value={knowledgeData?.name || ''}
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
								placeholder="请输入知识库标签，多个标签用逗号分隔"
								value={knowledgeData?.tags || ''}
								onChange={(e) => handleChange('tags', e.target.value)}
							/>
						</label>
						<label className="block">
							<span className="block font-semibold mb-2">
								<span className="text-red-500">*</span>简介
							</span>
							<input
								type="text"
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入知识库简介"
								value={knowledgeData?.description || ''}
								onChange={(e) => handleChange('description', e.target.value)}
							/>
						</label>
						<label className="block">
							<div className="flex justify-between items-center mb-2">
								<span className="block font-semibold">
									<span className="text-red-500">*</span>内容
								</span>
								<input
									ref={fileInputRef2}
									type="file"
									multiple={false}
									accept=".txt,.md,.json,.log,.xml,.js,.ts,.py,.html,.css,.java,.c,.cpp,.go,.rs,.sh,.yml,.yaml,.ini,.conf"
									onChange={handleFilePick}
									className="hidden"
								/>
								<button
									type="button"
									onClick={() => fileInputRef2.current?.click()}
									className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
								>
									从文件读取
								</button>
							</div>
							<textarea
								rows={14}
								className="bg-white w-full border border-gray-300 rounded-md py-2 px-3"
								placeholder="请输入知识库内容，或点击右上角从本地文件读取"
								value={knowledgeData?.content || ''}
								onChange={(e) => handleChange('content', e.target.value)}
							/>
						</label>
					</div>
				</div>
			</Modal>
		)
	}

	/**
	 * 添加知识库
	 */
	const knowledgeAddOpenModel = KnowledgeAddOpenModel({
		isOpen: isChildModalOpen,
		item: knowledgeData,
		onClose: () => setIsChildModalOpen(false)
	})

	/**
	 * 清空知识库
	 */
	const clearData = () => {
		confirm({
			title: '清空确认',
			content: '您确定要清空知识库吗？此操作不可撤销',
			submitConfirm: async () => {
				const resp = await apiFetch('/api/knowledge?clear=true', 'DELETE')
				const { success, error } = await resp.json()
				if (success) {
					toast.success('清空成功')
					setCurrentPage(1)
					fetchKnowledgeList(1)
				} else {
					toast.error('清空失败：' + (error || '未知错误'))
				}
			}
		})
	}

	/**
	 * 渲染页码按钮
	 */
	const renderPageButtons = () => {
		const buttons: React.ReactNode[] = []
		const maxShow = 5
		let startPage = Math.max(1, currentPage - Math.floor(maxShow / 2))
		let endPage = Math.min(totalPages, startPage + maxShow - 1)

		if (endPage - startPage + 1 < maxShow) {
			startPage = Math.max(1, endPage - maxShow + 1)
		}

		for (let p = startPage; p <= endPage; p++) {
			buttons.push(
				<button
					key={p}
					onClick={() => handlePageChange(p)}
					className={`w-8 h-8 flex items-center justify-center text-sm rounded-md border transition-all ${
						p === currentPage
							? 'bg-blue-500 text-white border-blue-500 shadow'
							: 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-500'
					}`}
				>
					{p}
				</button>
			)
		}
		return buttons
	}

	return (
		<>
			<Modal isOpen={isModalKnowledgeOpen} onClose={closeModal} title="知识库管理" className="w-[850px]">
				<div className="min-h-[400px] flex-1 overflow-auto px-2 flex flex-col">
					<div className="p-3 flex flex-wrap gap-2 justify-start items-center">
						<button
							className="text-sm px-3 py-2 btn-primary text-white rounded-md shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center"
							onClick={() => {
								setKnowledgeData(initialData)
								setIsChildModalOpen(true)
							}}
						>
							<AddMarkIcon />
							<span>数据录入</span>
						</button>
						<button
							onClick={clearData}
							className="text-sm px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
						>
							<span>清空</span>
						</button>
					</div>
					<div className="mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-x-5 flex-1">
						{loading ? (
							<div className="col-span-4 text-center py-12 text-sm text-gray-400">正在加载...</div>
						) : knowledgeList?.length > 0 ? (
							knowledgeList.map((ass: Knowledge, index: number) => {
								const tagsArr = (ass.tags || '')
									.toString()
									.split(/[,，]/)
									.map((s: string) => s.trim())
									.filter(Boolean)
								return (
									<div
										className="h-[135px] overflow-hidden border border-dashed border-blue-200 hover:border-blue-400 rounded p-3 space-y-2 flex flex-col"
										key={ass?.id + index}
									>
										<div className="flex justify-start items-center" title={ass.name}>
											<div className="truncate flex-1 text-sm font-medium">{ass.name}</div>
											<span
												className="text-blue-500 text-sm cursor-pointer hover:text-blue-300 ml-2 shrink-0"
												onClick={(e: any) => {
													e.stopPropagation()
													setKnowledgeData(ass)
													setIsChildModalOpen(true)
												}}
											>
												编辑
											</span>
										</div>
										{tagsArr.length > 0 && (
											<div className="flex flex-wrap gap-1.5 shrink-0">
												{tagsArr.slice(0, 4).map((tag: string, i: number) => (
													<span
														key={i}
														className="inline-block px-2 py-0.5 text-[10px] leading-5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"
													>
														{tag}
													</span>
												))}
												{tagsArr.length > 4 && (
													<span className="inline-block px-1.5 py-0.5 text-[10px] leading-5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
														+{tagsArr.length - 4}
													</span>
												)}
											</div>
										)}
										{ass.description && (
											<div className="text-xs text-gray-500 line-clamp-2" title={ass.description}>
												{ass.description}
											</div>
										)}
									</div>
								)
							})
						) : (
							<div className="col-span-4 text-center py-8 text-sm text-gray-400">
								暂无知识库数据，点击左上角按钮新增或直接从文件读取。
							</div>
						)}
					</div>

					{/* 分页控件 */}
					{totalPages > 1 && (
						<div className="mt-5 flex items-center justify-between px-3 pb-3">
							<div className="text-xs text-gray-500">
								共 <span className="text-blue-500 font-semibold">{total}</span> 条， 第{' '}
								<span className="text-blue-500 font-semibold">{currentPage}</span> / {totalPages} 页
							</div>
							<div className="flex items-center gap-1.5">
								<button
									onClick={() => handlePageChange(1)}
									disabled={currentPage === 1}
									className="px-2 h-8 text-sm rounded-md border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-all"
								>
									首页
								</button>
								<button
									onClick={() => handlePageChange(currentPage - 1)}
									disabled={currentPage === 1}
									className="w-8 h-8 text-sm rounded-md border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-all"
								>
									‹
								</button>
								{renderPageButtons()}
								<button
									onClick={() => handlePageChange(currentPage + 1)}
									disabled={currentPage === totalPages}
									className="w-8 h-8 text-sm rounded-md border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-all"
								>
									›
								</button>
								<button
									onClick={() => handlePageChange(totalPages)}
									disabled={currentPage === totalPages}
									className="px-2 h-8 text-sm rounded-md border border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-all"
								>
									末页
								</button>
							</div>
						</div>
					)}
				</div>
			</Modal>
			{knowledgeAddOpenModel}
		</>
	)
}
export default KnowledgeModel
