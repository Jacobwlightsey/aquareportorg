import { Calculator, Check, ChevronDown, ChevronUp, CreditCard, Gift, Pencil, Sparkles, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { playRevealSound, playTapSound, playToggleSound } from "@/lib/demoSounds";

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

/* Animated dollar value */
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

export function DemoPricing({ company, onNext, onPricingChange, initialState }: Props) {
  const cfg = company?.demoConfig;
  const savedProgramPrice = cfg?.programPrice ?? 0;
  const revealPrice = cfg?.revealPrice ?? 0;
  const systemCostMonthly = cfg?.systemCostMonthly ?? 0;
  const discountOptions = cfg?.discountOptions?.length ? cfg.discountOptions : DEFAULT_DISCOUNTS;
  const color = company?.primaryColor || "#2563eb";
  const updateDemoConfig = useMutation(api.dealerShared.updateDemoConfig);

  const [programPrice, setProgramPrice] = useState(initialState?.programPrice ?? savedProgramPrice);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(programPrice.toString());
  const [revealed, setRevealed] = useState(!!initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialState?.discountsApplied ?? []));
  const [monthly, setMonthly] = useState(initialState?.monthlyPayment?.toString() ?? systemCostMonthly.toString());

  const totalDiscount = discountOptions.filter((d: any) => selected.has(d.id)).reduce((sum: number, d: any) => sum + d.amount, 0);
  const currentPrice = revealPrice - totalDiscount;

  useEffect(() => {
    onPricingChange({
      programPrice,
      revealedPrice: revealPrice,
      currentPrice,
      discountsApplied: Array.from(selected),
      monthlyPayment: parseFloat(monthly) || systemCostMonthly,
    });
  }, [currentPrice, selected, monthly]);

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
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1">
          INVESTMENT
        </span>
        <h2 className="text-2xl font-black mt-3">Your Investment</h2>
        <p className="text-sm text-white/50 mt-1">Protection for your entire home</p>
      </div>

      {/* Program price (crossed out) — editable inline */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center relative group">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Program Price</p>
        {editingPrice ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-black text-white/80">$</span>
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
                // Persist to demoConfig so it's saved for future demos
                updateDemoConfig({ config: { ...cfg, programPrice: val } }).catch(() => {});
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-40 h-14 rounded-xl bg-white/[0.06] border border-white/20 text-center text-4xl font-black text-white outline-none focus:border-white/40 transition-colors"
            />
          </div>
        ) : (
          <p
            className="text-4xl font-black text-white/80 line-through decoration-red-400/60 decoration-2 cursor-pointer"
            onClick={() => { setPriceInput(programPrice.toString()); setEditingPrice(true); playTapSound(); }}
          >
            ${programPrice.toLocaleString()}
          </p>
        )}
        {!editingPrice && (
          <button
            onClick={() => { setPriceInput(programPrice.toString()); setEditingPrice(true); playTapSound(); }}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/30 hover:text-white/60 hover:bg-white/[0.1] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>

      {/* Reveal price card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden relative">
        {!revealed && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-xl bg-black/40 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={handleReveal}
          >
            <div
              className="rounded-2xl px-8 py-4 flex items-center gap-3 text-white font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${color}, #10b981)`, boxShadow: `0 4px 24px ${color}40` }}
            >
              <Gift className="size-5" />
              Reveal Your Price
            </div>
            <p className="text-xs text-white/40 mt-3">Tap to see your exclusive offer</p>
          </div>
        )}
        <div className={`p-6 text-center ${revealed ? "" : "filter blur-lg"} transition-all duration-700`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-2">Your Exclusive Price</p>
          <AnimatedPrice value={currentPrice} className="text-5xl font-black text-emerald-400" />
          {totalDiscount > 0 && (
            <p className="text-sm text-emerald-400/70 mt-2 font-semibold">
              You save ${(programPrice - currentPrice).toLocaleString()}!
            </p>
          )}
        </div>
      </div>

      {/* Savings badge */}
      {revealed && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 animate-in fade-in duration-500">
          <Sparkles className="size-4 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400">
            Save ${(programPrice - currentPrice).toLocaleString()} off program price
          </span>
        </div>
      )}

      {/* Discount toggles */}
      {revealed && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Tag className="size-4 text-pink-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Additional Savings</p>
          </div>
          <div className="p-3 space-y-2">
            {discountOptions.map((d: any) => {
              const active = selected.has(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDiscount(d.id)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3.5 border transition-all cursor-pointer active:scale-[0.98] ${
                    active ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-lg">{d.icon}</span>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${active ? "text-emerald-400" : "text-white/70"}`}>{d.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${active ? "text-emerald-400" : "text-white/40"}`}>
                      -${d.amount}
                    </span>
                    <div
                      className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        active ? "border-emerald-400 bg-emerald-400" : "border-white/20"
                      }`}
                    >
                      {active && <Check className="size-3 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly payment */}
      {revealed && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="size-4 text-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Monthly Payment</p>
          </div>
          <p className="text-xs text-white/40 mb-3">Enter the customer's average monthly cost for the system</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-white/30">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={monthly}
              onChange={(e) => { setMonthly(e.target.value); playTapSound(); }}
              className="w-full h-14 rounded-xl bg-white/[0.06] border border-white/10 pl-9 pr-16 text-2xl font-black text-white outline-none focus:border-white/30 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/30">/month</span>
          </div>
        </div>
      )}

      {/* ──── Sprint 2D: Financing Breakdown ──── */}
      {revealed && <FinancingSection company={company} currentPrice={currentPrice} />}

      {/* Continue */}
      {revealed && (
        <button
          onClick={onNext}
          className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${color}, #06b6d4)`, boxShadow: `0 4px 24px ${color}30` }}
        >
          Continue →
        </button>
      )}
    </div>
  );
}

/* ──── Sprint 2D: Financing Breakdown (embedded) ──── */
const DEFAULT_TERMS = [60, 84, 120];
const DEFAULT_APR = 4.99;

function calcMonthly(principal: number, apr: number, months: number): number {
  if (apr === 0) return principal / months;
  const r = apr / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function FinancingSection({ company, currentPrice }: { company: any; currentPrice: number }) {
  const cfg = (company as any)?.demoConfig?.financing;
  const enabled = cfg?.enabled !== false; // default to true if not explicitly disabled
  const terms = cfg?.terms?.length ? cfg.terms : DEFAULT_TERMS;
  const aprRange = cfg?.aprRange ?? "0% – 9.99%";
  const defaultApr = cfg?.defaultApr ?? DEFAULT_APR;
  const provider = cfg?.provider ?? "";

  const [expanded, setExpanded] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<number>(terms[0]);
  const [customApr, setCustomApr] = useState(defaultApr.toString());

  if (!enabled) return null;

  const apr = parseFloat(customApr) || defaultApr;
  const payment = calcMonthly(currentPrice, apr, selectedTerm);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
      <button
        onClick={() => {
          playTapSound();
          setExpanded((e) => !e);
        }}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-violet-400" />
          <p className="text-sm font-bold text-white/70">Financing Options</p>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-white/40" />
        ) : (
          <ChevronDown className="size-4 text-white/40" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
          {/* APR range banner */}
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>APR Range: <span className="text-white/60 font-medium">{aprRange}</span></span>
            {provider && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">via {provider}</span>}
          </div>

          {/* Term cards */}
          <div className="flex gap-2">
            {terms.map((t: number) => {
              const mo = calcMonthly(currentPrice, apr, t);
              const active = selectedTerm === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    playTapSound();
                    setSelectedTerm(t);
                  }}
                  className={`flex-1 rounded-xl border p-3 text-center transition-all cursor-pointer ${
                    active
                      ? "border-violet-400/40 bg-violet-400/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <p className={`text-lg font-black ${active ? "text-violet-400" : "text-white/60"}`}>
                    ${Math.round(mo)}
                  </p>
                  <p className="text-[10px] text-white/40">/month</p>
                  <p className="text-[9px] text-white/30 mt-1">{t} months</p>
                </button>
              );
            })}
          </div>

          {/* Selected term detail */}
          <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
            <p className="text-2xl font-black text-violet-400">${payment.toFixed(2)}<span className="text-sm text-white/40 font-normal">/mo</span></p>
            <p className="text-xs text-white/40 mt-1">
              {selectedTerm} months at {apr}% APR · Total: ${(payment * selectedTerm).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Custom APR input */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 shrink-0">Adjust APR:</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={customApr}
              onChange={(e) => setCustomApr(e.target.value)}
              className="w-20 rounded-lg bg-white/[0.06] border border-white/10 px-2 py-1.5 text-sm text-center text-white outline-none focus:border-white/30"
            />
            <span className="text-xs text-white/30">%</span>
          </div>
        </div>
      )}
    </div>
  );
}
