import { useQuery, useMutation } from "convex/react";
import {
  Building2,
  ChevronRight,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Megaphone,
  Search,
  ShieldCheck,
  Users,
  Activity,
  CheckCircle,
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  Trash2,
  Plus,
  Code,
  BarChart3,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FacebookIntegrationCard } from "@/components/integrations/FacebookIntegrationCard";
import { PixelCodeCard } from "@/components/integrations/PixelCodeCard";

/* ---------- tiny helpers ---------- */
function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-gray-500/20 text-gray-400",
    starter: "bg-blue-500/20 text-blue-400",
    growth: "bg-purple-500/20 text-purple-400",
    pro: "bg-amber-500/20 text-amber-400",
    enterprise: "bg-emerald-500/20 text-emerald-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[plan] || colors.free}`}>
      {plan || "free"}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  sub?: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color }}>
              {value}
            </p>
            {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
          </div>
          <div className="rounded-lg p-2" style={{ background: color + "20" }}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ height: `${Math.max((v / max) * 100, 4)}%`, background: color + "99" }}
        />
      ))}
    </div>
  );
}

/* ---------- Company Detail Modal ---------- */
function CompanyDetailModal({
  companyId,
  onClose,
}: {
  companyId: Id<"companies">;
  onClose: () => void;
}) {
  const detail = useQuery(api.admin.getCompanyDetail, { companyId });
  const reports = useQuery(api.admin.adminGetCompanyReports, { companyId });
  const leads = useQuery(api.admin.adminGetCompanyLeads, { companyId });
  const demos = useQuery(api.admin.adminGetCompanyDemos, { companyId });
  const updateCompany = useMutation(api.admin.adminUpdateCompany);
  const deleteReport = useMutation(api.admin.adminDeleteReport);

  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPlan, setFormPlan] = useState("");
  const [formStatus, setFormStatus] = useState("");

  if (!detail) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
        <div className="bg-background rounded-2xl p-8" onClick={(e) => e.stopPropagation()}>
          <Loader2 className="size-8 animate-spin text-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  const { company, members, reportCount, demoCount, leadCount } = detail;

  const startEdit = () => {
    setFormName(company.name);
    setFormEmail(company.email || "");
    setFormPhone(company.phone || "");
    setFormWebsite(company.website || "");
    setFormAddress(company.address || "");
    setFormPlan(company.stripePlan || "free");
    setFormStatus(company.stripeStatus || "none");
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateCompany({
        companyId,
        name: formName.trim() || undefined,
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        website: formWebsite.trim() || undefined,
        address: formAddress.trim() || undefined,
        stripePlan: formPlan || undefined,
        stripeStatus: formStatus || undefined,
      });
      toast.success("Company updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (reportId: Id<"reports">) => {
    if (confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteReport({ reportId });
        toast.success("Report deleted");
      } catch {
        toast.error("Failed to delete report");
      }
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "enterprise", label: "Enterprise", icon: Globe },
    { key: "settings", label: "Settings", icon: ShieldCheck },
    { key: "billing", label: "Billing", icon: CreditCard },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "leads", label: "Leads", icon: Users },
    { key: "demos", label: "Demos", icon: Activity },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-5 pt-5 pb-0 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {company.logoUrl ? (
                <img src={company.logoUrl} className="size-10 rounded-xl object-contain" alt="" />
              ) : (
                <div
                  className="size-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: (company.primaryColor || "#2563eb") + "15" }}
                >
                  <Building2 className="size-5" style={{ color: company.primaryColor || "#2563eb" }} />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">{company.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <PlanBadge plan={(company.stripeStatus === "active" && company.stripePlan) || "free"} />
                  {company.stripeStatus && company.stripeStatus !== "none" && (
                    <span className="text-xs text-muted-foreground">({company.stripeStatus})</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted cursor-pointer">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  tab === t.key
                    ? "border-blue-500 text-blue-500 bg-blue-500/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Members", value: members.length },
                  { label: "Reports", value: reportCount },
                  { label: "Demos", value: demoCount },
                  { label: "Leads", value: leadCount },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {company.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5" /> {company.email}
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5" /> {company.phone}
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="size-3.5" /> {company.website}
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-3.5" /> {company.address}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Team Members</h3>
                <div className="space-y-2">
                  {members.map((m: any) => (
                    <div key={m._id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground ml-2">{m.email}</span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{m.role || "member"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-4">
              {!editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-xs text-muted-foreground">Name</label>
                      <p className="font-medium">{company.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Email</label>
                      <p className="font-medium">{company.email || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Phone</label>
                      <p className="font-medium">{company.phone || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Website</label>
                      <p className="font-medium">{company.website || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Address</label>
                      <p className="font-medium">{company.address || "—"}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    Edit Company
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input className="px-3 py-2 rounded-xl border bg-background text-sm" placeholder="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                    <input className="px-3 py-2 rounded-xl border bg-background text-sm" placeholder="Email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                    <input className="px-3 py-2 rounded-xl border bg-background text-sm" placeholder="Phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                    <input className="px-3 py-2 rounded-xl border bg-background text-sm" placeholder="Website" value={formWebsite} onChange={(e) => setFormWebsite(e.target.value)} />
                  </div>
                  <input className="w-full px-3 py-2 rounded-xl border bg-background text-sm" placeholder="Address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving}>
                      {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "billing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Plan</label>
                  <p className="font-medium capitalize">{company.stripePlan || "free"}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <p className="font-medium capitalize">{company.stripeStatus || "none"}</p>
                </div>
                {company.stripeCustomerId && (
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground">Stripe Customer</label>
                    <p className="font-mono text-xs">{company.stripeCustomerId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-2">
              {reports?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No reports</p>}
              {reports?.map((r: any) => (
                <div key={r._id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{r.customerName || r.address || "Report"}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {new Date(r._creationTime).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="text-destructive hover:text-destructive/80 p-1 rounded cursor-pointer"
                    onClick={() => handleDeleteReport(r._id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "leads" && (
            <div className="space-y-2">
              {leads?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No leads</p>}
              {leads?.map((l: any) => (
                <div key={l._id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{l.name || l.email || "Lead"}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{l.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l._creationTime).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "demos" && (
            <div className="space-y-2">
              {demos?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No demos</p>}
              {demos?.map((d: any) => (
                <div key={d._id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium">{d.customerName || "Demo"}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {d.duration ? `${Math.floor(d.duration / 60)}m ${d.duration % 60}s` : "—"}
                    </span>
                  </div>
                  {d.outcome && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        d.outcome === "sold"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : d.outcome === "follow_up"
                            ? "bg-amber-500/20 text-amber-400"
                            : d.outcome === "not_interested"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {d.outcome.replace("_", " ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Admin Management Section ---------- */
function AdminManagementSection() {
  const admins = useQuery(api.admin.listPlatformAdmins) ?? [];
  const addAdmin = useMutation(api.admin.addPlatformAdmin);
  const removeAdmin = useMutation(api.admin.removePlatformAdmin);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      await addAdmin({ email: newEmail.trim() });
      toast.success("Admin added");
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add admin");
    }
    setAdding(false);
  }

  async function handleRemove(adminId: Id<"platformAdmins">) {
    if (!confirm("Remove this admin?")) return;
    try {
      await removeAdmin({ adminId });
      toast.success("Admin removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove admin");
    }
  }

  return (
    <div className="border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-purple-500/10">
          <ShieldCheck className="size-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Platform Admins</h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this admin dashboard
          </p>
        </div>
      </div>

      {/* Current Admins */}
      <div className="space-y-2">
        {admins.map((admin) => (
          <div
            key={admin.email}
            className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">{admin.email}</span>
                {admin.source === "builtin" && (
                  <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-semibold">
                    Built-in
                  </span>
                )}
                {admin.addedAt && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Added {new Date(admin.addedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {admin.source === "added" && admin._id && (
              <button
                onClick={() => handleRemove(admin._id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                title="Remove admin"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add New Admin */}
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !newEmail.trim()}
          className="gap-1.5"
          size="sm"
        >
          {adding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add Admin
        </Button>
      </div>
    </div>
  );
}

/* ── Enterprise Management Section ─────────────────────────── */

function EnterpriseSection({ companies }: { companies: any[] }) {
  const enterpriseCompanies = useQuery(api.admin.getEnterpriseCompanies) ?? [];
  const setEnterprise = useMutation(api.admin.setEnterprise);
  const updateConfig = useMutation(api.admin.updateEnterpriseConfig);
  const [selectedId, setSelectedId] = useState<Id<"companies"> | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit state
  const selected = enterpriseCompanies.find((c: any) => c._id === selectedId);
  const config = selected?.enterpriseConfig ?? {};
  const [billingEmail, setBillingEmail] = useState("");
  const [billingNotes, setBillingNotes] = useState("");
  const [customPricing, setCustomPricing] = useState("");
  const [notes, setNotes] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");

  // Sync edit fields when selection changes
  const prevSelectedId = useRef<string | null>(null);
  if (selectedId !== prevSelectedId.current) {
    prevSelectedId.current = selectedId as string | null;
    if (selected) {
      setBillingEmail(config.billingEmail ?? "");
      setBillingNotes(config.billingNotes ?? "");
      setCustomPricing(config.customPricing ?? "");
      setNotes(config.notes ?? "");
      setContractStart(config.contractStart ? new Date(config.contractStart).toISOString().split("T")[0] : "");
      setContractEnd(config.contractEnd ? new Date(config.contractEnd).toISOString().split("T")[0] : "");
    }
  }

  // Non-enterprise companies for the "add" dialog
  const nonEnterprise = (companies || []).filter(
    (c: any) => !c.isEnterprise && (!addSearch || c.name?.toLowerCase().includes(addSearch.toLowerCase()) || c.ownerEmail?.toLowerCase().includes(addSearch.toLowerCase()))
  );

  async function handleAdd(companyId: Id<"companies">) {
    try {
      await setEnterprise({ companyId, isEnterprise: true });
      toast.success("Company upgraded to Enterprise");
      setShowAddDialog(false);
      setAddSearch("");
    } catch (err: any) {
      toast.error(err.message || "Failed to upgrade");
    }
  }

  async function handleRemove(companyId: Id<"companies">) {
    if (!confirm("Remove enterprise status? This will downgrade the company.")) return;
    try {
      await setEnterprise({ companyId, isEnterprise: false });
      toast.success("Enterprise status removed");
      if (selectedId === companyId) setSelectedId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  }

  async function handleSaveConfig() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateConfig({
        companyId: selectedId,
        config: {
          billingEmail: billingEmail || undefined,
          billingNotes: billingNotes || undefined,
          customPricing: customPricing || undefined,
          notes: notes || undefined,
          contractStart: contractStart ? new Date(contractStart).getTime() : undefined,
          contractEnd: contractEnd ? new Date(contractEnd).getTime() : undefined,
          locations: config.locations || undefined,
        },
      });
      toast.success("Enterprise config saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  }

  return (
    <div className="border rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-emerald-500/10">
            <Globe className="size-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Enterprise Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage enterprise customers — multiple locations, custom billing & invoicing
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4" /> Add Enterprise
        </Button>
      </div>

      {/* Enterprise Company List */}
      {enterpriseCompanies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="size-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No enterprise customers yet</p>
          <p className="text-xs mt-1">Click "Add Enterprise" to upgrade a company</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: company list */}
          <div className="space-y-2 lg:col-span-1">
            {enterpriseCompanies.map((c: any) => (
              <button
                key={c._id}
                onClick={() => setSelectedId(c._id)}
                className={`w-full text-left rounded-xl px-4 py-3 transition-all cursor-pointer ${
                  selectedId === c._id
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email || "No email"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    ENTERPRISE
                  </span>
                </div>
                {c.enterpriseConfig?.locations?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <MapPin className="size-3 inline mr-1" />
                    {c.enterpriseConfig.locations.length} location{c.enterpriseConfig.locations.length !== 1 ? "s" : ""}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Right: detail panel */}
          {selected ? (
            <div className="lg:col-span-2 border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{selected.name}</h3>
                <button
                  onClick={() => handleRemove(selected._id)}
                  className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Remove Enterprise
                </button>
              </div>

              {/* Billing Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <CreditCard className="size-3.5" /> Billing & Contract
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Billing Email</label>
                    <input
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="billing@company.com"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Custom Pricing</label>
                    <input
                      type="text"
                      value={customPricing}
                      onChange={(e) => setCustomPricing(e.target.value)}
                      placeholder="e.g. $2,500/mo for 10 locations"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Contract Start</label>
                    <input
                      type="date"
                      value={contractStart}
                      onChange={(e) => setContractStart(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Contract End</label>
                    <input
                      type="date"
                      value={contractEnd}
                      onChange={(e) => setContractEnd(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Billing Notes</label>
                  <textarea
                    value={billingNotes}
                    onChange={(e) => setBillingNotes(e.target.value)}
                    placeholder="Invoice details, PO numbers, NET terms..."
                    rows={2}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileText className="size-3.5" /> Internal Notes
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this enterprise customer..."
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              {/* Save */}
              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={saving} size="sm" className="gap-1.5">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 border rounded-xl p-8 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Select an enterprise company to manage</p>
            </div>
          )}
        </div>
      )}

      {/* Add Enterprise Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAddDialog(false)}>
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Add Enterprise Company</h3>
              <button onClick={() => setShowAddDialog(false)} className="p-1 rounded-lg hover:bg-muted cursor-pointer">
                <X className="size-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search companies..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              autoFocus
            />
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {nonEnterprise.slice(0, 20).map((c: any) => (
                <button
                  key={c._id}
                  onClick={() => handleAdd(c._id)}
                  className="w-full text-left flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.ownerEmail || c.email || "—"}</p>
                  </div>
                  <PlanBadge plan={c.plan || "free"} />
                </button>
              ))}
              {nonEnterprise.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No companies found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main Admin Page ---------- */
/* ── Dealer Lead Capture Section ──────────────────────────── */

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-500/20 text-blue-400" },
  { value: "contacted", label: "Contacted", color: "bg-purple-500/20 text-purple-400" },
  { value: "qualified", label: "Qualified", color: "bg-cyan-500/20 text-cyan-400" },
  { value: "demo_scheduled", label: "Demo Scheduled", color: "bg-amber-500/20 text-amber-400" },
  { value: "demo_completed", label: "Demo Completed", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "converted", label: "Converted", color: "bg-green-500/20 text-green-400" },
  { value: "lost", label: "Lost", color: "bg-red-500/20 text-red-400" },
];

function DealerLeadSection() {
  const trackingLinks = useQuery(api.dealerLeads.getTrackingLinks) || [];
  const dealerLeads = useQuery(api.dealerLeads.getDealerLeads) || [];
  const createLink = useMutation(api.dealerLeads.createTrackingLink);
  const toggleLink = useMutation(api.dealerLeads.toggleTrackingLink);
  const deleteLink = useMutation(api.dealerLeads.deleteTrackingLink);
  const updateLead = useMutation(api.dealerLeads.updateDealerLead);
  const deleteLead = useMutation(api.dealerLeads.deleteDealerLead);

  const [showNewLink, setShowNewLink] = useState(false);
  const [newLink, setNewLink] = useState({ name: "", slug: "", utmSource: "facebook", utmMedium: "paid", utmCampaign: "", utmContent: "", utmTerm: "" });
  const [linkCreating, setLinkCreating] = useState(false);
  const [tab, setTab] = useState<"leads" | "links">("leads");
  const [statusFilter, setStatusFilter] = useState("all");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://aquareport.org";

  async function handleCreateLink() {
    if (!newLink.name || !newLink.slug) return;
    setLinkCreating(true);
    try {
      await createLink({
        name: newLink.name,
        slug: newLink.slug.replace(/[^a-z0-9-]/gi, "").toLowerCase(),
        utmSource: newLink.utmSource || undefined,
        utmMedium: newLink.utmMedium || undefined,
        utmCampaign: newLink.utmCampaign || undefined,
        utmContent: newLink.utmContent || undefined,
        utmTerm: newLink.utmTerm || undefined,
      });
      setNewLink({ name: "", slug: "", utmSource: "facebook", utmMedium: "paid", utmCampaign: "", utmContent: "", utmTerm: "" });
      setShowNewLink(false);
      toast.success("Tracking link created");
    } catch (e: any) {
      toast.error(e.message || "Failed to create link");
    } finally {
      setLinkCreating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const filteredLeads = statusFilter === "all" ? dealerLeads : dealerLeads.filter((l: any) => l.status === statusFilter);
  const leadsByStatus = LEAD_STATUSES.map((s) => ({
    ...s,
    count: dealerLeads.filter((l: any) => l.status === s.value).length,
  }));

  return (
    <div className="border rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-cyan-500/10">
            <Megaphone className="size-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Dealer Lead Capture</h2>
            <p className="text-sm text-muted-foreground">
              Trackable landing pages for Facebook ads &amp; dealer outreach
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("leads")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === "leads" ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            Leads ({dealerLeads.length})
          </button>
          <button
            onClick={() => setTab("links")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === "links" ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            Tracking Links ({trackingLinks.length})
          </button>
        </div>
      </div>

      {tab === "links" && (
        <div className="space-y-4">
          {/* Create Link Form */}
          {showNewLink ? (
            <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
              <h3 className="text-sm font-bold">New Tracking Link</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    type="text"
                    value={newLink.name}
                    onChange={(e) => setNewLink((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Facebook — Water Dealers May"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">URL Slug</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">/book-demo/</span>
                    <input
                      type="text"
                      value={newLink.slug}
                      onChange={(e) => setNewLink((p) => ({ ...p, slug: e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase() }))}
                      placeholder="fb-may26"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm"] as const).map((f) => (
                  <div key={f} className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">{f.replace("utm", "utm_").replace(/([A-Z])/g, "_$1").toLowerCase().replace("utm__", "utm_")}</label>
                    <input
                      type="text"
                      value={newLink[f]}
                      onChange={(e) => setNewLink((p) => ({ ...p, [f]: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowNewLink(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateLink} disabled={linkCreating || !newLink.name || !newLink.slug}>
                  {linkCreating ? <Loader2 className="size-3 animate-spin mr-1" /> : <Plus className="size-3 mr-1" />}
                  Create Link
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowNewLink(true)}>
              <Plus className="size-3 mr-1" />
              New Tracking Link
            </Button>
          )}

          {/* Links Table */}
          {trackingLinks.length > 0 ? (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">URL</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Clicks</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Leads</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Conv %</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingLinks.map((link: any) => {
                    const fullUrl = `${baseUrl}/book-demo/${link.slug}`;
                    const convRate = link.clickCount > 0 ? ((link.leadCount / link.clickCount) * 100).toFixed(1) : "—";
                    return (
                      <tr key={link._id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium">{link.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {[link.utmSource, link.utmMedium, link.utmCampaign].filter(Boolean).join(" · ")}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">{fullUrl}</code>
                            <button onClick={() => copyToClipboard(fullUrl)} className="p-1 rounded hover:bg-muted" title="Copy URL">
                              <Copy className="size-3 text-muted-foreground" />
                            </button>
                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted" title="Open">
                              <ExternalLink className="size-3 text-muted-foreground" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums font-semibold">{link.clickCount}</td>
                        <td className="px-4 py-3 text-center tabular-nums font-semibold">{link.leadCount}</td>
                        <td className="px-4 py-3 text-center tabular-nums">{convRate}%</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleLink({ linkId: link._id, isActive: !link.isActive })}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${link.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                          >
                            {link.isActive ? "Active" : "Paused"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async () => { if (confirm("Delete this tracking link?")) { await deleteLink({ linkId: link._id }); toast.success("Link deleted"); } }}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Link2 className="size-8 mx-auto opacity-30 mb-2" />
              <p>No tracking links yet. Create one to start capturing leads.</p>
            </div>
          )}
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-4">
          {/* Status Funnel */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${statusFilter === "all" ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              All ({dealerLeads.length})
            </button>
            {leadsByStatus.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${statusFilter === s.value ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {s.label} ({s.count})
              </button>
            ))}
          </div>

          {/* Leads Table */}
          {filteredLeads.length > 0 ? (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Lead</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Company</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Source</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: any) => {
                    const statusObj = LEAD_STATUSES.find((s) => s.value === lead.status) || LEAD_STATUSES[0];
                    return (
                      <tr key={lead._id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium">{lead.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="size-3" />{lead.email}</span>
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="size-3" />{lead.phone}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{lead.companyName || "—"}</p>
                          {lead.companySize && <p className="text-xs text-muted-foreground">{lead.companySize} reps</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            {lead.trackingLinkName ? (
                              <span className="font-medium">{lead.trackingLinkName}</span>
                            ) : lead.utmSource ? (
                              <span>{lead.utmSource}/{lead.utmMedium || "—"}</span>
                            ) : (
                              <span className="text-muted-foreground">Direct</span>
                            )}
                            {lead.utmCampaign && <p className="text-muted-foreground mt-0.5">{lead.utmCampaign}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLead({ leadId: lead._id, status: e.target.value })}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-0 cursor-pointer ${statusObj.color}`}
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground tabular-nums">
                          {new Date(lead._creationTime).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async () => { if (confirm("Delete this lead?")) { await deleteLead({ leadId: lead._id }); toast.success("Lead deleted"); } }}
                            className="p-1 rounded hover:bg-red-500/10 text-red-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="size-8 mx-auto opacity-30 mb-2" />
              <p>{statusFilter === "all" ? "No dealer leads yet. Create a tracking link and start running ads!" : "No leads with this status."}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const isAdmin = useQuery(api.admin.isPlatformAdmin);
  const stats = useQuery(api.admin.getPlatformStats);
  const companies = useQuery(api.admin.getAllCompanies);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [selectedCompany, setSelectedCompany] = useState<Id<"companies"> | null>(null);

  const filtered = useMemo(() => {
    if (!companies) return [];
    let list = companies;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          c.ownerName.toLowerCase().includes(q) ||
          c.ownerEmail.toLowerCase().includes(q)
      );
    }
    if (planFilter !== "all") {
      list = list.filter((c: any) => c.plan === planFilter);
    }
    switch (sort) {
      case "reports":
        list = [...list].sort((a: any, b: any) => b.reportCount - a.reportCount);
        break;
      case "demos":
        list = [...list].sort((a: any, b: any) => b.demoCount - a.demoCount);
        break;
      case "members":
        list = [...list].sort((a: any, b: any) => b.memberCount - a.memberCount);
        break;
      case "mrr":
        list = [...list].sort((a: any, b: any) => b.mrr - a.mrr);
        break;
    }
    return list;
  }, [companies, search, planFilter, sort]);

  if (isAdmin === undefined || stats === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <ShieldCheck className="size-12 opacity-40" />
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm">This page is restricted to platform administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="size-6 text-blue-500" />
          Platform Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all companies, users, and revenue across AquaReport
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Companies" value={stats.totalCompanies} icon={Building2} color="#3b82f6" />
          <StatCard label="Users" value={stats.totalUsers} icon={Users} color="#8b5cf6" />
          <StatCard label="Reports" value={stats.totalReports} icon={FileText} color="#10b981" />
          <StatCard label="Demos" value={stats.totalDemos ?? 0} icon={Activity} color="#06b6d4" />
          <StatCard
            label="MRR"
            value={`$${(stats.mrr ?? 0).toLocaleString()}`}
            icon={CreditCard}
            color="#f59e0b"
          />
          <StatCard
            label="Paid"
            value={stats.activeSubscriptions}
            sub={`of ${stats.totalCompanies} total`}
            icon={CheckCircle}
            color="#f43f5e"
          />
        </div>
      )}

      {/* Charts Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3">Companies by Plan</h3>
            <div className="space-y-2">
              {Object.entries(stats.planBreakdown || {}).map(([plan, count]: [string, any]) => (
                <div key={plan} className="flex items-center gap-3">
                  <PlanBadge plan={plan} />
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500/60"
                      style={{ width: `${(count / Math.max(stats.totalCompanies, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3">Weekly Signups (12 weeks)</h3>
            {stats.weeklySignups && (
              <>
                <MiniBarChart values={stats.weeklySignups.map((w: any) => w.count)} color="#3b82f6" />
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  {stats.weeklySignups
                    .filter((_: any, i: number) => i % 3 === 0)
                    .map((w: any) => (
                      <span key={w.week}>{w.week}</span>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Company Table */}
      <div className="border rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies, owners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border bg-background text-sm cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-xl border bg-background text-sm cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="reports">Most Reports</option>
              <option value="demos">Most Demos</option>
              <option value="members">Most Members</option>
              <option value="mrr">Highest MRR</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium text-center">Plan</th>
                <th className="px-4 py-3 font-medium text-right">Members</th>
                <th className="px-4 py-3 font-medium text-right">Reports</th>
                <th className="px-4 py-3 font-medium text-right">Demos</th>
                <th className="px-4 py-3 font-medium text-right">Leads</th>
                <th className="px-4 py-3 font-medium text-right">MRR</th>
                <th className="px-4 py-3 font-medium text-right">Joined</th>
                <th className="px-4 py-3 font-medium text-right w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr
                  key={c._id}
                  className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedCompany(c._id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} className="size-7 rounded-lg object-contain" alt="" />
                      ) : (
                        <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
                          {c.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.ownerName}</td>
                  <td className="px-4 py-3 text-center">
                    <PlanBadge plan={c.plan} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.memberCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.reportCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.demoCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.leadCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    {c.mrr > 0 ? `$${c.mrr}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="size-4 text-muted-foreground inline" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t text-xs text-muted-foreground text-right">
          {filtered.length} of {companies?.length || 0} companies
        </div>
      </div>

      {/* ─── Facebook & Tracking Section ─── */}
      <div className="border rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-blue-500/10">
            <BarChart3 className="size-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Facebook & Tracking</h2>
            <p className="text-sm text-muted-foreground">Pixel tracking, lead ads, and attribution</p>
          </div>
        </div>
        <div className="space-y-6">
          <PixelCodeCard />
          <FacebookIntegrationCard />
          <div className="space-y-2">
            <p className="text-sm font-semibold">Tracked Events</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {["PageView", "Lead", "DemoStarted", "DemoCompleted", "DealClosed", "Purchase"].map((evt) => (
                <div key={evt} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span>{evt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Enterprise Management ─── */}
      <EnterpriseSection companies={companies ?? []} />

      {/* ─── Dealer Lead Capture ─── */}
      <DealerLeadSection />

      {/* ─── Platform Admin Management ─── */}
      <AdminManagementSection />

      {/* Company Detail Modal */}
      {selectedCompany && (
        <CompanyDetailModal companyId={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
}
