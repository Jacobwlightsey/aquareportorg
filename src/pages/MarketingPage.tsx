import { useAction, useMutation, useQuery } from "convex/react";
import { Copy, FileText, Loader2, Megaphone, Printer, Sparkles, Swords, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { api } from "../../convex/_generated/api";
import { getCountryText } from "@/lib/i18n";
import { DoorHangerPreview } from "@/components/marketing/DoorHangerPreview";

/** Royalty-free stock photos for water treatment social posts (Unsplash). */
const STOCK_WATER_PHOTOS = [
  { label: "Clean Water Glass", thumb: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1200&q=80" },
  { label: "Kitchen Faucet", thumb: "https://images.unsplash.com/photo-1585351650024-2a347aea8b8a?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1585351650024-2a347aea8b8a?w=1200&q=80" },
  { label: "Family Home", thumb: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80" },
  { label: "Water Testing", thumb: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80" },
  { label: "Modern Kitchen", thumb: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80" },
  { label: "Water Droplet", thumb: "https://images.unsplash.com/photo-1525498128493-380d1990a112?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1525498128493-380d1990a112?w=1200&q=80" },
  { label: "Drinking Water", thumb: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=1200&q=80" },
  { label: "Plumber Install", thumb: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=120&h=120&fit=crop", url: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80" },
];

export function MarketingPage() {
  const company = useQuery(api.companies.getMyCompany);
  const t = getCountryText(company?.country);
  const content = useQuery(api.marketing.getContent, {}) ?? [];
  const competitors = useQuery(api.marketing.getCompetitorTemplates) ?? [];
  const createContent = useMutation(api.marketing.createContent);
  const deleteContent = useMutation(api.marketing.deleteContent);
  const generateSocial = useAction(api.marketing.generateSocialPost);
  const createCompetitor = useMutation(api.marketing.createCompetitorTemplate);

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [showDoorHanger, setShowDoorHanger] = useState(false);
  const [showCompetitor, setShowCompetitor] = useState(false);

  const [socialForm, setSocialForm] = useState({ platform: "facebook", topic: "" });
  const [competitorForm, setCompetitorForm] = useState({
    competitorName: "",
    competitorType: "pitcher_filter",
    removesContaminants: "",
    doesNotRemove: "",
    priceRange: "",
    limitations: "",
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateSocial({
        platform: socialForm.platform,
        topic: socialForm.topic || undefined,
      });
      setGenerated(result);
    } catch {
      toast.error("Failed to generate content");
    }
    setGenerating(false);
  };

  const saveContent = async (
    title: string,
    body: string,
    type: string,
    platform?: string
  ) => {
    try {
      await createContent({
        title,
        content: body,
        type,
        platform: platform || undefined,
      });
      toast.success("Content saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleCreateCompetitor = async () => {
    if (!competitorForm.competitorName.trim()) return;
    try {
      await createCompetitor({
        competitorName: competitorForm.competitorName,
        competitorType: competitorForm.competitorType,
        removesContaminants: competitorForm.removesContaminants || undefined,
        doesNotRemove: competitorForm.doesNotRemove || undefined,
        priceRange: competitorForm.priceRange || undefined,
        limitations: competitorForm.limitations || undefined,
      });
      toast.success("Competitor template added");
      setShowCompetitor(false);
      setCompetitorForm({
        competitorName: "",
        competitorType: "pitcher_filter",
        removesContaminants: "",
        doesNotRemove: "",
        priceRange: "",
        limitations: "",
      });
    } catch {
      toast.error("Failed to create");
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Marketing"
        subtitle="AI-powered content, door hangers, and competitor comparisons."
        icon={Megaphone}
        iconColor="text-violet-400"
        actions={
          <div className="flex gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setShowCompetitor(true)}
            >
              <Swords className="size-3.5 mr-1" /> Competitor
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => {
                setShowDoorHanger(true);
                setGenerated("");
              }}
            >
              <FileText className="size-3.5 mr-1" /> Door Hanger
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowGenerate(true);
                setGenerated("");
              }}
            >
              <Sparkles className="size-3.5 mr-1" /> AI Post
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="content" className="text-xs sm:text-sm">
            Content Library
          </TabsTrigger>
          <TabsTrigger value="competitors" className="text-xs sm:text-sm">
            Competitors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-2">
          {content.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No content yet"
              description="Generate AI social posts or door hangers to build your library."
              actionLabel="Generate AI Post"
              onAction={() => {
                setShowGenerate(true);
                setGenerated("");
              }}
            />
          ) : (
            content.map((c) => (
              <Card
                key={c._id}
                className="hover:border-border transition-colors"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{c.title}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {c.type}
                        </Badge>
                        {c.platform && (
                          <Badge variant="outline" className="text-[10px]">
                            {c.platform}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5 whitespace-pre-wrap line-clamp-3">
                        {c.content}
                      </p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => {
                          navigator.clipboard.writeText(c.content);
                          toast.success("Copied!");
                        }}
                      >
                        <Copy className="size-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-red-400 hover:text-red-300"
                        onClick={async () => {
                          await deleteContent({ contentId: c._id });
                          toast.success("Deleted");
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-2">
          {competitors.length === 0 ? (
            <EmptyState
              icon={Swords}
              title="No competitor templates"
              description="Add competitor info to help your reps handle objections."
              actionLabel="Add Competitor"
              onAction={() => setShowCompetitor(true)}
            />
          ) : (
            competitors.map((c) => (
              <Card key={c._id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-sm">{c.competitorName}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {c.competitorType.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {c.removesContaminants && (
                      <div>
                        <p className="font-bold text-emerald-400 mb-0.5">
                          Removes:
                        </p>
                        <p className="text-muted-foreground">
                          {c.removesContaminants}
                        </p>
                      </div>
                    )}
                    {c.doesNotRemove && (
                      <div>
                        <p className="font-bold text-red-400 mb-0.5">
                          Does NOT Remove:
                        </p>
                        <p className="text-muted-foreground">{c.doesNotRemove}</p>
                      </div>
                    )}
                    {c.priceRange && (
                      <div>
                        <p className="font-bold text-amber-400 mb-0.5">Price:</p>
                        <p className="text-muted-foreground">{c.priceRange}</p>
                      </div>
                    )}
                    {c.limitations && (
                      <div>
                        <p className="font-bold text-orange-400 mb-0.5">
                          Limitations:
                        </p>
                        <p className="text-muted-foreground">{c.limitations}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* AI Social Post Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate AI Social Post</DialogTitle>
            <DialogDescription>
              Use AI to create platform-specific content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={socialForm.platform}
                onValueChange={(v) =>
                  setSocialForm({ ...socialForm, platform: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">X / Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic (optional)</Label>
              <Input
                value={socialForm.topic}
                onChange={(e) =>
                  setSocialForm({ ...socialForm, topic: e.target.value })
                }
                placeholder="e.g., PFAS contamination in drinking water"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="size-4 mr-1" />
              )}
              {generating ? "Generating..." : "Generate Post"}
            </Button>
            {generated && (
              <div className="space-y-3">
                {/* Stock Photo Picker */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Suggested Stock Images</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {STOCK_WATER_PHOTOS.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        className="relative aspect-square rounded-md overflow-hidden border border-border hover:border-cyan-400/50 transition-colors group"
                        onClick={() => {
                          navigator.clipboard.writeText(photo.url);
                          toast.success(`"${photo.label}" URL copied — paste into your post!`);
                        }}
                        title={`${photo.label} — click to copy URL`}
                      >
                        <img src={photo.thumb} alt={photo.label} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[9px] text-foreground font-medium px-1 text-center">{photo.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Click any image to copy its URL for your social post.</p>
                </div>
                <Textarea
                  value={generated}
                  onChange={(e) => setGenerated(e.target.value)}
                  rows={6}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generated);
                      toast.success("Copied!");
                    }}
                  >
                    <Copy className="size-3 mr-1" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      saveContent(
                        `${socialForm.platform} post`,
                        generated,
                        "social_post",
                        socialForm.platform
                      );
                      setShowGenerate(false);
                    }}
                  >
                    Save to Library
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Door Hanger Dialog — auto-populated from company info */}
      <Dialog open={showDoorHanger} onOpenChange={setShowDoorHanger}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Printer className="size-4" /> Door Hanger Preview
            </DialogTitle>
            <DialogDescription>
              Print-ready 4.25″ × 11″ — auto-filled with your company info.
            </DialogDescription>
          </DialogHeader>
          {company ? (
            <DoorHangerPreview
              companyName={company.name}
              companyPhone={company.phone || "(___) ___-____"}
              companyWebsite={company.website}
              companyLogoUrl={company.logoUrl}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Loading company info…</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Competitor Dialog */}
      <Dialog open={showCompetitor} onOpenChange={setShowCompetitor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Competitor</DialogTitle>
            <DialogDescription>
              Help your reps compare against competitors.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Competitor Name *</Label>
                <Input
                  value={competitorForm.competitorName}
                  onChange={(e) =>
                    setCompetitorForm({
                      ...competitorForm,
                      competitorName: e.target.value,
                    })
                  }
                  placeholder="Brita"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={competitorForm.competitorType}
                  onValueChange={(v) =>
                    setCompetitorForm({
                      ...competitorForm,
                      competitorType: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pitcher_filter">Pitcher</SelectItem>
                    <SelectItem value="fridge_filter">Fridge</SelectItem>
                    <SelectItem value="under_sink">Under Sink</SelectItem>
                    <SelectItem value="reverse_osmosis">RO</SelectItem>
                    <SelectItem value="whole_home">Whole Home</SelectItem>
                    <SelectItem value="softener">Softener</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>What it Removes</Label>
              <Input
                value={competitorForm.removesContaminants}
                onChange={(e) =>
                  setCompetitorForm({
                    ...competitorForm,
                    removesContaminants: e.target.value,
                  })
                }
                placeholder="Chlorine taste, some sediment"
              />
            </div>
            <div className="space-y-2">
              <Label>What it Does NOT Remove</Label>
              <Input
                value={competitorForm.doesNotRemove}
                onChange={(e) =>
                  setCompetitorForm({
                    ...competitorForm,
                    doesNotRemove: e.target.value,
                  })
                }
                placeholder="PFAS, lead, bacteria"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Input
                  value={competitorForm.priceRange}
                  onChange={(e) =>
                    setCompetitorForm({
                      ...competitorForm,
                      priceRange: e.target.value,
                    })
                  }
                  placeholder="$20-40"
                />
              </div>
              <div className="space-y-2">
                <Label>Limitations</Label>
                <Input
                  value={competitorForm.limitations}
                  onChange={(e) =>
                    setCompetitorForm({
                      ...competitorForm,
                      limitations: e.target.value,
                    })
                  }
                  placeholder="Frequent replacements"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompetitor(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCompetitor}
              disabled={!competitorForm.competitorName.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
