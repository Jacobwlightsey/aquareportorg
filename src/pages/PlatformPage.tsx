import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Globe2,
  KeyRound,
  Link2,
  Lock,
  Mail,
  Map as MapIcon,
  MessageSquare,
  Phone,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { Link } from "react-router-dom";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "../../convex/_generated/api";

const integrations = [
  { id: "hubspot", name: "HubSpot", icon: Building2, authType: "oauth" },
  { id: "gohighlevel", name: "GoHighLevel", icon: Phone, authType: "oauth" },
  { id: "salesforce", name: "Salesforce", icon: CloudIcon, authType: "oauth" },
  { id: "zapier", name: "Zapier", icon: PlugZap },
  { id: "twilio", name: "Twilio", icon: MessageSquare },
  { id: "mailchimp", name: "Mailchimp", icon: Mail, authType: "oauth" },
] as const;

function CloudIcon({ className }: { className?: string }) {
  return <Globe2 className={className} />;
}

export function PlatformPage() {
  const company = useQuery(api.companies.getMyCompany);
  const insights = useQuery(api.reports.getTerritoryInsights);
  const connections = useQuery(api.integrations.listConnections);
  const subscription = useQuery(api.stripe.getSubscription);
  const upsertConnection = useMutation(api.integrations.upsertConnection);
  const disconnectConnection = useMutation(api.integrations.disconnectConnection);
  const importLeads = useMutation(api.leads.importLeads);
  const updateCompany = useMutation(api.companies.updateCompany);
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState("");
  const [activeProvider, setActiveProvider] = useState<(typeof integrations)[number] | null>(null);
  const [manualKey, setManualKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const connected = new Set((connections ?? []).map((connection) => connection.provider));
  const { effectivePlan: trialEffectivePlan, isFree: trialIsFree } = useFreeTrial();
  const currentPlan = trialIsFree ? trialEffectivePlan : (subscription?.status === "active" ? subscription.plan : "free");
  const planRank: Record<string, number> = { free: 0, starter: 1, growth: 2, pro: 3, enterprise: 4 };
  const hasGrowth = (planRank[currentPlan] ?? 0) >= 2;
  const hasPro = (planRank[currentPlan] ?? 0) >= 3;

  const connectProvider = async () => {
    if (!activeProvider) return;
    const provider = activeProvider.id;
    setBusy(provider);
    try {
      await upsertConnection({
        provider: provider as any,
        status: "active" as const,
        authType: provider === "zapier" ? "webhook" : manualKey.trim() ? "api_key" : "oauth",
        displayName: activeProvider.name,
        apiKey: manualKey.trim() || undefined,
        webhookUrl: webhookUrl.trim() || undefined,
        syncLeadEvents: true,
        syncReportEvents: true,
      });
      toast.success("Integration connection saved");
      setActiveProvider(null);
      setManualKey("");
      setWebhookUrl("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save integration");
    } finally {
      setBusy("");
    }
  };

  const pauseProvider = async (provider: string) => {
    setBusy(provider);
    try {
      await disconnectConnection({ provider: provider as any });
      toast.success("Integration paused");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to pause integration");
    } finally {
      setBusy("");
    }
  };

  const saveDomain = async () => {
    if (!domain.trim()) return;
    setBusy("domain");
    try {
      await updateCompany({
        customDomain: domain.trim().toLowerCase(),
        brandMode: "white_label",
      });
      toast.success("Custom domain saved");
      setDomain("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save domain");
    } finally {
      setBusy("");
    }
  };

  const uploadCrmCsv = async (file: File) => {
    setBusy("crm-upload");
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      const headers = (lines.shift() || "")
        .split(",")
        .map((header) => header.trim().toLowerCase());
      const index = (names: string[]) => names.map((name) => headers.indexOf(name)).find((i) => i >= 0) ?? -1;
      const nameIndex = index(["name", "full name", "contact", "customer"]);
      const firstIndex = index(["first name", "firstname"]);
      const lastIndex = index(["last name", "lastname"]);
      const emailIndex = index(["email", "email address"]);
      const phoneIndex = index(["phone", "phone number", "mobile"]);
      const notesIndex = index(["message", "notes", "note"]);

      const leads = lines.slice(0, 500).map((line) => {
        const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
        const fullName = nameIndex >= 0
          ? cells[nameIndex]
          : [firstIndex >= 0 ? cells[firstIndex] : "", lastIndex >= 0 ? cells[lastIndex] : ""].filter(Boolean).join(" ");
        return {
          name: fullName || cells[emailIndex] || cells[phoneIndex] || "Imported Lead",
          email: emailIndex >= 0 ? cells[emailIndex] : undefined,
          phone: phoneIndex >= 0 ? cells[phoneIndex] : undefined,
          message: notesIndex >= 0 ? cells[notesIndex] : undefined,
          source: "crm_csv_import",
        };
      }).filter((lead) => lead.name || lead.email || lead.phone);

      const result = await importLeads({ leads });
      toast.success(`Imported ${result.imported} leads`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import CRM CSV");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            SaaS Platform Console
          </h1>
          <p className="text-muted-foreground mt-1">
            AI, integrations, territory intelligence, enterprise controls, and launch health.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-2 px-3 py-1.5">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          {currentPlan === "free" ? "Upgrade to unlock platform tools" : `${currentPlan.toUpperCase()} tools enabled`}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          icon={ShieldCheck}
          title="Security"
          value="Role gated"
          detail="Audit logs, usage tracking, env-only secrets, and rate-limited public APIs."
        />
        <StatusCard
          icon={BrainCircuit}
          title="OpenAI"
          value="Ready"
          detail="Report explanations, sales notes, follow-up drafts, and narration scripts."
        />
        <StatusCard
          icon={Activity}
          title="Observability"
          value="Instrumented"
          detail="Billing, API, report, lead, and integration events are recorded for monitoring."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="size-5 text-blue-500" />
              Native Integrations
            </CardTitle>
            <CardDescription>
              Connect CRM, marketing, SMS, and automation systems for lead and report sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              const isConnected = connected.has(integration.id);
              return (
                <div key={integration.id} className={`rounded-lg border p-4 ${!hasPro ? "bg-muted/30 opacity-70" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-muted p-2">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {!hasPro ? "Pro required" : isConnected ? "Active sync profile" : "OAuth/API setup"}
                        </p>
                      </div>
                    </div>
                    {!hasPro ? <Lock className="size-4 text-muted-foreground" /> : isConnected && <CheckCircle2 className="size-4 text-emerald-500" />}
                  </div>
                  {hasPro ? (
                    <>
                      <Button
                        className="mt-4 w-full"
                        variant={isConnected ? "outline" : "default"}
                        size="sm"
                        disabled={busy === integration.id}
                        onClick={() => setActiveProvider(integration)}
                      >
                        <Link2 className="size-3.5" />
                        {isConnected ? "Update" : "Connect"}
                      </Button>
                    {isConnected && (
                      <Button
                        className="mt-2 w-full"
                        variant="ghost"
                        size="sm"
                        disabled={busy === integration.id}
                        onClick={() => pauseProvider(integration.id)}
                      >
                        Pause sync
                      </Button>
                    )}
                    </>
                  ) : (
                    <Button className="mt-4 w-full" variant="outline" size="sm" asChild>
                      <Link to="/subscription">
                        <Lock className="size-3.5" />
                        Upgrade to Pro
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5 text-cyan-500" />
              CRM Upload
            </CardTitle>
            <CardDescription>
              Import a CSV of contacts or CRM leads into AquaReport.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept=".csv,text/csv"
              disabled={!hasPro || busy === "crm-upload"}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadCrmCsv(file);
                event.currentTarget.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">
              CSV headers supported: name, first name, last name, email, phone, notes. Imports up to 500 rows at a time.
            </p>
            {!hasPro && (
              <Button asChild variant="outline" size="sm">
                <Link to="/subscription">Upgrade to Pro</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              AI Sales Suite
            </CardTitle>
            <CardDescription>
              Generated report intelligence is saved per report and available to reps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Homeowner-friendly contaminant explanations",
              "Customer risk summaries",
              "Sales talking points and objection handling",
              "SMS/email follow-up drafts",
              "Narrated presentation scripts",
            ].map((item) => (
              <div key={item} className={`flex items-center justify-between rounded-lg border p-3 ${!hasGrowth ? "bg-muted/30 opacity-70" : ""}`}>
                <span className="text-sm">{item}</span>
                {hasGrowth ? <Switch checked disabled /> : <Lock className="size-4 text-muted-foreground" />}
              </div>
            ))}
            {!hasGrowth && (
              <Button asChild className="w-full">
                <Link to="/subscription">Unlock AI on Growth</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="size-5 text-emerald-500" />
              Territory Intelligence
            </CardTitle>
            <CardDescription>
              High-risk ZIP codes, report volume, and conversion signals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(insights ?? []).slice(0, 6).map((insight) => (
              <div key={insight.zip} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{insight.zip}</p>
                  <p className="text-xs text-muted-foreground">
                    {insight.totalReports} reports - {insight.totalLeads} leads - {insight.conversionRate}% conversion
                  </p>
                </div>
                <Badge variant={insight.riskScore > 60 ? "destructive" : "secondary"}>
                  Risk {insight.riskScore}
                </Badge>
              </div>
            ))}
            {(!insights || insights.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Generate reports to populate territory intelligence.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-violet-500" />
              Enterprise Controls
            </CardTitle>
            <CardDescription>
              White-label controls, custom domains, disclaimers, and API readiness.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`space-y-2 ${!hasPro ? "opacity-60" : ""}`}>
              <Label>Custom domain</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={(company?.customDomain as string) || "reports.yourcompany.com"}
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  disabled={!hasPro}
                />
                {hasPro ? (
                  <Button disabled={busy === "domain"} onClick={saveDomain}>
                    Save
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/subscription">Upgrade</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>API access mode</Label>
              <Select defaultValue="scoped">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scoped">Scoped company API keys</SelectItem>
                  <SelectItem value="readonly">Read-only reporting API</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["White-labeled reports", "Custom disclaimers", "Custom domains", "Scoped API keys"].map((item) => (
                <div key={item} className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <CheckCircle2 className="mb-2 size-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!activeProvider} onOpenChange={(open) => !open && setActiveProvider(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {activeProvider?.name}</DialogTitle>
            <DialogDescription>
              AquaReport will use provider credentials from Convex env when configured. You can also save a manual API key or webhook URL for this company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API key or access token</Label>
              <Input
                type="password"
                value={manualKey}
                onChange={(event) => setManualKey(event.target.value)}
                placeholder="Optional if provider env keys are configured"
              />
              <p className="text-xs text-muted-foreground">
                The app stores only connection metadata and the key ending for display. Production provider secrets should live in Convex env.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="Optional destination webhook"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveProvider(null)}>
              Cancel
            </Button>
            <Button disabled={!!activeProvider && busy === activeProvider.id} onClick={connectProvider}>
              {activeProvider && busy === activeProvider.id ? "Connecting..." : "Save connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{detail}</p>
      </CardContent>
    </Card>
  );
}
