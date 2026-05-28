export interface FieldWaterReadings {
  [key: string]: string | number | null | undefined;
  chlorine?: string | number | null;
  hardness?: string | number | null;
  tds?: string | number | null;
  ph?: string | number | null;
}

export interface ScoreContaminant {
  over_legal?: boolean | null;
  over_health?: boolean | null;
  times_above_ewg?: number | null;
  detected_level?: number | null;
  value?: number | null;
  legal_limit?: number | null;
  health_guideline?: number | null;
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(100, Math.round(score)));
}

export function readingNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readingPayload(readings: FieldWaterReadings) {
  return {
    chlorine: readingNumber(readings.chlorine),
    hardness: readingNumber(readings.hardness),
    tds: readingNumber(readings.tds),
    ph: readingNumber(readings.ph),
  };
}

/**
 * Field-reading adjustment — every on-site reading lowers the score.
 * The live water test is the anchor of the in-home demo: entering any
 * reading should always move the score downward.  Worse readings drop
 * it dramatically so the homeowner feels the urgency.
 *
 * Chlorine (ppm): 0-0.2 trace | 0.2-0.5 treated | 0.5-1 elevated | 1-2 high | 2-4 severe | 4+ extreme
 * Hardness (gpg): 0-1 soft | 1-3.5 slight | 3.5-7 moderate | 7-10.5 hard | 10.5-15 very hard | 15+ severe
 * TDS (ppm):      0-50 excellent | 50-150 good | 150-300 elevated | 300-500 high | 500-1000 very high | 1000+ severe
 * pH:             6.8-7.4 normal | 6.5-6.8 / 7.4-8.5 mild | 6.0-6.5 / 8.5-9.0 moderate | outside extreme
 */
export function computeFieldReadingAdjustment(readings: FieldWaterReadings = {}): number {
  const chlorine = readingNumber(readings.chlorine);
  const hardness = readingNumber(readings.hardness);
  const tds = readingNumber(readings.tds);
  const ph = readingNumber(readings.ph);

  let adjustment = 0;

  // Chlorine (ppm) — even trace chlorine is penalized
  if (chlorine !== undefined) {
    if (chlorine < 0.2) adjustment -= 1;           // trace — still present
    else if (chlorine <= 0.5) adjustment -= 3;     // normal treated water
    else if (chlorine <= 1) adjustment -= 5;       // elevated
    else if (chlorine <= 2) adjustment -= 8;       // high
    else if (chlorine <= 4) adjustment -= 12;      // severe
    else adjustment -= 15;                         // extreme
  }

  // Hardness (gpg) — any measurable hardness deducts
  if (hardness !== undefined) {
    if (hardness <= 1) adjustment -= 1;            // soft — minor
    else if (hardness <= 3.5) adjustment -= 3;     // slightly hard
    else if (hardness <= 7) adjustment -= 6;       // moderately hard
    else if (hardness <= 10.5) adjustment -= 9;    // hard
    else if (hardness <= 15) adjustment -= 12;     // very hard
    else adjustment -= 15;                         // severe
  }

  // TDS (ppm) — measures total dissolved solids
  if (tds !== undefined) {
    if (tds <= 50) adjustment -= 1;                // excellent — minor
    else if (tds <= 150) adjustment -= 2;          // good
    else if (tds <= 300) adjustment -= 5;          // elevated
    else if (tds <= 500) adjustment -= 8;          // high
    else if (tds <= 1000) adjustment -= 12;        // very high
    else adjustment -= 15;                         // severe
  }

  // pH — even normal pH shows a small reading impact
  if (ph !== undefined) {
    if (ph >= 6.8 && ph <= 7.4) adjustment -= 1;                                    // normal — minor
    else if ((ph >= 6.5 && ph < 6.8) || (ph > 7.4 && ph <= 8.5)) adjustment -= 4;  // mild imbalance
    else if ((ph >= 6.0 && ph < 6.5) || (ph > 8.5 && ph <= 9.0)) adjustment -= 8;  // moderate
    else adjustment -= 12;                                                           // extreme
  }

  return adjustment;
}

export function computeFieldReadingPenalty(readings: FieldWaterReadings = {}): number {
  return Math.max(0, -computeFieldReadingAdjustment(readings));
}

export function computeWaterRiskScore(
  contaminants: ScoreContaminant[],
  readings: FieldWaterReadings = {},
): number {
  return 100 - computeAquaScore(undefined, contaminants, readings);
}

export function calculateAquaScoreFromContaminants(
  contaminants: ScoreContaminant[],
  readings: FieldWaterReadings = {},
): number {
  // Uses actual detected-value / limit ratios — matches backend (convex/reports.ts).
  // Every detected contaminant gets a −1 base penalty.
  // Violations against legal limits or health guidelines add additional deductions.
  let score = 100;

  for (const c of contaminants) {
    const val = (c as any)?.detected_level ?? (c as any)?.value ?? 0;
    const legal = (c as any)?.legal_limit;
    const health = (c as any)?.health_guideline;

    // Base penalty: every detected contaminant matters
    score -= 1;

    if (legal && legal > 0 && val > 0) {
      const ratio = val / legal;
      if (ratio > 1.5) score -= 9;       // extreme violation
      else if (ratio > 1.0) score -= 5;  // over legal limit
      else if (ratio > 0.75) score -= 2; // approaching limit
      else if (ratio > 0.5) score -= 0.5;
    } else if (health && health > 0 && val > 0) {
      const ratio = val / health;
      if (ratio > 3.0) score -= 7;       // extreme
      else if (ratio > 1.5) score -= 4;  // serious
      else if (ratio > 1.0) score -= 2;  // over health guideline
      else if (ratio > 0.5) score -= 0.5;
    }
  }

  score += computeFieldReadingAdjustment(readings);
  return clampScore(score);
}

export function computeAquaScore(
  baseScore: number | null | undefined,
  contaminants: ScoreContaminant[],
  readings: FieldWaterReadings = {},
): number {
  const parsedBaseScore = readingNumber(baseScore);
  if (contaminants.some((contaminant) => contaminant.over_legal || contaminant.over_health)) {
    return calculateAquaScoreFromContaminants(contaminants, readings);
  }

  return clampScore((parsedBaseScore ?? 100) + computeFieldReadingAdjustment(readings));
}

export function normalizeRiskScore(score: number | null | undefined, scoreMode?: string | null): number | undefined {
  if (score === null || score === undefined) return undefined;
  if (scoreMode === "risk_v1") return clampScore(score);
  return clampScore(100 - score);
}

export function normalizeAquaScore(score: number | null | undefined, scoreMode?: string | null): number | undefined {
  if (score === null || score === undefined) return undefined;
  if (scoreMode === "risk_v1") return clampScore(100 - score);
  return clampScore(score);
}
