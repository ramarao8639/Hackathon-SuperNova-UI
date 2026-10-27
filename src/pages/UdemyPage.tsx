// AI-Generated: Udemy learning page
// Generated-Date: 2026-10-27
// Description: Licensed courses, sync, inactivity, and a skill radar

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "../api/client"
import { useToast } from "../components/toast"

type Course = { id: string; title: string; instructor: string; minutes: number; rating: number; skills: string[] }
type Enrolment = {
  id: string
  course_id: string
  title: string
  status: string
  progress: number
  lectures_done: number
  lectures_total: number
  minutes_watched: number
  last_active: string | null
  active_days: number
  streak: number
  inactive: boolean
  certificate_code: string | null
  source: string
}

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong"
}

export function UdemyPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const udemy = useQuery({
    queryKey: ["udemy"],
    queryFn: () => api<{ items: Enrolment[]; catalog: Course[] }>("/learning/me/udemy"),
  })
  const path = useQuery({
    queryKey: ["learning-path"],
    queryFn: () => api<{ current_level: string; next_level: string | null; progress_pct: number; next_step: string }>("/learning/me/path"),
  })
  const skills = useQuery({
    queryKey: ["skills"],
    queryFn: () => api<{ items: { name: string; hours: number; level: number }[] }>("/learning/me/skills"),
  })
  const sync = useMutation({
    mutationFn: () => api("/learning/me/udemy/sync", { method: "POST" }),
    onSuccess: () => {
      toast("Udemy progress updated")
      void queryClient.invalidateQueries({ queryKey: ["udemy"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  const enrol = useMutation({
    mutationFn: (courseId: string) => api("/learning/me/udemy/enrol", { method: "POST", body: JSON.stringify({ course_id: courseId }) }),
    onSuccess: () => {
      toast("Enrolled")
      void queryClient.invalidateQueries({ queryKey: ["udemy"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  const items = udemy.data?.items ?? []
  const enrolled = new Set(items.map((item) => item.course_id))
  const inactive = items.filter((item) => item.inactive)
  const points = (skills.data?.items ?? []).map((item, index, all) => {
    const angle = (Math.PI * 2 * index) / Math.max(all.length, 1) - Math.PI / 2
    const radius = 20 + item.hours * 3
    return [80 + Math.cos(angle) * radius, 80 + Math.sin(angle) * radius]
  })
  return (
    <section className="hub">
      <div className="pagehead">
        <div>
          <h1>Udemy</h1>
          <p className="muted">Organisation courses. Progress updates when you choose Sync now.</p>
        </div>
        <button type="button" onClick={() => sync.mutate()}>Sync now</button>
      </div>
      {udemy.isError ? <p className="note bad">Udemy could not be loaded.</p> : null}
      <article className="card">
        <h2>Learning path</h2>
        <p>{path.data?.current_level} · {path.data?.progress_pct ?? 0}% toward {path.data?.next_level ?? "the next level"}</p>
        <p>Next: {path.data?.next_step ?? "—"}</p>
      </article>
      {inactive.length ? (
        <article className="card">
          <h2>No activity for 7 days</h2>
          {inactive.map((item) => <p key={item.id}>{item.title}. Your manager can see this flag.</p>)}
        </article>
      ) : null}
      <div className="grid-2">
        <article className="card">
          <h2>Your courses</h2>
          {items.length === 0 ? <p>You have not enrolled yet.</p> : null}
          {items.map((item) => (
            <div key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.progress}% · {item.lectures_done}/{item.lectures_total} lectures · {item.minutes_watched} minutes · streak {item.streak}</p>
              <p>Last active {item.last_active ? item.last_active.slice(0, 10) : "never"} · {item.status}</p>
              <div className="heat" aria-label={`${item.active_days} active days this week`}>
                {Array.from({ length: 7 }, (_, day) => (
                  <i key={day} className={day < item.active_days ? "on" : ""} />
                ))}
              </div>
              {item.certificate_code ? <p>{item.source} · {item.certificate_code}</p> : null}
            </div>
          ))}
        </article>
        <article className="card">
          <h2>Skills</h2>
          <svg viewBox="0 0 160 160" width="180" height="180" role="img" aria-label="Skill radar">
            <polygon points={points.map((point) => point.join(",")).join(" ")} fill="rgba(42,135,84,0.25)" stroke="#2a8754" />
          </svg>
          {(skills.data?.items ?? []).map((item) => (
            <p key={item.name}>{item.name} · {item.hours} hours · level {item.level}</p>
          ))}
        </article>
      </div>
      <article className="card">
        <h2>Catalog</h2>
        {(udemy.data?.catalog ?? []).map((course) => (
          <p key={course.id}>
            {course.title} · {course.instructor} · {course.minutes} min · {course.rating} · {course.skills.join(", ")}{" "}
            {enrolled.has(course.id) ? <span>Enrolled</span> : <button type="button" onClick={() => enrol.mutate(course.id)}>Enrol</button>}
          </p>
        ))}
      </article>
    </section>
  )
}
