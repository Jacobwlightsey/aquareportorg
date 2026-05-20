import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardCopy,
  Download,
  Droplets,
  ExternalLink,
  FlaskConical,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  FileText,
  Shield,
  Wrench,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  derivePipelineStage,
  parseContaminants,
  scoreClass,
  stageMeta,
} from "@/lib/pipeline";
import { contaminantName } from "@/lib/supabase";
import {
  calculateAquaScoreFromContaminants,
  computeAquaScore,
  readingNumber,
  readingPayload,
  type FieldWaterReadings,
} from "@/lib/waterScore";
import { hasDemoWizard, hasConsumerLinks, hasVerification, hasFiltration, hasFlipbook, upgradeMessage } from "@/lib/planGate";
import { PlanGate } from "@/components/PlanGate";
import { api } from "../../convex/_generated/api";

function AquaScoreGauge({ score }: { score?: number }) {
  const s = score ?? 0;
  const tier =
    s >= 80 ? "Gold" : s >= 60 ? "Silver" : s >= 40 ? "Bronze" : "At Risk";
  const tierColor =
    s >= 80
      ? "text-amber-500"
      : s >= 60
        ? "text-slate-400"
        : s >= 40
          ? "text-orange-500"
          : "text-rose-500";
  const ringColor =
    s >= 80
      ? "stroke-amber-400"
      : s >= 60
        ? "stroke-slate-400"
        : s >= 40
          ? "stroke-orange-400"
          : "stroke-rose-400";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (s / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r="54"
          fill="none"
          strokeWidth="10"
          className="stroke-muted/40"
        />
        <circle
          cx="70"
          cy="70"
          r="54"
          fill="none"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${ringColor} transition-all duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black">{score ?? "--"}</span>
        <span className={`text-xs font-bold ${tierColor}`}>{tier}</span>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  href,
  variant = "outline",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "outline" | "default";
}) {
  const cls =
    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-[11px] font-medium transition-colors active:scale-95";
  const inner = (
    <>
      <Icon className="size-5" />
      {label}
    </>
  );

  if (href) {
    return (
      <Link to={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function ContaminantRow({ c }: { c: any }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{contaminantName(c)}</p>
        <p className="text-[11px] text-muted-foreground">
          {c.detected_level} {c.unit}
          {c.health_guideline ? ` · Health guideline: ${c.health_guideline} ${c.unit}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1 ml-2">
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
        {c.times_above_ewg != null && c.times_above_ewg > 1 && (
          <span className="text-[10px] font-semibold text-muted-foreground">
            {c.times_above_ewg}× EWG
          </span>
        )}
      </div>
    </div>
  );
}

function InHomeTestForm({
  reportId,
  existingReadings,
}: {
  reportId: any;
  existingReadings?: FieldWaterReadings;
}) {
  const [readings, setReadings] = useState({
    chlorine: existingReadings?.chlorine?.toString() || "",
    hardness: existingReadings?.hardness?.toString() || "",
    tds: existingReadings?.tds?.toString() || "",
    ph: existingReadings?.ph?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const saveInHomeTest = useAction(api.dealerShared.saveReportInHomeTest);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = readingPayload(readings);
      await saveInHomeTest({
        reportId,
        readings: payload,
      });
      toast.success("In-home test saved & synced to consumer side!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "chlorine", label: "Chlorine (ppm)", placeholder: "0.5" },
          { key: "hardness", label: "Hardness (ppm)", placeholder: "120" },
          { key: "tds", label: "TDS (ppm)", placeholder: "350" },
          { key: "ph", label: "pH", placeholder: "7.2" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              type="number"
              step="any"
              placeholder={placeholder}
              value={readings[key as keyof typeof readings]}
              onChange={(e) =>
                setReadings({ ...readings, [key]: e.target.value })
              }
              className="h-9"
            />
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <FlaskConical className="size-4" />
            Save Test Results
          </>
        )}
      </Button>
    </div>
  );
}

export function CustomerDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const report = useQuery(
    api.reports.getReport,
    reportId ? { reportId: reportId as any } : "skip"
  );
  const company = useQuery(api.companies.getMyCompany);
  const createReferral = useAction(api.referrals.createConsumerReferral);
  const [referralUrl, setReferralUrl] = useState<string>("");
  const [sendingReferral, setSendingReferral] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const contaminants = useMemo(
    () => parseContaminants(report?.contaminants),
    [report?.contaminants]
  );
  const stage = report ? derivePipelineStage(report) : "sent";
  const meta = stageMeta(stage);
  const score = report
    ? computeAquaScore(report.waterScore, contaminants, {
        chlorine: report.chlorine,
        hardness: report.hardness,
        tds: report.tds,
        ph: report.ph,
      })
    : undefined;

  const overHealth = contaminants.filter((c: any) => c.over_health);
  const overLegal = contaminants.filter((c: any) => c.over_legal);
  const shareUrl = report?.shareToken
    ? `${window.location.origin}/r/${report.shareToken}`
    : null;

  const handleCreateReferral = useCallback(async () => {
    if (!reportId) return;
    setSendingReferral(true);
    try {
      const result = await createReferral({ reportId: reportId as any });
      setReferralUrl(result.referralUrl);
      toast.success("Consumer link created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create consumer link");
    }
    setSendingReferral(false);
  }, [reportId, createReferral]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied!`);
    });
  };

  if (report === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Droplets className="size-8 animate-pulse text-blue-500" />
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mb-4 size-12 text-muted-foreground/30" />
        <h2 className="font-semibold">Customer not found</h2>
        <Button asChild className="mt-4">
          <Link to="/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link to="/customers">
          <ArrowLeft className="size-4" />
          Customers
        </Link>
      </Button>

      {/* Hero Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <AquaScoreGauge score={score} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-bold">
                  {report.customerName || report.utilityName}
                </h1>
                <span className={`inline-flex self-center sm:self-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="size-3" />
                {report.customerAddress && `${report.customerAddress}, `}
                {report.customerCity || report.city},{" "}
                {report.customerState || report.state}{" "}
                {report.customerZip || report.zip}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {report.utilityName} · PWSID: {report.pwsid}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
                {report.customerEmail && (
                  <a
                    href={`mailto:${report.customerEmail}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="size-3.5" />
                    {report.customerEmail}
                  </a>
                )}
                {report.customerPhone && (
                  <a
                    href={`tel:${report.customerPhone}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="size-3.5" />
                    {report.customerPhone}
                  </a>
                )}
              </div>
              {/* Badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline">{contaminants.length} detected</Badge>
                {overHealth.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-200"
                  >
                    {overHealth.length} above health guidelines
                  </Badge>
                )}
                {overLegal.length > 0 && (
                  <Badge variant="destructive">
                    {overLegal.length} above legal limits
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        <PlanGate locked={!hasDemoWizard(company)} message={upgradeMessage("demo_wizard")} requiredPlan="Growth">
          <QuickAction
            icon={Play}
            label="Start Demo"
            href={`/customers/${reportId}/demo`}
          />
        </PlanGate>
        <PlanGate locked={!hasConsumerLinks(company)} message={upgradeMessage("consumer_links")} requiredPlan="Starter">
          <QuickAction
            icon={ExternalLink}
            label="Send Link"
            onClick={() => {
              if (referralUrl) {
                copyToClipboard(referralUrl, "Consumer link");
              } else {
                handleCreateReferral();
              }
            }}
          />
        </PlanGate>
        <QuickAction
          icon={ClipboardCopy}
          label="Copy Report"
          onClick={() => {
            if (shareUrl) copyToClipboard(shareUrl, "Report link");
            else toast.error("No share link available");
          }}
        />
        <QuickAction
          icon={Download}
          label="PDF"
          onClick={() => {
            if (report.pdfUrl) window.open(report.pdfUrl, "_blank");
            else if (shareUrl)
              window.open(`${shareUrl}/print`, "_blank");
            else toast.error("No PDF available");
          }}
        />
        <PlanGate locked={!hasFlipbook(company)} message={upgradeMessage("flipbook")} requiredPlan="Starter">
          <QuickAction
            icon={MessageSquare}
            label="Flipbook"
            href={
              report.flipbookUrl
                ? undefined
                : shareUrl
                  ? undefined
                  : `/customers`
            }
            onClick={() => {
              if (report.flipbookUrl) window.open(report.flipbookUrl, "_blank");
              else if (shareUrl) window.open(`${shareUrl}/flipbook`, "_blank");
              else toast.error("No flipbook available");
            }}
          />
        </PlanGate>
        <QuickAction
          icon={FileText}
          label="Full Report"
          href={`/reports/${reportId}/v2`}
        />
      </div>

      {/* Consumer Referral Banner */}
      {referralUrl && (
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardContent className="flex items-center gap-3 p-3">
            <Check className="size-5 text-emerald-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Consumer link ready
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                {referralUrl}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(referralUrl, "Consumer link")}
            >
              <ClipboardCopy className="size-3.5" />
              Copy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-black">{contaminants.length}</p>
                  <p className="text-[11px] text-muted-foreground">Detected</p>
                </div>
                <div className="rounded-lg border p-3 text-center border-amber-200">
                  <p className="text-2xl font-black text-amber-600">
                    {overHealth.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Health Flags
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center border-red-200">
                  <p className="text-2xl font-black text-red-600">
                    {overLegal.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Legal Violations
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-black">
                    {report.populationServed?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Pop. Served
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Contaminants */}
          {overLegal.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                  <Shield className="size-4" />
                  Legal Limit Violations
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {overLegal.map((c: any) => (
                  <ContaminantRow key={c.contaminant_id || c.contaminant} c={c} />
                ))}
              </CardContent>
            </Card>
          )}

          {overHealth.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  Health Guideline Exceedances
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {overHealth
                  .filter((c: any) => !c.over_legal)
                  .slice(0, 5)
                  .map((c: any) => (
                    <ContaminantRow
                      key={c.contaminant_id || c.contaminant}
                      c={c}
                    />
                  ))}
                {overHealth.filter((c: any) => !c.over_legal).length > 5 && (
                  <p className="py-2 text-xs text-muted-foreground text-center">
                    +{overHealth.filter((c: any) => !c.over_legal).length - 5}{" "}
                    more
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Field Readings */}
          {(report.chlorine != null ||
            report.hardness != null ||
            report.tds != null ||
            report.ph != null) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="size-4" />
                  In-Home Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Chlorine", value: report.chlorine, unit: "ppm" },
                    { label: "Hardness", value: report.hardness, unit: "ppm" },
                    { label: "TDS", value: report.tds, unit: "ppm" },
                    { label: "pH", value: report.ph, unit: "" },
                  ].map(({ label, value, unit }) => (
                    <div
                      key={label}
                      className="rounded-lg border p-3 text-center"
                    >
                      <p className="text-lg font-bold">
                        {value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Utility Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="size-4" />
                Utility Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Utility</dt>
                <dd className="font-medium">{report.utilityName}</dd>
                <dt className="text-muted-foreground">PWSID</dt>
                <dd className="font-medium">{report.pwsid}</dd>
                <dt className="text-muted-foreground">Water Source</dt>
                <dd className="font-medium capitalize">{report.waterSource}</dd>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="font-medium">
                  {report.city}, {report.state}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORT TAB */}
        <TabsContent value="report" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                All Detected Contaminants ({contaminants.length})
              </CardTitle>
              <CardDescription>
                Full water quality analysis from {report.utilityName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {contaminants.map((c: any) => (
                <div key={c.contaminant_id || c.contaminant} className="px-4">
                  <ContaminantRow c={c} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {shareUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={shareUrl} target="_blank" rel="noopener">
                  <ExternalLink className="size-3.5" />
                  View Full Report
                </a>
              </Button>
            )}
            {shareUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`${shareUrl}/flipbook`}
                  target="_blank"
                  rel="noopener"
                >
                  <MessageSquare className="size-3.5" />
                  Flipbook
                </a>
              </Button>
            )}
            {report.pdfUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={report.pdfUrl} target="_blank" rel="noopener">
                  <Download className="size-3.5" />
                  Download PDF
                </a>
              </Button>
            )}
          </div>
        </TabsContent>

        {/* VERIFY TAB */}
        <TabsContent value="verify" className="space-y-4 mt-4">
          {/* In-Home Test */}
          <PlanGate locked={!hasVerification(company)} message={upgradeMessage("verification")} requiredPlan="Growth">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="size-4" />
                  In-Home Water Test
                </CardTitle>
                <CardDescription>
                  Enter field readings from a test kit. Results sync automatically to the
                  customer's myaquareport.com dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InHomeTestForm
                  reportId={reportId}
                  existingReadings={{
                    chlorine: report.chlorine,
                    hardness: report.hardness,
                    tds: report.tds,
                    ph: report.ph,
                  }}
                />
              </CardContent>
            </Card>
          </PlanGate>

          {/* Filtration */}
          <PlanGate locked={!hasFiltration(company)} message={upgradeMessage("filtration")} requiredPlan="Growth">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="size-4" />
                  Filtration Installation
                </CardTitle>
                <CardDescription>
                  Record a filtration system install. Creates a verified record on the
                  consumer side.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FiltrationForm report={report} />
              </CardContent>
            </Card>
          </PlanGate>
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card>
            <CardContent className="py-6">
              <ActivityTimeline report={report} stage={stage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FiltrationForm({ report }: { report: any }) {
  const [system, setSystem] = useState("");
  const [installDate, setInstallDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const createFiltration = useAction(
    api.dealerShared.createFiltrationVerification
  );

  const systems = [
    "Excalibur Chlor-A-Soft",
    "Excalibur Premium",
    "SpringWell CF1",
    "AquaOx FCS-2",
    "Pelican PC600",
    "US Water Matrixx",
    "Kind Water E-2000",
    "Pentair Pelican Whole House",
  ];

  const handleSave = async () => {
    if (!system) {
      toast.error("Select a filtration system");
      return;
    }
    setSaving(true);
    try {
      await createFiltration({
        customerName: report.customerName || "Homeowner",
        customerAddress:
          report.customerAddress ||
          `${report.city}, ${report.state} ${report.zip}`,
        customerZip: report.customerZip || report.zip,
        customerEmail: report.customerEmail || "",
        customerPhone: report.customerPhone || "",
        systemName: system,
        systemType: "whole_home",
        installDate,
      });
      toast.success("Filtration verified & synced!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Filtration System</Label>
        <select
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select system...</option>
          {systems.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Install Date</Label>
        <Input
          type="date"
          value={installDate}
          onChange={(e) => setInstallDate(e.target.value)}
          className="h-9"
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Wrench className="size-4" />
            Verify Installation
          </>
        )}
      </Button>
    </div>
  );
}

function ActivityTimeline({ report, stage }: { report: any; stage: string }) {
  const steps = [
    {
      label: "Report Created",
      done: true,
      time: report._creationTime
        ? new Date(report._creationTime).toLocaleDateString()
        : null,
    },
    {
      label: "Link Sent to Customer",
      done: ["claimed", "tested", "filtered", "certified"].includes(stage),
    },
    {
      label: "Customer Claimed Report",
      done: ["claimed", "tested", "filtered", "certified"].includes(stage),
      time: report.claimedAt
        ? new Date(report.claimedAt).toLocaleDateString()
        : null,
    },
    {
      label: "In-Home Test Completed",
      done: ["tested", "filtered", "certified"].includes(stage),
    },
    {
      label: "Filtration Installed",
      done: ["filtered", "certified"].includes(stage),
    },
    {
      label: "Certified",
      done: stage === "certified",
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((s, i) => (
        <div key={s.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                s.done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-muted-foreground/30"
              }`}
            >
              {s.done && <Check className="size-3" />}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-[24px] ${
                  s.done ? "bg-emerald-500" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
          <div className="pb-4">
            <p
              className={`text-sm font-medium ${
                s.done ? "" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </p>
            {s.time && (
              <p className="text-xs text-muted-foreground">{s.time}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
