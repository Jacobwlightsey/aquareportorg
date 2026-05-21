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
  detected?: boolean | null;
  detection_status?: string | null;
  detected_level?: number | null;
  value?: number | null;
  legal_limit?: number | null;
  health_guideline?: number | null;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isScoreDetected(contaminant: ScoreContaminant): boolean {
  return contaminant.detected !== false && contaminant.detection_status !== "not_detected";
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

/**
 * Unified AquaScore algorithm — matches myaquareport.com scoring.
 *
 * Starts at 100, subtracts based on each contaminant's actual
 * detected-value-to-limit ratio rather than flat boolean penalties.
 * This produces the same scores the consumer side shows.
 */
export function calculateAquaScoreFromContaminants(
  contaminants: ScoreContaminant[],
  readings: FieldWaterReadings = {},
): number {
  const detected = contaminants.filter(isScoreDetected);
  let score = 100;

  for (const c of detected) {
    const val = c.detected_level ?? c.value ?? 0;
    const legal = c.legal_limit;
    const health = c.health_guideline;

    if (legal && legal > 0 && val > 0) {
      const ratio = val / legal;
      if (ratio > 1.5) score -= 12;       // Significantly over legal limit
      else if (ratio > 1.0) score -= 8;   // Over legal limit
      else if (ratio > 0.75) score -= 3;  // Approaching legal limit
      else if (ratio > 0.5) score -= 1;   // Moderate vs legal
    } else if (health && health > 0 && val > 0) {
      const ratio = val / health;
      if (ratio > 3.0) score -= 6;        // Far above health guideline
      else if (ratio > 1.5) score -= 4;   // Well above health guideline
      else if (ratio > 1.0) score -= 2;   // Above health guideline
    }
  }

  // Apply field-reading adjustment (dealer-side bonus)
  score += computeFieldReadingAdjustment(readings);

  return clampScore(score);
}

export function computeWaterRiskScore(
  contaminants: ScoreContaminant[],
  readings: FieldWaterReadings = {},
): number {
  return 100 - computeAquaScore(undefined, contaminants, readings);
}

/**
 * Primary entry point.  Uses the unified ratio-based algorithm
 * that matches the myaquareport.com consumer scoring system.
 */
export function computeAquaScore(
  _baseScore: number | null | undefined,
  contaminants: ScoreContaminant[],
  readings: FieldWaterReadings = {},
): number {
  return calculateAquaScoreFromContaminants(contaminants, readings);
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
