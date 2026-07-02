import { KnowledgeBaseTool } from './knowledges'

const kb = new KnowledgeBaseTool({
	dbPath: './data/knowledge.db',
	tableName: 'knowledges'
})

let _cloudPromise: Promise<void> | null = null

/**
 * 获取云端知识库实例（服务端专用，仅在 API Route 中使用）
 * @returns 云端知识库实例
 */
export async function getKB() {
	if (!_cloudPromise) {
		_cloudPromise = kb.initialize()
	}
	await _cloudPromise
	return kb
}