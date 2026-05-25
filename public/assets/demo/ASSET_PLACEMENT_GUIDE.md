# Demo Wizard — Asset Placement Guide

## How to Use These Assets

All assets are dark, atmospheric background images designed for the AquaReport Demo Wizard's dark theme (`#070B14` base). They go in `public/assets/demo/` and are referenced via `background-image` with a dark overlay so text/UI remains readable.

### Standard Implementation Pattern

```tsx
// In each component:
<div className="relative min-h-screen overflow-hidden">
  {/* Background asset */}
  <img
    src="/assets/demo/07_scoreReveal.png"
    alt=""
    className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
  />
  {/* Dark gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/80 via-[#070B14]/90 to-[#070B14]" />
  {/* Actual content */}
  <div className="relative z-10">
    {/* ... component content ... */}
  </div>
</div>
```

**Key:** Adjust `opacity-30` per screen. More visual screens (score, transform) can go `opacity-40`. Data-heavy screens (impact, pricing) should stay at `opacity-20` so cards stay readable.

---

## Asset Map — All 21 Steps + Overlays

### Opening Section

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 1 | **Intake** (Customer Setup) | `01_intake.png` | 25% | Pristine water droplet. Place behind the customer form card. The droplet centers naturally behind the form. |
| 2 | **Welcome** | `02_welcome.png` | 35% | Concentric water ripples with cyan bioluminescence. Full-bleed hero background. Sets the premium tone immediately. |

### Discovery Section

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 3 | **Home Profile** | `03_homeProfile.png` | 25% | Modern home silhouette with glowing cyan pipe network. Place behind the home info form. Subtle — shouldn't compete with input fields. |
| 4 | **Customer Concerns** | `04_customerConcerns.png` | 20% | Abstract water molecules with warm/cool clusters. Very subtle behind the 2-column concern grid. The cards are the focus, this just adds depth. |
| 5 | **Contaminant Walkthrough** | `05_contaminants.png` | 30% | Microscopic contaminant particles — molecules, bacteria in red/amber. Dramatic and slightly unsettling. Perfect for the "what's in your water" reveal. Place full-bleed behind the walkthrough cards. |
| 6 | **Top Concerns Review** | `06_topConcerns.png` | 25% | Three floating water spheres representing priority tiers. Subtle background behind the top 3 recap. |

### Scoring Section

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 7 | **Score Reveal** | `07_scoreReveal.png` | 35% | Circular ambient glow ring in dark space — mirrors the ScoreGauge shape. Position so the glow ring roughly aligns behind the actual gauge component. This is a KEY emotional moment — let the atmosphere show. |
| 8 | **Live Water Test** | `08_liveTest.png` | 30% | Premium test kit with glowing vials. Can be used as a hero image at the TOP of the test screen (not as a background), or as a subtle background. |
| 9 | **Verified Score** | `09_verifiedScore.png` | 30% | Glowing shield with checkmark — verification/trust. Place behind the verified score gauge. Reinforces the "confirmed" feeling. |

### Impact Section

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 10 | **Impact / Family Safety** | `10_impact.png` | 20% | Split contaminated vs. clean water visual. Keep very subtle (20%) — this screen has sidebar tabs + contaminant cards that need full readability. |
| 11 | **Room Impact** | `11_rooms.png` | 25% | Overhead home floor plan with glowing cyan pipe network. Place behind the room-by-room impact cards. |

### Solution Section

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 12 | **System Info** | `12_system.png` | 40% | **Hero product shot** — premium whole-home filtration system with cyan LED accents. This can be used TWO ways: (a) as a prominent hero image in the content area (not background), or (b) as a stronger background at 40% opacity. This is the product showcase moment. |
| 13 | **Score Transform** | `13_scoreTransform.png` | 35% | Three glowing rings (coral → amber → green) increasing in size. Aligns behind the 3 ScoreGauge components. Position so each ring roughly sits behind its gauge. KEY visual — let it breathe. |
| 14 | **Trust Proof** (City Skyline) | `14_trustProof.png` | 80–100% | **NOT a background** — this is a content image. Place it directly in the "Local data. Local experts. Local protection." section as a visible photograph. Use with a bottom gradient overlay for text legibility. This replaces the Unsplash URL. |

### Value Section

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 15 | **Cost Comparison** | `15_comparison.png` | 25% | Bottled water → clean glass visual metaphor. Subtle behind the comparison chart cards. |
| 16 | **Pricing** | `16_pricing.png` | 25% | Premium dark marble/stone surface with gold accents. Gives the pricing screen a luxury product-showcase feel. Subtle behind the $149/mo hero text. |
| 17 | **Score Boost** | `17_scoreBoost.png` | 30% | Upward trajectory of light particles (amber → teal → green). Mirrors the improvement arc. Place behind the boost gauge animation. |

### Close Section

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 18 | **Summary** | `18_summary.png` | 20% | Clean blueprint/plan pattern with spotlight. Very subtle — the 2-column layout with gauges and benefits needs clarity. |
| 19 | **Decision Point** | `19_decision.png` | 30% | Two diverging light paths — one fading, one bright cyan. Supports the "make the choice" moment. Place behind the decision buttons. |
| 20 | **Customer Close** | `20_customerClose.png` | 35% | Crystal-clear glass of water being filled from a premium faucet. Celebration of clean water achieved. Can also be used as a visible hero image (not just background). |
| 21 | **Dealer Close** | `21_dealerClose.png` | 20% | Premium notebook and pen on dark desk. Professional next-steps feeling. Subtle behind the dealer wrap-up form. |

### Transition Overlay

| # | Step | File | Opacity | Placement Notes |
|---|------|------|---------|-----------------|
| 22 | **Transition Overlay** | `22_transition_overlay.png` | 50% | **Portrait-oriented** (2:3 ratio). Glowing cyan water droplet with circular ripple rings. This replaces the plain dark overlay between steps. Layer: this image at 50% → dark overlay at 60% → transition text on top. The droplet serves as the focal point between the section title text and the "Tap anywhere to continue" footer. |

---

## File Structure for the Repo

```
public/
  assets/
    demo/
      01_intake.png
      02_welcome.png
      03_homeProfile.png
      04_customerConcerns.png
      05_contaminants.png
      06_topConcerns.png
      07_scoreReveal.png
      08_liveTest.png
      09_verifiedScore.png
      10_impact.png
      11_rooms.png
      12_system.png
      13_scoreTransform.png
      14_trustProof.png
      15_comparison.png
      16_pricing.png
      17_scoreBoost.png
      18_summary.png
      19_decision.png
      20_customerClose.png
      21_dealerClose.png
      22_transition_overlay.png
```

## Reusable Background Wrapper Component

Create `src/components/demo/DemoBackground.tsx`:

```tsx
interface DemoBackgroundProps {
  asset: string;          // filename from /assets/demo/
  opacity?: number;       // 0-100, default 25
  gradient?: "top" | "bottom" | "both";  // gradient direction
  children: React.ReactNode;
}

export function DemoBackground({
  asset,
  opacity = 25,
  gradient = "both",
  children,
}: DemoBackgroundProps) {
  const gradientClass = {
    top: "from-[#070B14] via-[#070B14]/80 to-transparent",
    bottom: "from-transparent via-[#070B14]/80 to-[#070B14]",
    both: "from-[#070B14]/80 via-[#070B14]/60 to-[#070B14]/90",
  }[gradient];

  return (
    <div className="relative">
      <img
        src={`/assets/demo/${asset}`}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: opacity / 100 }}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${gradientClass}`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

Usage:
```tsx
<DemoBackground asset="07_scoreReveal.png" opacity={35}>
  <DemoScoreReveal ... />
</DemoBackground>
```

---

## Quick Priority — Which Assets Matter Most

These 5 have the biggest visual impact. If time-constrained, start here:

1. **`13_scoreTransform.png`** — The 3 glowing rings behind the gauges. Iconic.
2. **`14_trustProof.png`** — City skyline replaces the Unsplash URL. Real content image.
3. **`05_contaminants.png`** — Microscopic particles sell the "what's in your water" fear.
4. **`12_system.png`** — Product hero shot. Makes the solution feel premium and tangible.
5. **`22_transition_overlay.png`** — The glowing droplet gives transitions that Apple keynote feel.
