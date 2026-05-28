import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  FlaskConical,
  Loader2,
  Search,
  User,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { contaminantName, isDetectedContaminant, type WaterReport } from "@/lib/supabase";
import { computeAquaScore } from "@/lib/waterScore";
import { scoreClass } from "@/lib/pipeline";
import { FreeTrialExhausted } from "@/components/FreeTierCTA";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { api } from "../../convex/_generated/api";
import { getCountryText, isCodeReadyForLookup } from "@/lib/i18n";

interface LeadInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

interface UtilityOption {
  pwsid: string;
  utility_name: string;
  city: string;
  state: string;
  country?: string;
  population_served: number;
  water_source: string;
}

function normalizeUtilityOption(raw: any): UtilityOption | null {
  if (!raw || typeof raw !== "object") return null;
  const pwsid = String(raw.pwsid ?? raw.pws_id ?? raw.pwsId ?? "").trim();
  if (!pwsid) return null;
  return {
    pwsid,
    utility_name: String(raw.utility_name ?? raw.utilityName ?? raw.name ?? raw.utility ?? "Unknown Utility"),
    city: String(raw.city ?? raw.City ?? ""),
    state: String(raw.state ?? raw.State ?? ""),
    population_served: Number(raw.population_served ?? raw.populationServed ?? raw.population ?? 0) || 0,
    water_source: String(raw.water_source ?? raw.waterSource ?? raw.source ?? "unknown"),
    country: raw.country ? String(raw.country) : undefined,
  };
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function utilityFromReport(report: WaterReport, fallback?: UtilityOption | null): UtilityOption {
  const utility = normalizeUtilityOption(report.utility_info) ?? fallback;
  return {
    pwsid: utility?.pwsid || report.utility_info?.pwsid || "",
    utility_name: utility?.utility_name || report.utility_info?.utility_name || "Unknown Utility",
    city: utility?.city || report.utility_info?.city || "",
    state: utility?.state || report.utility_info?.state || "",
    country: utility?.country || (report.utility_info as any)?.country || (report as any).country || undefined,
    population_served: finiteNumber(
      utility?.population_served || report.utility_info?.population_served,
    ),
    water_source: utility?.water_source || report.utility_info?.water_source || "unknown",
  };
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2].map((s) => (
        <div
          key={s}
          className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            s < step
              ? "bg-blue-600 text-white"
              : s === step
                ? "bg-blue-600 text-white ring-4 ring-blue-600/20"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {s < step ? <Check className="size-4" /> : s}
        </div>
      ))}
      <span className="ml-2 text-sm font-medium text-muted-foreground">
        {step === 1 ? "Customer Info" : "Review & Save"}
      </span>
    </div>
  );
}

export function CreateCustomerPage() {
  const navigate = useNavigate();
  const { canCreateReport: _canCreateReport, isFree, hasUsedTrial, loading: trialLoading } = useFreeTrial();
  const [step, setStep] = useState(1);
  const [lead, setLead] = useState<LeadInfo>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [utilities, setUtilities] = useState<UtilityOption[]>([]);
  const [selectedUtility, setSelectedUtility] = useState<UtilityOption | null>(null);
  const [report, setReport] = useState<WaterReport | null>(null);
  const [error, setError] = useState("");

  // Block free users who've exhausted their trial
  if (!trialLoading && isFree && hasUsedTrial) {
    return <FreeTrialExhausted />;
  }

  const company = useQuery(api.companies.getMyCompany);
  const t = getCountryText(company?.country);
  const saveReport = useMutation(api.reports.saveReport);
  const lookupByZip = useAction(api.supabase.lookupByZip);
  const getWaterReport = useAction(api.supabase.getWaterReport);

  // Auto-lookup utility by code
  const handleZipLookup = useCallback(async () => {
    if (!isCodeReadyForLookup(lead.zip, company?.country)) return;
    setLoading(true);
    setError("");
    setUtilities([]);
    setSelectedUtility(null);
    setReport(null);
    try {
      const result: any = await lookupByZip({ zip: lead.zip });
      const list = (Array.isArray(result) ? result : result?.utilities ?? [])
        .map(normalizeUtilityOption)
        .filter(Boolean) as UtilityOption[];
      if (list.length === 0) {
        setError(`No utilities found for this ${t.zipLabel.toLowerCase()}.`);
      } else if (list.length === 1) {
        // Auto-select single utility and fetch report
        setSelectedUtility(list[0]);
        setUtilities(list);
        await fetchReport(list[0]);
      } else {
        setUtilities(list);
      }
    } catch (err: any) {
      setError(err.message || "Lookup failed");
    }
    setLoading(false);
  }, [lead.zip, lookupByZip]);

  const fetchReport = async (utility: UtilityOption) => {
    setLoading(true);
    try {
      const result = await getWaterReport({ pwsid: utility.pwsid, country: utility.country });
      if (!result) {
        setError("No report data available for this water system.");
        return;
      }
      setReport(result);
      setSelectedUtility(utilityFromReport(result, utility));
    } catch (err: any) {
      setError(err.message || "Failed to get water report");
    }
    setLoading(false);
  };

  const handleGoToReview = async () => {
    if (!selectedUtility) {
      await handleZipLookup();
      return;
    }
    if (!report && selectedUtility) {
      await fetchReport(selectedUtility);
      return;
    }
    setStep(2);
  };

  const computeScore = () => {
    if (!report) return undefined;
    return computeAquaScore(undefined, report.contaminants);
  };

  const handleSave = async () => {
    if (!report || !company || !selectedUtility) return;
    setSaving(true);

    const contaminants = report.contaminants.filter(isDetectedContaminant);
    const overHealth = contaminants.filter((c) => c.over_health).length;
    const overLegal = contaminants.filter((c) => c.over_legal).length;
    const waterScore = computeAquaScore(undefined, contaminants);

    try {
      const result = await saveReport({
        zip: lead.zip,
        utilityName: selectedUtility.utility_name,
        pwsid: selectedUtility.pwsid,
        city: selectedUtility.city || lead.city,
        state: selectedUtility.state || lead.state,
        populationServed: selectedUtility.population_served,
        waterSource: selectedUtility.water_source,
        totalContaminants: contaminants.length,
        overHealthGuidelines: overHealth,
        overLegalLimits: overLegal,
        contaminants: JSON.stringify(contaminants),
        waterScore,
        scoreMode: "aqua_score_v1",
        customerName: lead.name,
        customerAddress: lead.address,
        customerCity: lead.city || selectedUtility.city,
        customerState: lead.state || selectedUtility.state,
        customerZip: lead.zip,
        customerPhone: lead.phone,
        customerEmail: lead.email,
      });

      toast.success("Customer created! Report generated and consumer link ready.");
      navigate(`/customers/${result.reportId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  const score = computeScore();
  const detected = report?.contaminants.filter(isDetectedContaminant) ?? [];
  const overHealth = detected.filter((c) => c.over_health);
  const overLegal = detected.filter((c) => c.over_legal);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link to="/customers">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">New Customer</h1>
          <p className="text-sm text-muted-foreground">
            Create a customer and generate their water report
          </p>
        </div>
      </div>

      <StepIndicator step={step} />

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Customer Information
            </CardTitle>
            <CardDescription>
              Enter the homeowner's info. Their water report will be auto-generated by {t.zipLabel.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@email.com"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(843) 555-0123"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={lead.address}
                  onChange={(e) => setLead({ ...lead, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Marion"
                  value={lead.city}
                  onChange={(e) => setLead({ ...lead, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="state">{t.stateLabel}</Label>
                  <Input
                    id="state"
                    placeholder={company?.country === "CA" ? "ON" : "SC"}
                    maxLength={t.stateMaxLength}
                    value={lead.state}
                    onChange={(e) =>
                      setLead({ ...lead, state: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="zip">{t.zipLabel} *</Label>
                  <Input
                    id="zip"
                    placeholder={t.zipPlaceholder}
                    maxLength={t.zipMaxLength}
                    value={lead.zip}
                    onChange={(e) => {
                      const z = company?.country === "CA"
                        ? e.target.value.toUpperCase().slice(0, t.zipMaxLength)
                        : e.target.value.replace(/\D/g, "").slice(0, t.zipMaxLength);
                      setLead({ ...lead, zip: z });
                    }}
                    onBlur={() => {
                      if (isCodeReadyForLookup(lead.zip, company?.country) && !selectedUtility) handleZipLookup();
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Utility selection (only if multiple) */}
            {utilities.length > 1 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Select Water Utility</Label>
                  <div className="grid gap-2">
                    {utilities.map((u) => (
                      <button
                        key={u.pwsid}
                        onClick={() => fetchReport(u)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selectedUtility?.pwsid === u.pwsid
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Droplets className="size-4 shrink-0 text-blue-500" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{u.utility_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.city}, {u.state} · {u.water_source} · Pop:{" "}
                            {u.population_served?.toLocaleString()}
                          </p>
                        </div>
                        {selectedUtility?.pwsid === u.pwsid && (
                          <Check className="ml-auto size-4 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Show selected utility info */}
            {selectedUtility && report && (
              <>
                <Separator />
                <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3">
                  <Check className="size-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Water data loaded: {selectedUtility.utility_name}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {detected.length} contaminants detected · AquaScore{" "}
                      <span className="font-bold">{score ?? "--"}</span>
                    </p>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                asChild
              >
                <Link to="/customers">Cancel</Link>
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={handleGoToReview}
                disabled={
                  !lead.name.trim() || !isCodeReadyForLookup(lead.zip, company?.country) || loading
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Looking up...
                  </>
                ) : !selectedUtility ? (
                  <>
                    <Search className="size-4" />
                    Find Water Data
                  </>
                ) : (
                  <>
                    Review
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && report && (
        <>
          {/* Score Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex size-20 items-center justify-center rounded-full border-4 text-2xl font-black ${scoreClass(score)}`}
                >
                  {score ?? "--"}
                </div>
                <p className="mt-2 text-lg font-bold">{lead.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUtility?.utility_name} · {selectedUtility?.city},{" "}
                  {selectedUtility?.state}
                </p>
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline">{detected.length} detected</Badge>
                  {overHealth.length > 0 && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      {overHealth.length} health
                    </Badge>
                  )}
                  {overLegal.length > 0 && (
                    <Badge variant="destructive">{overLegal.length} legal</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contaminant Preview (top 5) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FlaskConical className="size-4" />
                Top Contaminants
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {detected.slice(0, 5).map((c) => (
                  <div
                    key={c.contaminant_id || c.contaminant}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{contaminantName(c)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.detected_level} {c.unit}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {c.over_legal && (
                        <Badge variant="destructive" className="text-[10px]">
                          Legal
                        </Badge>
                      )}
                      {c.over_health && !c.over_legal && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                          Health
                        </Badge>
                      )}
                      {c.times_above_ewg && c.times_above_ewg > 1 && (
                        <span className="text-[10px] text-muted-foreground">
                          {c.times_above_ewg}× {t.healthSource}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {detected.length > 5 && (
                  <p className="px-4 py-2 text-xs text-muted-foreground text-center">
                    +{detected.length - 5} more contaminants
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What happens */}
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/10">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                When you save, this will:
              </p>
              <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-400">
                <li className="flex items-start gap-2">
                  <Check className="size-4 mt-0.5 shrink-0" />
                  Save report to your dashboard
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-4 mt-0.5 shrink-0" />
                  Generate a shareable customer report link
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-4 mt-0.5 shrink-0" />
                  Auto-create consumer referral on myaquareport.com
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-4 mt-0.5 shrink-0" />
                  Customer ready for in-home demo
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Create Customer
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
