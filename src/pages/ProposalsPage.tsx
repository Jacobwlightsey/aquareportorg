import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  Copy,
  Eye,
  FileText,
  Plus,
  Send,
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
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "text-muted-foreground border-white/20", icon: FileText },
  sent: { label: "Sent", color: "text-blue-400 border-blue-500/30", icon: Send },
  viewed: { label: "Viewed", color: "text-amber-400 border-amber-500/30", icon: Eye },
  accepted: { label: "Accepted", color: "text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  declined: { label: "Declined", color: "text-red-400 border-red-500/30", icon: FileText },
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
    pending: proposals.filter((p) => ["sent", "viewed"].includes(p.status)).length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    revenue: proposals
      .filter((p) => p.status === "accepted")
      .reduce((s, p) => s + p.totalPrice, 0),
  };

  const handleCreate = async () => {
    if (!form.customerName.trim()) return;
    try {
      const equipment = form.equipment
        ? JSON.stringify(
            form.equipment
              .split("\n")
              .filter(Boolean)
              .map((line) => {
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
    toast.success("Link copied!");
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Proposals"
        subtitle="Create and track customer proposals."
        icon={FileText}
        iconColor="text-violet-400"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1" /> New Proposal
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color="text-white" icon={FileText} />
        <StatCard label="Pending" value={stats.pending} color="text-amber-400" icon={Eye} />
        <StatCard label="Accepted" value={stats.accepted} color="text-emerald-400" icon={CheckCircle} />
        <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} color="text-cyan-400" />
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No proposals yet"
          description="Create your first proposal to start closing deals."
          actionLabel="Create Proposal"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-2">
          {proposals.map((proposal) => {
            const si = STATUS_MAP[proposal.status] || STATUS_MAP.draft;
            const StatusIcon = si.icon;
            return (
              <Card key={proposal._id} className="hover:border-white/20 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{proposal.customerName}</p>
                        <Badge variant="outline" className={`text-[10px] ${si.color}`}>
                          <StatusIcon className="size-3 mr-1" />
                          {si.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="font-bold text-emerald-400">
                          ${proposal.totalPrice.toLocaleString()}
                        </span>
                        {proposal.monthlyPayment && (
                          <span>${proposal.monthlyPayment}/mo</span>
                        )}
                        {proposal.customerEmail && (
                          <span className="hidden sm:inline">{proposal.customerEmail}</span>
                        )}
                        <span>
                          {new Date(proposal._creationTime).toLocaleDateString()}
                        </span>
                      </div>
                      {proposal.viewedAt && (
                        <p className="text-[10px] text-amber-400/60 mt-0.5">
                          Viewed {new Date(proposal.viewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {proposal.shareToken && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 px-2"
                          onClick={() => copyLink(proposal.shareToken!)}
                        >
                          <Copy className="size-3 mr-1" /> Link
                        </Button>
                      )}
                      {proposal.status === "draft" && (
                        <Button
                          size="sm"
                          className="text-[11px] h-7 px-2"
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
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Proposal</DialogTitle>
            <DialogDescription>Build a proposal for your customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
              <Label>Equipment (one per line, use | for price)</Label>
              <Textarea
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                placeholder={"Whole Home Filtration | 3500\nWater Softener | 1200\nInstallation | 500"}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Monthly ($)</Label>
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
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!form.customerName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
