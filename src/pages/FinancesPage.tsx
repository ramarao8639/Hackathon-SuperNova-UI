// AI-Generated: Pay and benefits page
// Generated-Date: 2026-10-27
// Description: Own CTC, tax estimate, Plum wallet, allowances, and PF. Amounts are labelled Estimate.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"
import { api, ApiError } from "../api/client"
import { useAuth } from "../auth/AuthProvider"
import { useToast } from "../components/toast"
import { inr } from "../format"

const TABS = ["Summary", "Salary", "Payslips", "Tax", "Benefits", "Plum", "Allowances", "Retirement", "Documents", "Care"] as const

type Summary = {
  state: string
  message?: string
  annual_ctc: number
  monthly_ctc: number
  fixed_annual: number
  variable_annual: number
  gross_monthly: number
  in_hand_monthly: number
  in_hand_after_addons: number
  addon_monthly: number
  estimate_label: string
  rows: { label: string; annual: number; monthly: number }[]
  deductions: { employee_pf: number; professional_tax: number; tds: number; employee_insurance: number; other: number; total: number }
  tax: { regime: string; monthly_tds: number; year_to_date: number; projected_annual: number; label: string }
}

function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong"
}

export function FinancesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]>("Summary")
  const summary = useQuery({ queryKey: ["pay-summary"], queryFn: () => api<Summary>("/pay/me/summary") })
  const data = summary.data
  return (
    <section className="page">
      <p className="mono">My Finances</p>
      <h1 className="h1">Pay and benefits</h1>
      <div className="tab-row" role="tablist">
        {TABS.map((item) => (
          <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {summary.isError ? <p className="card">Pay could not be loaded.</p> : null}
      {data?.state === "empty" ? <p className="card">{data.message}</p> : null}
      {data?.state === "ready" && tab === "Summary" ? <SummaryTab data={data} /> : null}
      {data?.state === "ready" && tab === "Salary" ? <SalaryTab data={data} /> : null}
      {tab === "Payslips" ? <PayslipsTab /> : null}
      {data?.state === "ready" && tab === "Tax" ? <TaxTab data={data} /> : null}
      {tab === "Benefits" ? <BenefitsTab /> : null}
      {tab === "Plum" ? <PlumTab /> : null}
      {tab === "Allowances" ? <AllowancesTab /> : null}
      {tab === "Retirement" ? <PfTab /> : null}
      {tab === "Documents" ? <DocumentsTab /> : null}
      {tab === "Care" ? <CareTab /> : null}
      {user?.role === "finance" ? <FinanceSponsorship /> : null}
    </section>
  )
}

function SummaryTab({ data }: { data: Summary }) {
  const parts = [
    ["CTC", data.annual_ctc],
    ["Gross", data.gross_monthly * 12],
    ["Deductions", data.deductions.total * 12],
    ["In-hand", data.in_hand_after_addons * 12],
  ] as const
  const max = data.annual_ctc || 1
  return (
    <article className="card">
      <p className="mono">{data.estimate_label}</p>
      <p>Annual CTC {inr(data.annual_ctc)} · Monthly CTC {inr(data.monthly_ctc)}</p>
      <p>Fixed {inr(data.fixed_annual)} · Variable {inr(data.variable_annual)}</p>
      <p>In-hand estimate {inr(data.in_hand_after_addons)} a month</p>
      <div className="stack">
        {parts.map(([label, value]) => (
          <div key={label}>
            <span>{label} {inr(value)}</span>
            <div className="bar"><span style={{ width: `${Math.max(4, Math.round(value / max * 100))}%` }} /></div>
          </div>
        ))}
      </div>
    </article>
  )
}

function SalaryTab({ data }: { data: Summary }) {
  const [monthly, setMonthly] = useState(false)
  return (
    <article className="card">
      <button type="button" onClick={() => setMonthly((value) => !value)}>{monthly ? "Show annual" : "Show monthly"}</button>
      <table>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.label}><td>{row.label}</td><td>{inr(monthly ? row.monthly : row.annual)}</td></tr>
          ))}
          <tr><td>Total CTC</td><td>{inr(monthly ? data.monthly_ctc : data.annual_ctc)}</td></tr>
        </tbody>
      </table>
      <p>In-hand estimate {inr(data.in_hand_monthly)}. Label: Estimate.</p>
    </article>
  )
}

function TaxTab({ data }: { data: Summary }) {
  return (
    <article className="card">
      <p className="mono">{data.tax.label}</p>
      <p>Regime: {data.tax.regime} (new is the default)</p>
      <p>Monthly TDS {inr(data.tax.monthly_tds)}</p>
      <p>Year to date {inr(data.tax.year_to_date)}</p>
      <p>Projected annual tax {inr(data.tax.projected_annual)}</p>
    </article>
  )
}

function PayslipsTab() {
  const slips = useQuery({
    queryKey: ["payslips-list"],
    queryFn: () => api<{ state: string; message?: string; items: { month: string; net: number; label: string }[] }>("/pay/me/payslips"),
  })
  if (slips.data?.state === "empty") return <p className="card">{slips.data.message}</p>
  return (
    <article className="card">
      {(slips.data?.items ?? []).map((item) => (
        <p key={item.month}>
          {item.month} · {item.label} {inr(item.net)}{" "}
          <a href={`/api/pay/me/payslips/${item.month}/pdf`}>PDF</a>
        </p>
      ))}
    </article>
  )
}

function BenefitsTab() {
  const overview = useQuery({
    queryKey: ["benefits"],
    queryFn: () => api<{ insurance: { state: string; message?: string; insurer?: string; policy_number?: string; sum_insured?: number; members?: string[]; life_cover?: number; nominee?: string } }>("/benefits/me/overview"),
  })
  const insurance = overview.data?.insurance
  if (insurance?.state === "empty") return <p className="card">{insurance.message}</p>
  return (
    <article className="card">
      <p>{insurance?.insurer} · Policy {insurance?.policy_number}</p>
      <p>Sum insured {insurance?.sum_insured ? inr(insurance.sum_insured) : "—"} · Life cover {insurance?.life_cover ? inr(insurance.life_cover) : "—"}</p>
      <p>Members: {(insurance?.members ?? []).join(", ")}</p>
      <p>Nominee: {insurance?.nominee}</p>
      <p><Link to="/hrms/plum">Use my insurance</Link> · <Link to="/hrms/plum">Compare plans</Link> · <Link to="/hrms/plum">Get started</Link></p>
    </article>
  )
}

function PlumTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => api<{ state: string; message?: string; limit: number; used: number; balance: number; valid_till: string; members: string[] }>("/benefits/me/wallet") })
  const categories = useQuery({ queryKey: ["wallet-cats"], queryFn: () => api<{ items: { name: string; limit: number; used: number }[] }>("/benefits/me/wallet/categories") })
  const ledger = useQuery({ queryKey: ["wallet-ledger"], queryFn: () => api<{ items: { on: string; description: string; category: string; amount: number; balance: number }[] }>("/benefits/me/wallet/ledger") })
  const products = useQuery({
    queryKey: ["addons"],
    queryFn: () => api<{ products: { items: { id: string; name: string; monthly: number; attached: boolean }[] } }>("/benefits/me/overview").then((body) => body.products),
  })
  const claims = useQuery({ queryKey: ["claims"], queryFn: () => api<{ items: { id: string; category: string; amount: number; status: string }[] }>("/benefits/me/claims") })
  const [category, setCategory] = useState("Sports and fitness")
  const [amount, setAmount] = useState("500")
  const claim = useMutation({
    mutationFn: () => api("/benefits/me/claims", { method: "POST", body: JSON.stringify({ category, amount: Number(amount), on: new Date().toISOString().slice(0, 10) }) }),
    onSuccess: () => {
      toast("Claim submitted")
      void queryClient.invalidateQueries({ queryKey: ["claims"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  const addon = useMutation({
    mutationFn: (item: { id: string; attached: boolean; monthly: number }) => api<{ in_hand_change: number }>("/benefits/me/addons", {
      method: "POST",
      body: JSON.stringify({ product: item.id, action: item.attached ? "remove" : "attach" }),
    }),
    onSuccess: (result) => {
      const sign = result.in_hand_change < 0 ? "-" : "+"
      toast(`In-hand changes by ${sign}INR ${Math.abs(result.in_hand_change)}`)
      void queryClient.invalidateQueries({ queryKey: ["addons"] })
      void queryClient.invalidateQueries({ queryKey: ["pay-summary"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  if (wallet.data?.state === "empty") return <p className="card">{wallet.data.message}</p>
  return (
    <div className="stack">
      <article className="card">
        <p>Limit {wallet.data ? inr(wallet.data.limit) : "—"} · Used {wallet.data ? inr(wallet.data.used) : "—"} · Balance {wallet.data ? inr(wallet.data.balance) : "—"}</p>
        <p>Valid till {wallet.data?.valid_till}. Covered: {(wallet.data?.members ?? []).join(", ")}</p>
      </article>
      {(categories.data?.items ?? []).map((item) => (
        <article className="card" key={item.name}>
          <p>{item.name} · {inr(item.used)} of {inr(item.limit)}</p>
          <div className="bar"><span style={{ width: `${Math.min(100, Math.round(item.used / item.limit * 100))}%` }} /></div>
        </article>
      ))}
      <article className="card">
        <h2>Ledger</h2>
        {(ledger.data?.items ?? []).map((item) => (
          <p key={`${item.on}-${item.description}`}>{item.on} · {item.description} · {item.category} · {inr(item.amount)} · Balance {inr(item.balance)}</p>
        ))}
      </article>
      <form className="card stack" onSubmit={(event) => { event.preventDefault(); claim.mutate() }}>
        <h2>Claim</h2>
        <label>Category <input value={category} onChange={(event) => setCategory(event.target.value)} /></label>
        <label>Amount <input value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <button type="submit">Submit</button>
        {(claims.data?.items ?? []).map((item) => <p key={item.id}>{item.category} · {inr(item.amount)} · {item.status}</p>)}
      </form>
      <article className="card">
        <h2>Add-ons</h2>
        {(products.data?.items ?? []).filter((item) => item.monthly > 0).map((item) => (
          <p key={item.id}>
            {item.name} from {inr(item.monthly)} a month{" "}
            <button type="button" onClick={() => addon.mutate(item)}>{item.attached ? "Remove" : "Attach"}</button>
          </p>
        ))}
      </article>
    </div>
  )
}

function AllowancesTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const allowances = useQuery({ queryKey: ["allowances"], queryFn: () => api<{ state: string; items: { kind: string; limit: number; used: number; balance: number }[] }>("/benefits/me/allowances") })
  const mine = useQuery({ queryKey: ["reimburse"], queryFn: () => api<{ items: { id: string; kind: string; amount: number; status: string }[] }>("/reimbursements/me") })
  const [kind, setKind] = useState("travel")
  const [amount, setAmount] = useState("1000")
  const submit = useMutation({
    mutationFn: () => api("/reimbursements", { method: "POST", body: JSON.stringify({ kind, amount: Number(amount), on: new Date().toISOString().slice(0, 10) }) }),
    onSuccess: () => {
      toast("Claim sent to your manager")
      void queryClient.invalidateQueries({ queryKey: ["reimburse"] })
    },
    onError: (error) => toast(messageOf(error)),
  })
  return (
    <div className="stack">
      {(allowances.data?.items ?? []).map((item) => (
        <article className="card" key={item.kind}>
          <p>{item.kind} · Limit {inr(item.limit)} · Used {inr(item.used)} · Balance {inr(item.balance)}</p>
        </article>
      ))}
      <form className="card stack" onSubmit={(event) => { event.preventDefault(); submit.mutate() }}>
        <label>Type <input value={kind} onChange={(event) => setKind(event.target.value)} /></label>
        <label>Amount <input value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <button type="submit">Claim</button>
        {(mine.data?.items ?? []).map((item) => <p key={item.id}>{item.kind} · {inr(item.amount)} · {item.status}</p>)}
      </form>
    </div>
  )
}

function PfTab() {
  const pf = useQuery({
    queryKey: ["pf"],
    queryFn: () => api<{ state: string; message?: string; employee_monthly: number; employer_monthly: number; year_to_date: number; balance: number; uan: string; nominee: string; passbook: { month: string; employee: number; employer: number }[] }>("/benefits/me/pf"),
  })
  if (pf.data?.state === "empty") return <p className="card">{pf.data.message}</p>
  return (
    <article className="card">
      <p>Employee PF {pf.data ? inr(pf.data.employee_monthly) : "—"} · Employer PF {pf.data ? inr(pf.data.employer_monthly) : "—"}</p>
      <p>Year to date {pf.data ? inr(pf.data.year_to_date) : "—"} · Balance {pf.data ? inr(pf.data.balance) : "—"}</p>
      <p>UAN {pf.data?.uan} · Nominee {pf.data?.nominee}</p>
      {(pf.data?.passbook ?? []).map((row) => <p key={row.month}>{row.month}: employee {inr(row.employee)}, employer {inr(row.employer)}</p>)}
      <p>Withdrawal and transfer are requested through HR. Gratuity follows years of service.</p>
    </article>
  )
}

function DocumentsTab() {
  const slips = useQuery({ queryKey: ["payslips-list"], queryFn: () => api<{ items: { month: string }[] }>("/pay/me/payslips") })
  return (
    <article className="card">
      {(slips.data?.items ?? []).map((item) => (
        <p key={item.month}><a href={`/api/pay/me/payslips/${item.month}/pdf`}>{item.month} payslip</a></p>
      ))}
    </article>
  )
}

function CareTab() {
  const { toast } = useToast()
  const programmes = ["Gym", "Yoga", "Counselling", "Health camp", "Step challenge"]
  return (
    <article className="card">
      <h2>Wellness</h2>
      {programmes.map((name) => (
        <p key={name}>{name} <button type="button" onClick={() => toast(`Enrolled in ${name}`)}>Enrol</button></p>
      ))}
      <h2>Maternity and paternity</h2>
      <p>Eligibility uses your join date on your profile. A request goes to HR. EAP and emergency contacts are on the HR desk.</p>
    </article>
  )
}

function FinanceSponsorship() {
  const queryClient = useQueryClient()
  const queue = useQuery({
    queryKey: ["sponsorship-finance"],
    queryFn: () => api<{ items: { id: string; course: string; amount: number; status: string }[] }>("/learning/finance/sponsorship"),
  })
  const decide = useMutation({
    mutationFn: (id: string) => api(`/learning/sponsorship/${id}/finance`, { method: "POST", body: JSON.stringify({ status: "approved" }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sponsorship-finance"] }),
  })
  return (
    <article className="card">
      <h2>Course sponsorship</h2>
      {(queue.data?.items ?? []).map((item) => (
        <p key={item.id}>
          {item.course} · {inr(item.amount)}{" "}
          <button className="btn sm" type="button" onClick={() => decide.mutate(item.id)}>Reimburse</button>
        </p>
      ))}
      {queue.data && queue.data.items.length === 0 ? <p>No sponsorship is waiting for finance.</p> : null}
    </article>
  )
}

export function PlumMockPage() {
  return (
    <section className="page">
      <p className="mono">Plum</p>
      <h1 className="h1">Mock Plum</h1>
      <article className="card">
        <p>This is a stand-in for the Plum site. Plans and the e-card stay inside Supernova.</p>
        <p><Link to="/hrms/finances">Back to Pay and benefits</Link></p>
      </article>
    </section>
  )
}
