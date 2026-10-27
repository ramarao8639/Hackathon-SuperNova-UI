// AI-Generated: Application routes
// Generated-Date: 2026-10-26
// Description: Employee Genie, PeopleDesk, and LearnHub routes

import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from "react-router"
import { AuthProvider } from "./auth/AuthProvider"
import { HomeRedirect, RequireAuth, RequireRole } from "./auth/guards"
import { ToastProvider } from "./components/toast"
import { GenieProvider } from "./genie/GenieDock"
import { Shell } from "./layout/Shell"
import { DocumentCenterPage } from "./pages/DocumentCenterPage"
import { AssignPage, CatalogPage, LearningPage, SchedulePage, TeamProgressPage, TranscriptPage } from "./pages/LearnPages"
import { CareerPage } from "./pages/CareerPage"
import { FinancesPage, PlumMockPage } from "./pages/FinancesPage"
import { LoginPage } from "./pages/LoginPage"
import {
  ApplyLeavePage,
  ApprovalsPage,
  DashboardPage,
  EmployeesPage,
  HolidaysPage,
  PayslipsPage,
  PerformancePage,
  RequestsPage,
  TeamPage,
} from "./pages/PeoplePages"
import { AttendancePage, JobsPage, OnboardingPage, OrgPage } from "./pages/PeoplePhase2"
import { UdemyPage } from "./pages/UdemyPage"
import { HrCockpitPage, ManagerCockpitPage, YearPage } from "./pages/WowPages"
import { PersonaPage } from "./pages/PersonaPage"
import { ProfilePage } from "./pages/ProfilePage"
import { MailboxPage, NotificationPrefsPage, NotificationsPage } from "./pages/NotificationPages"
import { HrHomePage, SysAdminPage } from "./pages/PortalHome"
import { ViewerPage } from "./pages/ViewerPage"
import { DocumentsPage, OverviewPage, PublishPage, TemplatesPage, TrackingPage } from "./pages/admin/AdminPages"

function ViewRedirect() {
  const { versionId } = useParams()
  const [params] = useSearchParams()
  const page = params.get("page")
  return <Navigate to={`/genie/view/${versionId ?? ""}${page ? `?page=${page}` : ""}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <GenieProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<Shell />}>
                  <Route index element={<HomeRedirect />} />
                  <Route path="/genie/persona" element={<PersonaPage />} />
                  <Route path="/genie/docs" element={<DocumentCenterPage />} />
                  <Route path="/genie/view/:versionId" element={<ViewerPage />} />
                  <Route element={<RequireRole role="sys_admin" />}>
                    <Route path="/genie/sysadmin" element={<SysAdminPage />} />
                    <Route path="/genie/mailbox" element={<MailboxPage />} />
                  </Route>
                  <Route element={<RequireRole role="hr_admin" />}>
                    <Route path="/hrms/hrhome" element={<HrHomePage />} />
                    <Route path="/hrms/hr-cockpit" element={<HrCockpitPage />} />
                    <Route path="/genie/admin" element={<OverviewPage />} />
                    <Route path="/genie/adocs" element={<DocumentsPage />} />
                    <Route path="/genie/publish" element={<PublishPage />} />
                    <Route path="/genie/track/:documentId" element={<TrackingPage />} />
                    <Route path="/genie/templates" element={<TemplatesPage />} />
                    <Route path="/hrms/employees" element={<EmployeesPage />} />
                  </Route>
                  <Route path="/hrms/profile" element={<ProfilePage />} />
                  <Route path="/hrms/dashboard" element={<DashboardPage />} />
                  <Route path="/hrms/apply" element={<ApplyLeavePage />} />
                  <Route path="/hrms/requests" element={<RequestsPage />} />
                  <Route path="/hrms/holidays" element={<HolidaysPage />} />
                  <Route path="/hrms/payslips" element={<PayslipsPage />} />
                  <Route path="/hrms/finances" element={<FinancesPage />} />
                  <Route path="/hrms/plum" element={<PlumMockPage />} />
                  <Route path="/hrms/performance" element={<PerformancePage />} />
                  <Route path="/hrms/career" element={<CareerPage />} />
                  <Route path="/hrms/year" element={<YearPage />} />
                  <Route path="/hrms/attendance" element={<AttendancePage />} />
                  <Route path="/hrms/jobs" element={<JobsPage />} />
                  <Route path="/hrms/org" element={<OrgPage />} />
                  <Route path="/hrms/onboarding" element={<OnboardingPage />} />
                  <Route path="/hrms/notifications" element={<NotificationsPage />} />
                  <Route path="/hrms/notification-prefs" element={<NotificationPrefsPage />} />
                  <Route element={<RequireRole roles={["manager", "hr_admin"]} />}>
                    <Route path="/hrms/approvals" element={<ApprovalsPage />} />
                    <Route path="/hrms/cockpit" element={<ManagerCockpitPage />} />
                    <Route path="/hrms/team" element={<TeamPage />} />
                  </Route>
                  <Route path="/lms/learning" element={<LearningPage />} />
                  <Route path="/lms/catalog" element={<CatalogPage />} />
                  <Route path="/lms/schedule" element={<SchedulePage />} />
                  <Route path="/lms/transcript" element={<TranscriptPage />} />
                  <Route path="/lms/udemy" element={<UdemyPage />} />
                  <Route element={<RequireRole roles={["manager", "hr_admin"]} />}>
                    <Route path="/lms/teamprog" element={<TeamProgressPage />} />
                    <Route path="/lms/assign" element={<AssignPage />} />
                  </Route>
                  <Route path="/persona" element={<Navigate to="/genie/persona" replace />} />
                  <Route path="/documents" element={<Navigate to="/genie/docs" replace />} />
                  <Route path="/documents/:versionId/view" element={<ViewRedirect />} />
                  <Route path="/admin" element={<Navigate to="/genie/admin" replace />} />
                  <Route path="/admin/documents" element={<Navigate to="/genie/adocs" replace />} />
                  <Route path="/admin/documents/new" element={<Navigate to="/genie/publish" replace />} />
                  <Route path="/admin/templates" element={<Navigate to="/genie/templates" replace />} />
                </Route>
              </Route>
              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </GenieProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
