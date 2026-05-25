/* ──── Shared Fullscreen Toggle Button ────
   Works across the whole app. Exits fullscreen automatically
   if user navigates away from a full-screen page.
   ──── */

import { Maximize, Minimize } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  /** Compact mode for demo header (smaller, minimal style) */
  compact?: boolean;
}

export function FullscreenToggle({ compact = false }: Props) {
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={`flex items-center justify-center rounded-lg p-1.5 transition-all cursor-pointer ${
          isFs
            ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30"
            : "bg-white/5 text-white/70 active:bg-white/10"
        }`}
        title={isFs ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFs ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-4 right-4 z-50 flex items-center justify-center rounded-full p-3 shadow-lg transition-all cursor-pointer ${
        isFs
          ? "bg-cyan-600 text-white hover:bg-cyan-700"
          : "bg-gray-800/90 text-gray-300 hover:bg-gray-700/90 border border-gray-600/50"
      }`}
      title={isFs ? "Exit Fullscreen" : "Fullscreen"}
    >
      {isFs ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
    </button>
  );
}

/** Helper: exit fullscreen if currently active */
export function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
