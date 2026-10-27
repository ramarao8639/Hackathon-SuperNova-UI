// AI-Generated: Read-only document viewer
// Generated-Date: 2026-10-26
// Description: Page images only, with a watermark from the server and a dwell check before acknowledgement

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router"
import { api, ApiError } from "../api/client"
import type { DocMeta } from "../api/types"
import { useToast } from "../components/toast"
import { formatWhen } from "../format"
import { useGenie } from "../genie/GenieDock"

export function ViewerPage() {
  const { versionId = "" } = useParams()
  const [params] = useSearchParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const scroller = useRef<HTMLDivElement>(null)
  const ratios = useRef(new Map<number, number>())
  const [current, setCurrent] = useState(1)
  const [maxPage, setMaxPage] = useState(0)
  const [lastVisible, setLastVisible] = useState(false)
  const [dwellReady, setDwellReady] = useState(false)
  const [checked, setChecked] = useState(false)
  const [doneAt, setDoneAt] = useState<string | null>(null)
  const { ask, busy } = useGenie()
  const meta = useQuery({
    queryKey: ["document", versionId],
    queryFn: () => api<DocMeta>(`/documents/${versionId}`),
    retry: false,
  })

  const progress = useMutation({
    mutationFn: (body: { page: number; last_page_visible: boolean }) =>
      api<{ dwell_ready: boolean }>(`/documents/${versionId}/progress`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  })

  const acknowledge = useMutation({
    mutationFn: () => api<{ acknowledged_at: string }>(`/documents/${versionId}/acknowledge`, { method: "POST" }),
    onSuccess: async (result) => {
      setDoneAt(result.acknowledged_at)
      await queryClient.invalidateQueries({ queryKey: ["documents"] })
      await queryClient.invalidateQueries({ queryKey: ["document", versionId] })
    },
    onError: (error) => {
      if (error instanceof ApiError) toast(error.message)
    },
  })

  useEffect(() => {
    document.body.classList.add("print-blocked")
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest(".summary-panel")) return
      if ((event.ctrlKey || event.metaKey) && ["s", "p", "c"].includes(event.key.toLowerCase())) {
        event.preventDefault()
        toast("Downloading, printing, and copying are turned off for this document.")
      }
    }
    const block = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target?.closest(".summary-panel")) return
      event.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("contextmenu", block)
    window.addEventListener("copy", block)
    window.addEventListener("dragstart", block)
    return () => {
      document.body.classList.remove("print-blocked")
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("contextmenu", block)
      window.removeEventListener("copy", block)
      window.removeEventListener("dragstart", block)
    }
  }, [toast])

  useEffect(() => {
    if (!meta.data) return
    setMaxPage(meta.data.max_page_seen)
    if (meta.data.acknowledged_at) setDoneAt(meta.data.acknowledged_at)
    const requested = Number(params.get("page") || "1")
    window.setTimeout(() => document.getElementById(`page-${requested}`)?.scrollIntoView({ block: "start" }), 50)
  }, [meta.data, params])

  useEffect(() => {
    const root = scroller.current
    if (!root || !meta.data) return
    const total = meta.data.page_count
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = Number((entry.target as HTMLElement).dataset.page)
          ratios.current.set(page, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        let bestPage = 1
        let bestRatio = 0
        let furthest = 0
        let endVisible = false
        for (const [page, ratio] of ratios.current) {
          if (ratio >= 0.5) {
            furthest = Math.max(furthest, page)
            if (ratio > bestRatio) {
              bestRatio = ratio
              bestPage = page
            }
            if (page === total) endVisible = true
          }
        }
        if (bestRatio > 0) setCurrent(bestPage)
        if (furthest) setMaxPage((value) => Math.max(value, furthest))
        setLastVisible(endVisible)
      },
      { root, threshold: [0.5, 0.75] },
    )
    root.querySelectorAll("[data-page]").forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [meta.data])

  useEffect(() => {
    if (!meta.data || meta.data.status === "acknowledged") return
    if (!lastVisible) {
      setDwellReady(false)
      progress.mutate({ page: Math.max(current, 1), last_page_visible: false })
      return
    }
    progress.mutate({ page: meta.data.page_count, last_page_visible: true })
    const wait = (meta.data.ack_dwell_seconds + 0.35) * 1000
    const timer = window.setTimeout(() => {
      progress.mutate(
        { page: meta.data?.page_count ?? 1, last_page_visible: true },
        { onSuccess: (result) => setDwellReady(result.dwell_ready) },
      )
    }, wait)
    return () => window.clearTimeout(timer)
    // current is read when the last page leaves view; including it resets the dwell timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastVisible, meta.data?.version_id, meta.data?.ack_dwell_seconds, meta.data?.status])

  if (meta.isPending) return <div className="viewer"><div className="viewer-head">Loading document…</div></div>
  if (meta.error instanceof ApiError && meta.error.status === 403) {
    return (
      <div className="forbidden">
        <h1>You don't have this document</h1>
        <p>It is not shared with you. Ask HR if you think that is a mistake.</p>
        <Link className="btn" to="/genie/docs">Back to documents</Link>
      </div>
    )
  }
  if (!meta.data) {
    return (
      <div className="forbidden">
        <h1>Document unavailable</h1>
        <button className="btn" type="button" onClick={() => void meta.refetch()}>Retry</button>
      </div>
    )
  }

  const data = meta.data
  const pages = Array.from({ length: data.page_count }, (_, index) => index + 1)
  const progressWidth = `${Math.min(100, (maxPage / Math.max(data.page_count, 1)) * 100)}%`
  const acknowledged = Boolean(doneAt)
  let hint = "Scroll until the last page stays open."
  if (lastVisible && !dwellReady) hint = "Keep the last page open for a few seconds."
  if (dwellReady && !checked) hint = "Tick the box to confirm you have read it."
  if (dwellReady && checked) hint = "You can acknowledge this document."

  return (
    <div className="viewer" onContextMenu={(event) => event.preventDefault()}>
      <header className="viewer-head">
        <div>
          <Link to="/genie/docs">Back</Link>
          <h1 style={{ margin: "4px 0", fontSize: 22 }}>{data.title}</h1>
          <div className="mono">v{data.version_no} · {data.category}</div>
        </div>
        <div className="row">
          <div>Page {current} of {data.page_count}</div>
        </div>
      </header>
      <div className="viewer-progress" aria-hidden="true"><span style={{ width: progressWidth }} /></div>
      <div className="viewer-body">
        <div className="thumbs">
          {pages.map((page) => (
            <button key={page} className={page === current ? "on" : ""} type="button" onClick={() => document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth" })}>
              <img alt="" src={`/api/documents/${versionId}/pages/${page}`} />
            </button>
          ))}
        </div>
        <div className="pages" ref={scroller}>
          {pages.map((page) => (
            <article key={page} id={`page-${page}`} className="page-frame" data-page={page}>
              <img alt={`Page ${page} of ${data.title}`} src={`/api/documents/${versionId}/pages/${page}`} draggable={false} />
            </article>
          ))}
        </div>
      </div>
      <footer className="viewer-foot">
        {acknowledged ? (
          <>
            <div>Acknowledged {formatWhen(doneAt)}</div>
            <button className="btn" type="button" disabled={busy} onClick={() => void ask(`Summarize the policy "${data.title}" in clear steps.`)}>
              {busy ? "Summarizing…" : "Summarize"}
            </button>
          </>
        ) : (
          <>
            <label>
              <input className="check" type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
              I have read and understood this document
            </label>
            <div className="ack-side">
              <span className="ack-hint">{hint}</span>
              <button className="btn" type="button" disabled={busy} onClick={() => void ask(`Summarize the policy "${data.title}" in clear steps.`)}>
                {busy ? "Summarizing…" : "Summarize"}
              </button>
              <button className="btn gold" type="button" disabled={!dwellReady || !checked || acknowledge.isPending} onClick={() => acknowledge.mutate()}>
                Acknowledge
              </button>
            </div>
          </>
        )}
      </footer>
    </div>
  )
}
