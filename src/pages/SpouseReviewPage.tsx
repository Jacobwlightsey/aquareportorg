/**
 * Sprint 4A — Spouse Review Page
 *
 * Public page at /review/:token — no auth required.
 * Shows simplified water quality results for the absent spouse/partner.
 * Does NOT show pricing. 72-hour link expiry.
 */
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  Beaker,
  Droplets,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  Clock,
  ThermometerSun,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { ScoreGauge } from "@/components/demo/ScoreGauge";

function tierInfo(score: number) {
  if (score >= 80)
    return { label: "Gold Tier", color: "#f59e0b", emoji: "🏆", desc: "Your water meets or exceeds all health guidelines." };
  if (score >= 60)
    return { label: "Silver Tier", color: "#94a3b8", emoji: "🥈", desc: "Your water is mostly clean with a few areas worth monitoring." };
  if (score >= 40)
    return { label: "Bronze Tier", color: "#f97316", emoji: "⚠️", desc: "Your water has some contaminants above recommended health levels." };
  return { label: "At Risk", color: "#ef4444", emoji: "🚨", desc: "Your water has significant quality concerns that should be addressed." };
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "critical")
    return (
      <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
        Over Legal Limit
      </span>
    );
  if (severity === "warning")
    return (
      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
        Over Health Guideline
      </span>
    );
  return (
    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
      Within Limits
    </span>
  );
}

export function SpouseReviewPage() {
  const { token } = useParams<{ token: string }>();
  const result = useQuery(api.spouseReview.getSpouseReview, token ? { token } : "skip");

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#111827] text-white">
        <div className="flex items-center gap-3">
          <Droplets className="size-6 animate-pulse text-blue-400" />
          <p className="text-white/60">Loading your water quality report…</p>
        </div>
      </div>
    );
  }

  if ("error" in result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#111827] text-white p-6">
        <div className="max-w-sm text-center space-y-4">
          {result.error === "expired" ? (
            <>
              <Clock className="mx-auto size-12 text-amber-400" />
              <h1 className="text-xl font-bold">Link Expired</h1>
              <p className="text-sm text-white/60">
                This review link has expired (72-hour limit). Please ask your water treatment specialist
                to generate a new one.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="mx-auto size-12 text-red-400" />
              <h1 className="text-xl font-bold">Link Not Found</h1>
              <p className="text-sm text-white/60">
                This review link is invalid. Please check the URL or contact your water treatment specialist.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const d = result.data;
  const tier = tierInfo(d.waterScore);
  // Use real projected score from demo/proposal, fallback to +30 estimate
  const projectedScore = d.projectedScore ?? Math.min(d.waterScore + 30, 99);
  const hasLiveReadings = d.chlorine != null || d.hardness != null || d.tds != null || d.ph != null;
  const hasReadings = hasLiveReadings || (d.liveReadings && Object.keys(d.liveReadings).length > 0);
  // Merge on-site report readings with demo live readings (report takes priority)
  const readings = {
    chlorine: d.chlorine ?? d.liveReadings?.chlorine ?? null,
    ph: d.ph ?? d.liveReadings?.ph ?? null,
    hardness: d.hardness ?? d.liveReadings?.hardness ?? null,
    tds: d.tds ?? d.liveReadings?.tds ?? null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#111827] text-white">
      {/* Company Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          {d.companyLogo ? (
            <img src={d.companyLogo} alt={d.companyName} className="h-8 rounded" />
          ) : (
            <Droplets className="size-6" style={{ color: d.companyColor }} />
          )}
          <span className="text-sm font-semibold text-white/80">{d.companyName}</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8 space-y-8">
        {/* Greeting */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black">
            Hi! {d.customerName}'s water quality results are ready.
          </h1>
          <p className="text-sm text-white/50">
            Water tested from {d.utilityName} · {d.city}, {d.state}
          </p>
        </div>

        {/* AquaScore Gauge */}
        <div className="flex flex-col items-center space-y-3">
          <ScoreGauge score={d.waterScore} size={180} animate />
          <div className="flex items-center gap-2">
            <span className="text-2xl">{tier.emoji}</span>
            <span className="text-lg font-bold" style={{ color: tier.color }}>
              {tier.label}
            </span>
          </div>
          <p className="text-center text-sm text-white/60 max-w-xs">{tier.desc}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-2xl font-black">{d.totalContaminants}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Detected</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-2xl font-black text-amber-400">{d.overHealthGuidelines}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Over Health</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-2xl font-black text-red-400">{d.overLegalLimits}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Over Legal</p>
          </div>
        </div>

        {/* On-Site Water Readings */}
        {hasReadings && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Beaker className="size-5 text-blue-400" />
              On-Site Water Readings
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {readings.chlorine != null && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Chlorine</p>
                  <p className="text-2xl font-black">{readings.chlorine}<span className="text-xs text-white/40 ml-1">ppm</span></p>
                  <p className="text-[10px] text-white/30 mt-1">EPA limit: 4.0 ppm</p>
                </div>
              )}
              {readings.ph != null && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">pH Level</p>
                  <p className="text-2xl font-black">{readings.ph}</p>
                  <p className="text-[10px] text-white/30 mt-1">Ideal: 6.5–8.5</p>
                </div>
              )}
              {readings.hardness != null && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Hardness</p>
                  <p className="text-2xl font-black">{readings.hardness}<span className="text-xs text-white/40 ml-1">gpg</span></p>
                  <p className="text-[10px] text-white/30 mt-1">Soft: &lt;3.5 · Hard: &gt;7</p>
                </div>
              )}
              {readings.tds != null && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">TDS</p>
                  <p className="text-2xl font-black">{readings.tds}<span className="text-xs text-white/40 ml-1">ppm</span></p>
                  <p className="text-[10px] text-white/30 mt-1">EPA limit: 500 ppm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Concerns from Demo */}
        {d.selectedConcerns && d.selectedConcerns.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ThermometerSun className="size-5 text-amber-400" />
              Your Household Concerns
            </h2>
            <div className="flex flex-wrap gap-2">
              {d.selectedConcerns.map((concern, i) => (
                <span
                  key={i}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 capitalize"
                >
                  {concern.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 Contaminants */}
        {d.topContaminants.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-400" />
              Top Concerns
            </h2>
            <div className="space-y-2">
              {d.topContaminants.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-white/40">
                      Detected: {c.amount} · Limit: {c.limit}
                    </p>
                  </div>
                  <SeverityBadge severity={c.severity} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Before / After Score */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="size-5 text-blue-400" />
            What Filtration Can Do
          </h2>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">Current</p>
              <ScoreGauge score={d.waterScore} size={80} animate={false} />
            </div>
            <ArrowRight className="size-6 text-white/30" />
            <div className="text-center">
              <p className="text-xs text-emerald-400 mb-1">Projected</p>
              <ScoreGauge score={projectedScore} size={80} animate={false} />
            </div>
          </div>
          <p className="text-center text-sm text-white/50">
            A whole-home filtration system could improve your score by{" "}
            <span className="font-bold text-emerald-400">
              +{projectedScore - d.waterScore} points
            </span>
          </p>
        </div>

        {/* Equipment from Demo Session (no pricing) */}
        {d.equipmentRecommended && d.equipmentRecommended.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-400" />
              Recommended Equipment
            </h2>
            <ul className="space-y-2">
              {d.equipmentRecommended.map((eq, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <span className="mt-0.5 size-2 shrink-0 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold">{eq.name}</p>
                    {eq.description && <p className="text-xs text-white/50 mt-0.5">{eq.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-white/40 text-center italic">
              Contact your water specialist for pricing details.
            </p>
          </div>
        )}

        {/* System Recommendation (no pricing) */}
        {d.systemName && !(d.equipmentRecommended && d.equipmentRecommended.length > 0) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-400" />
              Recommended System
            </h2>
            <p className="text-base font-semibold">{d.systemName}</p>
            {d.systemDescription && (
              <p className="text-sm text-white/60">{d.systemDescription}</p>
            )}
            {d.systemFeatures.length > 0 && (
              <ul className="space-y-1.5">
                {d.systemFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 text-center space-y-4">
          <h2 className="text-lg font-bold">Have Questions?</h2>
          <p className="text-sm text-white/60">
            Your water specialist is ready to answer any questions about these results.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {d.companyPhone && (
              <a
                href={`tel:${d.companyPhone}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold hover:bg-blue-500 transition-colors"
              >
                <Phone className="size-4" />
                Call {d.companyPhone}
              </a>
            )}
            {d.companyEmail && (
              <a
                href={`mailto:${d.companyEmail}?subject=Water Quality Report Questions`}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                <Mail className="size-4" />
                Email Us
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-white/30 pb-8">
          <p>Powered by AquaReport · This link expires 72 hours after creation</p>
        </footer>
      </main>
    </div>
  );
}
