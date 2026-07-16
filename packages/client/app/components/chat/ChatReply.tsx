import React, { useState, useRef } from 'react'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { CopyIcon, OnlineRunIcon, DownloadIcon } from '@/app/styles/SvgIcon'
import ReactMarkdown from 'react-markdown'
import { useToast } from '@/app/components/commons/Toast'
import Modal from '@/app/components/commons/Modal'
import { copyTextToClipboard } from '@/app/lib/util'

interface HTMLPreviewProps {
	content: string
	isProcessing: boolean
}

const ChatReply: React.FC<HTMLPreviewProps> = ({ content, isProcessing }) => {
	const toast = useToast()
	const [htmlBlock, setHtmlBlock] = useState<string>('')
	const iframeRef = useRef<HTMLIFrameElement | null>(null)

	/**
	 * 递归提取所有文本内容
	 * @param children
	 */
	const extractTextContent: any = (children: any) => {
		if (typeof children === 'string') {
			return children
		}
		if (Array.isArray(children)) {
			return children.map(extractTextContent).join('')
		}
		if (children?.props?.children) {
			return extractTextContent(children.props.children)
		}
		return ''
	}

	/**
	 * 复制代码
	 * @param children
	 */
	const copyToClipboard = async (children: any) => {
		const codeText = extractTextContent(children).replace(/\n$/, '')
		await copyTextToClipboard(codeText)
		toast.success('复制成功')
	}
	/**
	 * 运行代码
	 * @param children
	 */
	const runCode = (children: any) => {
		const codeText = extractTextContent(children).replace(/\n$/, '')
		setHtmlBlock(codeText)
	}

	/**
	 * 下载代码为文件
	 * @param children - 代码的 children
	 * @param language - 代码语言，用于确定文件扩展名
	 */
	const downloadCode = (children: any, language: string = 'txt') => {
		const codeText = extractTextContent(children).replace(/\n$/, '')
		if (!codeText.trim()) {
			toast.error('代码为空，无法下载')
			return
		}

		// 常见语言到文件扩展名的映射
		const extMap: Record<string, string> = {
			javascript: 'js',
			typescript: 'ts',
			jsx: 'jsx',
			tsx: 'tsx',
			html: 'html',
			css: 'css',
			scss: 'scss',
			less: 'less',
			python: 'py',
			java: 'java',
			go: 'go',
			rust: 'rs',
			c: 'c',
			'c++': 'cpp',
			cpp: 'cpp',
			'c#': 'cs',
			csharp: 'cs',
			php: 'php',
			ruby: 'rb',
			swift: 'swift',
			kotlin: 'kt',
			shell: 'sh',
			bash: 'sh',
			zsh: 'sh',
			powershell: 'ps1',
			sql: 'sql',
			json: 'json',
			yaml: 'yml',
			yml: 'yml',
			xml: 'xml',
			markdown: 'md',
			md: 'md',
			vue: 'vue',
			react: 'jsx',
			txt: 'txt',
			text: 'txt'
		}

		const ext = extMap[language.toLowerCase()] || language.toLowerCase() || 'txt'

		const blob = new Blob([codeText], { type: 'text/plain;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = `code_${new Date().getTime()}.${ext}`
		link.style.display = 'none'
		document.body.appendChild(link)
		link.click()
		// Blob URL 的下载是同步的，点击后浏览器立即开始下载，此时直接提示
		toast.success('下载成功')
		// 用 requestAnimationFrame 延迟清理，确保浏览器已经处理完下载请求
		requestAnimationFrame(() => {
			document.body.removeChild(link)
			URL.revokeObjectURL(url)
		})
	}

	/**
	 * 从 React 元素中提取表格数据
	 * @param children - 表格的 children
	 * @returns 二维数组形式的表格数据
	 */
	const extractTableData = (children: any): string[][] => {
		const data: string[][] = []

		// 递归提取文本内容的辅助函数
		const getText = (node: any): string => {
			if (typeof node === 'string') {
				return node
			}
			if (Array.isArray(node)) {
				return node.map(getText).join('')
			}
			if (node?.props?.children) {
				return getText(node.props.children)
			}
			return ''
		}

		// 处理 children 数组（包含 thead、tbody 等）
		const processChildren = (nodes: any) => {
			if (!nodes) return

			const nodesArray = Array.isArray(nodes) ? nodes : [nodes]

			for (const node of nodesArray) {
				if (!node) continue

				// 检查是否是 tr 行元素
				const tagName = node.props?.tagName || (node.type?.name === 'tr' ? 'tr' : null)
				const isTr = tagName === 'tr' || (node.type && (node.type === 'tr' || node.type?.name === 'tr'))

				if (isTr) {
					// 提取当前行的单元格
					const cells: string[] = []
					const rowChildren = node.props?.children

					if (rowChildren) {
						const cellNodes = Array.isArray(rowChildren) ? rowChildren : [rowChildren]
						for (const cellNode of cellNodes) {
							if (cellNode) {
								cells.push(getText(cellNode).trim())
							}
						}
					}

					if (cells.length > 0) {
						data.push(cells)
					}
					continue
				}

				// 递归处理子元素（如 thead、tbody、tfoot）
				if (node.props?.children) {
					processChildren(node.props.children)
				}
			}
		}

		processChildren(children)
		return data
	}

	/**
	 * 将表格数据转换为 CSV 格式
	 * @param data - 二维数组形式的表格数据
	 * @returns CSV 字符串
	 */
	const convertToCSV = (data: string[][]): string => {
		return data
			.map((row) =>
				row
					.map((cell) => {
						// 处理包含逗号、引号或换行符的单元格
						const needsQuoting = /[",\n]/.test(cell)
						if (needsQuoting) {
							return '"' + cell.replace(/"/g, '""') + '"'
						}
						return cell
					})
					.join(',')
			)
			.join('\n')
	}

	/**
	 * 将表格数据转换为制表符分隔的格式（用于粘贴到 Excel 等）
	 * @param data - 二维数组形式的表格数据
	 * @returns 制表符分隔的字符串
	 */
	const convertToTSV = (data: string[][]): string => {
		return data.map((row) => row.join('\t')).join('\n')
	}

	/**
	 * 复制表格内容
	 * @param children - 表格的 children
	 */
	const copyTable = async (children: any) => {
		const tableData = extractTableData(children)
		if (tableData.length === 0) {
			toast.error('表格为空，无法复制')
			return
		}
		const tsvText = convertToTSV(tableData)
		await copyTextToClipboard(tsvText)
		toast.success('复制成功，可直接粘贴到 Excel')
	}

	/**
	 * 下载表格为 CSV 文件
	 * @param children - 表格的 children
	 */
	const downloadTable = (children: any) => {
		const tableData = extractTableData(children)
		if (tableData.length === 0) {
			toast.error('表格为空，无法下载')
			return
		}
		const csvText = convertToCSV(tableData)
		// 添加 BOM，确保 Excel 正确识别 UTF-8 编码
		const BOM = '\uFEFF'
		const blob = new Blob([BOM + csvText], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = `table_${new Date().getTime()}.csv`
		link.style.display = 'none'
		document.body.appendChild(link)
		link.click()
		// Blob URL 的下载是同步的，点击后浏览器立即开始下载，此时直接提示
		toast.success('下载成功')
		// 用 requestAnimationFrame 延迟清理，确保浏览器已经处理完下载请求
		requestAnimationFrame(() => {
			document.body.removeChild(link)
			URL.revokeObjectURL(url)
		})
	}

	return (
		<div className="markdown-content">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeHighlight]}
				components={{
					// 自定义代码块渲染
					code({ inline, className, children, ...props }: any) {
						const match = /language-(\w+)/.exec(className || '')
						return !inline && match ? (
							<div className="code-block-wrapper">
								<div className="code-block-header">
									<span className="code-language">{match[1]}</span>
									<div className="flex">
										<button
											onClick={() => {
												copyToClipboard(children)
											}}
											className="copy-button"
											title="复制代码"
											disabled={isProcessing}
										>
											<CopyIcon />
											<span className="text-xs pl-1">复制</span>
										</button>
										<button
											onClick={() => {
												downloadCode(children, match[1])
											}}
											className="copy-button ml-2"
											title="下载代码"
											disabled={isProcessing}
										>
											<DownloadIcon />
											<span className="text-xs pl-1">下载</span>
										</button>
										{(match[1] === 'HTML' || match[1] === 'html') && (
											<button
												onClick={() => {
													runCode(children)
												}}
												className="copy-button ml-2"
												title="在线运行"
												disabled={isProcessing}
											>
												<OnlineRunIcon />
												<span className="text-xs pl-1">运行</span>
											</button>
										)}
									</div>
								</div>
								<pre className={className}>
									<code className={className} {...props}>
										{children}
									</code>
								</pre>
							</div>
						) : (
							<code className={className} {...props}>
								{children}
							</code>
						)
					}, // 自定义表格渲染
					table({ children, ...props }: any) {
						return (
							<div className="table-wrapper">
								<div className="table-header">
									<span className="table-title">表格</span>
									<div className="flex">
										<button
											onClick={() => {
												copyTable(children)
											}}
											className="copy-button"
											title="复制表格"
											disabled={isProcessing}
										>
											<CopyIcon />
											<span className="text-xs pl-1">复制</span>
										</button>
										<button
											onClick={() => {
												downloadTable(children)
											}}
											className="copy-button ml-2"
											title="下载为CSV"
											disabled={isProcessing}
										>
											<DownloadIcon />
											<span className="text-xs pl-1">下载</span>
										</button>
									</div>
								</div>
								<div className="table-container">
									<table className="markdown-table" {...props}>
										{children}
									</table>
								</div>
							</div>
						)
					}, // 自定义链接渲染
					a({ ...props }: any) {
						return <a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" {...props} />
					}
				}}
			>
				{content}
			</ReactMarkdown>
			<Modal title="网页预览" isOpen={!!htmlBlock} onClose={() => setHtmlBlock('')} className="w-[1200px]">
				<div className="relative w-full h-[60vh] lg:h-[70vh]">
					<iframe ref={iframeRef} srcDoc={htmlBlock} className="w-full h-full border-0" />
				</div>
			</Modal>
		</div>
	)
}

export default ChatReply
