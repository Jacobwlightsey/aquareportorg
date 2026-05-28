import { useAction, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Check,
  Copy,
  Download,
  Droplets,
  ExternalLink,
  FlaskConical,
  Loader2,
  MessageSquareText,
  Printer,
  Save,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { contaminantName, isDetectedContaminant, type Contaminant } from "@/lib/supabase";
import {
  computeAquaScore,
  computeFieldReadingAdjustment,
  readingPayload,
} from "@/lib/waterScore";

export function ViewReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const report = useQuery(
    api.reports.getReport,
    reportId ? { reportId: reportId as Id<"reports"> } : "skip"
  );
  const subscription = useQuery(api.stripe.getSubscription);
  const generations = useQuery(
    api.ai.getReportGenerations,
    reportId ? { reportId: reportId as Id<"reports"> } : "skip"
  );
  const generateAi = useAction(api.ai.generateReportIntelligence);
  const generateReportPdf = useAction(api.reportPdf.generateReportPdf);
  const createConsumerReferral = useAction(api.referrals.createConsumerReferral);
  const saveReportInHomeTest = useAction(api.dealerShared.saveReportInHomeTest);
  const [aiLoading, setAiLoading] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [readingsSaving, setReadingsSaving] = useState(false);
  const [consumerReferralUrl, setConsumerReferralUrl] = useState("");
  const [readings, setReadings] = useState({
    chlorine: "",
    hardness: "",
    tds: "",
    ph: "",
  });
  const [generatedLinks, setGeneratedLinks] = useState<{
    pdfUrl?: string;
    flipbookUrl?: string;
  }>({});

  useEffect(() => {
    if (!report) return;
    setReadings({
      chlorine: report.chlorine === undefined ? "" : String(report.chlorine),
      hardness: report.hardness === undefined ? "" : String(report.hardness),
      tds: report.tds === undefined ? "" : String(report.tds),
      ph: report.ph === undefined ? "" : String(report.ph),
    });
  }, [report?._id, report?.chlorine, report?.hardness, report?.tds, report?.ph]);

  if (report === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Droplets className="size-8 animate-pulse text-blue-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" asChild>
          <Link to="/reports">
            <ArrowLeft className="size-4" />
            Back to Reports
          </Link>
        </Button>
      </div>
    );
  }

  let contaminants: Contaminant[] = [];
  try {
    const raw: Contaminant[] = JSON.parse(report.contaminants);
    const JUNK = ["reverse osmosis", "how your levels compare", "surface water treatment rule",
      "consumer confidence rule", "lead and copper rule", "total coliform rule",
      "ground water rule", "filter backwash", "disinfection byproducts rule",
      "enhanced surface water", "aircraft drinking water", "lead (90th percentile)"];
    contaminants = raw.filter((c) => {
      const n = contaminantName(c).toLowerCase();
      return !JUNK.some((j) => n.includes(j));
    });
  } catch {
    /* empty */
  }

  const detectedContaminants = contaminants.filter(isDetectedContaminant);
  const overHealth = detectedContaminants.filter((c) => c.over_health);
  const overLegal = detectedContaminants.filter((c) => c.over_legal);
  const savedFieldAdjustment = computeFieldReadingAdjustment({
    chlorine: report.chlorine,
    hardness: report.hardness,
    tds: report.tds,
    ph: report.ph,
  }, report.waterScore);
  const baseAquaScore = report.waterScore === undefined ? undefined : report.waterScore - savedFieldAdjustment;
  const editedWaterScore = computeAquaScore(baseAquaScore, detectedContaminants, readings);
  const fieldReadingAdjustment = computeFieldReadingAdjustment(readings, editedWaterScore);
  const { effectivePlan: trialEffectivePlan, isFree: trialIsFree, hasUsedTrial: _hasUsedTrial } = useFreeTrial();
  const planRank: Record<string, number> = { free: 0, starter: 1, growth: 2, pro: 3, enterprise: 4 };
  // Use effective plan from free trial system (free users pre-trial get starter access)
  const currentPlan = trialIsFree ? trialEffectivePlan : (subscription?.status === "active" ? subscription.plan : "free");
  const aiUnlocked = (planRank[currentPlan] ?? 0) >= 2;
  const consumerReferralUnlocked = (planRank[currentPlan] ?? 0) >= 2;
  const effectivePdfUrl = generatedLinks.pdfUrl || report.pdfUrl;
  const effectiveFlipbookUrl = generatedLinks.flipbookUrl || report.flipbookUrl;
  const healthOnly = overHealth
    .filter((c) => !c.over_legal)
    .sort((a, b) => (b.times_above_ewg ?? 0) - (a.times_above_ewg ?? 0));
  const topHealth = healthOnly.slice(0, 8);
  const okCount = contaminants.filter((c) => !c.over_legal && !c.over_health).length;
  const dataPriority =
    overLegal.length > 0
      ? "Critical"
      : overHealth.length > 0
        ? "High"
        : detectedContaminants.length > 0
          ? "Moderate"
          : "Low";

  const runAi = async (purpose: "homeowner_summary" | "sales_assistant" | "presentation_script" | "email_generator") => {
    if (!reportId || !aiUnlocked) return;
    setAiLoading(purpose);
    try {
      const reportLink = consumerReferralUrl || "Generate a MyAquaReport claim link from this dealer report before sending.";
      await generateAi({
        companyId: report.companyId,
        reportId: reportId as Id<"reports">,
        purpose,
        reportJson: JSON.stringify({
          reportLink,
          customerName: report.customerName,
          customerAddress: report.customerAddress,
          customerCity: report.customerCity,
          customerState: report.customerState,
          customerZip: report.customerZip,
          utilityName: report.utilityName,
          city: report.city,
          state: report.state,
          zip: report.zip,
          score: report.waterScore,
          overHealth: overHealth.length,
          overLegal: overLegal.length,
          contaminants: detectedContaminants.slice(0, 20),
        }),
      });
    } finally {
      setAiLoading("");
    }
  };

  const runPdfGeneration = async () => {
    if (!reportId) return;
    setPdfLoading(true);
    try {
      const result = await generateReportPdf({ reportId: reportId as Id<"reports"> });
      if (result?.ok === false) {
        toast.warning(result.message || "PDF provider is not configured yet.");
        return;
      }
      setGeneratedLinks({
        pdfUrl: result?.pdfUrl,
        flipbookUrl: result?.flipbookUrl,
      });
      toast.success(result?.flipbookUrl ? "PDF and flipbook are ready." : "PDF is ready. Flipbook link was not returned.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate PDF/flipbook");
    } finally {
      setPdfLoading(false);
    }
  };

  const runConsumerReferral = async () => {
    if (!reportId) return;
    if (!consumerReferralUnlocked) {
      toast.warning("Consumer referral links unlock on Growth, Pro, and Enterprise.");
      return;
    }
    setReferralLoading(true);
    try {
      const result = await createConsumerReferral({ reportId: reportId as Id<"reports"> });
      setConsumerReferralUrl(result.referralUrl);
      await navigator.clipboard?.writeText(result.referralUrl);
      toast.success("Consumer referral link copied.");
    } catch (error) {
      const msg = (error as any)?.data ?? (error instanceof Error ? error.message : "Could not create referral link");
      toast.error(typeof msg === "string" ? msg : "Could not create referral link");
    } finally {
      setReferralLoading(false);
    }
  };

  const updateReading = (field: "chlorine" | "hardness" | "tds" | "ph", value: string) => {
    setReadings((current) => ({ ...current, [field]: value.replace(/[^\d.]/g, "") }));
  };

  const saveInHomeReadings = async () => {
    if (!reportId) return;
    setReadingsSaving(true);
    try {
      const result = await saveReportInHomeTest({
        reportId: reportId as Id<"reports">,
        waterScore: editedWaterScore,
        readings: readingPayload(readings),
      });
      setConsumerReferralUrl(result.referralUrl);
      toast.success("In-home readings saved and synced to MyAquaReport.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save in-home readings");
    } finally {
      setReadingsSaving(false);
    }
  };

  const reportScore = editedWaterScore;
  const scoreTone =
    reportScore >= 80
      ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30"
      : reportScore >= 60
        ? "border-slate-400 bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
        : reportScore >= 40
          ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30"
          : "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/30";
  const priorityTone =
    dataPriority === "Critical"
      ? "bg-red-100 text-red-700 border-red-200"
      : dataPriority === "High"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : dataPriority === "Moderate"
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Nav */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/reports">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {report.utilityName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {report.city}, {report.state} - ZIP {report.zip}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={consumerReferralUnlocked ? "default" : "outline"}
            size="sm"
            onClick={runConsumerReferral}
            disabled={referralLoading}
            title={!consumerReferralUnlocked ? "Growth, Pro, or Enterprise required" : undefined}
          >
            {referralLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {consumerReferralUnlocked ? "Send to Consumer" : "Growth+ Send"}
          </Button>
          {effectiveFlipbookUrl && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/reports/${reportId}/flipbook`}>
                <BookOpen className="size-4" />
                Flipbook
              </Link>
            </Button>
          )}
          {effectivePdfUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={effectivePdfUrl} target="_blank" rel="noreferrer">
                <Download className="size-4" />
                PDF
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={runPdfGeneration} disabled={pdfLoading}>
              <Printer className="size-4" />
              {pdfLoading ? "Building..." : "Build PDF"}
            </Button>
          )}
        </div>
      </div>

      {consumerReferralUrl && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-blue-950">Consumer claim link is ready</p>
              <p className="break-all text-sm text-blue-800">{consumerReferralUrl}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(consumerReferralUrl);
                  toast.success("Referral link copied.");
                }}
              >
                <Copy className="size-4" />
                Copy
              </Button>
              <Button size="sm" asChild>
                <a href={consumerReferralUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20">
        <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">Dealer report workspace</p>
              <Badge className={`border ${priorityTone}`}>{dataPriority} priority</Badge>
            </div>
            <div className="mt-2 grid gap-2 text-sm text-blue-900 dark:text-blue-200 sm:grid-cols-4">
              <span>1. Review top risks</span>
              <span>2. Add field results</span>
              <span>3. Build PDF/flipbook</span>
              <span>4. Send claim link</span>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link to="/reports">Customer Reports</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col gap-6">

      {/* Report Header */}
      <Card className="order-1 overflow-hidden print:shadow-none print:border">
        <div
          className="p-6 text-white print:text-black print:bg-gray-100"
          style={{
            background: `linear-gradient(135deg, ${report.companyColor}, #06b6d4)`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Droplets className="size-6" />
            <span className="font-semibold text-lg">
              {report.companyName}
            </span>
          </div>
          <h2 className="text-2xl font-bold">{report.utilityName}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm opacity-90">
            <span>PWSID: {report.pwsid}</span>
            <span>•</span>
            <span>
              {report.city}, {report.state}
            </span>
            <span>•</span>
            <span>
              {(report.populationServed ?? 0).toLocaleString()} people served
            </span>
            <span>•</span>
            <span className="capitalize">{report.waterSource}</span>
          </div>
          <p className="text-xs opacity-70 mt-3">
            Generated{" "}
            {new Date(report._creationTime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            by {report.generatedByName}
          </p>
        </div>

        <div className="grid grid-cols-4 divide-x border-b">
          <div className="p-5 text-center">
            <p className={`text-3xl font-bold ${reportScore >= 80 ? "text-amber-500" : reportScore >= 60 ? "text-slate-400" : reportScore >= 40 ? "text-orange-500" : "text-rose-500"}`}>
              {reportScore}
            </p>
            <p className="text-sm text-muted-foreground">
              AquaScore
            </p>
          </div>
          <div className="p-5 text-center">
            <p className="text-3xl font-bold">{detectedContaminants.length}</p>
            <p className="text-sm text-muted-foreground">
              Detected
            </p>
          </div>
          <div className="p-5 text-center">
            <p className="text-3xl font-bold text-amber-500">
              {overHealth.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Over Health
            </p>
          </div>
          <div className="p-5 text-center">
            <p className="text-3xl font-bold text-red-500">
              {overLegal.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Over Legal
            </p>
          </div>
        </div>
      </Card>

      <Card className="order-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="size-5 text-blue-500" />
            In-Home Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="view-reading-chlorine" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Chlorine
              </label>
              <Input
                id="view-reading-chlorine"
                inputMode="decimal"
                placeholder="ppm"
                value={readings.chlorine}
                onChange={(event) => updateReading("chlorine", event.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">EPA MRDL: 4 ppm</p>
            </div>
            <div>
              <label htmlFor="view-reading-hardness" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Hardness
              </label>
              <Input
                id="view-reading-hardness"
                inputMode="decimal"
                placeholder="ppm"
                value={readings.hardness}
                onChange={(event) => updateReading("hardness", event.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">USGS very hard: &gt;180 ppm</p>
            </div>
            <div>
              <label htmlFor="view-reading-tds" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                TDS
              </label>
              <Input
                id="view-reading-tds"
                inputMode="decimal"
                placeholder="ppm"
                value={readings.tds}
                onChange={(event) => updateReading("tds", event.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">EPA secondary: 500 ppm</p>
            </div>
            <div>
              <label htmlFor="view-reading-ph" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                pH
              </label>
              <Input
                id="view-reading-ph"
                inputMode="decimal"
                placeholder="7.4"
                value={readings.ph}
                onChange={(event) => updateReading("ph", event.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">EPA secondary: 6.5-8.5</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Updated AquaScore</p>
              <p className="text-xs text-muted-foreground">
                Higher is better. Field readings adjust this score by {fieldReadingAdjustment > 0 ? "+" : ""}{fieldReadingAdjustment} points.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl px-4 py-2 text-2xl font-bold ${
                editedWaterScore >= 80 ? "bg-amber-500/10 text-amber-500" :
                editedWaterScore >= 60 ? "bg-slate-500/10 text-slate-500" :
                editedWaterScore >= 40 ? "bg-orange-500/10 text-orange-500" :
                "bg-rose-500/10 text-rose-500"
              }`}>
                {editedWaterScore}
              </div>
              <Button onClick={saveInHomeReadings} disabled={readingsSaving}>
                {readingsSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations */}
      {overLegal.length > 0 && (
        <Card className="order-2 border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="size-5" />
              Legal Limit Violations ({overLegal.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overLegal.map((c, index) => (
                <div
                  key={`${contaminantName(c)}-${index}`}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
                >
                  <div>
                    <p className="font-medium">{contaminantName(c)}</p>
                    {c.effect && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {c.effect}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-medium text-red-600">
                      {c.detected_level} {c.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Legal limit: {c.legal_limit} {c.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health exceedances */}
      {healthOnly.length > 0 && (
        <Card className="order-3 border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              Highest Health Guideline Risks
              <span className="text-sm font-normal text-muted-foreground">
                Showing top {topHealth.length} of {healthOnly.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topHealth
                .map((c, index) => (
                  <div
                    key={`${contaminantName(c)}-${index}`}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
                  >
                    <div>
                      <p className="font-medium">{contaminantName(c)}</p>
                      {c.effect && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {c.effect}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-medium text-amber-600">
                        {c.detected_level} {c.unit}
                      </p>
                      {c.times_above_ewg && c.times_above_ewg > 1 && (
                        <p className="text-xs font-semibold text-red-500">
                          {c.times_above_ewg}x above guideline
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={`order-5 ${!aiUnlocked ? "bg-muted/30" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-violet-500" />
            AI Report Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!aiUnlocked && (
            <div className="rounded-lg border bg-background p-4">
              <p className="font-medium">AI tools unlock on Growth and Pro.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate homeowner summaries, sales talking points, presentation scripts, and customer emails from this report.
              </p>
              <Button className="mt-3" asChild>
                <Link to="/subscription">Upgrade to unlock AI</Link>
              </Button>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { id: "homeowner_summary", label: "Homeowner Summary", icon: Sparkles },
              { id: "sales_assistant", label: "Sales Talking Points", icon: MessageSquareText },
              { id: "presentation_script", label: "Presentation Script", icon: Copy },
              { id: "email_generator", label: "Email Generator", icon: MessageSquareText },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4"
                  disabled={!aiUnlocked || aiLoading === tool.id}
                  onClick={() => runAi(tool.id as "homeowner_summary" | "sales_assistant" | "presentation_script" | "email_generator")}
                >
                  {aiLoading === tool.id ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                  <span className="text-left">{tool.label}</span>
                </Button>
              );
            })}
          </div>
          {(report.aiSummary || report.aiSalesNotes || report.presentationScript || report.aiEmailDraft || (generations && generations.length > 0)) && (
            <div className="grid gap-4">
              {report.aiSummary && <AiOutput title="Homeowner Summary" value={report.aiSummary} />}
              {report.aiSalesNotes && <AiOutput title="Sales Assistant Notes" value={report.aiSalesNotes} />}
              {report.presentationScript && <AiOutput title="Presentation Script" value={report.presentationScript} />}
              {report.aiEmailDraft && <AiOutput title="Email Generator" value={report.aiEmailDraft} />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Contaminants Table */}
      <Card className="order-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="size-5 text-blue-500" />
            Tested Contaminants ({contaminants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">
                    Contaminant
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    Detected
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    Legal Limit
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    Health Guideline
                  </th>
                  <th className="text-center py-3 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {contaminants.map((c, index) => (
                  <tr
                    key={`${contaminantName(c)}-${index}`}
                    className="border-b last:border-0"
                  >
                    <td className="py-3 px-2">
                      <p className="font-medium">{contaminantName(c)}</p>
                      {c.effect && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {c.effect}
                        </p>
                      )}
                    </td>
                    <td className="text-right py-3 px-2 font-mono">
                      {isDetectedContaminant(c) ? `${c.detected_level} ${c.unit}` : "Not detected"}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                      {c.legal_limit ?? "-"} {c.legal_limit ? c.unit : ""}
                    </td>
                    <td className="text-right py-3 px-2 font-mono text-muted-foreground">
                      {c.health_guideline ?? "-"}{" "}
                      {c.health_guideline ? c.unit : ""}
                    </td>
                    <td className="text-center py-3 px-2">
                      {c.over_legal ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                          <Shield className="size-3" />
                          Violation
                        </span>
                      ) : c.over_health ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="size-3" />
                          Over Health
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                          <Check className="size-3" />
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

        </section>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Priority Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`mx-auto flex size-28 items-center justify-center rounded-full border-4 text-4xl font-black ${scoreTone}`}>
                {reportScore}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-red-500">{overLegal.length}</p>
                  <p className="text-muted-foreground">Legal issues</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-amber-500">{healthOnly.length}</p>
                  <p className="text-muted-foreground">Health risks</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold">{detectedContaminants.length}</p>
                  <p className="text-muted-foreground">Detected</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-emerald-500">{okCount}</p>
                  <p className="text-muted-foreground">Lower priority</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Next Best Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={runConsumerReferral} disabled={referralLoading || !consumerReferralUnlocked}>
                {referralLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send to Consumer
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link to="/verify">
                  <FlaskConical className="size-4" />
                  Verify Results
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={runPdfGeneration} disabled={pdfLoading}>
                {pdfLoading ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
                Build PDF/Flipbook
              </Button>
              {effectivePdfUrl && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href={effectivePdfUrl} target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                    Open PDF
                  </a>
                </Button>
              )}
              {effectiveFlipbookUrl && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to={`/reports/${reportId}/flipbook`}>
                    <BookOpen className="size-4" />
                    Open Flipbook
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Legal violations</span> are first because they are the strongest urgency signal.</p>
              <p><span className="font-medium text-foreground">Health guideline risks</span> are sorted by how far above guideline they are.</p>
              <p><span className="font-medium text-foreground">All tested data</span> stays available at the bottom for detail checks.</p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground print:border-t">
        <p>
          Report generated by AquaReport - Powered by our proprietary water
          quality database
        </p>
        <p className="mt-1">
          This report is for informational purposes only. Consult local
          authorities for official water quality information.
        </p>
      </div>
    </div>
  );
}

function extractAiText(value: string) {
  const trimmed = value.trim();
  const clean = (text: string) =>
    text
      .replace(/\*\*/g, "")
      .replace(/^\s*#{1,6}\s*/gm, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return clean(trimmed);

  try {
    const parsed = JSON.parse(trimmed);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const text = items
      .flatMap((item) => item?.content ?? [])
      .filter((content) => content?.type === "output_text" || content?.type === "text")
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n\n")
      .trim();
    return clean(text || trimmed);
  } catch {
    return clean(trimmed);
  }
}

function AiOutput({ title, value }: { title: string; value: string }) {
  const text = extractAiText(value);
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-sm">{title}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void navigator.clipboard?.writeText(text)}
        >
          <Copy className="size-3" />
          Copy
        </Button>
      </div>
      <div className="mt-3 max-h-[440px] overflow-auto rounded-md bg-background p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}
