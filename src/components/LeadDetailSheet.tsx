import { useMutation, useQuery } from "convex/react";
import {
  Calendar, Clock, ExternalLink, FileText, Mail, MapPin, MessageSquare,
  Phone, Play, Send, User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api } from "../../convex/_generated/api";
import { LEAD_STAGES, type LeadStage, leadStageMeta } from "@/lib/pipeline";

interface LeadDetailSheetProps {
  lead: any;
  open: boolean;
  onClose: () => void;
}

export function LeadDetailSheet({ lead, open, onClose }: LeadDetailSheetProps) {
  const navigate = useNavigate();
  const updateStatus = useMutation(api.leads.updateLeadStatus);
  const createFollowUp = useMutation(api.followUps.createFollowUpTask);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  if (!lead) return null;

  const meta = leadStageMeta(lead.status);

  const handleStageChange = async (stage: string) => {
    try {
      await updateStatus({ leadId: lead._id, status: stage as any });
      toast.success(`Stage updated to ${leadStageMeta(stage).label}`);
    } catch {
      toast.error("Failed to update stage");
    }
  };

  const handleScheduleFollowUp = async () => {
    setCreatingFollowUp(true);
    try {
      await createFollowUp({
        leadId: lead._id,
        customerName: lead.name,
      });
      toast.success("Follow-up scheduled (2 days)");
    } catch {
      toast.error("Failed to create follow-up");
    }
    setCreatingFollowUp(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">{lead.name}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
                {meta.label.toUpperCase()}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {/* Contact info */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact</p>
            <div className="space-y-1.5 text-sm">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 hover:text-foreground text-muted-foreground">
                  <Phone className="size-3.5" /> {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 hover:text-foreground text-muted-foreground">
                  <Mail className="size-3.5" /> {lead.email}
                </a>
              )}
              {lead.utilityCityState && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" /> {lead.utilityCityState}
                </span>
              )}
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5" /> Created {new Date(lead._creationTime).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Stage selector */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Move to Stage</p>
            <Select value={lead.status} onValueChange={handleStageChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes / message */}
          {lead.message && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message</p>
              <div className="rounded-lg bg-muted/50 p-3 text-sm flex items-start gap-2">
                <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                <p>{lead.message}</p>
              </div>
            </div>
          )}

          {/* Source */}
          {lead.source && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Source</p>
              <p className="text-sm text-muted-foreground capitalize">{lead.source}</p>
            </div>
          )}

          {/* AI Score */}
          {lead.aiScore != null && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Lead Score</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${lead.aiScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{lead.aiScore}</span>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => { onClose(); navigate("/appointments"); }}
              >
                <Calendar className="size-3.5 mr-1.5" /> Schedule Appointment
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (lead.name) params.set("name", lead.name);
                  if (lead.email) params.set("email", lead.email);
                  if (lead.phone) params.set("phone", lead.phone);
                  onClose();
                  navigate(`/customers/new?${params.toString()}`);
                }}
              >
                <FileText className="size-3.5 mr-1.5" /> Generate Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={handleScheduleFollowUp}
                disabled={creatingFollowUp}
              >
                <Send className="size-3.5 mr-1.5" /> {creatingFollowUp ? "Creating…" : "Schedule Follow-Up"}
              </Button>
              {lead.reportId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => { onClose(); navigate(`/demo/${lead.reportId}`); }}
                >
                  <Play className="size-3.5 mr-1.5" /> Start Demo
                </Button>
              )}
              {lead.reportShareToken && (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => window.open(`${window.location.origin}/r/${lead.reportShareToken}`, "_blank")}
                >
                  <ExternalLink className="size-3.5 mr-1.5" /> View Report
                </Button>
              )}
            </div>
          </div>

          {/* Facebook Ads info */}
          {lead.fbCampaignName && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Facebook Ads</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                {lead.fbCampaignName && <p>Campaign: {lead.fbCampaignName}</p>}
                {lead.fbAdSetName && <p>Ad Set: {lead.fbAdSetName}</p>}
                {lead.fbAdName && <p>Ad: {lead.fbAdName}</p>}
                {lead.fbFormName && <p>Form: {lead.fbFormName}</p>}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
