import { useMutation, useQuery } from "convex/react";
import {
  Clock,
  Mail,
  MessageSquare,
  MoreHorizontal,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Follow-Ups</h1>
          <p className="text-sm text-muted-foreground">Automated follow-up sequences and messages.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-1" /> New Sequence
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Zap className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Sequences</p>
              <p className="text-xl font-black">{activeSequences}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Clock className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Messages</p>
              <p className="text-xl font-black">{pendingMessages}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10">
              <Send className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Messages Sent</p>
              <p className="text-xl font-black">{sentMessages}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sequences">
        <TabsList>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="messages">Message Log</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="space-y-3 mt-4">
          {sequences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No follow-up sequences</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create automated sequences to follow up with customers.
                </p>
                <Button className="mt-4" onClick={() => setShowCreate(true)}>
                  <Plus className="size-4 mr-1" /> Create Sequence
                </Button>
              </CardContent>
            </Card>
          ) : (
            sequences.map((seq) => {
              const steps = seq.steps ? JSON.parse(seq.steps) : [];
              return (
                <Card key={seq._id} className="hover:border-white/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{seq.name}</p>
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
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span>Trigger: {seq.trigger.replace("_", " ")}</span>
                          <span>{steps.length} steps</span>
                          <span>
                            {steps.map((s: any) => s.channel).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(", ")}
                          </span>
                        </div>
                        {/* Step timeline */}
                        <div className="flex items-center gap-1 mt-2">
                          {steps.map((step: any, i: number) => (
                            <div key={i} className="flex items-center gap-1">
                              {i > 0 && (
                                <div className="h-px w-4 bg-white/10" />
                              )}
                              <div
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  step.channel === "email"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "bg-emerald-500/10 text-emerald-400"
                                }`}
                              >
                                Day {step.delayDays}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs shrink-0"
                        onClick={() => toggleActive(seq)}
                      >
                        {seq.isActive ? <Pause className="size-3 mr-1" /> : <Play className="size-3 mr-1" />}
                        {seq.isActive ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-2 mt-4">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              </CardContent>
            </Card>
          ) : (
            messages.slice(0, 50).map((m) => (
              <Card key={m._id}>
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
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
                    className={`text-[10px] ${
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Follow-Up Sequence</DialogTitle>
            <DialogDescription>Build an automated follow-up sequence.</DialogDescription>
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
              <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="after_demo">After Demo</SelectItem>
                  <SelectItem value="after_report">After Report Created</SelectItem>
                  <SelectItem value="after_proposal">After Proposal Sent</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Steps</Label>
              {form.steps.map((step, i) => (
                <div key={i} className="p-3 rounded-lg border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Step {i + 1}</Badge>
                    <Select
                      value={step.channel}
                      onValueChange={(v) => {
                        const steps = [...form.steps];
                        steps[i].channel = v;
                        setForm({ ...form, steps });
                      }}
                    >
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="w-20 h-7 text-xs"
                      value={step.delayDays}
                      onChange={(e) => {
                        const steps = [...form.steps];
                        steps[i].delayDays = parseInt(e.target.value) || 0;
                        setForm({ ...form, steps });
                      }}
                      placeholder="Days"
                    />
                    <span className="text-xs text-muted-foreground">days</span>
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
                    className="text-xs min-h-[40px]"
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
                    steps: [...form.steps, { channel: "email", delayDays: 14, subject: "", body: "" }],
                  })
                }
              >
                <Plus className="size-3 mr-1" /> Add Step
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim()}>
              Create Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
