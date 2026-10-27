// AI-Generated: API client
// Generated-Date: 2026-10-26
// Description: Cookie-authenticated fetch with a single refresh retry and CSRF header

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export function readCsrf(): string {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : ""
}

const TOKEN_KEY = "supernova_access"
let refreshPromise: Promise<boolean> | null = null

function readToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) ?? ""
}

function writeToken(token: string) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

async function refreshSession(): Promise<boolean> {
  const token = readCsrf()
  if (!token) return false
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": token },
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function api<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers)
  const method = (options.method ?? "GET").toUpperCase()
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRF-Token", readCsrf())
  }
  const token = readToken()
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`/api${path}`, { ...options, headers, credentials: "include" })
  if (response.status === 401 && !retried && !path.startsWith("/auth/")) {
    const ok = await refreshSession()
    if (ok) return api<T>(path, options, true)
  }
  if (!response.ok) {
    let detail = "Request failed"
    try {
      const body = (await response.json()) as { detail?: unknown }
      if (typeof body.detail === "string") detail = body.detail
    } catch {
      detail = response.statusText || detail
    }
    throw new ApiError(detail, response.status)
  }
  if (path === "/auth/logout") clearToken()
  if (response.status === 204) return undefined as T
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const body = (await response.json()) as T
    if (body && typeof body === "object" && "access_token" in body) {
      const issued = (body as { access_token?: unknown }).access_token
      if (typeof issued === "string") writeToken(issued)
    }
    return body
  }
  return undefined as T
}
