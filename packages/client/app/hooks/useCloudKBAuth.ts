import { useState, useEffect, useCallback } from 'react'
import { canUseCloudKB, loginCloudKB, logoutCloudKB } from '@/app/lib/auth'

/**
 * 云端知识库权限 Hook（服务端校验版本）
 *
 * 提供统一的权限状态管理、登录弹窗控制、登录/登出操作
 * 所有权限判断都通过服务端 API 校验，安全可靠
 *
 * 使用方式：
 *   const {
 *     isAuthed, isModalOpen, openModal, closeModal,
 *     login, logout, toggle, refresh,
 *     isLoggingIn, isRefreshing, enabled
 *   } = useCloudKBAuth()
 */
export function useCloudKBAuth() {
	// 是否已登录
	const [isAuthed, setIsAuthed] = useState<boolean>(false)
	// 登录弹窗是否打开
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	// 输入的密码
	const [inputPassword, setInputPassword] = useState<string>('')
	// 是否正在登录（显示 loading）
	const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)
	// 是否正在刷新权限状态
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

	// 刷新权限状态（调用服务端 API 检查）
	const refresh = useCallback(async () => {
		setIsRefreshing(true)
		try {
			const canUse = await canUseCloudKB()
			setIsAuthed(canUse)
		} catch (e) {
			console.error('[useCloudKBAuth] 刷新权限失败：', e)
			setIsAuthed(false)
		} finally {
			setIsRefreshing(false)
		}
	}, [])

	// 打开登录弹窗
	const openModal = useCallback(() => {
		setInputPassword('')
		setIsModalOpen(true)
	}, [])

	// 关闭登录弹窗
	const closeModal = useCallback(() => {
		setIsModalOpen(false)
	}, [])

	// 登录：输入密码 → 服务端校验 → 更新状态
	const login = useCallback(async (password: string): Promise<boolean> => {
		setIsLoggingIn(true)
		try {
			const ok = await loginCloudKB(password)
			if (ok) {
				setIsAuthed(true)
				setIsModalOpen(false)
			}
			return ok
		} catch (e) {
			console.error('[useCloudKBAuth] 登录失败：', e)
			return false
		} finally {
			setIsLoggingIn(false)
		}
	}, [])

	// 登出：调用服务端清除 token
	const logout = useCallback(async () => {
		try {
			await logoutCloudKB()
		} finally {
			setIsAuthed(false)
		}
	}, [])

	// 切换状态（已登录则登出，未登录则打开弹窗）
	const toggle = useCallback(() => {
		if (isAuthed) {
			logout()
		} else {
			openModal()
		}
	}, [isAuthed, logout, openModal])

	return {
		isAuthed,
		isModalOpen,
		inputPassword,
		setInputPassword,
		openModal,
		closeModal,
		login,
		logout,
		toggle,
		refresh,
		isLoggingIn,
		isRefreshing
	}
}
