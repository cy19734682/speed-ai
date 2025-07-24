'use client'

import ChatInterface from '@/app/components/ChatInterface'
import ChatListPanel from '@/app/components/ChatListPanel'
import ChatSettingsModel from '@/app/components/ChatSettingsModel'
import McpSettingsModel from '@/app/components/McpSettingsModel'
import ChatAssistantModel from '@/app/components/ChatAssistantModel'
import { useGeneralStore } from '@/app/store'
import { CloseIcon, MobileMenuIcon } from '@/app/styles/SvgIcon'

export default function Home() {
	const [settingModal] = ChatSettingsModel()
	const [mcpModal] = McpSettingsModel()
	const [assistantModal] = ChatAssistantModel()
	const { isSidebarOpen, setIsSidebarOpen } = useGeneralStore()

	return (
		<main className="h-full bg-gray-50 py-2 lg:py-4">
			{/* 移动端显示菜单按钮 */}
			<button className="lg:hidden fixed top-6 right-6 z-20 p-2 rounded" onClick={() => setIsSidebarOpen(true)}>
				<MobileMenuIcon />
			</button>
			<div className="container h-full mx-auto px-2 lg:px4 max-w-10xl">
				<div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* 侧滑菜单 */}
					<div
						className={`lg:col-span-1 order-3 lg:order-1 fixed top-0 left-0 h-full w-[100%] bg-white transform transition-transform ${
							isSidebarOpen ? 'translate-x-0 w-[80%] ' : '-translate-x-full'
						} lg:static lg:translate-x-0 z-40 flex flex-col overflow-hidden`}
					>
						<button className="lg:hidden absolute top-3 right-3 p-2 z-[41]" onClick={() => setIsSidebarOpen(false)}>
							<CloseIcon cls="w-6 h-6" />
						</button>
						<ChatListPanel />
					</div>
					<div className="h-full overflow-hidden lg:col-span-3 order-1 lg:order-3">
						<ChatInterface />
					</div>
				</div>
			</div>
			{/* 遮罩层 */}
			{isSidebarOpen && (
				<div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsSidebarOpen(false)} />
			)}
			{/*设置*/}
			{settingModal}
			{/*MCP*/}
			{mcpModal}
			{/*助手*/}
			{assistantModal}
		</main>
	)
}
