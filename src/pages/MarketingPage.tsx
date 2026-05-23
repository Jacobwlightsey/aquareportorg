import { useAction, useMutation, useQuery } from "convex/react";
import {
  Copy,
  FileText,
  Loader2,
  Megaphone,
  Plus,
  Sparkles,
  Swords,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

export function MarketingPage() {
  const content = useQuery(api.marketing.getContent, {}) ?? [];
  const competitors = useQuery(api.marketing.getCompetitorTemplates) ?? [];
  const createContent = useMutation(api.marketing.createContent);
  const deleteContent = useMutation(api.marketing.deleteContent);
  const generateSocial = useAction(api.marketing.generateSocialPost);
  const generateDoorHanger = useAction(api.marketing.generateDoorHanger);
  const createCompetitor = useMutation(api.marketing.createCompetitorTemplate);

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [showDoorHanger, setShowDoorHanger] = useState(false);
  const [showCompetitor, setShowCompetitor] = useState(false);

  const [socialForm, setSocialForm] = useState({ platform: "facebook", topic: "" });
  const [doorHangerForm, setDoorHangerForm] = useState({ zip: "" });
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
      const result = await generateSocial({ platform: socialForm.platform, topic: socialForm.topic || undefined });
      setGenerated(result);
    } catch {
      toast.error("Failed to generate content");
    }
    setGenerating(false);
  };

  const handleGenerateDoorHanger = async () => {
    if (!doorHangerForm.zip) return;
    setGenerating(true);
    try {
      const result = await generateDoorHanger({ zip: doorHangerForm.zip });
      setGenerated(result);
    } catch {
      toast.error("Failed to generate");
    }
    setGenerating(false);
  };

  const saveContent = async (title: string, body: string, type: string, platform?: string) => {
    try {
      await createContent({ title, content: body, type, platform: platform || undefined });
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
      setCompetitorForm({ competitorName: "", competitorType: "pitcher_filter", removesContaminants: "", doesNotRemove: "", priceRange: "", limitations: "" });
    } catch {
      toast.error("Failed to create");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Marketing</h1>
          <p className="text-sm text-muted-foreground">AI-powered content, door hangers, and competitor comparisons.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCompetitor(true)}>
            <Swords className="size-4 mr-1" /> Competitor
          </Button>
          <Button variant="outline" onClick={() => { setShowDoorHanger(true); setGenerated(""); }}>
            <FileText className="size-4 mr-1" /> Door Hanger
          </Button>
          <Button onClick={() => { setShowGenerate(true); setGenerated(""); }}>
            <Sparkles className="size-4 mr-1" /> AI Post
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content Library</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-3 mt-4">
          {content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No content yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate AI social posts or door hangers to build your library.
                </p>
              </CardContent>
            </Card>
          ) : (
            content.map((c) => (
              <Card key={c._id} className="hover:border-white/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{c.title}</p>
                        <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
                        {c.platform && <Badge variant="outline" className="text-[10px]">{c.platform}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap line-clamp-3">
                        {c.content}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
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

        <TabsContent value="competitors" className="space-y-3 mt-4">
          {competitors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Swords className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No competitor templates</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add competitor info to help reps handle objections.
                </p>
              </CardContent>
            </Card>
          ) : (
            competitors.map((c) => (
              <Card key={c._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{c.competitorName}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {c.competitorType.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {c.removesContaminants && (
                      <div>
                        <p className="font-bold text-emerald-400 mb-0.5">Removes:</p>
                        <p className="text-muted-foreground">{c.removesContaminants}</p>
                      </div>
                    )}
                    {c.doesNotRemove && (
                      <div>
                        <p className="font-bold text-red-400 mb-0.5">Does NOT Remove:</p>
                        <p className="text-muted-foreground">{c.doesNotRemove}</p>
                      </div>
                    )}
                    {c.priceRange && (
                      <div>
                        <p className="font-bold text-amber-400 mb-0.5">Price Range:</p>
                        <p className="text-muted-foreground">{c.priceRange}</p>
                      </div>
                    )}
                    {c.limitations && (
                      <div>
                        <p className="font-bold text-orange-400 mb-0.5">Limitations:</p>
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
            <DialogDescription>Use AI to create platform-specific content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={socialForm.platform} onValueChange={(v) => setSocialForm({ ...socialForm, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                onChange={(e) => setSocialForm({ ...socialForm, topic: e.target.value })}
                placeholder="e.g., PFAS contamination in drinking water"
              />
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Sparkles className="size-4 mr-1" />}
              {generating ? "Generating..." : "Generate Post"}
            </Button>
            {generated && (
              <div className="space-y-2">
                <Textarea value={generated} onChange={(e) => setGenerated(e.target.value)} rows={8} />
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
                      saveContent(`${socialForm.platform} post`, generated, "social_post", socialForm.platform);
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

      {/* Door Hanger Dialog */}
      <Dialog open={showDoorHanger} onOpenChange={setShowDoorHanger}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Door Hanger</DialogTitle>
            <DialogDescription>Create localized marketing content for a ZIP code.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ZIP Code *</Label>
              <Input
                value={doorHangerForm.zip}
                onChange={(e) => setDoorHangerForm({ ...doorHangerForm, zip: e.target.value })}
                placeholder="75001"
              />
            </div>
            <Button onClick={handleGenerateDoorHanger} disabled={generating || !doorHangerForm.zip} className="w-full">
              {generating ? <Loader2 className="size-4 mr-1 animate-spin" /> : <FileText className="size-4 mr-1" />}
              {generating ? "Generating..." : "Generate"}
            </Button>
            {generated && (
              <div className="space-y-2">
                <Textarea value={generated} onChange={(e) => setGenerated(e.target.value)} rows={12} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generated); toast.success("Copied!"); }}>
                    <Copy className="size-3 mr-1" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      saveContent(`Door Hanger — ${doorHangerForm.zip}`, generated, "door_hanger");
                      setShowDoorHanger(false);
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

      {/* Competitor Dialog */}
      <Dialog open={showCompetitor} onOpenChange={setShowCompetitor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Competitor Template</DialogTitle>
            <DialogDescription>Help reps compare against competitors.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Competitor Name *</Label>
                <Input value={competitorForm.competitorName} onChange={(e) => setCompetitorForm({ ...competitorForm, competitorName: e.target.value })} placeholder="Brita" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={competitorForm.competitorType} onValueChange={(v) => setCompetitorForm({ ...competitorForm, competitorType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pitcher_filter">Pitcher Filter</SelectItem>
                    <SelectItem value="fridge_filter">Fridge Filter</SelectItem>
                    <SelectItem value="under_sink">Under Sink</SelectItem>
                    <SelectItem value="reverse_osmosis">Reverse Osmosis</SelectItem>
                    <SelectItem value="whole_home">Whole Home</SelectItem>
                    <SelectItem value="softener">Softener</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>What it Removes</Label>
              <Input value={competitorForm.removesContaminants} onChange={(e) => setCompetitorForm({ ...competitorForm, removesContaminants: e.target.value })} placeholder="Chlorine taste, some sediment" />
            </div>
            <div className="space-y-2">
              <Label>What it Does NOT Remove</Label>
              <Input value={competitorForm.doesNotRemove} onChange={(e) => setCompetitorForm({ ...competitorForm, doesNotRemove: e.target.value })} placeholder="PFAS, lead, bacteria, pharmaceuticals" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Input value={competitorForm.priceRange} onChange={(e) => setCompetitorForm({ ...competitorForm, priceRange: e.target.value })} placeholder="$20-40" />
              </div>
              <div className="space-y-2">
                <Label>Key Limitations</Label>
                <Input value={competitorForm.limitations} onChange={(e) => setCompetitorForm({ ...competitorForm, limitations: e.target.value })} placeholder="Frequent replacements needed" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompetitor(false)}>Cancel</Button>
            <Button onClick={handleCreateCompetitor} disabled={!competitorForm.competitorName.trim()}>Add Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
