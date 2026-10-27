// AI-Modified: Rebuilt to match the HTML prototype's login layout
// Modified-Date: 2026-10-27
// Description: Two-pane .login/.l/.r with a .portals radio list, pico icon chips, and .pav avatar previews

import { useState } from "react"
import { Navigate, useNavigate } from "react-router"
import { api, ApiError } from "../api/client"
import { useAuth } from "../auth/AuthProvider"
import { Avatar } from "../components/Avatar"

const PORTALS = [
  { id: "genie", name: "Employee Genie", blurb: "Documents, your persona and the Genie assistant", who: "All employees" },
  { id: "peopledesk", name: "PeopleDesk", blurb: "Leave, attendance and your profile", who: "Employees and managers" },
  { id: "hr", name: "HR Management", blurb: "Approvals, leave policy, employees and reports", who: "HR" },
  { id: "admin", name: "Admin", blurb: "Users, access, integrations and audit log", who: "System admin" },
  { id: "learning", name: "Learning Hub", blurb: "Programmes, videos, ratings and your schedule", who: "All employees" },
] as const

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [portal, setPortal] = useState<(typeof PORTALS)[number]["id"]>("genie")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [mail, setMail] = useState<{ to: string; subject: string; password: string } | null>(null)

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" aria-label="Loading" />
      </div>
    )
  }
  if (user) return <Navigate to={user.role === "sys_admin" ? "/genie/sysadmin" : "/genie/persona"} replace />

  const current = PORTALS.find((item) => item.id === portal) ?? PORTALS[0]

  function choose(next: (typeof PORTALS)[number]) {
    setPortal(next.id)
    setError("")
  }

  async function submit(nextEmail: string = email, nextPassword: string = password, nextPortal: string = portal) {
    setBusy(true)
    setError("")
    try {
      const signedIn = await login(nextEmail, nextPassword, nextPortal)
      navigate(signedIn.landing)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Email or password is incorrect")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <section className="l">
        <div className="brand-mark"><span className="orb" /> Supernova</div>
        <h1>Documents, leave and learning in one place.</h1>
        <p>Pick the portal you need. Employee Genie answers questions from the same live data that PeopleDesk and Learning Hub show you.</p>
        <div className="sample-bubble">
          {["Employee", "Manager", "HR"].map((name) => (
            <Avatar key={name} name={name} size={58} showPct={false} />
          ))}
          <span className="small">Your profile ring shows your performance score, visible to you, your manager and HR.</span>
        </div>
      </section>
      <section className="r">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <h2>Sign in</h2>
          <p className="muted small" style={{ margin: "6px 0 14px" }}>Choose where you want to sign in.</p>
          <div className="portals" role="radiogroup" aria-label="Portal">
            {PORTALS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={portal === item.id}
                className={portal === item.id ? "portal on" : "portal"}
                onClick={() => choose(item)}
              >
                <span className="pico" aria-hidden="true">{item.name[0]}</span>
                <span className="grow">
                  <b>{item.name}</b>
                  <span className="small muted" style={{ display: "block" }}>{item.blurb}</span>
                </span>
                <span className={portal === item.id ? "chip" : "chip optional"}>{item.who}</span>
              </button>
            ))}
          </div>
          {error ? <div className="form-error" role="alert">{error}</div> : null}
          {mail ? (
            <div className="card" role="status">
              <strong>{mail.subject}</strong>
              <p className="small">To: {mail.to}</p>
              <p>Your sign-in password is <b>{mail.password}</b></p>
              <button className="btn ghost" type="button" onClick={() => setPassword(mail.password)}>Use this password</button>
            </div>
          ) : null}
          <label className="field">
            <span>Work email</span>
            <input type="email" autoComplete="username" value={email} required onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={password} required onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="btn full" type="submit" disabled={busy}>Sign in to {current.name}</button>
          <button
            className="btn ghost full"
            type="button"
            disabled={busy || !email.trim()}
            onClick={() => {
              setBusy(true)
              setError("")
              void api<{ mail?: { to: string; subject: string; password: string } }>("/auth/forgot", {
                method: "POST",
                body: JSON.stringify({ email }),
              }).then((result) => {
                setMail(result.mail ?? null)
                if (!result.mail) setError("If that address is active, the sign-in mail was recorded.")
              }).catch((caught: unknown) => {
                setError(caught instanceof ApiError ? caught.message : "The sign-in mail could not be sent.")
              }).finally(() => setBusy(false))
            }}
          >
            Email me a sign-in password
          </button>
        </form>
      </section>
    </div>
  )
}
