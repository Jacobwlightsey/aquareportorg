import { useMutation, useQuery } from "convex/react";
import {
  Clock,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
  Zap,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

export function FollowUpsPage() {
  const sequences = useQuery(api.followUps.getSequences) ?? [];
  const messages = useQuery(api.followUps.getMessages, {}) ?? [];
  const createSequence = useMutation(api.followUps.createSequence);
  const updateSequence = useMutation(api.followUps.updateSequence);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "after_demo",
    steps: [
      { channel: "email", delayDays: 1, subject: "Thanks for your time!", body: "Hi {{name}}, thanks for letting us test your water..." },
      { channel: "email", delayDays: 3, subject: "Your water report is ready", body: "Hi {{name}}, we've finalized your water quality report..." },
      { channel: "sms", delayDays: 7, subject: "", body: "Hi {{name}}, just checking in about your water treatment options..." },
    ],
  });

  const pendingMessages = messages.filter((m) => m.status === "pending").length;
  const sentMessages = messages.filter((m) => m.status === "sent").length;
  const activeSequences = sequences.filter((s) => s.isActive).length;

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createSequence({
        name: form.name,
        trigger: form.trigger,
        steps: JSON.stringify(form.steps),
      });
      toast.success("Sequence created");
      setShowCreate(false);
    } catch {
      toast.error("Failed to create sequence");
    }
  };

  const toggleActive = async (seq: any) => {
    try {
      await updateSequence({ sequenceId: seq._id, isActive: !seq.isActive });
      toast.success(seq.isActive ? "Sequence paused" : "Sequence activated");
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Follow-Ups"
        subtitle="Automated follow-up sequences and messages."
        icon={Mail}
        iconColor="text-blue-400"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1" /> New Sequence
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active" value={activeSequences} color="text-emerald-400" icon={Zap} />
        <StatCard label="Pending" value={pendingMessages} color="text-amber-400" icon={Clock} />
        <StatCard label="Sent" value={sentMessages} color="text-cyan-400" icon={Send} />
      </div>

      <Tabs defaultValue="sequences" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="sequences" className="text-xs sm:text-sm">Sequences</TabsTrigger>
          <TabsTrigger value="messages" className="text-xs sm:text-sm">Message Log</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="space-y-2">
          {sequences.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No follow-up sequences"
              description="Create automated sequences to follow up with customers after demos, reports, and proposals."
              actionLabel="Create Sequence"
              onAction={() => setShowCreate(true)}
            />
          ) : (
            sequences.map((seq) => {
              const steps = seq.steps ? JSON.parse(seq.steps) : [];
              return (
                <Card key={seq._id} className="hover:border-border transition-colors">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{seq.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              seq.isActive
                                ? "text-emerald-400 border-emerald-500/30"
                                : "text-muted-foreground"
                            }`}
                          >
                            {seq.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Trigger: {seq.trigger.replace("_", " ")} · {steps.length} steps
                        </p>
                        {/* Step timeline */}
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {steps.map((step: any, i: number) => (
                            <div key={i} className="flex items-center gap-1">
                              {i > 0 && <div className="h-px w-3 bg-muted/20" />}
                              <div
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  step.channel === "email"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "bg-emerald-500/10 text-emerald-400"
                                }`}
                              >
                                D{step.delayDays}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2 shrink-0 w-fit"
                        onClick={() => toggleActive(seq)}
                      >
                        {seq.isActive ? (
                          <Pause className="size-3 mr-1" />
                        ) : (
                          <Play className="size-3 mr-1" />
                        )}
                        {seq.isActive ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-2">
          {messages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Messages will appear here as your follow-up sequences run."
            />
          ) : (
            messages.slice(0, 50).map((m) => (
              <Card key={m._id}>
                <CardContent className="p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        m.channel === "email" ? "bg-blue-500/10" : "bg-emerald-500/10"
                      }`}
                    >
                      {m.channel === "email" ? (
                        <Mail className="size-3.5 text-blue-400" />
                      ) : (
                        <MessageSquare className="size-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.subject || m.body?.slice(0, 50)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.recipientEmail || m.recipientPhone || "Unknown"} ·{" "}
                        {new Date(m.scheduledAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 w-fit ${
                      m.status === "sent"
                        ? "text-emerald-400 border-emerald-500/30"
                        : m.status === "pending"
                          ? "text-amber-400 border-amber-500/30"
                          : m.status === "failed"
                            ? "text-red-400 border-red-500/30"
                            : "text-muted-foreground"
                    }`}
                  >
                    {m.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Follow-Up Sequence</DialogTitle>
            <DialogDescription>
              Build an automated follow-up sequence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sequence Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Post-Demo Follow-Up"
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={form.trigger}
                onValueChange={(v) => setForm({ ...form, trigger: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="after_demo">After Demo</SelectItem>
                  <SelectItem value="after_report">After Report</SelectItem>
                  <SelectItem value="after_proposal">After Proposal</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Steps</Label>
              {form.steps.map((step, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-border bg-muted/5 space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      Step {i + 1}
                    </Badge>
                    <Select
                      value={step.channel}
                      onValueChange={(v) => {
                        const steps = [...form.steps];
                        steps[i].channel = v;
                        setForm({ ...form, steps });
                      }}
                    >
                      <SelectTrigger className="w-20 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="w-16 h-7 text-xs"
                        value={step.delayDays}
                        onChange={(e) => {
                          const steps = [...form.steps];
                          steps[i].delayDays = parseInt(e.target.value) || 0;
                          setForm({ ...form, steps });
                        }}
                      />
                      <span className="text-[11px] text-muted-foreground">days</span>
                    </div>
                  </div>
                  {step.channel === "email" && (
                    <Input
                      className="h-7 text-xs"
                      value={step.subject}
                      onChange={(e) => {
                        const steps = [...form.steps];
                        steps[i].subject = e.target.value;
                        setForm({ ...form, steps });
                      }}
                      placeholder="Subject line"
                    />
                  )}
                  <Textarea
                    className="text-xs min-h-[36px]"
                    value={step.body}
                    onChange={(e) => {
                      const steps = [...form.steps];
                      steps[i].body = e.target.value;
                      setForm({ ...form, steps });
                    }}
                    placeholder="Message body... use {{name}} for customer name"
                    rows={2}
                  />
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() =>
                  setForm({
                    ...form,
                    steps: [
                      ...form.steps,
                      { channel: "email", delayDays: 14, subject: "", body: "" },
                    ],
                  })
                }
              >
                <Plus className="size-3 mr-1" /> Add Step
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!form.name.trim()}>
              Create Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
