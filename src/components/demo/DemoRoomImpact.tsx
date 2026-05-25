/* ──── Room-by-Room Impact ────
   Surface cards, designTokens colors.
   ──── */

import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/designTokens";
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
  effects: string[];
  appliances: Appliance[];
  relatedConcerns: string[];
}

const ROOMS: Room[] = [
  {
    key: "kitchen", name: "Kitchen", icon: "🍳", color: colors.warning,
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
    key: "bathroom", name: "Bathroom", icon: "🚿", color: colors.primary,
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
    key: "laundry", name: "Laundry", icon: "👕", color: "#8b5cf6",
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
    key: "whole_home", name: "Whole Home", icon: "🏠", color: colors.critical,
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
    for (const room of ROOMS) map[room.key] = room.appliances.map((a) => ({ ...a }));
    return map;
  });

  const totalSavings = Object.values(appliances).flat().filter((a) => a.enabled).reduce((sum, a) => sum + a.replacementCost, 0);
  const animatedSavings = useCountUp(totalSavings, 1200, 200);

  const highlightedRooms = new Set<string>();
  if (concerns?.concerns) {
    for (const room of ROOMS) {
      if (room.relatedConcerns.some((c) => concerns.concerns.includes(c))) highlightedRooms.add(room.key);
    }
  }

  const toggleRoom = (key: string) => { playTapSound(); haptic("light"); setExpandedRoom((prev) => (prev === key ? null : key)); };
  const toggleAppliance = (roomKey: string, idx: number) => {
    playTapSound();
    setAppliances((prev) => {
      const next = { ...prev };
      next[roomKey] = [...next[roomKey]];
      next[roomKey][idx] = { ...next[roomKey][idx], enabled: !next[roomKey][idx].enabled };
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.critical}b0` }}>
          ROOM BY ROOM
        </p>
        <h2 className="text-[28px] font-bold mt-3 leading-tight tracking-tight">
          How Contaminated Water<br />
          <span style={{ color: colors.critical }}>Affects Your Home</span>
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
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
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: isExpanded ? `${room.color}06` : colors.surface,
                border: isExpanded || isHighlighted ? `1px solid ${room.color}25` : `1px solid ${colors.border}`,
              }}
            >
              <button
                onClick={() => toggleRoom(room.key)}
                className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{room.icon}</span>
                  <div>
                    <p className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>{room.name}</p>
                    <p className="text-[13px]" style={{ color: colors.textFaint }}>
                      {room.effects.length} effects
                      {roomAppliances.length > 0 && ` · ${roomAppliances.length} appliance${roomAppliances.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isHighlighted && (
                    <span className="text-[10px] font-semibold rounded-md px-2 py-0.5" style={{ color: room.color, background: `${room.color}12` }}>
                      Matches You
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="size-5" style={{ color: colors.textFaint }} /> : <ChevronDown className="size-5" style={{ color: colors.textFaint }} />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${room.color}12` }}>
                  <div className="pt-3 space-y-2">
                    {room.effects.map((effect, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="size-1.5 rounded-full mt-2 shrink-0" style={{ background: room.color }} />
                        <span className="text-[14px]" style={{ color: colors.textSecondary }}>{effect}</span>
                      </div>
                    ))}
                  </div>

                  {roomAppliances.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: colors.textFaint }}>Appliance Impact</p>
                      {roomAppliances.map((app, idx) => (
                        <button
                          key={app.name}
                          onClick={() => toggleAppliance(room.key, idx)}
                          className="w-full flex items-center justify-between rounded-xl p-3 text-left transition-all cursor-pointer"
                          style={{
                            background: app.enabled ? `${colors.textFaint}08` : "transparent",
                            border: `1px solid ${app.enabled ? colors.border : `${colors.border}50`}`,
                            opacity: app.enabled ? 1 : 0.4,
                          }}
                        >
                          <div>
                            <p className={`text-[14px] font-medium ${!app.enabled ? "line-through" : ""}`} style={{ color: colors.textPrimary }}>{app.name}</p>
                            <p className="text-[13px] mt-0.5" style={{ color: colors.textFaint }}>
                              {app.normalLifespan} → <span style={{ color: colors.success }}>{app.filteredLifespan}</span> with filtration
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] font-semibold" style={{ color: room.color }}>${app.replacementCost.toLocaleString()}</p>
                            <p className="text-[11px]" style={{ color: colors.textFaint }}>replacement</p>
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
      <div className="rounded-2xl p-6 text-center space-y-2" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
        <DollarSign className="size-6 mx-auto" style={{ color: colors.success }} />
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}90` }}>
          Potential Savings Over 10 Years
        </p>
        <p className="text-[32px] font-bold" style={{ color: colors.success }}>
          ${(animatedSavings * 1.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}–${(animatedSavings * 2.5).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="text-[13px]" style={{ color: colors.textMuted }}>
          In extended appliance life, reduced repairs & lower energy costs
        </p>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-2xl py-3 text-[14px] font-medium cursor-pointer" style={{ background: colors.surface, color: colors.textMuted }}>← Back</button>
        <button onClick={onNext} className="flex-1 rounded-2xl py-3 text-[14px] font-semibold cursor-pointer" style={{ background: `${colors.primary}15`, color: colors.primary }}>Continue →</button>
      </div>
    </div>
  );
}
