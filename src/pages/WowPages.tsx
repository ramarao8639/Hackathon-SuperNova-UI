// AI-Generated: Year in review, manager cockpit, and HR cockpit
// Generated-Date: 2026-10-27
// Description: Demo screens for the wow layer. Nudge drafts stay on screen and are not sent.

import { useQuery } from "@tanstack/react-query"
import { api } from "../api/client"
import { useToast } from "../components/toast"

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

type Satisfaction = {
  by_topic: Record<string, { satisfied: number; not_satisfied: number }>
  documents_summarized: number
}

const INTENT_LABELS: Record<string, string> = {
  policy_search: "Policy search",
  leave_request: "Leave request",
  find_leave_policy: "Find leave policy",
  lost_id_card: "Lost ID card",
  pending_acks: "Pending acknowledgements",
  document_summary: "Document summary",
  greeting: "Greeting",
  pending_leave: "Pending leave",
  posh_route: "POSH / grievance",
  insurance: "Insurance",
  my_record: "My profile",
  org_directory: "Org directory",
  data_query: "Data query",
  courses_due: "Courses due",
  career: "Career path",
  wallet: "Wallet",
  own_pay: "Own salary",
  holidays: "Holidays",
  attendance: "Attendance",
  draft_email: "Draft email",
  frustrated: "Frustrated",
  fallback: "Fallback",
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <article className="card">
      <p className="mono">{label}</p>
      <p className="serif" style={{ fontSize: 36 }}>{value}</p>
      {sub ? <p className="muted small">{sub}</p> : null}
    </article>
  )
}

function IntentBar({ intent, count, max }: { intent: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  const label = INTENT_LABELS[intent] ?? intent.replace(/_/g, " ")
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ width: 180, fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: "var(--line)", borderRadius: 4, height: 14, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: "var(--good)", height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
      </div>
      <div style={{ width: 28, fontSize: 13, fontWeight: 700, textAlign: "right" }}>{count}</div>
    </div>
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
        <Tile label="Leave used" value={data.leave_used} sub="days" />
        <Tile label="Goals met" value={`${data.goals_met} / ${data.goals_total}`} />
        <Tile label="Wallet used" value={data.wallet_used ?? "Hidden"} />
      </div>
    </section>
  )
}

export function ManagerCockpitPage() {
  const { toast } = useToast()
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

      <h2 style={{ marginTop: 24 }}>Team learning progress</h2>
      {data.heat.length === 0 ? <p className="card muted">No team members yet.</p> : (
        <div className="card">
          {data.heat.map((row) => (
            <div key={row.name} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{row.name}</strong>
                <span className="muted small">{row.hours} / {row.target} hrs · {row.pct}%</span>
              </div>
              <div style={{ background: "var(--line)", borderRadius: 6, height: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${row.pct}%`,
                  height: "100%",
                  borderRadius: 6,
                  background: row.pct >= 75 ? "var(--good)" : row.pct >= 40 ? "#f0a500" : "var(--bad)",
                  transition: "width 0.4s",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 24 }}>Nudge drafts</h2>
      <p className="muted small" style={{ marginBottom: 12 }}>These are drafts. Nothing is sent until you copy and send manually.</p>
      {data.nudge_drafts.length === 0 ? <p className="card muted">No nudges needed right now.</p> : data.nudge_drafts.map((draft) => (
        <article className="card" key={draft.to_name} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p className="mono" style={{ marginBottom: 4 }}>Draft · not sent · to {draft.to_name}</p>
              <strong>{draft.subject}</strong>
              <p style={{ marginTop: 6, fontSize: 14, whiteSpace: "pre-wrap" }}>{draft.body}</p>
            </div>
            <button
              className="btn ghost sm"
              type="button"
              style={{ flexShrink: 0, marginLeft: 12 }}
              onClick={() => {
                void navigator.clipboard.writeText(`To: ${draft.to_name}\nSubject: ${draft.subject}\n\n${draft.body}`)
                toast("Copied to clipboard")
              }}
            >
              Copy
            </button>
          </div>
        </article>
      ))}
    </section>
  )
}

export function HrCockpitPage() {
  const cockpit = useQuery({ queryKey: ["hr-cockpit"], queryFn: () => api<Hr>("/hr/cockpit") })
  const satisfaction = useQuery({ queryKey: ["genie-satisfaction"], queryFn: () => api<Satisfaction>("/genie/reports/satisfaction") })
  if (cockpit.isPending) return <div className="card skeleton-card" />
  const data = cockpit.data
  if (!data) return null

  const sorted = [...data.genie_log].sort((a, b) => b.count - a.count)
  const maxCount = sorted[0]?.count ?? 1
  const totalQuestions = sorted.reduce((sum, row) => sum + row.count, 0)

  const satData = satisfaction.data
  const totalSat = satData
    ? Object.values(satData.by_topic).reduce((sum, t) => sum + t.satisfied + t.not_satisfied, 0)
    : 0
  const totalHappy = satData
    ? Object.values(satData.by_topic).reduce((sum, t) => sum + t.satisfied, 0)
    : 0
  const satPct = totalSat > 0 ? Math.round((totalHappy / totalSat) * 100) : null

  return (
    <section className="page">
      <p className="mono">HR Management</p>
      <h1 className="h1">HR cockpit</h1>

      <div className="tiles">
        <Tile label="Headcount" value={data.headcount} sub="active employees" />
        <Tile label="Onboarding" value={data.onboarding_in_progress} sub="in progress" />
        <Tile label="Overdue programmes" value={data.overdue_programmes} />
        <Tile label="Genie questions" value={totalQuestions} sub="total turns" />
        {satPct !== null ? <Tile label="Satisfaction" value={`${satPct}%`} sub={`${totalHappy} of ${totalSat} conversations`} /> : null}
        {satData ? <Tile label="Docs summarised" value={satData.documents_summarized} sub="via Genie" /> : null}
      </div>

      <h2 style={{ marginTop: 24 }}>What employees are asking Genie</h2>
      <p className="muted small" style={{ marginBottom: 12 }}>Intent only — no question text is stored.</p>
      {sorted.length === 0 ? (
        <p className="card muted">No questions yet.</p>
      ) : (
        <div className="card">
          {sorted.map((row) => (
            <IntentBar key={row.intent} intent={row.intent} count={row.count} max={maxCount} />
          ))}
        </div>
      )}

      {satData && Object.keys(satData.by_topic).length > 0 ? (
        <>
          <h2 style={{ marginTop: 24 }}>Satisfaction by topic</h2>
          <div className="card">
            {Object.entries(satData.by_topic).map(([topic, counts]) => {
              const total = counts.satisfied + counts.not_satisfied
              const pct = total > 0 ? Math.round((counts.satisfied / total) * 100) : 0
              return (
                <div key={topic} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 140, fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>
                    {topic.replace(/_/g, " ")}
                  </div>
                  <div style={{ flex: 1, background: "var(--line)", borderRadius: 4, height: 14, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, background: pct >= 70 ? "var(--good)" : pct >= 40 ? "#f0a500" : "var(--bad)", height: "100%", borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 44, fontSize: 13, textAlign: "right" }}>{pct}% · {total}</div>
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </section>
  )
}
