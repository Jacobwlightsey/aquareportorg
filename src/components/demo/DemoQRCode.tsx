/* ──── Sprint 2E: Real Scannable QR Code for close screens ──── */

import { Copy, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { playTapSound } from "@/lib/demoSounds";

interface Props {
  url: string;
  size?: number;
  label?: string;
  companyColor?: string;
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

      {/* Real scannable QR code */}
      <div className="mx-auto inline-block p-3 rounded-xl bg-white">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Copyable URL */}
      <button
        onClick={handleCopy}
        className="flex items-center justify-center gap-1.5 mx-auto text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
      >
        <Copy className="size-3" />
        {copied ? "Copied!" : url.replace(/^https?:\/\//, "")}
      </button>
    </div>
  );
}
