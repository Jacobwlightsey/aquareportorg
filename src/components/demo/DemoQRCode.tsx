/* ──── Sprint 2E: QR Code display for close screens ──── */
/* Pure CSS/SVG fallback — no external QR library needed.
   Displays the URL in a scannable-looking card with a QR icon.
   A real QR code can be added later via `qrcode.react` if desired. */

import { Copy, QrCode, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { playTapSound } from "@/lib/demoSounds";

interface Props {
  url: string;
  size?: number;
  label?: string;
  companyColor?: string;
}

/**
 * Generates a deterministic pseudo-QR pattern from the URL string.
 * NOT a real scannable QR code — it's a visual placeholder that looks
 * like one. For real scanning, swap in `qrcode.react` later.
 */
function PseudoQRGrid({ url, size }: { url: string; size: number }) {
  const gridSize = 21; // QR v1 is 21×21
  const cellSize = size / gridSize;

  // Simple hash to generate deterministic pattern
  const cells: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }

  for (let r = 0; r < gridSize; r++) {
    cells[r] = [];
    for (let c = 0; c < gridSize; c++) {
      // Finder patterns (top-left, top-right, bottom-left corners)
      const isFinder =
        (r < 7 && c < 7) ||
        (r < 7 && c >= gridSize - 7) ||
        (r >= gridSize - 7 && c < 7);

      if (isFinder) {
        const inOuter =
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= gridSize - 7 && (r === gridSize - 7 || r === gridSize - 1)) ||
          (c >= gridSize - 7 && (c === gridSize - 7 || c === gridSize - 1));
        const inInner =
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r >= 2 && r <= 4 && c >= gridSize - 5 && c <= gridSize - 3) ||
          (r >= gridSize - 5 && r <= gridSize - 3 && c >= 2 && c <= 4);
        cells[r][c] = inOuter || inInner;
      } else {
        // Deterministic pseudo-random based on position + hash
        const seed = (hash + r * 37 + c * 53) >>> 0;
        cells[r][c] = seed % 3 !== 0;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="white" />
      {cells.map((row, r) =>
        row.map(
          (filled, c) =>
            filled && (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="black"
              />
            ),
        ),
      )}
    </svg>
  );
}

export function DemoQRCode({ url, size = 180, label, companyColor = "#2563eb" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    playTapSound();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center space-y-3">
      <div className="flex items-center justify-center gap-2 mb-1">
        <Smartphone className="size-4 text-white/40" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          {label || "Scan to View on Your Phone"}
        </p>
      </div>

      {/* QR-like visual */}
      <div className="mx-auto inline-block p-3 rounded-xl bg-white">
        <PseudoQRGrid url={url} size={size} />
      </div>

      {/* Copyable URL */}
      <button
        onClick={handleCopy}
        className="flex items-center justify-center gap-1.5 mx-auto text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        <Copy className="size-3" />
        {copied ? "Copied!" : url.replace(/^https?:\/\//, "")}
      </button>

      <p className="text-[10px] text-white/20">
        For a real scannable QR, add <code className="text-white/30">qrcode.react</code> package
      </p>
    </div>
  );
}
