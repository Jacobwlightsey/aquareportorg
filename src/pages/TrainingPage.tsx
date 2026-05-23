import { useMutation, useQuery } from "convex/react";
import {
  Award,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  GraduationCap,
  Play,
  Plus,
  Users,
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

const CATEGORIES = [
  { value: "onboarding", label: "Onboarding", color: "text-cyan-400 bg-cyan-500/10" },
  { value: "product", label: "Product Knowledge", color: "text-emerald-400 bg-emerald-500/10" },
  { value: "sales", label: "Sales Techniques", color: "text-amber-400 bg-amber-500/10" },
  { value: "water_science", label: "Water Science", color: "text-blue-400 bg-blue-500/10" },
  { value: "objection_handling", label: "Objection Handling", color: "text-violet-400 bg-violet-500/10" },
  { value: "demo_training", label: "Demo Training", color: "text-orange-400 bg-orange-500/10" },
];

export function TrainingPage() {
  const modules = useQuery(api.training.getModules, {}) ?? [];
  const myProgress = useQuery(api.training.getMyProgress) ?? [];
  const teamProgress = useQuery(api.training.getTeamProgress) ?? [];
  const createModule = useMutation(api.training.createModule);
  const updateProgress = useMutation(api.training.updateProgress);
  const [showCreate, setShowCreate] = useState(false);
  const [viewModule, setViewModule] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "onboarding",
    content: "",
    videoUrl: "",
    isRequired: false,
  });

  const completedCount = myProgress.filter((p) => p.status === "completed").length;
  const totalModules = modules.length;
  const myPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const getModuleProgress = (moduleId: string) => myProgress.find((p) => String(p.moduleId) === String(moduleId));

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      await createModule({
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        content: form.content,
        videoUrl: form.videoUrl || undefined,
        isRequired: form.isRequired,
      });
      toast.success("Module created");
      setShowCreate(false);
      setForm({ title: "", description: "", category: "onboarding", content: "", videoUrl: "", isRequired: false });
    } catch {
      toast.error("Failed to create module");
    }
  };

  const markComplete = async (moduleId: any) => {
    try {
      await updateProgress({ moduleId, status: "completed" });
      toast.success("Module completed! 🎉");
    } catch {
      toast.error("Failed to update");
    }
  };

  const startModule = async (moduleId: any) => {
    try {
      await updateProgress({ moduleId, status: "in_progress" });
    } catch {}
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Training</h1>
          <p className="text-sm text-muted-foreground">Team training modules and progress tracking.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 mr-1" /> New Module
        </Button>
      </div>

      {/* My Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold">Your Progress</p>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {totalModules} modules completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-400">{myPercent}%</p>
            </div>
          </div>
          <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${myPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="team">Team Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4">
          {modules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No training modules yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create modules to train your team.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const catModules = modules.filter((m) => m.category === cat.value);
                if (catModules.length === 0) return null;
                return (
                  <div key={cat.value}>
                    <h3 className={`text-sm font-bold mb-2 ${cat.color.split(" ")[0]}`}>
                      {cat.label}
                    </h3>
                    <div className="space-y-2">
                      {catModules.map((mod) => {
                        const progress = getModuleProgress(mod._id);
                        const isComplete = progress?.status === "completed";
                        const isInProgress = progress?.status === "in_progress";
                        return (
                          <Card
                            key={mod._id}
                            className={`cursor-pointer hover:border-white/20 transition-colors ${
                              isComplete ? "border-emerald-500/20" : ""
                            }`}
                            onClick={() => {
                              setViewModule(mod);
                              if (!progress) startModule(mod._id);
                            }}
                          >
                            <CardContent className="p-4 flex items-center gap-4">
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  isComplete
                                    ? "bg-emerald-500/10"
                                    : isInProgress
                                      ? "bg-amber-500/10"
                                      : "bg-white/[0.04]"
                                }`}
                              >
                                {isComplete ? (
                                  <CheckCircle className="size-5 text-emerald-400" />
                                ) : isInProgress ? (
                                  <Clock className="size-5 text-amber-400" />
                                ) : (
                                  <Play className="size-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{mod.title}</p>
                                  {mod.isRequired && (
                                    <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                {mod.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {mod.description}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-3 mt-4">
          {teamProgress.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No team progress data.</p>
              </CardContent>
            </Card>
          ) : (
            teamProgress.map((member: any, i: number) => (
              <Card key={member.userId}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{member.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{member.role}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            member.percentage >= 80
                              ? "bg-emerald-500"
                              : member.percentage >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${member.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground shrink-0">
                        {member.completed}/{member.totalModules}
                      </span>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-black shrink-0 ${
                      member.percentage >= 80
                        ? "text-emerald-400"
                        : member.percentage >= 50
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {member.percentage}%
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* View Module Dialog */}
      <Dialog open={!!viewModule} onOpenChange={() => setViewModule(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewModule && (
            <>
              <DialogHeader>
                <DialogTitle>{viewModule.title}</DialogTitle>
                {viewModule.description && (
                  <DialogDescription>{viewModule.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-4">
                {viewModule.videoUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={viewModule.videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{viewModule.content}</div>
                </div>
              </div>
              <DialogFooter>
                {getModuleProgress(viewModule._id)?.status !== "completed" && (
                  <Button
                    onClick={() => {
                      markComplete(viewModule._id);
                      setViewModule(null);
                    }}
                  >
                    <CheckCircle className="size-4 mr-1" /> Mark Complete
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Module Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Training Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Water Testing 101" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Introduction to water quality testing..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Module content..." rows={6} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                className="rounded"
              />
              Required for all team members
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || !form.content.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
