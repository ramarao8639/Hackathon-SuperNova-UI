// AI-Generated: Mail actions
// Generated-Date: 2026-10-27
// Description: Preview, tone, mailto, Outlook, copy, and an .eml download. Genie does not send the mail.

import { useState } from "react"
import { api } from "../api/client"
import { useToast } from "../components/toast"
import { composeMail, copyText, DEFAULT_MAIL } from "./mailLinks"

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
  const recipients = to.length ? to : [DEFAULT_MAIL]
  const draft = composeMail({ to: recipients, cc, subject, body, tone })

  function note() {
    void api("/notifications/draft-log", { method: "POST", body: JSON.stringify({ topic, recipients: recipients.length + cc.length }) })
  }

  function openOutlook() {
    note()
    window.location.href = draft.mailto
  }

  function eml() {
    const file = `To: ${recipients.join(", ")}\nCc: ${cc.join(", ")}\nSubject: ${subject}\n\n${draft.preview}`
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
        <button className="btn gold" type="button" onClick={openOutlook}>Open in Outlook</button>
        <button className="btn ghost" type="button" onClick={() => {
          void copyText(draft.preview).then(() => toast(draft.truncated ? "Full text copied." : "Draft copied."), () => toast("Could not copy the draft."))
          note()
        }}>Copy</button>
        <button className="btn ghost" type="button" disabled={!ready || !show} onClick={eml}>Download .eml</button>
      </div>
    </div>
  )
}
