import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayoutV2 } from "./components/AppLayoutV2";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  AnalyticsPage,
  CompanySettingsPage,
  CreateCustomerPage,
  CustomerDetailPage,
  CustomerReportPage,
  CustomersPage,
  DealerVerificationPage,
  DemoWizardPage,
  FlipbookPage,
  PrintReportPage,
  ReportV2Page,
  ReportV2PublicPage,
  InvitePage,
  LandingPage,
  LeadsPage,
  LoginPage,
  PlatformPage,
  ReportsPage,
  SettingsPage,
  SignupPage,
  SubscriptionPage,
  TeamPage,
  ViewReportPage,
} from "./pages";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" switchable>
        <Toaster />
        <Routes>
          {/* Public customer report — no layout chrome */}
          <Route path="/r/:shareToken" element={<CustomerReportPage />} />
          <Route path="/r/:shareToken/flipbook" element={<FlipbookPage />} />
          <Route path="/r/:shareToken/print" element={<PrintReportPage />} />
          <Route path="/r/:shareToken/v2" element={<ReportV2PublicPage />} />

          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
            <Route path="/coverage" element={<Navigate to="/#coverage" replace />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayoutV2 />}>
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/new" element={<CreateCustomerPage />} />
              <Route path="/customers/:reportId" element={<CustomerDetailPage />} />
              <Route path="/customers/:reportId/demo" element={<DemoWizardPage />} />
              <Route path="/dashboard" element={<Navigate to="/customers" replace />} />
              <Route path="/pipeline" element={<Navigate to="/customers" replace />} />
              <Route path="/generate" element={<Navigate to="/customers/new" replace />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:reportId" element={<ViewReportPage />} />
              <Route path="/reports/:reportId/flipbook" element={<FlipbookPage />} />
              <Route path="/reports/:reportId/v2" element={<ReportV2Page />} />
              <Route path="/verify" element={<DealerVerificationPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/company" element={<CompanySettingsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
