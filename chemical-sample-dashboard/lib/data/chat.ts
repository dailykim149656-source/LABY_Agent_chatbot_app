import { fetchJson } from "@/lib/api"
import { buildApiQuery } from "@/lib/data-utils"
import type {
  ChatRoomListResponse,
  ChatRoomCreateRequest,
  ChatRoomUpdateRequest,
  ChatRoom,
  ChatMessageListResponse,
  ChatMessageCreateRequest,
  ChatMessageCreateResponse,
} from "@/lib/types"

export async function fetchChatRooms(
  limit = 50,
  cursor?: string,
  lang?: string,
  includeI18n?: boolean
) {
  const qs = buildApiQuery({ limit, cursor, lang, includeI18n })
  return fetchJson<ChatRoomListResponse>(`/api/chat/rooms${qs}`)
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

export async function fetchChatMessages(
  roomId: string,
  limit = 50,
  cursor?: string,
  lang?: string,
  includeI18n?: boolean
) {
  const qs = buildApiQuery({ limit, cursor, lang, includeI18n })
  return fetchJson<ChatMessageListResponse>(
    `/api/chat/rooms/${encodeURIComponent(roomId)}/messages${qs}`
  )
}

export async function postChatMessage(
  roomId: string,
  payload: ChatMessageCreateRequest,
  lang?: string,
  includeI18n?: boolean
) {
  const qs = buildApiQuery({ lang, includeI18n })
  return fetchJson<ChatMessageCreateResponse>(
    `/api/chat/rooms/${encodeURIComponent(roomId)}/messages${qs}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}
