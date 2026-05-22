import { useQuery } from "convex/react";
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Mail,
  Phone,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanGateScreen } from "@/components/PlanGateScreen";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { api } from "../../convex/_generated/api";

/* ---------- helpers ---------- */
function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(ts).toLocaleDateString();
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color }}>
              {value}
            </p>
            {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
          </div>
          <div className="rounded-lg p-2" style={{ background: color + "20" }}>
            <Icon className="size-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const colors: Record<string, string> = {
    sold: "bg-emerald-500/20 text-emerald-400",
    follow_up: "bg-amber-500/20 text-amber-400",
    not_interested: "bg-red-500/20 text-red-400",
    no_show: "bg-gray-500/20 text-gray-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[outcome] || colors.no_show}`}>
      {outcome.replace("_", " ")}
    </span>
  );
}

function FunnelChart({ funnel }: { funnel: any }) {
  const steps = [
    { label: "Reports Created", value: funnel.reports, color: "#3b82f6" },
    { label: "Demos Run", value: funnel.demos, color: "#8b5cf6" },
    { label: "Leads Captured", value: funnel.leads, color: "#f59e0b" },
    { label: "Follow-ups", value: funnel.followUps, color: "#06b6d4" },
    { label: "Sold", value: funnel.sold, color: "#10b981" },
  ];
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const pct = Math.max((step.value / max) * 100, 4);
        const convRate =
          idx > 0 && steps[idx - 1].value > 0
            ? Math.round((step.value / steps[idx - 1].value) * 100)
            : null;
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-white/70">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tabular-nums">{step.value}</span>
                {convRate !== null && (
                  <span className="text-[10px] text-white/30">({convRate}%)</span>
                )}
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: step.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyChart({ data }: { data: any[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const recent = data.slice(-12);
  return (
    <div className="flex items-end gap-2 h-36 pt-4">
      {recent.length === 0 && <p className="text-xs text-white/30 m-auto">No data yet</p>}
      {recent.map((d) => {
        const soldH = (d.sold / max) * 120;
        const otherH = ((d.total - d.sold) / max) * 120;
        return (
          <div key={d.week} className="flex-1 flex flex-col items-center justify-end gap-0">
            <span className="text-[10px] text-white/50 mb-1">{d.total}</span>
            <div className="w-full rounded-t-sm bg-white/10" style={{ height: `${otherH}px` }} />
            <div className="w-full rounded-b-sm bg-emerald-500/70" style={{ height: `${soldH}px` }} />
            <span className="text-[9px] text-white/25 mt-1.5 leading-none whitespace-nowrap">
              {d.week.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DayChart({ data }: { data: any[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => {
        const h = Math.max((d.count / max) * 80, 2);
        return (
          <div key={d.name} className="flex-1 flex flex-col items-center justify-end">
            <span className="text-[10px] text-white/50 mb-1 tabular-nums">{d.count}</span>
            <div className="w-full rounded-t-sm bg-blue-500/60" style={{ height: `${h}px` }} />
            <span className="text-[9px] text-white/25 mt-1">{d.name}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Main Page ---------- */
export function DemoAnalyticsPage() {
  const company = useQuery(api.companies.getMyCompany);
  const analytics = useQuery(api.dealerShared.getDemoAnalytics);
  const enhanced = useQuery(api.dealerShared.getEnhancedDemoAnalytics);
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [expandedProfile, setExpandedProfile] = useState<number | null>(null);

  // Plan gating — use effectivePlan so free trial users get Growth access
  const { effectivePlan } = useFreeTrial();
  const gatePlan = effectivePlan || (company
    ? (company.stripeStatus === "active" && company.stripePlan) || "free"
    : undefined);

  if (gatePlan !== undefined && (gatePlan === "starter" || gatePlan === "free")) {
    return (
      <PlanGateScreen
        currentPlan={gatePlan}
        requiredPlan="growth"
        featureName="Demo Analytics & Stats"
        description="Get comprehensive demo analytics, lead funnels, customer profiles, and rep performance insights. Available on Growth plan and above."
      />
    );
  }

  if (analytics === undefined || enhanced === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/30">Loading analytics…</div>
      </div>
    );
  }

  const profiles =
    outcomeFilter === "all"
      ? enhanced.customerProfiles
      : enhanced.customerProfiles.filter((p: any) => p.lastOutcome === outcomeFilter);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-2.5">
          <Activity className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Demo Analytics</h1>
          <p className="text-sm text-white/40">
            Track demo performance, lead funnel, and customer insights
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BarChart3} label="Total Demos" value={analytics.total} color="#3b82f6" />
        <StatCard
          icon={CheckCircle}
          label="Close Rate"
          value={`${analytics.closeRate}%`}
          sub={`${analytics.outcomes.sold} sold`}
          color="#10b981"
        />
        <StatCard
          icon={Clock}
          label="Avg Duration"
          value={formatDuration(analytics.avgDuration)}
          color="#f59e0b"
        />
        <StatCard
          icon={Users}
          label="Follow-ups"
          value={analytics.outcomes.follow_up}
          sub={`${analytics.outcomes.not_interested} not interested`}
          color="#8b5cf6"
        />
      </div>

      {/* Funnel + Weekly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-blue-400" />
              Lead Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart funnel={enhanced.funnel} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-blue-400" />
              Demos Per Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={analytics.byWeek} />
            <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-500/70" />
                Sold
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-white/10" />
                Other
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outcomes + Best Days + Avg Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-emerald-400" />
              Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Sold", value: analytics.outcomes.sold, color: "#10b981" },
              { label: "Follow-up", value: analytics.outcomes.follow_up, color: "#f59e0b" },
              { label: "Not Interested", value: analytics.outcomes.not_interested, color: "#ef4444" },
              { label: "No Show", value: analytics.outcomes.no_show, color: "#6b7280" },
            ].map((item) => {
              const pct = analytics.total > 0 ? Math.round((item.value / analytics.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white/70">{item.label}</span>
                    <span className="font-mono font-medium" style={{ color: item.color }}>
                      {item.value}{" "}
                      <span className="text-white/30 text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-cyan-400" />
              Best Demo Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DayChart data={enhanced.engagement.byDay} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="size-4 text-amber-400" />
              Avg Score by Outcome
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(enhanced.avgScoreByOutcome).map(([outcome, score]: [string, any]) => {
                const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={outcome} className="flex items-center justify-between">
                    <OutcomeBadge outcome={outcome} />
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, background: color }}
                        />
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color }}>
                        {score}
                      </span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(enhanced.avgScoreByOutcome).length === 0 && (
                <p className="text-xs text-white/30 text-center py-2">No scored demos yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Pipeline + Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-blue-400" />
              Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(enhanced.statusBreakdown).map(([status, count]: [string, any]) => {
                const colors: Record<string, string> = {
                  new: "#3b82f6",
                  contacted: "#f59e0b",
                  closed: "#10b981",
                };
                return (
                  <div key={status} className="text-center rounded-xl bg-white/5 p-4">
                    <p className="text-2xl font-bold" style={{ color: colors[status] || "#6b7280" }}>
                      {count}
                    </p>
                    <p className="text-xs text-white/40 capitalize mt-1">{status}</p>
                  </div>
                );
              })}
            </div>
            {enhanced.recentLeads.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">
                  Recent Leads
                </p>
                {enhanced.recentLeads.slice(0, 5).map((lead: any) => (
                  <div
                    key={lead._id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-white/10 flex items-center justify-center">
                        <Users className="size-3.5 text-white/50" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-[10px] text-white/30">{lead.source || "Direct"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <OutcomeBadge outcome={lead.status} />
                      <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(lead.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4 text-purple-400" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(enhanced.sourceBreakdown)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([source, count]: [string, any]) => {
                  const total = Object.values(enhanced.sourceBreakdown as Record<string, number>).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white/70 capitalize">{source}</span>
                        <span className="font-mono text-white/50">
                          {count} <span className="text-white/30 text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500/60 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(enhanced.sourceBreakdown).length === 0 && (
                <p className="text-xs text-white/30 text-center py-4">No leads captured yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Profiles */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-cyan-400" />
              Customer Profiles
            </CardTitle>
            <div className="flex gap-1">
              {["all", "sold", "follow_up", "not_interested"].map((f) => (
                <button
                  key={f}
                  onClick={() => setOutcomeFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    outcomeFilter === f
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {f === "all"
                    ? "All"
                    : f === "follow_up"
                      ? "Follow-up"
                      : f === "not_interested"
                        ? "Not Interested"
                        : "Sold"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-6">
              {analytics.total === 0
                ? "Run your first demo to start building customer profiles"
                : "No profiles match this filter"}
            </p>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile: any, idx: number) => {
                const expanded = expandedProfile === idx;
                const scoreColor =
                  (profile.waterScore ?? 0) >= 70
                    ? "#10b981"
                    : (profile.waterScore ?? 0) >= 40
                      ? "#f59e0b"
                      : "#ef4444";
                return (
                  <div key={idx} className="border border-white/5 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedProfile(expanded ? null : idx)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-all cursor-pointer text-left"
                    >
                      <div
                        className="size-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ background: scoreColor + "20", color: scoreColor }}
                      >
                        {profile.waterScore ?? "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{profile.customerName}</p>
                        <p className="text-xs text-white/40">
                          {profile.city}, {profile.state} · {profile.totalDemos} demo
                          {profile.totalDemos !== 1 ? "s" : ""} · Rep: {profile.repName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <OutcomeBadge outcome={profile.lastOutcome} />
                        <p className="text-[10px] text-white/25 mt-1">
                          {timeAgo(profile.lastDemoDate)}
                        </p>
                      </div>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 bg-white/[0.02]">
                        <div className="grid grid-cols-2 gap-3 pt-3">
                          {profile.email && (
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <Mail className="size-3" /> {profile.email}
                            </div>
                          )}
                          {profile.phone && (
                            <div className="flex items-center gap-2 text-xs text-white/50">
                              <Phone className="size-3" /> {profile.phone}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-white/30 font-medium mb-1.5">Demo History</p>
                          <div className="space-y-1">
                            {profile.demoHistory.map((h: any, hIdx: number) => (
                              <div
                                key={hIdx}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5"
                              >
                                <OutcomeBadge outcome={h.outcome} />
                                <div className="flex items-center gap-3 text-white/40">
                                  {h.durationSeconds && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="size-3" />
                                      {formatDuration(h.durationSeconds)}
                                    </span>
                                  )}
                                  <span>{new Date(h.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rep Leaderboard */}
      {analytics.repStats.length > 0 && (
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-amber-400" />
              Rep Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Rep</th>
                    <th className="pb-3 pr-4 text-right">Demos</th>
                    <th className="pb-3 pr-4 text-right">Sold</th>
                    <th className="pb-3 pr-4 text-right">Close Rate</th>
                    <th className="pb-3 text-right">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.repStats.map((rep: any, idx: number) => (
                    <tr key={rep.userId} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (
                          <span className="text-white/30">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-medium">{rep.name}</td>
                      <td className="py-3 pr-4 text-right text-white/60">{rep.total}</td>
                      <td className="py-3 pr-4 text-right text-emerald-400 font-medium">{rep.sold}</td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className="font-mono font-bold"
                          style={{
                            color:
                              rep.closeRate >= 50
                                ? "#10b981"
                                : rep.closeRate >= 25
                                  ? "#f59e0b"
                                  : "#ef4444",
                          }}
                        >
                          {rep.closeRate}%
                        </span>
                      </td>
                      <td className="py-3 text-right text-white/50 font-mono text-xs">
                        {formatDuration(rep.avgDuration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {analytics.total === 0 && (
        <Card className="border-white/10 bg-white/5 text-white border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="size-10 text-white/15 mb-3" />
            <h3 className="text-lg font-semibold text-white/70">No demos yet</h3>
            <p className="text-sm text-white/30 max-w-sm mt-1">
              Run your first in-home demo to start tracking performance, customer insights, and rep
              metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
