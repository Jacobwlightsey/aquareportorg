import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Plus,
  User,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  demo: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  follow_up: { bg: "bg-amber-500/10", text: "text-amber-400" },
  service: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  re_test: { bg: "bg-violet-500/10", text: "text-violet-400" },
  install: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "border-amber-500/30 text-amber-400",
  confirmed: "border-emerald-500/30 text-emerald-400",
  completed: "border-blue-500/30 text-blue-400",
  cancelled: "border-red-500/30 text-red-400",
  no_show: "border-red-500/30 text-red-400",
};

export function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showCreate, setShowCreate] = useState(false);
  const appointments = useQuery(api.appointments.getAppointments, {}) ?? [];
  const createAppointment = useMutation(api.appointments.createAppointment);
  const updateAppointment = useMutation(api.appointments.updateAppointment);

  const [newAppt, setNewAppt] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    scheduledAt: "",
    durationMinutes: "60",
    type: "demo",
    notes: "",
  });

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of appointments) {
      if (a.status === "cancelled") continue;
      const d = new Date(a.scheduledAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!map[d]) map[d] = [];
      map[d].push(a);
    }
    return Object.entries(map).sort(([, a], [, b]) => a[0].scheduledAt - b[0].scheduledAt);
  }, [appointments]);

  const upcoming = appointments.filter((a) => a.scheduledAt > Date.now() && a.status !== "cancelled");
  const todayCount = appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    const today = new Date();
    return d.toDateString() === today.toDateString() && a.status !== "cancelled";
  }).length;

  const handleCreate = async () => {
    if (!newAppt.customerName.trim() || !newAppt.scheduledAt) return;
    try {
      await createAppointment({
        customerName: newAppt.customerName,
        customerPhone: newAppt.customerPhone || undefined,
        customerEmail: newAppt.customerEmail || undefined,
        customerAddress: newAppt.customerAddress || undefined,
        scheduledAt: new Date(newAppt.scheduledAt).getTime(),
        durationMinutes: parseInt(newAppt.durationMinutes) || 60,
        type: newAppt.type,
        notes: newAppt.notes || undefined,
      });
      toast.success("Appointment scheduled");
      setShowCreate(false);
      setNewAppt({
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

  const handleStatusUpdate = async (id: any, status: string) => {
    try {
      await updateAppointment({ appointmentId: id, status });
      toast.success(`Appointment ${status}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            {todayCount} today · {upcoming.length} upcoming
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-1" /> Schedule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today", value: todayCount, color: "text-cyan-400" },
          { label: "This Week", value: upcoming.filter((a) => a.scheduledAt < Date.now() + 7 * 86400000).length, color: "text-emerald-400" },
          { label: "Upcoming", value: upcoming.length, color: "text-amber-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointment List */}
      <div className="space-y-6">
        {grouped.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-semibold">No appointments scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule your first appointment to get started.
              </p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="size-4 mr-1" /> Schedule Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          grouped.map(([date, appts]) => (
            <div key={date}>
              <h3 className="text-sm font-bold text-muted-foreground mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-1">
                {date}
              </h3>
              <div className="space-y-3">
                {appts
                  .sort((a: any, b: any) => a.scheduledAt - b.scheduledAt)
                  .map((appt: any) => {
                    const typeStyle = TYPE_COLORS[appt.type] || TYPE_COLORS.demo;
                    return (
                      <Card key={appt._id} className="overflow-hidden">
                        <div className="flex">
                          <div className={`w-1.5 ${TYPE_COLORS[appt.type]?.bg?.replace("/10", "") || "bg-cyan-500"}`} />
                          <CardContent className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold">{appt.customerName}</p>
                                  <Badge variant="outline" className={`text-[10px] ${typeStyle.bg} ${typeStyle.text} border-0`}>
                                    {appt.type.replace("_", " ")}
                                  </Badge>
                                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[appt.status] || ""}`}>
                                    {appt.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {new Date(appt.scheduledAt).toLocaleTimeString([], {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}{" "}
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
                                      {appt.customerAddress}
                                    </span>
                                  )}
                                </div>
                                {appt.notes && (
                                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                                    {appt.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {appt.status === "scheduled" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => handleStatusUpdate(appt._id, "confirmed")}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => handleStatusUpdate(appt._id, "completed")}
                                    >
                                      Complete
                                    </Button>
                                  </>
                                )}
                                {appt.status === "confirmed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => handleStatusUpdate(appt._id, "completed")}
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
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>Add a new appointment to your calendar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={newAppt.customerName}
                onChange={(e) => setNewAppt({ ...newAppt, customerName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newAppt.customerPhone}
                  onChange={(e) => setNewAppt({ ...newAppt, customerPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={newAppt.customerEmail}
                  onChange={(e) => setNewAppt({ ...newAppt, customerEmail: e.target.value })}
                  placeholder="john@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={newAppt.customerAddress}
                onChange={(e) => setNewAppt({ ...newAppt, customerAddress: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={newAppt.scheduledAt}
                  onChange={(e) => setNewAppt({ ...newAppt, scheduledAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={newAppt.durationMinutes}
                  onChange={(e) => setNewAppt({ ...newAppt, durationMinutes: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newAppt.type} onValueChange={(v) => setNewAppt({ ...newAppt, type: v })}>
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
                value={newAppt.notes}
                onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                placeholder="Any notes about this appointment..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newAppt.customerName.trim() || !newAppt.scheduledAt}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
