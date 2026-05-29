import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Send,
  Wrench,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function statusBadge(status?: string) {
  switch (status) {
    case "dates_sent":
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Dates Sent</Badge>;
    case "customer_selected":
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Awaiting Approval</Badge>;
    case "approved":
      return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Approved</Badge>;
    case "completed":
      return <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">Completed</Badge>;
    default:
      return <Badge className="bg-muted text-muted-foreground">No Dates</Badge>;
  }
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InstallsPage() {
  const installs = useQuery(api.installs.getInstalls) ?? [];
  const suggestDates = useMutation(api.installs.suggestInstallDates);
  const approveInstall = useMutation(api.installs.approveInstall);
  const rejectInstall = useMutation(api.installs.rejectInstall);
  const completeInstall = useMutation(api.installs.completeInstall);

  const [showSchedule, setShowSchedule] = useState<Id<"contracts"> | null>(null);
  const [datePicks, setDatePicks] = useState<string[]>(["", "", ""]);
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pending = installs.filter((p) => p.installStatus === "customer_selected");
  const upcoming = installs.filter((p) => p.installStatus === "approved");
  const sent = installs.filter((p) => p.installStatus === "dates_sent");
  const completed = installs.filter((p) => p.installStatus === "completed");
  const unscheduled = installs.filter((p) => !p.installStatus || p.installStatus === "pending_dates");

  const handleSuggestDates = async () => {
    if (!showSchedule) return;
    const validDates = datePicks
      .filter((d) => d)
      .map((d) => new Date(d).getTime())
      .filter((t) => t > Date.now());
    if (validDates.length === 0) {
      toast.error("Add at least one future date");
      return;
    }
    setSubmitting(true);
    try {
      await suggestDates({
        contractId: showSchedule,
        dates: validDates,
        notes: scheduleNotes || undefined,
      });
      toast.success("Install dates sent to customer!");
      setShowSchedule(null);
      setDatePicks(["", "", ""]);
      setScheduleNotes("");
    } catch {
      toast.error("Failed to send dates");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Install Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule, track, and approve installations
          </p>
        </div>
      </div>

      {/* ── Pending Approval (owner action required) ── */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <CalendarClock className="size-4" /> Awaiting Your Approval ({pending.length})
          </h2>
          {pending.map((p) => (
            <Card key={p._id} className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {(p as any).customerName || "Customer"} — {(p as any).systemName || "System Install"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Customer selected: <span className="font-medium text-amber-400">{formatDate(p.customerSelectedDate)}</span>
                    </p>
                    {p.installNotes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{p.installNotes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                      onClick={async () => {
                        await rejectInstall({ contractId: p._id });
                        toast.success("Sent back for reschedule");
                      }}
                    >
                      <X className="size-3 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white"
                      onClick={async () => {
                        await approveInstall({ contractId: p._id });
                        toast.success("Install approved!");
                      }}
                    >
                      <Check className="size-3 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Upcoming Approved Installs ── */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-green-400 flex items-center gap-2">
            <CalendarCheck className="size-4" /> Approved & Upcoming ({upcoming.length})
          </h2>
          {upcoming.map((p) => (
            <Card key={p._id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">
                    {(p as any).customerName || "Customer"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Calendar className="size-3 inline mr-1" />{formatDate(p.installDate)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await completeInstall({ contractId: p._id });
                    toast.success("Marked as completed!");
                  }}
                >
                  <Wrench className="size-3 mr-1" /> Mark Complete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Dates Sent — waiting on customer ── */}
      {sent.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
            <Clock className="size-4" /> Waiting on Customer ({sent.length})
          </h2>
          {sent.map((p) => (
            <Card key={p._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{(p as any).customerName || "Customer"}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {p.suggestedInstallDates?.map((d, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{formatDate(d)}</Badge>
                      ))}
                    </div>
                  </div>
                  {statusBadge(p.installStatus)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Unscheduled — need dates ── */}
      {unscheduled.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Calendar className="size-4" /> Ready to Schedule ({unscheduled.length})
          </h2>
          {unscheduled.map((p) => (
            <Card key={p._id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm text-foreground">{(p as any).customerName || "Customer"}</p>
                  <p className="text-xs text-muted-foreground">Signed — ready for install scheduling</p>
                </div>
                <Button size="sm" onClick={() => setShowSchedule(p._id)}>
                  <Send className="size-3 mr-1" /> Schedule
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Completed ── */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Check className="size-4" /> Completed ({completed.length})
          </h2>
          {completed.slice(0, 10).map((p) => (
            <Card key={p._id} className="opacity-60">
              <CardContent className="p-3 flex items-center justify-between">
                <p className="text-sm text-foreground">{(p as any).customerName || "Customer"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(p.installDate)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {installs.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Wrench className="size-12 mx-auto text-muted-foreground/30" />
          <p className="text-lg font-semibold text-foreground">No installs yet</p>
          <p className="text-sm text-muted-foreground">
            Signed contracts will appear here for install scheduling.
          </p>
        </div>
      )}

      {/* ── Schedule Dialog ── */}
      <Dialog open={!!showSchedule} onOpenChange={() => setShowSchedule(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="size-4" /> Suggest Install Dates
            </DialogTitle>
            <DialogDescription>
              Choose up to 3 dates for the customer to pick from. The owner will approve the final date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {datePicks.map((d, i) => (
              <div key={i}>
                <Label className="text-xs text-muted-foreground">Option {i + 1}{i === 0 ? " *" : ""}</Label>
                <Input
                  type="date"
                  value={d}
                  onChange={(e) => {
                    const next = [...datePicks];
                    next[i] = e.target.value;
                    setDatePicks(next);
                  }}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            ))}
            <div>
              <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
              <Textarea
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                rows={2}
                placeholder="Morning preferred, ask for gate code..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchedule(null)}>Cancel</Button>
            <Button onClick={handleSuggestDates} disabled={submitting || !datePicks[0]}>
              {submitting ? <Loader2 className="size-3 animate-spin mr-1" /> : <Send className="size-3 mr-1" />}
              Send to Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
