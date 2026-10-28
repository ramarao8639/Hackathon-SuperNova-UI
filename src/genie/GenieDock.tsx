// AI-Generated: Employee Genie chat
// Generated-Date: 2026-10-26
// Description: Streaming answers, source chips, and an email draft the employee sends

import { createContext, useContext, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router"
import { api, readCsrf } from "../api/client"
import type { Citation, Draft } from "../api/types"
import { useAuth } from "../auth/AuthProvider"
import { useToast } from "../components/toast"
import { MailActions } from "../mail/MailActions"

type PendingDoc = { title: string; version_id: string; due_on: string | null; mandatory: boolean }

type SpeechListener = {
  lang: string
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

// AI-Generated: Message id for pages that are not a secure browser context
// Generated-Date: 2026-10-28
function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export type ChatMessage = {
  id: string
  role: "user" | "genie"
  text: string
  citations: Citation[]
  documents: PendingDoc[]
  draft: Draft | null
  followUps: string[]
  freshness: string
  pending: boolean
  satisfaction: boolean
  askRating: boolean
  showSalary: boolean
  showWallet: boolean
  revealed: string
  steps: string[]
}

type GenieValue = {
  open: boolean
  setOpen: (open: boolean) => void
  messages: ChatMessage[]
  busy: boolean
  ask: (text: string) => void
  showSummary: (title: string, text: string) => void
  respond: (satisfied: boolean) => void
  rate: (score: number) => void
  reveal: (messageId: string, kind?: "salary" | "wallet") => void
}

const GenieContext = createContext<GenieValue | null>(null)

type Point = { x: number; y: number }

function panelOnScreen(point: Point | null): Point | null {
  if (!point || typeof window === "undefined") return point
  const width = Math.min(760, window.innerWidth - 28)
  if (point.x < 8 || point.y < 8) return null
  if (point.x + width > window.innerWidth - 8) return null
  if (point.y > window.innerHeight - 240) return null
  return point
}

function readPoint(key: string): Point | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Point
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed
  } catch {
    return null
  }
  return null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function emptyGenie(id: string): ChatMessage {
  return {
    id,
    role: "genie",
    text: "",
    citations: [],
    documents: [],
    draft: null,
    followUps: [],
    freshness: "",
    pending: true,
    satisfaction: false,
    askRating: false,
    showSalary: false,
    showWallet: false,
    revealed: "",
    steps: [],
  }
}

export function GenieProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const conversationId = useRef("")
  const { toast } = useToast()

  function setOpen(next: boolean) {
    if (!next && conversationId.current) {
      const id = conversationId.current
      void api<{ ask?: boolean }>(`/genie/conversations/${id}/end`, { method: "POST", body: JSON.stringify({ reason: "close" }) }).then((result) => {
        if (!result.ask) return
        setMessages((current) => current.map((message, index) => (
          index === current.length - 1 && message.role === "genie" ? { ...message, satisfaction: true } : message
        )))
      }).catch(() => undefined)
    }
    setOpenState(next)
  }

  useEffect(() => {
    if (!open || !conversationId.current) return
    const timer = window.setTimeout(() => {
      const id = conversationId.current
      if (!id) return
      void api(`/genie/conversations/${id}/end`, { method: "POST", body: JSON.stringify({ reason: "idle" }) }).then((result) => {
        const body = result as { ask?: boolean }
        if (body.ask) {
          setMessages((current) => current.map((message, index) => (
            index === current.length - 1 && message.role === "genie" ? { ...message, satisfaction: true } : message
          )))
        }
      }).catch(() => undefined)
    }, 5 * 60 * 1000)
    return () => window.clearTimeout(timer)
  }, [open, messages.length])

  async function ask(raw: string) {
    const text = raw.trim()
    if (!text || busy) return
    const userId = newId()
    const genieId = newId()
    setOpen(true)
    setBusy(true)
    setMessages((current) => [
      ...current,
      { ...emptyGenie(userId), role: "user", text, pending: false },
      emptyGenie(genieId),
    ])
    const patch = (update: (message: ChatMessage) => ChatMessage) => {
      setMessages((current) => current.map((message) => (message.id === genieId ? update(message) : message)))
    }
    try {
      const response = await fetch("/api/genie/chat", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": readCsrf(),
          ...(sessionStorage.getItem("supernova_access")
            ? { Authorization: `Bearer ${sessionStorage.getItem("supernova_access")}` }
            : {}),
        },
        body: JSON.stringify({ message: text, conversation_id: conversationId.current || null }),
      })
      if (!response.ok || !response.body) throw new Error("Genie could not answer")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const step = await reader.read()
        if (step.done) break
        buffer += decoder.decode(step.value, { stream: true })
        const frames = buffer.split("\n\n")
        buffer = frames.pop() ?? ""
        for (const frame of frames) {
          let event = "message"
          const dataLines: string[] = []
          for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim()
            if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
          }
          if (!dataLines.length) continue
          const data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>
          if (event === "step") patch((message) => ({ ...message, steps: [...message.steps, String(data.text ?? "")] }))
          if (event === "token") patch((message) => ({ ...message, text: message.text + String(data.text ?? "") }))
          if (event === "citation") patch((message) => ({ ...message, citations: [...message.citations, data as Citation] }))
          if (event === "documents") {
            const items = (data.items as PendingDoc[]) ?? []
            patch((message) => ({ ...message, documents: items }))
          }
          if (event === "draft") patch((message) => ({ ...message, draft: data as Draft }))
          if (event === "meta") {
            if (typeof data.conversation_id === "string") conversationId.current = data.conversation_id
            patch((message) => ({
              ...message,
              followUps: (data.follow_ups as string[]) ?? [],
              freshness: String(data.freshness ?? ""),
              satisfaction: Boolean(data.satisfaction),
              showSalary: Boolean(data.show_salary),
              showWallet: Boolean(data.show_wallet),
            }))
          }
        }
      }
      patch((message) => ({ ...message, pending: false }))
    } catch {
      toast("Genie could not answer just now.")
      patch((message) => ({ ...message, pending: false, text: message.text || "I could not answer that just now." }))
    } finally {
      setBusy(false)
    }
  }

  async function respond(satisfied: boolean) {
    const id = conversationId.current
    if (!id) return
    const result = await api<{ reply: string }>(`/genie/conversations/${id}/satisfaction`, {
      method: "POST",
      body: JSON.stringify({ satisfied }),
    })
    if (satisfied) {
      setMessages((current) => current.map((message) => ({ ...message, satisfaction: false, askRating: message.satisfaction })))
      return
    }
    conversationId.current = ""
    setMessages((current) => [
      ...current.map((message) => ({ ...message, satisfaction: false, askRating: false })),
      { ...emptyGenie(newId()), role: "genie", text: result.reply, pending: false },
    ])
  }

  async function rate(score: number) {
    const id = conversationId.current
    if (!id) return
    await api(`/genie/conversations/${id}/rating`, { method: "POST", body: JSON.stringify({ score }) })
    conversationId.current = ""
    setMessages((current) => [
      ...current.map((message) => ({ ...message, askRating: false })),
      { ...emptyGenie(newId()), role: "genie", text: "Thank you. Your rating was sent to HR.", pending: false },
    ])
  }

  function showSummary(title: string, text: string) {
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 5)
    setOpen(true)
    setMessages((current) => [
      ...current,
      {
        ...emptyGenie(newId()),
        role: "genie",
        text: `${title}\n${lines.map((line) => `• ${line}`).join("\n")}\nThe full policy is the source.`,
        pending: false,
        freshness: "AI summary",
      },
    ])
  }

  function reveal(messageId: string, kind: "salary" | "wallet" = "salary") {
    const path = kind === "wallet" ? "/genie/wallet/reveal" : "/genie/salary/reveal"
    void api<{ amount: number; seconds: number }>(path, { method: "POST" }).then((result) => {
      const shown = `₹${result.amount.toLocaleString("en-IN")}`
      setMessages((current) => current.map((message) => (message.id === messageId ? { ...message, revealed: shown } : message)))
      window.setTimeout(() => {
        setMessages((current) => current.map((message) => (message.id === messageId ? { ...message, revealed: "" } : message)))
      }, result.seconds * 1000)
    }).catch(() => toast("Salary could not be shown."))
  }

  return <GenieContext.Provider value={{ open, setOpen, messages, busy, ask, respond, rate, reveal, showSummary }}>{children}</GenieContext.Provider>
}

export function useGenie(): GenieValue {
  const value = useContext(GenieContext)
  if (!value) throw new Error("GenieProvider is missing")
  return value
}

export function GenieDock() {
  const { open, setOpen, messages, busy, ask, respond, rate, reveal } = useGenie()
  const { user } = useAuth()
  const location = useLocation()
  const viewer = location.pathname.includes("/view")
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const spoken = useRef<SpeechSynthesisUtterance | null>(null)
  const heard = useRef<{ stop: () => void } | null>(null)
  const { toast } = useToast()
  const [text, setText] = useState("")
  const [hello, setHello] = useState(() => localStorage.getItem("genie-hello") !== "1")
  const first = user?.name.split(" ")[0] ?? "there"
  const [fabPos, setFabPos] = useState<Point | null>(() => readPoint("genie-fab"))
  const [panelPos, setPanelPos] = useState<Point | null>(() => panelOnScreen(readPoint("genie-panel")))
  const drag = useRef<{ kind: "fab" | "panel"; dx: number; dy: number; moved: boolean; point: Point | null } | null>(null)
  const skipClick = useRef(false)

  function lastAnswer(): string {
    return [...messages].reverse().find((item) => item.role === "genie" && item.text)?.text ?? ""
  }

  function speak() {
    const speech = window.speechSynthesis
    const answer = lastAnswer()
    if (!speech || !answer) {
      toast("There is no answer to read yet.")
      return
    }
    speech.cancel()
    const utterance = new SpeechSynthesisUtterance(answer)
    utterance.lang = "en-IN"
    const voice = speech.getVoices().find((item) => item.lang.toLowerCase().startsWith("en"))
    if (voice) utterance.voice = voice
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    spoken.current = utterance
    setSpeaking(true)
    window.setTimeout(() => speech.speak(utterance), 80)
  }

  function stopSpeak() {
    window.speechSynthesis?.cancel()
    spoken.current = null
    setSpeaking(false)
  }

  function listen() {
    const browser = window as Window & { webkitSpeechRecognition?: new () => SpeechListener; SpeechRecognition?: new () => SpeechListener }
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition
    if (!Recognition) {
      toast("Listening works in Chrome or Edge.")
      return
    }
    const recognition = new Recognition()
    recognition.lang = "en-IN"
    recognition.onresult = (event) => setText(event.results[0][0].transcript)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      toast("Listening stopped.")
    }
    heard.current = recognition
    setListening(true)
    recognition.start()
  }

  function stopListen() {
    heard.current?.stop()
    setListening(false)
  }

  async function sendFeedback(helpful: boolean) {
    const question = [...messages].reverse().find((item) => item.role === "user")?.text ?? ""
    try {
      const result = await api<{ mailed_to: string }>("/genie/feedback", {
        method: "POST",
        body: JSON.stringify({ helpful, reason: helpful ? "Helpful" : "Not helpful", include_question: false, question }),
      })
      toast(`${helpful ? "Helpful" : "Not helpful"} note sent to ${result.mailed_to}`)
    } catch {
      toast("The note could not be sent.")
    }
  }

  function startDrag(kind: "fab" | "panel", event: ReactPointerEvent<HTMLElement>, host: HTMLElement) {
    if (event.button !== 0) return
    const rect = host.getBoundingClientRect()
    drag.current = { kind, dx: event.clientX - rect.left, dy: event.clientY - rect.top, moved: false, point: null }
    host.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const current = drag.current
    if (!current) return
    if (Math.abs(event.movementX) + Math.abs(event.movementY) > 3) current.moved = true
    const width = event.currentTarget.offsetWidth
    const height = event.currentTarget.offsetHeight
    const floor = viewer ? 92 : 8
    const next = {
      x: clamp(event.clientX - current.dx, 8, window.innerWidth - width - 8),
      y: clamp(event.clientY - current.dy, 8, window.innerHeight - height - floor),
    }
    current.point = next
    if (current.kind === "fab") setFabPos(next)
    else setPanelPos(next)
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const current = drag.current
    drag.current = null
    if (!current) return
    if (current.moved) {
      skipClick.current = true
      if (current.point) localStorage.setItem(current.kind === "fab" ? "genie-fab" : "genie-panel", JSON.stringify(current.point))
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <>
      <button
        className="genie-fab"
        type="button"
        aria-label="Ask Genie"
        title="Drag to move. Click to open."
        style={fabPos ? { left: fabPos.x, top: fabPos.y, right: "auto", bottom: "auto" } : undefined}
        onPointerDown={(event) => startDrag("fab", event, event.currentTarget)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onClick={() => {
          if (skipClick.current) {
            skipClick.current = false
            return
          }
          setHello(false)
          localStorage.setItem("genie-hello", "1")
          setOpen(!open)
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        </svg>
      </button>
      {hello && !open ? (
        <button
          className="genie-hello"
          type="button"
          onClick={() => {
            setHello(false)
            localStorage.setItem("genie-hello", "1")
            setOpen(true)
          }}
        >
          Hi {first}, I'm Employee Genie.
        </button>
      ) : null}
      {open ? (
        <aside
          className={`genie-panel${viewer ? " above-foot" : ""}`}
          aria-label="Employee Genie"
          style={panelPos ? { left: panelPos.x, top: panelPos.y, right: "auto", bottom: "auto" } : undefined}
          onPointerDown={(event) => {
            const target = event.target as HTMLElement
            if (!target.closest("header") || target.closest("button")) return
            startDrag("panel", event, event.currentTarget)
          }}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
        >
          <header>
            <div>
              <div className="mono">Employee Genie</div>
              <strong>Ask about your policies</strong>
            </div>
            <button className="btn ghost" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setOpen(false)}>
              Close
            </button>
          </header>
          <div className="genie-log">
            {messages.length === 0 ? (
              <div>
                <p>Hi {user?.name.split(" ")[0] ?? "there"}, I'm Employee Genie. What can I help you with today?</p>
              <div className="chips">
                {["I lost my ID card", "What do I need to acknowledge?", "Where is the leave policy?", "Can I take 3 days off next week?"].map(
                  (prompt) => (
                    <button key={prompt} className="chip" type="button" onClick={() => ask(prompt)}>
                      {prompt}
                    </button>
                  ),
                )}
              </div>
              </div>
            ) : null}
            {messages.map((message) => (
              <article key={message.id} className={`bubble ${message.role}`}>
                {message.steps.length ? <details><summary>How I got this</summary>{message.steps.map((step) => <p key={step}>{step}</p>)}</details> : null}
                {message.text}
                {message.pending && !message.text ? "…" : null}
                {message.revealed ? <div><b>{message.revealed}</b></div> : null}
                {(message.showSalary || message.showWallet) && !message.revealed ? (
                  <button className="btn ghost sm" type="button" onClick={() => reveal(message.id, message.showWallet ? "wallet" : "salary")}>Show amount</button>
                ) : null}
                {message.satisfaction ? (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn sm" type="button" onClick={() => void respond(true)}>Yes</button>
                    <button className="btn ghost sm" type="button" onClick={() => void respond(false)}>No</button>
                  </div>
                ) : null}
                {message.askRating ? (
                  <div className="row" style={{ marginTop: 8 }}>
                    <span>Rate Genie</span>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button key={score} className="btn ghost sm" type="button" onClick={() => void rate(score)}>{score}</button>
                    ))}
                  </div>
                ) : null}
                {message.citations.length ? (
                  <div className="chips">
                    {message.citations.map((citation) => (
                      <SourceChip key={`${citation.version_id}-${citation.page}`} citation={citation} />
                    ))}
                  </div>
                ) : null}
                {message.documents.length ? (
                  <div className="alert-list" style={{ marginTop: 8 }}>
                    {message.documents.map((item) => (
                      <DocButton key={item.version_id} item={item} />
                    ))}
                  </div>
                ) : null}
                {message.draft ? <DraftCard draft={message.draft} /> : null}
                {message.role === "genie" && !message.pending ? (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn ghost sm" type="button" onClick={() => void sendFeedback(true)}>Helpful</button>
                    <button className="btn ghost sm" type="button" onClick={() => void sendFeedback(false)}>Not helpful</button>
                  </div>
                ) : null}
                {message.freshness ? <div className="mono" style={{ marginTop: 8 }}>{message.freshness}</div> : null}
                {message.followUps.length ? (
                  <div className="chips">
                    {message.followUps.map((prompt) => (
                      <button key={prompt} className="follow-chip" type="button" onClick={() => ask(prompt)}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          <form
            style={{ display: "flex" }}
            onSubmit={(event) => {
              event.preventDefault()
              ask(text)
              setText("")
            }}
          >
            <input
              className="text-input"
              value={text}
              aria-label="Ask Genie"
              placeholder="Ask Genie"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  ask(text)
                  setText("")
                }
              }}
            />
            <button className="btn ghost" type="button" aria-label={speaking ? "Stop speaking" : "Speak"} onClick={speaking ? stopSpeak : speak}>
              {speaking ? "Stop" : "Speak"}
            </button>
            <button className="btn ghost" type="button" aria-label={listening ? "Stop listening" : "Listen"} onClick={listening ? stopListen : listen}>
              {listening ? "Stop" : "Listen"}
            </button>
            <button className="btn gold" type="submit" disabled={busy || !text.trim()}>
              Send
            </button>
          </form>
        </aside>
      ) : null}
    </>
  )
}

function SourceChip({ citation }: { citation: Citation }) {
  const navigate = useNavigate()
  const { setOpen } = useGenie()
  return (
    <button
      className="source-chip"
      type="button"
      onClick={() => {
        setOpen(false)
        navigate(`/genie/view/${citation.version_id}?page=${citation.page}`)
      }}
    >
      {citation.document_title} · {citation.section_path} · p.{citation.page}
    </button>
  )
}

function DocButton({ item }: { item: PendingDoc }) {
  const navigate = useNavigate()
  const { setOpen } = useGenie()
  return (
    <button
      className="quick-pick"
      type="button"
      onClick={() => {
        setOpen(false)
        navigate(`/genie/view/${item.version_id}`)
      }}
    >
      <span>
        <strong>{item.title}</strong>
        <small className="muted">{item.mandatory ? "Mandatory" : "Optional"}</small>
      </span>
      Open
    </button>
  )
}

function DraftCard({ draft }: { draft: Draft }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const ready = draft.open_fields.every((field) => (values[field.key] ?? "").trim().length > 0)
  const body = draft.body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`)
  const parts = draft.body.split(/(\{\{\s*[a-z_]+\s*\}\})/g)
  return (
    <div className="draft-card" style={{ marginTop: 10 }}>
      <div className="mono">Email draft · you send it</div>
      <p><strong>{draft.subject}</strong></p>
      <p className="muted">To {draft.to.join(", ") || "—"} · Cc {draft.cc.join(", ") || "—"}</p>
      <p>
        {parts.map((part, index) => {
          const match = part.match(/^\{\{\s*([a-z_]+)\s*\}\}$/)
          if (!match) return <span key={index}>{part}</span>
          const key = match[1]
          const field = draft.open_fields.find((item) => item.key === key)
          if (!field) return <span key={index}>{part}</span>
          return (
            <input
              key={key}
              className="fill-in"
              aria-label={field.label}
              placeholder={field.label}
              value={values[key] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
            />
          )
        })}
      </p>
      <MailActions to={draft.to} cc={draft.cc} subject={draft.subject} body={body} topic="genie draft" ready={ready} />
    </div>
  )
}
