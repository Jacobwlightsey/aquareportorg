import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayoutV2 } from "./components/AppLayoutV2";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TrialGate } from "./components/TrialGate";

/* ── Lazy-load ALL pages for fast initial load ────────────────────── */

// Public — marketing / SEO
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("./pages/SignupPage").then((m) => ({ default: m.SignupPage })));
const InvitePage = lazy(() => import("./pages/InvitePage").then((m) => ({ default: m.InvitePage })));
const PillarPage = lazy(() => import("./pages/PillarPage"));
const BlogPage = lazy(() => import("./pages/BlogPage").then((m) => ({ default: m.BlogPage })));
const BlogArticlePage = lazy(() => import("./pages/BlogArticlePage").then((m) => ({ default: m.BlogArticlePage })));
const AuthorPage = lazy(() => import("./pages/AuthorPage").then((m) => ({ default: m.AuthorPage })));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage").then((m) => ({ default: m.ComparisonPage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const CityWaterPage = lazy(() => import("./pages/CityWaterPage").then((m) => ({ default: m.CityWaterPage })));
const WaterQualityIndexPage = lazy(() => import("./pages/WaterQualityIndexPage").then((m) => ({ default: m.WaterQualityIndexPage })));
const LearnHubPage = lazy(() => import("./pages/LearnHubPage").then((m) => ({ default: m.LearnHubPage })));
const BookDemoPage = lazy(() => import("./pages/BookDemoPage").then((m) => ({ default: m.BookDemoPage })));
const PricingPage = lazy(() => import("./pages/PricingPage").then((m) => ({ default: m.PricingPage })));

// Public — shared / no auth
const SpouseReviewPage = lazy(() => import("./pages/SpouseReviewPage").then((m) => ({ default: m.SpouseReviewPage })));
const DemoPreviewPage = lazy(() => import("./pages/DemoPreviewPage").then((m) => ({ default: m.DemoPreviewPage })));
const CustomerReportPage = lazy(() => import("./pages/CustomerReportPage").then((m) => ({ default: m.CustomerReportPage })));
const FlipbookPage = lazy(() => import("./pages/FlipbookPage").then((m) => ({ default: m.FlipbookPage })));
const PrintReportPage = lazy(() => import("./pages/PrintReportPage").then((m) => ({ default: m.PrintReportPage })));
const ReportV2PublicPage = lazy(() => import("./pages/ReportV2PublicPage").then((m) => ({ default: m.ReportV2PublicPage })));

// Authenticated — core
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import("./pages/CustomersPage").then((m) => ({ default: m.CustomersPage })));
const CreateCustomerPage = lazy(() => import("./pages/CreateCustomerPage").then((m) => ({ default: m.CreateCustomerPage })));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage").then((m) => ({ default: m.CustomerDetailPage })));
const DemoWizardPage = lazy(() => import("./pages/DemoWizardPage").then((m) => ({ default: m.DemoWizardPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const ViewReportPage = lazy(() => import("./pages/ViewReportPage").then((m) => ({ default: m.ViewReportPage })));
const ReportV2Page = lazy(() => import("./pages/ReportV2Page").then((m) => ({ default: m.ReportV2Page })));
const LeadsPage = lazy(() => import("./pages/LeadsPage").then((m) => ({ default: m.LeadsPage })));
const GenerateReportPage = lazy(() => import("./pages/GenerateReportPage").then((m) => ({ default: m.GenerateReportPage })));

// Authenticated — sales & analytics
const PipelinePage = lazy(() => import("./pages/PipelinePage").then((m) => ({ default: m.PipelinePage })));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));
const DemoAnalyticsPage = lazy(() => import("./pages/DemoAnalyticsPage").then((m) => ({ default: m.DemoAnalyticsPage })));
const AppointmentsPage = lazy(() => import("./pages/AppointmentsPage").then((m) => ({ default: m.AppointmentsPage })));
const ProposalsPage = lazy(() => import("./pages/ProposalsPage").then((m) => ({ default: m.ProposalsPage })));
const CommissionsPage = lazy(() => import("./pages/CommissionsPage").then((m) => ({ default: m.CommissionsPage })));
const InstallsPage = lazy(() => import("./pages/InstallsPage").then((m) => ({ default: m.InstallsPage })));

// Authenticated — retention & intelligence
const RetentionPage = lazy(() => import("./pages/RetentionPage").then((m) => ({ default: m.RetentionPage })));
const FollowUpsPage = lazy(() => import("./pages/FollowUpsPage").then((m) => ({ default: m.FollowUpsPage })));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const TerritoryMapPage = lazy(() => import("./pages/TerritoryMapPage").then((m) => ({ default: m.TerritoryMapPage })));
const MarketingPage = lazy(() => import("./pages/MarketingPage").then((m) => ({ default: m.MarketingPage })));
const TrainingPage = lazy(() => import("./pages/TrainingPage").then((m) => ({ default: m.TrainingPage })));
const AttributionPage = lazy(() => import("./pages/AttributionPage").then((m) => ({ default: m.AttributionPage })));
const AudiencePage = lazy(() => import("./pages/AudiencePage").then((m) => ({ default: m.AudiencePage })));

// Authenticated — settings & admin
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const PlatformPage = lazy(() => import("./pages/PlatformPage").then((m) => ({ default: m.PlatformPage })));
const DealerVerificationPage = lazy(() => import("./pages/DealerVerificationPage").then((m) => ({ default: m.DealerVerificationPage })));
const TeamPage = lazy(() => import("./pages/TeamPage").then((m) => ({ default: m.TeamPage })));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage").then((m) => ({ default: m.SubscriptionPage })));
const CompanySettingsPage = lazy(() => import("./pages/CompanySettingsPage").then((m) => ({ default: m.CompanySettingsPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

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

          {/* Dealer lead capture — public, no auth */}
          <Route path="/book-demo" element={<BookDemoPage />} />
          <Route path="/book-demo/:slug" element={<BookDemoPage />} />

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
          <Route path="/best-water-treatment-dealer-software" element={<ComparisonPage />} />

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
            <Route path="/pricing" element={<PricingPage />} />
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
              <Route path="/installs" element={<TrialGate page="installs"><InstallsPage /></TrialGate>} />

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
