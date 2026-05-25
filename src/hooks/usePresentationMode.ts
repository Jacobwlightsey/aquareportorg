import { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface PresentationModeCtx {
  isPresentationMode: boolean;
  toggle: () => void;
}

export const PresentationModeContext = createContext<PresentationModeCtx>({
  isPresentationMode: false,
  toggle: () => {},
});

const STORAGE_KEY = "aquareport_presentation_mode";

export function usePresentationModeProvider(): PresentationModeCtx {
  const [isPresentationMode, setIsPresentationMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isPresentationMode));
    } catch { /* silent */ }
  }, [isPresentationMode]);

  const toggle = useCallback(() => setIsPresentationMode((v) => !v), []);

  return { isPresentationMode, toggle };
}

export function usePresentationMode(): PresentationModeCtx {
  return useContext(PresentationModeContext);
}
