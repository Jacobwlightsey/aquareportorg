/* ──── Orientation Lock — Tablet Landscape Enforcer ────
   Detects portrait mode on tablet-sized devices and shows
   a clean full-screen prompt to rotate.
   Phones get through (too small for landscape enforcement).
   Desktop gets through (no orientation API).
   ──── */

import { RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { colors } from "@/lib/designTokens";

/** Minimum width to consider the device a "tablet" (portrait width ≥ 600px) */
const TABLET_MIN_WIDTH = 600;

export function DemoOrientationLock({ children }: { children: React.ReactNode }) {
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);

  useEffect(() => {
    function check() {
      // Only enforce on touch devices
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (!isTouch) { setShowRotatePrompt(false); return; }

      // Screen dimensions
      const w = window.screen.width;
      const h = window.screen.height;
      const minDim = Math.min(w, h);
      const isTabletSize = minDim >= TABLET_MIN_WIDTH;

      if (!isTabletSize) { setShowRotatePrompt(false); return; }

      // Check orientation
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowRotatePrompt(isPortrait);
    }

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    // Also listen to screen.orientation if available
    const orient = screen.orientation;
    if (orient) orient.addEventListener("change", check);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      if (orient) orient.removeEventListener("change", check);
    };
  }, []);

  if (showRotatePrompt) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8"
        style={{ background: colors.bg }}
      >
        {/* Logo */}
        <img
          src="/assets/aquareport-logo.png"
          alt="AquaReport"
          className="w-16 h-20 object-contain mb-8"
        />

        {/* Rotate icon — animated */}
        <div className="mb-8">
          <RotateCw
            className="size-16 animate-spin"
            style={{ color: colors.primary, animationDuration: "3s" }}
          />
        </div>

        {/* Message */}
        <h2
          className="text-[24px] font-bold text-center leading-tight mb-3"
          style={{ color: colors.textPrimary }}
        >
          Please Rotate Your Device
        </h2>
        <p
          className="text-[16px] text-center max-w-sm"
          style={{ color: colors.textMuted }}
        >
          This presentation is designed for landscape mode for the best experience.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
