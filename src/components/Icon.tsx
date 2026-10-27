// AI-Generated: Prototype icon set
// Generated-Date: 2026-10-27
// Description: The same stroke icons the HTML prototype draws in the rail, header, and feed

const PATHS: Record<string, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  leaf: "M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  check: "M5 12l5 5 9-10",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5",
  file: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M18 14c2 .5 3 2.4 3 5",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  wallet: "M3 7h17v13H3zM3 7l3-3h12v3M16 13h2",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  bell: "M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4",
  mail: "M3 6h18v13H3zM3 7l9 7 9-7",
  spark: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  plus: "M12 5v14M5 12h14",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14.5L7 21l5-2.5L17 21l-1.5-6.5",
  up: "M12 19V5M6 11l6-6 6 6",
}

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.spark} />
    </svg>
  )
}
