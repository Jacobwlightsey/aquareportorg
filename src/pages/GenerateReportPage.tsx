import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Droplets,
  ExternalLink,
  FlaskConical,
  Loader2,
  MapPin,
  Search,
  User,
  Users,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { contaminantName, isDetectedContaminant, type WaterReport } from "@/lib/supabase";
import {
  computeAquaScore,
  computeFieldReadingAdjustment,
  readingPayload,
  type FieldWaterReadings,
} from "@/lib/waterScore";
import { api } from "../../convex/_generated/api";
import { getCountryText, isValidCode, isCodeReadyForLookup } from "@/lib/i18n";

interface LeadInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

type ManualReadings = Required<Record<keyof FieldWaterReadings, string>>;

interface UtilityOption {
  pwsid: string;
  utility_name: string;
  city: string;
  state: string;
  population_served: number;
  water_source: string;
}

export function GenerateReportPage() {
  // 1=lead info, 2=pick utility, 3=preview, 4=share
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
  const [readings, setReadings] = useState<ManualReadings>({
    chlorine: "",
    hardness: "",
    tds: "",
    ph: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [utilities, setUtilities] = useState<UtilityOption[]>([]);
  const [selectedUtility, setSelectedUtility] = useState<UtilityOption | null>(null);
  const [report, setReport] = useState<WaterReport | null>(null);
  const [error, setError] = useState("");
  const [savedReportUrl, setSavedReportUrl] = useState("");
  const company = useQuery(api.companies.getMyCompany);
  const t = getCountryText(company?.country);
  const saveReport = useMutation(api.reports.saveReport);
  const lookupByZip = useAction(api.supabase.lookupByZip);
  const getWaterReport = useAction(api.supabase.getWaterReport);

  const handleLeadChange = (field: keyof LeadInfo, value: string) => {
    setLead((prev) => ({ ...prev, [field]: value }));
  };

  const handleReadingChange = (field: keyof ManualReadings, value: string) => {
    setReadings((prev) => ({ ...prev, [field]: value.replace(/[^\d.]/g, "") }));
  };

  const fetchReport = useCallback(
    async (pwsid: string, country?: string) => {
      setLoading(true);
      setError("");
      setReport(null);
      try {
        const data = await getWaterReport({ pwsid, country });
        if (data) {
          // Filter out non-contaminant rule entries before showing the sales preview.
          const JUNK = ["reverse osmosis", "how your levels compare", "surface water treatment rule",
            "consumer confidence rule", "lead and copper rule", "total coliform rule",
            "ground water rule", "filter backwash", "disinfection byproducts rule",
            "enhanced surface water", "aircraft drinking water", "lead (90th percentile)"];
          const cleaned = { ...data, contaminants: (data as any).contaminants?.filter((c: any) => {
            const n = contaminantName(c).toLowerCase();
            return !JUNK.some((j: string) => n.includes(j));
          }) || [] };
          setReport(cleaned as WaterReport);
        } else {
          setError("No report data available for this water system.");
        }
      } catch {
        setError("Failed to fetch report data.");
      } finally {
        setLoading(false);
      }
    },
    [getWaterReport],
  );

  // Step 1 → 2: lookup utilities
  const goToStep2 = useCallback(async () => {
    if (!lead.name.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!lead.zip || !isValidCode(lead.zip, company?.country)) {
      setError(t.zipError);
      return;
    }
    setError("");
    setLoading(true);
    setUtilities([]);
    setSelectedUtility(null);
    setReport(null);

    try {
      const data = await lookupByZip({ zip: lead.zip });
      if (!data || data.length === 0) {
        setError(`No water systems found for that ${t.zipLabel.toLowerCase()}.`);
        setLoading(false);
        return;
      }

      // If only 1 utility, skip picker and go straight to report
      if (data.length === 1) {
        setSelectedUtility(data[0]);
        setStep(3);
        await fetchReport(data[0].pwsid, data[0].country);
      } else {
        setUtilities(data);
        setStep(2);
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [fetchReport, lead, lookupByZip]);

  // Step 2 → 3: select utility and fetch report
  const selectUtility = useCallback(
    async (util: UtilityOption) => {
      setSelectedUtility(util);
      setStep(3);
      await fetchReport(util.pwsid, (util as any).country);
    },
    [fetchReport]
  );

  // Step 3 → 4: save report
  const handleSave = useCallback(async () => {
    if (!report || !company) return;
    setSaving(true);
    try {
      const detectedContaminants = report.contaminants.filter(isDetectedContaminant);
      const overHealth = report.total_above_health_guideline ?? detectedContaminants.filter((c) => c.over_health).length;
      const overLegal = report.total_above_legal_limit ?? detectedContaminants.filter((c) => c.over_legal).length;
      const waterScore = computeAquaScore(undefined, detectedContaminants, readings);
      const fieldReadings = readingPayload(readings);

      const result = await saveReport({
        zip: lead.zip,
        utilityName: report.utility_info.utility_name,
        pwsid: report.utility_info.pwsid,
        city: report.utility_info.city,
        state: report.utility_info.state,
        populationServed: report.utility_info.population_served || 0,
        waterSource: report.utility_info.water_source || "unknown",
        totalContaminants: report.total_detected ?? detectedContaminants.length,
        overHealthGuidelines: overHealth,
        overLegalLimits: overLegal,
        contaminants: JSON.stringify(report.contaminants),
        customerName: lead.name,
        customerAddress: lead.address,
        customerCity: lead.city || report.utility_info.city,
        customerState: lead.state || report.utility_info.state,
        customerZip: lead.zip,
        customerPhone: lead.phone,
        customerEmail: lead.email,
        waterScore,
        scoreMode: "aqua_score_v1",
        ...fieldReadings,
      });

      setSavedReportUrl(`/reports/${result.reportId}`);
      setStep(4);
      toast.success("Customer report saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save report");
    } finally {
      setSaving(false);
    }
  }, [report, company, lead, readings, saveReport]);

  const resetForm = () => {
    setStep(1);
    setLead({ name: "", address: "", city: "", state: "", zip: "", phone: "", email: "" });
    setReadings({ chlorine: "", hardness: "", tds: "", ph: "" });
    setReport(null);
    setUtilities([]);
    setSelectedUtility(null);
    setSavedReportUrl("");
    setError("");
  };

  const reportContaminants = report?.contaminants ?? [];
  const detectedContaminants = reportContaminants.filter(isDetectedContaminant);
  const overHealth = detectedContaminants.filter((c) => c.over_health);
  const totalTested = report?.total_tested ?? reportContaminants.length;
  const totalDetected = report?.total_detected ?? detectedContaminants.length;
  const overHealthCount = report?.total_above_health_guideline ?? overHealth.length;
  const waterScore = report ? computeAquaScore(undefined, detectedContaminants, readings) : 0;
  const fieldReadingAdjustment = computeFieldReadingAdjustment(readings, waterScore);

  const stepLabels = ["Customer", "Water System", "Dealer Review", "Send"];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Customer Report</h1>
          <p className="text-muted-foreground text-sm">
            {step === 1 && "Enter customer information for the dealer report"}
            {step === 2 && "Select the customer's water system"}
            {step === 3 && "Review public water data and add in-home readings"}
            {step === 4 && "Report saved - send or continue follow-up"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                s < step
                  ? "bg-emerald-500 text-white"
                  : s === step
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="size-3.5" /> : s}
            </div>
            <span
              className={`text-xs hidden sm:inline ${s === step ? "font-medium" : "text-muted-foreground"}`}
            >
              {stepLabels[s - 1]}
            </span>
            {s < 4 && <div className="w-6 h-px bg-border mx-0.5 hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* ========== Step 1: Lead Info ========== */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <User className="size-5" />
              <span className="font-semibold">Customer Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="lead-name" className="text-sm font-medium mb-1.5 block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="lead-name"
                  placeholder="John Smith"
                  value={lead.name}
                  onChange={(e) => handleLeadChange("name", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="lead-address" className="text-sm font-medium mb-1.5 block">
                  Street Address
                </label>
                <Input
                  id="lead-address"
                  placeholder="308 Laughlin Rd"
                  value={lead.address}
                  onChange={(e) => handleLeadChange("address", e.target.value)}
                  className="h-11"
                />
              </div>

              <div>
                <label htmlFor="lead-city" className="text-sm font-medium mb-1.5 block">City</label>
                <Input
                  id="lead-city"
                  placeholder="Greenville"
                  value={lead.city}
                  onChange={(e) => handleLeadChange("city", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lead-state" className="text-sm font-medium mb-1.5 block">{t.stateLabel}</label>
                  <Input
                    id="lead-state"
                    placeholder={company?.country === "CA" ? "ON" : "SC"}
                    value={lead.state}
                    onChange={(e) =>
                      handleLeadChange("state", e.target.value.toUpperCase().slice(0, t.stateMaxLength))
                    }
                    maxLength={t.stateMaxLength}
                    className="h-11"
                  />
                </div>
                <div>
                  <label htmlFor="lead-zip" className="text-sm font-medium mb-1.5 block">
                    {t.zipLabel} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="lead-zip"
                    placeholder={t.zipPlaceholder}
                    value={lead.zip}
                    onChange={(e) =>
                      handleLeadChange("zip", company?.country === "CA"
                        ? e.target.value.toUpperCase().slice(0, t.zipMaxLength)
                        : e.target.value.replace(/\D/g, "").slice(0, t.zipMaxLength))
                    }
                    maxLength={t.zipMaxLength}
                    className="h-11"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lead-phone" className="text-sm font-medium mb-1.5 block">Phone</label>
                <Input
                  id="lead-phone"
                  placeholder="(864) 555-1234"
                  value={lead.phone}
                  onChange={(e) => handleLeadChange("phone", e.target.value)}
                  className="h-11"
                />
              </div>

              <div>
                <label htmlFor="lead-email" className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  id="lead-email"
                  placeholder="john@example.com"
                  type="email"
                  value={lead.email}
                  onChange={(e) => handleLeadChange("email", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-end pt-2">
              <Button onClick={goToStep2} disabled={loading} size="lg" className="px-8">
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Find Water Systems
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== Step 2: Utility Picker ========== */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Building2 className="size-5" />
                <span className="font-semibold">
                  {utilities.length} Water System{utilities.length !== 1 ? "s" : ""} Found
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t.zipLabel} {lead.zip} is served by multiple water systems. Select the one that
                serves the customer's home.
              </p>

              <div className="space-y-2">
                {utilities.map((u) => (
                  <button
                    key={u.pwsid}
                    onClick={() => selectUtility(u)}
                    className="w-full text-left p-4 rounded-lg border hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold group-hover:text-blue-600 transition-colors">
                          {u.utility_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {u.city}, {u.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            {(u.population_served ?? 0).toLocaleString()} served
                          </span>
                          <span className="text-xs font-mono text-muted-foreground/60">
                            {u.pwsid}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-blue-500 transition-colors mt-1.5" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => { setStep(1); setError(""); }}>
            <ArrowLeft className="size-4" /> Back to Customer Info
          </Button>
        </div>
      )}

      {/* ========== Step 3: Water Data Preview ========== */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          {loading && (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <Loader2 className="size-10 animate-spin text-blue-500" />
                <p className="text-muted-foreground">
                  Fetching water data for {selectedUtility?.utility_name || `${t.zipLabel} ${lead.zip}`}...
                </p>
              </CardContent>
            </Card>
          )}

          {error && !loading && (
            <Card>
              <CardContent className="py-10 text-center space-y-4">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={() => { setStep(utilities.length > 1 ? 2 : 1); setError(""); }}>
                  <ArrowLeft className="size-4" /> Go Back
                </Button>
              </CardContent>
            </Card>
          )}

          {report && !loading && (
            <>
              {/* Customer + Utility summary */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-blue-300 text-sm font-medium mb-1">
                        Water Report for
                      </p>
                      <h2 className="text-xl font-bold">{lead.name}</h2>
                      {lead.address && (
                        <p className="text-sm text-gray-300 flex items-center gap-1 mt-1">
                          <MapPin className="size-3" />
                          {lead.address}
                          {lead.city && `, ${lead.city}`}
                          {lead.state && `, ${lead.state}`} {lead.zip}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-4xl font-bold ${waterScore >= 80 ? "text-emerald-400" : waterScore >= 60 ? "text-blue-400" : waterScore >= 40 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {waterScore}
                      </div>
                      <p className="text-xs text-gray-400">AquaScore</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Water System</p>
                      <p className="font-medium">{report.utility_info.utility_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Source</p>
                      <p className="font-medium capitalize">{report.utility_info.water_source}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Tested</p>
                      <p className="font-medium">{totalTested}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Detected</p>
                      <p className="font-medium">{totalDetected}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Over Health Guidelines</p>
                      <p className="font-medium text-amber-400">{overHealthCount}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="size-5 text-blue-300" />
                        <div>
                          <p className="font-semibold">Add Field Test Results</p>
                          <p className="text-xs text-gray-400">
                            Type while presenting. The contamination score updates live.
                          </p>
                        </div>
                      </div>
                      {fieldReadingAdjustment !== 0 && (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          fieldReadingAdjustment > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                        }`}>
                          {fieldReadingAdjustment > 0 ? "+" : ""}{fieldReadingAdjustment} field score
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <div>
                        <label htmlFor="report-reading-chlorine" className="mb-1.5 block text-xs font-medium text-gray-300">
                          Chlorine
                        </label>
                        <Input
                          id="report-reading-chlorine"
                          inputMode="decimal"
                          placeholder="ppm"
                          value={readings.chlorine}
                          onChange={(e) => handleReadingChange("chlorine", e.target.value)}
                          className="h-10 border-white/10 bg-slate-950/40 text-white placeholder:text-gray-500"
                        />
                        <p className="mt-1 text-[10px] text-gray-500">EPA MRDL: 4 ppm</p>
                      </div>
                      <div>
                        <label htmlFor="report-reading-hardness" className="mb-1.5 block text-xs font-medium text-gray-300">
                          Hardness
                        </label>
                        <Input
                          id="report-reading-hardness"
                          inputMode="decimal"
                          placeholder="ppm"
                          value={readings.hardness}
                          onChange={(e) => handleReadingChange("hardness", e.target.value)}
                          className="h-10 border-white/10 bg-slate-950/40 text-white placeholder:text-gray-500"
                        />
                        <p className="mt-1 text-[10px] text-gray-500">USGS very hard: &gt;180 ppm</p>
                      </div>
                      <div>
                        <label htmlFor="report-reading-tds" className="mb-1.5 block text-xs font-medium text-gray-300">
                          TDS
                        </label>
                        <Input
                          id="report-reading-tds"
                          inputMode="decimal"
                          placeholder="ppm"
                          value={readings.tds}
                          onChange={(e) => handleReadingChange("tds", e.target.value)}
                          className="h-10 border-white/10 bg-slate-950/40 text-white placeholder:text-gray-500"
                        />
                        <p className="mt-1 text-[10px] text-gray-500">EPA secondary: 500 ppm</p>
                      </div>
                      <div>
                        <label htmlFor="report-reading-ph" className="mb-1.5 block text-xs font-medium text-gray-300">
                          pH
                        </label>
                        <Input
                          id="report-reading-ph"
                          inputMode="decimal"
                          placeholder="7.4"
                          value={readings.ph}
                          onChange={(e) => handleReadingChange("ph", e.target.value)}
                          className="h-10 border-white/10 bg-slate-950/40 text-white placeholder:text-gray-500"
                        />
                        <p className="mt-1 text-[10px] text-gray-500">EPA secondary: 6.5-8.5</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {report.data_quality_flags && report.data_quality_flags.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                  <CardContent className="pt-5">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      Data may be incomplete
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      {report.data_quality_flags[0].description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Top concerns */}
              {overHealth.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Droplets className="size-4 text-blue-500" />
                      Top Concerns ({overHealthCount})
                    </h3>
                    <div className="space-y-2">
                      {overHealth.slice(0, 6).map((c) => (
                        <div
                          key={contaminantName(c)}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <span className="font-medium text-sm">{contaminantName(c)}</span>
                            {c.effect && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({c.effect})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {c.times_above_ewg && c.times_above_ewg > 1 && (
                              <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                                {c.times_above_ewg}× above guideline
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                c.over_legal
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              }`}
                            >
                              {c.over_legal ? "VIOLATION" : "ELEVATED"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(utilities.length > 1 ? 2 : 1);
                    setError("");
                    setReport(null);
                  }}
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !company}
                  size="lg"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Save Customer Report
                </Button>
              </div>

              {!company && (
                <p className="text-sm text-amber-600 text-center">
                  ⚠️ Set up your company in{" "}
                  <Link to="/company" className="underline">
                    Company Settings
                  </Link>{" "}
                  before saving reports.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ========== Step 4: Share ========== */}
      {step === 4 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <Card>
            <CardContent className="py-10 text-center space-y-6">
              <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto">
                <Check className="size-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Customer Report Created</h2>
                <p className="text-muted-foreground mt-1">
                  {lead.name}'s dealer report is saved. Open it to add more field results, build a PDF, or send the MyAquaReport claim link.
                </p>
              </div>

              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link to={savedReportUrl || "/reports"}>
                    <ExternalLink className="size-4" />
                    Open Dealer Report
                  </Link>
                </Button>
                <Button onClick={resetForm}>
                  <Search className="size-4" />
                  Create Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
