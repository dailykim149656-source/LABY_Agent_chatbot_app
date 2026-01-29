import { fetchJson } from "@/lib/api"
import type {
  ChatRoomListResponse,
  ChatRoomCreateRequest,
  ChatRoomUpdateRequest,
  ChatRoom,
  ChatMessageListResponse,
  ChatMessageCreateRequest,
  ChatMessageCreateResponse,
} from "@/lib/types"

export async function fetchChatRooms(limit = 50, cursor?: string) {
  const search = new URLSearchParams({ limit: String(limit) })
  if (cursor) search.set("cursor", cursor)
  return fetchJson<ChatRoomListResponse>(`/api/chat/rooms?${search.toString()}`)
}

export async function createChatRoom(payload: ChatRoomCreateRequest) {
  return fetchJson<ChatRoom>(`/api/chat/rooms`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateChatRoom(roomId: string, payload: ChatRoomUpdateRequest) {
  return fetchJson<ChatRoom>(`/api/chat/rooms/${encodeURIComponent(roomId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function deleteChatRoom(roomId: string) {
  return fetchJson<{ status: string }>(`/api/chat/rooms/${encodeURIComponent(roomId)}`, {
    method: "DELETE",
  })
}

export async function fetchChatMessages(roomId: string, limit = 50, cursor?: string) {
  const search = new URLSearchParams({ limit: String(limit) })
  if (cursor) search.set("cursor", cursor)
  return fetchJson<ChatMessageListResponse>(
    `/api/chat/rooms/${encodeURIComponent(roomId)}/messages?${search.toString()}`
  )
}

export async function postChatMessage(roomId: string, payload: ChatMessageCreateRequest) {
  return fetchJson<ChatMessageCreateResponse>(
    `/api/chat/rooms/${encodeURIComponent(roomId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}
