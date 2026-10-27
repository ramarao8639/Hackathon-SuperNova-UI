// AI-Generated: Mail compose links
// Generated-Date: 2026-10-27
// Description: Builds mailto and Outlook links. A long body is truncated and the full text is copied.

const TONES: Record<string, string> = {
  Friendly: "Hello,\n\n",
  Formal: "Hello,\n\nI am writing to ask for your help.\n\n",
  Urgent: "Hello,\n\nThis needs attention today.\n\n",
}

export type MailDraft = {
  to: string[]
  cc: string[]
  subject: string
  body: string
  tone: string
}

export function composeMail(draft: MailDraft) {
  const text = `${TONES[draft.tone] ?? TONES.Friendly}${draft.body}`.trim()
  let encodedBody = encodeURIComponent(text)
  const encodedSubject = encodeURIComponent(draft.subject)
  const encodedCc = encodeURIComponent(draft.cc.join(";"))
  const encodedTo = encodeURIComponent(draft.to.join(","))
  let mailto = `mailto:${draft.to.join(",")}?cc=${encodedCc}&subject=${encodedSubject}&body=${encodedBody}`
  let truncated = false
  if (mailto.length > 1800) {
    const room = Math.max(1800 - (mailto.length - encodedBody.length), 0)
    encodedBody = encodedBody.slice(0, room)
    mailto = `mailto:${draft.to.join(",")}?cc=${encodedCc}&subject=${encodedSubject}&body=${encodedBody}`
    truncated = true
  }
  const outlook = `https://outlook.office.com/mail/deeplink/compose?to=${encodedTo}&cc=${encodedCc}&subject=${encodedSubject}&body=${encodedBody}`
  return { mailto, outlook, truncated, preview: text }
}
