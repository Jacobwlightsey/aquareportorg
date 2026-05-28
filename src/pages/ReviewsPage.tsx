import { useMutation, useQuery } from "convex/react";
import {
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";
import { getCountryText } from "@/lib/i18n";

export function ReviewsPage() {
  const company = useQuery(api.companies.getMyCompany);
  const t = getCountryText(company?.country);
  const reviewRequests = useQuery(api.retention.getReviewRequests) ?? [];
  const testimonials = useQuery(api.retention.getTestimonials, {}) ?? [];
  const createReviewRequest = useMutation(api.retention.createReviewRequest);
  const createTestimonial = useMutation(api.retention.createTestimonial);
  const toggleApproval = useMutation(api.retention.toggleTestimonialApproval);
  const [showRequest, setShowRequest] = useState(false);
  const [showTestimonial, setShowTestimonial] = useState(false);
  const [reqForm, setReqForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    delayDays: "3",
  });
  const [testForm, setTestForm] = useState({
    customerName: "",
    quote: "",
    rating: "5",
    source: "google",
    city: "",
    state: "",
  });

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
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title="Reviews & Testimonials"
        subtitle="Manage review requests and showcase testimonials."
        icon={Star}
        iconColor="text-amber-400"
        actions={
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setShowTestimonial(true)}
            >
              <MessageSquare className="size-3.5 mr-1" /> Add Quote
            </Button>
            <Button size="sm" onClick={() => setShowRequest(true)}>
              <Plus className="size-4 mr-1" /> Request Review
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={reviewRequests.length} color="text-foreground" icon={Star} />
        <StatCard label="Positive" value={positive} color="text-emerald-400" icon={ThumbsUp} />
        <StatCard label="Needs Attention" value={negative} color="text-red-400" icon={ThumbsDown} />
        <StatCard label="Pending" value={pending} color="text-amber-400" icon={Star} />
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="requests" className="text-xs sm:text-sm">
            Requests
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="text-xs sm:text-sm">
            Testimonials ({testimonials.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-2">
          {reviewRequests.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No review requests yet"
              description="Send review requests to happy customers after installation."
              actionLabel="Request Review"
              onAction={() => setShowRequest(true)}
            />
          ) : (
            reviewRequests.map((r) => (
              <Card key={r._id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{r.customerName}</p>
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
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star
                                key={i}
                                className="size-3 fill-amber-400 text-amber-400"
                              />
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        {r.customerEmail && <span>{r.customerEmail}</span>}
                        <span>
                          {new Date(r.scheduledAt).toLocaleDateString()}
                        </span>
                      </div>
                      {r.feedback && (
                        <p className="text-[11px] text-muted-foreground/70 mt-1 italic">
                          "{r.feedback}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-2">
          {testimonials.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No testimonials yet"
              description="Add customer testimonials to showcase on your website."
              actionLabel="Add Testimonial"
              onAction={() => setShowTestimonial(true)}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {testimonials.map((t) => (
                <Card
                  key={t._id}
                  className="hover:border-border transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="size-3 fill-amber-400 text-amber-400"
                          />
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
                          await toggleApproval({
                            testimonialId: t._id,
                            approved: !t.approved,
                          });
                          toast.success(t.approved ? "Hidden" : "Approved");
                        }}
                      >
                        {t.approved ? "Approved" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="text-sm italic leading-relaxed mb-3">
                      "{t.quote}"
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">
                        — {t.customerName}
                        {t.city && `, ${t.city}`}
                        {t.state && ` ${t.state}`}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {t.source}
                      </Badge>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request a Review</DialogTitle>
            <DialogDescription>
              Send a review request to a customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={reqForm.customerName}
                onChange={(e) => setReqForm({ ...reqForm, customerName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={reqForm.customerEmail}
                  onChange={(e) => setReqForm({ ...reqForm, customerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={reqForm.customerPhone}
                  onChange={(e) => setReqForm({ ...reqForm, customerPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delay (days)</Label>
              <Input
                type="number"
                value={reqForm.delayDays}
                onChange={(e) => setReqForm({ ...reqForm, delayDays: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequest(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={!reqForm.customerName.trim()}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={showTestimonial} onOpenChange={setShowTestimonial}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Testimonial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={testForm.customerName}
                onChange={(e) => setTestForm({ ...testForm, customerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quote *</Label>
              <Textarea
                value={testForm.quote}
                onChange={(e) => setTestForm({ ...testForm, quote: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Rating</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={testForm.rating}
                  onChange={(e) => setTestForm({ ...testForm, rating: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.cityLabel}</Label>
                <Input
                  value={testForm.city}
                  onChange={(e) => setTestForm({ ...testForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.stateLabel}</Label>
                <Input
                  value={testForm.state}
                  onChange={(e) => setTestForm({ ...testForm, state: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestimonial(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTestimonial}
              disabled={!testForm.customerName.trim() || !testForm.quote.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
