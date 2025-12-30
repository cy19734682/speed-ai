import { z } from 'zod'
import * as cheerio from 'cheerio';

// 搜索引擎选择器
const SEARCH_ENGINES = {
	bing: {
		url: 'https://cn.bing.com/search?q=',
		selector: {
			results: '#b_results .b_algo',
			title: 'h2',
			link: 'a',
			desc: `p[class^="b_lineclamp"]`
		}
	}
}

const BING_SEARCH_TOOL = {
	name: 'bing_search',
	description:
		'a search engine. useful for when you need to answer questions about current events. input should be a search query. prefer English query. query should be short and concise',
	paramsSchema: {
		query: z.string().describe('the search query')
	}
}

/**
 * 调用Bing搜索
 * @param query
 */
export async function handleBingSearch(query: string) {
  console.log(query)
  // 配置请求头（模拟浏览器访问）
	const headers = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Language': 'zh-CN,zh;q=0.8',
		Referer: 'https://cn.bing.com/',
		Connection: 'keep-alive'
	}
	const config = SEARCH_ENGINES['bing']
	const searchUrl = config.url + encodeURIComponent(query) + `&_=${new Date().getTime()}`
	const retData: { title: string; link: string; snippet: string }[] = []
	try {
		const response = await fetch(searchUrl, { headers })
		if (!response.ok) {
			throw new Error(`HTTP 错误! 状态码: ${response.status}`)
		}
		const html = await response.text()
		// 使用 Cheerio 解析 HTML
		const $ = cheerio.load(html)
		// 提取数据
		$(config.selector.results).each((index, element) => {
			const title = $(element).find(config.selector.title)?.text()?.trim()
			const link = $(element).find(config.selector.link)?.attr('href')
			const snippet = $(element).find(config.selector.desc)?.text()?.trim()
			if (title && link) {
				retData.push({ title, link, snippet })
			}
		})
	}	catch (e: any) {
		retData.push({ title: '搜索失败', link: '', snippet: e.message })
	}
  return retData
}

const SEARCH_TOOLS = [
	{
		tool: BING_SEARCH_TOOL,
		handler: async (params: any) => {
			const { query } = params
			return await handleBingSearch(query)
		}
	}
]
export default SEARCH_TOOLS
