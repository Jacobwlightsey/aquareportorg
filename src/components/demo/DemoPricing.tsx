/* ──── Pricing — Mockup-faithful layout ────
   $149/mo is the HERO number. No reveal gate.
   2-column: price left, features checklist right.
   3-stat summary row. Footer: Back / Guarantee / CTA.
   Discounts collapsed into "Adjust Savings" section.
   ──── */

import { AlertTriangle, Check, ChevronDown, ChevronUp, CreditCard, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { playTapSound, playToggleSound } from "@/lib/demoSounds";
import { useViewMode } from "@/hooks/useViewMode";
import { colors } from "@/lib/designTokens";

export interface PricingState {
  programPrice: number;
  revealedPrice: number;
  currentPrice: number;
  discountsApplied: string[];
  monthlyPayment: number;
}

interface Props {
  company: any;
  onNext: () => void;
  onBack: () => void;
  onPricingChange: (state: PricingState) => void;
  initialState?: PricingState | null;
}

const DEFAULT_DISCOUNTS = [
  { id: "today", label: "Same-Day Decision", amount: 500, icon: "⚡" },
  { id: "referral", label: "Referral Credit", amount: 300, icon: "👥" },
  { id: "military", label: "Military / First Responder", amount: 250, icon: "🎖️" },
  { id: "senior", label: "Senior Discount", amount: 200, icon: "🤝" },
];

const FEATURES = [
  "Installed Whole Home System",
  "Professional Installation",
  "Premium Components",
  "Lifetime Warranty",
  "Ongoing Support",
];

const PLACEHOLDER_PROGRAM_PRICE = 12995;
const PLACEHOLDER_REVEAL_PRICE = 9995;
const PLACEHOLDER_MONTHLY = 149;

/* ── Animated price counter ── */
function useAnimatedPrice(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  useEffect(() => {
    const from = display;
    if (from === target) return;
    let start = 0;
    let raf = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}

export function DemoPricing({ company, onNext, onBack, onPricingChange, initialState }: Props) {
  const cfg = company?.demoConfig;
  const savedProgramPrice = cfg?.programPrice || PLACEHOLDER_PROGRAM_PRICE;
  const revealPrice = cfg?.revealPrice || PLACEHOLDER_REVEAL_PRICE;
  const systemCostMonthly = cfg?.systemCostMonthly || PLACEHOLDER_MONTHLY;
  const discountOptions = cfg?.discountOptions?.length ? cfg.discountOptions : DEFAULT_DISCOUNTS;
  const { viewMode } = useViewMode();
  const isRepView = viewMode === "rep";

  const [programPrice] = useState(initialState?.programPrice ?? savedProgramPrice);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialState?.discountsApplied ?? []));
  const [showDiscounts, setShowDiscounts] = useState(false);

  const totalDiscount = discountOptions.filter((d: any) => selected.has(d.id)).reduce((sum: number, d: any) => sum + d.amount, 0);
  const maxDiscount = revealPrice * 0.30;
  const safeDiscount = Math.min(totalDiscount, maxDiscount, revealPrice);
  const currentPrice = Math.max(0, revealPrice - safeDiscount);
  const safeMonthly = systemCostMonthly;
  const retailValue = Math.round(programPrice * 1.5);
  const savings = retailValue - currentPrice;

  const animatedTotal = useAnimatedPrice(currentPrice);
  const animatedSavings = useAnimatedPrice(savings);

  const isUsingPlaceholders = useMemo(() => !cfg?.programPrice && !cfg?.revealPrice, [cfg]);

  useEffect(() => {
    onPricingChange({
      programPrice,
      revealedPrice: revealPrice,
      currentPrice,
      discountsApplied: Array.from(selected),
      monthlyPayment: safeMonthly,
    });
  }, [currentPrice, selected, safeMonthly, onPricingChange, programPrice, revealPrice]);

  const toggleDiscount = (id: string) => {
    playToggleSound();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* Dealer placeholder warning */}
      {isRepView && isUsingPlaceholders && (
        <div className="rounded-2xl p-4 flex items-start gap-3 mb-6" style={{ background: `${colors.warning}10`, border: `1px solid ${colors.warning}18` }}>
          <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: colors.warning }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: colors.warning }}>Using placeholder pricing</p>
            <p className="text-[12px] mt-1" style={{ color: `${colors.warning}80` }}>Set your real pricing in Settings → Demo Config.</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="mb-2">
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight" style={{ color: colors.textPrimary }}>
          Your Investment in
        </h2>
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight" style={{ color: colors.success }}>
          Better Water
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Simple pricing. No surprises.
        </p>
      </div>

      {/* 2-column: price left, features right */}
      <div className="flex gap-12 items-start mt-8 mb-10">
        {/* Left: hero monthly price */}
        <div className="flex-1">
          <div className="flex items-baseline">
            <span className="text-[56px] font-black leading-none tracking-tight" style={{ color: colors.textPrimary }}>
              ${safeMonthly}
            </span>
            <span className="text-[20px] font-medium ml-1" style={{ color: colors.textMuted }}>/mo</span>
          </div>
          <p className="text-[14px] mt-3" style={{ color: colors.textMuted }}>
            As low as ${safeMonthly}/month with approved financing
          </p>
        </div>

        {/* Right: features checklist */}
        <div className="w-64 shrink-0 space-y-4 pt-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="size-5 shrink-0 rounded-full flex items-center justify-center" style={{ background: `${colors.success}15` }}>
                <Check className="size-3" style={{ color: colors.success }} strokeWidth={2.5} />
              </div>
              <span className="text-[14px]" style={{ color: colors.textSecondary }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3-stat summary row */}
      <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden mb-6" style={{ background: colors.border, border: `1px solid ${colors.border}` }}>
        <div className="p-5 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
            Total Investment
          </p>
          <p className="text-[24px] font-bold" style={{ color: colors.textPrimary }}>
            ${animatedTotal.toLocaleString()}
          </p>
        </div>
        <div className="p-5 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
            Retail Value
          </p>
          <p className="text-[24px] font-bold" style={{ color: colors.textPrimary }}>
            ${retailValue.toLocaleString()}
          </p>
        </div>
        <div className="p-5 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
            You Save
          </p>
          <p className="text-[24px] font-bold" style={{ color: colors.success }}>
            ${animatedSavings > 0 ? animatedSavings.toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* Adjust Savings — collapsed discounts */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <button
          onClick={() => { playTapSound(); setShowDiscounts(!showDiscounts); }}
          className="w-full flex items-center justify-between p-4 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Tag className="size-4" style={{ color: colors.primary }} />
            <p className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Adjust Savings</p>
          </div>
          {showDiscounts
            ? <ChevronUp className="size-4" style={{ color: colors.textMuted }} />
            : <ChevronDown className="size-4" style={{ color: colors.textMuted }} />
          }
        </button>
        {showDiscounts && (
          <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${colors.border}` }}>
            <div className="pt-3" />
            {discountOptions.map((d: any) => {
              const active = selected.has(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDiscount(d.id)}
                  className="w-full flex items-center gap-3 rounded-xl p-3 transition-all cursor-pointer active:scale-[0.98]"
                  style={{
                    background: active ? `${colors.success}08` : "transparent",
                    border: `1px solid ${active ? `${colors.success}20` : colors.border}`,
                  }}
                >
                  <span className="text-lg">{d.icon}</span>
                  <span className="flex-1 text-left text-[14px] font-medium" style={{ color: active ? colors.textPrimary : colors.textSecondary }}>
                    {d.label}
                  </span>
                  <span className="text-[14px] font-semibold" style={{ color: active ? colors.success : colors.textMuted }}>
                    -${d.amount}
                  </span>
                  <div
                    className="size-5 rounded-full flex items-center justify-center"
                    style={{
                      background: active ? colors.success : "transparent",
                      border: `2px solid ${active ? colors.success : "rgba(255,255,255,0.12)"}`,
                    }}
                  >
                    {active && <Check className="size-3 text-black" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Financing — collapsed */}
      <FinancingSection company={company} currentPrice={currentPrice} />

      {/* Footer: Back / Guarantee / CTA */}
      <div className="flex items-center justify-between py-4 mt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[14px] font-medium cursor-pointer"
          style={{ color: colors.textMuted }}
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <Check className="size-4" style={{ color: colors.success }} />
          <span className="text-[13px]" style={{ color: colors.textMuted }}>30-Day Satisfaction Guarantee</span>
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl px-8 py-3 text-[15px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${colors.critical}, #e11d48)`,
            boxShadow: `0 4px 16px ${colors.critical}30`,
          }}
        >
          Let's Get Started
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

/* ──── Financing Section ──── */
const DEFAULT_TERMS = [60, 84, 120];
const DEFAULT_APR = 4.99;

function calcMonthly(principal: number, apr: number, months: number): number {
  if (apr === 0) return principal / months;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function FinancingSection({ company, currentPrice }: { company: any; currentPrice: number }) {
  const cfg = (company as any)?.demoConfig?.financing;
  const enabled = cfg?.enabled !== false;
  const terms = cfg?.terms?.length ? cfg.terms : DEFAULT_TERMS;
  const aprRange = cfg?.aprRange ?? "0% – 9.99%";
  const defaultApr = cfg?.defaultApr ?? DEFAULT_APR;
  const provider = cfg?.provider ?? "";

  const [expanded, setExpanded] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<number>(terms[0]);
  const [customApr, setCustomApr] = useState(defaultApr.toString());

  if (!enabled || currentPrice <= 0 || !Number.isFinite(currentPrice)) return null;

  const apr = parseFloat(customApr) || defaultApr;
  const payment = Math.max(0, calcMonthly(currentPrice, apr, selectedTerm));

  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <button
        onClick={() => { playTapSound(); setExpanded((e) => !e); }}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <CreditCard className="size-4" style={{ color: colors.primary }} />
          <p className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Financing Options</p>
        </div>
        {expanded
          ? <ChevronUp className="size-4" style={{ color: colors.textMuted }} />
          : <ChevronDown className="size-4" style={{ color: colors.textMuted }} />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between text-[12px] pt-3" style={{ color: colors.textMuted }}>
            <span>APR Range: <span className="font-medium" style={{ color: colors.textSecondary }}>{aprRange}</span></span>
            {provider && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${colors.primary}10` }}>via {provider}</span>}
          </div>
          <div className="flex gap-2">
            {terms.map((t: number) => {
              const mo = calcMonthly(currentPrice, apr, t);
              const active = selectedTerm === t;
              return (
                <button
                  key={t}
                  onClick={() => { playTapSound(); setSelectedTerm(t); }}
                  className="flex-1 rounded-xl p-3 text-center transition-all cursor-pointer"
                  style={{
                    background: active ? `${colors.primary}12` : "transparent",
                    border: `1px solid ${active ? `${colors.primary}30` : colors.border}`,
                  }}
                >
                  <p className="text-[18px] font-bold" style={{ color: active ? colors.primary : colors.textSecondary }}>${Math.round(mo)}</p>
                  <p className="text-[11px]" style={{ color: colors.textMuted }}>/month</p>
                  <p className="text-[10px] mt-1" style={{ color: colors.textFaint }}>{t} months</p>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: `${colors.primary}08` }}>
            <p className="text-[28px] font-bold" style={{ color: colors.primary }}>
              ${payment.toFixed(2)}<span className="text-[14px] font-normal" style={{ color: colors.textMuted }}>/mo</span>
            </p>
            <p className="text-[12px] mt-1" style={{ color: colors.textMuted }}>
              {selectedTerm} months at {apr}% APR · Total: ${(payment * selectedTerm).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px]" style={{ color: colors.textMuted }}>Adjust APR:</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={customApr}
              onChange={(e) => setCustomApr(e.target.value)}
              className="w-20 rounded-lg px-2 py-1.5 text-[14px] text-center text-white outline-none"
              style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}
            />
            <span className="text-[12px]" style={{ color: colors.textFaint }}>%</span>
          </div>
        </div>
      )}
    </div>
  );
}
