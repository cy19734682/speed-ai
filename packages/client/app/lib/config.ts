/**
 * 全局配置对象
 *   Next.js 会在构建时将 NEXT_PUBLIC_ 前缀的变量内联到客户端代码中
 */

// 配置接口定义
export interface Config {
	ds: {
		// DeepSeek API 密钥
		apiKey: string
		// DeepSeek API 地址
		apiUrl: string
		// 默认模型
		defaultModel?: string
	}
	ali: {
		// Ali API 密钥
		apiKey: string
		// Ali API 地址
		apiUrl: string
		// 默认模型
		defaultModel?: string
		// 默认向量模型
		defaultEmbeddingModel?: string
	}
}

// 全局配置对象
export const config: Config = {
	ds: {
		// DeepSeek API 密钥
		apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
		// DeepSeek API 地址
		apiUrl: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
		// 默认模型
		defaultModel: process.env.NEXT_PUBLIC_DEEPSEEK_DEFAULT_MODEL || 'deepseek-v4-pro'
	},
	ali: {
		apiKey: process.env.NEXT_PUBLIC_ALI_API_KEY || '',
		apiUrl: process.env.NEXT_PUBLIC_ALI_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
		defaultModel: process.env.NEXT_PUBLIC_ALI_DEFAULT_MODEL || 'qwen3.7-plus',
		defaultEmbeddingModel: process.env.NEXT_PUBLIC_ALI_EMBEDDING_MODEL || 'text-embedding-v3'
	}
}
