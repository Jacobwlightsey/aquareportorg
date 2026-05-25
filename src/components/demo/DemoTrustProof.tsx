/* ──── Sprint 2C: Trust & Proof Section ──── */

import { Award, Camera, ChevronLeft, ChevronRight, Home, ShieldCheck, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  company: any;
  /** Report data — used for local area info (city, state, utilityName) */
  report?: any;
  onNext: () => void;
  onBack: () => void;
}

/* ──── Default placeholder content (flag #5: placeholders for unconfigured) ──── */
const DEFAULT_REVIEWS = [
  {
    name: "Sarah M.",
    rating: 5,
    quote: "Our water tastes incredible now. My family noticed the difference on day one!",
  },
  {
    name: "Mike & Jen R.",
    rating: 5,
    quote: "No more stains on our fixtures. The installation was quick and professional.",
  },
  {
    name: "The Johnson Family",
    rating: 4,
    quote: "Worth every penny for our kids' health. Wish we had done this sooner.",
  },
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
        <Star
          key={i}
          className={`size-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-white/10"}`}
        />
      ))}
    </div>
  );
}

function BeforeAfterSlider({
  before,
  after,
  caption,
}: {
  before: string;
  after: string;
  caption?: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
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
        onMouseMove={(e) => {
          if (e.buttons === 1) handleMove(e.clientX);
        }}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        {/* After (bottom layer) */}
        <img
          src={after}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Before (clip to position) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={before}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ minWidth: containerWidth || "100%" }}
          />
        </div>
        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-white/90 shadow-lg">
            <ChevronLeft className="size-3 text-gray-800 -mr-0.5" />
            <ChevronRight className="size-3 text-gray-800 -ml-0.5" />
          </div>
        </div>
        {/* Labels */}
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black/50 text-white px-2 py-0.5 rounded-full">
          Before
        </span>
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/80 text-white px-2 py-0.5 rounded-full">
          After
        </span>
      </div>
      {caption && (
        <p className="text-xs text-white/40 text-center">{caption}</p>
      )}
    </div>
  );
}

export function DemoTrustProof({ company, report, onNext, onBack }: Props) {
  const trustConfig = (company as any)?.demoConfig?.trustSection;

  const hasCustomReviews = !!trustConfig?.reviews?.length;
  const reviews = hasCustomReviews ? trustConfig.reviews : DEFAULT_REVIEWS;
  const certs = trustConfig?.certifications?.length ? trustConfig.certifications : DEFAULT_CERTIFICATIONS;
  const installCount = trustConfig?.installCount ?? DEFAULT_INSTALL_COUNT;
  // Local area: prioritize trust config → report city+state → company city → fallback
  const reportArea = report?.city && report?.state ? `${report.city}, ${report.state}` : report?.city;
  const installArea = trustConfig?.installArea ?? reportArea ?? company?.city ?? DEFAULT_INSTALL_AREA;
  const utilityName = report?.utilityName;
  const gallery: Array<{ before: string; after: string; caption?: string }> =
    trustConfig?.installGallery ?? [];

  const animatedCount = useCountUp(installCount, 1500, 400);

  const reviewsRef = useRef<HTMLDivElement>(null);

  const scrollReviews = (dir: "left" | "right") => {
    playTapSound();
    if (!reviewsRef.current) return;
    const amount = 280;
    reviewsRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">
          PROOF
        </span>
        <h2 className="text-2xl font-black mt-3">
          Real Results
        </h2>
        <p className="text-sm text-white/40 mt-1.5">
          Families like yours, in your area
        </p>
      </div>

      {/* Install Counter */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center space-y-1">
        <Home className="size-6 text-emerald-400 mx-auto mb-1" />
        <p className="text-4xl font-black text-emerald-400">
          {animatedCount.toLocaleString()}+
        </p>
        <p className="text-sm text-white/60">
          Homes Protected in {installArea}
        </p>
      </div>

      {/* Local utility info — builds trust with specificity */}
      {utilityName && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start gap-3">
          <div className="size-9 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">
            💧
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">{utilityName}</p>
            <p className="text-xs text-white/40 mt-0.5">
              Your water provider — the report data comes directly from their testing
            </p>
          </div>
        </div>
      )}

      {/* Customer Reviews */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Customer Reviews
            </p>
            {!hasCustomReviews && (
              <span className="text-[9px] bg-amber-400/10 text-amber-400/70 border border-amber-400/20 rounded-full px-2 py-0.5">
                Examples — add yours in Settings
              </span>
            )}
          </div>
          {reviews.length > 2 && (
            <div className="flex gap-1">
              <button
                onClick={() => scrollReviews("left")}
                className="p-1 rounded-lg bg-white/5 active:bg-white/10 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                onClick={() => scrollReviews("right")}
                className="p-1 rounded-lg bg-white/5 active:bg-white/10 cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>
        <div
          ref={reviewsRef}
          className="swipe-disabled flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
        >
          {reviews.map((r: any, i: number) => (
            <div
              key={i}
              className="shrink-0 w-64 snap-start rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
            >
              <StarRating rating={r.rating} />
              <p className="text-sm text-white/70 leading-relaxed italic">
                "{r.quote}"
              </p>
              <p className="text-xs font-medium text-white/40">— {r.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Certifications & Credentials
        </p>
        <div className="grid grid-cols-2 gap-2">
          {certs.map((cert: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/5 p-3"
            >
              <span className="text-lg">{cert.icon}</span>
              <span className="text-sm font-medium text-white/70">{cert.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Before/After Gallery */}
      {gallery.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">
            Before & After
          </p>
          <div className="swipe-disabled space-y-4">
            {gallery.map((item, i) => (
              <BeforeAfterSlider key={i} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Placeholder when no gallery */}
      {gallery.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center space-y-2">
          <Camera className="size-6 text-white/20 mx-auto" />
          <p className="text-sm text-white/30">
            Before & after photos will appear here
          </p>
          <p className="text-xs text-white/20">
            Add them in Company Settings → Trust & Proof
          </p>
        </div>
      )}
    </div>
  );
}
