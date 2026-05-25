export const APP_NAME = "AquaReport";

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceId: string;
  annualPriceId: string;
  reportLimit: number;
  reportLimitLabel: string;
  userLimit: number;
  popular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 199,
    annualPrice: 1990,
    monthlyPriceId: "price_1TaoiDRjbFWooo6zVvZvCt0O",
    annualPriceId: "price_1TaoiDRjbFWooo6zweIi4RaB",
    reportLimit: 20,
    reportLimitLabel: "20 reports/mo",
    userLimit: 2,
    features: [
      "20 reports/mo",
      "2 team members",
      "Branded water quality reports",
      "AquaScore™ grading & scoring",
      "Interactive flipbook sharing",
      "Lead capture & customer log",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 349,
    annualPrice: 3490,
    monthlyPriceId: "price_1TaoiDRjbFWooo6zz7pS6LVU",
    annualPriceId: "price_1TaoiDRjbFWooo6zVSVDD2Vk",
    reportLimit: 50,
    reportLimitLabel: "50 reports/mo",
    userLimit: 5,
    popular: true,
    features: [
      "50 reports/mo",
      "5 team members",
      "Everything in Starter",
      "Demo presentation wizard",
      "In-home live test results",
      "AI homeowner summaries",
      "Lead analytics & insights",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 599,
    annualPrice: 5990,
    monthlyPriceId: "price_1TaoiERjbFWooo6zirYGKSX0",
    annualPriceId: "price_1TaoiERjbFWooo6zBM7F7jlq",
    reportLimit: 150,
    reportLimitLabel: "150+ reports/mo",
    userLimit: 15,
    features: [
      "150+ reports/mo",
      "15 team members",
      "Everything in Growth",
      "White-label branded reports",
      "AI sales talking points",
      "Territory intelligence",
      "Priority support",
    ],
  },
];

// Legacy flat format for components that need it
export const SUBSCRIPTION_PLANS_FLAT = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceId: null,
    reportLimit: 1,
    reportLimitLabel: "1 trial report",
    userLimit: 1,
    features: [
      "1 trial report",
      "1 user",
      "Water quality score",
      "Basic contaminant table",
      "Preview starter features",
    ],
  },
  ...SUBSCRIPTION_PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    price: `$${p.monthlyPrice}/mo`,
    priceId: p.monthlyPriceId,
    reportLimit: p.reportLimit,
    reportLimitLabel: p.reportLimitLabel,
    userLimit: p.userLimit,
    features: p.features,
  })),
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact us",
    priceId: null,
    reportLimit: Number.POSITIVE_INFINITY,
    reportLimitLabel: "Unlimited reports",
    userLimit: Number.POSITIVE_INFINITY,
    features: [
      "Unlimited reports",
      "Onboarding and training",
      "AI sales assistant",
      "CRM integration access",
      "White-labeled reports",
      "Territory intelligence",
      "Custom domains and disclaimers",
      "Priority launch support",
    ],
  },
] as const;
