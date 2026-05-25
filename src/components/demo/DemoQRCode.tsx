/* ──── QR Code — black on white, surface card ──── */

import { Copy, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";

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
    <div className="rounded-2xl p-5 text-center space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <Smartphone className="size-4" style={{ color: colors.textFaint }} />
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
          {label || "Scan to View on Your Phone"}
        </p>
      </div>
      <div className="mx-auto inline-block p-3 rounded-xl bg-white">
        <QRCodeSVG value={url} size={size} level="M" bgColor="#ffffff" fgColor="#000000" />
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center justify-center gap-1.5 mx-auto text-[12px] transition-colors cursor-pointer"
        style={{ color: copied ? colors.success : colors.textFaint }}
      >
        <Copy className="size-3" />
        {copied ? "Copied!" : url.replace(/^https?:\/\//, "")}
      </button>
    </div>
  );
}
