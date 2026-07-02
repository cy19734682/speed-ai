import { openDB } from 'idb'
import { ChatMessages, ChatDetail } from './type'
import {
	DB_NAME_KEY,
	DB_VERSION_KEY,
	CHAT_LIST_STORE_KEY,
	CHAT_DETAIL_STORE_KEY,
	LOCAL_KNOWLEDGE_STORE_KEY
} from './constant'

/**
 * 打开数据库
 */
const getDB = () => {
	return openDB(DB_NAME_KEY, DB_VERSION_KEY, {
		upgrade(db) {
			// 建表（表不存在才建，防止重复）
			if (!db.objectStoreNames.contains(CHAT_LIST_STORE_KEY)) db.createObjectStore(CHAT_LIST_STORE_KEY)
			if (!db.objectStoreNames.contains(CHAT_DETAIL_STORE_KEY)) db.createObjectStore(CHAT_DETAIL_STORE_KEY)
			if (!db.objectStoreNames.contains(LOCAL_KNOWLEDGE_STORE_KEY)) db.createObjectStore(LOCAL_KNOWLEDGE_STORE_KEY)
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

// ================================
// 本地知识库相关接口定义
// ================================

/** 本地知识库文档结构 */
export interface LocalKnowledgeDoc {
	/** 唯一 ID */
	id: string
	/** 文档名称（标题） */
	name: string
	/** 标签（逗号分隔字符串） */
	tags?: string
	/** 简介 */
	description?: string
	/** 文档内容 */
	content: string
	/** 向量嵌入（由服务端生成） */
	embedding: number[]
	/** 元数据 */
	metadata?: Record<string, any>
	/** 创建时间 */
	createdAt: string
	/** 更新时间 */
	updatedAt: string
}

/** 本地知识库搜索结果结构 */
export interface LocalKnowledgeSearchResult {
	content: string
	metadata: Record<string, any>
	score: number
}

// ================================
// 本地知识库 CRUD
// ================================

/**
 * 获取所有本地知识库文档
 */
export const getLocalKnowledgeList = async (): Promise<LocalKnowledgeDoc[]> => {
	if (typeof window === 'undefined') return []
	const db = await getDB()
	return (await db.getAll(LOCAL_KNOWLEDGE_STORE_KEY)) || []
}

/**
 * 按分页获取本地知识库文档（并返回总数）
 */
export const getLocalKnowledgePaged = async (
	page: number = 1,
	pageSize: number = 20
): Promise<{ data: LocalKnowledgeDoc[]; total: number; page: number; pageSize: number; totalPages: number }> => {
	const list = await getLocalKnowledgeList()
	// 按更新时间倒序
	list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
	const total = list.length
	const totalPages = Math.max(1, Math.ceil(total / pageSize))
	const offset = (page - 1) * pageSize
	const data = list.slice(offset, offset + pageSize)
	return { data, total, page, pageSize, totalPages }
}

/**
 * 根据 ID 获取单个本地知识库文档
 */
export const getLocalKnowledgeById = async (id: string): Promise<LocalKnowledgeDoc | undefined> => {
	if (typeof window === 'undefined') return undefined
	const db = await getDB()
	return db.get(LOCAL_KNOWLEDGE_STORE_KEY, id)
}

/**
 * 新增/更新本地知识库文档（以 id 作为 key）
 */
export const saveLocalKnowledge = async (doc: LocalKnowledgeDoc): Promise<void> => {
	if (typeof window === 'undefined') return
	const db = await getDB()
	await db.put(LOCAL_KNOWLEDGE_STORE_KEY, doc, doc.id)
}

/**
 * 删除某个本地知识库文档
 */
export const removeLocalKnowledge = async (id: string): Promise<void> => {
	if (typeof window === 'undefined') return
	const db = await getDB()
	await db.delete(LOCAL_KNOWLEDGE_STORE_KEY, id)
}

/**
 * 清空本地知识库
 */
export const clearLocalKnowledge = async (): Promise<void> => {
	if (typeof window === 'undefined') return
	const db = await getDB()
	await db.clear(LOCAL_KNOWLEDGE_STORE_KEY)
}

// ================================
// 向量相似度计算
// ================================

/**
 * 计算两个向量的余弦相似度
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
	if (!a || !b || a.length !== b.length || a.length === 0) return 0
	let dot = 0
	let normA = 0
	let normB = 0
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if (normA === 0 || normB === 0) return 0
	return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * 在本地知识库中进行相似度搜索
 * @param queryEmbedding 查询向量
 * @param topK 返回结果的最大数量（先取 topK 条，再按阈值过滤）
 * @param minScore 最低相似度阈值（范围 0~1，越大越严格），只有 score > minScore 的结果才返回
 *                 默认为 0.5，即只返回中等相关度以上的结果；
 *                 传 0 则不做阈值过滤，仅按 topK 限制数量
 */
export const searchLocalKnowledge = async (
	queryEmbedding: number[],
	topK: number = 5,
	minScore: number = 0.5
): Promise<LocalKnowledgeSearchResult[]> => {
	const list = await getLocalKnowledgeList()
	if (list.length === 0) return []

	// 1) 计算每条文档与查询的余弦相似度（范围 [-1, 1]）
	const scored = list.map((doc) => {
		const rawScore = cosineSimilarity(queryEmbedding, doc.embedding || [])
		// 将余弦相似度从 [-1, 1] 归一化到 [0, 1]，便于与云端 score 统一理解
		const score = (rawScore + 1) / 2
		return {
			content: doc.content,
			metadata: {
				...(doc.metadata || {}),
				name: doc.name,
				tags: doc.tags,
				description: doc.description,
				source: '本地知识库',
				updatedAt: doc.updatedAt
			},
			score
		}
	})

	// 2) 按相似度降序排列，取前 topK 条
	scored.sort((a, b) => b.score - a.score)
	const topResults = scored.slice(0, topK)

	// 3) 按 minScore 过滤，只返回满足相似度阈值的结果
	return topResults.filter((r) => r.score > minScore)
}
