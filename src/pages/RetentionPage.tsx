import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Calendar,
  Gift,
  Plus,
  RefreshCw,
  Shield,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

export function RetentionPage() {
  const agreements = useQuery(api.retention.getServiceAgreements, {}) ?? [];
  const reminders = useQuery(api.retention.getReminders, {}) ?? [];
  const rewards = useQuery(api.retention.getReferralRewards) ?? [];
  const createAgreement = useMutation(api.retention.createServiceAgreement);
  const logVisit = useMutation(api.retention.logServiceVisit);
  const completeReminder = useMutation(api.retention.completeReminder);
  const snoozeReminder = useMutation(api.retention.snoozeReminder);
  const redeemReward = useMutation(api.retention.redeemReward);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    equipmentInstalled: "",
    installDate: "",
    monthlyFee: "",
    notes: "",
  });

  const overdue = reminders.filter((r) => r.status === "pending" && r.dueDate < Date.now());
  const upcoming = reminders.filter((r) => r.status === "pending" && r.dueDate >= Date.now());
  const activeAgreements = agreements.filter((a) => a.status === "active");
  const pendingRewards = rewards.filter((r) => r.status === "pending");

  const handleCreateAgreement = async () => {
    if (!form.customerName.trim() || !form.installDate) return;
    try {
      await createAgreement({
        customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        customerPhone: form.customerPhone || undefined,
        equipmentInstalled: form.equipmentInstalled || "Water Treatment System",
        installDate: new Date(form.installDate).getTime(),
        monthlyFee: parseFloat(form.monthlyFee) || 0,
        notes: form.notes || undefined,
      });
      toast.success("Service agreement created");
      setShowCreate(false);
      setForm({ customerName: "", customerEmail: "", customerPhone: "", equipmentInstalled: "", installDate: "", monthlyFee: "", notes: "" });
    } catch {
      toast.error("Failed to create agreement");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Retention"
        subtitle="Service agreements, reminders, and referral rewards."
        icon={RefreshCw}
        iconColor="text-emerald-400"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1" /> New Agreement
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active" value={activeAgreements.length} color="text-emerald-400" icon={Shield} />
        <StatCard label="Overdue" value={overdue.length} color="text-red-400" icon={AlertTriangle} />
        <StatCard label="Upcoming" value={upcoming.length} color="text-amber-400" icon={Calendar} />
        <StatCard label="Rewards" value={pendingRewards.length} color="text-violet-400" icon={Gift} />
      </div>

      <Tabs defaultValue="agreements" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="agreements" className="text-xs sm:text-sm">
            Agreements
          </TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs sm:text-sm">
            Reminders
            {overdue.length > 0 && (
              <span className="ml-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {overdue.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs sm:text-sm">
            Rewards
          </TabsTrigger>
        </TabsList>

        {/* Agreements Tab */}
        <TabsContent value="agreements" className="space-y-2">
          {agreements.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No service agreements yet"
              description="Create agreements to track installations and schedule service visits."
              actionLabel="New Agreement"
              onAction={() => setShowCreate(true)}
            />
          ) : (
            agreements.map((a) => (
              <Card key={a._id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{a.customerName}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            a.status === "active"
                              ? "text-emerald-400 border-emerald-500/30"
                              : "text-muted-foreground"
                          }`}
                        >
                          {a.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {a.equipmentInstalled}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                        <span>
                          Installed:{" "}
                          {new Date(a.installDate).toLocaleDateString()}
                        </span>
                        {a.monthlyFee > 0 && <span>${a.monthlyFee}/mo</span>}
                        {a.nextServiceDate && (
                          <span
                            className={
                              a.nextServiceDate < Date.now() ? "text-red-400" : ""
                            }
                          >
                            Next service:{" "}
                            {new Date(a.nextServiceDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 px-2 shrink-0 w-fit"
                      onClick={async () => {
                        await logVisit({
                          agreementId: a._id,
                          serviceType: "filter_change",
                        });
                        toast.success("Service visit logged");
                      }}
                    >
                      <Wrench className="size-3 mr-1" /> Log Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          {overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">
                Overdue
              </h3>
              {overdue.map((r) => (
                <Card key={r._id} className="border-red-500/20">
                  <CardContent className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{r.customerName}</p>
                      <p className="text-[11px] text-red-400">
                        {r.reminderType.replace("_", " ")} — Due{" "}
                        {new Date(r.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2"
                        onClick={async () => {
                          await snoozeReminder({
                            reminderId: r._id,
                            newDueDate: Date.now() + 7 * 86400000,
                          });
                          toast.success("Snoozed 7 days");
                        }}
                      >
                        Snooze
                      </Button>
                      <Button
                        size="sm"
                        className="text-[11px] h-7 px-2"
                        onClick={async () => {
                          await completeReminder({ reminderId: r._id });
                          toast.success("Completed");
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Upcoming
              </h3>
              {upcoming.map((r) => (
                <Card key={r._id}>
                  <CardContent className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{r.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.reminderType.replace("_", " ")} — Due{" "}
                        {new Date(r.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 px-2 w-fit shrink-0"
                      onClick={async () => {
                        await completeReminder({ reminderId: r._id });
                        toast.success("Completed");
                      }}
                    >
                      Done
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {overdue.length === 0 && upcoming.length === 0 && (
            <EmptyState
              icon={RefreshCw}
              title="No reminders"
              description="Reminders will show up when service agreements are due."
            />
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-2">
          {rewards.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No referral rewards yet"
              description="Rewards are created when customers refer others."
            />
          ) : (
            rewards.map((r) => (
              <Card key={r._id}>
                <CardContent className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{r.referrerName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.rewardType} — ${r.rewardAmount} · Code: {r.referralCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        r.status === "redeemed"
                          ? "text-emerald-400 border-emerald-500/30"
                          : "text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {r.status}
                    </Badge>
                    {r.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2"
                        onClick={async () => {
                          await redeemReward({ rewardId: r._id });
                          toast.success("Reward redeemed");
                        }}
                      >
                        Redeem
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Agreement Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Service Agreement</DialogTitle>
            <DialogDescription>
              Track an installation and set up service reminders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Equipment Installed</Label>
              <Input
                value={form.equipmentInstalled}
                onChange={(e) => setForm({ ...form, equipmentInstalled: e.target.value })}
                placeholder="Whole Home Filtration + Softener"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Install Date *</Label>
                <Input
                  type="date"
                  value={form.installDate}
                  onChange={(e) => setForm({ ...form, installDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Fee ($)</Label>
                <Input
                  type="number"
                  value={form.monthlyFee}
                  onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                  placeholder="29"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAgreement}
              disabled={!form.customerName.trim() || !form.installDate}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
