import { lazy, Suspense } from "react";
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
import { TrialGate } from "./components/TrialGate";
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
import { SpouseReviewPage } from "./pages/SpouseReviewPage";
import { DemoPreviewPage } from "./pages/DemoPreviewPage";
// Lazy-load SEO/content pages to keep the main bundle small (~950KB blogData.ts)
const BlogPage = lazy(() => import("./pages/BlogPage").then((m) => ({ default: m.BlogPage })));
const BlogArticlePage = lazy(() => import("./pages/BlogArticlePage").then((m) => ({ default: m.BlogArticlePage })));
const AuthorPage = lazy(() => import("./pages/AuthorPage").then((m) => ({ default: m.AuthorPage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const CityWaterPage = lazy(() => import("./pages/CityWaterPage").then((m) => ({ default: m.CityWaterPage })));
const WaterQualityIndexPage = lazy(() => import("./pages/WaterQualityIndexPage").then((m) => ({ default: m.WaterQualityIndexPage })));
const LearnHubPage = lazy(() => import("./pages/LearnHubPage").then((m) => ({ default: m.LearnHubPage })));
const AttributionPage = lazy(() => import("./pages/AttributionPage").then((m) => ({ default: m.AttributionPage })));
const AudiencePage = lazy(() => import("./pages/AudiencePage").then((m) => ({ default: m.AudiencePage })));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Toaster />
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" /></div>}>
        <Routes>
          {/* Demo preview — rendered inside setup wizard iframe */}
          <Route path="/demo/preview" element={<DemoPreviewPage />} />

          {/* Sprint 4A: Spouse review — public, no auth */}
          <Route path="/review/:token" element={<SpouseReviewPage />} />

          {/* Public customer report — no layout chrome */}
          <Route path="/r/:shareToken" element={<CustomerReportPage />} />
          <Route path="/r/:shareToken/flipbook" element={<FlipbookPage />} />
          <Route path="/r/:shareToken/print" element={<PrintReportPage />} />
          <Route path="/r/:shareToken/v2" element={<ReportV2PublicPage />} />

          {/* Legal */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Author / E-E-A-T */}
          <Route path="/about/jacob-lightsey" element={<AuthorPage />} />

          {/* Water Quality City Pages */}
          <Route path="/water-quality" element={<WaterQualityIndexPage />} />
          <Route path="/water-quality/:slug" element={<CityWaterPage />} />

          {/* Learn Hub */}
          <Route path="/learn" element={<LearnHubPage />} />

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
              {/* Pipeline / Core — dashboard, customers, reports are free-trial accessible */}
              <Route path="/dashboard" element={<TrialGate page="dashboard"><DashboardPage /></TrialGate>} />
              <Route path="/pipeline" element={<TrialGate page="pipeline"><PipelinePage /></TrialGate>} />
              <Route path="/pipeline/:dealId" element={<TrialGate page="pipeline"><PipelinePage /></TrialGate>} />
              <Route path="/customers" element={<TrialGate page="customers"><CustomersPage /></TrialGate>} />
              <Route path="/customers/new" element={<TrialGate page="create-customer"><CreateCustomerPage /></TrialGate>} />
              <Route path="/customers/:reportId" element={<TrialGate page="customer-detail"><CustomerDetailPage /></TrialGate>} />
              <Route path="/customers/:reportId/demo" element={<TrialGate page="demo-wizard"><DemoWizardPage /></TrialGate>} />
              <Route path="/leads" element={<TrialGate page="leads"><LeadsPage /></TrialGate>} />
              <Route path="/appointments" element={<TrialGate page="appointments"><AppointmentsPage /></TrialGate>} />

              {/* Sales */}
              <Route path="/analytics" element={<TrialGate page="analytics"><AnalyticsPage /></TrialGate>} />
              <Route path="/demo-analytics" element={<TrialGate page="demo-analytics"><DemoAnalyticsPage /></TrialGate>} />
              <Route path="/proposals" element={<TrialGate page="proposals"><ProposalsPage /></TrialGate>} />
              <Route path="/commissions" element={<TrialGate page="commissions"><CommissionsPage /></TrialGate>} />

              {/* Retention */}
              <Route path="/retention" element={<TrialGate page="retention"><RetentionPage /></TrialGate>} />
              <Route path="/follow-ups" element={<TrialGate page="follow-ups"><FollowUpsPage /></TrialGate>} />
              <Route path="/reviews" element={<TrialGate page="reviews"><ReviewsPage /></TrialGate>} />

              {/* Intelligence */}
              <Route path="/territory-map" element={<TrialGate page="territory-map"><TerritoryMapPage /></TrialGate>} />
              <Route path="/marketing" element={<TrialGate page="marketing"><MarketingPage /></TrialGate>} />
              <Route path="/training" element={<TrialGate page="training"><TrainingPage /></TrialGate>} />
              <Route path="/attribution" element={<TrialGate page="attribution"><AttributionPage /></TrialGate>} />
              <Route path="/audiences" element={<TrialGate page="audiences"><AudiencePage /></TrialGate>} />

              {/* Reports — accessible on free trial */}
              <Route path="/generate" element={<Navigate to="/customers/new" replace />} />
              <Route path="/reports" element={<TrialGate page="reports"><ReportsPage /></TrialGate>} />
              <Route path="/reports/:reportId" element={<TrialGate page="view-report"><ViewReportPage /></TrialGate>} />
              <Route path="/reports/:reportId/flipbook" element={<FlipbookPage />} />
              <Route path="/reports/:reportId/v2" element={<TrialGate page="report-v2"><ReportV2Page /></TrialGate>} />

              {/* Settings & admin — accessible on free trial */}
              <Route path="/verify" element={<DealerVerificationPage />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/team" element={<TrialGate page="team"><TeamPage /></TrialGate>} />
              <Route path="/subscription" element={<TrialGate page="subscription"><SubscriptionPage /></TrialGate>} />
              <Route path="/company" element={<TrialGate page="company"><CompanySettingsPage /></TrialGate>} />
              <Route path="/settings" element={<TrialGate page="settings"><SettingsPage /></TrialGate>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
