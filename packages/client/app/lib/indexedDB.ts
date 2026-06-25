import { openDB } from 'idb'
import { ChatMessages, ChatDetail } from './type'
import { DB_NAME_KEY, DB_VERSION_KEY, CHAT_LIST_STORE_KEY, CHAT_DETAIL_STORE_KEY } from './constant'

/**
 * 打开数据库
 */
const getDB = () => {
	return openDB(DB_NAME_KEY, DB_VERSION_KEY, {
		upgrade(db) {
			// 建表（表不存在才建，防止重复）
			if (!db.objectStoreNames.contains(CHAT_LIST_STORE_KEY)) db.createObjectStore(CHAT_LIST_STORE_KEY)
			if (!db.objectStoreNames.contains(CHAT_DETAIL_STORE_KEY)) db.createObjectStore(CHAT_DETAIL_STORE_KEY)
		}
	})
}

/**
 * 获取所有消息
 * @returns
 */
export const getChatList = async (): Promise<ChatMessages[]> => {
	if (typeof window === 'undefined') return []
	const db = await getDB()
	return (await db.getAll(CHAT_LIST_STORE_KEY)) || []
}


/**
 * 添加消息
 * @param newMessage 新消息
 * @param chatId 对话ID
 * @returns
 */
export const addChat = async (newMessage: ChatMessages, chatId: string) => {
	if (typeof window === 'undefined') return null
	// 新增消息
	const db = await getDB()
	await db.put(CHAT_LIST_STORE_KEY, newMessage, chatId)
}

/**
 * 删除消息
 * @param chatId 对话ID
 * @returns
 */
export const removeChat = async (chatId: string) => {
	if (typeof window === 'undefined') return null
	// 删除消息
	const db = await getDB()
	await db.delete(CHAT_LIST_STORE_KEY, chatId)
	await db.delete(CHAT_DETAIL_STORE_KEY, chatId)
}

/**
 * 更新消息标题
 * @param chatId 对话ID
 * @param title 标题
 * @returns
 */
export const updateChatTitle = async (chatId: string, title: string) => {
	if (typeof window === 'undefined') return null
	// 更新消息标题
	const db = await getDB()
	const message = await db.get(CHAT_LIST_STORE_KEY, chatId)
	if (!message) return null
	message.title = title
	await db.put(CHAT_LIST_STORE_KEY, { ...message, title, isAutoTitle: true }, chatId)
}



/**
 * 获取所有对话消息子项
 * @param chatId 对话ID
 * @returns
 */
export const getChatChildList = async (chatId: string): Promise<ChatDetail[]> => {
	if (typeof window === 'undefined') return []
	const db = await getDB()
	return (await db.get(CHAT_DETAIL_STORE_KEY, chatId)) || []
}

/**
 * 保存消息子项
 * @param chatId 对话ID
 * @param details 子项
 * @returns
 */
export const saveChatChild = async (chatId: string, details: ChatDetail[]): Promise<void> => {
	if (typeof window === 'undefined') return
	// 添加消息子项
	const db = await getDB()
	await db.put(CHAT_DETAIL_STORE_KEY, details, chatId)
}

/**
 * 重置所有消息
 * @returns
 */
export const resetChat = async () => {
	if (typeof window === 'undefined') return
	// 清除所有消息
	const db = await getDB()
	await db.clear(CHAT_LIST_STORE_KEY)
	await db.clear(CHAT_DETAIL_STORE_KEY)
}