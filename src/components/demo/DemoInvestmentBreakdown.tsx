/* ──── Investment Breakdown (Page 2 of 2) ────
   System showcase → reveal button → retail value, savings, discounts, financing.
   The user should see the VALUE before the price drops.
   ──── */

import { ArrowRight, Check, ChevronDown, ChevronUp, CreditCard, Shield, Tag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { playRevealSound, playTapSound, playToggleSound, haptic } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";
import type { PricingState } from "./DemoPricing";

interface Props {
  company: any;
  pricingState: PricingState | null;
  onPricingChange: (state: PricingState) => void;
  onNext: () => void;
}

const DEFAULT_DISCOUNTS = [
  { id: "today", label: "Same-Day Decision", amount: 500, icon: "⚡" },
  { id: "referral", label: "Referral Credit", amount: 300, icon: "👥" },
  { id: "military", label: "Military / First Responder", amount: 250, icon: "🎖️" },
  { id: "senior", label: "Senior Discount", amount: 200, icon: "🤝" },
];

/* System value props shown before the price reveal */
const SYSTEM_FEATURES = [
  { emoji: "🏠", title: "Whole-Home Protection", desc: "Every faucet, shower, and appliance — filtered 24/7." },
  { emoji: "🔬", title: "Multi-Stage Filtration", desc: "Removes chemicals, sediment, hardness, and contaminants." },
  { emoji: "📱", title: "Smart Monitoring", desc: "Track your water quality and filter life from your phone." },
  { emoji: "🛡️", title: "Lifetime Warranty", desc: "Built to last. Protected for as long as you own it." },
];

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

/* ── Financing calculator ── */
const DEFAULT_TERMS = [60, 84, 120];
const DEFAULT_APR = 4.99;

function calcMonthly(principal: number, apr: number, months: number): number {
  if (apr === 0) return principal / months;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function DemoInvestmentBreakdown({ company, pricingState, onPricingChange, onNext }: Props) {
  const cfg = company?.demoConfig;
  const revealPrice = pricingState?.revealedPrice ?? cfg?.revealPrice ?? 9995;
  const programPrice = pricingState?.programPrice ?? cfg?.programPrice ?? 12995;
  const discountOptions = cfg?.discountOptions?.length ? cfg.discountOptions : DEFAULT_DISCOUNTS;

  const [priceRevealed, setPriceRevealed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(pricingState?.discountsApplied ?? []));
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [showFinancing, setShowFinancing] = useState(false);

  // Financing state
  const financingCfg = cfg?.financing;
  const financingEnabled = financingCfg?.enabled !== false;
  const terms = financingCfg?.terms?.length ? financingCfg.terms : DEFAULT_TERMS;
  const aprRange = financingCfg?.aprRange ?? "0% – 9.99%";
  const defaultApr = financingCfg?.defaultApr ?? DEFAULT_APR;
  const provider = financingCfg?.provider ?? "";
  const [selectedTerm, setSelectedTerm] = useState<number>(terms[0]);
  const [customApr, setCustomApr] = useState(defaultApr.toString());

  // Discount math
  const totalDiscount = discountOptions.filter((d: any) => selected.has(d.id)).reduce((sum: number, d: any) => sum + d.amount, 0);
  const maxDiscount = revealPrice * 0.30;
  const safeDiscount = Math.min(totalDiscount, maxDiscount, revealPrice);
  const currentPrice = Math.max(0, revealPrice - safeDiscount);
  const retailValue = Math.round(programPrice * 1.5);
  const savings = retailValue - currentPrice;

  const animatedTotal = useAnimatedPrice(currentPrice);
  const animatedSavings = useAnimatedPrice(savings);

  // Financing math
  const apr = parseFloat(customApr) || defaultApr;
  const payment = currentPrice > 0 ? Math.max(0, calcMonthly(currentPrice, apr, selectedTerm)) : 0;

  // Sync state up
  useEffect(() => {
    onPricingChange({
      programPrice,
      revealedPrice: revealPrice,
      currentPrice,
      discountsApplied: Array.from(selected),
      monthlyPayment: pricingState?.monthlyPayment ?? 149,
    });
  }, [currentPrice, selected]);

  const toggleDiscount = (id: string) => {
    playToggleSound();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRevealPrice = () => {
    setPriceRevealed(true);
    playRevealSound();
    haptic("heavy");
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.primary}b0` }}>
          YOUR SYSTEM
        </p>
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3" style={{ color: colors.textPrimary }}>
          Investment Breakdown
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          What you're getting — and what it's worth.
        </p>
      </div>

      {/* System showcase — value before price */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* System image */}
        <div className="rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <img
            src="/assets/demo/12_system.webp"
            alt="Whole-home water filtration system"
            className="w-full h-full object-cover rounded-2xl max-h-[280px]"
          />
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3">
          {SYSTEM_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-3 flex flex-col gap-1.5"
              style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <span className="text-xl">{f.emoji}</span>
              <p className="text-[12px] font-bold" style={{ color: colors.textPrimary }}>{f.title}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Price reveal button — show value first */}
      {!priceRevealed && (
        <div className="flex flex-col items-center gap-4 mb-8">
          <p className="text-[14px]" style={{ color: colors.textMuted }}>
            Ready to see your investment?
          </p>
          <button
            onClick={handleRevealPrice}
            className="flex items-center gap-2 rounded-2xl px-10 py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${colors.success}, ${colors.primary})`,
              boxShadow: `0 8px 32px ${colors.success}30`,
            }}
          >
            <Zap className="size-5" />
            Reveal Your Investment
          </button>
        </div>
      )}

      {/* Price breakdown — only after reveal */}
      {priceRevealed && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-4">
          {/* 3-stat summary row */}
          <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: colors.border, border: `1px solid ${colors.border}` }}>
            <div className="p-5 text-center" style={{ background: colors.surface }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
                Total Investment
              </p>
              <p className="text-[24px] font-bold" style={{ color: colors.textPrimary }}>
                ${animatedTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-5 text-center" style={{ background: colors.surface }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
                Retail Value
              </p>
              <p className="text-[24px] font-bold line-through opacity-60" style={{ color: colors.textPrimary }}>
                ${retailValue.toLocaleString()}
              </p>
            </div>
            <div className="p-5 text-center" style={{ background: colors.surface }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
                You Save
              </p>
              <p className="text-[24px] font-bold" style={{ color: colors.success }}>
                ${animatedSavings > 0 ? animatedSavings.toLocaleString() : "0"}
              </p>
            </div>
          </div>

          {/* Adjust Savings — collapsed discounts */}
          <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <button
              onClick={() => { playTapSound(); setShowDiscounts(!showDiscounts); }}
              className="w-full flex items-center justify-between p-4 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Tag className="size-4" style={{ color: colors.primary }} />
                <p className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Adjust Savings</p>
                {selected.size > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${colors.success}15`, color: colors.success }}>
                    {selected.size} applied
                  </span>
                )}
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

          {/* Financing Options */}
          {financingEnabled && currentPrice > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <button
                onClick={() => { playTapSound(); setShowFinancing(!showFinancing); }}
                className="w-full flex items-center justify-between p-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="size-4" style={{ color: colors.primary }} />
                  <p className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Financing Options</p>
                </div>
                {showFinancing
                  ? <ChevronUp className="size-4" style={{ color: colors.textMuted }} />
                  : <ChevronDown className="size-4" style={{ color: colors.textMuted }} />}
              </button>
              {showFinancing && (
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
          )}

          {/* Guarantee */}
          <div className="flex items-center justify-center gap-2 py-4">
            <Shield className="size-4" style={{ color: colors.success }} />
            <span className="text-[13px]" style={{ color: colors.textMuted }}>30-Day Satisfaction Guarantee · Lifetime Warranty</span>
          </div>
        </div>
      )}
    </div>
  );
}
