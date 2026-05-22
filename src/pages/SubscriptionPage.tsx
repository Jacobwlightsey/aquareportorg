import { useAction, useMutation, useQuery } from "convex/react";
import {
  Building2,
  Check,
  CreditCard,
  ExternalLink,
  Gift,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { api } from "../../convex/_generated/api";

/* ---- card gradients keyed by plan id ---- */
const gradients: Record<string, string> = {
  starter: "from-slate-800/30 to-slate-900/10",
  growth: "from-violet-900/30 to-indigo-900/10",
  pro: "from-amber-900/30 to-orange-900/10",
};
const accentBorders: Record<string, string> = {
  starter: "border-white/10 hover:border-white/20",
  growth: "border-2 border-violet-500/40 shadow-lg shadow-violet-500/10",
  pro: "border-white/10 hover:border-white/20",
};
const iconBoxes: Record<string, string> = {
  starter: "rounded-lg bg-blue-500/20 p-2 text-blue-400",
  growth: "rounded-lg bg-violet-500/20 p-2 text-violet-400",
  pro: "rounded-lg bg-amber-500/20 p-2 text-amber-400",
};
const checkColors: Record<string, string> = {
  starter: "text-blue-400",
  growth: "text-violet-400",
  pro: "text-amber-400",
};

function savingsPercent(monthly: number, annual: number) {
  return Math.round((monthly * 12 - annual) / (monthly * 12) * 100);
}

export function SubscriptionPage() {
  const subscription = useQuery(api.stripe.getSubscription);
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const createPortal = useAction(api.stripe.createPortalSession);
  const applyPromo = useMutation(api.stripe.applyPromoCode);
  const submitEnterprise = useMutation(api.leads.submitEnterpriseLead);

  const [loading, setLoading] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [promoCode, setPromoCode] = useState("");
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [enterprise, setEnterprise] = useState({
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
      toast.error(
        error instanceof Error ? error.message : "No Stripe billing portal is available yet"
      );
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

  const handleEnterprise = async (e: FormEvent) => {
    e.preventDefault();
    setLoading("enterprise");
    try {
      await submitEnterprise({
        name: enterprise.name,
        companyName: enterprise.companyName || undefined,
        email: enterprise.email,
        phone: enterprise.phone || undefined,
        message: enterprise.message || undefined,
        source: "dashboard_subscription",
      });
      toast.success("Enterprise request saved for admin follow-up.");
      setEnterprise({ name: "", companyName: "", email: "", phone: "", message: "" });
      setEnterpriseOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send enterprise request");
    } finally {
      setLoading("");
    }
  };

  const maxSavings = Math.max(
    ...SUBSCRIPTION_PLANS.map((p) => savingsPercent(p.monthlyPrice, p.annualPrice))
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Choose the plan that fits your team. Start with 1 free report, then upgrade to unlock
            everything.
          </p>
        </div>
        <Badge variant={isActive ? "success" : "secondary"} className="w-fit px-3 py-1.5">
          {isActive ? `${currentPlan.toUpperCase()} active` : "1 free report included"}
        </Badge>
      </div>

      {/* Current plan card */}
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
                : "You have 1 free premium report. Upgrade anytime to unlock unlimited features."}
            </CardDescription>
          </div>
          {subscription?.customerId && (
            <Button variant="outline" onClick={openPortal} disabled={loading === "portal"}>
              {loading === "portal" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Manage Billing
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Free report banner */}
      {!isActive && (
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-cyan-500/20 p-2.5">
              <Gift className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Your first report is on us</p>
              <p className="text-sm text-white/60">
                Create 1 premium water quality report with full Pro features — branded, scored, and
                shareable. No credit card needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly/Annual Toggle */}
      <div className="flex items-center justify-center gap-1">
        <div className="inline-flex items-center rounded-full bg-slate-900 border border-white/10 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white text-slate-900 shadow-md"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              billingCycle === "annual"
                ? "bg-white text-slate-900 shadow-md"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Annual
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
              Save up to {maxSavings}%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id && isActive;
          const displayPrice =
            billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const priceId =
            billingCycle === "monthly" ? plan.monthlyPriceId : plan.annualPriceId;
          const savings = savingsPercent(plan.monthlyPrice, plan.annualPrice);
          const effectiveMonthly = Math.round(plan.annualPrice / 12);

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all ${
                plan.popular && !isCurrent
                  ? accentBorders[plan.id]
                  : isCurrent
                    ? "border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                    : "border border-white/10 hover:border-white/20"
              }`}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradients[plan.id]} opacity-50 pointer-events-none`}
              />

              {/* Popular ribbon */}
              {plan.popular && !isCurrent && (
                <div className="absolute -right-8 top-4 rotate-45 bg-violet-500 px-10 py-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    Popular
                  </span>
                </div>
              )}

              <CardHeader className="relative pb-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={iconBoxes[plan.id]}>
                    {plan.id === "starter" ? (
                      <Sparkles className="size-4" />
                    ) : plan.id === "growth" ? (
                      <Building2 className="size-4" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge variant="success" className="ml-auto">
                      Active
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {plan.reportLimitLabel} · {plan.userLimit} user
                  {plan.userLimit > 1 ? "s" : ""}
                </CardDescription>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight">
                      ${(displayPrice ?? 0).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  {billingCycle === "annual" && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        ${(plan.monthlyPrice * 12).toLocaleString()}/yr
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                        <TrendingDown className="size-3" />
                        Save {savings}%
                      </span>
                    </div>
                  )}
                  {billingCycle === "annual" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      That's just ${effectiveMonthly}/mo
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={`mt-0.5 size-4 shrink-0 ${checkColors[plan.id]}`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className={`w-full ${plan.popular && !isCurrent ? "bg-violet-500 hover:bg-violet-600 text-white" : ""}`}
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || loading === plan.id}
                  onClick={() => openCheckout(priceId, plan.id)}
                >
                  {loading === plan.id && <Loader2 className="size-4 animate-spin" />}
                  {isCurrent ? "Current Plan" : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enterprise */}
      <Card className="border-dashed border-white/15">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-blue-400" />
              Enterprise
            </CardTitle>
            <CardDescription>
              Unlimited reports, custom domains, onboarding, and dedicated support. Let's talk.
            </CardDescription>
          </div>
          <Dialog open={enterpriseOpen} onOpenChange={setEnterpriseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
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
              <form onSubmit={handleEnterprise} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="enterprise-name-dashboard">Name</Label>
                    <Input
                      id="enterprise-name-dashboard"
                      required
                      value={enterprise.name}
                      onChange={(e) => setEnterprise((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enterprise-company-dashboard">Company</Label>
                    <Input
                      id="enterprise-company-dashboard"
                      value={enterprise.companyName}
                      onChange={(e) =>
                        setEnterprise((p) => ({ ...p, companyName: e.target.value }))
                      }
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
                      value={enterprise.email}
                      onChange={(e) => setEnterprise((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enterprise-phone-dashboard">Phone</Label>
                    <Input
                      id="enterprise-phone-dashboard"
                      value={enterprise.phone}
                      onChange={(e) => setEnterprise((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enterprise-message-dashboard">Notes</Label>
                  <Textarea
                    id="enterprise-message-dashboard"
                    value={enterprise.message}
                    onChange={(e) => setEnterprise((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Team size, territories, integrations, or launch timeline..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading === "enterprise"}>
                  {loading === "enterprise" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MessageSquare className="size-4" />
                  )}
                  Send Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Promo Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-5 text-violet-500" />
            Promo Code
          </CardTitle>
          <CardDescription>Use test access codes for demos and internal QA.</CardDescription>
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
              {loading === "promo" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Apply Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
