import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * 云端知识库权限校验服务端 API
 *
 * 安全说明：
 * - 密码存储在服务端环境变量 CLOUD_KB_PASSWORD（不暴露给前端）
 * - 登录成功后返回一个 HMAC 签名 token，存储在 httpOnly cookie 中
 * - 校验 token 时只需要用密码重新计算签名与 token 中的签名对比
 * - 无需在内存中存储 token，Next.js 热加载不会影响登录状态
 * - 这样即使绕过前端，也无法直接访问云端知识库数据
 */

// token 有效期（毫秒）：24 小时
const TOKEN_TTL = 24 * 60 * 60 * 1000

// token 前缀（辅助识别）
const TOKEN_PREFIX = 'cloud_kb'

/**
 * 从服务端获取密码
 */
const getPassword = (): string | undefined => {
	return process.env.CLOUD_KB_PASSWORD
}

/**
 * 生成 HMAC 签名 token：格式为 cloud_kb_时间戳_签名
 * 无需在内存存储，只需要密码即可校验
 */
const generateSignedToken = (password: string): string => {
	const timestamp = Date.now()
	// 用密码作为密钥，对时间戳进行 HMAC-SHA256 签名
	const signature = crypto.createHmac('sha256', password).update(String(timestamp)).digest('hex').slice(0, 32) // 取前 32 位，更简洁

	return `${TOKEN_PREFIX}_${timestamp}_${signature}`
}

/**
 * 校验签名 token：
 * 1. 格式是否正确
 * 2. 时间戳是否在有效期内
 * 3. 用密码重新计算签名，与 token 中的签名对比
 */
const verifySignedToken = (token: string, password: string): boolean => {
	try {
		if (!token || !password) return false

		const parts = token.split('_')
		// cloud_kb_timestamp_signature = 4 段
		if (parts.length !== 4) return false

		const [prefix1, prefix2, timestampStr, signature] = parts
		// 验证前缀
		if (`${prefix1}_${prefix2}` !== TOKEN_PREFIX) return false

		// 验证时间戳格式
		const timestamp = Number(timestampStr)
		if (!timestamp || Number.isNaN(timestamp)) return false

		// 验证是否过期
		if (Date.now() - timestamp > TOKEN_TTL) return false

		// 用密码重新计算签名，与 token 中的签名对比
		const expected = crypto.createHmac('sha256', password).update(String(timestamp)).digest('hex').slice(0, 32)

		// 防止时序攻击：使用恒定时间比较
		return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
	} catch (e) {
		// 任何异常都返回 false（例如 signature 不是有效的 hex 字符串）
		return false
	}
}

/**
 * 从请求 cookie 中读取 token
 */
const getTokenFromRequest = (req: NextRequest): string | null => {
	return req.cookies.get('cloud_kb_auth')?.value || null
}

/**
 * 校验请求是否携带有效 token（签名方式，无需内存存储）
 */
export const hasCloudKBAuth = (req: NextRequest): boolean => {
	const password = getPassword()
	if (!password) return false

	const token = getTokenFromRequest(req)
	if (!token) return false

	return verifySignedToken(token, password)
}

/**
 * 从请求中获取认证 token
 */
export const getCloudKBAuthToken = (req: NextRequest): string | null => {
	return getTokenFromRequest(req)
}

/**
 * POST /api/auth/login
 * 校验密码并颁发签名 token
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}))
		const { password } = body

		if (!password) {
			return NextResponse.json({ success: false, error: '密码不能为空' }, { status: 400 })
		}

		const validPassword = getPassword()
		if (!validPassword) {
			return NextResponse.json({ success: false, error: '云端知识库功能未启用' }, { status: 403 })
		}

		if (password !== validPassword) {
			return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 })
		}

		// 生成签名 token（无需在内存存储）
		const token = generateSignedToken(validPassword)

		const response = NextResponse.json({
			success: true,
			message: '登录成功'
		})

		response.cookies.set({
			name: 'cloud_kb_auth',
			value: token,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: TOKEN_TTL / 1000 // 秒
		})

		return response
	} catch (error: any) {
		console.error('[cloud-kb-auth] 登录失败：', error)
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
 * DELETE /api/auth/logout
 * 退出登录，清除 cookie 中的 token
 */
export async function DELETE(req: NextRequest) {
	try {
		const response = NextResponse.json({
			success: true,
			message: '已退出登录'
		})

		response.cookies.set({
			name: 'cloud_kb_auth',
			value: '',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 0
		})

		return response
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
 * GET /api/auth/status
 * 检查当前登录状态
 */
export async function GET(req: NextRequest) {
	const hasPassword = !!getPassword()
	const isAuthed = hasCloudKBAuth(req)

	return NextResponse.json({
		success: true,
		enabled: hasPassword, // 是否配置了密码（云端功能是否启用）
		isAuthed // 当前是否已登录
	})
}
