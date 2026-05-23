import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  ChevronRight,
  DollarSign,
  Filter,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

const STAGES = [
  { key: "new_lead", label: "New Lead", color: "bg-blue-500", textColor: "text-blue-400" },
  { key: "appointment_set", label: "Appointment Set", color: "bg-cyan-500", textColor: "text-cyan-400" },
  { key: "demo_completed", label: "Demo Completed", color: "bg-violet-500", textColor: "text-violet-400" },
  { key: "proposal_sent", label: "Proposal Sent", color: "bg-amber-500", textColor: "text-amber-400" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-500", textColor: "text-orange-400" },
  { key: "closed_won", label: "Closed Won", color: "bg-emerald-500", textColor: "text-emerald-400" },
  { key: "closed_lost", label: "Closed Lost", color: "bg-red-500", textColor: "text-red-400" },
];

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  const colors: Record<string, string> = {
    hot: "bg-red-500/10 text-red-400 border-red-500/30",
    warm: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    cold: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${colors[priority] || ""}`}>
      {priority}
    </Badge>
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
      className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{deal.customerName}</p>
          {deal.customerEmail && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{deal.customerEmail}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {STAGES.filter((s) => s.key !== deal.stage).map((s) => (
              <DropdownMenuItem key={s.key} onClick={() => onMove(deal._id, s.key)}>
                <div className={`size-2 rounded-full ${s.color} mr-2`} />
                Move to {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        {deal.dealValue ? (
          <span className="text-sm font-bold text-emerald-400">
            ${deal.dealValue.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">No value set</span>
        )}
        <PriorityBadge priority={deal.priority} />
      </div>
      {deal.notes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{deal.notes}</p>
      )}
      {deal.expectedCloseDate && (
        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
          Expected: {new Date(deal.expectedCloseDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export function PipelinePage() {
  const navigate = useNavigate();
  const deals = useQuery(api.deals.getDeals) ?? [];
  const createDeal = useMutation(api.deals.createDeal);
  const updateStage = useMutation(api.deals.updateDealStage);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newDeal, setNewDeal] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    dealValue: "",
    notes: "",
    priority: "warm",
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
        toast.success(`Deal moved to ${STAGES.find((s) => s.key === stage)?.label}`);
      } catch {
        toast.error("Failed to move deal");
      }
    },
    [updateStage]
  );

  const handleCreate = async () => {
    if (!newDeal.customerName.trim()) return;
    try {
      await createDeal({
        customerName: newDeal.customerName,
        customerEmail: newDeal.customerEmail || undefined,
        customerPhone: newDeal.customerPhone || undefined,
        dealValue: newDeal.dealValue ? parseFloat(newDeal.dealValue) : undefined,
        notes: newDeal.notes || undefined,
      });
      toast.success("Deal created");
      setShowCreate(false);
      setNewDeal({ customerName: "", customerEmail: "", customerPhone: "", dealValue: "", notes: "", priority: "warm" });
    } catch {
      toast.error("Failed to create deal");
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {deals.length} deals · ${deals.reduce((s, d) => s + (d.dealValue ?? 0), 0).toLocaleString()} total value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1" /> New Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {STAGES.map((stage) => {
          const stageDeals = grouped[stage.key] || [];
          const stageValue = stageDeals.reduce((s: number, d: any) => s + (d.dealValue ?? 0), 0);
          return (
            <div key={stage.key} className="min-w-[280px] w-[280px] shrink-0 space-y-3">
              {/* Stage Header */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-2.5 rounded-full ${stage.color}`} />
                    <span className="text-sm font-semibold">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageDeals.length}
                  </Badge>
                </div>
                {stageValue > 0 && (
                  <p className={`text-xs font-bold mt-1 ${stage.textColor}`}>
                    ${stageValue.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Deal Cards */}
              <div className="space-y-2.5 min-h-[100px]">
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
                    <p className="text-xs text-muted-foreground/50">No deals</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Deal Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
            <DialogDescription>Add a new deal to your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={newDeal.customerName}
                onChange={(e) => setNewDeal({ ...newDeal, customerName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newDeal.customerEmail}
                  onChange={(e) => setNewDeal({ ...newDeal, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newDeal.customerPhone}
                  onChange={(e) => setNewDeal({ ...newDeal, customerPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deal Value ($)</Label>
              <Input
                type="number"
                value={newDeal.dealValue}
                onChange={(e) => setNewDeal({ ...newDeal, dealValue: e.target.value })}
                placeholder="4500"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newDeal.notes}
                onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newDeal.customerName.trim()}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
