// AI-Generated: Small display helpers
// Generated-Date: 2026-10-26
// Description: Count-up numerals and a freshness label

import { useEffect, useState } from "react"

export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700)
      const eased = 1 - (1 - progress) ** 3
      setShown(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{decimals ? shown.toFixed(decimals) : Math.round(shown)}</>
}

export function asOf(iso?: string): string {
  if (!iso) return "Updated just now"
  const then = new Date(iso).getTime()
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (minutes < 2) return "as of just now"
  if (minutes < 60) return `as of ${minutes} min ago`
  return `as of ${Math.round(minutes / 60)} h ago`
}
