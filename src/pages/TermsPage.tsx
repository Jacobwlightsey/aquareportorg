import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

export function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="AquaReport terms of service — the agreement governing your use of our water quality reporting platform."
        canonical="https://aquareport.org/terms"
      />

      <div className="min-h-screen bg-[#020617]">
        <header className="border-b border-slate-800/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" />
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/" className="hidden text-sm text-slate-400 hover:text-white md:block">Home</Link>
              <Link to="/login" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400">Sign In</Link>
            </nav>
          </div>
        </header>

        <article className="mx-auto max-w-3xl px-6 pb-16 pt-12">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: May 25, 2026</p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Agreement</h2>
              <p>By accessing or using AquaReport ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Service Description</h2>
              <p>AquaReport provides water quality reporting software for water treatment dealers, including report generation, AquaScore™ water quality scoring, a Demo Wizard sales presentation tool, lead management, Facebook ad integration, and tracking analytics.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Accounts & Access</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>One person or legal entity per account unless on a Team plan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Acceptable Use</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Fabricate or misrepresent water quality data</li>
                <li>Share, sell, or distribute customer data obtained through the platform without proper consent</li>
                <li>Attempt to access other users' accounts or data</li>
                <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
                <li>Use automated scripts to scrape or overload the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Data Processing</h2>
              <h3 className="text-lg font-semibold text-white mt-4 mb-2">5.1 Dealer Responsibilities</h3>
              <p>As a Dealer using AquaReport, you are the data controller for your customers' personal information. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Obtaining proper consent from customers before collecting their data</li>
                <li>Informing customers about how their data will be used, including any tracking or Facebook integration features</li>
                <li>Handling data deletion requests from your customers</li>
                <li>Complying with all applicable data protection laws (CCPA, state privacy laws, etc.)</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-4 mb-2">5.2 AquaReport's Role</h3>
              <p>AquaReport acts as a data processor on your behalf. We process customer data according to your instructions and our <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</Link>. We will not use your customer data for purposes other than providing the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Facebook & Third-Party Integrations</h2>
              <p>When you enable Facebook Lead Ads integration, Meta Conversions API, or the AquaReport tracking pixel:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>You are responsible for ensuring you have proper consent to share data with Meta/Facebook</li>
                <li>AquaReport hashes all PII (SHA-256) before transmitting to Meta</li>
                <li>You must comply with Meta's Terms of Service and advertising policies</li>
                <li>AquaReport is not responsible for Meta's use of data once transmitted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Subscription & Billing</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Plans are billed monthly or annually via Stripe</li>
                <li>You may cancel at any time; access continues until the end of the billing period</li>
                <li>Refunds are not provided for partial billing periods</li>
                <li>We reserve the right to change pricing with 30 days' notice</li>
                <li>Report limits apply per plan tier; exceeding limits may require an upgrade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Intellectual Property</h2>
              <p>AquaReport, AquaScore™, and associated logos are trademarks of AquaReport. The Service software, design, and content are our intellectual property.</p>
              <p className="mt-2">Reports you generate using the Service are your property. You retain ownership of all customer data you input into the platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Water Quality Data Disclaimer</h2>
              <p>Water quality data provided by AquaReport is sourced from public databases (EPA, EWG) and Dealer-submitted test results. This data is provided <strong className="text-white">for informational purposes only</strong> and should not be considered medical advice. AquaReport does not guarantee the accuracy or completeness of water quality data.</p>
              <p className="mt-2">Always consult with a certified water testing laboratory for definitive water quality analysis.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Limitation of Liability</h2>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, AQUAREPORT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Termination</h2>
              <p>We may suspend or terminate your account if you violate these Terms. Upon termination, your right to use the Service ceases immediately. You may request export of your data within 30 days of termination.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">12. Changes</h2>
              <p>We may modify these Terms at any time. Material changes will be communicated via email at least 30 days in advance. Continued use of the Service after changes take effect constitutes acceptance of the new Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">13. Contact</h2>
              <p>Questions about these Terms? Contact us at <a href="mailto:support@aquareport.org" className="text-cyan-400 hover:text-cyan-300">support@aquareport.org</a>.</p>
            </section>
          </div>
        </article>

        <footer className="border-t border-slate-800/60 bg-slate-950 py-8">
          <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} AquaReport. Water quality report software for dealers.
          </div>
        </footer>
      </div>
    </>
  );
}
