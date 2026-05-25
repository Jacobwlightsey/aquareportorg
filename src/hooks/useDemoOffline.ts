/**
 * Sprint 4E — Offline / Fallback Mode (Phase 1+2)
 *
 * Phase 1: Cache report data in sessionStorage when loaded online.
 * Phase 2: Detect offline status and serve cached data; show banner.
 *
 * Does NOT support: saving demo results offline, AI assistant offline,
 * proposal generation offline, or spouse review offline.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

const CACHE_PREFIX = "demo_offline_";

export interface OfflineStatus {
  isOnline: boolean;
  isUsingCache: boolean;
}

/**
 * Cache report data for offline access.
 */
function cacheReportData(reportId: string, data: unknown) {
  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${reportId}`,
      JSON.stringify({ data, cachedAt: Date.now() })
    );
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

function getCachedReportData(reportId: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${reportId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Cache valid for 24 hours
    if (Date.now() - parsed.cachedAt > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${reportId}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Hook: online/offline status tracking.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook: cache report data when online, serve from cache when offline.
 */
export function useDemoOfflineCache(
  reportId: string | undefined,
  liveData: unknown | null | undefined
) {
  const isOnline = useOnlineStatus();
  const [isUsingCache, setIsUsingCache] = useState(false);

  // Cache data whenever we have live data
  useEffect(() => {
    if (reportId && liveData && isOnline) {
      cacheReportData(reportId, liveData);
      setIsUsingCache(false);
    }
  }, [reportId, liveData, isOnline]);

  // Return cached data if offline and no live data
  const data = useMemo(() => {
    if (liveData) return liveData;
    if (!isOnline && reportId) {
      const cached = getCachedReportData(reportId);
      if (cached) {
        setIsUsingCache(true);
        return cached;
      }
    }
    return null;
  }, [liveData, isOnline, reportId]);

  return { data, isOnline, isUsingCache };
}

/**
 * Offline banner component data.
 */
export function useOfflineBanner() {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  const show = !isOnline && !dismissed;
  const dismiss = useCallback(() => setDismissed(true), []);

  // Reset when back online
  useEffect(() => {
    if (isOnline) setDismissed(false);
  }, [isOnline]);

  return { show, dismiss, isOnline };
}
