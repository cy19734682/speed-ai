import React from 'react'
import { ChatRoundDetail } from '@/app/lib/type'
import { RefreshIcon, WarningIcon } from '@/app/styles/SvgIcon'

interface HTMLPreviewProps {
	message: ChatRoundDetail
	reSendText: () => void
}

/**
 * 对话结束回复
 * finish字段为cancel时，用户主动取消，显示提示文案+重新生成按钮
 * finish字段为error时，生成异常，显示提示文案+重新生成按钮
 * finish字段为length时，输出长度达到了模型上下文长度限制，显示提示文案+重新生成按钮
 * finish字段为content_filter时，输出内容因触发过滤策略而被过滤，显示原因
 */
const ChatEndReply: React.FC<HTMLPreviewProps> = ({ message, reSendText }) => {
	const finish = message.finish || ''

	if (finish === 'cancel' || finish === 'error' || finish === 'length') {
		const tipDescMap: Record<string, string> = {
			cancel: '您已主动取消本次生成，可点击下方按钮重新生成',
			error: '对话生成过程中出现异常，可点击下方按钮重新生成',
			length: '已达到模型最大上下文长度限制，可在设置中调整最大长度后点击下方按钮重新生成完整内容'
		}
		const tipDesc = tipDescMap[finish]
		return (
			<div className="mt-4 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-3 shadow-sm">
				<div className="flex items-start gap-2.5">
					<div className="flex flex-1 flex-col gap-2">
						<div className="flex flex-col">
							<span className="text-xs text-amber-600">{tipDesc}</span>
						</div>
						<button
							type="button"
							className="group inline-flex w-fit items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-md active:scale-95"
							title="重新生成"
							onClick={reSendText}
						>
							<RefreshIcon cls="h-3.5 w-3.5 transition-transform group-hover:rotate-180 duration-500" />
							<span>重新生成</span>
						</button>
					</div>
				</div>
			</div>
		)
	}

	if (finish === 'content_filter') {
		return (
			<div className="mt-4 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-3 py-2.5 shadow-sm">
				<div className="flex items-start gap-2.5">
					<div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
						<WarningIcon cls="h-3 w-3 text-amber-600" />
					</div>
					<div className="flex flex-col">
						<span className="text-sm font-semibold text-amber-800">内容已被安全过滤</span>
						<span className="mt-0.5 text-xs text-amber-600">
							输出内容因触发过滤策略而被截断，请调整您的提问后重试。
						</span>
					</div>
				</div>
			</div>
		)
	}

	return null
}

export default ChatEndReply
