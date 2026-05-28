import { useMutation, useQuery } from "convex/react";
import { CheckCircle, ChevronDown, ChevronUp, Clock, Copy, DollarSign, Edit3, Eye, FileText, Package, Plus, Save, Send, XCircle } from "lucide-react";
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

import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

/* ─── Status config ─── */
const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; icon: any; next?: string; nextLabel?: string }
> = {
  draft: {
    label: "Draft",
    color: "text-muted-foreground border-border",
    bg: "bg-muted",
    icon: FileText,
    next: "sent",
    nextLabel: "Mark Sent",
  },
  sent: {
    label: "Sent",
    color: "text-blue-400 border-blue-500/30",
    bg: "bg-blue-500/10",
    icon: Send,
  },
  viewed: {
    label: "Viewed",
    color: "text-amber-400 border-amber-500/30",
    bg: "bg-amber-500/10",
    icon: Eye,
  },
  accepted: {
    label: "Accepted",
    color: "text-emerald-400 border-emerald-500/30",
    bg: "bg-emerald-500/10",
    icon: CheckCircle,
  },
  declined: {
    label: "Declined",
    color: "text-red-400 border-red-500/30",
    bg: "bg-red-500/10",
    icon: XCircle,
  },
};

const STATUS_ORDER = ["draft", "sent", "viewed", "accepted"];

/* ─── Helpers ─── */
function parseEquipment(raw?: string): { name: string; description: string; price: number }[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─── Status progress bar ─── */
function StatusProgress({ status }: { status: string }) {
  const idx = STATUS_ORDER.indexOf(status);
  const activeIdx = status === "declined" ? -1 : idx;
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_ORDER.map((s, i) => {
        const isActive = i <= activeIdx;

        return (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div
              className={`h-1.5 rounded-full flex-1 transition-colors ${
                isActive ? (status === "accepted" && i === 3 ? "bg-emerald-500" : "bg-cyan-500") : "bg-muted/12"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Equipment line items ─── */
function EquipmentList({ items }: { items: { name: string; description: string; price: number }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Package className="size-3" /> Equipment
      </p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/5 border border-border">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{item.name}</p>
            {item.description && (
              <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
            )}
          </div>
          {item.price > 0 && (
            <span className="text-xs font-bold text-emerald-400 tabular-nums shrink-0 ml-3">
              ${item.price.toLocaleString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Proposal card ─── */
function ProposalCard({
  proposal,
  onUpdate,
}: {
  proposal: any;
  onUpdate: (id: any, data: Record<string, any>) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerEmail: "",
    totalPrice: "",
    monthlyPayment: "",
    equipment: "",
    notes: "",
  });

  const si = STATUS_MAP[proposal.status] || STATUS_MAP.draft;
  const StatusIcon = si.icon;
  const equipment = parseEquipment(proposal.equipment);

  const startEdit = () => {
    setEditForm({
      customerName: proposal.customerName || "",
      customerEmail: proposal.customerEmail || "",
      totalPrice: String(proposal.totalPrice || ""),
      monthlyPayment: proposal.monthlyPayment ? String(proposal.monthlyPayment) : "",
      equipment: equipment.map((e) => `${e.name}${e.price ? ` | ${e.price}` : ""}`).join("\n"),
      notes: proposal.notes || "",
    });
    setEditing(true);
    setExpanded(true);
  };

  const saveEdit = async () => {
    const equip = editForm.equipment
      ? JSON.stringify(
          editForm.equipment
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              const [name, price] = line.split("|").map((s) => s.trim());
              return { name: name || line, description: "", price: parseFloat(price) || 0 };
            })
        )
      : JSON.stringify([]);
    await onUpdate(proposal._id, {
      equipment: equip,
      totalPrice: parseFloat(editForm.totalPrice) || proposal.totalPrice,
      monthlyPayment: editForm.monthlyPayment ? parseFloat(editForm.monthlyPayment) : undefined,
      notes: editForm.notes || undefined,
    });
    setEditing(false);
  };

  const copyLink = () => {
    if (proposal.shareToken) {
      navigator.clipboard.writeText(`${window.location.origin}/proposal/${proposal.shareToken}`);
      toast.success("Link copied!");
    }
  };

  return (
    <Card className={`transition-all hover:border-border ${expanded ? "ring-1 ring-cyan-500/20" : ""}`}>
      <CardContent className="p-0">
        {/* Status accent bar */}
        <div
          className={`h-0.5 rounded-t-lg ${
            proposal.status === "accepted" ? "bg-emerald-500" :
            proposal.status === "declined" ? "bg-red-500" :
            proposal.status === "viewed" ? "bg-amber-500" :
            proposal.status === "sent" ? "bg-blue-500" :
            "bg-muted/20"
          }`}
        />

        {/* Main row */}
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Status icon */}
            <div className={`p-2 rounded-xl shrink-0 ${si.bg}`}>
              <StatusIcon className={`size-4 ${si.color.split(" ")[0]}`} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{proposal.customerName}</p>
                <Badge variant="outline" className={`text-[10px] ${si.color}`}>
                  {si.label}
                </Badge>
                {proposal.viewedAt && (
                  <span className="text-[10px] text-amber-400/70 flex items-center gap-0.5">
                    <Eye className="size-2.5" /> Viewed {relativeTime(proposal.viewedAt)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="font-bold text-emerald-400 text-sm">
                  ${proposal.totalPrice.toLocaleString()}
                </span>
                {proposal.monthlyPayment && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="size-3" /> ${proposal.monthlyPayment}/mo
                  </span>
                )}
                {proposal.customerEmail && (
                  <span className="hidden sm:inline truncate max-w-[180px]">
                    {proposal.customerEmail}
                  </span>
                )}
                {equipment.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Package className="size-3" /> {equipment.length} item{equipment.length > 1 ? "s" : ""}
                  </span>
                )}
                <span>{new Date(proposal._creationTime).toLocaleDateString()}</span>
              </div>

              <StatusProgress status={proposal.status} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit();
                }}
                title="Edit"
              >
                <Edit3 className="size-3" />
              </Button>
              {proposal.shareToken && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyLink();
                  }}
                  title="Copy Link"
                >
                  <Copy className="size-3" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
            </div>
          </div>

          {/* Status action buttons */}
          {!editing && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {proposal.status === "draft" && (
                <Button
                  size="sm"
                  className="text-[11px] h-7 px-2.5"
                  onClick={() => onUpdate(proposal._id, { status: "sent" })}
                >
                  <Send className="size-3 mr-1" /> Mark Sent
                </Button>
              )}
              {(proposal.status === "sent" || proposal.status === "viewed") && (
                <>
                  <Button
                    size="sm"
                    className="text-[11px] h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onUpdate(proposal._id, { status: "accepted" })}
                  >
                    <CheckCircle className="size-3 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7 px-2.5 text-red-400 hover:text-red-300"
                    onClick={() => onUpdate(proposal._id, { status: "declined" })}
                  >
                    <XCircle className="size-3 mr-1" /> Decline
                  </Button>
                </>
              )}
              {proposal.status === "declined" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 px-2.5"
                  onClick={() => onUpdate(proposal._id, { status: "draft" })}
                >
                  Reopen
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-border px-3 sm:px-4 py-3 space-y-3">
            {editing ? (
              /* Edit mode */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Customer Name</Label>
                    <Input
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Email</Label>
                    <Input
                      value={editForm.customerEmail}
                      onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Equipment (one per line, use | for price)</Label>
                  <Textarea
                    value={editForm.equipment}
                    onChange={(e) => setEditForm({ ...editForm, equipment: e.target.value })}
                    className="text-xs min-h-[60px]"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Total Price ($)</Label>
                    <Input
                      type="number"
                      value={editForm.totalPrice}
                      onChange={(e) => setEditForm({ ...editForm, totalPrice: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Monthly ($)</Label>
                    <Input
                      type="number"
                      value={editForm.monthlyPayment}
                      onChange={(e) => setEditForm({ ...editForm, monthlyPayment: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Notes</Label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="text-xs"
                    rows={2}
                  />
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="text-[11px] h-7 px-2.5" onClick={saveEdit}>
                    <Save className="size-3 mr-1" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7 px-2.5"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* View mode */
              <>
                <EquipmentList items={equipment} />

                {proposal.notes && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Notes
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {proposal.notes}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Timeline
                  </p>
                  <div className="space-y-1">
                    <TimelineItem
                      label="Created"
                      time={proposal._creationTime}
                      icon={<FileText className="size-2.5" />}
                    />
                    {proposal.sentAt && (
                      <TimelineItem
                        label="Sent"
                        time={proposal.sentAt}
                        icon={<Send className="size-2.5" />}
                        color="text-blue-400"
                      />
                    )}
                    {proposal.viewedAt && (
                      <TimelineItem
                        label="Viewed by customer"
                        time={proposal.viewedAt}
                        icon={<Eye className="size-2.5" />}
                        color="text-amber-400"
                      />
                    )}
                    {proposal.acceptedAt && (
                      <TimelineItem
                        label="Accepted"
                        time={proposal.acceptedAt}
                        icon={<CheckCircle className="size-2.5" />}
                        color="text-emerald-400"
                      />
                    )}
                  </div>
                </div>

                {/* Shareable link */}
                {proposal.shareToken && (
                  <div className="mt-3 p-2.5 rounded-lg bg-muted/5 border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                          Share Link
                        </p>
                        <p className="text-[11px] text-cyan-400 truncate">
                          {window.location.origin}/proposal/{proposal.shareToken}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-2 shrink-0"
                        onClick={copyLink}
                      >
                        <Copy className="size-3 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineItem({
  label,
  time,
  icon,
  color = "text-muted-foreground",
}: {
  label: string;
  time: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-4 rounded-full bg-muted/8 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className={`text-[11px] font-medium ${color}`}>{label}</span>
      <span className="text-[10px] text-muted-foreground/60 ml-auto tabular-nums">
        {new Date(time).toLocaleDateString()} {new Date(time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </span>
    </div>
  );
}

/* ─── Main page ─── */
export function ProposalsPage() {
  const proposals = useQuery(api.proposals.getProposals) ?? [];
  const createProposal = useMutation(api.proposals.createProposal);
  const updateProposal = useMutation(api.proposals.updateProposal);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    totalPrice: "",
    monthlyPayment: "",
    equipment: "",
    notes: "",
  });

  const stats = useMemo(() => ({
    total: proposals.length,
    pending: proposals.filter((p) => ["sent", "viewed"].includes(p.status)).length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    revenue: proposals
      .filter((p) => p.status === "accepted")
      .reduce((s, p) => s + p.totalPrice, 0),
  }), [proposals]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return proposals;
    return proposals.filter((p) => p.status === statusFilter);
  }, [proposals, statusFilter]);

  const handleUpdate = async (id: any, data: Record<string, any>) => {
    try {
      await updateProposal({ proposalId: id, ...data });
      toast.success(data.status ? `Status updated to ${data.status}` : "Proposal updated");
    } catch {
      toast.error("Failed to update proposal");
    }
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
        <StatCard label="Total" value={stats.total} color="text-foreground" icon={FileText} />
        <StatCard label="Pending" value={stats.pending} color="text-amber-400" icon={Eye} />
        <StatCard label="Accepted" value={stats.accepted} color="text-emerald-400" icon={CheckCircle} />
        <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} color="text-cyan-400" icon={DollarSign} />
      </div>

      {/* Filter pills */}
      {proposals.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All", count: proposals.length },
            { key: "draft", label: "Drafts", count: proposals.filter((p) => p.status === "draft").length },
            { key: "sent", label: "Sent", count: proposals.filter((p) => p.status === "sent").length },
            { key: "viewed", label: "Viewed", count: proposals.filter((p) => p.status === "viewed").length },
            { key: "accepted", label: "Accepted", count: proposals.filter((p) => p.status === "accepted").length },
            { key: "declined", label: "Declined", count: proposals.filter((p) => p.status === "declined").length },
          ]
            .filter((f) => f.key === "all" || f.count > 0)
            .map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.key
                    ? "bg-cyan-500 text-white"
                    : "bg-muted/12 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span
                  className={`min-w-[18px] text-center rounded-full px-1 py-0.5 text-[10px] font-bold ${
                    statusFilter === f.key ? "bg-muted" : "bg-muted/20"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
        </div>
      )}

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No proposals yet"
          description="Create your first proposal to start closing deals."
          actionLabel="Create Proposal"
          onAction={() => setShowCreate(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No {statusFilter} proposals</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((proposal) => (
            <ProposalCard
              key={proposal._id}
              proposal={proposal}
              onUpdate={handleUpdate}
            />
          ))}
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
