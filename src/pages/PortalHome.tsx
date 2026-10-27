// AI-Generated: HR home and system admin
// Generated-Date: 2026-10-26
// Description: Landing pages for the HR Management and Admin portals

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { api } from "../api/client"
import { formatWhen } from "../format"

type Person = { name: string; employee_no: string; role: string; status: string; portals: string[] }
type Portal = { id: string; name: string; landing_path: string; roles: string[] }
type AuditRow = { at: string; who: string; action: string; target: string }
type Health = { name: string; status: string }

export function HrHomePage() {
  const people = useQuery({ queryKey: ["employees"], queryFn: () => api<{ items: { name: string }[] }>("/hris/employees") })
  const pending = useQuery({ queryKey: ["approvals"], queryFn: () => api<{ items: unknown[] }>("/time/approvals/pending") })
  return (
    <section className="page">
      <p className="mono">HR Management</p>
      <h1 className="h1">HR home</h1>
      <div className="tiles">
        <article className="card"><p className="mono">Employees</p><p className="serif" style={{ fontSize: 42 }}>{people.data?.items.length ?? "—"}</p></article>
        <article className="card"><p className="mono">Requests pending</p><p className="serif" style={{ fontSize: 42 }}>{pending.data?.items.length ?? "—"}</p></article>
      </div>
      <div className="chips">
        <Link className="btn" to="/hrms/approvals">Approvals</Link>
        <Link className="btn" to="/hrms/employees">Employees</Link>
        <Link className="btn" to="/genie/publish">Publish a document</Link>
        <Link className="btn" to="/lms/catalog">Assign a programme</Link>
      </div>
    </section>
  )
}

export function SysAdminPage() {
  const client = useQueryClient()
  const adapters = useQuery({ queryKey: ["sys-adapters"], queryFn: () => api<{ items: { name: string; mode: string; status: string }[] }>("/admin/adapters") })
  const toggle = useMutation({
    mutationFn: (item: { name: string; status: string }) => api(`/admin/adapters/${item.name}`, { method: "POST", body: JSON.stringify({ down: item.status !== "down" }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["sys-adapters"] }),
  })
  const people = useQuery({ queryKey: ["sys-users"], queryFn: () => api<{ items: Person[] }>("/admin/users") })
  const portals = useQuery({ queryKey: ["sys-portals"], queryFn: () => api<{ items: Portal[] }>("/admin/portals") })
  const health = useQuery({ queryKey: ["sys-health"], queryFn: () => api<{ items: Health[] }>("/admin/health") })
  const audit = useQuery({ queryKey: ["sys-audit"], queryFn: () => api<{ items: AuditRow[] }>("/admin/audit") })
  return (
    <section className="page">
      <p className="mono">Admin</p>
      <h1 className="h1">System admin</h1>
      <div className="tiles">
        {(health.data?.items ?? []).map((item) => (
          <article className="card" key={item.name}>
            <p className="mono">{item.name}</p>
            <strong style={{ color: item.status === "ok" ? "var(--good)" : "var(--bad)" }}>{item.status}</strong>
          </article>
        ))}
      </div>
      <h2>Mock adapters</h2>
      {(adapters.data?.items ?? []).map((item) => (
        <p className="card" key={item.name}>
          <strong>{item.name}</strong> · {item.mode} · {item.status}
          <button className="btn ghost sm" type="button" style={{ marginLeft: 12 }} onClick={() => toggle.mutate(item)}>
            {item.status === "down" ? "Mark ok" : "Mark down"}
          </button>
        </p>
      ))}
      <h2>Portal access</h2>
      {(portals.data?.items ?? []).map((item) => (
        <p className="card" key={item.id}><strong>{item.name}</strong> · {item.landing_path}<br />{item.roles.join(", ")}</p>
      ))}
      <h2>Users and roles</h2>
      {(people.data?.items ?? []).map((item) => (
        <p className="card" key={item.employee_no}>{item.name} · {item.role} · {item.portals.join(", ")}</p>
      ))}
      <h2>Audit log</h2>
      {(audit.data?.items ?? []).map((item) => (
        <p className="card" key={`${item.at}-${item.action}-${item.target}`}>{formatWhen(item.at)} · {item.who} · {item.action} · {item.target}</p>
      ))}
    </section>
  )
}
