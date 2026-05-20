// Types for water report data (used by Convex action responses)

export interface Contaminant {
  name?: string;
  contaminant: string;
  contaminant_id?: string | null;
  detected?: boolean;
  detection_status?: "detected" | "not_detected" | "trace" | "unknown";
  detected_level: number;
  value?: number | null;
  legal_limit: number | null;
  health_guideline: number | null;
  over_health: boolean;
  over_legal: boolean;
  times_above_ewg: number | null;
  effect: string | null;
  unit: string;
  source_type?: string;
  confidence_score?: number;
}

export interface WaterReport {
  utility?: Record<string, unknown>;
  report_year?: number;
  total_tested?: number;
  total_detected?: number;
  total_above_legal_limit?: number;
  total_above_health_guideline?: number;
  water_score?: number | null;
  waterScore?: number | null;
  data_quality_flags?: Array<{
    issue_type: string;
    description: string;
    severity: "low" | "medium" | "high";
    created_at?: string;
  }>;
  utility_info: {
    utility_name: string;
    pwsid: string;
    city: string;
    state: string;
    population_served: number;
    water_source: string;
  };
  contaminants: Contaminant[];
}

export function contaminantName(contaminant: Pick<Contaminant, "contaminant" | "name">): string {
  return contaminant.contaminant || contaminant.name || "Unknown contaminant";
}

export function isDetectedContaminant(
  contaminant: Pick<Contaminant, "detected" | "detection_status">,
): boolean {
  return contaminant.detected !== false && contaminant.detection_status !== "not_detected";
}
