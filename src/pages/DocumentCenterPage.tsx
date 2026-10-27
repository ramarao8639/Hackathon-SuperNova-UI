// AI-Generated: Document center
// Generated-Date: 2026-10-26
// Description: Shared documents with tabs, search, and links into the viewer

import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import { api } from "../api/client"
import type { DocItem, DocList } from "../api/types"
import { duePhrase } from "../format"
import { useGenie } from "../genie/GenieDock"

type Tab = "all" | "todo" | "done"

export function DocumentCenterPage() {
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState("")
  const documents = useQuery({
    queryKey: ["documents", "all"],
    queryFn: () => api<DocList>("/me/documents?tab=all"),
  })
  const items = documents.data?.items
  const searched = useMemo(() => {
    const rows = items ?? []
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(needle))
  }, [items, query])
  const counts = {
    all: searched.length,
    todo: searched.filter((item) => item.status !== "acknowledged").length,
    done: searched.filter((item) => item.status === "acknowledged").length,
  }
  const visible = searched.filter((item) => {
    if (tab === "todo") return item.status !== "acknowledged"
    if (tab === "done") return item.status === "acknowledged"
    return true
  })
  const overdue = (items ?? []).filter((item) => item.overdue).length

  return (
    <div>
      <div className="section-head">
        <div>
          <div className="mono">Your record</div>
          <h1 className="h1" style={{ fontSize: 48 }}>Document center</h1>
        </div>
      </div>
      <div className="tiles">
        <article className="tile"><span className="mono">To acknowledge</span><strong>{documents.data?.counts.todo ?? "—"}</strong></article>
        <article className="tile"><span className="mono">Overdue</span><strong>{documents.isSuccess ? overdue : "—"}</strong></article>
        <article className="tile"><span className="mono">Acknowledged</span><strong>{documents.data?.counts.done ?? "—"}</strong></article>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="tabs" role="tablist">
          {(["all", "todo", "done"] as Tab[]).map((key) => (
            <button key={key} className={tab === key ? "tab on" : "tab"} type="button" onClick={() => setTab(key)}>
              {key === "todo" ? "To acknowledge" : key === "done" ? "Acknowledged" : "All"} · {counts[key]}
            </button>
          ))}
        </div>
        <input className="text-input" style={{ maxWidth: 280 }} placeholder="Search documents" aria-label="Search documents" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {documents.isPending ? <div className="card skeleton-card" /> : null}
      {documents.isError ? <div className="card error-card">Documents could not be loaded. <button className="btn ghost" type="button" onClick={() => void documents.refetch()}>Retry</button></div> : null}
      {documents.isSuccess && visible.length === 0 ? <p className="muted">Nothing matches this view.</p> : null}
      {visible.map((item) => <Row key={item.version_id} item={item} />)}
    </div>
  )
}

function Row({ item }: { item: DocItem }) {
  const tone = item.overdue ? "overdue" : item.status
  const { ask, busy } = useGenie()
  return (
    <article className="doc-row">
      <div className="doc-ico" aria-hidden="true">{item.title.slice(0, 1)}</div>
      <div>
        <strong>{item.title}</strong>
        <div className="muted">v{item.version_no} · {item.page_count} pages · {item.mandatory ? "Mandatory" : "Optional"} · {item.category}</div>
        <div className="muted">{item.ack_due_on ? duePhrase(item.ack_due_on) : "No due date"}</div>
      </div>
      <div className="row-actions">
        <span className={`status ${tone}`}>{item.overdue ? "Overdue" : item.status}</span>
        <Link className="btn ghost" to={`/genie/view/${item.version_id}`}>View</Link>
        <button className="btn ghost" type="button" disabled={busy} onClick={() => void ask(`Summarize the policy "${item.title}" in clear steps.`)}>Summarize</button>
        {item.status !== "acknowledged" ? <Link className="btn gold" to={`/genie/view/${item.version_id}`}>Acknowledge</Link> : null}
      </div>
    </article>
  )
}
