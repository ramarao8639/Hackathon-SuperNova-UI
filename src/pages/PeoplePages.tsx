// AI-Generated: PeopleDesk leave screens
// Generated-Date: 2026-10-26
// Description: Dashboard, apply, requests, approvals, holidays, team, pay, and performance

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api, ApiError } from "../api/client"
import { Avatar } from "../components/Avatar"
import { useToast } from "../components/toast"
import { formatDate } from "../format"
import { AddEmployeeForm } from "./PeoplePhase2"

type Balance = { type_code: string; type_name: string; available: number; pending: number; used: number }
type LeaveType = { code: string; name: string; allow_half_day: boolean }
type Hint = { balance_after: number | null; clashes: { name: string; days: number }[]; flags: string[] }
type LeaveRequest = {
  id: string
  type_name: string
  start_on: string
  end_on: string
  days: number
  status: string
  comment: string
  approver: { name: string } | null
  employee: { name: string; employee_no: string; performance_pct?: number | null; review_status?: "published" | "none" | null } | null
  hint: Hint | null
}
type Preview = { ok: boolean; message: string; warning: string; days: number; available: number | null; available_after: number | null }

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong"
}

export function DashboardPage() {
  const balances = useQuery({ queryKey: ["balances"], queryFn: () => api<{ items: Balance[] }>("/time/balances") })
  const requests = useQuery({ queryKey: ["leave", "pending"], queryFn: () => api<{ items: LeaveRequest[] }>("/time/leaverequests?status=pending") })
  const holidays = useQuery({ queryKey: ["holidays"], queryFn: () => api<{ summary: string }>("/time/holidays") })
  const home = useQuery({
    queryKey: ["people-home"],
    queryFn: () => api<{ time_today: string; on_leave: string[]; working_remotely: string[]; inbox_count: number }>("/people/home"),
  })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Dashboard</h1>
      <div className="tiles">
        {(balances.data?.items ?? []).slice(0, 4).map((item) => (
          <article className="card" key={item.type_code}>
            <p className="mono">{item.type_name}</p>
            <p className="serif" style={{ fontSize: 42, margin: "8px 0" }}>{item.available}</p>
            <p>{item.pending > 0 ? <span className="chip">{item.pending} pending</span> : "Available days"}</p>
          </article>
        ))}
      </div>
      <div className="tiles">
        <article className="card"><p className="mono">Time today</p><strong>{home.isError ? "Could not load time" : home.data?.time_today ?? "—"}</strong></article>
        <article className="card"><p className="mono">On leave today</p><strong>{home.data?.on_leave.length ? home.data.on_leave.join(", ") : "Nobody"}</strong></article>
        <article className="card"><p className="mono">Working remotely</p><strong>{home.data?.working_remotely.length ? home.data.working_remotely.join(", ") : "Nobody"}</strong></article>
        <article className="card"><p className="mono">Inbox</p><strong>{home.data?.inbox_count ?? 0}</strong></article>
      </div>
      <div className="grid-2" style={{ marginTop: 18 }}>
        <article className="card">
          <h2>Pending requests</h2>
          {(requests.data?.items ?? []).length === 0 ? <p>No pending leave.</p> : null}
          {(requests.data?.items ?? []).map((item) => (
            <p key={item.id}>{item.type_name} · {formatDate(item.start_on)} · {item.days} day{item.days === 1 ? "" : "s"}</p>
          ))}
        </article>
        <article className="card">
          <h2>Next holiday</h2>
          <p>{holidays.data?.summary ?? "—"}</p>
        </article>
      </div>
    </section>
  )
}

export function ApplyLeavePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const types = useQuery({ queryKey: ["leave-types"], queryFn: () => api<{ items: LeaveType[] }>("/time/leavetypes") })
  const [chosen, setChosen] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [half, setHalf] = useState(false)
  const [reason, setReason] = useState("")
  const typeCode = chosen || types.data?.items[0]?.code || "CL"
  const plan = useQuery({
    queryKey: ["leave-plan", typeCode],
    queryFn: () => api<{ options: { start_on: string; end_on: string; working_days: number }[] }>(`/time/plan?type_code=${encodeURIComponent(typeCode)}&days=1`),
  })
  const whatIf = useQuery({
    queryKey: ["leave-what-if", typeCode],
    queryFn: () => api<{ ok: boolean; available: number | null; available_after: number | null; start_on: string | null; message: string }>(`/time/what-if?type_code=${encodeURIComponent(typeCode)}&days=1`),
  })
  const preview = useQuery({
    queryKey: ["leave-preview", typeCode, start, end, half],
    enabled: Boolean(start && end),
    queryFn: () => api<Preview>("/time/leaverequests/validate", {
      method: "POST",
      body: JSON.stringify({ type_code: typeCode, start_on: start, end_on: end, half_day: half, reason }),
    }),
  })
  const submit = useMutation({
    mutationFn: () => api("/time/leaverequests", {
      method: "POST",
      body: JSON.stringify({ type_code: typeCode, start_on: start, end_on: end, half_day: half, reason }),
    }),
    onSuccess: () => {
      toast("Leave request sent")
      void queryClient.invalidateQueries({ queryKey: ["leave"] })
      void queryClient.invalidateQueries({ queryKey: ["balances"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  const selected = types.data?.items.find((item) => item.code === typeCode)
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Apply leave</h1>
      <div className="card">
        <h2>Suggested dates</h2>
        <div className="chips">
          {(plan.data?.options ?? []).map((option) => (
            <button
              className="btn ghost sm"
              type="button"
              key={`${option.start_on}-${option.end_on}`}
              onClick={() => {
                setStart(option.start_on)
                setEnd(option.end_on)
                setHalf(false)
              }}
            >
              {formatDate(option.start_on)}
            </button>
          ))}
          {plan.data && plan.data.options.length === 0 ? <p className="muted">No open dates in the next few weeks.</p> : null}
        </div>
        {whatIf.data?.ok && whatIf.data.available != null ? (
          <p>Taking one day on {formatDate(whatIf.data.start_on ?? "")} leaves {whatIf.data.available_after} of {whatIf.data.available}.</p>
        ) : null}
      </div>
      <form className="card stack" onSubmit={(event) => { event.preventDefault(); submit.mutate() }}>
        <label>Type
          <select value={typeCode} onChange={(event) => setChosen(event.target.value)}>
            {(types.data?.items ?? []).map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </label>
        <label>From <input type="date" required value={start} onChange={(event) => setStart(event.target.value)} /></label>
        <label>To <input type="date" required value={end} onChange={(event) => setEnd(event.target.value)} /></label>
        {selected?.allow_half_day ? (
          <label><input type="checkbox" checked={half} onChange={(event) => setHalf(event.target.checked)} /> Half day</label>
        ) : null}
        <label>Reason <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} /></label>
        {preview.data ? (
          <p>
            {preview.data.days} working day{preview.data.days === 1 ? "" : "s"}.
            {preview.data.available != null ? ` Available now ${preview.data.available}, after ${preview.data.available_after}.` : ""}
            {preview.data.ok ? "" : ` ${preview.data.message}`}
            {preview.data.warning ? ` ${preview.data.warning}` : ""}
          </p>
        ) : null}
        <button className="btn gold" type="submit" disabled={submit.isPending || preview.data?.ok === false}>Submit</button>
      </form>
    </section>
  )
}

export function RequestsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const requests = useQuery({ queryKey: ["leave", "mine"], queryFn: () => api<{ items: LeaveRequest[] }>("/time/leaverequests") })
  const cancel = useMutation({
    mutationFn: (id: string) => api(`/time/leaverequests/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      toast("Request cancelled")
      void queryClient.invalidateQueries({ queryKey: ["leave"] })
      void queryClient.invalidateQueries({ queryKey: ["balances"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">My requests</h1>
      {(requests.data?.items ?? []).length === 0 ? <p className="card">No leave requests yet.</p> : null}
      {(requests.data?.items ?? []).map((item) => (
        <article className="card" key={item.id}>
          <h2>{item.type_name}</h2>
          <p>{formatDate(item.start_on)} to {formatDate(item.end_on)} · {item.days} day{item.days === 1 ? "" : "s"} · {item.status}</p>
          <p>Approver: {item.approver?.name ?? "—"}</p>
          {item.comment ? <p>{item.comment}</p> : null}
          {item.status === "pending" ? <button className="btn" type="button" onClick={() => cancel.mutate(item.id)}>Cancel</button> : null}
        </article>
      ))}
    </section>
  )
}

export function ApprovalsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const pending = useQuery({ queryKey: ["approvals"], queryFn: () => api<{ items: LeaveRequest[] }>("/time/approvals/pending") })
  const decide = useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: "approve" | "reject"; comment: string }) =>
      api(`/time/leaverequests/${id}/${action}`, { method: "POST", body: JSON.stringify({ comment }) }),
    onSuccess: () => {
      toast("Decision saved")
      void queryClient.invalidateQueries({ queryKey: ["approvals"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Approvals</h1>
      {(pending.data?.items ?? []).length === 0 ? <p className="card">Nothing is waiting for you.</p> : null}
      {(pending.data?.items ?? []).map((item) => (
        <article className="card" key={item.id}>
          <p>
            {item.employee ? (
              <Avatar name={item.employee.name} pct={item.employee.performance_pct} reviewStatus={item.employee.review_status} size={56} showPct />
            ) : null}{" "}
            {item.employee?.name} · {item.type_name}
          </p>
          <p>{formatDate(item.start_on)} to {formatDate(item.end_on)} · {item.days} day{item.days === 1 ? "" : "s"}</p>
          {item.hint ? (
            <div className="card" style={{ background: "#f4faf6", fontSize: 13, marginBottom: 8 }}>
              <p className="mono" style={{ marginBottom: 4 }}>Genie hint</p>
              {item.hint.balance_after !== null ? (
                <p>Balance after approval: <strong>{item.hint.balance_after} days</strong>.</p>
              ) : null}
              {item.hint.clashes.length ? (
                <p>Also off those days: <strong>{item.hint.clashes.map((c) => c.name).join(", ")}</strong>.</p>
              ) : (
                <p>No team clashes.</p>
              )}
              {item.hint.flags.map((flag) => (
                <p key={flag} style={{ color: "#b3352a" }}>⚠ {flag}</p>
              ))}
            </div>
          ) : null}
          <div className="row-actions">
            <button className="btn gold" type="button" onClick={() => decide.mutate({ id: item.id, action: "approve", comment: "" })}>Approve</button>
            <button className="btn" type="button" onClick={() => decide.mutate({ id: item.id, action: "reject", comment: "Please pick different dates" })}>Reject</button>
          </div>
        </article>
      ))}
    </section>
  )
}

export function HolidaysPage() {
  const holidays = useQuery({ queryKey: ["holidays"], queryFn: () => api<{ items: { on: string; name: string; mandatory: boolean }[] }>("/time/holidays") })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Holidays</h1>
      {(holidays.data?.items ?? []).map((item) => (
        <p className="card" key={item.on}>{formatDate(item.on)} · {item.name} · {item.mandatory ? "Mandatory" : "Optional"}</p>
      ))}
    </section>
  )
}

export function TeamPage() {
  const team = useQuery({ queryKey: ["team"], queryFn: () => api<{ items: { id: string; name: string; employee_no: string; designation: string; performance_pct: number | null; review_status: "published" | "none" | null }[] }>("/time/team") })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Team</h1>
      {(team.data?.items ?? []).map((item) => (
        <p className="card" key={item.employee_no}>
          <Avatar name={item.name} pct={item.performance_pct} reviewStatus={item.review_status} size={48} showPct /> {item.name} · {item.employee_no} · {item.designation}
        </p>
      ))}
    </section>
  )
}

export function EmployeesPage() {
  const people = useQuery({ queryKey: ["employees"], queryFn: () => api<{ items: { name: string; employee_no: string; email: string; performance_pct: number | null; review_status: "published" | "none" | null }[] }>("/hris/employees") })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Employees</h1>
      <AddEmployeeForm />
      {(people.data?.items ?? []).map((item) => (
        <p className="card" key={item.employee_no}>
          <Avatar name={item.name} pct={item.performance_pct} reviewStatus={item.review_status} size={48} showPct /> {item.name} · {item.employee_no} · {item.email}
        </p>
      ))}
    </section>
  )
}

export function PayslipsPage() {
  const pay = useQuery({ queryKey: ["payslips"], queryFn: () => api<{ state: string; message: string; masked: boolean }>("/payroll/payslips") })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Payslips</h1>
      <article className="card">
        <p>{pay.data?.message ?? "Amounts stay hidden."}</p>
        <p className="mono">Masked</p>
      </article>
    </section>
  )
}

export function PerformancePage() {
  const review = useQuery({
    queryKey: ["performance"],
    queryFn: () => api<{ state: string; message?: string; percent?: string; goals?: { name: string; weight: number; progress: number }[] }>("/performance/mine"),
  })
  if (review.data?.state === "empty") {
    return <section className="page"><h1 className="h1">Performance</h1><p className="card">{review.data.message}</p></section>
  }
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Performance</h1>
      <p className="serif" style={{ fontSize: 48 }}>{review.data?.percent ?? "—"}</p>
      {(review.data?.goals ?? []).map((goal) => (
        <p className="card" key={goal.name}>{goal.name} · weight {goal.weight} · progress {goal.progress}</p>
      ))}
    </section>
  )
}
