/* ──── Pricing — Calm, Transparent, Premium ────
   Huge monthly payment as primary focus.
   Simplified hierarchy. Clear decision, NOT negotiation.
   No clutter. No stacked promo feeling.
   ──── */

import { AlertTriangle, Check, ChevronDown, ChevronUp, CreditCard, Gift, Pencil, Tag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { playRevealSound, playTapSound, playToggleSound } from "@/lib/demoSounds";
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
  onPricingChange: (state: PricingState) => void;
  initialState?: PricingState | null;
}

const DEFAULT_DISCOUNTS = [
  { id: "today", label: "Same-Day Decision", amount: 500, icon: "⚡" },
  { id: "referral", label: "Referral Credit", amount: 300, icon: "👥" },
  { id: "military", label: "Military / First Responder", amount: 250, icon: "🎖️" },
  { id: "senior", label: "Senior Discount", amount: 200, icon: "🤝" },
];

function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = currentRef.current;
    if (from === value) return;
    let start = 0;
    const dur = 800;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else currentRef.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span className={className}>${display.toLocaleString()}</span>;
}

const PLACEHOLDER_PROGRAM_PRICE = 12995;
const PLACEHOLDER_REVEAL_PRICE = 9995;
const PLACEHOLDER_MONTHLY = 149;

export function DemoPricing({ company, onNext, onPricingChange, initialState }: Props) {
  const cfg = company?.demoConfig;
  const savedProgramPrice = cfg?.programPrice || PLACEHOLDER_PROGRAM_PRICE;
  const revealPrice = cfg?.revealPrice || PLACEHOLDER_REVEAL_PRICE;
  const systemCostMonthly = cfg?.systemCostMonthly || PLACEHOLDER_MONTHLY;
  const discountOptions = cfg?.discountOptions?.length ? cfg.discountOptions : DEFAULT_DISCOUNTS;
  const companyColor = company?.primaryColor || colors.primary;
  const updateDemoConfig = useMutation(api.dealerShared.updateDemoConfig);
  const { viewMode } = useViewMode();
  const isRepView = viewMode === "rep";

  const [programPrice, setProgramPrice] = useState(initialState?.programPrice ?? savedProgramPrice);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(programPrice.toString());
  const [revealed, setRevealed] = useState(!!initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialState?.discountsApplied ?? []));
  const [monthly, setMonthly] = useState(initialState?.monthlyPayment?.toString() ?? systemCostMonthly.toString());

  const totalDiscount = discountOptions.filter((d: any) => selected.has(d.id)).reduce((sum: number, d: any) => sum + d.amount, 0);
  const maxDiscount = revealPrice * 0.30; // 30% cap
  const safeDiscount = Math.min(totalDiscount, maxDiscount, revealPrice);
  const currentPrice = Math.max(0, revealPrice - safeDiscount);
  const safeMonthly = Math.max(0, parseFloat(monthly) || systemCostMonthly);

  const isUsingPlaceholders = useMemo(() => {
    return !cfg?.programPrice && !cfg?.revealPrice;
  }, [cfg]);

  useEffect(() => {
    onPricingChange({
      programPrice,
      revealedPrice: revealPrice,
      currentPrice,
      discountsApplied: Array.from(selected),
      monthlyPayment: safeMonthly,
    });
  }, [currentPrice, selected, monthly, safeMonthly, onPricingChange, programPrice, revealPrice]);

  const handleReveal = () => { setRevealed(true); playRevealSound(); };
  const toggleDiscount = (id: string) => {
    playToggleSound();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-lg pt-6">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[13px] font-medium tracking-wide uppercase" style={{ color: `${colors.success}90` }}>
          Your Investment
        </p>
        <h2 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight mt-3">
          Whole-Home Protection
        </h2>
        <p className="text-[15px] mt-3" style={{ color: colors.textMuted }}>
          One system. Every tap. Every day.
        </p>
      </div>

      {/* Dealer-only placeholder warning */}
      {isRepView && isUsingPlaceholders && (
        <div className="rounded-2xl p-4 flex items-start gap-3 mb-8" style={{ background: `${colors.warning}10` }}>
          <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: colors.warning }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: colors.warning }}>Using placeholder pricing</p>
            <p className="text-[12px] mt-1" style={{ color: `${colors.warning}80` }}>
              Set your real pricing in Settings → Demo Config.
            </p>
          </div>
        </div>
      )}

      {/* Program price (crossed out) */}
      <div className="text-center mb-8 relative group">
        <p className="text-[12px] font-medium tracking-wide uppercase mb-3" style={{ color: colors.textMuted }}>
          Program Price
        </p>
        {editingPrice ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-[36px] font-bold" style={{ color: colors.textSecondary }}>$</span>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              onBlur={() => {
                const val = parseInt(priceInput) || 0;
                setProgramPrice(val);
                setEditingPrice(false);
                updateDemoConfig({ config: { ...cfg, programPrice: val } }).catch(() => {});
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="w-40 h-14 rounded-xl text-center text-[36px] font-bold text-white outline-none transition-colors"
              style={{ background: colors.surface, border: `1px solid ${colors.borderActive}` }}
            />
          </div>
        ) : (
          <p
            className="text-[36px] font-bold line-through decoration-2 cursor-pointer"
            style={{ color: colors.textFaint, textDecorationColor: `${colors.critical}50` }}
            onClick={() => { setPriceInput(programPrice.toString()); setEditingPrice(true); playTapSound(); }}
          >
            ${programPrice.toLocaleString()}
          </p>
        )}
        {!editingPrice && (
          <button
            onClick={() => { setPriceInput(programPrice.toString()); setEditingPrice(true); playTapSound(); }}
            className="absolute top-0 right-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: colors.textMuted }}
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      {/* Reveal price — the hero moment */}
      <div className="rounded-2xl overflow-hidden relative mb-8" style={{ background: `${colors.success}06` }}>
        {!revealed && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: `${colors.bg}cc`, backdropFilter: "blur(20px)" }}
            onClick={handleReveal}
          >
            <div
              className="rounded-2xl px-8 py-4 flex items-center gap-3 text-white font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${companyColor}, ${colors.success})`, boxShadow: `0 4px 24px ${companyColor}30` }}
            >
              <Gift className="size-5" />
              Reveal Your Price
            </div>
            <p className="text-[13px] mt-4" style={{ color: colors.textMuted }}>Tap to see your exclusive offer</p>
          </div>
        )}
        <div className={`p-8 text-center ${revealed ? "" : "filter blur-lg"} transition-all duration-700`}>
          {/* THE number — huge, dominant */}
          <AnimatedPrice
            value={currentPrice}
            className="text-[48px] sm:text-[56px] font-black tracking-tight"
            // @ts-ignore -- className handles styling
          />
          <p className="text-[13px] mt-2" style={{ color: colors.textMuted }}>
            Installed system investment
          </p>
          {safeDiscount > 0 && programPrice > currentPrice && currentPrice > 0 && (
            <p className="text-[14px] font-medium mt-3" style={{ color: colors.success }}>
              You save ${(programPrice - currentPrice).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Monthly payment — prominent */}
      {revealed && (
        <div className="rounded-2xl p-6 text-center mb-8" style={{ background: colors.surface }}>
          <p className="text-[12px] font-medium tracking-wide uppercase mb-4" style={{ color: colors.textMuted }}>
            Monthly Payment
          </p>
          <div className="flex items-center justify-center">
            <span className="text-[13px] font-medium mr-1" style={{ color: colors.textMuted }}>$</span>
            <input
              type="number"
              inputMode="decimal"
              value={monthly}
              onChange={(e) => { setMonthly(e.target.value); playTapSound(); }}
              className="w-24 text-center text-[42px] font-black text-white outline-none bg-transparent"
            />
            <span className="text-[15px] ml-1" style={{ color: colors.textMuted }}>/mo</span>
          </div>
        </div>
      )}

      {/* Savings options — clean, minimal */}
      {revealed && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="size-4" style={{ color: colors.primary }} />
            <p className="text-[12px] font-medium tracking-wide uppercase" style={{ color: colors.textMuted }}>
              Additional Savings
            </p>
          </div>
          <div className="space-y-2">
            {discountOptions.map((d: any) => {
              const active = selected.has(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDiscount(d.id)}
                  className="w-full flex items-center gap-4 rounded-2xl p-4 transition-all cursor-pointer active:scale-[0.98]"
                  style={{
                    background: active ? `${colors.success}08` : colors.surface,
                    border: `1px solid ${active ? `${colors.success}20` : colors.border}`,
                  }}
                >
                  <span className="text-xl">{d.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-[15px] font-medium" style={{ color: active ? colors.textPrimary : colors.textSecondary }}>
                      {d.label}
                    </p>
                  </div>
                  <span className="text-[15px] font-semibold" style={{ color: active ? colors.success : colors.textMuted }}>
                    -${d.amount}
                  </span>
                  <div
                    className="size-6 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: active ? colors.success : "transparent",
                      border: `2px solid ${active ? colors.success : "rgba(255,255,255,0.12)"}`,
                    }}
                  >
                    {active && <Check className="size-3.5 text-black" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Financing — collapsed by default */}
      {revealed && currentPrice > 0 && <FinancingSection company={company} currentPrice={currentPrice} />}

      {/* Continue */}
      {revealed && (
        <button
          onClick={onNext}
          className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer mb-4"
          style={{
            background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`,
            boxShadow: `0 4px 24px ${companyColor}20`,
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}

/* ──── Financing Breakdown ──── */
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
    <div className="rounded-2xl overflow-hidden mb-8" style={{ background: colors.surface }}>
      <button
        onClick={() => { playTapSound(); setExpanded((e) => !e); }}
        className="w-full flex items-center justify-between p-5 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <CreditCard className="size-4" style={{ color: colors.primary }} />
          <p className="text-[15px] font-medium" style={{ color: colors.textSecondary }}>Financing Options</p>
        </div>
        {expanded
          ? <ChevronUp className="size-4" style={{ color: colors.textMuted }} />
          : <ChevronDown className="size-4" style={{ color: colors.textMuted }} />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5" style={{ borderTop: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between text-[12px] pt-4" style={{ color: colors.textMuted }}>
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
                  <p className="text-[18px] font-bold" style={{ color: active ? colors.primary : colors.textSecondary }}>
                    ${Math.round(mo)}
                  </p>
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
