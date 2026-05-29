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
 * Field-reading adjustment — every on-site reading always lowers the score.
 * Max penalty per reading = 3 pts (4 readings × 3 = 12 pts max total).
 *
 * Each reading maps to a severity fraction (0.0–1.0).
 * penalty = severity × 3  →  up to 3 pts per reading.
 * Minimum penalty per reading = 0.5 pt (so it always moves the needle).
 */
export function computeFieldReadingAdjustment(readings: FieldWaterReadings = {}, _baseScore?: number): number {
  const chlorine = readingNumber(readings.chlorine);
  const hardness = readingNumber(readings.hardness);
  const tds = readingNumber(readings.tds);
  const ph = readingNumber(readings.ph);
  const MAX_PER_READING = 3;

  let adjustment = 0;

  // Chlorine (ppm)
  if (chlorine !== undefined) {
    let sev: number;
    if (chlorine < 0.2) sev = 0.15;          // trace
    else if (chlorine <= 0.5) sev = 0.30;    // treated
    else if (chlorine <= 1) sev = 0.50;      // elevated
    else if (chlorine <= 2) sev = 0.70;      // high
    else if (chlorine <= 4) sev = 0.90;      // severe
    else sev = 1.0;                          // extreme
    adjustment -= Math.max(0.5, sev * MAX_PER_READING);
  }

  // Hardness (gpg)
  if (hardness !== undefined) {
    let sev: number;
    if (hardness <= 1) sev = 0.10;           // soft
    else if (hardness <= 3.5) sev = 0.25;    // slightly hard
    else if (hardness <= 7) sev = 0.50;      // moderately hard
    else if (hardness <= 10.5) sev = 0.70;   // hard
    else if (hardness <= 15) sev = 0.85;     // very hard
    else sev = 1.0;                          // severe
    adjustment -= Math.max(0.5, sev * MAX_PER_READING);
  }

  // TDS (ppm)
  if (tds !== undefined) {
    let sev: number;
    if (tds <= 50) sev = 0.10;              // excellent
    else if (tds <= 150) sev = 0.20;        // good
    else if (tds <= 300) sev = 0.45;        // elevated
    else if (tds <= 500) sev = 0.65;        // high
    else if (tds <= 1000) sev = 0.85;       // very high
    else sev = 1.0;                         // severe
    adjustment -= Math.max(0.5, sev * MAX_PER_READING);
  }

  // pH
  if (ph !== undefined) {
    let sev: number;
    if (ph >= 6.8 && ph <= 7.4) sev = 0.10;                                      // normal
    else if ((ph >= 6.5 && ph < 6.8) || (ph > 7.4 && ph <= 8.5)) sev = 0.40;    // mild
    else if ((ph >= 6.0 && ph < 6.5) || (ph > 8.5 && ph <= 9.0)) sev = 0.70;    // moderate
    else sev = 1.0;                                                               // extreme
    adjustment -= Math.max(0.5, sev * MAX_PER_READING);
  }

  return adjustment;
}

export function computeFieldReadingPenalty(readings: FieldWaterReadings = {}, baseScore?: number): number {
  return Math.max(0, -computeFieldReadingAdjustment(readings, baseScore));
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
  // Falls back to flat penalties when ratio data is missing but flags are set.
  let score = 100;

  for (const c of contaminants) {
    const val = (c as any)?.detected_level ?? (c as any)?.value ?? 0;
    const legal = (c as any)?.legal_limit;
    const health = (c as any)?.health_guideline;
    const timesAbove = (c as any)?.times_above_ewg;

    // Base penalty: every detected contaminant matters
    score -= 1;

    if (legal && legal > 0 && val > 0) {
      const ratio = val / legal;
      if (ratio > 1.5) score -= 9;       // extreme violation
      else if (ratio > 1.0) score -= 5;  // over legal limit
      else if (ratio > 0.75) score -= 2; // approaching limit
      else if (ratio > 0.5) score -= 0.5;
    } else if (c.over_legal) {
      // Flag set but no ratio data — apply moderate legal penalty
      score -= 5;
    } else if (health && health > 0 && val > 0) {
      const ratio = val / health;
      if (ratio > 3.0) score -= 7;       // extreme
      else if (ratio > 1.5) score -= 4;  // serious
      else if (ratio > 1.0) score -= 2;  // over health guideline
      else if (ratio > 0.5) score -= 0.5;
    } else if (c.over_health) {
      // Flag set but no ratio data — use times_above_ewg or flat penalty
      if (timesAbove && timesAbove > 3) score -= 7;
      else if (timesAbove && timesAbove > 1.5) score -= 4;
      else score -= 2;
    }
  }

  score += computeFieldReadingAdjustment(readings, score);
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

  return clampScore((parsedBaseScore ?? 100) + computeFieldReadingAdjustment(readings, parsedBaseScore ?? 100));
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
