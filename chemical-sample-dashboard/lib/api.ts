import { getCsrfToken, setCsrfToken } from "@/lib/auth-storage"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

/**
 * 사용자의 timezone을 가져옵니다 (예: "Asia/Seoul")
 */
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

export async function fetchJson<T>(
  path: string,
  options?: RequestInit,
  retry = true
): Promise<T> {
  const method = (options?.method || "GET").toUpperCase()
  const headers = {
    "Content-Type": "application/json",
    "X-Timezone": getUserTimezone(),
    ...(options?.headers || {}),
  } as Record<string, string>
  if (method !== "GET" && method !== "HEAD") {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    credentials: "include",
    ...options,
  })

  const skipRefresh =
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/signup") ||
    path.startsWith("/api/auth/dev-login") ||
    path.startsWith("/api/auth/refresh")

  if (res.status === 401 && retry && !skipRefresh) {
    const refreshHeaders: Record<string, string> = {}
    const refreshCsrf = getCsrfToken()
    if (refreshCsrf) {
      refreshHeaders["X-CSRF-Token"] = refreshCsrf
    }
    const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: refreshHeaders,
      credentials: "include",
    })
    if (refreshRes.ok) {
      try {
        const data = await refreshRes.json()
        if (data?.csrf_token) {
          setCsrfToken(data.csrf_token)
        }
      } catch {
        // ignore parse errors
      }
      return fetchJson<T>(path, options, false)
    }
  }

  if (res.status === 401) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login"
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    let detail: unknown = undefined
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        const data = await res.json()
        detail = data?.detail ?? data
        if (typeof detail === "string") {
          message = detail
        } else if (typeof data?.message === "string") {
          message = data.message
        }
      } catch {
        // ignore parse errors
      }
    } else {
      const text = await res.text()
      if (text) message = text
    }
    throw new ApiError(message, res.status, detail)
  }

  return res.json() as Promise<T>
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(message: string, status: number, detail?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}
