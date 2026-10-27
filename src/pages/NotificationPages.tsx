// AI-Generated: Notification center and dev mailbox
// Generated-Date: 2026-10-27
// Description: Lists the signed-in person's notices and the system-admin mock mailbox.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"
import { api } from "../api/client"

type Notice = { id: string; type: string; title: string; body: string; link: string; read: boolean }
type Mail = { id: string; template: string; to_email: string; status: string; at: string; demo_link: string }

export function NotificationsPage() {
  const [filter, setFilter] = useState("")
  const client = useQueryClient()
  const list = useQuery({
    queryKey: ["notices", filter],
    queryFn: () => api<{ unread: number; items: Notice[] }>(`/notifications${filter ? `?type_filter=${encodeURIComponent(filter)}` : ""}`),
  })
  const mark = useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "POST" }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["notices"] }),
  })
  return (
    <section className="card">
      <h1>Notifications</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input aria-label="Filter by type" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Type" />
        <button className="btn ghost" type="button" onClick={() => mark.mutate()}>Mark all read</button>
        <Link to="/hrms/notification-prefs">Preferences</Link>
      </div>
      {(list.data?.items ?? []).map((item) => (
        <article key={item.id}>
          <strong>{item.title}</strong>
          <p className="muted">{item.body}</p>
          {item.link ? <Link to={item.link}>Open</Link> : null}
        </article>
      ))}
      {list.data?.items.length === 0 ? <p className="muted">Nothing here.</p> : null}
    </section>
  )
}

export function NotificationPrefsPage() {
  const client = useQueryClient()
  const [quiet, setQuiet] = useState("22:00-07:00")
  const save = useMutation({
    mutationFn: () => api("/notifications/prefs", { method: "PUT", body: JSON.stringify({ type: "approval_needed", channel: "email", enabled: true, quiet_hours: quiet }) }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["notice-prefs"] }),
  })
  const prefs = useQuery({ queryKey: ["notice-prefs"], queryFn: () => api<{ items: Array<{ type: string; channel: string; quiet_hours: string }> }>("/notifications/prefs") })
  return (
    <section className="card">
      <h1>Notification preferences</h1>
      <label>Quiet hours <input aria-label="Quiet hours" value={quiet} onChange={(event) => setQuiet(event.target.value)} /></label>
      <button className="btn gold" type="button" onClick={() => save.mutate()}>Save</button>
      {(prefs.data?.items ?? []).map((item) => <p key={`${item.type}-${item.channel}`}>{item.type} · {item.channel} · {item.quiet_hours || "always"}</p>)}
    </section>
  )
}

export function MailboxPage() {
  const list = useQuery({ queryKey: ["mailbox"], queryFn: () => api<{ items: Mail[] }>("/admin/dev-mailbox") })
  return (
    <section className="card">
      <h1>Dev mailbox</h1>
      <p className="muted">Mock mail only. The password is not stored here.</p>
      {(list.data?.items ?? []).map((item) => (
        <article key={item.id}>
          <strong>{item.template}</strong>
          <p className="muted">{item.to_email} · {item.status}</p>
          {item.demo_link ? <a href={item.demo_link}>Open the link</a> : null}
        </article>
      ))}
    </section>
  )
}
