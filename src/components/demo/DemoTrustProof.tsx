/* ──── Trust & Proof — "Real Results" ────
   Fix #6: normalize report field names (customerCity/city, customerState/state)
   Surface cards, designTokens colors.
   ──── */

import { Award, Camera, ChevronLeft, ChevronRight, Home, ShieldCheck, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/designTokens";

interface Props {
  company: any;
  report?: any;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_REVIEWS = [
  { name: "Sarah M.", rating: 5, quote: "Our water tastes incredible now. My family noticed the difference on day one!" },
  { name: "Mike & Jen R.", rating: 5, quote: "No more stains on our fixtures. The installation was quick and professional." },
  { name: "The Johnson Family", rating: 4, quote: "Worth every penny for our kids' health. Wish we had done this sooner." },
];

const DEFAULT_CERTIFICATIONS = [
  { label: "WQA Certified", icon: "🏅" },
  { label: "NSF Listed", icon: "✅" },
  { label: "BBB A+", icon: "⭐" },
  { label: "EPA Registered", icon: "🛡️" },
];

const DEFAULT_INSTALL_COUNT = 500;
const DEFAULT_INSTALL_AREA = "your area";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : ""}`} style={i > rating ? { color: colors.textFaint } : undefined} />
      ))}
    </div>
  );
}

function BeforeAfterSlider({ before, after, caption }: { before: string; after: string; caption?: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="swipe-disabled relative h-48 rounded-xl overflow-hidden cursor-ew-resize select-none"
        onMouseMove={(e) => { if (e.buttons === 1) handleMove(e.clientX); }}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerWidth || "100%" }} />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ left: `${position}%` }}>
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-white/90 shadow-lg">
            <ChevronLeft className="size-3 text-gray-800 -mr-0.5" />
            <ChevronRight className="size-3 text-gray-800 -ml-0.5" />
          </div>
        </div>
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black/50 text-white px-2 py-0.5 rounded-full">Before</span>
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${colors.success}cc` }}>After</span>
      </div>
      {caption && <p className="text-[12px] text-center" style={{ color: colors.textFaint }}>{caption}</p>}
    </div>
  );
}

export function DemoTrustProof({ company, report, onNext, onBack }: Props) {
  const trustConfig = (company as any)?.demoConfig?.trustSection;

  const hasCustomReviews = !!trustConfig?.reviews?.length;
  const reviews = hasCustomReviews ? trustConfig.reviews : DEFAULT_REVIEWS;
  const certs = trustConfig?.certifications?.length ? trustConfig.certifications : DEFAULT_CERTIFICATIONS;
  const installCount = trustConfig?.installCount ?? DEFAULT_INSTALL_COUNT;

  // Fix #6: normalize report field names
  const reportArea =
    (report?.customerCity || report?.city) && (report?.customerState || report?.state)
      ? `${report.customerCity || report.city}, ${report.customerState || report.state}`
      : report?.customerCity || report?.city;
  const installArea = trustConfig?.installArea ?? reportArea ?? company?.city ?? DEFAULT_INSTALL_AREA;
  const utilityName = report?.utilityName;
  const gallery: Array<{ before: string; after: string; caption?: string }> = trustConfig?.installGallery ?? [];

  const animatedCount = useCountUp(installCount, 1500, 400);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const scrollReviews = (dir: "left" | "right") => {
    playTapSound();
    if (!reviewsRef.current) return;
    reviewsRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}b0` }}>
          PROOF
        </p>
        <h2 className="text-[28px] font-bold mt-3 tracking-tight">Real Results</h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Families like yours, in your area
        </p>
      </div>

      {/* Install Counter */}
      <div className="rounded-2xl p-5 text-center space-y-1" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
        <Home className="size-6 mx-auto mb-1" style={{ color: colors.success }} />
        <p className="text-[36px] font-bold" style={{ color: colors.success }}>
          {animatedCount.toLocaleString()}+
        </p>
        <p className="text-[14px]" style={{ color: colors.textSecondary }}>
          Homes Protected in {installArea}
        </p>
      </div>

      {/* Local utility */}
      {utilityName && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: colors.surface }}>
          <div className="size-9 shrink-0 rounded-xl flex items-center justify-center text-lg" style={{ background: `${colors.primary}10` }}>
            💧
          </div>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>{utilityName}</p>
            <p className="text-[13px] mt-0.5" style={{ color: colors.textMuted }}>
              Your water provider — report data comes directly from their testing
            </p>
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
              Customer Reviews
            </p>
            {!hasCustomReviews && (
              <span className="text-[9px] font-medium rounded-md px-2 py-0.5" style={{ background: `${colors.warning}10`, color: `${colors.warning}90` }}>
                Examples — add yours in Settings
              </span>
            )}
          </div>
          {reviews.length > 2 && (
            <div className="flex gap-1">
              <button onClick={() => scrollReviews("left")} className="p-1 rounded-lg cursor-pointer" style={{ background: colors.surface }}>
                <ChevronLeft className="size-3.5" style={{ color: colors.textFaint }} />
              </button>
              <button onClick={() => scrollReviews("right")} className="p-1 rounded-lg cursor-pointer" style={{ background: colors.surface }}>
                <ChevronRight className="size-3.5" style={{ color: colors.textFaint }} />
              </button>
            </div>
          )}
        </div>
        <div ref={reviewsRef} className="swipe-disabled flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
          {reviews.map((r: any, i: number) => (
            <div key={i} className="shrink-0 w-64 snap-start rounded-2xl p-4 space-y-2" style={{ background: colors.surface }}>
              <StarRating rating={r.rating} />
              <p className="text-[14px] leading-relaxed italic" style={{ color: colors.textSecondary }}>
                "{r.quote}"
              </p>
              <p className="text-[12px] font-medium" style={{ color: colors.textFaint }}>— {r.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: colors.surface }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
          Certifications & Credentials
        </p>
        <div className="grid grid-cols-2 gap-2">
          {certs.map((cert: any, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-xl p-3" style={{ background: `${colors.textFaint}08` }}>
              <span className="text-lg">{cert.icon}</span>
              <span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>{cert.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Before/After Gallery */}
      {gallery.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: colors.textFaint }}>
            Before & After
          </p>
          <div className="swipe-disabled space-y-4">
            {gallery.map((item, i) => (
              <BeforeAfterSlider key={i} {...item} />
            ))}
          </div>
        </div>
      )}

      {gallery.length === 0 && (
        <div className="rounded-2xl border border-dashed p-6 text-center space-y-2" style={{ borderColor: colors.border }}>
          <Camera className="size-6 mx-auto" style={{ color: colors.textFaint }} />
          <p className="text-[14px]" style={{ color: colors.textMuted }}>Before & after photos will appear here</p>
          <p className="text-[12px]" style={{ color: colors.textFaint }}>Add them in Company Settings → Trust & Proof</p>
        </div>
      )}
    </div>
  );
}
