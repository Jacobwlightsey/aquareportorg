import { createContext, useContext, useState, useCallback } from "react";

export type ViewModeType = "rep" | "customer";

export interface ViewModeCtx {
  viewMode: ViewModeType;
  toggleViewMode: () => void;
}

export const ViewModeContext = createContext<ViewModeCtx>({
  viewMode: "rep",
  toggleViewMode: () => {},
});

export function useViewModeProvider(): ViewModeCtx {
  const [viewMode, setViewMode] = useState<ViewModeType>("rep");

  const toggleViewMode = useCallback(
    () => setViewMode((v) => (v === "rep" ? "customer" : "rep")),
    [],
  );

  return { viewMode, toggleViewMode };
}

export function useViewMode(): ViewModeCtx {
  return useContext(ViewModeContext);
}
