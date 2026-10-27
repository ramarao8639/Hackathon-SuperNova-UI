// AI-Generated: Route guards
// Generated-Date: 2026-10-26
// Description: Sends anonymous visitors to login and employees away from HR pages

import { Navigate, Outlet } from "react-router"
import { useAuth } from "../auth/AuthProvider"
import type { Role } from "../api/types"

export function RequireAuth() {
  const { user, loading, error, refresh } = useAuth()
  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" aria-label="Loading" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="center-screen">
        <div className="card">
          <h2>Employee Genie is unavailable</h2>
          <p className="muted">Check that the API is running, then try again.</p>
          <button className="btn" type="button" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireRole({ role, roles }: { role?: Role; roles?: Role[] }) {
  const { user } = useAuth()
  const allowed = roles ?? (role ? [role] : [])
  const ok = Boolean(user && (allowed.includes(user.role) || (allowed.includes("manager") && user.is_manager)))
  if (!ok) {
    return (
      <div className="card" style={{ margin: 24 }}>
        <h1 className="h1" style={{ fontSize: 36 }}>Admin and managers only</h1>
        <p>This area is not available for your role. The server enforces the same rule.</p>
      </div>
    )
  }
  return <Outlet />
}

export function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" aria-label="Loading" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to="/genie/persona" replace />
}
