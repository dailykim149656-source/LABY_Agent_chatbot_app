import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-storage"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

const SKIP_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/dev-login",
  "/api/auth/refresh",
  "/api/auth/logout",
]

const PUBLIC_ROUTES = ["/", "/about", "/login"]

function isPublicRoute(path: string): boolean {
  if (PUBLIC_ROUTES.includes(path)) return true
  if (path.startsWith("/about/")) return true
  return false
}

/**
 * ??? timezone? ????? (?: "Asia/Seoul")
 */
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

function shouldSkipAuth(path: string): boolean {
  return SKIP_AUTH_PATHS.some((prefix) => path.startsWith(prefix))
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return false
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) return false
  try {
    const data = await res.json()
    if (data?.access_token) {
      await setAccessToken(data.access_token)
    }
    if (data?.refresh_token) {
      await setRefreshToken(data.refresh_token)
    }
    return true
  } catch {
    return false
  }
}

export async function fetchJson<T>(
  path: string,
  options?: RequestInit,
  retry = true
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    "X-Timezone": getUserTimezone(),
    ...(options?.headers || {}),
  } as Record<string, string>

  if (!shouldSkipAuth(path)) {
    const token = await getAccessToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  })

  const skipRefresh = shouldSkipAuth(path)
  if (res.status === 401 && retry && !skipRefresh) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      return fetchJson<T>(path, options, false)
    }
  }

  if (res.status === 401) {
    await clearTokens()
    if (!skipRefresh && typeof window !== "undefined") {
      const currentPath = window.location.pathname
      if (!isPublicRoute(currentPath)) {
        window.location.href = "/login"
      }
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
