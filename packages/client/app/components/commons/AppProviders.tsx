import { ToastProvider } from '@/app/components//commons/Toast'
import { ConfirmProvider } from '@/app/components/commons/Confirm'
import { GlobalKeyHandler } from '@/app/components/commons/GlobalKeyHandler'
import { FC, ReactNode } from 'react'

// 全局上下文
export const AppProviders: FC<{ children: ReactNode }> = ({ children }) => {
	return (
		<>
			<GlobalKeyHandler />
			<ToastProvider>
				<ConfirmProvider>{children}</ConfirmProvider>
			</ToastProvider>
		</>
	)
}
