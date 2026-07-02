import { OpenAIEmbeddings } from '@langchain/openai'
import { config } from '@/app/lib/config'
import { UUID } from '@/app/lib/util'
import {
	LocalKnowledgeDoc,
	saveLocalKnowledge,
	removeLocalKnowledge,
	clearLocalKnowledge,
	getLocalKnowledgePaged,
	getLocalKnowledgeList,
	getLocalKnowledgeById,
	searchLocalKnowledge,
	LocalKnowledgeSearchResult
} from '../indexedDB'

/**
 * 本地知识库工具类可选配置
 * 允许调用者覆盖默认的 API 配置（如用户自定义密钥）
 */
export interface LocalKnowledgeOptions {
	apiKey?: string
	apiUrl?: string
	defaultEmbeddingModel?: string
}

/**
 * 本地知识库工具类（前端浏览器端使用）
 * - 数据存于 IndexedDB
 * - 支持传入自定义 API 配置，或从全局 config 读取默认值
 */
export class LocalKnowledgeTool {
	private embeddings: OpenAIEmbeddings
	private apiKey: string
	private apiUrl: string
	private defaultEmbeddingModel: string

	constructor(options?: LocalKnowledgeOptions) {
		// 优先使用传入的 options，其次使用全局 config
		this.apiKey = options?.apiKey || config.ali.apiKey
		this.apiUrl = options?.apiUrl || config.ali.apiUrl
		this.defaultEmbeddingModel =
			options?.defaultEmbeddingModel || config.ali.defaultEmbeddingModel || 'text-embedding-v3'

		if (!this.apiKey) {
			throw new Error(
				'Ali API Key 未配置，请在 .env 文件中设置 NEXT_PUBLIC_ALI_API_KEY，或在创建 LocalKnowledgeTool 实例时传入 apiKey 参数'
			)
		}

		this.embeddings = new OpenAIEmbeddings({
			apiKey: this.apiKey,
			model: this.defaultEmbeddingModel,
			dimensions: 1024,
			configuration: { baseURL: this.apiUrl }
		})
	}

	/**
	 * 分页获取本地知识库文档（管理界面使用）
	 */
	async list(
		page: number = 1,
		pageSize: number = 20
	): Promise<{
		data: LocalKnowledgeDoc[]
		total: number
		page: number
		pageSize: number
		totalPages: number
	}> {
		return getLocalKnowledgePaged(page, pageSize)
	}

	/**
	 * 调用服务端生成文本的嵌入向量
	 */
	async embedText(text: string): Promise<number[]> {
		const vectors = await this.embeddings.embedDocuments([text.trim()])
		return vectors[0]
	}

	/**
	 * 新增本地知识库文档（自动调用服务端生成向量）
	 */
	async add(params: {
		name: string
		content: string
		tags?: string
		description?: string
		metadata?: Record<string, any>
	}): Promise<LocalKnowledgeDoc> {
		const { name, content, tags, description, metadata } = params
		if (!name?.trim()) throw new Error('名称不能为空')
		if (!content?.trim()) throw new Error('内容不能为空')

		const embedding = await this.embedText(content)
		const now = new Date().toISOString()
		const doc: LocalKnowledgeDoc = {
			id: UUID(),
			name: name.trim(),
			tags: tags?.trim() || '',
			description: description?.trim() || '',
			content: content.trim(),
			embedding,
			metadata: { ...(metadata || {}), updatedAt: now },
			createdAt: now,
			updatedAt: now
		}
		await saveLocalKnowledge(doc)
		return doc
	}

	/**
	 * 更新本地知识库文档（若内容变化则重新生成向量）
	 */
	async update(
		id: string,
		params: { name: string; content: string; tags?: string; description?: string; metadata?: Record<string, any> }
	): Promise<LocalKnowledgeDoc> {
		const { name, content, tags, description, metadata } = params
		if (!id) throw new Error('文档 ID 不能为空')
		const existing = await getLocalKnowledgeById(id)
		if (!existing) throw new Error('文档不存在')

		const now = new Date().toISOString()
		const contentChanged = existing.content !== content.trim()
		let embedding = existing.embedding
		if (contentChanged) {
			embedding = await this.embedText(content)
		}

		const doc: LocalKnowledgeDoc = {
			...existing,
			name: name.trim(),
			tags: tags?.trim() || existing.tags,
			description: description?.trim() || existing.description,
			content: content.trim(),
			embedding,
			metadata: { ...(existing.metadata || {}), ...(metadata || {}), updatedAt: now },
			updatedAt: now
		}
		await saveLocalKnowledge(doc)
		return doc
	}

	/**
	 * 删除本地知识库文档
	 */
	async delete(id: string): Promise<void> {
		await removeLocalKnowledge(id)
	}

	/**
	 * 清空本地知识库
	 */
	async clear(): Promise<void> {
		await clearLocalKnowledge()
	}

	/**
	 * 在本地知识库中进行相似度搜索
	 * @param query 查询文本
	 * @param topK 最多返回的结果数量
	 * @param minScore 最低相似度阈值（范围 0~1，越大越严格），默认 0.5
	 *                 传 0 则仅按 topK 限制数量，不做阈值过滤
	 */
	async similaritySearch(
		query: string,
		topK: number = 5,
		minScore: number = 0.5
	): Promise<LocalKnowledgeSearchResult[]> {
		if (!query?.trim()) return []
		const list = await getLocalKnowledgeList()
		if (list.length === 0) return []

		const queryEmbedding = await this.embedText(query)
		return searchLocalKnowledge(queryEmbedding, topK, minScore)
	}

	/**
	 * 直接传入 queryEmbedding 进行搜索（用于服务端已生成向量的情况，避免重复请求）
	 * @param queryEmbedding 查询向量
	 * @param topK 最多返回的结果数量
	 * @param minScore 最低相似度阈值（范围 0~1，越大越严格），默认 0.5
	 */
	async searchByEmbedding(
		queryEmbedding: number[],
		topK: number = 5,
		minScore: number = 0.5
	): Promise<LocalKnowledgeSearchResult[]> {
		if (!queryEmbedding || queryEmbedding.length === 0) return []
		return searchLocalKnowledge(queryEmbedding, topK, minScore)
	}
}
