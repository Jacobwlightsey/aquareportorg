import { Navigate, Route, Routes } from "react-router-dom";
import PillarPage from "./pages/PillarPage";
import { AdminPage } from "./pages/AdminPage";
import { DemoAnalyticsPage } from "./pages/DemoAnalyticsPage";
import { AppLayoutV2 } from "./components/AppLayoutV2";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  AnalyticsPage,
  BlogPage,
  BlogArticlePage,
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

// New pages
import { DashboardPage } from "./pages/DashboardPage";
import { PipelinePage } from "./pages/PipelinePage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { ProposalsPage } from "./pages/ProposalsPage";
import { CommissionsPage } from "./pages/CommissionsPage";
import { RetentionPage } from "./pages/RetentionPage";
import { FollowUpsPage } from "./pages/FollowUpsPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { TerritoryMapPage } from "./pages/TerritoryMapPage";
import { MarketingPage } from "./pages/MarketingPage";
import { TrainingPage } from "./pages/TrainingPage";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Toaster />
        <Routes>
          {/* Public customer report — no layout chrome */}
          <Route path="/r/:shareToken" element={<CustomerReportPage />} />
          <Route path="/r/:shareToken/flipbook" element={<FlipbookPage />} />
          <Route path="/r/:shareToken/print" element={<PrintReportPage />} />
          <Route path="/r/:shareToken/v2" element={<ReportV2PublicPage />} />

          {/* Blog — own layout, public */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />

          {/* Pillar pages — top-level SEO authority pages */}
          <Route path="/water-treatment-dealer-software" element={<PillarPage />} />
          <Route path="/water-quality-report-software" element={<PillarPage />} />
          <Route path="/digital-water-test-reports" element={<PillarPage />} />
          <Route path="/water-testing-software-for-dealers" element={<PillarPage />} />

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
              {/* Pipeline / Core */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/pipeline/:dealId" element={<PipelinePage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/new" element={<CreateCustomerPage />} />
              <Route path="/customers/:reportId" element={<CustomerDetailPage />} />
              <Route path="/customers/:reportId/demo" element={<DemoWizardPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />

              {/* Sales */}
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/demo-analytics" element={<DemoAnalyticsPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/commissions" element={<CommissionsPage />} />

              {/* Retention */}
              <Route path="/retention" element={<RetentionPage />} />
              <Route path="/follow-ups" element={<FollowUpsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />

              {/* Intelligence */}
              <Route path="/territory-map" element={<TerritoryMapPage />} />
              <Route path="/marketing" element={<MarketingPage />} />
              <Route path="/training" element={<TrainingPage />} />

              {/* Reports */}
              <Route path="/generate" element={<Navigate to="/customers/new" replace />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/:reportId" element={<ViewReportPage />} />
              <Route path="/reports/:reportId/flipbook" element={<FlipbookPage />} />
              <Route path="/reports/:reportId/v2" element={<ReportV2Page />} />

              {/* Settings & admin */}
              <Route path="/verify" element={<DealerVerificationPage />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/admin" element={<AdminPage />} />
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
