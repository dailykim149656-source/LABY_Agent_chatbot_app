import { fetchJson } from "@/lib/api"
import type {
  ReagentListResponse,
  ReagentItem,
  ReagentCreateRequest,
  ReagentUpdateRequest,
  ReagentDisposalCreateRequest,
  ReagentDisposalResponse,
  ReagentDisposalListResponse,
  StorageEnvironmentResponse,
} from "@/lib/types"

export async function fetchReagents(limit = 100, cursor?: string) {
  const search = new URLSearchParams({ limit: String(limit) })
  if (cursor) search.set("cursor", cursor)
  return fetchJson<ReagentListResponse>(`/api/reagents?${search.toString()}`)
}

export async function fetchReagent(reagentId: string) {
  return fetchJson<ReagentItem>(`/api/reagents/${encodeURIComponent(reagentId)}`)
}

export async function createReagent(payload: ReagentCreateRequest) {
  return fetchJson<ReagentItem>(`/api/reagents`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateReagent(reagentId: string, payload: ReagentUpdateRequest) {
  return fetchJson<ReagentItem>(`/api/reagents/${encodeURIComponent(reagentId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function disposeReagent(reagentId: string, payload: ReagentDisposalCreateRequest) {
  return fetchJson<ReagentDisposalResponse>(
    `/api/reagents/${encodeURIComponent(reagentId)}/dispose`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function fetchDisposals(limit = 100, cursor?: string) {
  const search = new URLSearchParams({ limit: String(limit) })
  if (cursor) search.set("cursor", cursor)
  return fetchJson<ReagentDisposalListResponse>(
    `/api/reagents/disposals?${search.toString()}`
  )
}

export async function fetchStorageEnvironment() {
  return fetchJson<StorageEnvironmentResponse>("/api/reagents/storage-environment")
}
