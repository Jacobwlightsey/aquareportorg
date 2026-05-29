import { useAction, useMutation, useQuery } from "convex/react";
import {
  Building2,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Droplets,
  ExternalLink,
  FileText,
  Sparkles,
  GripVertical,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Globe,
  Plus,
  Settings,
  Trash2,
  Users,
  UserCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Upload,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS_FLAT as SUBSCRIPTION_PLANS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import { getCountryText } from "@/lib/i18n";
import { Link, useNavigate } from "react-router-dom";
import { DemoSetupWizard } from "@/components/DemoSetupWizard";


type TeamRole = "owner" | "sales_rep";

/* ═══════════════════════════════════════════════════════════════════
   Main Page — Apple Settings iOS aesthetic
   Single scrollable page, no tabs, auto-save with debounce
   ═══════════════════════════════════════════════════════════════════ */

export function CompanySettingsPage() {
  const navigate = useNavigate();
  const company = useQuery(api.companies.getMyCompany);
  const t = getCountryText(company?.country);
  const members = useQuery(api.companies.getTeamMembers);
  const createCompany = useMutation(api.companies.createCompany);
  const updateCompany = useMutation(api.companies.updateCompany);
  const addMember = useMutation(api.companies.addTeamMember);
  const removeMember = useMutation(api.companies.removeTeamMember);
  const revokeInvite = useMutation(api.companies.revokeInvite);
  const [showSetup, setShowSetup] = useState(false);

  if (company === null) {
    return <CreateCompanyForm onCreate={createCompany} onCreated={() => setShowSetup(true)} />;
  }

  // Show wizard only when explicitly triggered (new company creation) —
  // don't show for existing companies that just haven't set demoConfig yet
  if (showSetup && company) {
    return (
      <DemoSetupWizard
        company={company}
        onComplete={() => { setShowSetup(false); navigate("/dashboard", { replace: true }); }}
        onSkip={() => { setShowSetup(false); }}
      />
    );
  }

  if (company === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isAdmin = company.role === "owner";

  return (
    <div className="max-w-xl mx-auto pb-24">
      {/* Page header */}
      <div className="pt-6 pb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Company, branding, demo config, team & billing
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Company ── */}
        <CompanySection company={company} onUpdate={updateCompany} />

        {/* ── Branding ── */}
        <BrandingSection company={company} onUpdate={updateCompany} />

        {/* ── Demo Config (all sections inline) ── */}
        {isAdmin && <DemoWizardStepsSection />}
        {isAdmin && <DemoConfigSections company={company} />}

        {/* ── Team ── */}
        <TeamSection
          members={members ?? []}
          isAdmin={isAdmin}
          onAdd={addMember}
          onRemove={removeMember}
          onRevoke={revokeInvite}
        />

        {/* ── Proposals ── */}
        {isAdmin && <ProposalTemplateSection company={company} onUpdate={updateCompany} />}

        {/* ── Billing ── */}
        {isAdmin && <BillingSection />}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SettingsSection — Reusable section wrapper (always open)
   ═══════════════════════════════════════════════════════════════════ */

function SettingsSection({ emoji, title, description, children }: { emoji: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{emoji}</span>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EmojiListItem — emoji circle + label + description, hover delete
   ═══════════════════════════════════════════════════════════════════ */

function EmojiListItem({
  emoji,
  label,
  description,
  onEmojiChange,
  onLabelChange,
  onDescriptionChange,
  onRemove,
}: {
  emoji: string;
  label: string;
  description?: string;
  onEmojiChange?: (v: string) => void;
  onLabelChange: (v: string) => void;
  onDescriptionChange?: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors">
      {onEmojiChange ? (
        <input
          value={emoji}
          onChange={(e) => onEmojiChange(e.target.value)}
          className="size-9 rounded-full bg-muted/50 text-center text-base shrink-0 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          style={{ lineHeight: "36px" }}
        />
      ) : (
        <div className="size-9 rounded-full bg-muted/50 flex items-center justify-center text-base shrink-0">{emoji}</div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <Input
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Label"
          className="h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none"
        />
        {onDescriptionChange !== undefined && (
          <Input
            value={description || ""}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Description"
            className="h-7 text-xs text-muted-foreground border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none"
          />
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:!text-red-500 transition-colors cursor-pointer shrink-0 mt-1"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AddButton — simple "+ Add" text link
   ═══════════════════════════════════════════════════════════════════ */

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-blue-500 hover:text-blue-400 font-medium cursor-pointer transition-colors flex items-center gap-1.5 pl-3">
      <Plus className="size-3.5" /> {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Auto-save hook — 800ms debounce
   ═══════════════════════════════════════════════════════════════════ */

function useAutoSave(saveFn: () => Promise<void>, deps: any[], delay = 800) {
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setSaved(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await saveFn();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch { /* silent */ }
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, deps);

  return saved;
}

function SavedIndicator({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return <span className="text-[11px] text-emerald-500 font-medium animate-in fade-in">✓ Saved</span>;
}

/* ═══════════════════════════════════════════════════════════════════
   Company Section
   ═══════════════════════════════════════════════════════════════════ */

function CompanySection({ company, onUpdate }: { company: Record<string, unknown>; onUpdate: (args: Record<string, string | undefined>) => Promise<unknown> }) {
  const [country, setCountry] = useState((company.country as string) || "US");
  const t = getCountryText(country);
  const [name, setName] = useState((company.name as string) || "");
  const [email, setEmail] = useState((company.email as string) || "");
  const [phone, setPhone] = useState((company.phone as string) || "");
  const [website, setWebsite] = useState((company.website as string) || "");
  const [address, setAddress] = useState((company.address as string) || "");
  const [googleReviewUrl, setGoogleReviewUrl] = useState((company.googleReviewUrl as string) || "");

  useEffect(() => {
    setCountry((company.country as string) || "US");
    setName((company.name as string) || "");
    setEmail((company.email as string) || "");
    setPhone((company.phone as string) || "");
    setWebsite((company.website as string) || "");
    setAddress((company.address as string) || "");
    setGoogleReviewUrl((company.googleReviewUrl as string) || "");
  }, [company]);

  const saved = useAutoSave(async () => {
    await onUpdate({
      country: country || "US",
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      googleReviewUrl: googleReviewUrl.trim() || undefined,
    });
  }, [country, name, email, phone, website, address, googleReviewUrl]);

  return (
    <SettingsSection emoji="🏢" title="Company" description="Your business info — appears on every report">
      <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Country / Region</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">
                <span className="flex items-center gap-2">🇺🇸 United States</span>
              </SelectItem>
              <SelectItem value="CA">
                <span className="flex items-center gap-2">🇨🇦 Canada</span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Sets your data source ({country === "CA" ? "Health Canada" : "EPA & EWG"}), labels ({t.zipLabel}, {t.stateLabel}), and regulatory standards across reports.
          </p>
        </div>
        <div><Label className="text-xs text-muted-foreground">Company Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.com" /></div>
          <div><Label className="text-xs text-muted-foreground">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" /></div>
        </div>
        <div><Label className="text-xs text-muted-foreground">Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" /></div>
        <div><Label className="text-xs text-muted-foreground">Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} /></div>
        <div><Label className="text-xs text-muted-foreground">Google Review Link</Label><Input value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} placeholder="https://g.page/r/your-business/review" /><p className="text-[11px] text-muted-foreground mt-0.5">Used in review request emails as the CTA button link</p></div>
      </div>
    </SettingsSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Branding Section
   ═══════════════════════════════════════════════════════════════════ */

function BrandingSection({ company, onUpdate }: { company: Record<string, unknown>; onUpdate: (args: Record<string, string | string[] | undefined>) => Promise<unknown> }) {
  const [color, setColor] = useState((company.primaryColor as string) || "#2563eb");
  const [logoUrl, setLogoUrl] = useState((company.logoUrl as string) || "");
  const [productName, setProductName] = useState((company.solutionProductName as string) || "Whole Home Advanced Filtration System");
  const [productImage, setProductImage] = useState((company.solutionProductImage as string) || "");
  const [productDescription, setProductDescription] = useState((company.solutionProductDescription as string) || "Hand-picked for this home's water profile and designed to protect every tap.");
  const [productBullets, setProductBullets] = useState(
    Array.isArray(company.solutionProductBullets)
      ? (company.solutionProductBullets as string[]).join("\n")
      : "Reduces chemicals, heavy metals, and harmful contaminants\nProtects your health and home\nImproves taste, skin, and hair\nHigh capacity, low maintenance"
  );
  const [retailValue, setRetailValue] = useState<number | "">(
    (company.solutionRetailValue as number) || ""
  );
  const [logoUploading, setLogoUploading] = useState(false);
  const [productImageUploading, setProductImageUploading] = useState(false);

  const generateUploadUrl = useMutation(api.companies.generateCompanyUploadUrl);
  const saveCompanyImage = useMutation(api.companies.saveCompanyImage);
  const removeCompanyImage = useMutation(api.companies.removeCompanyImage);

  useEffect(() => {
    setColor((company.primaryColor as string) || "#2563eb");
    setLogoUrl((company.logoUrl as string) || "");
    setProductName((company.solutionProductName as string) || "Whole Home Advanced Filtration System");
    setProductImage((company.solutionProductImage as string) || "");
    setProductDescription((company.solutionProductDescription as string) || "Hand-picked for this home's water profile and designed to protect every tap.");
    setProductBullets(
      Array.isArray(company.solutionProductBullets)
        ? (company.solutionProductBullets as string[]).join("\n")
        : "Reduces chemicals, heavy metals, and harmful contaminants\nProtects your health and home\nImproves taste, skin, and hair\nHigh capacity, low maintenance"
    );
    setRetailValue((company.solutionRetailValue as number) || "");
  }, [company]);

  /** Upload an image to Convex file storage and save to company record */
  const uploadImage = async (file: File, field: "logo" | "productImage") => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    if (file.size > 5_000_000) { toast.error("Image must be under 5 MB"); return; }
    const setUploading = field === "logo" ? setLogoUploading : setProductImageUploading;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      const url = await saveCompanyImage({ field, storageId });
      if (field === "logo") setLogoUrl(url);
      else setProductImage(url);
      toast.success(field === "logo" ? "Logo uploaded!" : "Product image uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (field: "logo" | "productImage") => {
    try {
      await removeCompanyImage({ field });
      if (field === "logo") setLogoUrl("");
      else setProductImage("");
      toast.success(field === "logo" ? "Logo removed" : "Product image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const saved = useAutoSave(async () => {
    await onUpdate({
      primaryColor: color,
      solutionProductName: productName.trim() || undefined,
      solutionProductDescription: productDescription.trim() || undefined,
      solutionProductBullets: productBullets.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6),
      solutionRetailValue: typeof retailValue === "number" ? retailValue : undefined,
    });
  }, [color, productName, productDescription, productBullets, retailValue]);

  const presetColors = ["#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#1e293b"];

  return (
    <SettingsSection emoji="🎨" title="Branding" description="Colors, logos, product info for reports & demos">
      <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>

      <div>
        <Label className="text-xs text-muted-foreground">Primary Color</Label>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex gap-2">
            {presetColors.map((c) => (
              <button
                key={c} type="button" onClick={() => setColor(c)}
                className="size-7 rounded-full border-2 transition-all cursor-pointer"
                style={{ backgroundColor: c, borderColor: color === c ? c : "transparent", boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none" }}
              />
            ))}
          </div>
          <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-7 p-0 border-0 cursor-pointer" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Company Logo</Label>
          {logoUrl ? (
            <div className="flex items-center gap-3 mt-1">
              <img src={logoUrl} alt="" className="max-h-10 max-w-40 object-contain" />
              <Button type="button" size="sm" variant="outline" disabled={logoUploading} onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/png,image/jpeg,image/webp";
                input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadImage(f, "logo"); };
                input.click();
              }}>{logoUploading ? <><Loader2 className="size-3 animate-spin mr-1" />Uploading…</> : "Change Logo"}</Button>
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveImage("logo")}>Remove</Button>
            </div>
          ) : (
            <div className="mt-1">
              <Input key="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" disabled={logoUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "logo"); if (e.target) e.target.value = ""; }} />
              {logoUploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="size-3 animate-spin" />Uploading…</p>}
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Product Image</Label>
          <div className="mt-1">
            {productImage ? (
              <div className="flex items-center gap-3">
                <img src={productImage} alt="" className="max-h-10 max-w-40 object-contain" />
                <Button type="button" size="sm" variant="outline" disabled={productImageUploading} onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/png,image/jpeg,image/webp";
                  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadImage(f, "productImage"); };
                  input.click();
                }}>{productImageUploading ? <><Loader2 className="size-3 animate-spin mr-1" />Uploading…</> : "Change"}</Button>
                <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveImage("productImage")}>Remove</Button>
              </div>
            ) : (
              <>
                <Input type="file" accept="image/png,image/jpeg,image/webp" disabled={productImageUploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "productImage"); if (e.target) e.target.value = ""; }} />
                {productImageUploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="size-3 animate-spin" />Uploading…</p>}
              </>
            )}
          </div>
        </div>
      </div>

      <div><Label className="text-xs text-muted-foreground">Product Name</Label><Input value={productName} onChange={(e) => setProductName(e.target.value)} /></div>
      <div><Label className="text-xs text-muted-foreground">Product Description</Label><Textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} rows={2} /></div>
      <div><Label className="text-xs text-muted-foreground">Retail Value ($)</Label><Input type="number" placeholder="e.g. 12995" value={retailValue} onChange={(e) => setRetailValue(e.target.value ? Number(e.target.value) : "")} /></div>
      <div><Label className="text-xs text-muted-foreground">Benefits (one per line)</Label><Textarea value={productBullets} onChange={(e) => setProductBullets(e.target.value)} rows={3} /></div>
    </SettingsSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Demo Wizard Steps (drag to reorder, toggle visibility)
   ═══════════════════════════════════════════════════════════════════ */

const DEMO_STEPS = [
  { key: "intake",              label: "Intake (Rep-Only)",      color: "#8b5cf6", required: true },
  { key: "welcome",             label: "Welcome",               color: "#3b82f6", required: true },
  { key: "customerConcerns",    label: "What Matters Most",     color: "#8b5cf6", required: false },
  { key: "topConcerns",         label: "Top Concerns",          color: "#f97316", required: false },
  { key: "contaminants",        label: "Contaminant Breakdown", color: "#f59e0b", required: false },
  { key: "score",               label: "AquaScore Reveal",      color: "#10b981", required: false },
  { key: "test",                label: "Live Water Test",       color: "#06b6d4", required: false },
  { key: "verifiedScore",       label: "Verified Score",        color: "#10b981", required: false },
  { key: "impact",              label: "Personalized Impact",   color: "#f43f5e", required: false },
  { key: "scoreImprovement",    label: "Score Improvement",     color: "#8b5cf6", required: false },
  { key: "system",              label: "System Info",           color: "#3b82f6", required: false },
  { key: "trust",               label: "Trust & Proof",         color: "#22c55e", required: false },
  { key: "beforeAfter",         label: "Before & After",        color: "#8b5cf6", required: false },
  { key: "comparison",          label: "Monthly Expenses",      color: "#ec4899", required: false },
  { key: "pricing",             label: "Investment Overview",    color: "#10b981", required: false },
  { key: "investmentBreakdown", label: "Investment Breakdown",   color: "#10b981", required: false },
  { key: "transform",           label: "Score Journey",         color: "#8b5cf6", required: false },
  { key: "boost",               label: "Score Boost (RO)",      color: "#f59e0b", required: false },
  { key: "summary",             label: "Summary",               color: "#10b981", required: false },
  { key: "decision",            label: "Decision",              color: "#2563eb", required: false },
  { key: "customerClose",       label: "Customer Close",        color: "#22c55e", required: false },
  { key: "dealerClose",         label: "Dealer Wrap-Up",        color: "#64748b", required: true },
];

const STEP_KEY_ALIASES: Record<string, string> = { solution: "transform", close: "dealerClose" };

function DemoWizardStepsSection() {
  const company = useQuery(api.companies.getMyCompany);
  const updateStepConfig = useMutation(api.dealerShared.updateDemoStepConfig);
  const [steps, setSteps] = useState<Array<typeof DEMO_STEPS[0] & { enabled: boolean }>>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    const cfg = company.demoStepConfig as any;
    const normalize = (k: string) => STEP_KEY_ALIASES[k] ?? k;
    const disabled = new Set((cfg?.disabled ?? []).map(normalize));
    const stepMap = new Map(DEMO_STEPS.map((s) => [s.key, s]));
    let ordered: Array<typeof DEMO_STEPS[0] & { enabled: boolean }>;
    if (cfg?.order) {
      const seen = new Set<string>();
      ordered = cfg.order.map(normalize).filter((k: string) => stepMap.has(k) && !seen.has(k)).map((k: string) => {
        seen.add(k);
        const s = stepMap.get(k)!;
        return { ...s, enabled: !disabled.has(k) || s.required };
      });
      for (const s of DEMO_STEPS) {
        if (!seen.has(s.key)) ordered.push({ ...s, enabled: !disabled.has(s.key) || s.required });
      }
    } else {
      ordered = DEMO_STEPS.map((s) => ({ ...s, enabled: !disabled.has(s.key) || s.required }));
    }
    setSteps(ordered);
  }, [company]);

  const persist = useCallback(async (s: typeof steps) => {
    setSaving(true);
    try {
      await updateStepConfig({ order: s.map((x) => x.key), disabled: s.filter((x) => !x.enabled).map((x) => x.key) });
    } catch { /* silent */ }
    finally { setSaving(false); }
  }, [updateStepConfig]);

  const toggle = useCallback((idx: number) => {
    setSteps((prev) => {
      const next = [...prev];
      if (!next[idx].required) next[idx] = { ...next[idx], enabled: !next[idx].enabled };
      persist(next);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    const fresh = DEMO_STEPS.map((s) => ({ ...s, enabled: true }));
    setSteps(fresh);
    persist(fresh);
  }, [persist]);

  if (!company) return null;

  return (
    <SettingsSection emoji="🧙‍♂️" title="Demo Wizard Steps" description="Drag to reorder · toggle to show/hide">
      <div className="flex justify-end -mt-1">
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors">
          <RotateCcw className="size-3" /> Reset
        </button>
      </div>
      <div className="space-y-0.5">
        {steps.map((step, idx) => (
          <div
            key={step.key}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { setSteps((prev) => { const n = [...prev]; const [item] = n.splice(dragIdx, 1); n.splice(idx, 0, item); return n; }); setDragIdx(idx); } }}
            onDragEnd={() => { setDragIdx(null); setSteps((prev) => { persist(prev); return prev; }); }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all cursor-grab active:cursor-grabbing ${dragIdx === idx ? "bg-muted/50 scale-[1.02] shadow-lg" : "hover:bg-muted/30"} ${step.enabled ? "" : "opacity-40"}`}
          >
            <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />
            <div className="size-2 rounded-full shrink-0" style={{ background: step.color }} />
            <span className="flex-1 text-sm font-medium">
              {step.label}
              {step.required && <span className="ml-2 text-[10px] text-muted-foreground/50 uppercase tracking-wider">Required</span>}
            </span>
            <span className="text-[10px] text-muted-foreground/30 font-mono mr-1">{idx + 1}</span>
            <button
              onClick={() => toggle(idx)}
              disabled={step.required}
              className={`rounded p-1 transition-colors cursor-pointer ${step.required ? "text-muted-foreground/20 cursor-not-allowed" : step.enabled ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground/20 hover:text-foreground"}`}
            >
              {step.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </div>
        ))}
      </div>
      {saving && <p className="text-[10px] text-muted-foreground text-center">Saving…</p>}
    </SettingsSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   All Demo Config Sections — inline, auto-save, emoji items
   ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_CLOSE_OPTIONS = ["Sold — Install Scheduled", "Follow Up Needed", "Not Interested", "No Show"];
const COLOR_PRESETS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#0ea5e9", "#84cc16"];
const DEFAULT_REVIEWS = [
  { name: "Sarah M.", rating: 5, quote: "Best investment we ever made for our home. The water tastes amazing!" },
  { name: "Mike T.", rating: 5, quote: "Professional installation, great service. Wish we'd done it years ago." },
  { name: "Jennifer R.", rating: 5, quote: "My kids' skin cleared up within weeks. Can't recommend enough." },
];
const DEFAULT_CERTIFICATIONS = [
  { label: "WQA Certified", icon: "🏅" },
  { label: "NSF Listed", icon: "✅" },
  { label: "BBB A+", icon: "⭐" },
  { label: "EPA Registered", icon: "🛡️" },
];
const DEFAULT_CONCERN_OPTIONS = [
  { key: "drinking_water", label: "Drinking Water", description: "Clean, safe water for drinking", emoji: "💧" },
  { key: "family_health", label: "Family Health", description: "Keep my family safe and healthy", emoji: "❤️" },
  { key: "skin_and_hair", label: "Skin & Hair", description: "Softer skin and healthier hair", emoji: "✨" },
  { key: "appliances_plumbing", label: "Appliances", description: "Protect my home investments", emoji: "🏠" },
  { key: "taste_or_smell", label: "Taste & Smell", description: "Better tasting, odor-free water", emoji: "👃" },
  { key: "stains_buildup", label: "Hard Water", description: "No more stains or buildup", emoji: "🪨" },
  { key: "bottled_water_costs", label: "Bottled Water", description: "Stop buying bottled water", emoji: "💰" },
  { key: "peace_of_mind", label: "Peace of Mind", description: "Know my water is safe", emoji: "🛡️" },
];
const DEFAULT_DECISION_OPTIONS = [
  { key: "move_forward", label: "Move Forward Today", description: "Let's get your system scheduled and start protecting your home" },
  { key: "schedule_followup", label: "Schedule a Follow-Up", description: "Take time to think it over — we'll check back at a time that works for you" },
  { key: "send_report", label: "Send My Report", description: "Get your full water quality report emailed to review on your own" },
];
const DEFAULT_BENEFITS = ["Protect Your Family", "Improve Your Water", "Reduce Costs", "Enjoy Peace of Mind"];
const DEFAULT_FINANCING_TERMS = [60, 84, 120];

function DemoConfigSections({ company }: { company: any }) {
  const updateDemoConfig = useMutation(api.dealerShared.updateDemoConfig);
  const generateUploadUrl = useMutation(api.companies.generateCompanyUploadUrl);
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);
  const [cfg, setCfg] = useState<Record<string, any>>({});

  useEffect(() => {
    if (company && !initialized) {
      const v = (company as any).demoConfig || {};
      setCfg({
        accentColor: v.accentColor || "#3b82f6",
        welcomeHeadline: v.welcomeHeadline || "",
        welcomeSubtext: v.welcomeSubtext || "",
        highlightCategories: v.highlightCategories || [],
        concernOptions: v.concernOptions?.length ? v.concernOptions : DEFAULT_CONCERN_OPTIONS,
        trustInstallCount: v.trustSection?.installCount ?? 500,
        trustInstallArea: v.trustSection?.installArea || "",
        trustReviews: v.trustSection?.reviews?.length ? v.trustSection.reviews : DEFAULT_REVIEWS,
        trustCertifications: v.trustSection?.certifications?.length ? v.trustSection.certifications : DEFAULT_CERTIFICATIONS,
        projectedScore: v.projectedScore ?? 95,
        boostedScore: v.boostedScore ?? 99,
        skipScoreAnimation: v.skipScoreAnimation ?? false,
        systemIncludes: v.systemIncludes?.length ? v.systemIncludes : [
          { title: "Carbon Filtration", description: "Reduces chlorine, chemicals, bad taste & odor" },
          { title: "Water Softening", description: "Reduces hardness, scale & protects plumbing" },
          { title: "Sediment Filtration", description: "Reduces dirt, rust, sand & fine particles" },
        ],
        warrantyTitle: v.warrantyTitle || "20 Year Unlimited Warranty",
        warrantyBullets: v.warrantyBullets?.length ? v.warrantyBullets : [
          "20 Year Warranty on Tanks", "20 Year Warranty on Control Valve",
          "10 Year Warranty on Components", "5 Year Warranty on Labor",
          "100% Parts & Labor Coverage", "No Prorating — Ever", "Lifetime Customer Support",
        ],
        howItWorksSteps: v.howItWorksSteps?.length ? v.howItWorksSteps : [
          { title: "Water Analysis", description: "We test your water and review your local utility data to identify concerns." },
          { title: "Custom Design", description: "Your system is configured specifically for the contaminants in your water." },
          { title: "Professional Installation", description: "Certified technicians install your system — free of charge." },
          { title: "Enjoy Better Water", description: "Cleaner, softer water from every tap in your home, starting day one." },
        ],
        systemCallouts: v.systemCallouts?.length ? v.systemCallouts : ["Free Professional Installation", "Free Annual Water Review", "Lifetime Support"],
        revealPrice: v.revealPrice,
        discountOptions: v.discountOptions?.length ? v.discountOptions : [
          { id: "today", label: "Same-Day Decision", amount: 500, icon: "⚡" },
          { id: "referral", label: "Referral Credit", amount: 300, icon: "👥" },
          { id: "military", label: "Military / First Responder", amount: 250, icon: "🎖️" },
          { id: "senior", label: "Senior Discount", amount: 200, icon: "🤝" },
        ],
        costItems: v.costItems?.length ? v.costItems : [
          { label: "Bottled Water", monthlyCost: 120, enabled: true, emoji: "🚰" },
          { label: "Appliance Repairs", monthlyCost: 40, enabled: true, emoji: "🔧" },
          { label: "Plumbing Maintenance", monthlyCost: 30, enabled: true, emoji: "🚿" },
        ],
        systemCostMonthly: v.systemCostMonthly,
        financingEnabled: v.financing?.enabled ?? true,
        financingAprRange: v.financing?.aprRange || "0% – 9.99%",
        financingDefaultApr: v.financing?.defaultApr ?? 4.99,
        financingTerms: v.financing?.terms?.length ? v.financing.terms : DEFAULT_FINANCING_TERMS,
        financingProvider: v.financing?.provider || "",
        roSystemName: v.roSystemName || "Reverse Osmosis System",
        roSystemDescription: v.roSystemDescription || "",
        roSystemImage: v.roSystemImage || "",
        closeHeadline: v.closeHeadline || "",
        customerCloseSubtext: v.customerCloseSubtext || "",
        closeOptions: v.closeOptions?.length ? v.closeOptions : DEFAULT_CLOSE_OPTIONS,
        decisionOptions: v.decisionOptions?.length ? v.decisionOptions : DEFAULT_DECISION_OPTIONS,
        summaryBenefits: v.summaryBenefits?.length ? v.summaryBenefits : DEFAULT_BENEFITS,
        demoModes: v.demoModes || {},
      });
      setInitialized(true);
    }
  }, [company, initialized]);

  const update = useCallback((patch: Record<string, any>) => {
    setCfg((prev) => ({ ...prev, ...patch }));
  }, []);

  const resolveStorageUrl = useMutation(api.companies.resolveStorageUrl);

  /** Upload a demo config image (e.g. roSystemImage) to Convex storage */
  const uploadDemoImage = useCallback(async (file: File, field: string) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    if (file.size > 5_000_000) { toast.error("Image must be under 5 MB"); return; }
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      const url = await resolveStorageUrl({ storageId });
      update({ [field]: url });
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }, [generateUploadUrl, resolveStorageUrl, update]);

  const saved = useAutoSave(async () => {
    if (!initialized) return;
    const config: Record<string, any> = {};
    for (const [k, v] of Object.entries(cfg)) {
      if (k.startsWith("trust") || k.startsWith("financing")) continue;
      if (Array.isArray(v)) { if (v.length > 0) config[k] = v; }
      else if (v !== "" && v !== undefined && v !== null) config[k] = v;
    }
    config.trustSection = {
      installCount: cfg.trustInstallCount ?? 500,
      installArea: cfg.trustInstallArea || "",
      reviews: cfg.trustReviews?.length ? cfg.trustReviews : DEFAULT_REVIEWS,
      certifications: cfg.trustCertifications?.length ? cfg.trustCertifications : DEFAULT_CERTIFICATIONS,
    };
    config.financing = {
      enabled: cfg.financingEnabled ?? true,
      aprRange: cfg.financingAprRange || "0% – 9.99%",
      defaultApr: cfg.financingDefaultApr ?? 4.99,
      terms: cfg.financingTerms?.length ? cfg.financingTerms : DEFAULT_FINANCING_TERMS,
      provider: cfg.financingProvider || "",
    };
    await updateDemoConfig({ config });
  }, [JSON.stringify(cfg), initialized]);

  if (!initialized) return null;

  const accent = cfg.accentColor || "#3b82f6";

  return (
    <>
      {/* ── Welcome & Concerns ── */}
      <SettingsSection emoji="👋" title="Welcome & Concerns" description="First impression and customer concern cards">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div className="space-y-3">
          <div><Label className="text-xs text-muted-foreground">Welcome Headline</Label><Input value={cfg.welcomeHeadline || ""} placeholder="Your Water Quality Report" onChange={(e) => update({ welcomeHeadline: e.target.value })} /></div>
          <div><Label className="text-xs text-muted-foreground">Subtext</Label><Textarea value={cfg.welcomeSubtext || ""} placeholder="Let's look at what's in your water..." onChange={(e) => update({ welcomeSubtext: e.target.value })} rows={2} /></div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground font-semibold">Customer Concerns</Label>
          <div className="space-y-1 mt-2">
            {(cfg.concernOptions || []).map((item: any, idx: number) => (
              <EmojiListItem
                key={idx}
                emoji={item.emoji || "💧"}
                label={item.label}
                description={item.description}
                onEmojiChange={(v) => { const n = [...(cfg.concernOptions || [])]; n[idx] = { ...n[idx], emoji: v }; update({ concernOptions: n }); }}
                onLabelChange={(v) => { const n = [...(cfg.concernOptions || [])]; n[idx] = { ...n[idx], label: v }; update({ concernOptions: n }); }}
                onDescriptionChange={(v) => { const n = [...(cfg.concernOptions || [])]; n[idx] = { ...n[idx], description: v }; update({ concernOptions: n }); }}
                onRemove={() => { const n = [...(cfg.concernOptions || [])]; n.splice(idx, 1); update({ concernOptions: n }); }}
              />
            ))}
          </div>
          <AddButton label="Add concern" onClick={() => update({ concernOptions: [...(cfg.concernOptions || []), { key: `concern_${Date.now()}`, label: "", description: "", emoji: "💧" }] })} />
        </div>
      </SettingsSection>

      {/* ── Pricing & Investment ── */}
      <SettingsSection emoji="💰" title="Pricing & Investment" description="System price, discounts, and financing">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div className="space-y-3">
          <div><Label className="text-xs text-muted-foreground">Reveal Price</Label><Input type="number" value={cfg.revealPrice || ""} placeholder="e.g. 9995" onChange={(e) => update({ revealPrice: Number(e.target.value) || undefined })} /></div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground font-semibold">Stackable Discounts</Label>
          <div className="space-y-1 mt-2">
            {(cfg.discountOptions || []).map((d: any, idx: number) => (
              <EmojiListItem
                key={idx}
                emoji={d.icon}
                label={d.label}
                description={`$${d.amount || 0} off`}
                onEmojiChange={(v) => { const n = [...(cfg.discountOptions || [])]; n[idx] = { ...n[idx], icon: v }; update({ discountOptions: n }); }}
                onLabelChange={(v) => { const n = [...(cfg.discountOptions || [])]; n[idx] = { ...n[idx], label: v }; update({ discountOptions: n }); }}
                onDescriptionChange={(v) => { const amt = parseInt(v.replace(/[^0-9]/g, "")) || 0; const n = [...(cfg.discountOptions || [])]; n[idx] = { ...n[idx], amount: amt }; update({ discountOptions: n }); }}
                onRemove={() => { const n = [...(cfg.discountOptions || [])]; n.splice(idx, 1); update({ discountOptions: n }); }}
              />
            ))}
          </div>
          <AddButton label="Add discount" onClick={() => update({ discountOptions: [...(cfg.discountOptions || []), { id: `d_${Date.now()}`, label: "", amount: 0, icon: "🏷️" }] })} />
        </div>
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="finEnabled" checked={cfg.financingEnabled ?? true} onChange={(e) => update({ financingEnabled: e.target.checked })} className="cursor-pointer" />
            <Label htmlFor="finEnabled" className="text-xs cursor-pointer">Financing enabled</Label>
          </div>
          {cfg.financingEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">APR Range</Label><Input value={cfg.financingAprRange || ""} placeholder="0% – 9.99%" onChange={(e) => update({ financingAprRange: e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground">Default APR</Label><Input type="number" step="0.01" value={cfg.financingDefaultApr ?? 4.99} onChange={(e) => update({ financingDefaultApr: Number(e.target.value) })} /></div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* ── Cost Comparison ── */}
      <SettingsSection emoji="📊" title="Cost Comparison" description="Monthly expenses without filtration vs. your system">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div className="space-y-1">
          {(cfg.costItems || []).map((item: any, idx: number) => (
            <EmojiListItem
              key={idx}
              emoji={item.emoji || "💧"}
              label={item.label}
              description={`$${item.monthlyCost || 0}/mo`}
              onEmojiChange={(v) => { const n = [...(cfg.costItems || [])]; n[idx] = { ...n[idx], emoji: v }; update({ costItems: n }); }}
              onLabelChange={(v) => { const n = [...(cfg.costItems || [])]; n[idx] = { ...n[idx], label: v }; update({ costItems: n }); }}
              onDescriptionChange={(v) => { const amt = parseInt(v.replace(/[^0-9]/g, "")) || 0; const n = [...(cfg.costItems || [])]; n[idx] = { ...n[idx], monthlyCost: amt }; update({ costItems: n }); }}
              onRemove={() => { const n = [...(cfg.costItems || [])]; n.splice(idx, 1); update({ costItems: n }); }}
            />
          ))}
        </div>
        <AddButton label="Add cost item" onClick={() => update({ costItems: [...(cfg.costItems || []), { label: "", monthlyCost: 0, enabled: true, emoji: "💧" }] })} />
        <div className="pt-2"><Label className="text-xs text-muted-foreground">Your System Monthly Cost</Label><Input type="number" value={cfg.systemCostMonthly || ""} placeholder="e.g. 49" onChange={(e) => update({ systemCostMonthly: Number(e.target.value) || undefined })} /></div>
      </SettingsSection>

      {/* ── System & Warranty ── */}
      <SettingsSection emoji="🔧" title="System & Warranty" description="What's included, warranty details, how it works">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div>
          <Label className="text-xs text-muted-foreground font-semibold">System Includes</Label>
          <div className="space-y-2 mt-2">
            {(cfg.systemIncludes || []).map((item: any, idx: number) => (
              <div key={idx} className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors">
                <div className="size-9 rounded-full bg-muted/50 flex items-center justify-center text-base shrink-0">⚙️</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <Input value={item.title} onChange={(e) => { const n = [...(cfg.systemIncludes || [])]; n[idx] = { ...n[idx], title: e.target.value }; update({ systemIncludes: n }); }} placeholder="Title" className="h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none" />
                  <Input value={item.description} onChange={(e) => { const n = [...(cfg.systemIncludes || [])]; n[idx] = { ...n[idx], description: e.target.value }; update({ systemIncludes: n }); }} placeholder="Description" className="h-7 text-xs text-muted-foreground border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none" />
                </div>
                <button onClick={() => { const n = [...(cfg.systemIncludes || [])]; n.splice(idx, 1); update({ systemIncludes: n }); }} className="p-1.5 rounded-lg text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:!text-red-500 transition-colors cursor-pointer shrink-0 mt-1"><X className="size-3.5" /></button>
              </div>
            ))}
          </div>
          <AddButton label="Add item" onClick={() => update({ systemIncludes: [...(cfg.systemIncludes || []), { title: "", description: "" }] })} />
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Warranty Title</Label>
          <Input value={cfg.warrantyTitle || ""} placeholder="20 Year Unlimited Warranty" onChange={(e) => update({ warrantyTitle: e.target.value })} className="mt-1" />
          <div className="space-y-1 mt-2">
            {(cfg.warrantyBullets || []).map((b: string, idx: number) => (
              <div key={idx} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <span className="text-muted-foreground/40 text-xs">•</span>
                <Input value={b} onChange={(e) => { const n = [...(cfg.warrantyBullets || [])]; n[idx] = e.target.value; update({ warrantyBullets: n }); }} className="flex-1 h-7 text-sm border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none" />
                <button onClick={() => { const n = [...(cfg.warrantyBullets || [])]; n.splice(idx, 1); update({ warrantyBullets: n }); }} className="p-1 rounded text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:!text-red-500 transition-colors cursor-pointer"><X className="size-3" /></button>
              </div>
            ))}
          </div>
          <AddButton label="Add warranty point" onClick={() => update({ warrantyBullets: [...(cfg.warrantyBullets || []), ""] })} />
        </div>
      </SettingsSection>

      {/* ── Trust & Social Proof ── */}
      <SettingsSection emoji="🏆" title="Trust & Social Proof" description="Reviews, certifications, install stats">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">Install Count</Label><Input type="number" value={cfg.trustInstallCount ?? 500} onChange={(e) => update({ trustInstallCount: Number(e.target.value) || 0 })} /></div>
          <div><Label className="text-xs text-muted-foreground">Install Area</Label><Input value={cfg.trustInstallArea || ""} placeholder="Phoenix, AZ" onChange={(e) => update({ trustInstallArea: e.target.value })} /></div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground font-semibold">Customer Reviews</Label>
          <div className="space-y-2 mt-2">
            {(cfg.trustReviews || []).map((review: any, idx: number) => (
              <div key={idx} className="group rounded-xl border p-3 bg-background space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input value={review.name} placeholder="Customer name" onChange={(e) => { const n = [...(cfg.trustReviews || [])]; n[idx] = { ...n[idx], name: e.target.value }; update({ trustReviews: n }); }} className="flex-1 text-sm font-semibold" />
                  <Select value={String(review.rating)} onValueChange={(v) => { const n = [...(cfg.trustReviews || [])]; n[idx] = { ...n[idx], rating: Number(v) }; update({ trustReviews: n }); }}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>{[5, 4, 3, 2, 1].map((num) => <SelectItem key={num} value={String(num)}>{num} ★</SelectItem>)}</SelectContent>
                  </Select>
                  <button onClick={() => { const n = [...(cfg.trustReviews || [])]; n.splice(idx, 1); update({ trustReviews: n }); }} className="p-1 rounded text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:!text-red-500 transition-colors cursor-pointer"><X className="size-3.5" /></button>
                </div>
                <Textarea value={review.quote} placeholder="Review quote..." onChange={(e) => { const n = [...(cfg.trustReviews || [])]; n[idx] = { ...n[idx], quote: e.target.value }; update({ trustReviews: n }); }} rows={2} className="text-xs resize-none" />
              </div>
            ))}
          </div>
          <AddButton label="Add review" onClick={() => update({ trustReviews: [...(cfg.trustReviews || []), { name: "", rating: 5, quote: "" }] })} />
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground font-semibold">Certifications</Label>
          <div className="space-y-1 mt-2">
            {(cfg.trustCertifications || []).map((cert: any, idx: number) => (
              <EmojiListItem
                key={idx}
                emoji={cert.icon}
                label={cert.label}
                onEmojiChange={(v) => { const n = [...(cfg.trustCertifications || [])]; n[idx] = { ...n[idx], icon: v }; update({ trustCertifications: n }); }}
                onLabelChange={(v) => { const n = [...(cfg.trustCertifications || [])]; n[idx] = { ...n[idx], label: v }; update({ trustCertifications: n }); }}
                onRemove={() => { const n = [...(cfg.trustCertifications || [])]; n.splice(idx, 1); update({ trustCertifications: n }); }}
              />
            ))}
          </div>
          <AddButton label="Add certification" onClick={() => update({ trustCertifications: [...(cfg.trustCertifications || []), { label: "", icon: "🏅" }] })} />
        </div>
      </SettingsSection>

      {/* ── Score & Boost ── */}
      <SettingsSection emoji="🚀" title="Score & Boost" description="Score settings and RO system boost">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Projected Score After Filtration</Label>
            <div className="flex items-center gap-3 mt-1">
              <input type="range" min={60} max={100} value={cfg.projectedScore ?? 95} onChange={(e) => update({ projectedScore: Number(e.target.value) })} className="flex-1 accent-blue-500 cursor-pointer" />
              <div className="size-10 rounded-full flex items-center justify-center text-foreground text-sm font-black" style={{ backgroundColor: accent }}>{cfg.projectedScore ?? 95}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Boosted Score (after RO)</Label><Input type="number" value={cfg.boostedScore ?? 99} onChange={(e) => update({ boostedScore: Number(e.target.value) })} /></div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="skipAnim" checked={cfg.skipScoreAnimation ?? false} onChange={(e) => update({ skipScoreAnimation: e.target.checked })} className="cursor-pointer" />
                <Label htmlFor="skipAnim" className="text-xs cursor-pointer">Skip animation</Label>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-2 space-y-3">
          <div><Label className="text-xs text-muted-foreground">RO System Name</Label><Input value={cfg.roSystemName || ""} onChange={(e) => update({ roSystemName: e.target.value })} /></div>
          <div><Label className="text-xs text-muted-foreground">RO Description</Label><Textarea value={cfg.roSystemDescription || ""} onChange={(e) => update({ roSystemDescription: e.target.value })} rows={2} /></div>
          {cfg.roSystemImage && (
            <div className="relative inline-block">
              <img src={cfg.roSystemImage} alt="RO System" className="max-h-20 rounded-lg border object-contain" />
              <button onClick={() => update({ roSystemImage: "" })} className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs cursor-pointer"><X className="size-3" /></button>
            </div>
          )}
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer justify-center">
            <Upload className="size-4" /> {cfg.roSystemImage ? "Replace RO Image" : "Upload RO Image"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadDemoImage(file, "roSystemImage");
              if (e.target) e.target.value = "";
            }} />
          </label>
        </div>
      </SettingsSection>

      {/* ── Closing ── */}
      <SettingsSection emoji="🤝" title="Closing" description="End screens, decision options, summary benefits">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div className="space-y-3">
          <div><Label className="text-xs text-muted-foreground">Close Headline</Label><Input value={cfg.closeHeadline || ""} placeholder="Thank You, {firstName}!" onChange={(e) => update({ closeHeadline: e.target.value })} /></div>
          <div><Label className="text-xs text-muted-foreground">Close Subtext</Label><Textarea value={cfg.customerCloseSubtext || ""} placeholder="We're excited to help you..." onChange={(e) => update({ customerCloseSubtext: e.target.value })} rows={2} /></div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground font-semibold">Decision Options</Label>
          <div className="space-y-2 mt-2">
            {(cfg.decisionOptions || []).map((item: any, idx: number) => (
              <div key={idx} className="group rounded-xl border p-3 bg-background space-y-1">
                <div className="flex items-center gap-2">
                  <Input value={item.label} placeholder="Option label" onChange={(e) => { const n = [...(cfg.decisionOptions || [])]; n[idx] = { ...n[idx], label: e.target.value }; update({ decisionOptions: n }); }} className="flex-1 text-sm font-semibold" />
                  <button onClick={() => { const n = [...(cfg.decisionOptions || [])]; n.splice(idx, 1); update({ decisionOptions: n }); }} className="p-1 rounded text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:!text-red-500 transition-colors cursor-pointer"><X className="size-3.5" /></button>
                </div>
                <Textarea value={item.description} placeholder="Description" onChange={(e) => { const n = [...(cfg.decisionOptions || [])]; n[idx] = { ...n[idx], description: e.target.value }; update({ decisionOptions: n }); }} rows={2} className="text-xs resize-none" />
              </div>
            ))}
          </div>
          {(cfg.decisionOptions || []).length < 4 && <AddButton label="Add option" onClick={() => update({ decisionOptions: [...(cfg.decisionOptions || []), { key: `opt_${Date.now()}`, label: "", description: "" }] })} />}
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground font-semibold">Dealer Close Options</Label>
          <div className="space-y-1 mt-2">
            {(cfg.closeOptions || []).map((opt: string, idx: number) => (
              <div key={idx} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <span className="size-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-muted shrink-0">{idx + 1}</span>
                <Input value={opt} onChange={(e) => { const n = [...(cfg.closeOptions || [])]; n[idx] = e.target.value; update({ closeOptions: n }); }} className="flex-1 h-7 text-sm border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none" />
                {(cfg.closeOptions || []).length > 2 && (
                  <button onClick={() => { const n = [...(cfg.closeOptions || [])]; n.splice(idx, 1); update({ closeOptions: n }); }} className="p-1 rounded text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:!text-red-500 transition-colors cursor-pointer"><X className="size-3" /></button>
                )}
              </div>
            ))}
          </div>
          <AddButton label="Add option" onClick={() => update({ closeOptions: [...(cfg.closeOptions || []), ""] })} />
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground font-semibold">Summary Benefits</Label>
          <div className="space-y-1 mt-2">
            {(cfg.summaryBenefits || []).map((b: string, idx: number) => (
              <div key={idx} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                <span className="text-emerald-500 shrink-0">✓</span>
                <Input value={b} onChange={(e) => { const n = [...(cfg.summaryBenefits || [])]; n[idx] = e.target.value; update({ summaryBenefits: n }); }} className="flex-1 h-7 text-sm border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none" />
                <button onClick={() => { const n = [...(cfg.summaryBenefits || [])]; n.splice(idx, 1); update({ summaryBenefits: n }); }} className="p-1 rounded text-muted-foreground/0 group-hover:text-muted-foreground/50 hover:!text-red-500 transition-colors cursor-pointer"><X className="size-3" /></button>
              </div>
            ))}
          </div>
          {(cfg.summaryBenefits || []).length < 6 && <AddButton label="Add benefit" onClick={() => update({ summaryBenefits: [...(cfg.summaryBenefits || []), ""] })} />}
        </div>
      </SettingsSection>

      {/* ── Advanced ── */}
      <SettingsSection emoji="⚙️" title="Advanced" description="Demo modes, accent color, re-run setup">
        <div className="flex items-center justify-end -mt-1 mb-1"><SavedIndicator saved={saved} /></div>
        <div>
          <Label className="text-xs text-muted-foreground">Demo Accent Color</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => update({ accentColor: c })} className={`size-7 rounded-xl transition-all cursor-pointer ${accent === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }} />
            ))}
            <input type="color" value={accent} onChange={(e) => update({ accentColor: e.target.value })} className="w-7 h-7 rounded-lg border cursor-pointer bg-transparent" />
          </div>
        </div>
        <div className="pt-3">
          <button
            onClick={() => navigate("/company", { state: { rerunSetup: true } })}
            className="text-sm text-blue-500 hover:text-blue-400 font-medium cursor-pointer transition-colors"
          >
            🧙‍♂️ Re-run Setup Wizard
          </button>
        </div>
      </SettingsSection>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Team Section
   ═══════════════════════════════════════════════════════════════════ */

function TeamSection({
  members,
  isAdmin,
  onAdd,
  onRemove,
  onRevoke,
}: {
  members: Array<{
    _id: string;
    kind?: string;
    name?: string;
    email?: string;
    role: string;
    reportCount: number;
    expiresAt?: number;
    teamLimit?: number | null;
    teamUsed?: number;
  }>;
  isAdmin: boolean;
  onAdd: (args: { name: string; email: string; role: TeamRole }) => Promise<unknown>;
  onRemove: (args: { memberId: any }) => Promise<unknown>;
  onRevoke: (args: { inviteId: any }) => Promise<unknown>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("sales_rep");
  const [adding, setAdding] = useState(false);
  const teamLimit = members[0]?.teamLimit ?? null;
  const teamUsed = members[0]?.teamUsed ?? members.length;
  const atLimit = typeof teamLimit === "number" && teamUsed >= teamLimit;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || !newEmail.trim() || atLimit) return;
    setAdding(true);
    try {
      await onAdd({ name: newName.trim(), email: newEmail.trim(), role: newRole });
      toast.success("Invite sent");
      setAddOpen(false);
      setNewName(""); setNewEmail(""); setNewRole("sales_rep");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite");
    } finally { setAdding(false); }
  };

  return (
    <SettingsSection emoji="👥" title={`Team (${members.length})`} description="Manage members and pending invites">
      {typeof teamLimit === "number" && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">📊 {teamUsed}/{teamLimit} seats used</p>
          <div className="h-2 rounded-full bg-muted overflow-hidden w-48">
            <div className={`h-full rounded-full transition-all ${atLimit ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${Math.min(100, Math.round((teamUsed / teamLimit) * 100))}%` }} />
          </div>
        </div>
      )}
      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-center justify-between">
          <span>Team limit reached.</span>
          <Link to="/subscription" className="font-semibold hover:underline ml-2 whitespace-nowrap">Upgrade →</Link>
        </div>
      )}
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member._id} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center"><UserCircle className="size-5 text-blue-500" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{member.name || "Unnamed"}</p>
                  {member.kind === "invite" && <span className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">Pending</span>}
                  {member.role === "owner" && <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">Owner</span>}
                </div>
                <p className="text-xs text-muted-foreground">{member.email || "No email"} · {member.kind === "invite" ? "invite sent" : `${member.reportCount} reports`}</p>
              </div>
            </div>
            {isAdmin && member.kind === "invite" && (
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={async () => { try { await onRevoke({ inviteId: member._id }); toast.success("Invite revoked"); } catch { toast.error("Failed"); } }}><Trash2 className="size-3" /></Button>
            )}
            {isAdmin && member.kind !== "invite" && member.role !== "owner" && (
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={async () => { try { await onRemove({ memberId: member._id }); toast.success("Member removed"); } catch { toast.error("Failed"); } }}><Trash2 className="size-3" /></Button>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <Button variant="outline" size="sm" disabled={atLimit} onClick={() => setAddOpen(true)} className="w-full"><Plus className="size-4" /> Invite Member</Button>
      )}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle><DialogDescription>Send an invite link to a new member.</DialogDescription></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input placeholder="John Smith" value={newName} onChange={(e) => setNewName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="john@company.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as TeamRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={adding || atLimit}>{adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Send Invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Proposal Template Section
   ═══════════════════════════════════════════════════════════════════ */

function ProposalTemplateSection({ company, onUpdate }: { company: Record<string, unknown>; onUpdate: (args: Record<string, string | undefined>) => Promise<unknown> }) {
  const generateUploadUrl = useMutation(api.dealerShared.generateUploadUrl);
  const getStorageUrl = useQuery(api.dealerShared.getStorageUrl, company.customProposalUrl ? { storageId: company.customProposalUrl as any } : "skip");
  const [uploading, setUploading] = useState(false);
  const customUrl = (company.customProposalUrl as string) || "";

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      // Store the storageId — resolved to URL via getStorageUrl query
      await onUpdate({ customProposalUrl: storageId });
      toast.success("Custom proposal template uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    await onUpdate({ customProposalUrl: undefined });
    toast.success("Custom template removed — proposals will use auto-generated template.");
  };

  return (
    <SettingsSection emoji="📄" title="Proposal Template" description="Upload a custom proposal PDF or use the auto-generated branded template.">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-violet-400" />
            <p className="text-sm font-medium">
              {customUrl ? "Custom Template Active" : "Using Default Template"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {customUrl
              ? "Your custom PDF will be sent when reps tap \"Send Proposal\" at the end of a demo. Remove it to switch back to auto-generated proposals."
              : "Proposals are auto-generated with your branding, water data, and equipment from each report. Upload a custom PDF to override this."}
          </p>

          {customUrl ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-violet-400 border-violet-500/30">Custom PDF</Badge>
              <Button size="sm" variant="outline" onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/pdf";
                input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleUpload(f); };
                input.click();
              }} disabled={uploading}>
                {uploading ? "Uploading..." : "Replace"}
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={handleRemove}>Remove</Button>
            </div>
          ) : (
            <div>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                disabled={uploading}
              />
              {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Billing Section
   ═══════════════════════════════════════════════════════════════════ */

function BillingSection() {
  const navigate = useNavigate();
  const subscription = useQuery(api.stripe.getSubscription);
  const createPortal = useAction(api.stripe.createPortalSession);
  const [loading, setLoading] = useState("");

  const handleManageBilling = async () => {
    setLoading("portal");
    try {
      const { url } = await createPortal();
      if (url) window.location.href = url;
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to open billing portal"); }
    finally { setLoading(""); }
  };

  const currentPlan = subscription?.plan || "free";
  const isActive = subscription?.status === "active";

  return (
    <SettingsSection emoji="💳" title="Billing & Subscription" description="Manage your plan and payment settings">
      <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
        <div>
          <p className="text-sm text-muted-foreground">Current Plan</p>
          <p className="text-lg font-bold capitalize">{currentPlan}</p>
          {isActive && subscription?.periodEnd && <p className="text-xs text-muted-foreground mt-0.5">Renews {new Date(subscription.periodEnd).toLocaleDateString()}</p>}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : currentPlan === "free" ? "bg-gray-100 text-muted-foreground dark:bg-gray-800 dark:text-muted-foreground" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"}`}>
          {isActive ? "Active" : currentPlan === "free" ? "1 free report" : subscription?.status || "Inactive"}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link to="/subscription">Manage Subscription</Link>
        </Button>
        {isActive && (
          <Button variant="outline" onClick={handleManageBilling} disabled={loading === "portal"}>
            {loading === "portal" ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
            Billing Portal
          </Button>
        )}
        {!isActive && currentPlan === "free" && (
          <Button asChild>
            <Link to="/subscription">
              <Sparkles className="size-4" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </div>
    </SettingsSection>
  );
}




/* ═══════════════════════════════════════════════════════════════════
   CreateCompanyForm — shown when no company exists
   ═══════════════════════════════════════════════════════════════════ */

function CreateCompanyForm({ onCreate, onCreated }: { onCreate: (args: { name: string; email?: string; phone?: string }) => Promise<unknown>; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined });
      toast.success("Company created!");
      onCreated();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create company"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 mx-auto mb-2"><Building2 className="size-7 text-blue-500" /></div>
          <CardTitle>Set Up Your Company</CardTitle>
          <CardDescription>Create your company profile to start generating branded reports</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Company Name *</Label><Input id="name" placeholder="e.g. Pure Water Solutions" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Business Email</Label><Input id="email" type="email" placeholder="info@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <Button type="submit" disabled={loading || !name.trim()} className="w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />} Create Company
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
