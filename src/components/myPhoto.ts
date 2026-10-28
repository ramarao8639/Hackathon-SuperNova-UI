// AI-Generated: Load the signed-in person's photo with the session token
// Generated-Date: 2026-10-29
// Description: Image tags cannot send the bearer token, so the photo is fetched and shown from memory.

import { useQuery, useQueryClient } from "@tanstack/react-query"

const TOKEN_KEY = "supernova_access"

async function loadPhoto(): Promise<string | null> {
  const headers = new Headers()
  const token = sessionStorage.getItem(TOKEN_KEY) ?? ""
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch("/api/me/photo?size=128", { headers, credentials: "include" })
  if (!response.ok) return null
  return URL.createObjectURL(await response.blob())
}

export function useMyPhoto(): string | null {
  const photo = useQuery({
    queryKey: ["my-photo"],
    queryFn: loadPhoto,
    staleTime: 60_000,
  })
  return photo.data ?? null
}

export function refreshMyPhoto(queryClient: ReturnType<typeof useQueryClient>) {
  const current = queryClient.getQueryData<string | null>(["my-photo"])
  if (current) URL.revokeObjectURL(current)
  return queryClient.invalidateQueries({ queryKey: ["my-photo"] })
}
