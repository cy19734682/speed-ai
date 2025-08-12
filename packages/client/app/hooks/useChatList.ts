import { useState, useEffect } from 'react'
import { useChatStore } from '@/app/store'
import {PaginatedGroup} from "@/app/lib/type"
import {groupByTime} from "@/app/lib/util"

export default function useChatList() {
	const { messages, currentChatId, createCurrentChatId, updateCurrentChatId, removeMessage } =
		useChatStore()
  
  const [chatGroups, setChatGroups] = useState<PaginatedGroup[]>([])
  
  useEffect(() => {
    const {groups} = groupByTime(messages, 'createdAt', { page: 1, pageSize: 1000 });
    setChatGroups(groups)
  }, [messages])
  
	/**
	 * 创建新的消息
	 */
	const handleNewMessage = () => {
    createCurrentChatId()
	}
 
	/**
	 * 选中聊天
	 */
	const selectChat = (chatId: string) => {
    updateCurrentChatId(chatId)
	}

	return {
    currentChatId,
    chatGroups,
    selectChat,
    removeMessage,
    handleNewMessage
	}
}
