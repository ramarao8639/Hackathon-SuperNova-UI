// AI-Generated: API types for Employee Genie
// Generated-Date: 2026-10-26
// Description: Shapes returned by the FastAPI app

export type Role = "employee" | "manager" | "hr_admin" | "learning_admin" | "sys_admin"

export type User = {
  id: string
  employee_no: string
  name: string
  email: string
  role: Role
  is_manager: boolean
  manager_id: string | null
  grade: string
  grade_label: string
  designation: string
  branch: { id: string; name: string; city: string }
  department: { id: string; name: string }
  manager: { name: string; email: string } | null
}

export type DocItem = {
  document_id: string
  version_id: string
  title: string
  category: string
  version_no: string
  page_count: number
  mandatory: boolean
  effective_from: string
  ack_due_on: string | null
  overdue: boolean
  status: "pending" | "viewed" | "acknowledged"
  max_page_seen: number
  reached_end: boolean
  acknowledged_at: string | null
  first_viewed_at: string | null
}

export type DocList = {
  items: DocItem[]
  counts: { all: number; todo: number; done: number }
}

export type DocMeta = {
  document_id: string
  version_id: string
  title: string
  category: string
  version_no: string
  page_count: number
  mandatory: boolean
  status: string
  max_page_seen: number
  acknowledged_at: string | null
  ack_dwell_seconds: number
  can_acknowledge: boolean
}

export type Target = {
  target_type: "all" | "branch" | "department" | "group" | "user"
  target_id: string | null
  label?: string
}

export type AdminDoc = {
  document_id: string
  version_id: string
  title: string
  category: string
  version_no: string
  status: string
  processing_status: string
  effective_from: string
  ack_due_on: string | null
  mandatory: boolean
  page_count: number
  audience_summary: string
  audience_count: number
  acknowledged_count: number
  ack_percent: number
  targets: Target[]
}

export type Directory = {
  branches: { id: string; name: string; city: string; count: number }[]
  departments: { id: string; name: string; count: number }[]
  groups: { id: string; name: string; count: number }[]
  people: { id: string; name: string; email: string; employee_no: string; branch: string; department: string }[]
}

export type Preview = { count: number; preview: { name: string; employee_no: string; branch: string }[] }

export type Overview = {
  published_documents: number
  acknowledgement_rate: number
  overdue: number
  pending: number
  acknowledged: number
  needs_attention: {
    document_id: string
    version_id: string
    title: string
    due_on: string | null
    pending: number
    audience: number
    overdue: boolean
  }[]
  top_questions: { intent: string; label: string; count: number }[]
}

export type Tracking = {
  document_id: string
  version_id: string
  title: string
  version_no: string
  page_count: number
  rows: {
    user_id: string
    name: string
    employee_no: string
    branch: string
    department: string
    status: string
    max_page_seen: number
    page_count: number
    acknowledged_at: string | null
    first_viewed_at: string | null
  }[]
}

export type Template = {
  policy_key: string
  subject: string
  body: string
  to_list: string[]
  cc_list: string[]
  placeholders: string[]
  open_fields: { key: string; label: string }[]
}

export type Draft = {
  policy_key: string
  subject: string
  body: string
  to: string[]
  cc: string[]
  open_fields: { key: string; label: string }[]
}

export type Citation = {
  document_title: string
  version_id: string
  version_no: string
  page: number
  section_path: string
}

export type FeedItem = { id: string; title: string; detail: string; due_on: string }
export type CardBase = { id: string; title: string; state?: string; as_of?: string; message?: string }
