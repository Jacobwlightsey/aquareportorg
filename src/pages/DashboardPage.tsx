import { useState } from "react";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  FolderKanban,
  Plus,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const pipelineStats = useQuery(api.deals.getPipelineStats);
  const reports = useQuery(api.reports.getMyReports);
  const leads = useQuery(api.leads.getLeads);
  const appointments = useQuery(api.appointments.getAppointments, {});
  const company = useQuery(api.companies.getMyCompany);
  const recentActivity = useQuery(api.reports.getRecentActivity, { limit: 8 });

  const newLeads = leads?.filter((l) => l.status === "new")?.length ?? 0;
  const totalReports = reports?.length ?? 0;

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const todayAppts =
    appointments?.filter((a) => {
      const d = new Date(a.scheduledAt);
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear() &&
        a.status !== "cancelled"
      );
    }) ?? [];

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };
  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">
            Welcome back{company?.name ? `, ${company.name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's happening with your pipeline today.
          </p>
        </div>
        <Button onClick={() => navigate("/customers/new")} className="w-fit">
          <Plus className="size-4 mr-1.5" />
          New Report
        </Button>
      </div>

      {/* KPI Cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={`$${(pipelineStats?.totalPipelineValue ?? 0).toLocaleString()}`}
          subtitle={`${pipelineStats?.activeDeals ?? 0} active deals`}
          icon={FolderKanban}
          color="text-cyan-400"
          onClick={() => navigate("/pipeline")}
        />
        <StatCard
          label="Deals Won"
          value={pipelineStats?.wonCount ?? 0}
          subtitle={`$${(pipelineStats?.wonValue ?? 0).toLocaleString()} revenue`}
          icon={DollarSign}
          color="text-emerald-400"
        />
        <StatCard
          label="Win Rate"
          value={`${pipelineStats?.winRate ?? 0}%`}
          subtitle={`Avg: $${(pipelineStats?.avgDealSize ?? 0).toLocaleString()}`}
          icon={Target}
          color="text-violet-400"
        />
        <StatCard
          label="New Leads"
          value={newLeads}
          subtitle={`${totalReports} total reports`}
          icon={Users}
          color="text-amber-400"
          onClick={() => navigate("/leads")}
        />
      </div>

      {/* Main content — 2/3 + 1/3 on desktop, stack on mobile */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="size-4 text-cyan-400" />
                {isToday(selectedDate) ? "Today's Schedule" : "Schedule"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => navigate("/appointments")}
              >
                View all <ArrowRight className="size-3 ml-1" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={prevDay}>
                <ChevronLeft className="size-4" />
              </Button>
              <button
                className="text-xs font-medium px-2 py-0.5 rounded hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedDate(new Date())}
                title="Go to today"
              >
                {selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </button>
              <Button variant="ghost" size="icon" className="size-7" onClick={nextDay}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {todayAppts.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="rounded-2xl bg-muted/8 p-4 mb-3">
                  <Calendar className="size-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">No appointments {isToday(selectedDate) ? "today" : "this day"}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => navigate("/appointments")}
                >
                  <Plus className="size-3 mr-1" /> Schedule one
                </Button>
              </div>
            ) : (
              todayAppts.map((appt) => (
                <div
                  key={appt._id}
                  className="flex items-center gap-3 sm:gap-4 rounded-xl border border-border bg-muted/5 p-3 sm:p-4 hover:bg-muted/8 transition-colors cursor-pointer"
                  onClick={() => navigate("/appointments")}
                >
                  <div className="text-center min-w-[52px] sm:min-w-[60px]">
                    <p className="text-base sm:text-lg font-black leading-tight">
                      {new Date(appt.scheduledAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {appt.durationMinutes}min
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{appt.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appt.customerAddress || "No address"}
                      {appt.type && ` · ${appt.type.replace("_", " ")}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${
                      appt.status === "confirmed"
                        ? "border-emerald-500/30 text-emerald-400"
                        : appt.status === "completed"
                          ? "border-blue-500/30 text-blue-400"
                          : "border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {appt.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="size-4 text-amber-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {[
                { icon: FileText, label: "New Report", href: "/customers/new" },
                { icon: FolderKanban, label: "Add Deal", href: "/pipeline" },
                { icon: Calendar, label: "Schedule", href: "/appointments" },
                { icon: FileText, label: "Proposal", href: "/proposals" },
              ].map((a) => (
                <Button
                  key={a.href}
                  variant="outline"
                  className="justify-start text-xs h-9"
                  onClick={() => navigate(a.href)}
                >
                  <a.icon className="size-3.5 mr-1.5 shrink-0" />
                  {a.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Pipeline Funnel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" />
                Pipeline Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { label: "New Leads", key: "new_lead", color: "bg-blue-500" },
                { label: "Appt Set", key: "appointment_set", color: "bg-cyan-500" },
                { label: "Demo Done", key: "demo_completed", color: "bg-violet-500" },
                { label: "Proposal Sent", key: "proposal_sent", color: "bg-amber-500" },
                { label: "Negotiation", key: "negotiation", color: "bg-orange-500" },
                { label: "Won", key: "closed_won", color: "bg-emerald-500" },
              ].map((s) => {
                const data = pipelineStats?.byStage?.[s.key];
                const count = (data as any)?.count ?? 0;
                const maxCount = Math.max(
                  ...Object.values(pipelineStats?.byStage ?? {}).map(
                    (v: any) => v?.count ?? 0
                  ),
                  1
                );
                return (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-bold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/12 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.color} transition-all duration-500`}
                        style={{
                          width: `${Math.max(2, (count / maxCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="size-4 text-violet-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/5 transition-colors"
                >
                  <div className="size-7 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-violet-400">
                      {a.actorName?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">
                      <span className="font-semibold">{a.actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {a.action?.replace(/_/g, " ")} a {a.entityType?.replace(/_/g, " ")}
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 shrink-0 tabular-nums">
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
