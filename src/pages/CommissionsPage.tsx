import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

export function CommissionsPage() {
  const now = new Date();
  const [period, setPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [showCreate, setShowCreate] = useState(false);
  const summary = useQuery(api.commissions.getCommissionSummary, { period });
  const commissions = useQuery(api.commissions.getCommissions, { period }) ?? [];
  const approveCommission = useMutation(api.commissions.approveCommission);
  const markPaid = useMutation(api.commissions.markPaid);
  const createCommission = useMutation(api.commissions.createCommission);
  const teamMembers = useQuery(api.companies.getTeamMembers) ?? [];
  const deals = useQuery(api.deals.getDeals) ?? [];

  const [form, setForm] = useState({
    userId: "",
    dealId: "",
    dealValue: "",
    commissionRate: "10",
    customerName: "",
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
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

  const handleCreate = async () => {
    if (!form.userId || !form.dealValue || !form.commissionRate) return;
    try {
      await createCommission({
        userId: form.userId as any,
        dealId: form.dealId ? (form.dealId as any) : undefined,
        dealValue: parseFloat(form.dealValue),
        commissionRate: parseFloat(form.commissionRate),
        customerName: form.customerName || undefined,
        period,
      });
      toast.success("Commission added");
      setShowCreate(false);
      setForm({ userId: "", dealId: "", dealValue: "", commissionRate: "10", customerName: "" });
    } catch {
      toast.error("Failed to create commission");
    }
  };

  const handleDealSelect = (dealId: string) => {
    const deal = deals.find((d) => d._id === dealId);
    if (deal) {
      setForm({
        ...form,
        dealId,
        dealValue: String(deal.dealValue ?? 0),
        customerName: deal.customerName,
        userId: deal.assignedTo ? String(deal.assignedTo) : form.userId,
      });
    }
  };

  const wonDeals = deals.filter((d) => d.stage === "closed_won");

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Commissions"
        subtitle="Track and manage sales commissions."
        icon={DollarSign}
        iconColor="text-emerald-400"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 mr-1" /> Add Commission
            </Button>
          </div>
        }
      />

      {/* Period selector */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
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
              Team Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.byRep.map((rep: any, i: number) => {
              const barWidth = summary.byRep.length > 0
                ? Math.max(8, (rep.totalCommission / Math.max(...summary.byRep.map((r: any) => r.totalCommission), 1)) * 100)
                : 0;
              return (
                <div
                  key={rep.userId}
                  className="relative overflow-hidden rounded-xl border border-border bg-muted/5 p-3"
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/10 to-transparent transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="relative flex items-center gap-3">
                    <div className={`flex items-center justify-center size-8 rounded-full text-foreground text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                      i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500" :
                      i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-700" :
                      "bg-gradient-to-br from-cyan-500 to-blue-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{rep.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {rep.totalDeals} deals · ${rep.totalRevenue.toLocaleString()} revenue
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">
                        ${rep.totalCommission.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1.5 justify-end">
                        {rep.pending > 0 && (
                          <span className="text-[10px] text-amber-400">${rep.pending.toLocaleString()} pending</span>
                        )}
                        {rep.paid > 0 && (
                          <span className="text-[10px] text-emerald-400/60">${rep.paid.toLocaleString()} paid</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Commission Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Commission Log</CardTitle>
            <span className="text-[11px] text-muted-foreground">{commissions.length} entries</span>
          </div>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <div className="rounded-2xl bg-muted/8 p-4 mb-3">
                <DollarSign className="size-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">
                No commissions for this period.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 text-xs"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-3 mr-1" /> Add first commission
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {commissions.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center p-3 rounded-xl border border-border hover:bg-muted/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {c.customerName || "Deal"}
                      </p>
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
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ${c.dealValue.toLocaleString()} × {c.commissionRate}% ={" "}
                      <span className="text-emerald-400 font-medium">
                        ${c.commissionAmount.toLocaleString()}
                      </span>
                      {c.paidAt && (
                        <span className="ml-2 text-muted-foreground/50">
                          · Paid {new Date(c.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2.5"
                        onClick={() => handleApprove(c._id)}
                      >
                        Approve
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2.5"
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

      {/* Create Commission Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Commission</DialogTitle>
            <DialogDescription>
              Record a commission for a team member. Link to a closed deal or enter manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {wonDeals.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Deal (optional)</Label>
                <Select
                  value={form.dealId}
                  onValueChange={handleDealSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a won deal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wonDeals.map((deal) => (
                      <SelectItem key={deal._id} value={deal._id}>
                        {deal.customerName} · ${(deal.dealValue ?? 0).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Sales Rep *</Label>
              <Select
                value={form.userId}
                onValueChange={(v) => setForm({ ...form, userId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member._id} value={String(member.userId)}>
                      {member.name || member.email} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Deal Value ($) *</Label>
                <Input
                  type="number"
                  value={form.dealValue}
                  onChange={(e) => setForm({ ...form, dealValue: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label>Commission Rate (%) *</Label>
                <Input
                  type="number"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            {form.dealValue && form.commissionRate && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-sm text-muted-foreground">
                  Commission: <span className="text-emerald-400 font-bold text-base">
                    ${(parseFloat(form.dealValue || "0") * parseFloat(form.commissionRate || "0") / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.userId || !form.dealValue || !form.commissionRate}
            >
              Add Commission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
