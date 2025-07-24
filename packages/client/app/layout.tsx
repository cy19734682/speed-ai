import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI 客户端',
  description: '大模型上下文协议客户端界面',
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
        </div>
      </body>
    </html>
  )
}
