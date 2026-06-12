import { openDB } from 'idb'
import { ChatMessages, ChatDetail } from './type'

const DB_NAME = 'ChatDB'
const DB_VERSION = 2
const CHAT_LIST_STORE = 'chatList'
const CHAT_DETAIL_STORE = 'chatHistory'

/**
 * 打开数据库
 */
const getDB = () => {
	return openDB(DB_NAME, DB_VERSION, {
		upgrade(db) {
			// 建表（表不存在才建，防止重复）
			if (!db.objectStoreNames.contains(CHAT_LIST_STORE)) db.createObjectStore(CHAT_LIST_STORE)
			if (!db.objectStoreNames.contains(CHAT_DETAIL_STORE)) db.createObjectStore(CHAT_DETAIL_STORE)
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
	return (await db.getAll(CHAT_LIST_STORE)) || []
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
	await db.put(CHAT_LIST_STORE, newMessage, chatId)
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
	await db.delete(CHAT_LIST_STORE, chatId)
	await db.delete(CHAT_DETAIL_STORE, chatId)
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
	const message = await db.get(CHAT_LIST_STORE, chatId)
	if (!message) return null
	message.title = title
	await db.put(CHAT_LIST_STORE, { ...message, title, isAutoTitle: true }, chatId)
}



/**
 * 获取所有对话消息子项
 * @param chatId 对话ID
 * @returns
 */
export const getChatChildList = async (chatId: string): Promise<ChatDetail[]> => {
	if (typeof window === 'undefined') return []
	const db = await getDB()
	return (await db.get(CHAT_DETAIL_STORE, chatId)) || []
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
	await db.put(CHAT_DETAIL_STORE, details, chatId)
}

/**
 * 重置所有消息
 * @returns
 */
export const resetChat = async () => {
	if (typeof window === 'undefined') return
	// 清除所有消息
	const db = await getDB()
	await db.clear(CHAT_LIST_STORE)
	await db.clear(CHAT_DETAIL_STORE)
}