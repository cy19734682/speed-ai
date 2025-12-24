import { NextRequest, NextResponse } from 'next/server'
import { createDeepSeekChat } from '@/app/lib/api/deepseek'

export async function POST(req: NextRequest) {
	try {
		const { messages, options = {} } = await req.json()
		const controller = new AbortController()
		req.signal.addEventListener('abort', () => controller.abort())
		// 使用封装的DeepSeek服务获取流
		const stream = await createDeepSeekChat(messages, {
			...options,
			abortCtrl: controller
		})
		// 创建响应
		return new NextResponse(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		})
	} catch (error: any) {
		console.error('聊天API错误:', error)
		// 返回结构化错误信息
		return new NextResponse(
			JSON.stringify({
				success: false,
				error: {
					message: error.message || '服务器内部错误',
					code: 'API_ERROR',
					timestamp: new Date().toISOString()
				}
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'X-Error-Code': 'DEEPSEEK_API_FAILURE'
				}
			}
		)
	}
}
