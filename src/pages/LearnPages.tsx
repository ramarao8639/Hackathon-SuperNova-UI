// AI-Generated: Learning Hub screens
// Generated-Date: 2026-10-26
// Description: Learning Hub home, catalog, schedule, transcript, and manager pages from LearnHub

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { api } from "../api/client"
import { useAuth } from "../auth/AuthProvider"
import { formatDate } from "../format"

type Registration = {
  id: string
  title: string
  category: string
  level: string
  assigned_by: string
  due_on: string | null
  due_label: string
  status: string
  status_label: string
  progress_pct: number
  action: string
  pending: boolean
  completed_on?: string | null
  employee?: string
}

type Session = {
  id: string
  title: string
  date: string
  time: string
  minutes: number
  action: string
}

type CatalogCourse = {
  id: string
  title: string
  category: string
  level: string
  rating_avg: number | null
  rating_count: number
}

type Hub = {
  welcome: string
  completed_hours: number
  target_hours: number
  action_items: { label: string; due_label: string; course_id?: string; part?: number }[]
  tasks: { title: string; detail: string; action: string }[]
  registrations: Registration[]
  sessions: Session[]
  enrolment_requests: { employee: string; title: string }[]
  team: Registration[]
  catalog: CatalogCourse[]
}

const TABS = [
  ["all", "All"],
  ["pending_approval", "Pending approval"],
  ["assigned", "Assigned"],
  ["in_progress", "In progress"],
  ["overdue", "Overdue"],
  ["completed", "Completed"],
] as const

function useHub() {
  return useQuery({ queryKey: ["learning"], queryFn: () => api<Hub>("/learning/mine") })
}

function Badges() {
  const badges = useQuery({
    queryKey: ["learning-badges"],
    queryFn: () => api<{ items: { id: string; name: string; earned_on: string }[] }>("/learning/me/badges"),
  })
  if (!badges.data) return null
  return (
    <section className="card" aria-label="Learning badges">
      <h2>Badges</h2>
      {badges.data.items.length === 0 ? <p>No badges yet.</p> : null}
      <ul>
        {badges.data.items.map((item) => (
          <li key={item.id}>
            {item.name} <span className="hub-chip completed">{formatDate(item.earned_on)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function VideoSave() {
  const buddy = useQuery({
    queryKey: ["learning-buddy"],
    queryFn: () => api<{ course_id: string; title: string }>("/learning/me/buddy"),
  })
  const courseId = buddy.data?.course_id ?? ""
  const progress = useQuery({
    queryKey: ["video-progress", courseId],
    enabled: Boolean(courseId),
    queryFn: () => api<{ seconds: number; length: number; idle_after: number; slot_seconds: number }>(`/learning/courses/${courseId}/progress?part=0`),
  })
  const [saved, setSaved] = useState(0)
  const [mode, setMode] = useState<"playing" | "paused" | "ended">("playing")
  const started = progress.data?.seconds ?? 0
  const slot = progress.data?.slot_seconds ?? progress.data?.length ?? 0
  const idleAfter = (progress.data?.idle_after ?? 60) * 1000
  useEffect(() => {
    if (!courseId || !progress.data || mode !== "playing") return
    let seconds = Math.max(saved, started)
    const timer = window.setInterval(() => {
      seconds = Math.min(seconds + 10, slot)
      void api<{ seconds: number }>(`/learning/courses/${courseId}/progress`, {
        method: "POST",
        body: JSON.stringify({ part: 0, seconds }),
      }).then((body) => {
        setSaved(body.seconds)
        if (body.seconds >= slot) setMode("ended")
      })
    }, 10000)
    return () => window.clearInterval(timer)
  }, [courseId, idleAfter, mode, progress.data, saved, slot, started])
  useEffect(() => {
    if (!progress.data || mode === "ended") return
    let last = Date.now()
    const mark = () => {
      last = Date.now()
      setMode((current) => (current === "paused" ? "playing" : current))
    }
    const watch = window.setInterval(() => {
      if (Date.now() - last >= idleAfter) setMode("paused")
    }, 1000)
    window.addEventListener("pointermove", mark)
    window.addEventListener("keydown", mark)
    return () => {
      window.clearInterval(watch)
      window.removeEventListener("pointermove", mark)
      window.removeEventListener("keydown", mark)
    }
  }, [idleAfter, mode, progress.data])
  if (!courseId || !progress.data) return null
  const note = mode === "ended" ? "This learning slot has ended." : mode === "paused" ? "Paused because you stepped away." : saved > 0 ? `Saved ${saved}s` : "Progress saves every 10 seconds."
  return (
    <section className="card" aria-label="Course video">
      <h2>{buddy.data?.title}</h2>
      <div className="bar" role="img" aria-label="Video canvas" />
      <p className="muted">{note}</p>
    </section>
  )
}

function Buddy() {
  const buddy = useQuery({
    queryKey: ["learning-buddy"],
    queryFn: () => api<{ title: string; step: string; href: string }>("/learning/me/buddy"),
  })
  if (!buddy.data) return null
  return (
    <section className="card" aria-label="Learning buddy">
      <h2>Buddy</h2>
      <p><Link to={buddy.data.href}>{buddy.data.step}</Link></p>
    </section>
  )
}

function AckButton({ courseId, part }: { courseId: string; part: number }) {
  const queryClient = useQueryClient()
  const ack = useMutation({
    mutationFn: () => api(`/learning/courses/${courseId}/acknowledge`, { method: "POST", body: JSON.stringify({ part }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning"] }),
  })
  return (
    <button className="btn ghost sm" type="button" onClick={() => ack.mutate()}>
      Acknowledge
    </button>
  )
}

function dueText(label: string, iso: string | null) {
  if (label === "None" || !iso) return "None"
  return formatDate(iso)
}

function detailText(detail: string) {
  const match = /^(\d{4}-\d{2}-\d{2})(.*)$/.exec(detail)
  if (!match) return detail
  return `${formatDate(match[1])}${match[2]}`
}

function Icon({ name }: { name: "award" | "clock" | "list" | "cal" }) {
  const paths = {
    award: "M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM8.5 14L7 21l5-3 5 3-1.5-7",
    clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

export function LearningPage() {
  const learning = useHub()
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all")
  const data = learning.data
  const visible = useMemo(() => {
    const rows = data?.registrations ?? []
    const picked = tab === "all" ? rows : rows.filter((row) => row.status === tab)
    return [...picked].sort((a, b) => (a.due_on ?? "9999-12-31").localeCompare(b.due_on ?? "9999-12-31"))
  }, [data, tab])
  const hours = data && data.target_hours > 0 ? Math.round((data.completed_hours / data.target_hours) * 100) : 0

  return (
    <section className="hub">
      <div className="pagehead">
        <div>
          <h1>Learning Hub</h1>
          <p className="muted">{data?.welcome ?? "Your programmes, tasks and schedule in one place."}</p>
        </div>
        {data ? (
          <div className="hub-hours">
            <span>Learning hours</span>
            <strong>
              {data.completed_hours} / {data.target_hours} <span className="hours-unit">hours</span>
            </strong>
            <div className="bar" role="img" aria-label={`${data.completed_hours} of ${data.target_hours} learning hours`}>
              <span style={{ width: `${hours}%` }} />
            </div>
          </div>
        ) : null}
      </div>
      <Buddy />
      <VideoSave />
      <Badges />
      {learning.isPending ? <p className="muted">Loading your programmes.</p> : null}
      {learning.isError ? <p className="note bad">Learning Hub could not load your programmes. Refresh and try again.</p> : null}
      {data ? (
        <>
          <div className="hub-links">
            <Link className="qlink" to="/lms/transcript"><Icon name="award" /> Transcript</Link>
            <Link className="qlink" to="/lms/schedule"><Icon name="clock" /> Schedule learning</Link>
            <Link className="qlink" to="/lms/catalog"><Icon name="list" /> Catalog and ratings</Link>
            <Link className="qlink" to="/lms/udemy"><Icon name="award" /> Udemy</Link>
            <Link className="qlink" to="/lms/schedule"><Icon name="cal" /> Scheduled learning</Link>
          </div>
          <div className="hub-split">
            <section className="cs">
              <h3>Your action items</h3>
              <div className="in">
                {data.action_items.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="num">Due date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.action_items.map((item) => (
                        <tr key={item.label}>
                          <td>
                            <span className="lnk">{item.label}</span>
                            {item.course_id !== undefined && item.part !== undefined ? (
                              <> <AckButton courseId={item.course_id} part={item.part} /></>
                            ) : null}
                          </td>
                          <td className="num small">{item.due_label === "None" ? "None" : formatDate(item.due_label)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="muted">Nothing needs your attention. Nice work.</p>
                )}
              </div>
            </section>
            <section className="cs">
              <h3>Your tasks</h3>
              <div className="in">
                {data.tasks.length ? (
                  data.tasks.map((task) => (
                    <div className="task-row" key={`${task.title}-${task.detail}`}>
                      <div>
                        <strong>{task.title}</strong>
                        <p className="tiny muted">{detailText(task.detail)}</p>
                      </div>
                      {task.action === "Waiting" ? <span className="hub-chip pending_approval">Pending approval</span> : <button className="btn ghost sm" type="button">{task.action}</button>}
                    </div>
                  ))
                ) : (
                  <p className="muted center">No current tasks in progress</p>
                )}
              </div>
            </section>
          </div>
          <section className="cs">
            <h3>Your assigned training</h3>
            <div className="in">
              <div className="hub-tabs" role="tablist" aria-label="Assigned training">
                {TABS.map(([id, label]) => {
                  const count = id === "all" ? data.registrations.length : data.registrations.filter((row) => row.status === id).length
                  return (
                    <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
                      {label}
                      <span className="n">{count}</span>
                    </button>
                  )
                })}
              </div>
              {visible.length ? (
                <div className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Assigned by</th>
                        <th>Due date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.title}</strong>
                            <div className="tiny muted">{row.category}, {row.level}</div>
                          </td>
                          <td className="small">{row.assigned_by}</td>
                          <td className="small">{dueText(row.due_label, row.due_on)}</td>
                          <td>
                            <span className={`hub-chip ${row.status}`}>{row.status_label}</span>
                            <div className="tiny muted">{row.progress_pct}% done</div>
                          </td>
                          <td>
                            <button className={row.status === "completed" ? "btn ghost sm" : "btn sm"} type="button">{row.action}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">
                  <h4>Nothing in this list</h4>
                  <p>Programmes appear here when Management or your manager assigns them, or when you request one from the catalog.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}

export function CatalogPage() {
  const learning = useHub()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const courses = learning.data?.catalog ?? []
  const categories = ["All", ...new Set(courses.map((course) => course.category))]
  const visible = courses.filter((course) => {
    const matchesCategory = category === "All" || course.category === category
    return matchesCategory && course.title.toLowerCase().includes(query.trim().toLowerCase())
  })
  return (
    <section className="hub">
      <div className="pagehead">
        <div>
          <h1>Catalog</h1>
          <p className="muted">Browse programmes, read reviews, and request the ones you want. Your manager approves requests.</p>
        </div>
      </div>
      <div className="hub-filters">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programmes" aria-label="Search programmes" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {learning.isPending ? <p className="muted">Loading the catalog.</p> : null}
      {visible.length ? (
        <div className="hub-catalog">
          {visible.map((course) => (
            <article className="hub-course" key={course.id}>
              <div className="hub-thumb" aria-hidden="true">Play</div>
              <div className="hub-course-body">
                <p className="tiny muted">{course.category}, {course.level}</p>
                <strong>{course.title}</strong>
                <p className="small">
                  {course.rating_count ? `${course.rating_avg} from ${course.rating_count} review${course.rating_count === 1 ? "" : "s"}` : "No ratings yet"}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h4>No programmes match</h4>
          <p>Try another category or clear the search.</p>
        </div>
      )}
    </section>
  )
}

export function SchedulePage() {
  const learning = useHub()
  const sessions = learning.data?.sessions ?? []
  return (
    <section className="hub">
      <div className="pagehead">
        <div>
          <h1>Scheduled learning</h1>
          <p className="muted">Block time for learning. You get a reminder, and the player closes your session when the slot ends.</p>
        </div>
      </div>
      <section className="cs">
        <h3>Your sessions</h3>
        <div className="in">
          {learning.isPending ? <p className="muted">Loading your schedule.</p> : null}
          {sessions.length ? (
            <table>
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>When</th>
                  <th>Length</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td><strong>{session.title}</strong></td>
                    <td>{formatDate(session.date)} at {session.time}</td>
                    <td>{session.minutes} minutes</td>
                    <td><span className="hub-chip assigned">Upcoming</span></td>
                    <td><button className="btn sm" type="button">{session.action}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <h4>No sessions scheduled</h4>
              <p>Pick a programme and a time. We will remind you.</p>
            </div>
          )}
        </div>
      </section>
      <p className="note">Playback pauses when you step away, and your progress stays saved.</p>
    </section>
  )
}

export function TranscriptPage() {
  const learning = useHub()
  const udemy = useQuery({
    queryKey: ["udemy"],
    queryFn: () => api<{ items: { id: string; title: string; status: string; completed_on: string | null; certificate_code: string | null; source: string }[] }>("/learning/me/udemy"),
  })
  const done = (learning.data?.registrations ?? []).filter((row) => row.status === "completed")
  const external = (udemy.data?.items ?? []).filter((row) => row.status === "completed")
  return (
    <section className="hub">
      <div className="pagehead">
        <div>
          <h1>Transcript</h1>
          <p className="muted">Everything you have completed, with the date it was finished.</p>
        </div>
      </div>
      <section className="cs">
        <h3>Completed programmes</h3>
        <div className="in">
          {learning.isPending ? <p className="muted">Loading your transcript.</p> : null}
          {done.length || external.length ? (
            <table>
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Assigned by</th>
                  <th>Completed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {done.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.title}</strong></td>
                    <td>{row.assigned_by}</td>
                    <td>{row.completed_on ? formatDate(row.completed_on) : "Completed"}</td>
                    <td><span className="hub-chip completed">Completed</span></td>
                  </tr>
                ))}
                {external.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.title}</strong></td>
                    <td>{row.source}</td>
                    <td>{row.completed_on ? formatDate(row.completed_on) : "Completed"}</td>
                    <td><span className="hub-chip completed">{row.certificate_code}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <h4>No completed programmes yet</h4>
              <p>Finish a programme and it will be listed here.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}

export function TeamProgressPage() {
  const learning = useHub()
  const data = learning.data
  return (
    <section className="hub">
      <div className="pagehead">
        <div>
          <h1>Team progress</h1>
          <p className="muted">Enrolment requests, assigned programmes and progress for your team.</p>
        </div>
      </div>
      {learning.isPending ? <p className="muted">Loading team progress.</p> : null}
      {data?.enrolment_requests.length ? (
        <section className="cs">
          <h3>Enrolment requests</h3>
          <div className="in">
            {data.enrolment_requests.map((request) => (
              <div className="task-row" key={`${request.employee}-${request.title}`}>
                <div>
                  <strong>{request.employee}</strong>
                  <p className="tiny muted">Requests {request.title}</p>
                </div>
                <span className="hub-chip pending_approval">Pending approval</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="cs">
        <h3>Assigned programmes</h3>
        <div className="in">
          {data && data.team.length ? (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Programme</th>
                    <th>Assigned by</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {data.team.map((row) => (
                    <tr key={`${row.employee}-${row.id}`}>
                      <td>{row.employee}</td>
                      <td>{row.title}</td>
                      <td className="small">{row.assigned_by}</td>
                      <td><span className={`hub-chip ${row.status}`}>{row.status_label}</span></td>
                      <td>
                        <div className="progress-cell">
                          <div className="bar"><span style={{ width: `${row.progress_pct}%` }} /></div>
                          <span className="small">{row.progress_pct}%</span>
                        </div>
                      </td>
                      <td className="small">{row.status === "completed" ? "Done" : dueText(row.due_label, row.due_on)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <h4>No assignments yet</h4>
              <p>Programmes you assign, and programmes already on your team, show up here.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}

export function AssignPage() {
  const { user } = useAuth()
  const learning = useHub()
  const [sent, setSent] = useState("")
  const courses = learning.data?.catalog ?? []
  const asManagement = user?.role === "hr_admin"
  return (
    <section className="hub">
      <div className="pagehead">
        <div>
          <h1>Assign a programme</h1>
          <p className="muted">
            {asManagement
              ? "Assign to any group. Learners see Assigned by Management."
              : `Assign to your team. Learners see Assigned by Manager: ${user?.name ?? "you"}.`}
          </p>
        </div>
        <span className="hub-chip">{asManagement ? "Assigning as Management" : "Assigning as Manager"}</span>
      </div>
      <form
        className="hub-split"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const title = String(form.get("programme") ?? "the programme")
          setSent(`${title} is ready to assign. Learners are not notified from this demo yet.`)
        }}
      >
        <section className="cs">
          <h3>Programme</h3>
          <div className="in stack">
            <label className="field">
              <span>Programme</span>
              <select name="programme" aria-label="Programme">
                {courses.map((course) => <option key={course.id}>{course.title}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Due date</span>
              <input name="due" type="date" required />
            </label>
            <label className="field">
              <span>Note to learners</span>
              <textarea name="note" placeholder="Why this programme matters" />
            </label>
            <button className="btn" type="submit">Assign and notify</button>
          </div>
        </section>
        <section className="cs">
          <h3>Who gets this</h3>
          <div className="in">
            <p>{asManagement ? "Everyone in the active directory can be included." : "Your direct reports are included."}</p>
            {sent ? <p className="note good">{sent}</p> : <p className="note">Choose a programme and a due date, then assign it.</p>}
          </div>
        </section>
      </form>
    </section>
  )
}
