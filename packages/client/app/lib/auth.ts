import { apiFetch } from '@/app/lib/api/fetch'

/**
 * 权限管理工具（服务端校验版本）
 *
 * 安全改进：
 * - 密码存储在服务端环境变量 CLOUD_KB_PASSWORD（永不暴露给前端）
 * - 登录通过 /api/auth/login API 进行服务端校验
 * - token 存储在 httpOnly cookie 中，防止 XSS 窃取
 * - 对 /api/knowledge 的请求会在服务端校验 cookie token
 *
 * 这样即使技术用户绕过前端代码，也无法绕过服务端的权限校验
 */

/**
 * 校验管理员口令并登录（通过服务端 API）
 * @param password 管理员密码
 * @returns 是否登录成功
 */
export const loginCloudKB = async (password: string): Promise<boolean> => {
	if (!password) return false
	try {
		const resp = await apiFetch('/api/auth', 'POST', {
			body: { password },
			showGlobalLoading: true,
			loadingText: '正在登录...'
		})
		const data = await resp.json()
		return !!data?.success
	} catch (e) {
		console.error('[loginCloudKB] 登录失败：', e)
		return false
	}
}

/**
 * 退出云端知识库登录（通过服务端 API）
 */
export const logoutCloudKB = async (): Promise<void> => {
	try {
		await apiFetch('/api/auth', 'DELETE')
	} catch (e) {
		console.error('[logoutCloudKB] 退出失败：', e)
	}
}

/**
 * 判断当前是否有权限使用云端知识库（通过服务端 API）
 * @returns 是否有权限
 */
export const canUseCloudKB = async (): Promise<boolean> => {
	try {
		const resp = await apiFetch('/api/auth', 'GET')
		const data = await resp.json()
		return !!data?.enabled && !!data?.isAuthed
	} catch (e) {
		console.error('[canUseCloudKB] 检查权限失败：', e)
		return false
	}
}
