import fs from 'fs'
import { z } from 'zod'

const GET_FILES = {
	name: 'get_files',
	description: '获取指定文件夹下的文件列表，如：`getFiles /Users/xxx/Documents',
	paramsSchema: { folderPath: z.string().describe('文件夹路径') }
}

const handleGetFiles = async (folderPath: string) => {
	try {
		return fs.readdirSync(folderPath)
	} catch (error) {
		console.error('获取文件列表失败:', error)
		return []
	}
}

export default [
	{
		tool: GET_FILES,
		handler: async (params: any) => {
			const { folderPath } = params
			return await handleGetFiles(folderPath)
		}
	}
]
