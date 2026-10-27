// AI-Generated: Toast notifications
// Generated-Date: 2026-10-26
// Description: Short messages for blocked actions such as print and download

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type ToastValue = { toast: (message: string) => void }
const ToastContext = createContext<ToastValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const toast = useCallback((next: string) => {
    setMessage(next)
    window.setTimeout(() => setMessage((current) => (current === next ? null : current)), 3200)
  }, [])
  const value = useMemo(() => ({ toast }), [toast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div className="toast" role="status">
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error("ToastProvider is missing")
  return value
}
