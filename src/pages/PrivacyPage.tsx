import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

export function PrivacyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="AquaReport privacy policy — how we collect, use, and protect your data. Learn about our tracking practices, data sharing, and your rights."
        canonical="https://aquareport.org/privacy"
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

        <article className="mx-auto max-w-3xl px-6 pb-16 pt-12 prose-invert">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: May 25, 2026</p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Who We Are</h2>
              <p>AquaReport ("we," "us," "our") operates the aquareport.org platform and the myaquareport.com consumer report portal. We provide water quality reporting software for water treatment dealers ("Dealers") and water quality information to homeowners ("Consumers").</p>
              <p className="mt-2"><strong className="text-white">Contact:</strong> support@aquareport.org</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Data We Collect</h2>
              <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.1 Dealer Account Data</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email, phone number, company name</li>
                <li>Billing information (processed by Stripe — we do not store card numbers)</li>
                <li>Water test results and customer report data</li>
                <li>Demo session activity and sales pipeline data</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.2 Consumer Data</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email, phone (when provided for a water quality report)</li>
                <li>ZIP code and address (for water quality lookup)</li>
                <li>Water test readings and AquaScore results</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.3 Tracking & Analytics Data</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Page views and interaction events (via the AquaReport pixel, when consent is granted)</li>
                <li>Session identifiers stored in localStorage (not cookies)</li>
                <li>Facebook click IDs and browser IDs (from first-party cookies set by Meta's own pixel)</li>
                <li>IP address (hashed for privacy — we do not store raw IPs in tracking tables)</li>
                <li>Browser user agent string</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-white">Water quality reports:</strong> Generating personalized water quality reports and AquaScore ratings</li>
                <li><strong className="text-white">Dealer operations:</strong> Managing customers, leads, pipeline, and sales presentations</li>
                <li><strong className="text-white">Conversion tracking:</strong> Measuring ad performance and attributing leads to marketing sources</li>
                <li><strong className="text-white">Product improvement:</strong> Understanding usage patterns to improve the platform</li>
                <li><strong className="text-white">Communication:</strong> Sending account-related emails, report notifications, and requested updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Data Sharing with Meta/Facebook</h2>
              <p>When a Dealer enables Facebook integration, certain data may be shared with Meta Platforms, Inc. for conversion tracking and ad optimization:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Hashed (SHA-256) email addresses and phone numbers</li>
                <li>Conversion events (lead created, demo completed, deal closed)</li>
                <li>Facebook click and browser identifiers</li>
              </ul>
              <p className="mt-2">We <strong className="text-white">never</strong> share raw (unhashed) email addresses or phone numbers with Meta. All personally identifiable information is cryptographically hashed before transmission.</p>
              <p className="mt-2">This sharing only occurs when: (a) the Dealer has enabled Facebook integration, and (b) the individual has consented to tracking.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. The AquaReport Pixel</h2>
              <p>Dealers may install the AquaReport tracking pixel on their websites. The pixel:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong className="text-white">Does NOT fire</strong> until the visitor consents via the consent banner</li>
                <li>Uses localStorage (not third-party cookies) for session tracking</li>
                <li>Tracks page views, form submissions, and custom events</li>
                <li>Sends data to AquaReport's servers for attribution reporting</li>
              </ul>
              <p className="mt-2">Visitors who decline the consent banner are <strong className="text-white">not tracked at all</strong> — the pixel becomes completely inert.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong className="text-white">Tracking events (page views):</strong> Automatically deleted after 90 days</li>
                <li><strong className="text-white">Tracking events (conversions):</strong> Automatically deleted after 365 days</li>
                <li><strong className="text-white">Lead and customer data:</strong> Retained until the Dealer deletes it or closes their account</li>
                <li><strong className="text-white">Account data:</strong> Retained while the account is active; deleted upon request</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Data Roles</h2>
              <p><strong className="text-white">Dealers</strong> are data controllers for their customers' information. They are responsible for obtaining consent before collecting customer data.</p>
              <p className="mt-2"><strong className="text-white">AquaReport</strong> is a data processor, processing customer data on behalf of Dealers according to their instructions and this privacy policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong className="text-white">Access</strong> your personal data</li>
                <li><strong className="text-white">Correct</strong> inaccurate personal data</li>
                <li><strong className="text-white">Delete</strong> your personal data ("right to be forgotten")</li>
                <li><strong className="text-white">Object</strong> to processing of your personal data</li>
                <li><strong className="text-white">Port</strong> your data to another service</li>
              </ul>
              <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:support@aquareport.org" className="text-cyan-400 hover:text-cyan-300">support@aquareport.org</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. California Privacy Rights (CCPA)</h2>
              <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>The right to know what personal information we collect and how we use it</li>
                <li>The right to delete your personal information</li>
                <li>The right to opt out of the "sale" or "sharing" of personal information</li>
                <li>The right to non-discrimination for exercising your privacy rights</li>
              </ul>
              <p className="mt-2">To opt out of data sharing for targeted advertising, decline the consent banner on dealer websites or contact us at support@aquareport.org.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Security</h2>
              <p>We protect your data with:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Encryption in transit (HTTPS/TLS) and at rest</li>
                <li>SHA-256 hashing of all PII in tracking tables</li>
                <li>Role-based access controls for dealer accounts</li>
                <li>Audit logging of all data access and modifications</li>
                <li>Automatic data expiration and cleanup</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify registered users of material changes via email. The "Last updated" date at the top reflects the most recent revision.</p>
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
