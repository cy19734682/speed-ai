import React from 'react'
import { ChatDetail } from '@/app/lib/type'
interface HTMLPreviewProps {
	message: ChatDetail
	setModalData: (data: any) => void
}

const UserReplyContent: React.FC<HTMLPreviewProps> = ({ message, setModalData }) => {
	const files = message.files
	const shortcutTitle = message.shortcutTitle
	const content = message.content

	return (
		<>
			{files && files.length > 0 && (
				<div className="flex flex-wrap justify-end gap-2 pb-4 border-gray-200">
					{files.map((file: any) => (
						<div
							key={file.id}
							className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-gray-700 rounded-md border border-indigo-100"
							title={file.name}
						>
							<span
								className="max-w-[140px] truncate cursor-pointer hover:underline"
								onClick={() => setModalData(file)}
							>
								{file.name}
							</span>
						</div>
					))}
				</div>
			)}
			<div className="whitespace-pre-wrap">{shortcutTitle || content}</div>
		</>
	)
}

export default UserReplyContent
