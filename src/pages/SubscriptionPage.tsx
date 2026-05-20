import { useAction, useMutation, useQuery } from "convex/react";
import { Check, CreditCard, ExternalLink, Gift, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { api } from "../../convex/_generated/api";

export function SubscriptionPage() {
  const subscription = useQuery(api.stripe.getSubscription);
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const createPortal = useAction(api.stripe.createPortalSession);
  const applyPromo = useMutation(api.stripe.applyPromoCode);
  const submitEnterpriseLead = useMutation(api.leads.submitEnterpriseLead);
  const [loading, setLoading] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    message: "",
  });

  const currentPlan = subscription?.plan || "free";
  const isActive = subscription?.status === "active";

  const openCheckout = async (priceId: string, plan: string) => {
    setLoading(plan);
    try {
      const { url } = await createCheckout({ priceId, plan });
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open checkout");
    } finally {
      setLoading("");
    }
  };

  const openPortal = async () => {
    setLoading("portal");
    try {
      const { url } = await createPortal();
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No Stripe billing portal is available yet");
    } finally {
      setLoading("");
    }
  };

  const redeemPromo = async () => {
    if (!promoCode.trim()) return;
    setLoading("promo");
    try {
      await applyPromo({ code: promoCode });
      toast.success("Promo applied. Pro subscription is active for testing.");
      setPromoCode("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Promo code failed");
    } finally {
      setLoading("");
    }
  };

  const submitEnterpriseRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading("enterprise");
    try {
      await submitEnterpriseLead({
        name: enterpriseForm.name,
        companyName: enterpriseForm.companyName || undefined,
        email: enterpriseForm.email,
        phone: enterpriseForm.phone || undefined,
        message: enterpriseForm.message || undefined,
        source: "dashboard_subscription",
      });
      toast.success("Enterprise request saved for admin follow-up.");
      setEnterpriseForm({ name: "", companyName: "", email: "", phone: "", message: "" });
      setEnterpriseOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send enterprise request");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage plan access, billing, and test promo codes.
          </p>
        </div>
        <Badge variant={isActive ? "success" : "secondary"} className="w-fit px-3 py-1.5">
          {isActive ? `${currentPlan.toUpperCase()} active` : currentPlan === "free" ? "1 free report" : subscription?.status || "Inactive"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-blue-500" />
              Current Plan
            </CardTitle>
            <CardDescription>
              {isActive && subscription?.periodEnd
                ? `Renews ${new Date(subscription.periodEnd).toLocaleDateString()}`
                : "Choose a plan to unlock higher limits and premium tools."}
            </CardDescription>
          </div>
          {subscription?.customerId && (
            <Button variant="outline" onClick={openPortal} disabled={loading === "portal"}>
              {loading === "portal" ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
              Manage Billing
            </Button>
          )}
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const selected = currentPlan === plan.id && isActive;
          return (
            <Card key={plan.id} className={selected ? "border-blue-500 shadow-sm" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.reportLimitLabel}</CardDescription>
                  </div>
                  {selected && <Badge variant="success">Active</Badge>}
                </div>
                <p className="text-3xl font-bold">{plan.price}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 text-emerald-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {plan.id === "enterprise" ? (
                  <Dialog open={enterpriseOpen} onOpenChange={setEnterpriseOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <MessageSquare className="size-4" />
                        Contact Us
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Enterprise</DialogTitle>
                        <DialogDescription>
                          Capture an Enterprise inquiry for admin follow-up.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={submitEnterpriseRequest} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="enterprise-name-dashboard">Name</Label>
                            <Input
                              id="enterprise-name-dashboard"
                              required
                              value={enterpriseForm.name}
                              onChange={(event) => setEnterpriseForm((current) => ({ ...current, name: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="enterprise-company-dashboard">Company</Label>
                            <Input
                              id="enterprise-company-dashboard"
                              value={enterpriseForm.companyName}
                              onChange={(event) => setEnterpriseForm((current) => ({ ...current, companyName: event.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="enterprise-email-dashboard">Email</Label>
                            <Input
                              id="enterprise-email-dashboard"
                              required
                              type="email"
                              value={enterpriseForm.email}
                              onChange={(event) => setEnterpriseForm((current) => ({ ...current, email: event.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="enterprise-phone-dashboard">Phone</Label>
                            <Input
                              id="enterprise-phone-dashboard"
                              value={enterpriseForm.phone}
                              onChange={(event) => setEnterpriseForm((current) => ({ ...current, phone: event.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="enterprise-message-dashboard">Notes</Label>
                          <Textarea
                            id="enterprise-message-dashboard"
                            value={enterpriseForm.message}
                            onChange={(event) => setEnterpriseForm((current) => ({ ...current, message: event.target.value }))}
                            placeholder="Team size, territories, integrations, or launch timeline..."
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading === "enterprise"}>
                          {loading === "enterprise" ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
                          Send Request
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    className="w-full"
                    variant={selected ? "outline" : "default"}
                    disabled={selected || loading === plan.id}
                    onClick={() => plan.priceId && openCheckout(plan.priceId, plan.id)}
                  >
                    {loading === plan.id && <Loader2 className="size-4 animate-spin" />}
                    {selected ? "Current Plan" : `Choose ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-5 text-violet-500" />
            Promo Code
          </CardTitle>
          <CardDescription>
            Use test access codes for demos and internal QA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="promo">Code</Label>
              <Input
                id="promo"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
              />
            </div>
            <Button onClick={redeemPromo} disabled={loading === "promo" || !promoCode.trim()}>
              {loading === "promo" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Apply Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
