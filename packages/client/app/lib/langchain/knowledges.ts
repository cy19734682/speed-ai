import { OpenAIEmbeddings } from '@langchain/openai'
import { createClient, Client } from '@libsql/client'
import { Document } from '@langchain/core/documents'
import { config } from '@/app/lib/config'

export interface KnowledgeBaseConfig {
	dbPath: string
	tableName?: string
	openAIApiKey?: string
	embeddingModel?: string
}

export interface SearchResult {
	content: string
	metadata: Record<string, any>
	score?: number
}

export class KnowledgeBaseTool {
	private embeddings: OpenAIEmbeddings
	private dbPath: string
	private tableName: string
	private columnName: string
	private initialized = false
	private dbClient: Client | null = null
	private _vectorDimension: number = 1024

	constructor(options: KnowledgeBaseConfig) {
		this.dbPath = options.dbPath
		this.tableName = options.tableName || 'documents'
		this.columnName = 'embedding'

		if (!config.ali.apiKey) {
			throw new Error('OpenAI API Key is required.')
		}

		this.embeddings = new OpenAIEmbeddings({
			apiKey: config.ali.apiKey,
			model: config.ali.defaultEmbeddingModel,
			dimensions: 1024,
			configuration: { baseURL: config.ali.apiUrl }
		})
	}

	/**
	 * 初始化知识库
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return

		this.dbClient = createClient({
			url: `file:${this.dbPath}`
		})

		await this.probeAndCreateSchema()

		this.initialized = true
	}

	/**
	 * 探测向量维度并创建表/索引。
	 * 关键：libsql 的向量索引与表列必须使用相同的维度；
	 *      并且表必须使用 WITHOUT ROWID（或 INTEGER PRIMARY KEY）来避免
	 *      "vector index(insert): failed to insert shadow row" 错误。
	 */
	private async probeAndCreateSchema(): Promise<void> {
		if (!this.dbClient) {
			throw new Error('Database client is not available.')
		}

		const tableName = this.tableName
		const columnName = this.columnName

		const tableCheck = await this.dbClient.execute({
			sql: `SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`,
			args: [tableName]
		})

		if (tableCheck.rows.length > 0) {
			return
		}

		// 嵌入一个探测文本，确定模型实际返回的维度
		let realDimension = this._vectorDimension
		try {
			const probe = await this.embeddings.embedQuery('probe vector dimension')
			if (Array.isArray(probe) && probe.length > 0) {
				realDimension = probe.length
				this._vectorDimension = realDimension
			}
		} catch {
			// 探测失败使用默认维度
		}

		// 表结构关键：id INTEGER PRIMARY KEY AUTOINCREMENT，使 rowid 与 id 一致，
		// 这是 libsql 向量索引正常工作的前提。
		const createTableSQL = `
			CREATE TABLE "${tableName}" (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				content TEXT,
				metadata TEXT,
				"${columnName}" F32_BLOB(${realDimension})
			);
		`

		const createIndexSQL = `
			CREATE INDEX "idx_${tableName}_${columnName}"
			ON "${tableName}"(libsql_vector_idx("${columnName}"));
		`

		await this.dbClient.execute('BEGIN')
		try {
			await this.dbClient.execute(createTableSQL)
			await this.dbClient.execute(createIndexSQL)
			await this.dbClient.execute('COMMIT')
		} catch (err) {
			await this.dbClient.execute('ROLLBACK').catch(() => {})
			throw err
		}
	}

	/**
	 * 确保知识库已初始化
	 */
	private ensureInitialized(): void {
		if (!this.initialized || !this.dbClient) {
			throw new Error('KnowledgeBaseTool not initialized. Call initialize() first.')
		}
	}

	/**
	 * 将数字数组转换为 libsql vector 接受的字符串格式
	 */
	private toVectorLiteral(embedding: number[]): string {
		return `[${embedding.join(',')}]`
	}

	/**
	 * 分页查询知识库中的所有文档（不返回向量 blob，只返回可读数据）
	 * @param page 页码（从 1 开始）
	 * @param pageSize 每页条数
	 * @returns 文档列表及总数
	 */
	async listDocuments(
		page: number = 1,
		pageSize: number = 20
	): Promise<{
		data: { id: string; content: string; metadata: Record<string, any> }[]
		total: number
		page: number
		pageSize: number
		totalPages: number
	}> {
		this.ensureInitialized()

		const tableName = this.tableName
		const offset = (page - 1) * pageSize

		// 1. 查询总数
		const countResult = await this.dbClient!.execute({
			sql: `SELECT COUNT(*) as total FROM "${tableName}"`,
			args: []
		})
		const total = Number(countResult.rows[0]?.total || 0)

		// 2. 查询分页数据
		const rows = await this.dbClient!.execute({
			sql: `SELECT id, content, metadata FROM "${tableName}" ORDER BY id DESC LIMIT ? OFFSET ?`,
			args: [pageSize, offset]
		})

		// 3. 解析 metadata
		const data = rows.rows.map((row) => ({
			id: String(row.id),
			content: row.content as string,
			metadata: row.metadata ? JSON.parse(row.metadata as string) : {}
		}))

		return {
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize)
		}
	}

	/**
	 * 添加文本（自动转换为 Document）
	 */
	async addText(name: string, content: string, metadata?: Record<string, any>): Promise<string[]> {
		this.ensureInitialized()

		const baseDoc = new Document({
			pageContent: content,
			metadata: { ...metadata, name, source: '人工录入', updatedAt: new Date().toISOString() }
		})
		return this.addDocuments([baseDoc])
	}

	/**
	 * 直接添加 Document 对象
	 */
	async addDocuments(documents: Document[]): Promise<string[]> {
		this.ensureInitialized()
		if (!documents || documents.length === 0) return []

		const texts = documents.map((d) => d.pageContent)
		const embeddings = await this.embeddings.embedDocuments(texts)

		const tableName = this.tableName
		const columnName = this.columnName
		const ids: string[] = []
		const batchSize = 50

		for (let i = 0; i < documents.length; i += batchSize) {
			const batchDocs = documents.slice(i, i + batchSize)
			const batchEmb = embeddings.slice(i, i + batchSize)

			const insertQueries = batchDocs.map((doc, idx) => ({
				sql: `INSERT INTO "${tableName}" (content, metadata, "${columnName}") VALUES (:content, :metadata, vector(:embedding)) RETURNING id`,
				args: {
					content: doc.pageContent,
					metadata: JSON.stringify(doc.metadata || {}),
					embedding: this.toVectorLiteral(batchEmb[idx])
				}
			}))

			const results = await this.dbClient!.batch(insertQueries)
			for (const r of results) {
				if (r.rows && r.rows.length > 0) {
					ids.push(String(r.rows[0].id))
				}
			}
		}

		return ids
	}

	/**
	 * 更新知识库中的文档（内容或元数据）
	 */
	async updateText(id: string, name: string, content: string, metadata?: Record<string, any>): Promise<void> {
		this.ensureInitialized()

		if (!id) {
			throw new Error('Document ID is required for update.')
		}

		// 1) 删除旧记录
		await this.delete([id])

		// 2) 插入新记录并把旧 id 塞回 metadata（便于追踪）
		const baseDoc = new Document({
			pageContent: content,
			metadata: { ...metadata, name, updatedAt: new Date().toISOString() }
		})
		await this.addDocuments([baseDoc])
	}

	/**
	 * 搜索相似文档
	 * @param query 查询文本
	 * @param topK 返回结果数量
	 */
	async similaritySearch(query: string, topK: number = 5): Promise<SearchResult[]> {
		this.ensureInitialized()

		const queryVector = await this.embeddings.embedQuery(query)
		const tableName = this.tableName
		const columnName = this.columnName
		const indexName = `idx_${tableName}_${columnName}`

		const sql = `
			SELECT top_k.rowid as id, "${tableName}".content, "${tableName}".metadata,
				   vector_distance_cos("${tableName}"."${columnName}", vector(:queryVector)) AS score
			FROM vector_top_k('${indexName}', vector(:queryVector), CAST(:k AS INTEGER)) AS top_k
			JOIN "${tableName}" ON top_k.rowid = "${tableName}".id
		`

		const result = await this.dbClient!.execute({
			sql,
			args: { queryVector: this.toVectorLiteral(queryVector), k: topK }
		})

		return result.rows.map((row) => ({
			content: row.content as string,
			metadata: row.metadata ? JSON.parse(row.metadata as string) : {},
			score: row.score as number
		}))
	}

	/**
	 * 搜索上下文（带分数）
	 */
	async searchContext(query: string, topK: number = 5): Promise<SearchResult[]> {
		return this.similaritySearch(query, topK)
	}

	/**
	 * 删除文档
	 * @param ids 要删除的文档 ID 数组
	 */
	async delete(ids: string[]): Promise<void> {
		this.ensureInitialized()
		if (!ids || ids.length === 0) return

		const tableName = this.tableName
		const queries = ids.map((id) => ({
			sql: `DELETE FROM "${tableName}" WHERE id = :id`,
			args: { id }
		}))
		await this.dbClient!.batch(queries)
	}

	/**
	 * 清空知识库中的所有数据
	 */
	async clear(): Promise<void> {
		this.ensureInitialized()

		try {
			await this.dbClient!.execute(`DELETE FROM "${this.tableName}"`)
			console.log(`✅ Knowledge base cleared (table: ${this.tableName})`)
		} catch (error) {
			const err = error as any
			if (err.message && err.message.includes('no such table')) {
				console.warn(`⚠️ Table "${this.tableName}" does not exist, nothing to clear.`)
				return
			}
			throw error
		}
	}

	/**
	 * 关闭知识库
	 */
	async close(): Promise<void> {
		this.initialized = false
	}
}
