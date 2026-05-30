import { useMutation, useQuery } from "convex/react";
import {
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/PageHeader";
import { LeadDetailSheet } from "@/components/LeadDetailSheet";
import { api } from "../../convex/_generated/api";
import {
  LEAD_STAGES,
  type LeadStage,
  leadStageMeta,
  normalizeLeadStage,
} from "@/lib/pipeline";

/* ─── Stage color helpers (Tailwind classes for the kanban) ─── */
const STAGE_COLORS: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  new_lead:       { dot: "bg-slate-500",   text: "text-slate-400",   bg: "bg-slate-500/10", border: "border-slate-500/20" },
  call_to_set:    { dot: "bg-blue-500",    text: "text-blue-400",    bg: "bg-blue-500/10",  border: "border-blue-500/20" },
  scheduled:      { dot: "bg-cyan-500",    text: "text-cyan-400",    bg: "bg-cyan-500/10",  border: "border-cyan-500/20" },
  report_created: { dot: "bg-indigo-500",  text: "text-indigo-400",  bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  demo_done:      { dot: "bg-amber-500",   text: "text-amber-400",   bg: "bg-amber-500/10", border: "border-amber-500/20" },
  forms_sent:     { dot: "bg-orange-500",  text: "text-orange-400",  bg: "bg-orange-500/10", border: "border-orange-500/20" },
  sold:           { dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  installed:      { dot: "bg-green-600",   text: "text-green-400",   bg: "bg-green-600/10", border: "border-green-600/20" },
  closed_lost:    { dot: "bg-red-500",     text: "text-red-400",     bg: "bg-red-500/10",   border: "border-red-500/20" },
};

function stageColor(stage: string) {
  return STAGE_COLORS[stage] || STAGE_COLORS.new_lead;
}

/* ─── Priority dot ─── */
function PriorityDot({ priority }: { priority?: string }) {
  if (!priority) return null;
  const c: Record<string, string> = { hot: "bg-red-500", warm: "bg-amber-500", cold: "bg-blue-400" };
  return <span className={`inline-block size-1.5 rounded-full ${c[priority] || ""}`} title={priority} />;
}

/* ─── Days in stage indicator ─── */
function DaysInStage({ lead }: { lead: any }) {
  const history = lead.stageHistory
    ? (() => { try { return JSON.parse(lead.stageHistory); } catch { return []; } })()
    : [];
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  const days = Math.floor((Date.now() - last.timestamp) / 86400000);
  const color = days > 7 ? "text-red-400" : days > 3 ? "text-amber-400" : "text-emerald-400";
  const dotColor = days > 7 ? "bg-red-400" : days > 3 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-block size-1.5 rounded-full ${dotColor}`} />
      <span className={`text-[10px] font-medium ${color}`}>
        {days === 0 ? "Today" : `${days}d`}
      </span>
    </div>
  );
}

/* ─── Pipeline Card ─── */
function PipelineCard({
  lead,
  onMove,
  onClick,
}: {
  lead: any;
  onMove: (leadId: any, stage: string) => void;
  onClick: () => void;
}) {
  const normalized = normalizeLeadStage(lead.status);
  const sc = stageColor(normalized);

  return (
    <div
      className="rounded-xl border border-border bg-muted/5 p-3 hover:bg-muted/10 hover:border-border transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <PriorityDot priority={lead.priority} />
            <p className="font-semibold text-sm truncate">{lead.name}</p>
          </div>
          {(lead.email || lead.phone) && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {lead.phone || lead.email}
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
            {LEAD_STAGES.filter((s) => s.key !== normalized).map((s) => (
              <DropdownMenuItem key={s.key} onClick={() => onMove(lead._id, s.key)}>
                <div className={`size-2 rounded-full ${stageColor(s.key).dot} mr-2`} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between mt-2">
        {lead.dealValue ? (
          <span className="text-sm font-bold text-emerald-400">${lead.dealValue.toLocaleString()}</span>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">No value</span>
        )}
        <DaysInStage lead={lead} />
      </div>
      {lead.utilityCityState && (
        <p className="text-[10px] text-muted-foreground/50 mt-1 truncate">{lead.utilityCityState}</p>
      )}
    </div>
  );
}

/* ─── Pipeline stats (computed from leads) ─── */
function usePipelineStats(leads: any[]) {
  return useMemo(() => {
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const s of LEAD_STAGES) byStage[s.key] = { count: 0, value: 0 };

    let totalValue = 0;
    let wonValue = 0;
    let wonCount = 0;

    for (const lead of leads) {
      const stage = normalizeLeadStage(lead.status);
      if (byStage[stage]) {
        byStage[stage].count++;
        byStage[stage].value += lead.dealValue ?? 0;
      }
      totalValue += lead.dealValue ?? 0;
      if (stage === "sold" || stage === "installed") {
        wonValue += lead.dealValue ?? 0;
        wonCount++;
      }
    }

    const activeLeads = leads.filter((l) => {
      const s = normalizeLeadStage(l.status);
      return s !== "sold" && s !== "installed" && s !== "closed_lost";
    });

    const closedCount = leads.filter((l) => {
      const s = normalizeLeadStage(l.status);
      return s === "sold" || s === "installed" || s === "closed_lost";
    }).length;

    return {
      byStage,
      totalLeads: leads.length,
      activeLeads: activeLeads.length,
      totalPipelineValue: activeLeads.reduce((s, l) => s + (l.dealValue ?? 0), 0),
      wonValue,
      wonCount,
      avgDealSize: wonCount > 0 ? Math.round(wonValue / wonCount) : 0,
      winRate: closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0,
    };
  }, [leads]);
}

/* ─── Active stages for kanban (exclude closed_lost by default) ─── */
const KANBAN_STAGES = LEAD_STAGES.filter((s) => s.key !== "closed_lost");

/* ─── Main Page ─── */
export function PipelinePage() {
  const navigate = useNavigate();
  const leads = useQuery(api.leads.getLeads) ?? [];
  const updateStatus = useMutation(api.leads.updateLeadStatus);
  const createLead = useMutation(api.leads.createLead);

  const stats = usePipelineStats(leads);

  const [search, setSearch] = useState("");
  const [mobileStage, setMobileStage] = useState<LeadStage>("new_lead");
  const [showCreate, setShowCreate] = useState(false);
  const [showLost, setShowLost] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dealValue: "",
    priority: "",
    notes: "",
  });

  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.utilityCityState?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of LEAD_STAGES) map[s.key] = [];
    for (const l of filtered) {
      const stage = normalizeLeadStage(l.status);
      if (map[stage]) map[stage].push(l);
      else map["new_lead"].push(l);
    }
    return map;
  }, [filtered]);

  const handleMove = useCallback(
    async (leadId: any, stage: string) => {
      try {
        await updateStatus({ leadId, status: stage as any, force: true });
        toast.success(`Moved to ${leadStageMeta(stage).label}`);
      } catch {
        toast.error("Failed to move lead");
      }
    },
    [updateStatus]
  );

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createLead({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        message: form.notes || undefined,
        source: "pipeline",
      });
      toast.success("Lead created");
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", dealValue: "", priority: "", notes: "" });
    } catch {
      toast.error("Failed to create lead");
    }
  };

  const lostCount = grouped["closed_lost"]?.length ?? 0;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <PageHeader
        title="Pipeline"
        subtitle={`${stats.activeLeads} active · $${stats.totalPipelineValue.toLocaleString()} pipeline value`}
        icon={FolderKanban}
        iconColor="text-cyan-400"
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-44 h-9 text-sm"
              />
            </div>
            {lostCount > 0 && (
              <Button
                size="sm"
                variant={showLost ? "secondary" : "ghost"}
                onClick={() => setShowLost(!showLost)}
                className="text-xs gap-1"
              >
                <XCircle className="size-3.5" />
                Lost ({lostCount})
              </Button>
            )}
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="size-4 mr-1" /> New Lead
            </Button>
          </>
        }
      />

      {/* Mobile search */}
      <div className="sm:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ─── Mobile: stage tabs + single column ─── */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {(showLost ? LEAD_STAGES : KANBAN_STAGES).map((s) => {
            const count = grouped[s.key]?.length ?? 0;
            const sc = stageColor(s.key);
            const active = mobileStage === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setMobileStage(s.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? `${sc.dot} text-foreground`
                    : "bg-muted/12 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
                <span
                  className={`min-w-[18px] text-center rounded-full px-1 py-0.5 text-[10px] font-bold ${
                    active ? "bg-background/30" : "bg-muted/20"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2.5 min-h-[120px]">
          {(grouped[mobileStage] || [])
            .sort((a: any, b: any) => b._creationTime - a._creationTime)
            .map((lead: any) => (
              <PipelineCard
                key={lead._id}
                lead={lead}
                onMove={handleMove}
                onClick={() => setSelectedLead(lead)}
              />
            ))}
          {(grouped[mobileStage] || []).length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-xs text-muted-foreground/50">No leads in this stage</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Desktop / Tablet: horizontal kanban ─── */}
      <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
        {(showLost ? LEAD_STAGES : KANBAN_STAGES).map((stage) => {
          const stageLeads = grouped[stage.key] || [];
          const stageValue = stageLeads.reduce((s: number, l: any) => s + (l.dealValue ?? 0), 0);
          const sc = stageColor(stage.key);
          return (
            <div key={stage.key} className="min-w-[220px] w-[220px] shrink-0 space-y-2.5">
              {/* Column header */}
              <div className={`rounded-xl border ${sc.border} ${sc.bg} p-2.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${sc.dot}`} />
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {stageLeads.length}
                  </Badge>
                </div>
                {stageValue > 0 && (
                  <p className={`text-[11px] font-bold mt-1 ${sc.text}`}>
                    ${stageValue.toLocaleString()}
                  </p>
                )}
              </div>
              {/* Cards */}
              <div className="space-y-2 min-h-[80px]">
                {stageLeads
                  .sort((a: any, b: any) => b._creationTime - a._creationTime)
                  .map((lead: any) => (
                    <PipelineCard
                      key={lead._id}
                      lead={lead}
                      onMove={handleMove}
                      onClick={() => setSelectedLead(lead)}
                    />
                  ))}
                {stageLeads.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <p className="text-[11px] text-muted-foreground/40">No leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead ? leads.find((l) => l._id === selectedLead._id) || selectedLead : null}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />

      {/* Create Lead Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
            <DialogDescription>Add a lead to your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
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
            <Button onClick={handleCreate} disabled={!form.name.trim()}>
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
