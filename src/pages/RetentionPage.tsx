import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Filter,
  Gift,
  Plus,
  RefreshCw,
  Shield,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

export function RetentionPage() {
  const agreements = useQuery(api.retention.getServiceAgreements, {}) ?? [];
  const reminders = useQuery(api.retention.getReminders, {}) ?? [];
  const rewards = useQuery(api.retention.getReferralRewards) ?? [];
  const createAgreement = useMutation(api.retention.createServiceAgreement);
  const logVisit = useMutation(api.retention.logServiceVisit);
  const completeReminder = useMutation(api.retention.completeReminder);
  const snoozeReminder = useMutation(api.retention.snoozeReminder);
  const createReminder = useMutation(api.retention.createReminder);
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
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Retention</h1>
          <p className="text-sm text-muted-foreground">Service agreements, reminders, and referral rewards.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-1" /> New Agreement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Shield className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Agreements</p>
              <p className="text-xl font-black">{activeAgreements.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-xl font-black">{overdue.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Calendar className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-xl font-black">{upcoming.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <Gift className="size-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Rewards</p>
              <p className="text-xl font-black">{pendingRewards.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agreements">
        <TabsList>
          <TabsTrigger value="agreements">Service Agreements</TabsTrigger>
          <TabsTrigger value="reminders">
            Reminders
            {overdue.length > 0 && (
              <span className="ml-1.5 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {overdue.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rewards">Referral Rewards</TabsTrigger>
        </TabsList>

        {/* Agreements Tab */}
        <TabsContent value="agreements" className="space-y-3 mt-4">
          {agreements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No service agreements yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create agreements to track installations and schedule service visits.
                </p>
              </CardContent>
            </Card>
          ) : (
            agreements.map((a) => (
              <Card key={a._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{a.customerName}</p>
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
                      <p className="text-xs text-muted-foreground mt-1">{a.equipmentInstalled}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Installed: {new Date(a.installDate).toLocaleDateString()}</span>
                        {a.monthlyFee > 0 && <span>${a.monthlyFee}/mo</span>}
                        {a.nextServiceDate && (
                          <span className={a.nextServiceDate < Date.now() ? "text-red-400" : ""}>
                            Next service: {new Date(a.nextServiceDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0"
                      onClick={async () => {
                        await logVisit({ agreementId: a._id, serviceType: "filter_change" });
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
        <TabsContent value="reminders" className="space-y-3 mt-4">
          {overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-red-400">Overdue</h3>
              {overdue.map((r) => (
                <Card key={r._id} className="border-red-500/20">
                  <CardContent className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{r.customerName}</p>
                      <p className="text-xs text-red-400">
                        {r.reminderType.replace("_", " ")} — Due {new Date(r.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={async () => {
                          await snoozeReminder({ reminderId: r._id, newDueDate: Date.now() + 7 * 86400000 });
                          toast.success("Snoozed 7 days");
                        }}
                      >
                        Snooze
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs"
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
              <h3 className="text-sm font-bold text-amber-400">Upcoming</h3>
              {upcoming.map((r) => (
                <Card key={r._id}>
                  <CardContent className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{r.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.reminderType.replace("_", " ")} — Due {new Date(r.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
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
            <Card>
              <CardContent className="py-8 text-center">
                <RefreshCw className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No reminders.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-3 mt-4">
          {rewards.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Gift className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No referral rewards yet.</p>
              </CardContent>
            </Card>
          ) : (
            rewards.map((r) => (
              <Card key={r._id}>
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">{r.referrerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.rewardType} — ${r.rewardAmount} · Code: {r.referralCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
                        className="text-xs"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Service Agreement</DialogTitle>
            <DialogDescription>Track an installation and set up service reminders.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreateAgreement}
              disabled={!form.customerName.trim() || !form.installDate}
            >
              Create Agreement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
