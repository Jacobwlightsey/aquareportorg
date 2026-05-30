/**
 * Pipeline helper — forward-only stage advancement with audit trail.
 *
 * Called internally by mutations (appointments, reports, demos, contracts,
 * installs) to auto-advance the lead through the unified pipeline.
 *
 * Rule: stage only moves forward unless explicitly overridden or closed_lost.
 */

import type { GenericMutationCtx } from "convex/server";
import type { Id } from "./_generated/dataModel";
import type { DataModel } from "./_generated/dataModel";

/** Ordered pipeline stages — index = rank. closed_lost is special. */
const STAGE_ORDER = [
  "new_lead",       // 0
  "call_to_set",    // 1
  "scheduled",      // 2
  "report_created", // 3
  "demo_done",      // 4
  "forms_sent",     // 5
  "sold",           // 6
  "installed",      // 7
] as const;

type PipelineStage = (typeof STAGE_ORDER)[number] | "closed_lost";

function stageRank(stage: string): number {
  const idx = STAGE_ORDER.indexOf(stage as any);
  return idx >= 0 ? idx : -1;
}

/**
 * Normalize legacy stage names to the unified pipeline.
 */
export function normalizeStage(stage: string): PipelineStage {
  const map: Record<string, PipelineStage> = {
    new: "new_lead",
    contacted: "call_to_set",
    appointment_set: "scheduled",
    demo_completed: "demo_done",
    proposal_sent: "forms_sent",
    negotiation: "forms_sent",
    closed: "sold",
    closed_won: "sold",
  };
  return (map[stage] as PipelineStage) || (stage as PipelineStage);
}

/**
 * Advance a lead to a new stage. Only moves forward (higher rank) unless:
 * - The target is "closed_lost" (can happen from any stage)
 * - force=true is passed (for manual override by admin/owner)
 *
 * Appends to stageHistory automatically.
 *
 * @returns true if the stage was actually changed, false if skipped
 */
export async function advanceLeadStage(
  ctx: GenericMutationCtx<DataModel>,
  leadId: Id<"leads">,
  targetStage: string,
  userId?: string,
  options?: { force?: boolean }
): Promise<boolean> {
  const lead = await ctx.db.get(leadId);
  if (!lead) return false;

  const normalizedTarget = normalizeStage(targetStage);
  const currentNormalized = normalizeStage(lead.status);

  // closed_lost can always be set
  if (normalizedTarget === "closed_lost") {
    return await applyStageChange(ctx, lead, normalizedTarget, userId);
  }

  const currentRank = stageRank(currentNormalized);
  const targetRank = stageRank(normalizedTarget);

  // Already at or past this stage — skip (unless forced)
  if (targetRank <= currentRank && !options?.force) {
    return false;
  }

  // If currently closed_lost and trying to reopen — only allow with force
  if (currentNormalized === "closed_lost" && !options?.force) {
    return false;
  }

  return await applyStageChange(ctx, lead, normalizedTarget, userId);
}

async function applyStageChange(
  ctx: GenericMutationCtx<DataModel>,
  lead: any,
  newStage: PipelineStage,
  userId?: string
): Promise<boolean> {
  // Parse existing history
  let history: Array<{ stage: string; timestamp: number; userId?: string }> = [];
  if (lead.stageHistory) {
    try {
      history = JSON.parse(lead.stageHistory);
    } catch {
      history = [];
    }
  }

  // Append new entry
  history.push({
    stage: newStage,
    timestamp: Date.now(),
    ...(userId ? { userId } : {}),
  });

  const patch: Record<string, unknown> = {
    status: newStage,
    stageHistory: JSON.stringify(history),
  };

  // Set closedAt for terminal stages
  if (newStage === "sold" || newStage === "installed" || newStage === "closed_lost") {
    if (!lead.closedAt) {
      patch.closedAt = Date.now();
    }
  }

  await ctx.db.patch(lead._id, patch);
  return true;
}
