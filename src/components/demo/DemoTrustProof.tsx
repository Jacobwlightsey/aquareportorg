/* ──── Trust & Proof — "Trusted by Your Neighbors" ────
   Mockup-faithful: 2 stat cards side by side + city skyline photo at bottom.
   Reviews and certifications below the skyline as secondary.
   ──── */

import { ChevronLeft, ChevronRight, Home, ShieldCheck, Star } from "lucide-react";
import { useRef } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/designTokens";
import type { CompanyForDemo } from "@/lib/types";

interface Props {
  company: CompanyForDemo;
  report?: any;
  onNext: () => void;
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
const DEFAULT_SKYLINE = "/assets/demo/14_trustProof.png";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : ""}`} style={i > rating ? { color: colors.textFaint } : undefined} />
      ))}
    </div>
  );
}

export function DemoTrustProof({ company, report, onNext: _onNext }: Props) {
  const trustConfig = company?.demoConfig?.trustSection;
  const hasCustomReviews = !!trustConfig?.reviews?.length;
  const reviews = hasCustomReviews ? trustConfig.reviews : DEFAULT_REVIEWS;
  const certs = trustConfig?.certifications?.length ? trustConfig.certifications : DEFAULT_CERTIFICATIONS;
  const installCount = trustConfig?.installCount ?? DEFAULT_INSTALL_COUNT;
  const skylineUrl = trustConfig?.citySkyline ?? DEFAULT_SKYLINE;

  const reportArea =
    (report?.customerCity || report?.city) && (report?.customerState || report?.state)
      ? `${report.customerCity || report.city}, ${report.customerState || report.state}`
      : report?.customerCity || report?.city;
  const installArea = trustConfig?.installArea ?? reportArea ?? company?.city ?? "your area";
  const utilityName = report?.utilityName;

  const animatedCount = useCountUp(installCount, 1500, 400);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const scrollReviews = (dir: "left" | "right") => {
    playTapSound();
    if (!reviewsRef.current) return;
    reviewsRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight" style={{ color: colors.textPrimary }}>
          Trusted by Your Neighbors
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Real homes. Real results.
        </p>
      </div>

      {/* Two stat cards side by side */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Homes Protected */}
        <div className="rounded-2xl p-6 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <Home className="size-7 mx-auto mb-3" style={{ color: colors.success }} />
          <p className="text-[36px] font-bold leading-none" style={{ color: colors.success }}>
            {animatedCount.toLocaleString()}+
          </p>
          <p className="text-[15px] font-medium mt-2" style={{ color: colors.textSecondary }}>
            Homes Protected
          </p>
          <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>
            in {installArea}
          </p>
        </div>

        {/* Water Provider */}
        <div className="rounded-2xl p-6 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <ShieldCheck className="size-7 mx-auto mb-3" style={{ color: colors.primary }} />
          <p className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>
            {utilityName || "Your Water Provider"}
          </p>
          <p className="text-[13px] mt-2" style={{ color: colors.textMuted }}>
            This data comes from
          </p>
          <p className="text-[13px] font-bold" style={{ color: colors.primary }}>
            YOUR water provider
          </p>
        </div>
      </div>

      {/* City skyline photo */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-48">
        <img
          src={skylineUrl}
          alt="City skyline"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${colors.bg}ee 0%, ${colors.bg}80 40%, transparent 100%)` }}
        />
        {/* Text overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-[14px] font-medium tracking-wide" style={{ color: colors.textMuted }}>
            🏠 Local data. Local experts. Local protection.
          </p>
        </div>
      </div>

      {/* Reviews — secondary */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
            Customer Reviews
          </p>
          {reviews.length > 2 && (
            <div className="flex gap-1">
              <button onClick={() => scrollReviews("left")} className="p-1.5 rounded-lg cursor-pointer" style={{ background: colors.surface }}>
                <ChevronLeft className="size-4" style={{ color: colors.textFaint }} />
              </button>
              <button onClick={() => scrollReviews("right")} className="p-1.5 rounded-lg cursor-pointer" style={{ background: colors.surface }}>
                <ChevronRight className="size-4" style={{ color: colors.textFaint }} />
              </button>
            </div>
          )}
        </div>
        <div ref={reviewsRef} className="swipe-disabled flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
          {reviews.map((r: any, i: number) => (
            <div key={i} className="shrink-0 w-64 snap-start rounded-2xl p-4 space-y-2" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <StarRating rating={r.rating} />
              <p className="text-[13px] leading-relaxed italic" style={{ color: colors.textSecondary }}>"{r.quote}"</p>
              <p className="text-[11px] font-medium" style={{ color: colors.textFaint }}>— {r.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.textFaint }}>
          Certifications & Credentials
        </p>
        <div className="flex gap-3 flex-wrap">
          {certs.map((cert: any, i: number) => (
            <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: `${colors.textFaint}08` }}>
              <span className="text-base">{cert.icon}</span>
              <span className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>{cert.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
