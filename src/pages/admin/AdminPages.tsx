// AI-Generated: HR admin pages
// Generated-Date: 2026-10-26
// Description: Overview, document list, publish, tracking, and email templates

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router"
import { api } from "../../api/client"
import type { AdminDoc, Directory, Draft, Overview, Preview, Target, Template, Tracking } from "../../api/types"
import { duePhrase, formatDate, formatWhen } from "../../format"

function useDirectory() {
  return useQuery({ queryKey: ["directory"], queryFn: () => api<Directory>("/admin/directory") })
}

export function AudienceBuilder({
  directory,
  targets,
  onChange,
  preview,
}: {
  directory: Directory
  targets: Target[]
  onChange: (targets: Target[]) => void
  preview?: Preview
}) {
  const [personQuery, setPersonQuery] = useState("")
  const everyone = targets.some((target) => target.target_type === "all")
  const selected = (type: Target["target_type"], id: string) =>
    targets.some((target) => target.target_type === type && target.target_id === id)

  function toggle(target: Target) {
    const exists = targets.some((item) => item.target_type === target.target_type && item.target_id === target.target_id)
    onChange(exists ? targets.filter((item) => !(item.target_type === target.target_type && item.target_id === target.target_id)) : [...targets, target])
  }

  const people = directory.people.filter((person) => `${person.name} ${person.email}`.toLowerCase().includes(personQuery.trim().toLowerCase())).slice(0, 6)

  return (
    <div className="preview-box">
      <div className="mono">Audience</div>
      <div className="choice-row">
        <button className={everyone ? "choice on" : "choice"} type="button" onClick={() => onChange(everyone ? [] : [{ target_type: "all", target_id: null, label: "Everyone" }])}>
          Everyone
        </button>
      </div>
      {everyone ? <p>Everyone already includes every active employee.</p> : (
        <>
          <div className="mono" style={{ marginTop: 12 }}>Branches</div>
          <div className="choice-row">
            {directory.branches.map((branch) => (
              <button key={branch.id} className={selected("branch", branch.id) ? "choice on" : "choice"} type="button" onClick={() => toggle({ target_type: "branch", target_id: branch.id, label: branch.name })}>
                {branch.name} · {branch.count}
              </button>
            ))}
          </div>
          <div className="mono" style={{ marginTop: 12 }}>Departments</div>
          <div className="choice-row">
            {directory.departments.map((department) => (
              <button key={department.id} className={selected("department", department.id) ? "choice on" : "choice"} type="button" onClick={() => toggle({ target_type: "department", target_id: department.id, label: department.name })}>
                {department.name} · {department.count}
              </button>
            ))}
          </div>
          <div className="mono" style={{ marginTop: 12 }}>Groups</div>
          <div className="choice-row">
            {directory.groups.map((group) => (
              <button key={group.id} className={selected("group", group.id) ? "choice on" : "choice"} type="button" onClick={() => toggle({ target_type: "group", target_id: group.id, label: group.name })}>
                {group.name} · {group.count}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Specific people</span>
            <input value={personQuery} onChange={(event) => setPersonQuery(event.target.value)} placeholder="Search by name" />
          </label>
          <div className="choice-row">
            {people.map((person) => (
              <button key={person.id} className={selected("user", person.id) ? "choice on" : "choice"} type="button" onClick={() => toggle({ target_type: "user", target_id: person.id, label: person.name })}>
                {person.name}
              </button>
            ))}
          </div>
        </>
      )}
      <p><strong>{preview ? `${preview.count} employees will receive this` : "Choose an audience to see the count"}</strong></p>
      <ul>{preview?.preview.map((person) => <li key={person.employee_no}>{person.name} · {person.employee_no} · {person.branch}</li>)}</ul>
    </div>
  )
}

export function OverviewPage() {
  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: () => api<Overview>("/admin/overview") })
  if (overview.isPending) return <div className="card skeleton-card" />
  if (overview.isError || !overview.data) return <div className="card error-card">Overview could not be loaded. <button className="btn ghost" type="button" onClick={() => void overview.refetch()}>Retry</button></div>
  const data = overview.data
  const rate = data.acknowledgement_rate
  const circumference = 2 * Math.PI * 42
  return (
    <div>
      <div className="mono">HR admin</div>
      <h1 className="h1" style={{ fontSize: 48 }}>Overview</h1>
      <div className="tiles">
        <article className="tile"><span className="mono">Published</span><strong>{data.published_documents}</strong></article>
        <article className="tile"><span className="mono">Overdue</span><strong>{data.overdue}</strong></article>
        <article className="tile"><span className="mono">Pending</span><strong>{data.pending}</strong></article>
      </div>
      <div className="admin-grid">
        <article className="card">
          <div className="ring-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120" aria-label={`${Math.round(rate * 100)} percent acknowledged`}>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#e6e0f2" strokeWidth="10" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#1f8a5b" strokeWidth="10" strokeDasharray={`${circumference * rate} ${circumference}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div>
              <div className="big-num" style={{ fontSize: 48 }}>{Math.round(rate * 100)}%</div>
              <div className="muted">{data.acknowledged} acknowledged</div>
            </div>
          </div>
        </article>
        <article className="card">
          <div className="mono">Top Genie questions</div>
          <ol>
            {data.top_questions.map((item) => <li key={item.intent}>{item.label} · {item.count}</li>)}
          </ol>
        </article>
      </div>
      <h2>Needs attention</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Document</th><th>Due</th><th>Pending</th><th></th></tr></thead>
          <tbody>
            {data.needs_attention.map((item) => (
              <tr key={item.document_id}>
                <td>{item.title}</td>
                <td>{item.due_on ? duePhrase(item.due_on) : "—"}</td>
                <td>{item.pending} / {item.audience}</td>
                <td><Link to={`/genie/track/${item.document_id}`}>Track</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function DocumentsPage() {
  const queryClient = useQueryClient()
  const documents = useQuery({ queryKey: ["admin", "documents"], queryFn: () => api<{ items: AdminDoc[] }>("/admin/documents") })
  const directory = useDirectory()
  const [sharing, setSharing] = useState<AdminDoc | null>(null)
  const [targets, setTargets] = useState<Target[]>([])
  const preview = useQuery({
    queryKey: ["preview", targets],
    enabled: targets.length > 0,
    queryFn: () => api<Preview>("/admin/audience/preview", { method: "POST", body: JSON.stringify({ targets: targets.map(({ target_type, target_id }) => ({ target_type, target_id })) }) }),
  })
  const save = useMutation({
    mutationFn: () => api(`/admin/documents/${sharing?.document_id}/shares`, {
      method: "PUT",
      body: JSON.stringify({ targets: targets.map(({ target_type, target_id }) => ({ target_type, target_id })) }),
    }),
    onSuccess: async () => {
      setSharing(null)
      await queryClient.invalidateQueries({ queryKey: ["admin", "documents"] })
      await queryClient.invalidateQueries({ queryKey: ["documents"] })
    },
  })

  return (
    <div>
      <div className="section-head">
        <h1 className="h1" style={{ fontSize: 48 }}>Documents</h1>
        <Link className="btn gold" to="/genie/publish">Publish a document</Link>
      </div>
      {documents.isPending ? <div className="card skeleton-card" /> : null}
      {documents.isError ? <div className="card error-card">Could not load documents.</div> : null}
      {documents.data ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Audience</th><th>Acknowledged</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {documents.data.items.map((item) => (
                <tr key={item.document_id}>
                  <td><strong>{item.title}</strong><div className="muted">v{item.version_no} · {item.category}</div></td>
                  <td>{item.audience_summary}<div className="muted">{item.audience_count} people</div></td>
                  <td className="pct"><div className="bar"><span style={{ width: `${item.ack_percent}%` }} /></div><div className="muted">{item.ack_percent}%</div></td>
                  <td>{item.ack_due_on ? formatDate(item.ack_due_on) : "—"}</td>
                  <td>{item.status} · {item.processing_status}</td>
                  <td>
                    <Link to={`/genie/track/${item.document_id}`}>Track</Link>{" "}
                    <button className="linkish" type="button" onClick={() => { setSharing(item); setTargets(item.targets) }}>Share</button>{" "}
                    <Link to={`/genie/view/${item.version_id}`}>Preview</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {sharing && directory.data ? (
        <div className="genie-panel" style={{ width: 420 }}>
          <header style={{ padding: 16, display: "flex", justifyContent: "space-between" }}>
            <strong>Share {sharing.title}</strong>
            <button className="btn ghost" type="button" onClick={() => setSharing(null)}>Close</button>
          </header>
          <div style={{ overflow: "auto", padding: 16 }}>
            <AudienceBuilder directory={directory.data} targets={targets} onChange={setTargets} preview={preview.data} />
            <button className="btn gold full" type="button" disabled={!targets.length || save.isPending} onClick={() => save.mutate()}>Save audience</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function PublishPage() {
  const directory = useDirectory()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Workplace")
  const [version, setVersion] = useState("1.0")
  const [effective, setEffective] = useState(() => new Date().toISOString().slice(0, 10))
  const [mandatory, setMandatory] = useState(true)
  const [days, setDays] = useState("10")
  const [file, setFile] = useState<File | null>(null)
  const [targets, setTargets] = useState<Target[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const preview = useQuery({
    queryKey: ["preview", targets],
    enabled: targets.length > 0,
    queryFn: () => api<Preview>("/admin/audience/preview", { method: "POST", body: JSON.stringify({ targets: targets.map(({ target_type, target_id }) => ({ target_type, target_id })) }) }),
  })
  const job = useQuery({
    queryKey: ["admin", "document", jobId],
    enabled: Boolean(jobId),
    queryFn: () => api<AdminDoc>(`/admin/documents/${jobId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.processing_status
      return status === "ready" || status === "failed" ? false : 600
    },
  })

  useEffect(() => {
    if (job.data?.processing_status === "ready") void queryClient.invalidateQueries({ queryKey: ["admin", "documents"] })
  }, [job.data?.processing_status, queryClient])

  async function submit(action: "draft" | "publish") {
    if (!file) return
    setError("")
    const body = new FormData()
    body.set("title", title)
    body.set("category", category)
    body.set("version_no", version)
    body.set("effective_from", effective)
    body.set("mandatory", String(mandatory))
    body.set("ack_within_days", days)
    body.set("action", action)
    body.set("targets_json", JSON.stringify(targets.map(({ target_type, target_id }) => ({ target_type, target_id }))))
    body.set("file", file)
    try {
      const created = await api<AdminDoc>("/admin/documents", { method: "POST", body })
      setJobId(created.document_id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed")
    }
  }

  const stage = job.data?.processing_status ?? ""
  const stages = ["uploading", "converting", "indexing", "ready"]

  return (
    <div>
      <h1 className="h1" style={{ fontSize: 48 }}>Publish a document</h1>
      <div className="admin-grid">
        <form className="card" onSubmit={(event) => event.preventDefault()}>
          <label className="drop">
            <input type="file" accept=".pdf,.docx,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <div>{file ? file.name : "Drop a PDF or DOCX, or choose a file"}</div>
          </label>
          <label className="field"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label className="field"><span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {["Workplace", "Leave", "Conduct", "Security", "Finance", "Onboarding"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="field"><span>Version</span><input value={version} onChange={(event) => setVersion(event.target.value)} /></label>
          <label className="field"><span>Effective date</span><input type="date" value={effective} onChange={(event) => setEffective(event.target.value)} /></label>
          <label className="field"><span><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} /> Mandatory acknowledgement</span></label>
          {mandatory ? <label className="field"><span>Acknowledge within days</span><input value={days} onChange={(event) => setDays(event.target.value)} /></label> : null}
          {error ? <div className="form-error">{error}</div> : null}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn gold" type="button" disabled={!file || !title || !targets.length} onClick={() => void submit("publish")}>Publish and notify</button>
            <button className="btn ghost" type="button" disabled={!file || !title || !targets.length} onClick={() => void submit("draft")}>Save as draft</button>
          </div>
          {jobId ? (
            <ol>
              {stages.map((item) => <li key={item}>{stages.indexOf(item) <= stages.indexOf(stage) ? "Done" : "Waiting"} · {item}</li>)}
              {stage === "failed" ? <li>Processing failed. Try another file.</li> : null}
              {stage === "ready" ? <li><Link to="/genie/adocs">View in the document list</Link></li> : null}
            </ol>
          ) : null}
        </form>
        {directory.data ? <AudienceBuilder directory={directory.data} targets={targets} onChange={setTargets} preview={preview.data} /> : <div className="card skeleton-card" />}
      </div>
    </div>
  )
}

export function TrackingPage() {
  const { documentId = "" } = useParams()
  const [branch, setBranch] = useState("")
  const [status, setStatus] = useState("")
  const tracking = useQuery({
    queryKey: ["tracking", documentId],
    queryFn: () => api<Tracking>(`/admin/documents/${documentId}/tracking`),
  })
  const remind = useMutation({
    mutationFn: () => api<{ queued: number }>(`/admin/documents/${documentId}/remind`, {
      method: "POST",
      body: JSON.stringify({ branch: branch || null, status: status || null }),
    }),
  })
  if (tracking.isPending) return <div className="card skeleton-card" />
  if (tracking.isError || !tracking.data) return <div className="card error-card">Tracking could not be loaded.</div>
  const rows = tracking.data.rows.filter((row) => (branch ? row.branch === branch : true) && (status ? row.status === status : true))
  const branches = [...new Set(tracking.data.rows.map((row) => row.branch))]
  const waiting = rows.filter((row) => row.status !== "acknowledged").length

  function exportCsv() {
    const header = ["Name", "Employee number", "Branch", "Department", "Status", "Furthest page", "Acknowledged at"]
    const lines = rows.map((row) => [row.name, row.employee_no, row.branch, row.department, row.status, `${row.max_page_seen} of ${row.page_count}`, row.acknowledged_at ?? ""])
    const csv = [header, ...lines].map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "acknowledgements.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mono">Tracking</div>
      <h1 className="h1" style={{ fontSize: 42 }}>{tracking.data.title}</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
        <select value={branch} onChange={(event) => setBranch(event.target.value)} aria-label="Filter by branch">
          <option value="">All branches</option>
          {branches.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="viewed">viewed</option>
          <option value="acknowledged">acknowledged</option>
        </select>
        <button className="btn gold" type="button" onClick={() => remind.mutate()}>Send reminder to {waiting}</button>
        <button className="btn ghost" type="button" onClick={exportCsv}>Export CSV</button>
        {remind.data ? <span className="muted">{remind.data.queued} reminders queued</span> : null}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Branch</th><th>Department</th><th>Status</th><th>Furthest page</th><th>Acknowledged</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user_id}>
                <td>{row.name}<div className="muted">{row.employee_no}</div></td>
                <td>{row.branch}</td>
                <td>{row.department}</td>
                <td><span className={`status ${row.status}`}>{row.status}</span></td>
                <td>{row.max_page_seen} of {row.page_count}</td>
                <td>{formatWhen(row.acknowledged_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const directory = useDirectory()
  const templates = useQuery({ queryKey: ["templates"], queryFn: () => api<{ items: Template[] }>("/admin/templates") })
  const [edited, setEdited] = useState<Template | null>(null)
  const [userId, setUserId] = useState("")
  const [preview, setPreview] = useState<Draft | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const draft = edited ?? templates.data?.items[0] ?? null

  useEffect(() => {
    if (!draft || !userId) return
    const timer = window.setTimeout(() => {
      void api<Draft>("/admin/templates/preview", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          subject: draft.subject,
          body: draft.body,
          to_list: draft.to_list,
          cc_list: draft.cc_list,
        }),
      }).then(setPreview).catch(() => setPreview(null))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draft, userId])

  const save = useMutation({
    mutationFn: () => api<Template>(`/admin/templates/${draft?.policy_key}`, {
      method: "PUT",
      body: JSON.stringify({ subject: draft?.subject, body: draft?.body, to_list: draft?.to_list, cc_list: draft?.cc_list }),
    }),
    onSuccess: async (saved) => {
      setEdited(saved)
      await queryClient.invalidateQueries({ queryKey: ["templates"] })
    },
  })

  function insert(key: string) {
    if (!draft || !bodyRef.current) return
    const el = bodyRef.current
    const start = el.selectionStart ?? draft.body.length
    const end = el.selectionEnd ?? start
    const token = `{{${key}}}`
    const body = draft.body.slice(0, start) + token + draft.body.slice(end)
    setEdited({ ...draft, body })
  }

  if (!draft) return <div className="card skeleton-card" />
  return (
    <div>
      <h1 className="h1" style={{ fontSize: 48 }}>Email templates</h1>
      <div className="admin-grid">
        <div className="card">
          <div className="mono">{draft.policy_key}</div>
          <label className="field"><span>Subject</span><input value={draft.subject} onChange={(event) => setEdited({ ...draft, subject: event.target.value })} /></label>
          <label className="field"><span>To</span><input value={draft.to_list.join(", ")} onChange={(event) => setEdited({ ...draft, to_list: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <label className="field"><span>Cc</span><input value={draft.cc_list.join(", ")} onChange={(event) => setEdited({ ...draft, cc_list: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <div className="choice-row">
            {draft.placeholders.map((key) => <button key={key} className="choice" type="button" onClick={() => insert(key)}>{`{{${key}}}`}</button>)}
          </div>
          <label className="field"><span>Body</span><textarea ref={bodyRef} rows={12} value={draft.body} onChange={(event) => setEdited({ ...draft, body: event.target.value })} /></label>
          <button className="btn gold" type="button" onClick={() => save.mutate()} disabled={save.isPending}>Save template</button>
        </div>
        <div className="preview-box">
          <label className="field"><span>Preview as</span>
            <select value={userId} onChange={(event) => setUserId(event.target.value)}>
              <option value="">Choose an employee</option>
              {directory.data?.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          {preview ? (
            <>
              <p><strong>{preview.subject}</strong></p>
              <p className="muted">To {preview.to.join(", ") || "—"} · Cc {preview.cc.join(", ") || "—"}</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{preview.body}</p>
            </>
          ) : <p className="muted">Choose someone to preview the approved wording.</p>}
        </div>
      </div>
    </div>
  )
}
