// AI-Generated: Date and number formatting
// Generated-Date: 2026-10-26
// Description: Relative due dates and Indian currency formatting

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function duePhrase(iso: string | null | undefined): string {
  if (!iso) return ""
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"}`
  if (diff === 0) return "Due today"
  return `Due in ${diff} day${diff === 1 ? "" : "s"}`
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function inr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
}
