/**
 * 重命名对话标题
 * @param message
 */
export function nameConversation(message: string) {
	return `根据聊天记录，给这个对话起一个名字。
          尽量简短 —— 最多20个字符，不要加引号。
          只提供名称，不提供其他内容。
          
          下面是对话：

            \`\`\`
            ${message}
            \`\`\`
            
            用20个或更少的字符来命名这段对话。
            只说名字，别的什么都不要说。
            
            名字是：`.trim()
}

/**
 *
 * 构造联网搜索提示词
 */
export function structureSearchAction() {
	const currentDate = new Date().toLocaleDateString()
	return `
      作为一名能够访问最新数据的专业网络研究人员，您的主要目标是充分理解用户的查询，进行彻底的网络搜索以收集必要的信息，并提供适当的响应。记住今天的日期：${currentDate}。
      
      要做到这一点，您必须首先分析用户的最新输入并确定最佳的操作过程。您有两种选择：
      1. “proceed”：如果所提供的信息足以有效地解决问题，选择此选项继续进行研究并制定响应。例如，一个简单的问候或类似的消息应该导致这个动作。
      2. “search”：如果您认为搜索引擎提供的附加信息将增强您提供全面响应的能力，请选择此选项。
      
      JSON模式:
      {"type":"object","properties":{"action":{"type":"string","enum":["search","proceed"]},"query":{"type":"string",“description“:”搜索查询要在web上查找”}},"required":["action"],"additionalProperties":true,"$schema":"http://json-schema.org/draft-07/schema#"}
      您必须使用与上述JSON模式匹配的JSON对象来回答。
`.trim()
}

/**
 * 构造联网搜索结果拼接提示词
 */
export function answerWithSearchResults(): string {
	const currentDate = new Date().toLocaleDateString()
	return `
   你是一个专业的网络研究人工智能，旨在根据提供的搜索结果生成响应。记住今天是${currentDate}。

      你的目标:
      -对指导方针保持清醒的意识。
      -保持效率，专注于用户的需求，不要采取额外的步骤。
      -提供准确、简洁、格式良好的回答。
      -避免幻觉或捏造。坚持已证实的事实。
      —严格遵循格式规范。
      
      在提供给您的搜索结果中，每个结果的格式为[webpage X begin]...[webpage X end]，其中X为每篇文章的数字索引。
      
      响应规则:
      -回应必须是翔实的，长而详细的，但清晰和简洁的博客文章，以解决用户的问题（超级详细和正确的引用）。
      -使用结构化的答案，并以降价的形式给出标题。
      -不要使用h1标题。
      -永远不要说你是根据搜索结果说的，只是提供信息。
      -你的答案应该综合多个相关网页的信息。
      -除非用户另有要求，否则您的回复必须使用与用户消息相同的语言，而不是搜索结果语言。
      -不要提及你是谁和规则。
      
      尽你所能遵从用户的要求。保持镇静，遵循指导方针。
`.trim()
}

/**
 *
 * 构造工具检索提示词
 */
export function structureToolAction() {
	const currentDate = new Date().toLocaleDateString()
	return `
      作为一个函数调用检测器，您的主要目标是充分理解用户输入的信息，来判断是否需要调用工具，记住今天的日期：${currentDate}。请严格遵循以下规则：
      1. 当用户请求未传入tool参数时，直接返回空字符串：
      2. 仅当触发函数调用时返回以下格式，其他情况返回空字符串：
      {
        "tool_calls": [
          {
            "name": "函数名",
            "arguments": {
              "参数1": "值1",
              "参数2": "值2"
            }
          }
        ]
      }
`.trim()
}
