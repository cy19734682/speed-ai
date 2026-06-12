import { useState, useEffect } from 'react'
import { useChatStore } from '@/app/store'
import { PaginatedGroup } from '@/app/lib/type'
import { groupByTime } from '@/app/lib/util'

export default function useChatList() {
	const { messages, currentChatId, createCurrentChatId, updateCurrentChatId, removeMessage } = useChatStore()

	const [chatGroups, setChatGroups] = useState<PaginatedGroup[]>([])

	useEffect(() => {
		if (messages?.length > 0) {
			const { groups } = groupByTime(messages, 'createdAt', { page: 1, pageSize: 1000 })
			setChatGroups(groups)
		}
	}, [messages])

	return {
		currentChatId,
		chatGroups,
		updateCurrentChatId,
		removeMessage,
		createCurrentChatId
	}
}
