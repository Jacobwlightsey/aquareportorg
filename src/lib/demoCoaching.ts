/* ──── Sprint 3E: Dealer Confidence / Coaching Indicators ──── */

export type CoachingLevel = "green" | "yellow" | "red";

export interface CoachingState {
  level: CoachingLevel;
  tip: string;
}

export interface StepTiming {
  stepKey: string;
  enteredAt: number; // Date.now()
  duration: number; // seconds spent
  skipped?: boolean;
}

/**
 * Evaluate coaching state based on current step + timing data.
 */
export function evaluateCoaching(
  currentStep: string,
  stepEnteredAt: number,
  stepTimings: StepTiming[],
  contaminantLegalViolations: number,
  scoreRevealSkipped: boolean,
): CoachingState {
  const elapsed = (Date.now() - stepEnteredAt) / 1000;

  // Red conditions
  if (
    currentStep === "contaminants" &&
    elapsed < 30 &&
    contaminantLegalViolations >= 3
  ) {
    return {
      level: "red",
      tip: `Spend more time here — this customer has ${contaminantLegalViolations} legal violations to highlight. Walk through at least the top 3.`,
    };
  }

  // Yellow conditions
  if (scoreRevealSkipped && currentStep === "score") {
    return {
      level: "yellow",
      tip: "The score reveal was skipped. Consider pausing here to let the number sink in before moving on.",
    };
  }

  if (currentStep === "pricing" && elapsed < 20) {
    return {
      level: "yellow",
      tip: "Take your time on pricing. Let them process the program price before revealing the offer.",
    };
  }

  if (elapsed < 15 && elapsed > 3) {
    // Only flag after 3s to avoid false positives during initial render
    return {
      level: "yellow",
      tip: "You're moving quickly through this step. Consider spending a bit more time to let key points land.",
    };
  }

  // Green — everything looks good
  const greenTips: Record<string, string> = {
    intake: "Great — getting to know the customer upfront makes the whole demo more personal.",
    welcome: "Good pacing. Building rapport here sets the tone for the rest of the demo.",
    score: "Nice pause on the score. Letting it sink in is key.",
    contaminants: "Good coverage of the contaminants. Focus on the ones they care about most.",
    impact: "You're spending good time here. Making it personal is what closes deals.",
    rooms: "Solid — connecting water quality to their daily life in each room.",
    test: "Hands-on time is great for engagement. Let them participate.",
    transform: "This is the emotional moment. You're pacing it well.",
    boost: "Good — positioning the RO as a bonus, not an upsell.",
    system: "Focused feature walkthrough. Keep matching to their concerns.",
    trust: "Social proof is powerful. The numbers are doing the talking.",
    pricing: "Good pace on pricing. The reveal-to-offer contrast is landing.",
    comparison: "Making the daily cost tangible is the right approach.",
    customerClose: "Letting them review independently shows confidence in the product.",
    dealerClose: "Wrapping up cleanly. Offer next steps without pressure.",
  };

  return {
    level: "green",
    tip: greenTips[currentStep] ?? "You're pacing well. The customer is engaged.",
  };
}

/**
 * Build post-demo coaching summary from all step timings.
 */
export interface CoachingSummaryItem {
  stepKey: string;
  level: CoachingLevel;
  note: string;
  duration: number;
}

export function buildCoachingSummary(
  stepTimings: StepTiming[],
  contaminantLegalViolations: number,
  scoreRevealSkipped: boolean,
): CoachingSummaryItem[] {
  const items: CoachingSummaryItem[] = [];

  for (const st of stepTimings) {
    if (st.duration < 15 && st.stepKey !== "intake") {
      items.push({
        stepKey: st.stepKey,
        level: "yellow",
        note: `Only ${Math.round(st.duration)}s on ${st.stepKey} — consider spending more time here.`,
        duration: st.duration,
      });
    }

    if (
      st.stepKey === "contaminants" &&
      st.duration < 30 &&
      contaminantLegalViolations >= 3
    ) {
      items.push({
        stepKey: st.stepKey,
        level: "red",
        note: `${Math.round(st.duration)}s on contaminants with ${contaminantLegalViolations} legal violations — highlight these more next time.`,
        duration: st.duration,
      });
    }

    if (st.stepKey === "pricing" && st.duration < 20) {
      items.push({
        stepKey: st.stepKey,
        level: "yellow",
        note: `${Math.round(st.duration)}s on pricing — let them process the offer before moving on.`,
        duration: st.duration,
      });
    }
  }

  if (scoreRevealSkipped) {
    items.push({
      stepKey: "score",
      level: "yellow",
      note: "Score reveal was skipped. The cinematic reveal builds anticipation — let it play next time.",
      duration: 0,
    });
  }

  // Sort: red first, then yellow
  items.sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return order[a.level] - order[b.level];
  });

  return items;
}
