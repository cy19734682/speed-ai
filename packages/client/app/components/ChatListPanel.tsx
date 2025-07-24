import React, { useEffect, useRef, useState } from 'react'
import { useGeneralStore } from '../store'
import useChatList from '../hooks/useChatList'
import { ChatMessages, MenuItem } from '@/app/lib/type'
import { AddRoundIcon, ChatSettingIcon, McpIcon, PartnerIcon, RightMenuIcon } from '@/app/styles/SvgIcon'

/**
 * 历史对话列表
 * @constructor
 */
const ChatListPanel: React.FC = () => {
	const { setIsModalSettingOpen, setIsModalMcpOpen, setIsModalAssistantOpen } = useGeneralStore()
	const { chatList, currentChatId, selectChat, removeMessage, handleNewMessage } = useChatList()

	/**
	 * 菜单项
	 * @param chat
	 * @param items
	 * @constructor
	 */
	const ListItemMenu = ({ items, chat }: { items: MenuItem[]; chat: ChatMessages }) => {
		const [isMenuOpen, setIsMenuOpen] = useState(false)
		const menuRef = useRef<HTMLDivElement>(null)
		const buttonRef = useRef<HTMLButtonElement>(null)

		// 处理全局点击事件
		useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					menuRef.current &&
					buttonRef.current &&
					!menuRef.current.contains(event.target as Node) &&
					!buttonRef.current.contains(event.target as Node)
				) {
					setIsMenuOpen(false)
				}
			}

			document.addEventListener('mousedown', handleClickOutside)
			return () => {
				document.removeEventListener('mousedown', handleClickOutside)
			}
		}, [])

		// 获取菜单项样式
		const getMenuItemStyle = (type = '') => {
			const baseStyle = 'flex items-center w-full text-left px-4 py-2.5 text-sm transition-colors duration-200'
			switch (type) {
				case 'edit':
					return `${baseStyle} text-blue-600 hover:bg-blue-50`
				case 'delete':
					return `${baseStyle} text-red-600 hover:bg-red-50`
				case 'share':
					return `${baseStyle} text-purple-600 hover:bg-purple-50`
				default:
					return `${baseStyle} text-gray-700 hover:bg-gray-100`
			}
		}

		return (
			<>
				{/*标题*/}
				<div className="font-medium flex-1 text-gray-900 truncate">{chat.title}</div>
				<div className="relative inline-block">
					{/* 菜单按钮 */}
					<button
						ref={buttonRef}
						onClick={(e) => {
							e.stopPropagation()
							setIsMenuOpen(!isMenuOpen)
						}}
						className={`${
							currentChatId === chat.chatId ? 'lg:visible' : 'lg:invisible'
						} visible group-hover:visible hover:bg-gray-100`}
						aria-label="打开菜单"
					>
						<RightMenuIcon />
					</button>

					{/* 下拉菜单 */}
					{isMenuOpen && (
						<div
							ref={menuRef}
							className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5"
						>
							{items.map((item) => (
								<button
									key={item.id}
									onClick={(e) => {
										e.stopPropagation()
										item.action()
										setIsMenuOpen(false)
									}}
									className={getMenuItemStyle(item.type)}
								>
									{item.text}
								</button>
							))}
						</div>
					)}
				</div>
			</>
		)
	}

	return (
		<div className="card h-full flex-1 flex flex-col justify-between relative">
			<div className="card-header">
				<h2 className="text-xl font-semibold">AI 客户端</h2>
			</div>
			<div className="p-4 flex-1 overflow-hidden h-full">
				{chatList.length === 0 ? (
					''
				) : (
					<div className="space-y-3 h-full overflow-auto pr-1">
						{chatList.map((chat: ChatMessages) => (
							<div
								key={chat.chatId}
								className={`p-2 rounded-lg cursor-pointer transition-all duration-200 border ${
									currentChatId === chat.chatId
										? 'bg-blue-50 border-blue-200 shadow-sm'
										: 'border-gray-100 hover:border-blue-100 hover:bg-blue-50'
								}`}
								onClick={() => {
									selectChat(chat.chatId)
									setIsModalSettingOpen(false)
								}}
							>
								<div className="flex items-center group" title={chat.title}>
									<ListItemMenu
										chat={chat}
										items={[
											{
												id: 1,
												type: 'delete',
												text: '删除',
												action: () => {
													removeMessage(chat.chatId)
												}
											}
										]}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			<div className="flex flex-col m-3 mb-4 gap-2 MuiBox-root css-0">
				<button
					className="text-sm px-3 py-2 btn-primary text-white rounded-md shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center"
					onClick={() => {
						handleNewMessage()
						setIsModalSettingOpen(false)
					}}
				>
					<AddRoundIcon cls="h-5 w-5 mr-1 inline-block" />
					<span>新对话</span>
				</button>
				<div
					className="text-sm px-3 py-2 text-gray-900 rounded-md hover:bg-gray-100 flex items-center cursor-pointer"
					onClick={() => setIsModalAssistantOpen(true)}
				>
					<PartnerIcon cls="h-5 w-5 mr-2 text-gray-600 " />
					<span>我的搭档</span>
				</div>
				<div
					className="text-sm px-3 py-2 text-gray-900 rounded-md hover:bg-gray-100 flex items-center cursor-pointer"
					onClick={() => setIsModalSettingOpen(true)}
				>
					<ChatSettingIcon cls="h-5 w-5 mr-2" />
					<span>设置</span>
				</div>
				<div
					className="text-sm px-3 py-2 text-gray-900 rounded-md hover:bg-gray-100 flex items-center cursor-pointer"
					onClick={() => setIsModalMcpOpen(true)}
				>
					<McpIcon cls="h-5 w-5 mr-2" />
					<span>MCP</span>
				</div>
			</div>
		</div>
	)
}

export default ChatListPanel
