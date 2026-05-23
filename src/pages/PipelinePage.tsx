import { useMutation, useQuery } from "convex/react";
import {
  DollarSign,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const STAGES = [
  { key: "new_lead", label: "New Lead", color: "bg-blue-500", text: "text-blue-400" },
  { key: "appointment_set", label: "Appt Set", color: "bg-cyan-500", text: "text-cyan-400" },
  { key: "demo_completed", label: "Demo Done", color: "bg-violet-500", text: "text-violet-400" },
  { key: "proposal_sent", label: "Proposal", color: "bg-amber-500", text: "text-amber-400" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-500", text: "text-orange-400" },
  { key: "closed_won", label: "Won", color: "bg-emerald-500", text: "text-emerald-400" },
  { key: "closed_lost", label: "Lost", color: "bg-red-500", text: "text-red-400" },
];

function PriorityDot({ priority }: { priority?: string }) {
  if (!priority) return null;
  const c: Record<string, string> = {
    hot: "bg-red-500",
    warm: "bg-amber-500",
    cold: "bg-blue-400",
  };
  return (
    <span
      className={`inline-block size-1.5 rounded-full ${c[priority] || ""}`}
      title={priority}
    />
  );
}

function DealCard({
  deal,
  onMove,
  onClick,
}: {
  deal: any;
  onMove: (dealId: any, stage: string) => void;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <PriorityDot priority={deal.priority} />
            <p className="font-semibold text-sm truncate">{deal.customerName}</p>
          </div>
          {deal.customerEmail && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {deal.customerEmail}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {STAGES.filter((s) => s.key !== deal.stage).map((s) => (
              <DropdownMenuItem key={s.key} onClick={() => onMove(deal._id, s.key)}>
                <div className={`size-2 rounded-full ${s.color} mr-2`} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between mt-2">
        {deal.dealValue ? (
          <span className="text-sm font-bold text-emerald-400">
            ${deal.dealValue.toLocaleString()}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">No value</span>
        )}
        {deal.expectedCloseDate && (
          <span className="text-[10px] text-muted-foreground/50">
            {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
      {deal.notes && (
        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{deal.notes}</p>
      )}
    </div>
  );
}

export function PipelinePage() {
  const navigate = useNavigate();
  const deals = useQuery(api.deals.getDeals) ?? [];
  const stats = useQuery(api.deals.getPipelineStats);
  const createDeal = useMutation(api.deals.createDeal);
  const updateStage = useMutation(api.deals.updateDealStage);
  const [search, setSearch] = useState("");
  const [mobileStage, setMobileStage] = useState("new_lead");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    dealValue: "",
    notes: "",
  });

  const filtered = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        d.customerName?.toLowerCase().includes(q) ||
        d.customerEmail?.toLowerCase().includes(q) ||
        d.customerPhone?.includes(q)
    );
  }, [deals, search]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of STAGES) map[s.key] = [];
    for (const d of filtered) {
      if (map[d.stage]) map[d.stage].push(d);
      else map["new_lead"].push(d);
    }
    return map;
  }, [filtered]);

  const handleMove = useCallback(
    async (dealId: any, stage: string) => {
      try {
        await updateStage({ dealId, stage });
        toast.success(`Moved to ${STAGES.find((s) => s.key === stage)?.label}`);
      } catch {
        toast.error("Failed to move deal");
      }
    },
    [updateStage]
  );

  const handleCreate = async () => {
    if (!form.customerName.trim()) return;
    try {
      await createDeal({
        customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        customerPhone: form.customerPhone || undefined,
        dealValue: form.dealValue ? parseFloat(form.dealValue) : undefined,
        notes: form.notes || undefined,
      });
      toast.success("Deal created");
      setShowCreate(false);
      setForm({ customerName: "", customerEmail: "", customerPhone: "", dealValue: "", notes: "" });
    } catch {
      toast.error("Failed to create deal");
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title="Pipeline"
        subtitle={`${deals.length} deals · $${(stats?.totalPipelineValue ?? 0).toLocaleString()} total value`}
        icon={FolderKanban}
        iconColor="text-cyan-400"
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-44 h-9 text-sm"
              />
            </div>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 mr-1" /> New Deal
            </Button>
          </>
        }
      />

      {/* Mobile search */}
      <div className="sm:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Mobile: stage tabs + single column */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {STAGES.map((s) => {
            const count = grouped[s.key]?.length ?? 0;
            return (
              <button
                key={s.key}
                onClick={() => setMobileStage(s.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mobileStage === s.key
                    ? `${s.color} text-white`
                    : "bg-white/[0.06] text-muted-foreground hover:text-white"
                }`}
              >
                {s.label}
                <span
                  className={`min-w-[18px] text-center rounded-full px-1 py-0.5 text-[10px] font-bold ${
                    mobileStage === s.key ? "bg-white/25" : "bg-white/10"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile deal list for selected stage */}
        <div className="space-y-2.5 min-h-[120px]">
          {(grouped[mobileStage] || [])
            .sort((a: any, b: any) => b._creationTime - a._creationTime)
            .map((deal: any) => (
              <DealCard
                key={deal._id}
                deal={deal}
                onMove={handleMove}
                onClick={() => navigate(`/pipeline/${deal._id}`)}
              />
            ))}
          {(grouped[mobileStage] || []).length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-xs text-muted-foreground/50">No deals in this stage</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop / Tablet: horizontal kanban */}
      <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = grouped[stage.key] || [];
          const stageValue = stageDeals.reduce(
            (s: number, d: any) => s + (d.dealValue ?? 0),
            0
          );
          return (
            <div key={stage.key} className="min-w-[260px] w-[260px] shrink-0 space-y-2.5">
              {/* Column header */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {stageDeals.length}
                  </Badge>
                </div>
                {stageValue > 0 && (
                  <p className={`text-[11px] font-bold mt-1 ${stage.text}`}>
                    ${stageValue.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[80px]">
                {stageDeals
                  .sort((a: any, b: any) => b._creationTime - a._creationTime)
                  .map((deal: any) => (
                    <DealCard
                      key={deal._id}
                      deal={deal}
                      onMove={handleMove}
                      onClick={() => navigate(`/pipeline/${deal._id}`)}
                    />
                  ))}
                {stageDeals.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <p className="text-[11px] text-muted-foreground/40">No deals</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Deal Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Deal</DialogTitle>
            <DialogDescription>Add a deal to your pipeline.</DialogDescription>
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
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deal Value ($)</Label>
              <Input
                type="number"
                value={form.dealValue}
                onChange={(e) => setForm({ ...form, dealValue: e.target.value })}
                placeholder="4500"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!form.customerName.trim()}>
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
