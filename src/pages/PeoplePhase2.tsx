// AI-Generated: PeopleDesk phase 2 screens
// Generated-Date: 2026-10-27
// Description: Attendance, onboarding, org tree, and internal jobs

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { api, ApiError } from "../api/client"
import { useToast } from "../components/toast"

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong"
}

export function AttendancePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const home = useQuery({ queryKey: ["people-home"], queryFn: () => api<{ time_today: string }>("/people/home") })
  const ledger = useQuery({ queryKey: ["leave-ledger"], queryFn: () => api<{ items: { entry: string; type_code: string; days: number; on: string }[]; policy: string }>("/time/ledger") })
  const checkIn = useMutation({
    mutationFn: (kind: "office" | "wfh") => api("/attendance/me/checkin", { method: "POST", body: JSON.stringify({ kind }) }),
    onSuccess: () => {
      toast("Time saved")
      void queryClient.invalidateQueries({ queryKey: ["people-home"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Attendance</h1>
      <article className="card">
        <p>Today: {home.data?.time_today ?? "Loading…"}</p>
        <button type="button" onClick={() => checkIn.mutate("office")}>Check in</button>{" "}
        <button type="button" onClick={() => checkIn.mutate("wfh")}>Working from home</button>
      </article>
      <article className="card">
        <h2>Leave ledger</h2>
        <p>{ledger.data?.policy}</p>
        {(ledger.data?.items ?? []).length === 0 ? <p>No ledger rows yet.</p> : null}
        {(ledger.data?.items ?? []).map((item) => (
          <p key={`${item.on}-${item.entry}-${item.type_code}`}>{item.on} · {item.entry} · {item.type_code} · {item.days}</p>
        ))}
      </article>
    </section>
  )
}

export function OnboardingPage() {
  const tasks = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => api<{ items: { id: string; title: string; owner: string; due_on: string; status: string }[] }>("/me/onboarding"),
  })
  const items = tasks.data?.items ?? []
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Onboarding</h1>
      {tasks.isError ? <p className="card">Onboarding could not be loaded.</p> : null}
      {!tasks.isLoading && items.length === 0 ? <p className="card">No onboarding tasks. You are past joining.</p> : null}
      {items.map((item) => (
        <article className="card" key={item.id}>
          <strong>{item.title}</strong>
          <p>Owner: {item.owner} · Due {item.due_on} · {item.status}</p>
        </article>
      ))}
    </section>
  )
}

type OrgNode = { id: string; name: string; title: string; reports: OrgNode[] }

function OrgBranch({ node }: { node: OrgNode }) {
  return (
    <li>
      <strong>{node.name}</strong> <span className="muted">{node.title}</span>
      {node.reports.length > 0 ? (
        <ul>{node.reports.map((child) => <OrgBranch key={child.id} node={child} />)}</ul>
      ) : null}
    </li>
  )
}

export function OrgPage() {
  const tree = useQuery({ queryKey: ["org"], queryFn: () => api<{ roots: OrgNode[] }>("/org/tree") })
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Org tree</h1>
      {tree.isError ? <p className="card">The org tree could not be loaded.</p> : null}
      <ul>{(tree.data?.roots ?? []).map((node) => <OrgBranch key={node.id} node={node} />)}</ul>
    </section>
  )
}

export function JobsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const jobs = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api<{ items: { id: string; title: string; team: string; location: string; application_status: string | null }[] }>("/jobs"),
  })
  const apply = useMutation({
    mutationFn: (id: string) => api<{ status: string }>(`/jobs/${id}/applications`, { method: "POST" }),
    onSuccess: () => {
      toast("Application sent")
      void queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  const items = jobs.data?.items ?? []
  return (
    <section className="page">
      <p className="mono">PeopleDesk</p>
      <h1 className="h1">Opportunities</h1>
      {jobs.isError ? <p className="card">Jobs could not be loaded.</p> : null}
      {!jobs.isLoading && items.length === 0 ? <p className="card">No open roles.</p> : null}
      {items.map((item) => (
        <article className="card" key={item.id}>
          <strong>{item.title}</strong>
          <p>{item.team} · {item.location}</p>
          {item.application_status ? <p>Status: {item.application_status}</p> : <button type="button" onClick={() => apply.mutate(item.id)}>Apply</button>}
        </article>
      ))}
    </section>
  )
}

export function AddEmployeeForm() {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [employeeNo, setEmployeeNo] = useState("")
  const [error, setError] = useState("")
  const create = useMutation({
    mutationFn: () => api("/hr/employees", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        employee_no: employeeNo,
        branch: "Hyderabad",
        department: "Customer Insights",
        manager_email: "meera@supernova.example",
      }),
    }),
    onSuccess: () => {
      setError("")
      toast("Employee added. Onboarding and programmes are assigned.")
    },
    onError: (err) => setError(messageOf(err)),
  })
  return (
    <form className="card stack" onSubmit={(event) => { event.preventDefault(); create.mutate() }}>
      <h2>Add employee</h2>
      <label>Name <input value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <label>Email <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label>Employee number <input value={employeeNo} onChange={(event) => setEmployeeNo(event.target.value)} required /></label>
      {error ? <p>{error}</p> : null}
      <button type="submit">Add</button>
    </form>
  )
}
