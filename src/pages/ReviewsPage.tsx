import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Plus,
  Star,
  ThumbsDown,
  ThumbsUp,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

export function ReviewsPage() {
  const reviewRequests = useQuery(api.retention.getReviewRequests) ?? [];
  const testimonials = useQuery(api.retention.getTestimonials, {}) ?? [];
  const createReviewRequest = useMutation(api.retention.createReviewRequest);
  const createTestimonial = useMutation(api.retention.createTestimonial);
  const toggleApproval = useMutation(api.retention.toggleTestimonialApproval);
  const [showRequest, setShowRequest] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [reqForm, setReqForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", delayDays: "3" });
  const [testForm, setTestForm] = useState({ customerName: "", quote: "", rating: "5", source: "google", city: "", state: "" });

  const positive = reviewRequests.filter((r) => r.status === "positive_review").length;
  const negative = reviewRequests.filter((r) => r.status === "negative_feedback").length;
  const pending = reviewRequests.filter((r) => r.status === "pending").length;

  const handleCreateRequest = async () => {
    if (!reqForm.customerName.trim()) return;
    try {
      await createReviewRequest({
        customerName: reqForm.customerName,
        customerEmail: reqForm.customerEmail || undefined,
        customerPhone: reqForm.customerPhone || undefined,
        delayDays: parseInt(reqForm.delayDays) || 3,
      });
      toast.success("Review request scheduled");
      setShowRequest(false);
      setReqForm({ customerName: "", customerEmail: "", customerPhone: "", delayDays: "3" });
    } catch {
      toast.error("Failed to create request");
    }
  };

  const handleCreateTestimonial = async () => {
    if (!testForm.customerName.trim() || !testForm.quote.trim()) return;
    try {
      await createTestimonial({
        customerName: testForm.customerName,
        quote: testForm.quote,
        rating: parseInt(testForm.rating) || 5,
        source: testForm.source,
        city: testForm.city || undefined,
        state: testForm.state || undefined,
      });
      toast.success("Testimonial added");
      setShowTestimonial(false);
      setTestForm({ customerName: "", quote: "", rating: "5", source: "google", city: "", state: "" });
    } catch {
      toast.error("Failed to add testimonial");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Reviews & Testimonials</h1>
          <p className="text-sm text-muted-foreground">Manage review requests and showcase testimonials.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTestimonial(true)}>
            <MessageSquare className="size-4 mr-1" /> Add Testimonial
          </Button>
          <Button onClick={() => setShowRequest(true)}>
            <Plus className="size-4 mr-1" /> Request Review
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: reviewRequests.length, color: "text-white", icon: Star },
          { label: "Positive", value: positive, color: "text-emerald-400", icon: ThumbsUp },
          { label: "Needs Attention", value: negative, color: "text-red-400", icon: ThumbsDown },
          { label: "Pending", value: pending, color: "text-amber-400", icon: Star },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`size-5 mx-auto mb-1 ${s.color}`} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Review Requests</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials ({testimonials.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3 mt-4">
          {reviewRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No review requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Send review requests to happy customers after installation.
                </p>
              </CardContent>
            </Card>
          ) : (
            reviewRequests.map((r) => (
              <Card key={r._id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{r.customerName}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          r.status === "positive_review"
                            ? "text-emerald-400 border-emerald-500/30"
                            : r.status === "negative_feedback"
                              ? "text-red-400 border-red-500/30"
                              : r.status === "sent"
                                ? "text-blue-400 border-blue-500/30"
                                : "text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {r.status?.replace("_", " ")}
                      </Badge>
                      {r.rating && (
                        <span className="flex items-center gap-0.5 text-xs">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {r.customerEmail && <span>{r.customerEmail}</span>}
                      <span>Scheduled: {new Date(r.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    {r.feedback && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{r.feedback}"</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-3 mt-4">
          {testimonials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No testimonials yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {testimonials.map((t) => (
                <Card key={t._id} className="hover:border-white/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-0.5 mb-2">
                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] cursor-pointer ${
                          t.approved
                            ? "text-emerald-400 border-emerald-500/30"
                            : "text-muted-foreground"
                        }`}
                        onClick={async () => {
                          await toggleApproval({ testimonialId: t._id, approved: !t.approved });
                          toast.success(t.approved ? "Unapproved" : "Approved");
                        }}
                      >
                        {t.approved ? "Approved" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="text-sm italic mb-3">"{t.quote}"</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">
                        — {t.customerName}
                        {t.city && `, ${t.city}`}
                        {t.state && ` ${t.state}`}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">{t.source}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Review</DialogTitle>
            <DialogDescription>Send a review request to a customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={reqForm.customerName} onChange={(e) => setReqForm({ ...reqForm, customerName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={reqForm.customerEmail} onChange={(e) => setReqForm({ ...reqForm, customerEmail: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={reqForm.customerPhone} onChange={(e) => setReqForm({ ...reqForm, customerPhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delay (days after today)</Label>
              <Input type="number" value={reqForm.delayDays} onChange={(e) => setReqForm({ ...reqForm, delayDays: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
            <Button onClick={handleCreateRequest} disabled={!reqForm.customerName.trim()}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={showTestimonial} onOpenChange={setShowTestimonial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={testForm.customerName} onChange={(e) => setTestForm({ ...testForm, customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Quote *</Label>
              <Textarea value={testForm.quote} onChange={(e) => setTestForm({ ...testForm, quote: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <Input type="number" min="1" max="5" value={testForm.rating} onChange={(e) => setTestForm({ ...testForm, rating: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={testForm.city} onChange={(e) => setTestForm({ ...testForm, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={testForm.state} onChange={(e) => setTestForm({ ...testForm, state: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestimonial(false)}>Cancel</Button>
            <Button onClick={handleCreateTestimonial} disabled={!testForm.customerName.trim() || !testForm.quote.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
