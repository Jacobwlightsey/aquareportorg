import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  ClipboardList,
  Copy,
  Eye,
  FileText,
  Gift,
  Link2,
  Download,
  Loader2,
  Plus,
  Search,
  Send,
  Wrench,
  XCircle,
} from "lucide-react";
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

/* ─── Form type config ─── */
const FORM_TYPES: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string; description: string }
> = {
  customer_agreement: {
    label: "Customer Agreement",
    icon: ClipboardList,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    description: "Sales agreement with pricing, system details, and install dates",
  },
  service_request: {
    label: "Service Request",
    icon: Wrench,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    description: "Request for equipment service or maintenance",
  },
  referral: {
    label: "Referral Program",
    icon: Gift,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    description: "Customer referral form for new leads",
  },
  water_test_booking: {
    label: "Water Test Booking",
    icon: FileText,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    description: "Schedule an in-home water test appointment",
  },
};

/* ─── Status config ─── */
const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  draft: { label: "Draft", color: "text-muted-foreground", bg: "bg-muted/50", icon: FileText },
  sent: { label: "Sent", color: "text-blue-400", bg: "bg-blue-500/10", icon: Send },
  viewed: { label: "Viewed", color: "text-amber-400", bg: "bg-amber-500/10", icon: Eye },
  signed: { label: "Signed", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle },
  completed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle },
  countersigned: { label: "Countersigned", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle },
};

function statusMeta(status: string) {
  return STATUS_MAP[status] || STATUS_MAP.draft;
}

function formTypeMeta(type: string) {
  return FORM_TYPES[type] || FORM_TYPES.customer_agreement;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─── Main Page ─── */
export function FormsPage() {
  const contracts = useQuery(api.contracts.getContracts) ?? [];
  const leads = useQuery(api.leads.getLeads) ?? [];
  const createContract = useMutation(api.contracts.createContract);
  const updateStatus = useMutation(api.contracts.updateContractStatus);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0); // 0 = pick type, 1 = fill details, 2 = success
  const [selectedType, setSelectedType] = useState<string>("");
  const [createdToken, setCreatedToken] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerAddress: "",
    equipment: "",
    totalPrice: "",
    leadId: "",
    notes: "",
  });

  // Filter + search
  const filtered = useMemo(() => {
    let list = contracts;
    if (filter !== "all") {
      if (filter === "forms") {
        list = list.filter((c) => c.formType && c.formType !== "customer_agreement");
      } else {
        list = list.filter((c) => c.status === filter);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(q) ||
          c.customerEmail?.toLowerCase().includes(q) ||
          c.customerAddress?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contracts, filter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = contracts.length;
    const sent = contracts.filter((c) => c.status === "sent").length;
    const signed = contracts.filter((c) => ["signed", "completed", "countersigned"].includes(c.status)).length;
    const pending = contracts.filter((c) => ["draft", "sent", "viewed"].includes(c.status)).length;
    const totalValue = contracts.reduce((s, c) => s + (c.totalPrice ?? 0), 0);
    return { total, sent, signed, pending, totalValue };
  }, [contracts]);

  const handlePickType = (type: string) => {
    setSelectedType(type);
    setCreateStep(1);
  };

  const handleCreate = async () => {
    if (!form.customerName.trim()) return;
    setCreating(true);
    try {
      await createContract({
        formType: selectedType,
        customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        customerAddress: form.customerAddress || undefined,
        equipment: form.equipment || "[]",
        totalPrice: form.totalPrice ? Number(form.totalPrice) : 0,
        leadId: form.leadId ? (form.leadId as any) : undefined,
      });
      // Get the last contract to find the share token
      toast.success("Form created!");
      setCreateStep(2);
    } catch {
      toast.error("Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const url = `${window.location.origin}/contract/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const resetCreate = () => {
    setShowCreate(false);
    setCreateStep(0);
    setSelectedType("");
    setCreatedToken("");
    setForm({ customerName: "", customerEmail: "", customerAddress: "", equipment: "", totalPrice: "", leadId: "", notes: "" });
  };

  const handleSend = async (contractId: any) => {
    try {
      await updateStatus({ contractId, status: "sent" });
      toast.success("Marked as sent");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDownloadPdf = async (contract: any) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
      const pw = 612;
      let y = 50;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      const typeLabel = (contract.formType && FORM_TYPES[contract.formType]?.label) || "Agreement";
      doc.text(typeLabel, pw / 2, y, { align: "center" });
      y += 30;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Created ${new Date(contract._creationTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pw / 2, y, { align: "center" });
      y += 40;

      // Customer info
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Customer Information", 50, y);
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Name: ${contract.customerName}`, 50, y); y += 16;
      if (contract.customerEmail) { doc.text(`Email: ${contract.customerEmail}`, 50, y); y += 16; }
      if (contract.customerAddress) { doc.text(`Address: ${contract.customerAddress}`, 50, y); y += 16; }
      y += 10;

      // Equipment
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Equipment & Pricing", 50, y);
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      try {
        const items = JSON.parse(contract.equipment);
        if (Array.isArray(items)) {
          for (const item of items) {
            const name = typeof item === "string" ? item : item.name || item.description || JSON.stringify(item);
            const price = typeof item === "object" && item.price != null ? ` — $${Number(item.price).toLocaleString()}` : "";
            doc.text(`• ${name}${price}`, 60, y); y += 16;
          }
        } else {
          doc.text(contract.equipment, 60, y); y += 16;
        }
      } catch { doc.text(contract.equipment, 60, y); y += 16; }
      y += 10;

      // Total
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Total: $${contract.totalPrice.toLocaleString()}`, 50, y);
      y += 20;
      if (contract.monthlyPayment) { doc.setFontSize(10); doc.text(`Monthly Payment: $${contract.monthlyPayment.toLocaleString()}/mo`, 50, y); y += 16; }
      if (contract.paymentTerms) { doc.text(`Payment Terms: ${contract.paymentTerms}`, 50, y); y += 16; }
      if (contract.depositAmount) { doc.text(`Deposit: $${contract.depositAmount.toLocaleString()}`, 50, y); y += 16; }
      y += 20;

      // Signature
      if (contract.customerSignature) {
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("Customer Signature", 50, y);
        y += 10;
        try { doc.addImage(contract.customerSignature, "PNG", 50, y, 200, 60); y += 70; } catch { /* skip if image fails */ }
        if (contract.customerSignedAt) {
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(`Signed on ${new Date(contract.customerSignedAt).toLocaleString()}`, 50, y);
          y += 16;
        }
      }

      if (contract.dealerSignature) {
        y += 10;
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("Dealer Signature", 50, y);
        y += 10;
        try { doc.addImage(contract.dealerSignature, "PNG", 50, y, 200, 60); y += 70; } catch { /* skip */ }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Generated by AquaReport", pw / 2, 760, { align: "center" });

      doc.save(`${contract.customerName.replace(/\s+/g, "_")}_${typeLabel.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title="Forms & Contracts"
        subtitle={`${stats.total} total · ${stats.pending} pending`}
        icon={ClipboardList}
        iconColor="text-orange-400"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-4 mr-1" /> New Form
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Forms"
          value={stats.total}
          icon={FileText}
          color="text-blue-400"
        />
        <StatCard
          label="Sent"
          value={stats.sent}
          subtitle="Awaiting response"
          icon={Send}
          color="text-cyan-400"
        />
        <StatCard
          label="Signed"
          value={stats.signed}
          icon={CheckCircle}
          color="text-emerald-400"
        />
        <StatCard
          label="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon={FileText}
          color="text-amber-400"
        />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "All" },
            { key: "draft", label: "Draft" },
            { key: "sent", label: "Sent" },
            { key: "signed", label: "Signed" },
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "secondary" : "ghost"}
              onClick={() => setFilter(f.key)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Forms list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No forms yet"
          description="Create your first form to start collecting customer agreements and requests."
          actionLabel="Create Form"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((contract) => {
            const sm = statusMeta(contract.status);
            const fm = formTypeMeta(contract.formType || "customer_agreement");
            const StatusIcon = sm.icon;
            const FormIcon = fm.icon;
            return (
              <Card key={contract._id} className="hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Type icon */}
                    <div className={`shrink-0 rounded-xl p-2.5 ${fm.bg}`}>
                      <FormIcon className={`size-4 ${fm.color}`} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{contract.customerName}</h3>
                        <Badge variant="outline" className={`text-[10px] ${sm.color} shrink-0`}>
                          <StatusIcon className="size-2.5 mr-1" />
                          {sm.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {fm.label}
                        {contract.customerEmail && ` · ${contract.customerEmail}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/60">
                        {contract.totalPrice > 0 && (
                          <span className="font-semibold text-emerald-400">
                            ${contract.totalPrice.toLocaleString()}
                          </span>
                        )}
                        <span>{timeAgo(contract._creationTime)}</span>
                        {contract.customerSignedAt && (
                          <span className="text-emerald-400">
                            ✓ Signed {timeAgo(contract.customerSignedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleDownloadPdf(contract)}
                        title="Download PDF"
                      >
                        <Download className="size-3.5" />
                      </Button>
                      {contract.shareToken && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleCopyLink(contract.shareToken!)}
                          title="Copy link"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      )}
                      {contract.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-400 hover:text-blue-300"
                          onClick={() => handleSend(contract._id)}
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

      {/* ─── Create Form Dialog (3-step like ClearFlow) ─── */}
      <Dialog open={showCreate} onOpenChange={resetCreate}>
        <DialogContent className="max-w-lg">
          {/* Step 0: Pick form type */}
          {createStep === 0 && (
            <>
              <DialogHeader>
                <DialogTitle>What would you like to send?</DialogTitle>
                <DialogDescription>Choose a form type to get started.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                {Object.entries(FORM_TYPES).map(([key, ft]) => {
                  const Icon = ft.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handlePickType(key)}
                      className={`flex flex-col items-center gap-2 rounded-xl p-4 border transition-all hover:scale-[1.02] active:scale-[0.98] ${ft.bg} ${ft.border}`}
                    >
                      <Icon className={`size-6 ${ft.color}`} />
                      <span className={`text-xs font-semibold text-center ${ft.color}`}>
                        {ft.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Step 1: Fill details */}
          {createStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const fm = formTypeMeta(selectedType);
                    const Icon = fm.icon;
                    return (
                      <>
                        <Icon className={`size-5 ${fm.color}`} />
                        {fm.label}
                      </>
                    );
                  })()}
                </DialogTitle>
                <DialogDescription>Fill in the customer details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Link to lead */}
                {leads.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Link to Lead (optional)</Label>
                    <Select value={form.leadId} onValueChange={(v) => {
                      setForm({ ...form, leadId: v });
                      // Auto-populate from lead
                      const lead = leads.find((l) => l._id === v);
                      if (lead) {
                        setForm((prev) => ({
                          ...prev,
                          leadId: v,
                          customerName: lead.name || prev.customerName,
                          customerEmail: lead.email || prev.customerEmail,
                          customerAddress: [lead.address, lead.city, lead.state].filter(Boolean).join(", ") || prev.customerAddress,
                        }));
                      }
                    }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select a lead..." />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.slice(0, 50).map((l) => (
                          <SelectItem key={l._id} value={l._id}>
                            {l.name} {l.email ? `· ${l.email}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                    <Label>Total Price</Label>
                    <Input
                      type="number"
                      value={form.totalPrice}
                      onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={form.customerAddress}
                    onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                    placeholder="Street address"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCreateStep(0)}>
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={!form.customerName.trim() || creating}>
                  {creating ? (
                    <>
                      <Loader2 className="size-4 mr-1 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Send className="size-4 mr-1" /> Create & Send
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 2: Success */}
          {createStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Form Created! ✓</DialogTitle>
                <DialogDescription>
                  The form has been created and is ready to share with your customer.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <CheckCircle className="size-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-300">Form link generated</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Find it in your forms list — click the copy button to share.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={resetCreate}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
