// AI-Generated: Year in review, manager cockpit, and HR cockpit
// Generated-Date: 2026-10-27
// Description: Demo screens for the wow layer. Nudge drafts stay on screen and are not sent.

import { useQuery } from "@tanstack/react-query"
import { api } from "../api/client"

type Year = {
  learning_hours: number
  certificates: number
  leave_used: number
  goals_met: number
  goals_total: number
  wallet_used: number | null
}

type Cockpit = {
  leave: { id: string; name: string; type_code: string; days: number }[]
  wfh: { id: string; name: string; day: string }[]
  reimbursements: { id: string; name: string; kind: string; amount: number }[]
  course_approvals: { employee: string; title: string }[]
  heat: { name: string; hours: number; target: number; pct: number }[]
  nudge_drafts: { to_name: string; subject: string; body: string; sent: boolean }[]
}

type Hr = {
  headcount: number
  onboarding_in_progress: number
  overdue_programmes: number
  genie_log: { intent: string; count: number }[]
  export_count: number
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="card">
      <p className="mono">{label}</p>
      <p className="serif" style={{ fontSize: 36 }}>{value}</p>
    </article>
  )
}

export function YearPage() {
  const year = useQuery({ queryKey: ["year"], queryFn: () => api<Year>("/me/year") })
  if (year.isPending) return <div className="card skeleton-card" />
  const data = year.data
  if (!data) return null
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">My year in review</h1>
      <div className="tiles">
        <Tile label="Learning hours" value={data.learning_hours} />
        <Tile label="Certificates" value={data.certificates} />
        <Tile label="Leave used" value={data.leave_used} />
        <Tile label="Goals met" value={`${data.goals_met} / ${data.goals_total}`} />
        <Tile label="Wallet used" value={data.wallet_used ?? "Hidden"} />
      </div>
    </section>
  )
}

export function ManagerCockpitPage() {
  const cockpit = useQuery({ queryKey: ["cockpit"], queryFn: () => api<Cockpit>("/manager/cockpit") })
  if (cockpit.isPending) return <div className="card skeleton-card" />
  const data = cockpit.data
  if (!data) return null
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Manager cockpit</h1>
      <div className="tiles">
        <Tile label="Leave waiting" value={data.leave.length} />
        <Tile label="Work from home" value={data.wfh.length} />
        <Tile label="Reimbursements" value={data.reimbursements.length} />
        <Tile label="Course approvals" value={data.course_approvals.length} />
      </div>
      <h2>Team learning</h2>
      {data.heat.map((row) => (
        <article className="card" key={row.name}>
          <strong>{row.name}</strong>
          <div className="heat" aria-label={`${row.pct} percent`}>
            {Array.from({ length: 10 }, (_, index) => <i key={index} className={index < Math.round(row.pct / 10) ? "on" : ""} />)}
          </div>
          <p className="small muted">{row.hours} of {row.target} hours</p>
        </article>
      ))}
      <h2>Nudge drafts</h2>
      {data.nudge_drafts.length === 0 ? <p className="muted">No drafts.</p> : data.nudge_drafts.map((draft) => (
        <article className="card" key={draft.to_name}>
          <p className="mono">Draft · not sent</p>
          <strong>{draft.subject}</strong>
          <p>To {draft.to_name}</p>
          <p>{draft.body}</p>
        </article>
      ))}
    </section>
  )
}

export function HrCockpitPage() {
  const cockpit = useQuery({ queryKey: ["hr-cockpit"], queryFn: () => api<Hr>("/hr/cockpit") })
  if (cockpit.isPending) return <div className="card skeleton-card" />
  const data = cockpit.data
  if (!data) return null
  return (
    <section className="page">
      <p className="mono">HR Management</p>
      <h1 className="h1">HR cockpit</h1>
      <div className="tiles">
        <Tile label="Headcount" value={data.headcount} />
        <Tile label="Onboarding in progress" value={data.onboarding_in_progress} />
        <Tile label="Overdue programmes" value={data.overdue_programmes} />
        <Tile label="Leave exports" value={data.export_count} />
      </div>
      <h2>Genie log</h2>
      {data.genie_log.length === 0 ? <p className="muted">No questions yet. The log stores the intent only.</p> : data.genie_log.map((row) => (
        <p className="card" key={row.intent}>{row.intent} · {row.count}</p>
      ))}
    </section>
  )
}
