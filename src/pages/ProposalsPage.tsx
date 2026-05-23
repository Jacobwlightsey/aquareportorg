import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Clock,
  Copy,
  Eye,
  FileText,
  Link2,
  MoreHorizontal,
  Plus,
  Send,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "text-muted-foreground border-white/20", icon: FileText },
  sent: { label: "Sent", color: "text-blue-400 border-blue-500/30", icon: Send },
  viewed: { label: "Viewed", color: "text-amber-400 border-amber-500/30", icon: Eye },
  accepted: { label: "Accepted", color: "text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  declined: { label: "Declined", color: "text-red-400 border-red-500/30", icon: FileText },
  expired: { label: "Expired", color: "text-muted-foreground border-white/10", icon: Clock },
};

export function ProposalsPage() {
  const proposals = useQuery(api.proposals.getProposals) ?? [];
  const createProposal = useMutation(api.proposals.createProposal);
  const updateProposal = useMutation(api.proposals.updateProposal);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    totalPrice: "",
    monthlyPayment: "",
    equipment: "",
    notes: "",
  });

  const stats = {
    total: proposals.length,
    sent: proposals.filter((p) => ["sent", "viewed"].includes(p.status)).length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    totalValue: proposals.filter((p) => p.status === "accepted").reduce((s, p) => s + p.totalPrice, 0),
  };

  const handleCreate = async () => {
    if (!form.customerName.trim()) return;
    try {
      const equipment = form.equipment
        ? JSON.stringify(
            form.equipment.split("\n").filter(Boolean).map((line) => {
              const [name, price] = line.split("|").map((s) => s.trim());
              return { name: name || line, description: "", price: parseFloat(price) || 0 };
            })
          )
        : JSON.stringify([]);
      await createProposal({
        customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        equipment,
        totalPrice: parseFloat(form.totalPrice) || 0,
        monthlyPayment: form.monthlyPayment ? parseFloat(form.monthlyPayment) : undefined,
        notes: form.notes || undefined,
      });
      toast.success("Proposal created");
      setShowCreate(false);
      setForm({ customerName: "", customerEmail: "", totalPrice: "", monthlyPayment: "", equipment: "", notes: "" });
    } catch {
      toast.error("Failed to create proposal");
    }
  };

  const handleSend = async (id: any) => {
    try {
      await updateProposal({ proposalId: id, status: "sent" });
      toast.success("Proposal marked as sent");
    } catch {
      toast.error("Failed to update proposal");
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/proposal/${token}`);
    toast.success("Proposal link copied!");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Proposals</h1>
          <p className="text-sm text-muted-foreground">Create and track customer proposals.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-1" /> New Proposal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Pending", value: stats.sent, color: "text-amber-400" },
          { label: "Accepted", value: stats.accepted, color: "text-emerald-400" },
          { label: "Revenue", value: `$${stats.totalValue.toLocaleString()}`, color: "text-cyan-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-3">
        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-semibold">No proposals yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first proposal to start closing deals.
              </p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="size-4 mr-1" /> Create Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          proposals.map((proposal) => {
            const statusInfo = STATUS_MAP[proposal.status] || STATUS_MAP.draft;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={proposal._id} className="hover:border-white/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{proposal.customerName}</p>
                        <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                          <StatusIcon className="size-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="font-bold text-emerald-400">
                          ${proposal.totalPrice.toLocaleString()}
                        </span>
                        {proposal.monthlyPayment && (
                          <span>${proposal.monthlyPayment}/mo</span>
                        )}
                        {proposal.customerEmail && <span>{proposal.customerEmail}</span>}
                        <span>{new Date(proposal._creationTime).toLocaleDateString()}</span>
                      </div>
                      {proposal.viewedAt && (
                        <p className="text-[10px] text-amber-400/70 mt-1">
                          Viewed {new Date(proposal.viewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {proposal.shareToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => copyLink(proposal.shareToken!)}
                        >
                          <Copy className="size-3 mr-1" /> Copy Link
                        </Button>
                      )}
                      {proposal.status === "draft" && (
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={() => handleSend(proposal._id)}
                        >
                          <Send className="size-3 mr-1" /> Send
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Proposal</DialogTitle>
            <DialogDescription>Build a proposal for your customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="John Smith"
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
              <Label>Equipment (one per line, use | to separate name and price)</Label>
              <Textarea
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                placeholder="Whole Home Filtration System | 3500&#10;Water Softener | 1200&#10;Installation | 500"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Price ($) *</Label>
                <Input
                  type="number"
                  value={form.totalPrice}
                  onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                  placeholder="5200"
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Payment ($)</Label>
                <Input
                  type="number"
                  value={form.monthlyPayment}
                  onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })}
                  placeholder="89"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Special terms, warranty details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.customerName.trim()}>
              Create Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
