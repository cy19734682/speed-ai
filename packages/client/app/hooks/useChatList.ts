import { useState, useEffect } from 'react'
import { useChatStore } from '@/app/store/useChatStore'
import {ChatMessages} from "@/app/lib/type"

export default function useChatList() {
	const { messages, currentChatId, createCurrentChatId, updateCurrentChatId, removeMessage } =
		useChatStore()
  
  const [chatList, setChatList] = useState<ChatMessages[]>([])
  
  useEffect(() => {
    setChatList(messages)
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
    chatList,
    selectChat,
    removeMessage,
    handleNewMessage
	}
}
