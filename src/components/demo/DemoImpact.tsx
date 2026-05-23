import { Droplets, Home, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { playTapSound } from "@/lib/demoSounds";

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const IMPACT_TABS = [
  {
    num: "01",
    key: "skin",
    label: "SKIN & HAIR",
    labelColor: "text-cyan-400",
    icon: Sparkles,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    title: "Every shower is stripping your skin.",
    highlight:
      "Chlorine and dissolved minerals remove the natural oils your skin and hair need — every single day.",
    highlightColor: "text-cyan-400",
    body: "Most families blame their shampoo or moisturizer. The real culprit is the water itself. During a 10-minute hot shower, you're exposed to more chlorine than drinking 8 glasses of tap water.",
    without: ["Chlorine steam with every shower", "Dry, irritated skin & brittle hair", "Skin absorbs chemicals through pores"],
    withF: ["Clean, chemical-free steam", "Softer skin & healthier hair", "No airborne disinfectant exposure"],
  },
  {
    num: "02",
    key: "family",
    label: "FAMILY SAFETY",
    labelColor: "text-rose-400",
    icon: ShieldAlert,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10",
    title: "Your family deserves better than \"legal.\"",
    highlight: null,
    highlightColor: "text-rose-400",
    body: `Legal limits haven't been meaningfully updated in over 20 years. Children, pregnant women, and the elderly are most vulnerable to contaminants that are technically "within limits" but far exceed health-protective guidelines.`,
    without: ["Lead impacts developing brains", "Nitrates endanger infants under 6mo", "Contaminants accumulate silently over years"],
    withF: ["Safe water for every age", "Contaminants removed at source", "Long-term health confidence"],
  },
  {
    num: "03",
    key: "home",
    label: "HOME & APPLIANCES",
    labelColor: "text-amber-400",
    icon: Home,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    stat: "40%",
    statLabel: "reduction in appliance\nlifespan from hard water",
    title: "Hard water is silently destroying your home.",
    highlight: null,
    highlightColor: null,
    body: "Scale buildup coats the inside of water heaters, dishwashers, and washing machines — forcing them to work harder, use more energy, and fail sooner. The average homeowner spends $300–$500 more per year on energy and repairs.",
    without: ["Scale buildup in pipes & heaters", "Shorter appliance lifespans", "Higher energy bills every month"],
    withF: ["Clean pipes, no mineral buildup", "Appliances last years longer", "Lower energy costs"],
  },
  {
    num: "04",
    key: "taste",
    label: "TASTE & DRINKING",
    labelColor: "text-cyan-400",
    icon: Droplets,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    stat: "$1,200",
    statLabel: "average family spends\nper year on bottled water",
    title: "Clean water should taste like nothing.",
    highlight: "That metallic taste, chlorine smell, or earthy odor is your water telling you something.",
    highlightColor: "text-cyan-400",
    body: "Chlorine byproducts, minerals, and dissolved organics create the distinctive taste most families simply accept as normal. When it tastes better, families drink more of it.",
    without: ["Chlorine taste & chemical odor", "Buying bottled water constantly", "Unpleasant cooking water"],
    withF: ["Pure, clean taste at every tap", "No more bottled water expense", "Better tasting coffee, tea & food"],
  },
];

export function DemoImpact({ onNext, onBack }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const tab = IMPACT_TABS[activeIdx];
  const Icon = tab.icon;

  return (
    <div className="mx-auto max-w-lg space-y-4 pt-2">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 border border-rose-500/30 rounded-full px-3 py-1">
          HEALTH IMPACT
        </span>
        <h2 className="text-2xl font-black mt-3 leading-tight">
          How Your Water<br />
          <span className="text-rose-400">Affects Your Family</span>
        </h2>
      </div>

      {/* Tab pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {IMPACT_TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => { playTapSound(); setActiveIdx(i); }}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
              i === activeIdx
                ? "bg-white/10 border-white/20 text-white"
                : "border-white/5 text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="text-[10px] font-mono text-gray-600">{t.num}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Label */}
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-gray-600 font-mono">{tab.num}</p>
            <div className="flex items-center gap-1.5">
              <Icon className={`size-4 ${tab.iconColor}`} />
              <p className={`text-[10px] font-bold uppercase tracking-widest ${tab.labelColor}`}>{tab.label}</p>
            </div>
          </div>

          {/* Stat (if present) */}
          {"stat" in tab && tab.stat && (
            <div className="flex items-center gap-3">
              <div className={`size-14 rounded-xl ${tab.iconBg} flex items-center justify-center`}>
                <p className="text-xl font-black">{tab.stat}</p>
              </div>
              <p className="text-xs text-white/50 whitespace-pre-line">{tab.statLabel}</p>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-black leading-snug">{tab.title}</h3>

          {/* Highlight */}
          {tab.highlight && (
            <p className={`text-sm font-semibold leading-relaxed ${tab.highlightColor}`}>{tab.highlight}</p>
          )}

          {/* Body */}
          <p className="text-sm text-white/50 leading-relaxed">{tab.body}</p>

          {/* Without / With filtration */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/70">Without Filtration</p>
              {tab.without.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="size-1.5 rounded-full bg-red-500/60 mt-1.5 shrink-0" />
                  <span className="text-xs text-white/50 leading-snug">{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">With Filtration</p>
              {tab.withF.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-500/60 mt-1.5 shrink-0" />
                  <span className="text-xs text-white/50 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-white/60 cursor-pointer">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-2xl bg-white/10 py-3 text-sm font-bold cursor-pointer"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
