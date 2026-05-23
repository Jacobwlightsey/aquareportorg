import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

export function CommissionsPage() {
  const now = new Date();
  const [period, setPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const summary = useQuery(api.commissions.getCommissionSummary, { period });
  const commissions = useQuery(api.commissions.getCommissions, { period }) ?? [];
  const approveCommission = useMutation(api.commissions.approveCommission);
  const markPaid = useMutation(api.commissions.markPaid);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short" }),
    };
  });

  const handleApprove = async (id: any) => {
    try {
      await approveCommission({ commissionId: id });
      toast.success("Commission approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handlePaid = async (id: any) => {
    try {
      await markPaid({ commissionId: id });
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to mark as paid");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Commissions"
        subtitle="Track sales commissions and payouts."
        icon={DollarSign}
        iconColor="text-emerald-400"
        actions={
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {months.map((m) => (
              <Button
                key={m.value}
                size="sm"
                variant={period === m.value ? "default" : "outline"}
                className="text-[11px] h-7 px-2.5 shrink-0"
                onClick={() => setPeriod(m.value)}
              >
                {m.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Revenue"
          value={`$${(summary?.totalRevenue ?? 0).toLocaleString()}`}
          color="text-emerald-400"
          icon={DollarSign}
        />
        <StatCard
          label="Commissions"
          value={`$${(summary?.totalCommissions ?? 0).toLocaleString()}`}
          color="text-cyan-400"
          icon={TrendingUp}
        />
        <StatCard
          label="Pending"
          value={`$${(summary?.totalPending ?? 0).toLocaleString()}`}
          color="text-amber-400"
          icon={Clock}
        />
        <StatCard
          label="Paid Out"
          value={`$${(summary?.totalPaid ?? 0).toLocaleString()}`}
          color="text-violet-400"
          icon={CheckCircle}
        />
      </div>

      {/* Team Performance */}
      {summary?.byRep && summary.byRep.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="size-4 text-cyan-400" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.byRep.map((rep: any, i: number) => (
              <div
                key={rep.userId}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <div className="flex items-center justify-center size-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{rep.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {rep.totalDeals} deals · ${rep.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-400">
                    ${rep.totalCommission.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ${rep.paid.toLocaleString()} paid
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Commission Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Commission Log</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <div className="rounded-2xl bg-white/[0.04] p-4 mb-3">
                <DollarSign className="size-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">
                No commissions for this period.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center p-3 rounded-xl border border-white/10 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {c.customerName || "Deal"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      ${c.dealValue.toLocaleString()} × {c.commissionRate}% ={" "}
                      <span className="text-emerald-400 font-medium">
                        ${c.commissionAmount.toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        c.status === "paid"
                          ? "text-emerald-400 border-emerald-500/30"
                          : c.status === "approved"
                            ? "text-blue-400 border-blue-500/30"
                            : "text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {c.status}
                    </Badge>
                    {c.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2"
                        onClick={() => handleApprove(c._id)}
                      >
                        Approve
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2"
                        onClick={() => handlePaid(c._id)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
