export interface FieldWaterReadings {
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
  return Math.max(0, Math.min(100, Math.round(score)));
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

export function computeFieldReadingAdjustment(readings: FieldWaterReadings = {}): number {
  const chlorine = readingNumber(readings.chlorine);
  const hardness = readingNumber(readings.hardness);
  const tds = readingNumber(readings.tds);
  const ph = readingNumber(readings.ph);

  let adjustment = 0;
  let factors = 0;

  if (chlorine !== undefined) {
    factors++;
    if (chlorine >= 0.2 && chlorine <= 2) adjustment += 3;
    else if (chlorine <= 4) adjustment += 1;
    else adjustment -= 2;
  }

  if (hardness !== undefined) {
    factors++;
    if (hardness <= 60) adjustment += 2;
    else if (hardness <= 120) adjustment += 1;
    else if (hardness <= 180) adjustment -= 1;
    else adjustment -= 3;
  }

  if (tds !== undefined) {
    factors++;
    if (tds <= 300) adjustment += 3;
    else if (tds <= 500) adjustment += 1;
    else adjustment -= 3;
  }

  if (ph !== undefined) {
    factors++;
    if (ph >= 6.5 && ph <= 8.5) adjustment += 3;
    else if (ph >= 6 && ph <= 9) adjustment += 1;
    else adjustment -= 2;
  }

  return factors > 0 ? Math.round((adjustment / factors) * 3) : 0;
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
  // Uses actual detected-value / limit ratios — matches backend (convex/reports.ts)
  let score = 100;

  for (const c of contaminants) {
    const val = (c as any)?.detected_level ?? (c as any)?.value ?? 0;
    const legal = (c as any)?.legal_limit;
    const health = (c as any)?.health_guideline;

    if (legal && legal > 0 && val > 0) {
      const ratio = val / legal;
      if (ratio > 1.5) score -= 12;
      else if (ratio > 1.0) score -= 8;
      else if (ratio > 0.75) score -= 3;
      else if (ratio > 0.5) score -= 1;
    } else if (health && health > 0 && val > 0) {
      const ratio = val / health;
      if (ratio > 3.0) score -= 6;
      else if (ratio > 1.5) score -= 4;
      else if (ratio > 1.0) score -= 2;
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
