import { useMutation, useQuery } from "convex/react";
import {
  Award,
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
      label: d.toLocaleString("default", { month: "long", year: "numeric" }),
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
      toast.success("Commission marked as paid");
    } catch {
      toast.error("Failed to mark as paid");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Commissions</h1>
          <p className="text-sm text-muted-foreground">Track sales commissions and payouts.</p>
        </div>
        <div className="flex gap-2">
          {months.map((m) => (
            <Button
              key={m.value}
              size="sm"
              variant={period === m.value ? "default" : "outline"}
              className="text-xs"
              onClick={() => setPeriod(m.value)}
            >
              {m.label.split(" ")[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <DollarSign className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-black">${(summary?.totalRevenue ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10">
                <TrendingUp className="size-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Commissions</p>
                <p className="text-xl font-black">${(summary?.totalCommissions ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Clock className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-black">${(summary?.totalPending ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10">
                <CheckCircle className="size-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid Out</p>
                <p className="text-xl font-black">${(summary?.totalPaid ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Rep Summary */}
      {summary?.byRep && summary.byRep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-cyan-400" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.byRep.map((rep: any, i: number) => (
                <div
                  key={rep.userId}
                  className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/[0.02]"
                >
                  <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{rep.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rep.totalDeals} deals · ${rep.totalRevenue.toLocaleString()} revenue
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-emerald-400">${rep.totalCommission.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ${rep.paid.toLocaleString()} paid · ${rep.pending.toLocaleString()} pending
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Commission Log</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="size-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No commissions for this period.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-white/10 hover:bg-white/[0.02]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {c.customerName || "Deal"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${c.dealValue.toLocaleString()} × {c.commissionRate}% = ${c.commissionAmount.toLocaleString()}
                    </p>
                  </div>
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
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handleApprove(c._id)}>
                      Approve
                    </Button>
                  )}
                  {c.status === "approved" && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => handlePaid(c._id)}>
                      Mark Paid
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
