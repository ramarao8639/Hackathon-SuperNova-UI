// AI-Generated: Career journey page
// Generated-Date: 2026-10-27
// Description: Level path, milestone cards, and the one-time earned celebration

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link } from "react-router"
import { api } from "../api/client"
import { useAuth } from "../auth/AuthProvider"
import { Avatar } from "../components/Avatar"
import { useToast } from "../components/toast"

type Milestone = {
  id: string
  type: string
  title: string
  date_earned: string | null
  status: "locked" | "in_progress" | "earned"
  learned: string[]
  certificate_code: string | null
  percent: number
  due_on: string | null
  programme_id: string | null
  from_level: string
  to_level: string
  seen: boolean
}

type Level = { id: string; name: string; order: number; state: string; description: string }

type Journey = {
  current_level: Level
  next_level: Level | null
  progress_pct: number
  months_in_level: number
  levels: Level[]
  milestones: Milestone[]
  next_milestone: Milestone | null
  promotion_ready: boolean
  remaining: { title: string; due_on: string | null; programme_id: string | null; status: string }[]
}

function glyph(type: string): string {
  if (type === "certificate_earned") return "ribbon"
  if (type === "goal_achieved") return "flag"
  if (type === "skill_acquired") return "bulb"
  if (type === "promotion_ready") return "flag"
  return "trophy"
}

export function CareerPath({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState<Milestone | null>(null)
  const celebrated = useState(() => new Set<string>())[0]
  const journey = useQuery({ queryKey: ["career-journey"], queryFn: () => api<Journey>("/career/me/journey") })
  const seen = useMutation({
    mutationFn: (id: string) => api(`/career/me/milestones/${id}/seen`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["career-journey"] }),
  })

  useEffect(() => {
    const fresh = journey.data?.milestones.find((item) => item.status === "earned" && !item.seen && !celebrated.has(item.id))
    if (!fresh) return
    celebrated.add(fresh.id)
    toast(`You earned: ${fresh.title}`)
    seen.mutate(fresh.id)
  }, [celebrated, journey.data, seen, toast])

  if (journey.isLoading) return <p className="muted">Loading your path…</p>
  if (!journey.data) return <p className="muted">Your career path is not available yet.</p>
  const data = journey.data
  return (
    <div className={compact ? "career compact" : "career"}>
      <div className="career-summary">
        <div>
          <span className="muted">Current level</span>
          <strong>{data.current_level.name}</strong>
        </div>
        <div>
          <span className="muted">To next level</span>
          <strong>{data.progress_pct}%</strong>
        </div>
        <div>
          <span className="muted">Next milestone</span>
          <strong>{data.next_milestone?.title ?? "None"}</strong>
        </div>
        <div>
          <span className="muted">Months in level</span>
          <strong>{data.months_in_level}</strong>
        </div>
      </div>
      <div className={`path-wrap ${data.promotion_ready ? "ready" : ""}`}>
        {data.promotion_ready ? <div className="ready-badge">Ready for {data.next_level?.name ?? "the next level"}</div> : null}
        <div className="path">
          {data.levels.map((level, index) => (
            <div className="path-segment" key={level.id}>
              {index > 0 ? (
                <div className="path-line">
                  <svg viewBox="0 0 120 8" aria-hidden="true">
                    <line className="path-stroke" x1="0" y1="4" x2="120" y2="4" />
                  </svg>
                  {data.milestones
                    .filter((item) => item.to_level === level.id)
                    .map((item, iconIndex) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`milestone ${item.status} ${glyph(item.type)}`}
                        style={{ animationDelay: `${iconIndex * 120}ms`, left: `${18 + iconIndex * 28}%` }}
                        onClick={() => setOpen(item)}
                      >
                        <span className="sr">{item.title}</span>
                      </button>
                    ))}
                </div>
              ) : null}
              <div className={`level-node ${level.state} ${data.promotion_ready && level.state === "locked" ? "pulse-next" : ""}`}>
                {level.state === "current" && user ? <Avatar name={user.name} size={64} /> : <span>{level.order}</span>}
                <small>{level.name}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
      {open ? (
        <div className="cert-card">
          <strong>{open.title}</strong>
          <p className="muted">{open.date_earned ? `Earned ${open.date_earned}` : "Not earned yet"}</p>
          <p>What you learned</p>
          <ul>
            {open.learned.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {open.certificate_code ? (
            <p>
              {open.certificate_code}{" "}
              <a href={`/api/career/me/certificates/${open.certificate_code}`}>Download</a>{" "}
              <button type="button" onClick={() => navigator.clipboard.writeText(open.certificate_code ?? "")}>Share</button>
            </p>
          ) : null}
          {open.programme_id ? <Link to="/lms/catalog">Open the programme</Link> : null}
          <button type="button" onClick={() => setOpen(null)}>Close</button>
        </div>
      ) : null}
      {compact ? null : (
        <aside className="career-left">
          <h2>What's left for Senior</h2>
          {data.remaining.length === 0 ? <p>Every required programme is complete.</p> : null}
          {data.remaining.map((item) => (
            <div key={item.title} className="left-row">
              <div>
                <strong>{item.title}</strong>
                <span className="muted">{item.due_on ? `Due ${item.due_on}` : item.status}</span>
              </div>
              <Link to="/lms/learning">Start</Link>
            </div>
          ))}
        </aside>
      )}
    </div>
  )
}

export function CareerPage() {
  const coach = useQuery({
    queryKey: ["career-coach"],
    queryFn: () => api<{ current: string; next: string | null; text: string; href: string }>("/career/me/coach"),
  })
  return (
    <section>
      <h1>Career journey</h1>
      <section className="card" aria-label="Career coach">
        <h2>Coach</h2>
        {coach.data ? <p><Link to={coach.data.href}>{coach.data.text}</Link></p> : null}
      </section>
      <CareerPath />
    </section>
  )
}
