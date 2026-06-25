// lib/kb.ts
import { KnowledgeBaseTool } from './knowledges'

const kb = new KnowledgeBaseTool({
	dbPath: './data/knowledge.db',
	tableName: 'knowledges'
})

let initPromise: Promise<void> | null = null

export async function getKB() {
	if (!initPromise) {
		initPromise = kb.initialize()
	}
	await initPromise
	return kb
}
