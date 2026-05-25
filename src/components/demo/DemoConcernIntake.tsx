/* ──── Sprint 2A: Customer Concern Intake — pre-demo questionnaire ──── */

import { ArrowRight, Check, Droplets, Heart, Minus, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";

export interface ConcernData {
  /** Selected concern keys */
  concerns: string[];
  /** Free-text for "Other" concern */
  otherText: string;
  /** Household info */
  householdSize: number;
  bathrooms: number;
  hasKids: boolean;
  hasPets: boolean;
  /** Current water solution */
  currentSolution: string;
}

interface Props {
  onNext: (data: ConcernData) => void;
  onBack: () => void;
  initial?: ConcernData | null;
}

const CONCERN_OPTIONS = [
  { key: "taste_smell", label: "Taste / Smell", icon: "💧", color: "#3b82f6" },
  { key: "health_safety", label: "Health / Family Safety", icon: "❤️", color: "#ef4444" },
  { key: "staining", label: "Staining / Hard Water", icon: "🟤", color: "#92400e" },
  { key: "skin_hair", label: "Dry Skin / Hair", icon: "🧴", color: "#ec4899" },
  { key: "appliances", label: "Appliance Damage", icon: "⚙️", color: "#f59e0b" },
  { key: "other", label: "Other", icon: "❓", color: "#6b7280" },
];

const SOLUTIONS = [
  { key: "nothing", label: "Nothing" },
  { key: "pitcher", label: "Pitcher Filter" },
  { key: "delivery", label: "Water Delivery" },
  { key: "whole_home", label: "Existing Whole-Home" },
];

function Stepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          playTapSound();
          onChange(Math.max(min, value - 1));
        }}
        disabled={value <= min}
        className="flex size-8 items-center justify-center rounded-lg bg-white/10 disabled:opacity-30 cursor-pointer"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-lg font-black tabular-nums">{value}</span>
      <button
        onClick={() => {
          playTapSound();
          onChange(Math.min(max, value + 1));
        }}
        disabled={value >= max}
        className="flex size-8 items-center justify-center rounded-lg bg-white/10 disabled:opacity-30 cursor-pointer"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function TogglePill({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => {
        playTapSound();
        haptic("light");
        onChange(!value);
      }}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all cursor-pointer ${
        value
          ? "border-cyan-400/40 bg-cyan-400/10 text-white"
          : "border-white/10 bg-white/[0.03] text-white/50"
      }`}
    >
      {value && <Check className="size-3.5 text-cyan-400" />}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export function DemoConcernIntake({ onNext, onBack, initial }: Props) {
  const [concerns, setConcerns] = useState<string[]>(initial?.concerns ?? []);
  const [otherText, setOtherText] = useState(initial?.otherText ?? "");
  const [householdSize, setHouseholdSize] = useState(initial?.householdSize ?? 3);
  const [bathrooms, setBathrooms] = useState(initial?.bathrooms ?? 2);
  const [hasKids, setHasKids] = useState(initial?.hasKids ?? false);
  const [hasPets, setHasPets] = useState(initial?.hasPets ?? false);
  const [currentSolution, setCurrentSolution] = useState(initial?.currentSolution ?? "nothing");

  const toggleConcern = (key: string) => {
    playTapSound();
    haptic("light");
    setConcerns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  const handleContinue = () => {
    onNext({
      concerns,
      otherText: concerns.includes("other") ? otherText : "",
      householdSize,
      bathrooms,
      hasKids,
      hasPets,
      currentSolution,
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 border border-violet-500/30 rounded-full px-3 py-1">
          QUICK INTAKE
        </span>
        <h2 className="text-2xl font-black mt-3">
          Before We Begin
        </h2>
        <p className="text-sm text-white/50 mt-1">
          30 seconds — helps us personalize the presentation
        </p>
      </div>

      {/* Top Concerns */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          What Concerns You Most?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CONCERN_OPTIONS.map((opt) => {
            const selected = concerns.includes(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => toggleConcern(opt.key)}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  selected
                    ? "border-white/30 bg-white/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                <span
                  className={`text-sm font-medium leading-tight ${
                    selected ? "text-white" : "text-white/50"
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
        {concerns.includes("other") && (
          <input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/20"
          />
        )}
      </div>

      {/* Household Info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Household Info
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">People in home</span>
          <Stepper value={householdSize} onChange={setHouseholdSize} min={1} max={10} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Bathrooms</span>
          <Stepper value={bathrooms} onChange={setBathrooms} min={1} max={6} />
        </div>
        <div className="flex gap-3">
          <TogglePill label="Kids in home" value={hasKids} onChange={setHasKids} />
          <TogglePill label="Pets" value={hasPets} onChange={setHasPets} />
        </div>
      </div>

      {/* Current Solution */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Current Water Solution
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SOLUTIONS.map((sol) => {
            const selected = currentSolution === sol.key;
            return (
              <button
                key={sol.key}
                onClick={() => {
                  playTapSound();
                  setCurrentSolution(sol.key);
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                  selected
                    ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-white/50"
                }`}
              >
                {sol.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={concerns.length === 0}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-40 disabled:scale-100"
        style={{
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          boxShadow: concerns.length > 0 ? "0 4px 24px rgba(99,102,241,0.3)" : "none",
        }}
      >
        {concerns.length === 0 ? "Select at least one concern" : "Start Demo"}{" "}
        <ArrowRight className="size-5" />
      </button>
    </div>
  );
}
