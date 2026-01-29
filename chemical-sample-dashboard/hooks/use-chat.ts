import { useCallback, useEffect, useMemo, useState } from "react"

import { USE_MOCKS } from "@/lib/config"
import {
  createChatRoom,
  deleteChatRoom,
  fetchChatMessages,
  fetchChatRooms,
  postChatMessage,
  updateChatRoom,
} from "@/lib/data/chat"
import type { ChatMessage, ChatRoom } from "@/lib/types"

type MessagesByRoom = Record<string, ChatMessage[]>

const buildPreview = (content: string, maxLen = 200) => {
  const cleaned = content.replace(/\s+/g, " ").trim()
  if (cleaned.length <= maxLen) return cleaned
  return `${cleaned.slice(0, maxLen - 3).trim()}...`
}

export function useChatData(defaultRoomTitle = "New Chat") {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messagesByRoom, setMessagesByRoom] = useState<MessagesByRoom>({})
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const usingMocks = USE_MOCKS
  const fallbackTitle = defaultRoomTitle.trim().length > 0 ? defaultRoomTitle : "New Chat"

  const loadRooms = useCallback(async () => {
    if (usingMocks) return
    setIsLoadingRooms(true)
    try {
      const response = await fetchChatRooms(50, undefined)
      setRooms(response.items)
      setActiveRoomId((prev) => prev || response.items[0]?.id || null)
    } catch {
      setRooms([])
    } finally {
      setIsLoadingRooms(false)
    }
  }, [usingMocks])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const loadMessages = useCallback(
    async (roomId: string) => {
      if (usingMocks) return
      setIsLoadingMessages(true)
      try {
        const response = await fetchChatMessages(roomId, 200, undefined)
        setMessagesByRoom((prev) => ({ ...prev, [roomId]: response.items }))
      } catch {
        setMessagesByRoom((prev) => ({ ...prev, [roomId]: [] }))
      } finally {
        setIsLoadingMessages(false)
      }
    },
    [usingMocks]
  )

  useEffect(() => {
    if (!activeRoomId) return
    if (messagesByRoom[activeRoomId]) return
    loadMessages(activeRoomId)
  }, [activeRoomId, loadMessages, messagesByRoom])

  const createRoom = useCallback(
    async (title?: string) => {
      const safeTitle = title?.trim() || fallbackTitle
      if (usingMocks) {
        const now = new Date().toISOString()
        const room: ChatRoom = {
          id: String(Date.now()),
          title: safeTitle,
          roomType: "public",
          createdAt: now,
          lastMessageAt: null,
          lastMessagePreview: null,
        }
        setRooms((prev) => [room, ...prev])
        setActiveRoomId(room.id)
        setMessagesByRoom((prev) => ({ ...prev, [room.id]: [] }))
        return room
      }

      const room = await createChatRoom({ title: safeTitle })
      setRooms((prev) => [room, ...prev])
      setActiveRoomId(room.id)
      setMessagesByRoom((prev) => ({ ...prev, [room.id]: [] }))
      return room
    },
    [usingMocks, fallbackTitle]
  )

  const updateRoomPreview = useCallback((roomId: string, preview: string, lastAt: string) => {
    setRooms((prev) => {
      const updated = prev.map((room) =>
        room.id === roomId
          ? { ...room, lastMessageAt: lastAt, lastMessagePreview: preview }
          : room
      )
      const current = updated.find((room) => room.id === roomId)
      if (!current) return updated
      return [current, ...updated.filter((room) => room.id !== roomId)]
    })
  }, [])

  const sendMessage = useCallback(
    async (content: string, user?: string) => {
      const message = content.trim()
      if (!message || isSending) return

      let targetRoomId = activeRoomId
      if (!targetRoomId) {
        try {
          const room = await createRoom()
          targetRoomId = room.id
        } catch {
          return
        }
      }

      if (!targetRoomId) return

      const now = new Date().toISOString()
      const optimisticUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        roomId: targetRoomId,
        role: "user",
        content: message,
        createdAt: now,
        senderType: "guest",
        senderId: null,
        senderName: user || "Guest",
      }

      setMessagesByRoom((prev) => ({
        ...prev,
        [targetRoomId]: [...(prev[targetRoomId] || []), optimisticUserMessage],
      }))
      updateRoomPreview(targetRoomId, buildPreview(message), now)
      setIsSending(true)

      if (usingMocks) {
        const assistantMessage: ChatMessage = {
          id: `mock-${Date.now()}`,
          roomId: targetRoomId,
          role: "assistant",
          content: `Mock response: ${message}`,
          createdAt: new Date().toISOString(),
          senderType: "assistant",
          senderId: null,
          senderName: "Assistant",
        }
        setMessagesByRoom((prev) => ({
          ...prev,
          [targetRoomId]: [...(prev[targetRoomId] || []), assistantMessage],
        }))
        updateRoomPreview(
          targetRoomId,
          buildPreview(assistantMessage.content),
          assistantMessage.createdAt
        )
        setIsSending(false)
        return
      }

      try {
        const response = await postChatMessage(
          targetRoomId,
          {
            message,
            user,
            sender_type: "guest",
          }
        )

        setMessagesByRoom((prev) => {
          const current = prev[targetRoomId] || []
          const cleaned = current.filter((item) => item.id !== optimisticUserMessage.id)
          return {
            ...prev,
            [targetRoomId]: [
              ...cleaned,
              response.userMessage,
              response.assistantMessage,
            ],
          }
        })

        updateRoomPreview(
          targetRoomId,
          buildPreview(response.assistantMessage.content),
          response.assistantMessage.createdAt
        )
      } catch {
        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          roomId: targetRoomId,
          role: "assistant",
          content: "Unable to reach the assistant right now.",
          createdAt: new Date().toISOString(),
          senderType: "assistant",
          senderId: null,
          senderName: "Assistant",
        }
        setMessagesByRoom((prev) => ({
          ...prev,
          [targetRoomId]: [...(prev[targetRoomId] || []), errorMessage],
        }))
      } finally {
        setIsSending(false)
      }
    },
    [activeRoomId, createRoom, isSending, updateRoomPreview, usingMocks]
  )

  const renameRoom = useCallback(
    async (roomId: string, title: string) => {
      const trimmed = title.trim()
      const safeTitle = trimmed.length > 0 ? trimmed : fallbackTitle
      if (usingMocks) {
        setRooms((prev) =>
          prev.map((room) => (room.id === roomId ? { ...room, title: safeTitle } : room))
        )
        return
      }
      const updated = await updateChatRoom(roomId, { title: safeTitle })
      setRooms((prev) => prev.map((room) => (room.id === roomId ? updated : room)))
    },
    [usingMocks, fallbackTitle]
  )

  const deleteRoom = useCallback(
    async (roomId: string) => {
      if (usingMocks) {
        setRooms((prev) => {
          const updated = prev.filter((room) => room.id !== roomId)
          const nextActive = updated[0]?.id ?? null
          setActiveRoomId((current) => (current === roomId ? nextActive : current))
          return updated
        })
        setMessagesByRoom((prev) => {
          const { [roomId]: _, ...rest } = prev
          return rest
        })
        return
      }

      await deleteChatRoom(roomId)
      setRooms((prev) => {
        const updated = prev.filter((room) => room.id !== roomId)
        const nextActive = updated[0]?.id ?? null
        setActiveRoomId((current) => (current === roomId ? nextActive : current))
        return updated
      })
      setMessagesByRoom((prev) => {
        const { [roomId]: _, ...rest } = prev
        return rest
      })
    },
    [usingMocks]
  )

  const messages = useMemo(() => {
    if (!activeRoomId) return []
    return messagesByRoom[activeRoomId] || []
  }, [activeRoomId, messagesByRoom])

  return {
    rooms,
    activeRoomId,
    setActiveRoomId,
    messages,
    isLoadingRooms,
    isLoadingMessages,
    isSending,
    createRoom,
    sendMessage,
    renameRoom,
    deleteRoom,
    reloadRooms: loadRooms,
  }
}
