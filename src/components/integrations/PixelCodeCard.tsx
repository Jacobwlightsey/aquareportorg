import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Code, Copy, Check, Info } from "lucide-react";

export function PixelCodeCard() {
  const company = useQuery(api.companies.getMyCompany);
  const [copied, setCopied] = useState(false);

  const companyId = company?._id ?? "YOUR_COMPANY_ID";

  const embedCode = `<!-- AquaReport Tracking Pixel -->
<script src="https://aquareport.org/pixel.js"
        data-company-id="${companyId}"
        data-api="https://groovy-basilisk-939.convex.site"></script>`;

  const embedCodeNoBanner = `<!-- AquaReport Tracking Pixel (no built-in banner) -->
<script src="https://aquareport.org/pixel.js"
        data-company-id="${companyId}"
        data-api="https://groovy-basilisk-939.convex.site"
        data-no-banner="true"></script>

<!-- Grant consent from your own banner/button -->
<script>
  // Call this when the user accepts cookies:
  // window.AquaReport.grantConsent();
</script>`;

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Tracking Pixel</h3>
          <p className="mt-1 text-sm text-slate-400">
            Add this snippet to your website to track page views, leads, and conversions.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <Code className="h-5 w-5 text-cyan-400" />
        </div>
      </div>

      {/* Embed Code */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-white">Embed Code (with consent banner)</h4>
          <button
            onClick={() => handleCopy(embedCode)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-cyan-300 font-mono leading-relaxed">
          {embedCode}
        </pre>
      </div>

      {/* How It Works */}
      <div className="rounded-lg border border-slate-800/40 bg-slate-950/40 p-4">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400" />
          How It Works
        </h4>
        <ul className="space-y-1.5 text-sm text-slate-400">
          <li>• Shows a consent banner to new visitors (Accept / Decline)</li>
          <li>• Tracks page views automatically once consent is granted</li>
          <li>• Captures UTM parameters, referrer, and Facebook click IDs</li>
          <li>• Hashes all PII (email, phone) before sending — never sends raw data</li>
          <li>• Uses <code className="text-xs text-slate-300">sendBeacon</code> for reliable tracking</li>
        </ul>
      </div>

      {/* Advanced: No Banner */}
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-slate-400 hover:text-slate-300">
          Advanced: Use your own consent banner
        </summary>
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2">
            If you already have a cookie consent solution, use <code className="text-slate-400">data-no-banner="true"</code> and call <code className="text-slate-400">AquaReport.grantConsent()</code> when the user accepts.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-500 font-mono leading-relaxed">
            {embedCodeNoBanner}
          </pre>
        </div>
      </details>

      {/* Track Custom Events */}
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-slate-400 hover:text-slate-300">
          Tracking Custom Events
        </summary>
        <div className="mt-3 space-y-2 text-xs text-slate-500">
          <p>After the pixel is installed, you can track custom events:</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-cyan-300/70 font-mono">
{`// Track a lead form submission
AquaReport.track("Lead", {
  email: "customer@example.com",
  phone: "555-0123"
});

// Track a custom event
AquaReport.track("ScheduledDemo", {
  source: "website_cta"
});`}
          </pre>
          <p className="text-slate-600">
            Email and phone are automatically SHA-256 hashed before being sent.
          </p>
        </div>
      </details>
    </div>
  );
}
