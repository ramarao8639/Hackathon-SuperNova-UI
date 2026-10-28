// AI-Generated: PeopleDesk profile
// Generated-Date: 2026-10-26
// Description: About, job, performance, and team tabs for the signed-in person

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api } from "../api/client"
import type { DocList } from "../api/types"
import { useAuth } from "../auth/AuthProvider"
import { Avatar } from "../components/Avatar"
import { refreshMyPhoto, useMyPhoto } from "../components/myPhoto"
import { formatDate } from "../format"

type ReviewStatus = "published" | "none" | null
type Summary = {
  id: string
  name: string
  title: string
  performance_pct: number | null
  review_status: ReviewStatus
}
type Score = Summary & { cycle: string | null; goals: { title: string; weight: number; progress: number }[] }
type Report = Summary & { employee_no: string; designation: string }

const TABS = ["About", "Job", "Performance", "Team"] as const

export function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<(typeof TABS)[number]>("About")
  const [photoError, setPhotoError] = useState("")
  const photoUrl = useMyPhoto()
  const summary = useQuery({
    queryKey: ["summary", user?.id],
    enabled: Boolean(user),
    queryFn: () => api<Summary>(`/hris/employees/${user?.id}/summary`),
  })
  const score = useQuery({
    queryKey: ["score", user?.id],
    enabled: Boolean(user),
    queryFn: () => api<Score>(`/performance/score?employeeId=${user?.id}`),
  })
  const journey = useQuery({
    queryKey: ["persona", "journey"],
    queryFn: () => api<Record<string, string>>("/me/persona/cards/journey"),
  })
  const balances = useQuery({
    queryKey: ["balances"],
    queryFn: () => api<{ items: { type_code: string; available: number }[] }>("/time/balances"),
  })
  const documents = useQuery({
    queryKey: ["documents", "all"],
    queryFn: () => api<DocList>("/me/documents?tab=all"),
  })
  const manager = useQuery({
    queryKey: ["summary", user?.manager_id],
    enabled: Boolean(user?.manager_id),
    queryFn: () => api<Summary>(`/hris/employees/${user?.manager_id}/summary`),
  })
  const reports = useQuery({
    queryKey: ["team"],
    enabled: Boolean(user?.is_manager),
    queryFn: () => api<{ items: Report[] }>("/time/team"),
  })
  if (!user) return null
  const ring = summary.data
  const earned = balances.data?.items.find((item) => item.type_code === "EL")
  const probation = summary.data?.review_status === "none" ? "In probation" : "Confirmed"
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Profile</h1>
      <div className="profile-head">
        <Avatar name={user.name} pct={ring?.performance_pct} reviewStatus={ring?.review_status} size={96} showPct photoUrl={photoUrl} />
        <div>
          <label className="btn">
            Update photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (!file) return
                setPhotoError("")
                const body = new FormData()
                body.set("file", file)
                api("/me/photo", { method: "POST", body })
                  .then(() => refreshMyPhoto(queryClient))
                  .catch((error: Error) => setPhotoError(error.message === "Sign in to continue" ? "Sign in again, then choose the photo." : error.message))
              }}
            />
          </label>
          {photoError ? <p className="muted">{photoError}</p> : null}
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <p>{user.designation} · {user.department.name} · {user.branch.city}</p>
          <p className="mono">{user.employee_no} · {user.role.replaceAll("_", " ")}</p>
          <p>{ring?.review_status === "none" ? "No review yet" : ring?.performance_pct != null ? `Performance ${ring.performance_pct}%` : "Performance hidden"}</p>
        </div>
      </div>
      <div className="tiles">
        <article className="card"><p className="mono">Time with company</p><strong>{journey.data?.tenure_label ?? "—"}</strong></article>
        <article className="card"><p className="mono">Earned leave</p><strong>{earned ? `${earned.available} days` : "—"}</strong></article>
        <article className="card"><p className="mono">Programmes completed</p><strong>0</strong></article>
        <article className="card"><p className="mono">Documents to acknowledge</p><strong>{documents.data?.counts.todo ?? 0}</strong></article>
      </div>
      <div className="tab-row" role="tablist">
        {TABS.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} type="button" onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "About" ? (
        <article className="card">
          <p>Email · {user.email}</p>
          <p>Phone · Not on file</p>
          <p>Location · {user.branch.city}, IN</p>
          <p>Joined · {formatDate(journey.data?.joined_on)}</p>
          <p>Emergency contact · Not on file</p>
          <p>Skills · Not on file</p>
        </article>
      ) : null}
      {tab === "Job" ? (
        <article className="card">
          <p>Designation · {user.designation}</p>
          <p>Department · {user.department.name}</p>
          <p>Branch · {user.branch.name}</p>
          <p>Reporting manager · {user.manager?.name ?? "—"}</p>
          <p>Shift · General, 9:00–18:00</p>
          <p>Leave plan · Standard India</p>
          <p>Holiday calendar · {user.branch.name}</p>
          <p>Probation · {probation}</p>
        </article>
      ) : null}
      {tab === "Performance" ? (
        <article className="card">
          <Avatar name={user.name} pct={score.data?.performance_pct} reviewStatus={score.data?.review_status} size={72} showPct />
          {score.data?.review_status === "none" ? <p>No review yet</p> : null}
          <p>{score.data?.cycle ?? ""}</p>
          {(score.data?.goals ?? []).map((goal) => (
            <p key={goal.title}>{goal.title} · weight {goal.weight} · progress {goal.progress}</p>
          ))}
        </article>
      ) : null}
      {tab === "Team" ? (
        <div className="stack">
          <article className="card">
            <p className="mono">Reporting line</p>
            {manager.data ? (
              <p><Avatar name={manager.data.name} pct={manager.data.performance_pct} reviewStatus={manager.data.review_status} size={48} showPct /> {manager.data.name} · {manager.data.title}</p>
            ) : <p>No manager on record.</p>}
          </article>
          <article className="card">
            <p className="mono">Direct reports</p>
            {(reports.data?.items ?? []).length === 0 ? <p>No direct reports.</p> : null}
            {(reports.data?.items ?? []).map((person) => (
              <p key={person.id}>
                <Avatar name={person.name} pct={person.performance_pct} reviewStatus={person.review_status} size={48} showPct /> {person.name} · {person.designation}
              </p>
            ))}
          </article>
        </div>
      ) : null}
    </section>
  )
}
