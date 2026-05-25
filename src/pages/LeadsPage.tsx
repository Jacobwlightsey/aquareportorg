import { useAction, useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "../../convex/_generated/api";

type LeadStatus = "new" | "contacted" | "closed";
type ConsumerLeadStatus = "new" | "claimed" | "scheduled" | "completed";

type PipelineState = {
  serviceZips: string[];
  available: any[];
  mine: any[];
};

export function LeadsPage() {
  const leads = useQuery(api.leads.getLeads);
  const enterpriseLeads = useQuery(api.leads.getEnterpriseLeads);
  const dealerContext = useQuery(api.dealerShared.getDealerContext);
  const updateStatus = useMutation(api.leads.updateLeadStatus);
  const updateEnterpriseStatus = useMutation(api.leads.updateEnterpriseLeadStatus);
  const listConsumerLeads = useAction(api.dealerShared.listConsumerLeads);
  const claimConsumerLead = useAction(api.dealerShared.claimConsumerLead);
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "closed">("all");
  const [pipelineStatus, setPipelineStatus] = useState<ConsumerLeadStatus>("new");
  const [pipelineZip, setPipelineZip] = useState("");
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  const refreshPipeline = async () => {
    if (!dealerContext?.access.leadPipeline) return;
    setPipelineLoading(true);
    try {
      const data = await listConsumerLeads({
        status: pipelineStatus,
        zip: pipelineZip.trim() || undefined,
      });
      setPipeline(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load consumer leads.");
    } finally {
      setPipelineLoading(false);
    }
  };

  useEffect(() => {
    if (dealerContext?.access.leadPipeline) {
      void refreshPipeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerContext?.access.leadPipeline, pipelineStatus]);

  if (leads === undefined || enterpriseLeads === undefined || dealerContext === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const newCount = leads.filter((l) => l.status === "new").length;
  const contactedCount = leads.filter((l) => l.status === "contacted").length;
  const closedCount = leads.filter((l) => l.status === "closed").length;

  const handleStatusChange = async (leadId: any, status: LeadStatus) => {
    try {
      await updateStatus({ leadId, status });
      toast.success(`Lead marked as ${status}`);
    } catch {
      toast.error("Failed to update lead");
    }
  };

  const handleEnterpriseStatusChange = async (leadId: any, status: LeadStatus) => {
    try {
      await updateEnterpriseStatus({ leadId, status });
      toast.success(`Enterprise lead marked as ${status}`);
    } catch {
      toast.error("Failed to update enterprise lead");
    }
  };

  const handleClaimConsumerLead = async (leadId: string) => {
    try {
      await claimConsumerLead({ leadId });
      toast.success("Consumer lead claimed.");
      await refreshPipeline();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not claim lead.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage quote requests, enterprise inquiries, and Pro consumer lead opportunities
        </p>
      </div>

      <ConsumerLeadPipeline
        context={dealerContext}
        pipeline={pipeline}
        status={pipelineStatus}
        zip={pipelineZip}
        loading={pipelineLoading}
        onStatus={setPipelineStatus}
        onZip={setPipelineZip}
        onRefresh={refreshPipeline}
        onClaim={handleClaimConsumerLead}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`p-3 rounded-xl border text-center transition-colors ${filter === "all" ? "border-blue-500 bg-blue-500/5" : "hover:bg-muted/50"}`}
        >
          <p className="text-2xl font-bold">{leads.length}</p>
          <p className="text-[11px] text-muted-foreground">All</p>
        </button>
        <button
          onClick={() => setFilter("new")}
          className={`p-3 rounded-xl border text-center transition-colors ${filter === "new" ? "border-emerald-500 bg-emerald-500/5" : "hover:bg-muted/50"}`}
        >
          <p className="text-2xl font-bold text-emerald-500">{newCount}</p>
          <p className="text-[11px] text-muted-foreground">New</p>
        </button>
        <button
          onClick={() => setFilter("contacted")}
          className={`p-3 rounded-xl border text-center transition-colors ${filter === "contacted" ? "border-amber-500 bg-amber-500/5" : "hover:bg-muted/50"}`}
        >
          <p className="text-2xl font-bold text-amber-500">{contactedCount}</p>
          <p className="text-[11px] text-muted-foreground">Contacted</p>
        </button>
        <button
          onClick={() => setFilter("closed")}
          className={`p-3 rounded-xl border text-center transition-colors ${filter === "closed" ? "border-gray-500 bg-gray-500/5" : "hover:bg-muted/50"}`}
        >
          <p className="text-2xl font-bold text-gray-500">{closedCount}</p>
          <p className="text-[11px] text-muted-foreground">Closed</p>
        </button>
      </div>

      {/* Leads list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No leads yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Leads will appear here when customers request quotes from your water reports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <Card key={lead._id} className={lead.status === "new" ? "border-emerald-500/30 bg-emerald-500/[0.02]" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                      lead.status === "new" ? "bg-emerald-500/10" : lead.status === "contacted" ? "bg-amber-500/10" : "bg-gray-500/10"
                    }`}>
                      <User className={`size-5 ${
                        lead.status === "new" ? "text-emerald-500" : lead.status === "contacted" ? "text-amber-500" : "text-gray-500"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{lead.name}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          lead.status === "new" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                          lead.status === "contacted" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {lead.status === "new" ? "NEW" : lead.status === "contacted" ? "CONTACTED" : "CLOSED"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
                            <Phone className="size-3" /> {lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
                            <Mail className="size-3" /> {lead.email}
                          </a>
                        )}
                        {lead.utilityCityState && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" /> {lead.utilityCityState}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {new Date(lead._creationTime).toLocaleDateString()}
                        </span>
                      </div>
                      {lead.message && (
                        <div className="mt-2 p-2.5 rounded-lg bg-muted/50 text-sm text-muted-foreground flex items-start gap-2">
                          <MessageSquare className="size-3.5 shrink-0 mt-0.5" />
                          <p>{lead.message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {lead.status === "new" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => handleStatusChange(lead._id, "contacted")}
                      >
                        <CheckCircle2 className="size-3" /> Mark Contacted
                      </Button>
                    )}
                    {lead.status === "contacted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => handleStatusChange(lead._id, "closed")}
                      >
                        <XCircle className="size-3" /> Close
                      </Button>
                    )}
                    {lead.status === "closed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8"
                        onClick={() => handleStatusChange(lead._id, "new")}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {enterpriseLeads.length > 0 && (
        <div className="space-y-3 pt-4">
          <div>
            <h2 className="text-lg font-semibold">Enterprise inquiries</h2>
            <p className="text-muted-foreground text-sm">
              Contact requests from the Enterprise pricing buttons.
            </p>
          </div>
          {enterpriseLeads.map((lead) => (
            <Card key={lead._id} className={lead.status === "new" ? "border-blue-500/30 bg-blue-500/[0.02]" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm">{lead.name}</p>
                      {lead.companyName && <span className="text-xs text-muted-foreground">· {lead.companyName}</span>}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        lead.status === "new" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                        lead.status === "contacted" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {lead.status === "new" ? "NEW" : lead.status === "contacted" ? "CONTACTED" : "CLOSED"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="size-3" /> {lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="size-3" /> {lead.phone}
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {new Date(lead._creationTime).toLocaleDateString()}
                      </span>
                    </div>
                    {lead.message && (
                      <div className="mt-2 p-2.5 rounded-lg bg-muted/50 text-sm text-muted-foreground flex items-start gap-2">
                        <MessageSquare className="size-3.5 shrink-0 mt-0.5" />
                        <p>{lead.message}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {lead.status === "new" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => handleEnterpriseStatusChange(lead._id, "contacted")}
                      >
                        <CheckCircle2 className="size-3" /> Mark Contacted
                      </Button>
                    )}
                    {lead.status === "contacted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => handleEnterpriseStatusChange(lead._id, "closed")}
                      >
                        <XCircle className="size-3" /> Close
                      </Button>
                    )}
                    {lead.status === "closed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8"
                        onClick={() => handleEnterpriseStatusChange(lead._id, "new")}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsumerLeadPipeline({
  context,
  pipeline,
  status,
  zip,
  loading,
  onStatus,
  onZip,
  onRefresh,
  onClaim,
}: {
  context: any;
  pipeline: PipelineState | null;
  status: ConsumerLeadStatus;
  zip: string;
  loading: boolean;
  onStatus: (status: ConsumerLeadStatus) => void;
  onZip: (zip: string) => void;
  onRefresh: () => void;
  onClaim: (leadId: string) => void;
}) {
  if (!context?.access.leadPipeline) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Consumer Lead Pipeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {context?.messages.pro || "Upgrade to Pro ($599/mo) to access the lead pipeline."}
            </p>
          </div>
          <Button asChild>
            <a href="/subscription">Upgrade to Pro</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const available = pipeline?.available ?? [];
  const mine = pipeline?.mine ?? [];

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Consumer Lead Pipeline</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Free in-home test requests from MyAquaReport matched to your covered ZIP codes.
            </p>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[160px_1fr]">
          <Select value={status} onValueChange={(value: ConsumerLeadStatus) => onStatus(value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              value={zip}
              onChange={(event) => onZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder={(pipeline?.serviceZips ?? []).length ? `Covered ZIPs: ${(pipeline?.serviceZips ?? []).slice(0, 4).join(", ")}` : "Filter by ZIP"}
            />
            <Button variant="secondary" onClick={onRefresh} disabled={loading}>Apply</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Available Leads</h3>
          {available.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No matching consumer leads found for this filter yet.
            </p>
          ) : (
            <div className="space-y-3">
              {available.map((lead) => (
                <ConsumerLeadCard key={lead.id} lead={lead} actionLabel="Claim Lead" onAction={() => onClaim(lead.id)} />
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">My Leads</h3>
          {mine.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Claimed consumer leads will appear here after you claim them.
            </p>
          ) : (
            <div className="space-y-3">
              {mine.map((lead) => (
                <ConsumerLeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConsumerLeadCard({
  lead,
  actionLabel,
  onAction,
}: {
  lead: any;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm">{lead.consumer_name || "Consumer Lead"}</p>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {(lead.status || "new").toUpperCase()}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {lead.consumer_phone && <a className="flex items-center gap-1 hover:text-foreground" href={`tel:${lead.consumer_phone}`}><Phone className="size-3" />{lead.consumer_phone}</a>}
            {lead.consumer_email && <a className="flex items-center gap-1 hover:text-foreground" href={`mailto:${lead.consumer_email}`}><Mail className="size-3" />{lead.consumer_email}</a>}
            {(lead.address || lead.zip) && <span className="flex items-center gap-1"><MapPin className="size-3" />{[lead.address, lead.zip].filter(Boolean).join(" ")}</span>}
            {lead.created_at && <span className="flex items-center gap-1"><Clock className="size-3" />{new Date(lead.created_at).toLocaleDateString()}</span>}
          </div>
          {lead.notes && (
            <p className="mt-2 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">{lead.notes}</p>
          )}
        </div>
        {actionLabel && onAction && (
          <Button size="sm" onClick={onAction}>
            <CheckCircle2 className="size-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
