import { fetchJson } from "@/lib/api"
import type {
  ExperimentListResponse,
  ExperimentDetail,
  ExperimentCreateRequest,
  ExperimentUpdateRequest,
  ExperimentReagentCreateRequest,
  ExperimentReagent,
} from "@/lib/types"

export async function fetchExperiments(limit = 50, cursor?: string) {
  const search = new URLSearchParams({ limit: String(limit) })
  if (cursor) search.set("cursor", cursor)
  return fetchJson<ExperimentListResponse>(`/api/experiments?${search.toString()}`)
}

export async function fetchExperimentDetail(expId: string) {
  return fetchJson<ExperimentDetail>(`/api/experiments/${encodeURIComponent(expId)}`)
}

export async function createExperiment(payload: ExperimentCreateRequest) {
  return fetchJson<ExperimentDetail>(`/api/experiments`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateExperiment(expId: string, payload: ExperimentUpdateRequest) {
  return fetchJson<ExperimentDetail>(`/api/experiments/${encodeURIComponent(expId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function addExperimentReagent(
  expId: string,
  payload: ExperimentReagentCreateRequest
) {
  return fetchJson<ExperimentReagent>(`/api/experiments/${encodeURIComponent(expId)}/reagents`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function removeExperimentReagent(expId: string, expReagentId: string) {
  return fetchJson<{ status: string }>(
    `/api/experiments/${encodeURIComponent(expId)}/reagents/${encodeURIComponent(expReagentId)}`,
    { method: "DELETE" }
  )
}
