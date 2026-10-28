// AI-Modified: Rebuilt to match the HTML prototype's top bar + grouped rail
// Modified-Date: 2026-10-27
// Description: Sticky .top header (logo, app switch, avatar) and .rail with <h5> grouped .ritem nav

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { api } from "../api/client"
import type { DocList } from "../api/types"
import { useAuth } from "../auth/AuthProvider"
import { Avatar } from "../components/Avatar"
import { Icon } from "../components/Icon"
import { GenieDock } from "../genie/GenieDock"

const SECTIONS = [
  ["where-you-stand", "Where you stand"],
  ["journey", "Your journey"],
  ["leave", "Leave"],
  ["learning", "Learning"],
  ["career", "Career and performance"],
  ["pay", "Pay and benefits"],
]

const APPS: Array<["genie" | "hrms" | "lms", string, string]> = [
  ["genie", "Employee Genie", "/genie/persona"],
  ["hrms", "PeopleDesk", "/hrms/dashboard"],
  ["lms", "LearnHub", "/lms/learning"],
]

type NavItem = { to: string; label: string; icon: string; badge?: number; badgeWarn?: boolean }
type NavGroup = { title: string; items: NavItem[] }

export function Shell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") ?? "light")
  const [pop, setPop] = useState<"mail" | "bell" | null>(null)
  const [finder, setFinder] = useState("")
  const [finderOpen, setFinderOpen] = useState(false)
  const [active, setActive] = useState("where-you-stand")
  const viewer = location.pathname.includes("/view")
  const persona = location.pathname.startsWith("/genie/persona") || location.pathname.startsWith("/persona")
  const app = location.pathname.startsWith("/hrms") ? "hrms" : location.pathname.startsWith("/lms") ? "lms" : "genie"
  const permissions = useQuery({
    queryKey: ["permissions", user?.id],
    enabled: Boolean(user),
    queryFn: () => api<{ menus: Record<string, { group: string; id: string; label: string; to: string; icon: string }[]> }>("/me/permissions"),
  })
  const docs = useQuery({
    queryKey: ["documents", "all"],
    queryFn: () => api<DocList>("/me/documents?tab=all"),
  })
  const badge = docs.data?.counts.todo ?? 0
  const notices = useQuery({
    queryKey: ["notices", "bell", user?.id],
    enabled: Boolean(user),
    refetchInterval: 30000,
    queryFn: () => api<{ unread: number; items: Array<{ id: string; title: string }> }>("/notifications"),
  })
  const summary = useQuery({
    queryKey: ["summary", user?.id],
    enabled: Boolean(user),
    queryFn: () => api<{ performance_pct: number | null; review_status: "published" | "none" | null }>(`/hris/employees/${user?.id}/summary`),
  })

  const found = useQuery({
    queryKey: ["search", finder],
    enabled: finderOpen && finder.trim().length >= 2,
    queryFn: () => api<{ items: { kind: string; title: string; to: string }[] }>(`/me/search?q=${encodeURIComponent(finder.trim())}`),
  })

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setFinderOpen(true)
      }
      if (event.key === "Escape") setFinderOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    if (!persona) return
    const nodes = SECTIONS.map(([id]) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.2, 0.6] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [persona, location.pathname])

  if (!user) return null
  if (viewer) {
    return (
      <div className={app === "lms" ? "shell viewer-mode lms" : "shell viewer-mode"}>
        <Outlet />
        <GenieDock />
      </div>
    )
  }

  const admin = user.role === "hr_admin"
  const sysAdmin = user.role === "sys_admin"
  const menuKey = app === "lms" ? "learning" : app
  const serverRows = permissions.data?.menus[menuKey]

  const groups: NavGroup[] = []
  if (serverRows) {
    const grouped = new Map<string, NavItem[]>()
    for (const row of serverRows) {
      const items = grouped.get(row.group) ?? []
      items.push({
        to: row.to,
        label: row.label,
        icon: row.icon,
        badge: row.id === "documents" && badge > 0 ? badge : undefined,
      })
      grouped.set(row.group, items)
    }
    groups.push(...[...grouped.entries()].map(([title, items]) => ({ title, items })))
  } else if (app === "genie") {
    const items: NavItem[] = [{ to: "/genie/persona", label: "Employee persona", icon: "home" }]
    if (!sysAdmin) {
      items.push({ to: "/genie/docs", label: "Document center", icon: "file", badge: badge > 0 ? badge : undefined })
    }
    groups.push({ title: "", items })
    if (admin || sysAdmin) {
      groups.push({
        title: "Admin",
        items: [
          ...(admin ? [
            { to: "/genie/admin", label: "Overview", icon: "chart" },
            { to: "/genie/adocs", label: "Documents", icon: "list" },
            { to: "/genie/publish", label: "Publish a document", icon: "up" },
            { to: "/genie/templates", label: "Email templates", icon: "mail" },
          ] : []),
          ...(sysAdmin ? [{ to: "/genie/sysadmin", label: "System admin", icon: "shield" }] : []),
        ],
      })
    }
  } else if (app === "hrms") {
    const items: NavItem[] = []
    if (admin) items.push({ to: "/hrms/hrhome", label: "HR home", icon: "shield" })
    items.push(
      { to: "/hrms/dashboard", label: "Dashboard", icon: "home" },
      { to: "/hrms/profile", label: "My profile", icon: "users" },
      { to: "/hrms/apply", label: "Apply leave", icon: "plus" },
      { to: "/hrms/requests", label: "My requests", icon: "list" },
      { to: "/hrms/holidays", label: "Holidays", icon: "cal" },
    )
    if (!sysAdmin) items.push({ to: "/hrms/payslips", label: "Payslips", icon: "wallet" }, { to: "/hrms/performance", label: "Performance", icon: "target" }, { to: "/hrms/career", label: "Career journey", icon: "award" })
    if (user.is_manager || admin) items.push({ to: "/hrms/approvals", label: "Approvals", icon: "check" }, { to: "/hrms/team", label: "Team calendar", icon: "users" })
    if (admin) items.push({ to: "/hrms/employees", label: "Employees", icon: "users" })
    groups.push({ title: "", items })
  } else {
    groups.push({
      title: "",
      items: [
        { to: "/lms/learning", label: "My learning", icon: "book" },
        { to: "/lms/catalog", label: "Catalog", icon: "list" },
        { to: "/lms/schedule", label: "Scheduled learning", icon: "clock" },
        { to: "/lms/transcript", label: "Transcript", icon: "award" },
      ],
    })
    if (user.is_manager || admin) {
      groups.push({
        title: "Team",
        items: [
          { to: "/lms/teamprog", label: "Team progress", icon: "users" },
          { to: "/lms/assign", label: "Assign a programme", icon: "plus" },
        ],
      })
    }
  }

  return (
    <div className={app === "lms" ? "shell lms" : "shell"}>
      <header className="top">
        <Link className="logo" to={app === "hrms" ? "/hrms/dashboard" : app === "lms" ? "/lms/learning" : "/genie/persona"}>
          <i aria-hidden="true"><Icon name="leaf" size={16} /></i>
          <span>Supernova</span>
        </Link>
        <nav className="switch" aria-label="Apps">
          {APPS.map(([id, label, to]) => (
            <NavLink key={id} to={to} className={() => (app === id ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="grow" />
        <button className="btn ghost sm" type="button" onClick={() => setFinderOpen(true)}>Search</button>
        <div style={{ position: "relative" }}>
          <button className="iconbtn" type="button" aria-label="Dev inbox and events" title="Dev inbox and events" onClick={() => setPop(pop === "mail" ? null : "mail")}>
            <Icon name="mail" />
          </button>
          {pop === "mail" ? <div className="pop"><h4>Emails</h4><div className="empty small">No emails yet.</div></div> : null}
        </div>
        <div style={{ position: "relative" }}>
          <button className="iconbtn" type="button" aria-label="Notifications" onClick={() => setPop(pop === "bell" ? null : "bell")}>
            <Icon name="bell" />
            {notices.data && notices.data.unread > 0 ? <span className="badge">{notices.data.unread}</span> : null}
          </button>
          {pop === "bell" ? (
            <div className="pop">
              <h4>Notifications</h4>
              {(notices.data?.items ?? []).slice(0, 5).map((item) => <p key={item.id}>{item.title}</p>)}
              {(notices.data?.items.length ?? 0) === 0 ? <div className="empty small">Nothing new.</div> : null}
              <Link to="/hrms/notifications">Open the center</Link>
            </div>
          ) : null}
        </div>
        <div className="who">
          <Link to="/hrms/profile" aria-label={`${user.name} profile`} style={{ display: "flex" }}>
            <Avatar name={user.name} pct={summary.data?.performance_pct} reviewStatus={summary.data?.review_status} size={42} />
          </Link>
          <div className="who-name">
            <strong>{user.name}</strong>
            <div className="tiny muted">{user.email}</div>
          </div>
          <button className="btn ghost sm" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "Light mode" : "Dark mode"}</button>
          <button className="btn ghost sm" type="button" onClick={() => void logout().then(() => navigate("/"))}>Sign out</button>
        </div>
      </header>
      {finderOpen ? (
        <div className="pop" style={{ position: "fixed", top: 68, right: 16, zIndex: 60, width: 320 }} role="dialog" aria-label="Search">
          <input aria-label="Search pages and documents" value={finder} onChange={(event) => setFinder(event.target.value)} placeholder="Search" autoFocus />
          {(found.data?.items ?? []).map((item) => (
            <Link key={`${item.kind}-${item.to}-${item.title}`} to={item.to} onClick={() => setFinderOpen(false)}>{item.title}</Link>
          ))}
        </div>
      ) : null}
      <div className="shell-body">
        <aside className="rail">
          <div className="profile">
            <Avatar name={user.name} pct={summary.data?.performance_pct} reviewStatus={summary.data?.review_status} size={54} showPct />
            <div>
              <b>{user.name}</b>
              <div className="tiny muted">{user.designation}</div>
            </div>
          </div>
          {groups.map((group) => (
            <div key={group.title || "main"}>
              {group.title ? <h5>{group.title}</h5> : null}
              {group.items.map((item) => (
                <div key={item.to}>
                  <NavLink className={({ isActive }) => `ritem${isActive ? " active" : ""}`} to={item.to} end={item.to === "/genie/admin"}>
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                    {item.badge ? <span className={`badge${item.badgeWarn ? " warn" : ""}`}>{item.badge}</span> : null}
                  </NavLink>
                  {persona && item.to === "/genie/persona" && location.pathname.startsWith("/genie/persona") ? (
                    <div className="sub">
                      {SECTIONS.map(([id, label]) => (
                        <a
                          key={id}
                          className={active === id ? "active" : ""}
                          href={`#${id}`}
                          onClick={(event) => {
                            event.preventDefault()
                            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                          }}
                        >
                          {label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </aside>
        <main className="main">
          <Outlet />
        </main>
      </div>
      <GenieDock />
    </div>
  )
}
