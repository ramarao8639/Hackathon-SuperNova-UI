// AI-Modified: Rebuilt to match the HTML prototype's personaPage() layout exactly
// Modified-Date: 2026-10-27
// Description: Hero greeting + ask bar, "Where you stand" feed, journey timeline, leave/learning pair,
// combined career-and-performance card, and a pay reveal card - same shape as the prototype's single column

import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router"
import { api } from "../api/client"
import type { DocList, FeedItem } from "../api/types"
import { CountUp } from "../components/bits"
import { Avatar } from "../components/Avatar"
import { CareerPath } from "./CareerPage"
import { Icon } from "../components/Icon"
import { useAuth } from "../auth/AuthProvider"
import { duePhrase, formatDate, inr } from "../format"
import { useGenie } from "../genie/GenieDock"

function useCard<T>(id: string) {
  return useQuery({
    queryKey: ["persona", id],
    queryFn: async () => {
      const flag = new URLSearchParams(window.location.search).get("demoError")
      if (flag === id) throw new Error("This card could not be loaded")
      return api<T>(`/me/persona/cards/${id}`)
    },
  })
}

function Frame({ query, className, children }: { query: UseQueryResult; className?: string; children: () => ReactNode }) {
  if (query.isPending) return <section className={`card skeleton-card ${className ?? ""}`} />
  if (query.isError) {
    return (
      <section className={`card error-card ${className ?? ""}`}>
        <strong>This card could not be loaded.</strong>
        <button className="btn ghost" type="button" onClick={() => void query.refetch()}>Retry</button>
      </section>
    )
  }
  return <>{children()}</>
}

function daysUntil(dateText: string | null | undefined): number | null {
  if (!dateText) return null
  const target = new Date(dateText)
  if (Number.isNaN(target.getTime())) return null
  return Math.round((target.getTime() - Date.now()) / 86_400_000)
}

type Row = { id: string; title: string; detail: string; due: string; kind: "bad" | "warn" | ""; button: string; href: string }

export function PersonaPage() {
  const { user } = useAuth()
  const { ask } = useGenie()
  const summary = useQuery({
    queryKey: ["summary", user?.id],
    enabled: Boolean(user),
    queryFn: () => api<{ performance_pct: number | null; review_status: "published" | "none" | null }>(`/hris/employees/${user?.id}/summary`),
  })
  const [text, setText] = useState("")
  const nudges = useQuery({
    queryKey: ["nudges", user?.id],
    enabled: Boolean(user),
    queryFn: () => api<{ items: { kind: string; text: string }[] }>("/me/nudges"),
  })
  const [expanded, setExpanded] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const feed = useCard<{ items: FeedItem[]; as_of?: string }>("feed")
  const journey = useCard<{
    stages: { id: string; label: string; detail: string }[]
    current_index: number
    as_of?: string
  }>("journey")
  const career = useCard<{ state?: string; current: number; total: number; headline: string; next: string; percent: number; as_of?: string; message?: string }>("career")
  const performance = useCard<{
    state?: string
    message?: string
    percent?: string
    formula?: string
    period?: string
    goals?: { name: string; weight: number; progress: number }[]
    as_of?: string
  }>("performance")
  const pay = useCard<{ state?: string; message?: string; annual_ctc?: number; effective_on?: string; lines?: { label: string; amount: number }[]; as_of?: string }>("pay")
  const leave = useCard<{ balance_days: string; as_of?: string; state?: string }>("leave")
  const learning = useCard<{ state?: string; message?: string; completed_hours: number; target_hours: number; pending: { title: string; source: string; due_on: string }[]; as_of?: string }>("learning")
  const documents = useQuery({ queryKey: ["documents", "all"], queryFn: () => api<DocList>("/me/documents?tab=all") })

  useEffect(() => {
    if (!showPay) return
    const timer = window.setTimeout(() => setShowPay(false), 30_000)
    return () => window.clearTimeout(timer)
  }, [showPay])

  const mandatory = (documents.data?.items ?? []).filter((item) => item.mandatory && item.status !== "acknowledged")
  const feedItems = feed.data?.items ?? []
  const combined: Row[] = [
    ...mandatory.map((item): Row => {
      const left = daysUntil(item.ack_due_on)
      return {
        id: item.version_id,
        title: `Acknowledge ${item.title}`,
        detail: item.overdue ? "Acknowledgement overdue" : "Needs your acknowledgement",
        due: duePhrase(item.ack_due_on),
        kind: left != null && left < 4 ? "bad" : "warn",
        button: "Read",
        href: `/genie/view/${item.version_id}`,
      }
    }),
    ...feedItems.map((item): Row => {
      const left = daysUntil(item.due_on)
      return {
        id: item.id,
        title: item.title,
        detail: item.detail,
        due: duePhrase(item.due_on),
        kind: left == null ? "" : left < 0 ? "bad" : left <= 4 ? "warn" : "",
        button: "Open",
        href: item.id === "self-assessment" ? "/hrms/performance" : item.id === "tableau" || /course|learning|certif/i.test(item.title) ? "/lms/learning" : "/genie/docs",
      }
    }),
  ]
  const shown = expanded ? combined : combined.slice(0, 4)
  const first = (user?.name ?? "").split(" ")[0]
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  })
  const attentionCount = combined.filter((item) => item.kind).length

  return (
    <div>
      <section className="hero">
        <div className="row between wrap" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>{greeting}, {first}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              {attentionCount ? `${attentionCount} thing${attentionCount > 1 ? "s" : ""} need your attention.` : "Nothing needs your attention right now."}
            </p>
          </div>
          {user ? <Avatar name={user.name} pct={summary.data?.performance_pct} reviewStatus={summary.data?.review_status} size={84} showPct /> : null}
        </div>
        <form
          className="ask"
          onSubmit={(event) => {
            event.preventDefault()
            ask(text)
            setText("")
          }}
        >
          <input aria-label="Ask Genie" placeholder="Ask about leave, courses, documents or policies" value={text} onChange={(event) => setText(event.target.value)} />
          <button className="btn sm" type="submit"><Icon name="spark" size={16} /> Ask Genie</button>
        </form>
      </section>

      <section className="card" aria-label="Nudges">
        <h3>Nudges</h3>
        {nudges.isPending ? <div className="skeleton-card" /> : null}
        {(nudges.data?.items ?? []).map((item) => <p key={item.kind}>{item.text}</p>)}
        {nudges.data && nudges.data.items.length === 0 ? <p className="muted">Nothing to nudge right now.</p> : null}
      </section>

      <section id="where-you-stand" className="card">
        <h3>Where you stand</h3>
        {feed.isError && documents.isError ? (
          <div className="error-card">This list could not be loaded. <button className="btn ghost sm" type="button" onClick={() => { void feed.refetch(); void documents.refetch() }}>Retry</button></div>
        ) : (
          <>
            {feed.isError ? <p className="muted small">Reminders could not be loaded.</p> : null}
            {documents.isError ? <p className="muted small">Documents could not be loaded.</p> : null}
            {shown.length === 0 ? <p className="muted small">Nothing needs your attention right now.</p> : null}
            {shown.map((item) => (
              <div key={item.id} className="feed">
                <div className={`ico ${item.kind}`} aria-hidden="true">
                  <Icon name={/holiday/i.test(item.title) ? "cal" : /acknowledge|policy|document/i.test(item.title) ? "file" : /course|learning|certif/i.test(item.title) ? "book" : "check"} />
                </div>
                <div className="grow">
                  <b>{item.title}</b>
                  <div className="small muted">{item.detail} · {item.due}</div>
                </div>
                <Link className="btn ghost sm" to={item.href || "/genie/docs"}>{item.button}</Link>
              </div>
            ))}
            {combined.length > 4 ? (
              <button className="btn ghost sm" style={{ marginTop: 10 }} type="button" onClick={() => setExpanded((value) => !value)}>
                {expanded ? "Show fewer" : `Show all ${combined.length}`}
              </button>
            ) : null}
          </>
        )}
      </section>

      <section id="journey" className="card" style={{ marginTop: 16 }}>
        <h3>Your journey</h3>
        <Frame query={journey}>
          {() => (
            <div className="journey" style={{ display: "flex" }}>
              {journey.data?.stages.map((item, index) => (
                <div key={item.id} className={index === (journey.data?.current_index ?? 0) + 1 ? "jstep next" : "jstep"}>
                  <b className="small">{item.label}</b>
                  <div className="tiny muted">{item.detail}</div>
                </div>
              ))}
            </div>
          )}
        </Frame>
      </section>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <section id="leave" className="card">
          <Frame query={leave}>
            {() => (
              <>
                <h3>Leave and holidays</h3>
                <div className="big-num"><CountUp value={Number(leave.data?.balance_days ?? 0)} decimals={1} /></div>
                <p className="muted">days in hand</p>
                <div className="row" style={{ marginTop: 12 }}>
                  <Link className="btn sm" to="/hrms/apply">Apply leave</Link>
                  <Link className="btn ghost sm" to="/hrms/dashboard">All balances</Link>
                </div>
              </>
            )}
          </Frame>
        </section>
        <section id="learning" className="card">
          <Frame query={learning}>
            {() => (
              <>
                <h3>Learning</h3>
                {learning.data?.state === "empty" ? <p className="muted">{learning.data.message}</p> : (
                  <>
                    <div className="row between">
                      <div className="big-num"><CountUp value={learning.data?.completed_hours ?? 0} /> <small>/ {learning.data?.target_hours}</small></div>
                      <Link className="btn ghost sm" to="/lms/learning">Learning Hub</Link>
                    </div>
                    <div className="bar"><span style={{ width: `${((learning.data?.completed_hours ?? 0) / Math.max(learning.data?.target_hours ?? 1, 1)) * 100}%` }} /></div>
                    {learning.data?.pending.length ? (
                      learning.data.pending.map((item) => (
                        <div key={item.title} className="feed">
                          <div className="grow">
                            <b className="small">{item.title}</b>
                            <div className="tiny muted">{duePhrase(item.due_on)}, {item.source}</div>
                          </div>
                          <Link className="btn ghost sm" to="/lms/learning">Resume</Link>
                        </div>
                      ))
                    ) : (
                      <div className="empty"><h4>You are all caught up</h4>New courses will appear here.</div>
                    )}
                  </>
                )}
              </>
            )}
          </Frame>
        </section>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <section id="career" className="card">
          <h3>Career path and performance</h3>
          <CareerPath compact />
          <p><Link to="/hrms/career">Open the full journey</Link></p>
          <Frame query={career}>
            {() => (career.data?.state === "empty" ? (
              <div className="empty"><h4>No review yet</h4>{career.data.message}</div>
            ) : (
              <>
                <p className="small muted">{career.data?.headline}</p>
                <div style={{ margin: "8px 0 14px" }}>
                  <div className="row between small"><span>Progress</span><b>{career.data?.percent}%</b></div>
                  <div className="bar"><span style={{ width: `${career.data?.percent ?? 0}%` }} /></div>
                </div>
                <p className="tiny muted">{career.data?.next}</p>
              </>
            ))}
          </Frame>
          <div id="performance" style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
            <Frame query={performance}>
              {() => (performance.data?.state === "empty" ? (
                <p className="muted small">{performance.data.message}</p>
              ) : (
                <>
                  <div className="row between small"><span>Weighted goal score</span><b>{performance.data?.percent}%</b></div>
                  <p className="tiny muted" style={{ margin: "4px 0 8px" }}>{performance.data?.formula} · {performance.data?.period}</p>
                  {performance.data?.goals?.map((goal) => (
                    <div className="goal" key={goal.name}>
                      <span>{goal.name}</span>
                      <div className={`mini-bar ${goal.progress >= 75 ? "" : goal.progress >= 50 ? "mid" : "low"}`}>
                        <span style={{ width: `${goal.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </>
              ))}
            </Frame>
          </div>
        </section>
        <section id="pay" className="card">
          <h3>Pay and benefits</h3>
          <Frame query={pay}>
            {() => (pay.data?.state === "empty" || pay.data?.annual_ctc == null ? (
              <p className="muted">{pay.data?.message}</p>
            ) : (
              <>
                <div className="row between">
                  <span className="muted small">Annual CTC</span>
                  <b style={{ fontSize: 22, fontFamily: "var(--serif)" }}>{showPay ? inr(pay.data.annual_ctc) : "₹ ••,••,•••"}</b>
                </div>
                <p className="muted small">Effective {formatDate(pay.data.effective_on)}</p>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn ghost sm" type="button" onClick={() => setShowPay((value) => !value)}>
                    {showPay ? "Hide now" : "Reveal for 30 seconds"}
                  </button>
                </div>
                {showPay ? (
                  <ul>
                    {pay.data.lines?.map((line) => <li key={line.label}>{line.label}: {inr(line.amount)}</li>)}
                  </ul>
                ) : null}
                <p className="tiny muted" style={{ marginTop: 8 }}>Hidden by default. Never written to logs.</p>
                <p><Link to="/hrms/finances">Open Pay and benefits</Link></p>
              </>
            ))}
          </Frame>
        </section>
      </div>
    </div>
  )
}
