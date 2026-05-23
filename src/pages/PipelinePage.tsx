import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit3,
  FileText,
  FolderKanban,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Save,
  Search,
  Thermometer,
  Trophy,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
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

const PRIORITIES = [
  { key: "hot", label: "Hot", color: "bg-red-500", text: "text-red-400" },
  { key: "warm", label: "Warm", color: "bg-amber-500", text: "text-amber-400" },
  { key: "cold", label: "Cold", color: "bg-blue-400", text: "text-blue-400" },
];

function PriorityDot({ priority }: { priority?: string }) {
  if (!priority) return null;
  const c: Record<string, string> = { hot: "bg-red-500", warm: "bg-amber-500", cold: "bg-blue-400" };
  return <span className={`inline-block size-1.5 rounded-full ${c[priority] || ""}`} title={priority} />;
}

/* ─── Deal Card ─── */
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
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{deal.customerEmail}</p>
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
          <span className="text-sm font-bold text-emerald-400">${deal.dealValue.toLocaleString()}</span>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">No value</span>
        )}
        {deal.expectedCloseDate && (
          <span className="text-[10px] text-muted-foreground/50">
            {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      {deal.notes && <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{deal.notes}</p>}
    </div>
  );
}

/* ─── Deal Detail Sheet ─── */
function DealDetailSheet({
  deal,
  open,
  onOpenChange,
  onMove,
  onSave,
  onNavigate,
}: {
  deal: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (dealId: any, stage: string) => void;
  onSave: (dealId: any, data: Record<string, any>) => Promise<void>;
  onNavigate?: (path: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    dealValue: "",
    priority: "",
    notes: "",
  });

  const stageInfo = STAGES.find((s) => s.key === deal?.stage) || STAGES[0];
  const history = deal?.stageHistory ? (() => { try { return JSON.parse(deal.stageHistory); } catch { return []; }})() : [];

  const startEdit = () => {
    setForm({
      customerName: deal.customerName || "",
      customerEmail: deal.customerEmail || "",
      customerPhone: deal.customerPhone || "",
      customerAddress: deal.customerAddress || "",
      dealValue: deal.dealValue ? String(deal.dealValue) : "",
      priority: deal.priority || "",
      notes: deal.notes || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const data: Record<string, any> = {};
    if (form.customerName && form.customerName !== deal.customerName) data.customerName = form.customerName;
    if (form.customerEmail !== (deal.customerEmail || "")) data.customerEmail = form.customerEmail || undefined;
    if (form.customerPhone !== (deal.customerPhone || "")) data.customerPhone = form.customerPhone || undefined;
    if (form.customerAddress !== (deal.customerAddress || "")) data.customerAddress = form.customerAddress || undefined;
    if (form.dealValue && parseFloat(form.dealValue) !== deal.dealValue) data.dealValue = parseFloat(form.dealValue);
    if (form.priority !== (deal.priority || "")) data.priority = form.priority || undefined;
    if (form.notes !== (deal.notes || "")) data.notes = form.notes || undefined;
    if (Object.keys(data).length > 0) {
      await onSave(deal._id, data);
    }
    setEditing(false);
  };

  if (!deal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{deal.customerName}</SheetTitle>
            <Button size="icon" variant="ghost" className="size-7" onClick={editing ? () => setEditing(false) : startEdit}>
              {editing ? <X className="size-4" /> : <Edit3 className="size-4" />}
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Stage + Value banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${stageInfo.color}`}>
              {stageInfo.label}
            </div>
            <div className="flex-1" />
            <p className="text-lg font-black text-emerald-400">
              {deal.dealValue ? `$${deal.dealValue.toLocaleString()}` : "—"}
            </p>
          </div>

          {editing ? (
            /* Edit mode */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Customer Name</Label>
                <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Email</Label>
                  <Input value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Phone</Label>
                  <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="h-8 text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Address</Label>
                <Input value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Deal Value ($)</Label>
                  <Input type="number" value={form.dealValue} onChange={(e) => setForm({ ...form, dealValue: e.target.value })} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">🔥 Hot</SelectItem>
                      <SelectItem value="warm">☀️ Warm</SelectItem>
                      <SelectItem value="cold">❄️ Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="text-xs" rows={3} />
              </div>
              <Button size="sm" className="w-full text-xs" onClick={saveEdit}>
                <Save className="size-3 mr-1" /> Save Changes
              </Button>
            </div>
          ) : (
            <>
              {/* Contact info */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact</p>
                {deal.customerEmail && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="size-3.5 text-muted-foreground shrink-0" />
                    <a href={`mailto:${deal.customerEmail}`} className="text-cyan-400 hover:underline truncate">{deal.customerEmail}</a>
                  </div>
                )}
                {deal.customerPhone && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="size-3.5 text-muted-foreground shrink-0" />
                    <a href={`tel:${deal.customerPhone}`} className="hover:underline">{deal.customerPhone}</a>
                  </div>
                )}
                {deal.customerAddress && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="size-3.5 shrink-0" />
                    <span>{deal.customerAddress}</span>
                  </div>
                )}
                {deal.priority && (
                  <div className="flex items-center gap-2 text-xs">
                    <Thermometer className="size-3.5 text-muted-foreground shrink-0" />
                    <span className={PRIORITIES.find((p) => p.key === deal.priority)?.text || ""}>
                      {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)} priority
                    </span>
                  </div>
                )}
                {!deal.customerEmail && !deal.customerPhone && !deal.customerAddress && !deal.priority && (
                  <p className="text-xs text-muted-foreground/50">No contact info. Click edit to add.</p>
                )}
              </div>

              {/* Notes */}
              {deal.notes && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{deal.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              {deal.stage !== "closed_won" && deal.stage !== "closed_lost" && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        onNavigate?.(`/appointments`);
                      }}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors text-left"
                    >
                      <Calendar className="size-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-medium text-cyan-400">Schedule Appt</span>
                    </button>
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        onNavigate?.(`/proposals`);
                      }}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left"
                    >
                      <FileText className="size-3.5 text-amber-400 shrink-0" />
                      <span className="text-[11px] font-medium text-amber-400">Create Proposal</span>
                    </button>
                    <button
                      onClick={() => { onMove(deal._id, "closed_won"); onOpenChange(false); }}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors text-left"
                    >
                      <Trophy className="size-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-medium text-emerald-400">Mark Won</span>
                    </button>
                    <button
                      onClick={() => { onMove(deal._id, "closed_lost"); onOpenChange(false); }}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <XCircle className="size-3.5 text-red-400 shrink-0" />
                      <span className="text-[11px] font-medium text-red-400">Mark Lost</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Won banner */}
              {deal.stage === "closed_won" && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle2 className="size-5 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Deal Won!</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {deal.dealValue ? `$${deal.dealValue.toLocaleString()} revenue` : "Congratulations!"}
                    {deal.closedAt && ` · ${new Date(deal.closedAt).toLocaleDateString()}`}
                  </p>
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      onNavigate?.(`/commissions`);
                    }}
                    className="mt-2 text-[11px] text-cyan-400 hover:underline"
                  >
                    → Add commission for this deal
                  </button>
                </div>
              )}

              {/* Lost banner */}
              {deal.stage === "closed_lost" && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
                  <span className="text-sm font-bold text-red-400">Deal Lost</span>
                  {deal.lostReason && (
                    <p className="text-[11px] text-muted-foreground mt-1">Reason: {deal.lostReason}</p>
                  )}
                  {deal.closedAt && (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">{new Date(deal.closedAt).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {/* Move stage */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Move to Stage</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STAGES.filter((s) => s.key !== deal.stage).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => { onMove(deal._id, s.key); onOpenChange(false); }}
                      className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/20 transition-colors text-left"
                    >
                      <div className={`size-2 rounded-full ${s.color} shrink-0`} />
                      <span className="text-[11px] font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stage History */}
              {history.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stage History</p>
                  <div className="space-y-1">
                    {history.map((h: any, i: number) => {
                      const stage = STAGES.find((s) => s.key === h.stage);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${stage?.color || "bg-white/20"} shrink-0`} />
                          <span className={`text-[11px] font-medium ${stage?.text || ""}`}>{stage?.label || h.stage}</span>
                          <span className="text-[10px] text-muted-foreground/50 ml-auto tabular-nums">
                            {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Main Page ─── */
export function PipelinePage() {
  const navigate = useNavigate();
  const deals = useQuery(api.deals.getDeals) ?? [];
  const stats = useQuery(api.deals.getPipelineStats);
  const createDeal = useMutation(api.deals.createDeal);
  const updateStage = useMutation(api.deals.updateDealStage);
  const updateDeal = useMutation(api.deals.updateDeal);
  const [search, setSearch] = useState("");
  const [mobileStage, setMobileStage] = useState("new_lead");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    dealValue: "",
    priority: "",
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

  const handleSave = useCallback(
    async (dealId: any, data: Record<string, any>) => {
      try {
        await updateDeal({ dealId, ...data });
        toast.success("Deal updated");
      } catch {
        toast.error("Failed to update deal");
      }
    },
    [updateDeal]
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
      setForm({ customerName: "", customerEmail: "", customerPhone: "", dealValue: "", priority: "", notes: "" });
    } catch {
      toast.error("Failed to create deal");
    }
  };

  // Keep selectedDeal in sync with live data
  const liveDeal = selectedDeal ? deals.find((d) => d._id === selectedDeal._id) || selectedDeal : null;

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
              <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-44 h-9 text-sm" />
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
        <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Mobile: stage tabs + single column */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
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
                <span className={`min-w-[18px] text-center rounded-full px-1 py-0.5 text-[10px] font-bold ${mobileStage === s.key ? "bg-white/25" : "bg-white/10"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2.5 min-h-[120px]">
          {(grouped[mobileStage] || [])
            .sort((a: any, b: any) => b._creationTime - a._creationTime)
            .map((deal: any) => (
              <DealCard key={deal._id} deal={deal} onMove={handleMove} onClick={() => setSelectedDeal(deal)} />
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
          const stageValue = stageDeals.reduce((s: number, d: any) => s + (d.dealValue ?? 0), 0);
          return (
            <div key={stage.key} className="min-w-[260px] w-[260px] shrink-0 space-y-2.5">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5">{stageDeals.length}</Badge>
                </div>
                {stageValue > 0 && (
                  <p className={`text-[11px] font-bold mt-1 ${stage.text}`}>${stageValue.toLocaleString()}</p>
                )}
              </div>
              <div className="space-y-2 min-h-[80px]">
                {stageDeals
                  .sort((a: any, b: any) => b._creationTime - a._creationTime)
                  .map((deal: any) => (
                    <DealCard key={deal._id} deal={deal} onMove={handleMove} onClick={() => setSelectedDeal(deal)} />
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

      {/* Deal Detail Sheet */}
      <DealDetailSheet
        deal={liveDeal}
        open={!!selectedDeal}
        onOpenChange={(open) => { if (!open) setSelectedDeal(null); }}
        onMove={handleMove}
        onSave={handleSave}
        onNavigate={navigate}
      />

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
              <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Deal Value ($)</Label>
                <Input type="number" value={form.dealValue} onChange={(e) => setForm({ ...form, dealValue: e.target.value })} placeholder="4500" />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">🔥 Hot</SelectItem>
                    <SelectItem value="warm">☀️ Warm</SelectItem>
                    <SelectItem value="cold">❄️ Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add any notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.customerName.trim()}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
