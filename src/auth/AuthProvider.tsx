// AI-Generated: Auth context
// Generated-Date: 2026-10-26
// Description: Loads the signed-in employee from the session cookie

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useMemo, type ReactNode } from "react"
import { api, ApiError } from "../api/client"
import type { User } from "../api/types"

type AuthValue = {
  user: User | null
  loading: boolean
  error: Error | null
  login: (email: string, password: string, portal?: string) => Promise<{ user: User; landing: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

async function loadMe(): Promise<User | null> {
  try {
    return await api<User>("/me")
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ["me"], queryFn: loadMe, retry: false })

  const value = useMemo<AuthValue>(
    () => ({
      user: query.data ?? null,
      loading: query.isPending,
      error: query.error instanceof Error ? query.error : null,
      login: async (email: string, password: string, portal = "genie") => {
        const signedIn = await api<{ landing: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password, portal }),
        })
        const me = await loadMe()
        if (!me) throw new ApiError("Sign in to continue", 401)
        queryClient.setQueryData(["me"], me)
        return { user: me, landing: signedIn.landing }
      },
      logout: async () => {
        await api("/auth/logout", { method: "POST" })
        queryClient.setQueryData(["me"], null)
        queryClient.removeQueries({ predicate: (item) => item.queryKey[0] !== "me" })
      },
      refresh: async () => {
        await query.refetch()
      },
    }),
    [query, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error("AuthProvider is missing")
  return value
}
