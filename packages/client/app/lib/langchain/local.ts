import { LocalKnowledgeTool } from './localKnowledge'

let _localInstance: LocalKnowledgeTool | null = null

/**
 * 获取本地知识库实例（前端浏览器端专用，基于 IndexedDB）
 * @returns 本地知识库实例
 */
export const getLocalKB = (): LocalKnowledgeTool => {
	if (!_localInstance) _localInstance = new LocalKnowledgeTool()
	return _localInstance
}