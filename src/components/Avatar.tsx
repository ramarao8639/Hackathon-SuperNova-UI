// AI-Modified: Rebuilt as the prototype's conic-gradient ring avatar
// Modified-Date: 2026-10-27
// Description: Renders the same .pav markup (ring + initials + percent badge) as the HTML prototype

import type { CSSProperties } from "react"
import { initials } from "../format"

type ReviewStatus = "published" | "none" | null

type AvatarProps = {
  name: string
  pct?: number | null
  reviewStatus?: ReviewStatus
  size?: number
  showPct?: boolean
  photoUrl?: string | null
}

function ringKind(pct: number | null | undefined, reviewStatus: ReviewStatus): "good" | "mid" | "low" | "none" | "plain" {
  if (reviewStatus === "none") return "none"
  if (pct == null) return "plain"
  if (pct >= 80) return "good"
  if (pct >= 65) return "mid"
  return "low"
}

export function Avatar({ name, pct = null, reviewStatus = null, size = 40, showPct = false, photoUrl = null }: AvatarProps) {
  const kind = ringKind(pct, reviewStatus)
  const value = kind === "none" || kind === "plain" ? 0 : (pct ?? 0)
  const title = kind === "none" ? "No review yet" : pct == null ? name : `${name}, ${pct}%`
  const style = { "--v": value, "--s": `${size}px` } as CSSProperties
  return (
    <span className={`pav${kind === "mid" || kind === "low" || kind === "none" ? ` ${kind}` : ""}`} style={style} title={title} role="img" aria-label={title}>
      <i style={{ fontSize: Math.max(11, size * 0.3) }}>
        {photoUrl ? <img src={photoUrl} alt="" /> : initials(name)}
      </i>
      {showPct && pct != null ? <b>{pct}%</b> : null}
    </span>
  )
}
