import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/styles/globals.css'
import GlobalLoading from '@/app/components/commons/GlobalLoading'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Speed AI - 智能助手',
  description: 'Speed AI 是一个基于大模型的智能助手，提供快速、准确、智能的对话服务。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className={`m-0 p-0 h-full ${inter.className}`}>
        <div className="h-full bg-gray-50">
          {children}
          <GlobalLoading />
        </div>
      </body>
    </html>
  )
}