/* ──── Sprint 2B: Room-by-Room Water Impact ──── */

import { ChevronDown, ChevronUp, DollarSign, Home, Sparkles } from "lucide-react";
import { useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import type { ConcernData } from "./DemoConcernIntake";

interface Props {
  onNext: () => void;
  onBack: () => void;
  concerns?: ConcernData | null;
}

interface Appliance {
  name: string;
  replacementCost: number;
  normalLifespan: string;
  filteredLifespan: string;
  enabled: boolean;
}

interface Room {
  key: string;
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  effects: string[];
  appliances: Appliance[];
  /** Concern keys from 2A that relate to this room */
  relatedConcerns: string[];
}

const ROOMS: Room[] = [
  {
    key: "kitchen",
    name: "Kitchen",
    icon: "🍳",
    color: "#f59e0b",
    borderColor: "rgba(245,158,11,0.3)",
    bgColor: "rgba(245,158,11,0.08)",
    effects: [
      "Chlorine taste in drinking water & cooking",
      "Dishwasher spots & mineral buildup",
      "Ice maker sediment & taste",
      "Coffee & tea taste affected by water quality",
    ],
    appliances: [
      { name: "Dishwasher", replacementCost: 800, normalLifespan: "7-10 yr", filteredLifespan: "12-15 yr", enabled: true },
      { name: "Ice Maker", replacementCost: 300, normalLifespan: "5-8 yr", filteredLifespan: "10+ yr", enabled: true },
    ],
    relatedConcerns: ["taste_smell", "appliances"],
  },
  {
    key: "bathroom",
    name: "Bathroom",
    icon: "🚿",
    color: "#06b6d4",
    borderColor: "rgba(6,182,212,0.3)",
    bgColor: "rgba(6,182,212,0.08)",
    effects: [
      "Dry skin & brittle hair from chlorine",
      "Soap scum buildup on surfaces",
      "Toilet staining from iron & minerals",
      "Shower head clogging from mineral deposits",
    ],
    appliances: [],
    relatedConcerns: ["skin_hair", "staining"],
  },
  {
    key: "laundry",
    name: "Laundry",
    icon: "👕",
    color: "#8b5cf6",
    borderColor: "rgba(139,92,246,0.3)",
    bgColor: "rgba(139,92,246,0.08)",
    effects: [
      "Faded colors & stiff towels",
      "Machine drum buildup from minerals",
      "50-75% more detergent needed",
      "Shortened fabric life from mineral deposits",
    ],
    appliances: [
      { name: "Washing Machine", replacementCost: 900, normalLifespan: "8-10 yr", filteredLifespan: "13-15 yr", enabled: true },
    ],
    relatedConcerns: ["staining", "appliances"],
  },
  {
    key: "whole_home",
    name: "Whole Home",
    icon: "🏠",
    color: "#ef4444",
    borderColor: "rgba(239,68,68,0.3)",
    bgColor: "rgba(239,68,68,0.08)",
    effects: [
      "Pipe corrosion & pinhole leaks",
      "Water heater sediment reduces efficiency",
      "Fixture damage & discoloration",
      "Higher energy bills from scale buildup",
    ],
    appliances: [
      { name: "Water Heater", replacementCost: 1500, normalLifespan: "8-12 yr", filteredLifespan: "15-20 yr", enabled: true },
      { name: "Faucets & Fixtures", replacementCost: 500, normalLifespan: "5-10 yr", filteredLifespan: "15+ yr", enabled: true },
    ],
    relatedConcerns: ["appliances", "health_safety"],
  },
];

export function DemoRoomImpact({ onNext, onBack, concerns }: Props) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [appliances, setAppliances] = useState<Record<string, Appliance[]>>(() => {
    const map: Record<string, Appliance[]> = {};
    for (const room of ROOMS) {
      map[room.key] = room.appliances.map((a) => ({ ...a }));
    }
    return map;
  });

  // Calculate total savings
  const totalSavings = Object.values(appliances)
    .flat()
    .filter((a) => a.enabled)
    .reduce((sum, a) => sum + a.replacementCost, 0);

  const animatedSavings = useCountUp(totalSavings, 1200, 200);

  // Check which rooms match the user's concerns
  const highlightedRooms = new Set<string>();
  if (concerns?.concerns) {
    for (const room of ROOMS) {
      if (room.relatedConcerns.some((c) => concerns.concerns.includes(c))) {
        highlightedRooms.add(room.key);
      }
    }
  }

  const toggleRoom = (key: string) => {
    playTapSound();
    haptic("light");
    setExpandedRoom((prev) => (prev === key ? null : key));
  };

  const toggleAppliance = (roomKey: string, idx: number) => {
    playTapSound();
    setAppliances((prev) => {
      const next = { ...prev };
      next[roomKey] = [...next[roomKey]];
      next[roomKey][idx] = {
        ...next[roomKey][idx],
        enabled: !next[roomKey][idx].enabled,
      };
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 border border-rose-500/30 rounded-full px-3 py-1">
          ROOM BY ROOM
        </span>
        <h2 className="text-2xl font-black mt-3 leading-tight">
          How Contaminated Water<br />
          <span className="text-rose-400">Affects Your Home</span>
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Tap each room to see the full impact
        </p>
      </div>

      {/* Room cards */}
      <div className="space-y-3">
        {ROOMS.map((room) => {
          const isExpanded = expandedRoom === room.key;
          const isHighlighted = highlightedRooms.has(room.key);
          const roomAppliances = appliances[room.key] ?? [];

          return (
            <div
              key={room.key}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{
                borderColor: isExpanded || isHighlighted ? room.borderColor : "rgba(255,255,255,0.1)",
                background: isExpanded ? room.bgColor : "rgba(255,255,255,0.02)",
              }}
            >
              {/* Room header */}
              <button
                onClick={() => toggleRoom(room.key)}
                className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{room.icon}</span>
                  <div>
                    <p className="text-base font-bold">{room.name}</p>
                    <p className="text-xs text-white/40">
                      {room.effects.length} effects
                      {roomAppliances.length > 0 && ` · ${roomAppliances.length} appliance${roomAppliances.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isHighlighted && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: room.color, borderColor: room.borderColor, background: room.bgColor }}>
                      Matches You
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="size-5 text-white/40" />
                  ) : (
                    <ChevronDown className="size-5 text-white/40" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: `${room.color}15` }}>
                  {/* Effects */}
                  <div className="pt-3 space-y-2">
                    {room.effects.map((effect, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="size-1.5 rounded-full mt-2 shrink-0" style={{ background: room.color }} />
                        <span className="text-sm text-white/70">{effect}</span>
                      </div>
                    ))}
                  </div>

                  {/* Appliances */}
                  {roomAppliances.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                        Appliance Impact
                      </p>
                      {roomAppliances.map((app, idx) => (
                        <button
                          key={app.name}
                          onClick={() => toggleAppliance(room.key, idx)}
                          className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                            app.enabled
                              ? "border-white/15 bg-white/[0.04]"
                              : "border-white/5 bg-transparent opacity-40"
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-medium ${!app.enabled ? "line-through" : ""}`}>
                              {app.name}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {app.normalLifespan} → <span className="text-emerald-400">{app.filteredLifespan}</span> with filtration
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: room.color }}>
                              ${app.replacementCost.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-white/30">replacement</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Savings calculator */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center space-y-2">
        <DollarSign className="size-6 text-emerald-400 mx-auto" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">
          Potential Savings Over 10 Years
        </p>
        <p className="text-3xl font-black text-emerald-400">
          ${(animatedSavings * 1.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}–${(animatedSavings * 2.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="text-xs text-white/40">
          In extended appliance life, reduced repairs & lower energy costs
        </p>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-white/60 cursor-pointer"
        >
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
