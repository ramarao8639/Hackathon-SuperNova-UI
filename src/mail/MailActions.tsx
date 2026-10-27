// AI-Generated: Mail actions
// Generated-Date: 2026-10-27
// Description: Preview, tone, mailto, Outlook, copy, and an .eml download. Genie does not send the mail.

import { useState } from "react"
import { api } from "../api/client"
import { useToast } from "../components/toast"
import { composeMail } from "./mailLinks"

export function MailActions({
  to,
  cc,
  subject,
  body,
  topic,
  ready = true,
}: {
  to: string[]
  cc: string[]
  subject: string
  body: string
  topic: string
  ready?: boolean
}) {
  const [tone, setTone] = useState("Friendly")
  const [show, setShow] = useState(false)
  const { toast } = useToast()
  const draft = composeMail({ to, cc, subject, body, tone })

  function note() {
    void api("/notifications/draft-log", { method: "POST", body: JSON.stringify({ topic, recipients: to.length + cc.length }) })
  }

  function eml() {
    const file = `To: ${to.join(", ")}\nCc: ${cc.join(", ")}\nSubject: ${subject}\n\n${draft.preview}`
    const blob = new Blob([file], { type: "message/rfc822" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "draft.eml"
    link.click()
    URL.revokeObjectURL(url)
    note()
  }

  return (
    <div>
      <label className="muted">
        Tone{" "}
        <select aria-label="Email tone" value={tone} onChange={(event) => setTone(event.target.value)}>
          <option>Friendly</option>
          <option>Formal</option>
          <option>Urgent</option>
        </select>
      </label>
      <button className="btn ghost sm" type="button" onClick={() => setShow(true)}>Preview</button>
      {show ? <pre className="muted">{draft.preview}</pre> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className="btn gold" href={ready && show ? draft.outlook : undefined} target="_blank" rel="noreferrer" onClick={(event) => { if (!ready || !show) event.preventDefault(); else note() }}>Open in Outlook</a>
        <a className="btn ghost" href={ready && show ? draft.mailto : undefined} onClick={(event) => { if (!ready || !show) event.preventDefault(); else note() }}>Open in mail</a>
        <button className="btn ghost" type="button" disabled={!ready} onClick={() => {
          void navigator.clipboard.writeText(draft.preview).then(() => toast(draft.truncated ? "Full text copied." : "Draft copied."), () => toast("Could not copy the draft."))
          note()
        }}>Copy</button>
        <button className="btn ghost" type="button" disabled={!ready || !show} onClick={eml}>Download .eml</button>
      </div>
    </div>
  )
}
