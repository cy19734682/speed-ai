import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

/**
 * 获取环境变量中的 API 密钥
 */
function getApiKey() {
	const apiKey = process.env.AMAP_MAPS_API_KEY
	if (!apiKey) {
		console.error('AMAP_MAPS_API_KEY environment variable is not set')
		process.exit(1)
	}
	return apiKey
}

const AMAP_MAPS_API_KEY = getApiKey()
const REGEOCODE_TOOL = {
	name: 'maps_regeocode',
	description: '将一个高德经纬度坐标转换为行政区划地址信息',
	paramsSchema: { location: z.string().describe('经纬度') }
}
const GEO_TOOL = {
	name: 'maps_geo',
	description: '将详细的结构化地址转换为经纬度坐标。支持对地标性名胜景区、建筑物名称解析为经纬度坐标',
	paramsSchema: {
		address: z.string().describe('待解析的结构化地址信息'),
		city: z.string().optional().describe('指定查询的城市')
	}
}
const IP_LOCATION_TOOL = {
	name: 'maps_ip_location',
	description: 'IP 定位根据用户输入的 IP 地址，定位 IP 的所在位置',
	paramsSchema: { ip: z.string().describe('IP地址') }
}
const WEATHER_TOOL = {
	name: 'maps_weather',
	description: '根据城市名称或者标准adcode查询指定城市的天气',
	paramsSchema: { city: z.string().describe('城市名称或者adcode') }
}
const BICYCLING_TOOL = {
	name: 'maps_bicycling',
	description: '骑行路径规划用于规划骑行通勤方案，规划时会考虑天桥、单行线、封路等情况。最大支持 500km 的骑行路线规划',
	paramsSchema: {
		origin: z.string().describe('出发点经纬度，坐标格式为：经度，纬度'),
		destination: z.string().describe('目的地经纬度，坐标格式为：经度，纬度')
	}
}
const WALKING_TOOL = {
	name: 'maps_direction_walking',
	description: '步行路径规划 API 可以根据输入起点终点经纬度坐标规划100km 以内的步行通勤方案，并且返回通勤方案的数据',
	paramsSchema: {
		origin: z.string().describe('出发点经纬度，坐标格式为：经度，纬度'),
		destination: z.string().describe('目的地经纬度，坐标格式为：经度，纬度')
	}
}
const DRIVING_TOOl = {
	name: 'maps_direction_driving',
	description:
		'驾车路径规划 API 可以根据用户起终点经纬度坐标规划以小客车、轿车通勤出行的方案，并且返回通勤方案的数据。',
	paramsSchema: {
		origin: z.string().describe('出发点经纬度，坐标格式为：经度，纬度'),
		destination: z.string().describe('目的地经纬度，坐标格式为：经度，纬度')
	}
}
const TRANSIT_INTEGRATED_TOOL = {
	name: 'maps_direction_transit_integrated',
	description:
		'公交路径规划 API 可以根据用户起终点经纬度坐标规划综合各类公共（火车、公交、地铁）交通方式的通勤方案，并且返回通勤方案的数据，跨城场景下必须传起点城市与终点城市',
	paramsSchema: {
		origin: z.string().describe('出发点经纬度，坐标格式为：经度，纬度'),
		destination: z.string().describe('目的地经纬度，坐标格式为：经度，纬度'),
		city: z.string().describe('公共交通规划起点城市'),
		cityd: z.string().describe('公共交通规划终点城市')
	}
}
const DISTANCE_TOOL = {
	name: 'maps_distance',
	description: '距离测量 API 可以测量两个经纬度坐标之间的距离,支持驾车、步行以及球面距离测量',
	paramsSchema: {
		origin: z
			.string()
			.describe('起点经度，纬度，可以传多个坐标，使用分号隔离，比如120,30;120,31，坐标格式为：经度，纬度'),
		destination: z.string().describe('终点经度，纬度，坐标格式为：经度，纬度'),
		type: z.string().describe('距离测量类型,1代表驾车距离测量，0代表直线距离测量，3步行距离测量')
	}
}
const TEXT_SEARCH_TOOL = {
	name: 'maps_text_search',
	description: '关键词搜，根据用户传入关键词，搜索出相关的POI',
	paramsSchema: {
		keywords: z.string().describe('搜索关键词'),
		city: z.string().optional().describe('查询城市'),
		types: z.string().optional().describe('POI类型，比如加油站')
	}
}
const AROUND_SEARCH_TOOL = {
	name: 'maps_around_search',
	description: '周边搜，根据用户传入关键词以及坐标location，搜索出radius半径范围的POI',
	paramsSchema: {
		location: z.string().describe('中心点经度纬度'),
		keywords: z.string().optional().describe('搜索关键词'),
		radius: z.string().optional().describe('搜索半径')
	}
}
const SEARCH_DETAIL_TOOL = {
	name: 'maps_search_detail',
	description: '查询关键词搜或者周边搜获取到的POI ID的详细信息',
	paramsSchema: { id: z.string().describe('关键词搜或者周边搜获取到的POI ID') }
}

/**
 * 将一个高德经纬度坐标转换为行政区划地址信息
 * @param location
 */
async function handleReGeocode(location: string) {
	const url = new URL('https://restapi.amap.com/v3/geocode/regeo')
	url.searchParams.append('location', location)
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `RGeocoding failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				provice: data?.regeocode?.addressComponent?.province,
				city: data?.regeocode?.addressComponent?.city,
				district: data?.regeocode?.addressComponent?.district
			},
			null,
			2
		)
	} catch (e: any) {
		return `RGeocoding failed: ${e.message}`
	}
}

/**
 * 将详细的结构化地址转换为经纬度坐标。支持对地标性名胜景区、建筑物名称解析为经纬度坐标
 * @param address
 * @param city
 */
async function handleGeo(address: string, city?: string) {
	const url = new URL('https://restapi.amap.com/v3/geocode/geo')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('address', address)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Geocoding failed: ${data.info || data.infocode}`
		}
		const geocodes = data.geocodes || []
		const res =
			geocodes.length > 0
				? geocodes.map((geo: Record<string, any>) => ({
						country: geo.country,
						province: geo.province,
						city: geo.city,
						citycode: geo.citycode,
						district: geo.district,
						street: geo.street,
						number: geo.number,
						adcode: geo.adcode,
						location: geo.location,
						level: geo.level
					}))
				: []
		return JSON.stringify(
			{
				return: res
			},
			null,
			2
		)
	} catch (e: any) {
		return `Geocoding failed: ${e.message}`
	}
}

/**
 * IP 定位根据用户输入的 IP 地址，定位 IP 的所在位置
 * @param ip
 */
async function handleIPLocation(ip: string) {
	const url = new URL('https://restapi.amap.com/v3/ip')
	url.searchParams.append('ip', ip)
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `IP Location failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				province: data?.province,
				city: data?.city,
				adcode: data?.adcode,
				rectangle: data?.rectangle
			},
			null,
			2
		)
	} catch (e: any) {
		return `IP Location failed: ${e.message}`
	}
}

/**
 * 根据城市名称或者标准adcode查询指定城市的天气
 * @param city
 */
async function handleWeather(city: string) {
	const url = new URL('https://restapi.amap.com/v3/weather/weatherInfo')
	url.searchParams.append('city', city)
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('source', 'ts_mcp')
	url.searchParams.append('extensions', 'all')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Get weather failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				city: data?.forecasts?.[0]?.city,
				forecasts: data?.forecasts?.[0]?.casts
			},
			null,
			2
		)
	} catch (e: any) {
		return `Get weather failed: ${e.message}`
	}
}

/**
 * 查询关键词搜或者周边搜获取到的POI ID的详细信息
 * @param id
 */
async function handleSearchDetail(id: string) {
	const url = new URL('https://restapi.amap.com/v3/place/detail')
	url.searchParams.append('id', id)
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Get poi detail failed: ${data.info || data.infocode}`
		}
		let poi = data.pois?.[0] || {}
		return JSON.stringify(
			{
				id: poi.id,
				name: poi.name,
				location: poi.location,
				address: poi.address,
				business_area: poi.business_area,
				city: poi.cityname,
				type: poi.type,
				alias: poi.alias,
				...poi.biz_ext
			},
			null,
			2
		)
	} catch (e: any) {
		return `Get poi detail failed: ${e.message}`
	}
}

/**
 * 骑行路径规划用于规划骑行通勤方案，规划时会考虑天桥、单行线、封路等情况。最大支持 500km 的骑行路线规划
 * @param origin
 * @param destination
 */
async function handleBicycling(origin: string, destination: string) {
	const url = new URL('https://restapi.amap.com/v4/direction/bicycling')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('origin', origin)
	url.searchParams.append('destination', destination)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.errcode !== 0) {
			return `Direction bicycling failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				data: {
					origin: data?.data?.origin,
					destination: data?.data?.destination,
					paths: data?.data?.paths?.map?.((path: Record<string, any>) => {
						return {
							distance: path.distance,
							duration: path.duration,
							steps: path.steps.map((step: Record<string, any>) => {
								return {
									instruction: step.instruction,
									road: step.road,
									distance: step.distance,
									orientation: step.orientation,
									duration: step.duration
								}
							})
						}
					})
				}
			},
			null,
			2
		)
	} catch (e: any) {
		return `Bicycling failed: ${e.message}`
	}
}

/**
 * 步行路径规划 API 可以根据输入起点终点经纬度坐标规划100km 以内的步行通勤方案，并且返回通勤方案的数据
 * @param origin
 * @param destination
 */
async function handleWalking(origin: string, destination: string) {
	const url = new URL('https://restapi.amap.com/v3/direction/walking')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('origin', origin)
	url.searchParams.append('destination', destination)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Direction Walking failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				route: {
					origin: data?.route?.origin,
					destination: data?.route?.destination,
					paths: data?.route?.paths?.map?.((path: Record<string, any>) => {
						return {
							distance: path.distance,
							duration: path.duration,
							steps: path.steps.map((step: Record<string, any>) => {
								return {
									instruction: step.instruction,
									road: step.road,
									distance: step.distance,
									orientation: step.orientation,
									duration: step.duration
								}
							})
						}
					})
				}
			},
			null,
			2
		)
	} catch (e: any) {
		return `Direction Walking failed: ${e.message}`
	}
}

/**
 * 驾车路径规划 API 可以根据用户起终点经纬度坐标规划以小客车、轿车通勤出行的方案，并且返回通勤方案的数据。
 * @param origin
 * @param destination
 */
async function handleDriving(origin: string, destination: string) {
	const url = new URL('https://restapi.amap.com/v3/direction/driving')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('origin', origin)
	url.searchParams.append('destination', destination)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Direction Driving failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				route: {
					origin: data?.route?.origin,
					destination: data?.route?.destination,
					paths: data?.route?.paths?.map?.((path: Record<string, any>) => {
						return {
							path: path.path,
							distance: path.distance,
							duration: path.duration,
							steps: path.steps.map((step: Record<string, any>) => {
								return {
									instruction: step.instruction,
									road: step.road,
									distance: step.distance,
									orientation: step.orientation,
									duration: step.duration
								}
							})
						}
					})
				}
			},
			null,
			2
		)
	} catch (e: any) {
		return `Direction Driving failed: ${e.message}`
	}
}

/**
 * 公交路径规划 API 可以根据用户起终点经纬度坐标规划综合各类公共（火车、公交、地铁）交通方式的通勤方案，并且返回通勤方案的数据，跨城场景下必须传起点城市与终点城市
 * @param origin
 * @param destination
 * @param city
 * @param cityd
 */
async function handleTransitIntegrated(origin: string, destination: string, city = '', cityd = '') {
	const url = new URL('https://restapi.amap.com/v3/direction/transit/integrated')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('origin', origin)
	url.searchParams.append('destination', destination)
	url.searchParams.append('city', city)
	url.searchParams.append('cityd', cityd)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Direction Transit Integrated failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				route: {
					origin: data?.route?.origin,
					destination: data?.route?.destination,
					distance: data?.route?.distance,
					transits: data?.route?.transits
						? data?.route?.transits.map?.((transit: Record<string, any>) => {
								return {
									duration: transit?.duration,
									walking_distance: transit?.walking_distance,
									segments: transit.segments
										? transit.segments.map((segment: Record<string, any>) => {
												return {
													walking: {
														origin: segment.walking.origin,
														destination: segment.walking.destination,
														distance: segment.walking.distance,
														duration: segment.walking.duration,
														steps:
															segment.walking && segment.walking.steps
																? segment.walking.steps.map((step: Record<string, any>) => {
																		return {
																			instruction: step.instruction,
																			road: step.road,
																			distance: step.distance,
																			action: step.action,
																			assistant_action: step.assistant_action
																		}
																	})
																: []
													},
													bus: {
														buslines:
															segment.bus && segment.bus.buslines
																? segment.bus.buslines.map((busline: Record<string, any>) => {
																		return {
																			name: busline.name,
																			departure_stop: {
																				name: busline.departure_stop.name
																			},
																			arrival_stop: {
																				name: busline.arrival_stop.name
																			},
																			distance: busline.distance,
																			duration: busline.duration,
																			via_stops: busline.via_stops
																				? busline.via_stops.map((via_stop: Record<string, any>) => {
																						return {
																							name: via_stop.name
																						}
																					})
																				: []
																		}
																	})
																: []
													},
													entrance: {
														name: segment.entrance.name
													},
													exit: {
														name: segment.exit.name
													},
													railway: {
														name: segment.railway.name,
														trip: segment.railway.trip
													}
												}
											})
										: []
								}
							})
						: []
				}
			},
			null,
			2
		)
	} catch (e: any) {
		return `Direction Transit Integrated failed: ${e.message}` //
	}
}

/**
 * 距离测量 API 可以测量两个经纬度坐标之间的距离,支持驾车、步行以及球面距离测量
 * @param origins
 * @param destination
 * @param type
 */
async function handleDistance(origins: string, destination: string, type = '1') {
	const url = new URL('https://restapi.amap.com/v3/distance')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('origins', origins)
	url.searchParams.append('destination', destination)
	url.searchParams.append('type', type)
	url.searchParams.append('source', 'ts_mcp')

	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Direction Distance failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				results: data?.results?.map?.((result: Record<string, any>) => {
					return {
						origin_id: result.origin_id,
						dest_id: result.dest_id,
						distance: result.distance,
						duration: result.duration
					}
				})
			},
			null,
			2
		)
	} catch (e: any) {
		return `Direction Distance failed: ${e.message}`
	}
}

/**
 * 关键词搜，根据用户传入关键词，搜索出相关的POI
 * @param keywords
 * @param city
 * @param citylimit
 */
async function handleTextSearch(keywords: string, city = '', citylimit = 'false') {
	const url = new URL('https://restapi.amap.com/v3/place/text')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('keywords', keywords)
	url.searchParams.append('city', city)
	url.searchParams.append('citylimit', citylimit)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Text Search failed: ${data.info || data.infocode}`
		}
		let resciytes =
			data.suggestion && data.suggestion.ciytes
				? data.suggestion.ciytes.map((city: Record<string, any>) => {
						return {
							name: city.name
						}
					})
				: []
		return JSON.stringify(
			{
				suggestion: {
					keywords: data?.suggestion?.keywords,
					ciytes: resciytes
				},
				pois: data?.pois?.map((poi: Record<string, any>) => {
					return {
						id: poi.id,
						name: poi.name,
						address: poi.address,
						typecode: poi.typecode
					}
				})
			},
			null,
			2
		)
	} catch (e: any) {
		return `Text Search failed: ${e.message}`
	}
}

/**
 * 周边搜，根据用户传入关键词以及坐标location，搜索出radius半径范围的POI
 * @param location
 * @param radius
 * @param keywords
 */
async function handleAroundSearch(location: string, radius = '1000', keywords = '') {
	const url = new URL('https://restapi.amap.com/v3/place/around')
	url.searchParams.append('key', AMAP_MAPS_API_KEY)
	url.searchParams.append('location', location)
	url.searchParams.append('radius', radius)
	url.searchParams.append('keywords', keywords)
	url.searchParams.append('source', 'ts_mcp')
	try {
		const response = await fetch(url.toString())
		const data = await response.json()
		if (data.status !== '1') {
			return `Around Search failed: ${data.info || data.infocode}`
		}
		return JSON.stringify(
			{
				pois: data?.pois?.map((poi: Record<string, any>) => {
					return {
						id: poi.id,
						name: poi.name,
						address: poi.address,
						typecode: poi.typecode
					}
				})
			},
			null,
			2
		)
	} catch (e: any) {
		return `Around Search failed: ${e.message}`
	}
}

const MAPS_TOOLS = [
	{
		tool: REGEOCODE_TOOL,
		handler: async (params: any) => {
			const { location } = params
			return await handleReGeocode(location)
		}
	},
	{
		tool: GEO_TOOL,
		handler: async (params: any) => {
			const { address, city } = params
			return await handleGeo(address, city)
		}
	},
	{
		tool: IP_LOCATION_TOOL,
		handler: async (params: any) => {
			const { ip } = params
			return await handleIPLocation(ip)
		}
	},
	{
		tool: WEATHER_TOOL,
		handler: async (params: any) => {
			const { city } = params
			return await handleWeather(city)
		}
	},
	{
		tool: SEARCH_DETAIL_TOOL,
		handler: async (params: any) => {
			const { id } = params
			return await handleSearchDetail(id)
		}
	},
	{
		tool: BICYCLING_TOOL,
		handler: async (params: any) => {
			const { origin, destination } = params
			return await handleBicycling(origin, destination)
		}
	},
	{
		tool: WALKING_TOOL,
		handler: async (params: any) => {
			const { origin, destination } = params
			return await handleWalking(origin, destination)
		}
	},
	{
		tool: DRIVING_TOOl,
		handler: async (params: any) => {
			const { origin, destination } = params
			return await handleDriving(origin, destination)
		}
	},
	{
		tool: TRANSIT_INTEGRATED_TOOL,
		handler: async (params: any) => {
			const { origin, destination, city, cityd } = params
			return await handleTransitIntegrated(origin, destination, city, cityd)
		}
	},
	{
		tool: DISTANCE_TOOL,
		handler: async (params: any) => {
			const { origins, destination, type } = params
			return await handleDistance(origins, destination, type)
		}
	},
	{
		tool: TEXT_SEARCH_TOOL,
		handler: async (params: any) => {
			const { keywords, city, citylimit } = params
			return await handleTextSearch(keywords, city, citylimit)
		}
	},
	{
		tool: AROUND_SEARCH_TOOL,
		handler: async (params: any) => {
			const { location, radius, keywords } = params
			return await handleAroundSearch(location, radius, keywords)
		}
	}
]
export default MAPS_TOOLS
