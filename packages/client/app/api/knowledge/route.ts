import { NextRequest, NextResponse } from 'next/server'
import { getKB } from '@/app/lib/langchain/cloud'
import { hasCloudKBAuth } from '@/app/api/auth/route'

/**
 * 云端知识库 API - 权限校验
 * 严格的服务端保护：检查请求是否携带有效的 token（httpOnly cookie）
 * 即使绕过前端，也无法直接访问云端知识库数据
 */

/**
 * 统一权限校验中间件（检查 cookie 中的 token）
 */
const checkAuth = (req: NextRequest): { ok: boolean; error?: string } => {
	// 检查请求是否携带有效的 token（httpOnly cookie）
	if (!hasCloudKBAuth(req)) {
		return { ok: false, error: '未授权，请先登录' }
	}

	return { ok: true }
}

/**
 * 知识库管理与搜索查询 API
 */
export async function GET(req: NextRequest) {
	const auth = checkAuth(req)
	if (!auth.ok) {
		return NextResponse.json({ success: false, error: auth.error }, { status: 403 })
	}
	try {
		const { searchParams } = new URL(req.url)
		const page = Number(searchParams.get('page') || '1')
		const pageSize = Number(searchParams.get('pageSize') || '20')
		const kb = await getKB()
		const data = await kb.listDocuments(page, pageSize)
		return NextResponse.json({
			success: true,
			data
		})
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || '服务端错误'
			},
			{ status: 500 }
		)
	}
}

/**
 * 知识库管理与搜索新增 API
 */
export async function POST(req: NextRequest) {
	const auth = checkAuth(req)
	if (!auth.ok) {
		return NextResponse.json({ success: false, error: auth.error }, { status: 403 })
	}
	try {
		const body = await req.json().catch(() => ({}))
		const { name, content, ...metadata } = body
		if (!name || !content) {
			return NextResponse.json({ success: false, error: '名称与内容必填' }, { status: 400 })
		}
		const kb = await getKB()
		const ids = await kb.addText(name, content, metadata)
		return NextResponse.json({
			success: true,
			data: { id: ids?.[0] || '' }
		})
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || '服务端错误'
			},
			{ status: 500 }
		)
	}
}

/**
 * 知识库管理与搜索删除 API
 */
export async function DELETE(req: NextRequest) {
	const auth = checkAuth(req)
	if (!auth.ok) {
		return NextResponse.json({ success: false, error: auth.error }, { status: 403 })
	}
	try {
		const { searchParams } = new URL(req.url)
		const clear = searchParams.get('clear') === 'true'
		const id = searchParams.get('id') as string
		if (!clear && !id) {
			return NextResponse.json({ success: false, error: '缺少参数' }, { status: 400 })
		}
		const kb = await getKB()
		if (clear) {
			await kb.clear()
		} else {
			await kb.delete([id])
		}
		return NextResponse.json({ success: true })
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || '服务端错误'
			},
			{ status: 500 }
		)
	}
}

/**
 * 知识库管理与搜索编辑 API
 */
export async function PUT(req: NextRequest) {
	const auth = checkAuth(req)
	if (!auth.ok) {
		return NextResponse.json({ success: false, error: auth.error }, { status: 403 })
	}
	try {
		const body = await req.json().catch(() => ({}))
		const { id, name, content, ...metadata } = body
		if (!name || !content) {
			return NextResponse.json({ success: false, error: '名称与内容必填' }, { status: 400 })
		}
		const kb = await getKB()
		const ids = await kb.updateText(id, name, content, metadata)
		return NextResponse.json({
			success: true,
			data: { id: ids?.[0] || '' }
		})
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || '服务端错误'
			},
			{ status: 500 }
		)
	}
}
