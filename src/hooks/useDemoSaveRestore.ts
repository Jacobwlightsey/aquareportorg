/**
 * Sprint 4C — Save & Resume Demo
 *
 * Auto-saves demo state to localStorage on every step change.
 * On mount, checks for saved state < 2 hours old and offers resume.
 */
import { useCallback, useEffect, useState } from "react";

export interface DemoSaveState {
  currentStep: number;
  liveReadings: { chlorine?: string | number | null; hardness?: string | number | null; tds?: string | number | null; ph?: string | number | null; [k: string]: string | number | null | undefined };
  pricingState: unknown;
  boostApplied: boolean;
  concerns: unknown;
  customerConcerns: unknown;
  demoMode: string;
  viewMode: string;
  demoTime: number;
  demoStarted: boolean;
  stepTimings: unknown[];
  timestamp: number;
}

const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

function storageKey(reportId: string) {
  return `demo_state_${reportId}`;
}

export function getSavedDemoState(reportId: string): DemoSaveState | null {
  try {
    const raw = localStorage.getItem(storageKey(reportId));
    if (!raw) return null;
    const state = JSON.parse(raw) as DemoSaveState;
    if (Date.now() - state.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(storageKey(reportId));
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function clearDemoState(reportId: string) {
  localStorage.removeItem(storageKey(reportId));
}

export function useDemoAutoSave(
  reportId: string | undefined,
  getState: () => DemoSaveState | null,
  currentStep: number,
  demoStarted: boolean,
) {
  useEffect(() => {
    if (!reportId || !demoStarted) return;
    const state = getState();
    if (!state) return;

    // Save to localStorage on every step change
    localStorage.setItem(storageKey(reportId), JSON.stringify(state));
  }, [reportId, currentStep, demoStarted, getState]);
}

/**
 * Hook for the resume dialog on mount.
 * Returns { showResume, savedState, onResume, onFresh }
 */
export function useDemoResume(reportId: string | undefined) {
  const [showResume, setShowResume] = useState(false);
  const [savedState, setSavedState] = useState<DemoSaveState | null>(null);

  useEffect(() => {
    if (!reportId) return;
    const state = getSavedDemoState(reportId);
    if (state && state.demoStarted) {
      setSavedState(state);
      setShowResume(true);
    }
  }, [reportId]);

  const onResume = useCallback(() => {
    setShowResume(false);
    // savedState is available for the caller to restore
  }, []);

  const onFresh = useCallback(() => {
    if (reportId) clearDemoState(reportId);
    setSavedState(null);
    setShowResume(false);
  }, [reportId]);

  return { showResume, savedState, onResume, onFresh };
}
