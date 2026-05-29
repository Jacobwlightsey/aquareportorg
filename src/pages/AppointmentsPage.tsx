import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutList,
  MapPin,
  Phone,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

const TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  demo: { bg: "bg-cyan-500/10", text: "text-cyan-400", bar: "bg-cyan-500" },
  follow_up: { bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-500" },
  service: { bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500" },
  re_test: { bg: "bg-violet-500/10", text: "text-violet-400", bar: "bg-violet-500" },
  install: { bg: "bg-blue-500/10", text: "text-blue-400", bar: "bg-blue-500" },
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "border-amber-500/30 text-amber-400",
  confirmed: "border-emerald-500/30 text-emerald-400",
  completed: "border-blue-500/30 text-blue-400",
  cancelled: "border-red-500/30 text-red-400",
  no_show: "border-red-500/30 text-red-400",
};

export function AppointmentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => new Date());
  const appointments = useQuery(api.appointments.getAppointments, {}) ?? [];
  const leads = useQuery(api.leads.getLeads) ?? [];
  const createAppointment = useMutation(api.appointments.createAppointment);
  const updateAppointment = useMutation(api.appointments.updateAppointment);

  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    scheduledAt: "",
    durationMinutes: "60",
    type: "demo",
    notes: "",
  });

  // Group by day
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of appointments) {
      if (a.status === "cancelled") continue;
      const key = new Date(a.scheduledAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return Object.entries(map).sort(
      ([, a], [, b]) => a[0].scheduledAt - b[0].scheduledAt
    );
  }, [appointments]);

  const todayStr = new Date().toDateString();
  const upcoming = appointments.filter(
    (a) => a.scheduledAt > Date.now() && a.status !== "cancelled"
  );
  const todayCount = appointments.filter(
    (a) =>
      new Date(a.scheduledAt).toDateString() === todayStr &&
      a.status !== "cancelled"
  ).length;
  const weekCount = upcoming.filter(
    (a) => a.scheduledAt < Date.now() + 7 * 86400000
  ).length;

  const handleCreate = async () => {
    if (!form.customerName.trim() || !form.scheduledAt) return;
    try {
      await createAppointment({
        customerName: form.customerName,
        customerPhone: form.customerPhone || undefined,
        customerEmail: form.customerEmail || undefined,
        customerAddress: form.customerAddress || undefined,
        scheduledAt: new Date(form.scheduledAt).getTime(),
        durationMinutes: parseInt(form.durationMinutes) || 60,
        type: form.type,
        notes: form.notes || undefined,
        ...(selectedLeadId && selectedLeadId !== "_none" ? { leadId: selectedLeadId as any } : {}),
      });
      toast.success("Appointment scheduled");
      setShowCreate(false);
      setSelectedLeadId("");
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        scheduledAt: "",
        durationMinutes: "60",
        type: "demo",
        notes: "",
      });
    } catch {
      toast.error("Failed to create appointment");
    }
  };

  const handleStatus = async (id: any, status: string) => {
    try {
      await updateAppointment({ appointmentId: id, status });
      toast.success(`Appointment ${status}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Appointments"
        subtitle={`${todayCount} today · ${upcoming.length} upcoming`}
        icon={Calendar}
        iconColor="text-cyan-400"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="List view"
              >
                <LayoutList className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-1.5 rounded ${viewMode === "calendar" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Calendar view"
              >
                <Calendar className="size-4" />
              </button>
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 mr-1" /> Schedule
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Today" value={todayCount} color="text-cyan-400" icon={Calendar} />
        <StatCard label="This Week" value={weekCount} color="text-emerald-400" icon={Clock} />
        <StatCard label="Upcoming" value={upcoming.length} color="text-amber-400" icon={MapPin} />
      </div>

      {/* Calendar or List */}
      {viewMode === "calendar" ? (
        (() => {
          const year = calMonth.getFullYear();
          const month = calMonth.getMonth();
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const days = Array.from({ length: 42 }, (_, i) => {
            const d = i - firstDay + 1;
            if (d < 1 || d > daysInMonth) return null;
            return d;
          });
          const monthLabel = calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          return (
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between p-4 border-b">
                <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-muted"><ChevronLeft className="size-5" /></button>
                <h3 className="font-semibold">{monthLabel}</h3>
                <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-muted"><ChevronRight className="size-5" /></button>
              </div>
              <div className="grid grid-cols-7">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} className="p-2 text-center text-[10px] font-medium text-muted-foreground uppercase">{d}</div>
                ))}
                {days.map((day, i) => {
                  if (day === null) return <div key={i} className="min-h-[80px] border-t border-r last:border-r-0 bg-muted/30" />;
                  const dayStart = new Date(year, month, day).getTime();
                  const dayEnd = dayStart + 86400000;
                  const dayAppts = appointments.filter((a) => a.scheduledAt >= dayStart && a.scheduledAt < dayEnd);
                  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                  return (
                    <div key={i} className={`min-h-[80px] border-t border-r last:border-r-0 p-1 ${isToday ? "bg-cyan-500/5" : ""}`}>
                      <span className={`text-xs font-medium ${isToday ? "bg-cyan-500 text-white rounded-full size-6 flex items-center justify-center" : "text-muted-foreground"}`}>
                        {day}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayAppts.slice(0, 3).map((a) => {
                          const tc = TYPE_COLORS[a.type] || TYPE_COLORS.demo;
                          return (
                            <div key={a._id} className={`text-[10px] px-1 py-0.5 rounded ${tc.bg} ${tc.text} truncate`}>
                              {new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} {a.customerName}
                            </div>
                          );
                        })}
                        {dayAppts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments scheduled"
          description="Schedule your first appointment to get started."
          actionLabel="Schedule Appointment"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, appts]) => (
            <div key={date}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1 z-10">
                {date}
              </h3>
              <div className="space-y-2">
                {appts
                  .sort((a: any, b: any) => a.scheduledAt - b.scheduledAt)
                  .map((appt: any) => {
                    const ts = TYPE_COLORS[appt.type] || TYPE_COLORS.demo;
                    return (
                      <Card key={appt._id} className="overflow-hidden">
                        <div className="flex">
                          <div className={`w-1 ${ts.bar} shrink-0`} />
                          <CardContent className="flex-1 p-3 sm:p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm">
                                    {appt.customerName}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] border-0 ${ts.bg} ${ts.text}`}
                                  >
                                    {appt.type.replace("_", " ")}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${STATUS_COLORS[appt.status] || ""}`}
                                  >
                                    {appt.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {new Date(appt.scheduledAt).toLocaleTimeString(
                                      [],
                                      { hour: "numeric", minute: "2-digit" }
                                    )}{" "}
                                    · {appt.durationMinutes}min
                                  </span>
                                  {appt.customerPhone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="size-3" />
                                      {appt.customerPhone}
                                    </span>
                                  )}
                                  {appt.customerAddress && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="size-3" />
                                      <span className="truncate max-w-[180px]">
                                        {appt.customerAddress}
                                      </span>
                                    </span>
                                  )}
                                </div>
                                {appt.notes && (
                                  <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">
                                    {appt.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1.5 shrink-0 self-start">
                                {appt.status === "scheduled" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-[11px] h-7 px-2"
                                      onClick={() => handleStatus(appt._id, "confirmed")}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-[11px] h-7 px-2"
                                      onClick={() => handleStatus(appt._id, "completed")}
                                    >
                                      Complete
                                    </Button>
                                  </>
                                )}
                                {appt.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[11px] h-7 px-2"
                                    onClick={() => handleStatus(appt._id, "completed")}
                                  >
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Add a new appointment to your calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Link to existing lead */}
            {leads.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Lead <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Select
                  value={selectedLeadId}
                  onValueChange={(val) => {
                    setSelectedLeadId(val);
                    if (val && val !== "_none") {
                      const lead = leads.find((l: any) => l._id === val);
                      if (lead) {
                        setForm((f) => ({
                          ...f,
                          customerName: lead.name || f.customerName,
                          customerPhone: lead.phone || f.customerPhone,
                          customerEmail: lead.email || f.customerEmail,
                        }));
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No lead (manual entry)</SelectItem>
                    {leads.map((lead: any) => (
                      <SelectItem key={lead._id} value={lead._id}>
                        {lead.name}{lead.phone ? ` — ${lead.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                <Label>Phone</Label>
                <Input
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="john@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.customerAddress}
                onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">Demo / Presentation</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="install">Installation</SelectItem>
                  <SelectItem value="service">Service Visit</SelectItem>
                  <SelectItem value="re_test">Re-Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this appointment..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.customerName.trim() || !form.scheduledAt}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
