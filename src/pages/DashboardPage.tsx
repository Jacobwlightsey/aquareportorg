import { useQuery } from "convex/react";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  FileText,
  FolderKanban,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "../../convex/_generated/api";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`${onClick ? "cursor-pointer hover:border-white/20 transition-colors" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const pipelineStats = useQuery(api.deals.getPipelineStats);
  const reports = useQuery(api.reports.getMyReports);
  const leads = useQuery(api.leads.getLeads);
  const appointments = useQuery(api.appointments.getAppointments, {});
  const company = useQuery(api.companies.getMyCompany);

  const newLeads = leads?.filter((l) => l.status === "new")?.length ?? 0;
  const totalReports = reports?.length ?? 0;
  const todayAppts = appointments?.filter((a) => {
    const today = new Date();
    const d = new Date(a.scheduledAt);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && a.status !== "cancelled";
  }) ?? [];
  const upcomingAppts = appointments?.filter((a) => a.scheduledAt > Date.now() && a.status !== "cancelled").slice(0, 5) ?? [];
  const recentDeals = pipelineStats?.byStage?.["closed_won"]?.count ?? 0;

  // Monthly revenue from closed deals
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black">
          Welcome back{company?.name ? `, ${company.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your pipeline today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pipeline Value"
          value={`$${(pipelineStats?.totalPipelineValue ?? 0).toLocaleString()}`}
          subtitle={`${pipelineStats?.activeDeals ?? 0} active deals`}
          icon={FolderKanban}
          color="bg-cyan-500/10 text-cyan-400"
          onClick={() => navigate("/pipeline")}
        />
        <StatCard
          title="Deals Won"
          value={pipelineStats?.wonCount ?? 0}
          subtitle={`$${(pipelineStats?.wonValue ?? 0).toLocaleString()} revenue`}
          icon={DollarSign}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          title="Win Rate"
          value={`${pipelineStats?.winRate ?? 0}%`}
          subtitle={`Avg deal: $${(pipelineStats?.avgDealSize ?? 0).toLocaleString()}`}
          icon={Target}
          color="bg-violet-500/10 text-violet-400"
        />
        <StatCard
          title="New Leads"
          value={newLeads}
          subtitle={`${totalReports} total reports`}
          icon={Users}
          color="bg-amber-500/10 text-amber-400"
          onClick={() => navigate("/leads")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="size-4 text-cyan-400" />
                Today's Schedule
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/appointments")}>
                View all <ArrowRight className="size-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No appointments today</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate("/appointments")}
                >
                  Schedule one
                </Button>
              </div>
            ) : (
              todayAppts.map((appt) => (
                <div
                  key={appt._id}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-black">
                      {new Date(appt.scheduledAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {appt.durationMinutes}min
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{appt.customerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appt.customerAddress || appt.customerCity || "No address"}
                      {appt.type && ` · ${appt.type.replace("_", " ")}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      appt.status === "confirmed"
                        ? "border-emerald-500/30 text-emerald-400"
                        : appt.status === "completed"
                          ? "border-blue-500/30 text-blue-400"
                          : "border-amber-500/30 text-amber-400"
                    }
                  >
                    {appt.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="size-4 text-amber-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/customers")}
              >
                <FileText className="size-4 mr-2" />
                New Water Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/pipeline")}
              >
                <FolderKanban className="size-4 mr-2" />
                Add Deal
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/appointments")}
              >
                <Calendar className="size-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/proposals")}
              >
                <FileText className="size-4 mr-2" />
                Create Proposal
              </Button>
            </CardContent>
          </Card>

          {/* Pipeline Funnel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" />
                Pipeline Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "New Leads", key: "new_lead", color: "bg-blue-500" },
                { label: "Appointment Set", key: "appointment_set", color: "bg-cyan-500" },
                { label: "Demo Complete", key: "demo_completed", color: "bg-violet-500" },
                { label: "Proposal Sent", key: "proposal_sent", color: "bg-amber-500" },
                { label: "Negotiation", key: "negotiation", color: "bg-orange-500" },
                { label: "Won", key: "closed_won", color: "bg-emerald-500" },
              ].map((s) => {
                const data = pipelineStats?.byStage?.[s.key];
                const count = data?.count ?? 0;
                const maxCount = Math.max(
                  ...Object.values(pipelineStats?.byStage ?? {}).map((v: any) => v?.count ?? 0),
                  1
                );
                return (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.color} transition-all duration-500`}
                        style={{ width: `${Math.max(2, (count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
