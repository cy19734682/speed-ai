import React, { useState, useRef } from 'react'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { CopyIcon, OnlineRunIcon } from '@/app/styles/SvgIcon'
import ReactMarkdown from 'react-markdown'
import { useToast } from '@/app/components/commons/Toast'
import Modal from '@/app/components/commons/Modal'

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
	const copyToClipboard = (children: any) => {
		const codeText = extractTextContent(children).replace(/\n$/, '')
		navigator.clipboard.writeText(codeText)
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
					table({ ...props }: any) {
						return (
							<div className="table-container">
								<table className="markdown-table" {...props} />
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
					<iframe ref={iframeRef}  srcDoc={htmlBlock} className="w-full h-full border-0" />
				</div>
			</Modal>
		</div>
	)
}

export default ChatReply
