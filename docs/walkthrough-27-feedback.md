# Post-Fix Walkthrough Feedback (Recording 27)

Jacob walked through the demo after the builder applied the fix prompt. Below is every item, organized by screen.

---

## 1. INTAKE (still broken)

**1.1 — "What concerns you most" section still present on intake page.**
It was supposed to be removed (fix prompt §4.2). Intake should ONLY show:
- Household info (people, kids, bathrooms, pets)
- Current water solution
- Start Demo button

The concern selection lives on page 3 (`customerConcerns`) — do NOT duplicate it on intake.

**1.2 — "Customer" label → "Homeowner"**
Bottom-left of demo shows "Customer: Emily Lightsey". Change the label from "Customer" to "Homeowner" everywhere in the demo UI. The person isn't a customer yet — they haven't bought anything. This is a sales demo.

---

## 2. CUSTOMER CONCERNS (page 3) ✅
Jacob likes it. Keep as-is. Just remove it from the intake page (§1.1).

---

## 3. TOP CONCERNS ✅
Loads first now. Clicking items shows chemicals. "View Full Breakdown" correctly navigates to contaminants. Looks great.

---

## 4. CONTAMINANTS

**4.1 — Clicking a specific chemical still shows no info.**
When tapping a contaminant, there's no detail about what the chemical is or how it affects the home/family. This was requested in fix prompt §5.1 but wasn't implemented.

Need: When you tap a chemical, show:
- **What it is** — plain-English 1-2 sentences
- **Health effects** — how it affects the family
- **Home effects** — how it affects the home (stains, appliance damage, etc.)

**4.2 — Swipe navigation is difficult on this page.**
Hard to swipe forward to the next step. Add a simple "Next" button at the bottom (like other pages have), while still keeping swipe functionality as a secondary option.

---

## 5. AQUASCORE REVEAL

**5.1 — Add AquaScore explanation.**
Page says "Your AquaScore — Based on 33 detected contaminants from GSW and SA." This is the first time the customer hears "AquaScore." They'll ask "What is that?"

Add a brief 1-2 sentence explanation of what an AquaScore is on this page, so the rep doesn't have to explain it verbally. Something like: *"Your AquaScore is a comprehensive water quality rating from 0-100, calculated by analyzing detected contaminants against EPA health standards and safety guidelines."*

**5.2 — Score result page: score needs to be the centerpiece.**
Currently the score gauge is in the top-right corner. It should be the big, centered focal point of the page. "Your water score is ready!" + the score gauge should dominate the center.

The "How is this score calculated" dropdown only has one sentence ("We analyzed your water quality..."). Add more substance — explain the scoring tiers (At Risk / Bronze / Silver / Gold), what factors go into it, how live test results modify it.

---

## 6. LIVE WATER TEST

**6.1 — Add sound effect when score drops.**
As the rep enters readings and the score drops in real-time, play a "losing points" sound effect. Makes the score drop feel more impactful for the customer — auditory feedback that reinforces "your water quality is going down."

Use the existing `demoSounds` system. Add a subtle descending tone or "penalty" sound that plays each time a reading causes the score to decrease.

---

## 7. VERIFIED SCORE

**7.1 — Show reading severity labels.**
Currently just shows "Chlorine Level, pH Level, Hardness" with no indication of whether the reading was good or bad. Show severity labels: "High", "Extreme", "Normal", etc.

**7.2 — Show before → after comparison.**
The customer won't remember their original score. Show:
- **Before live test:** 59 (or whatever the pre-test score was)
- **After live test:** 45
- **Why it changed:** "Your chlorine was extreme, pH was acidic, hardness was very hard"

Make the score change visual and obvious — the customer needs to see the delta.

---

## 8. IMPACT / FAMILY SAFETY

**8.1 — Info cards are great, but chemical lists underneath are confusing.**
Example: "Bottled Water" tab shows trihalomethanes underneath — how is that related to bottled water? The chemicals don't connect to the tab topic.

**Fix:** Remove the generic chemical dump. Instead, each tab's content should explain HOW those chemicals/readings specifically cause the issues described in the info cards. E.g., under "Bottled Water": explain why their water quality makes bottled water necessary, what's in their tap water that makes it taste bad.

**8.2 — Skin & Hair tab shows nothing.**
Despite high chlorine levels entered in the live test, the Skin & Hair tab is empty. The live test readings need to factor into the Impact page content. If chlorine was high, Skin & Hair should show chlorine's effects on skin and hair.

**8.3 — Content must be individualized.**
Based on BOTH the water report data AND the live test readings. Not generic content — personalized to this customer's actual results.

---

## 9. FLOW ORDER — MAJOR RESTRUCTURE (Jacob's exact specification)

Jacob explicitly walked through the correct order. This overrides the previous fix prompt §3.1.

### Correct step order:

```
PERSONALIZE
  1. intake              — Household info + water solution only (NO concerns)
  2. welcome             — Welcome / Agenda
  3. customerConcerns    — "What matters most to you"

DIAGNOSE
  4. topConcerns         — Quick overview of top 3 findings
  5. contaminants        — Full 33-contaminant breakdown
  6. score               — AquaScore reveal (with explanation of what AquaScore is)
  7. test                — Live water test (with sound effects)
  8. verifiedScore       — Verified score with before/after comparison

EMOTIONALIZE
  9. impact              — Family Safety / health impact (personalized tabs)

TRANSFORM
  10. scoreImprovement   — "This is how we're going to change your score" → reveal to 94
  11. system             — Filtration system product page (from Company Settings)
  12. trust              — "Trusted by Your Neighbors" (directly after system)

JUSTIFY
  13. comparison         — "What Unfiltered Water Actually Costs You" (editable, $0 start)
  14. pricing            — "Your Investment in Better Water" (overview)
  15. investmentBreakdown — Investment/pricing breakdown (retail, discounts, financing)

SCORE JOURNEY
  16. transform          — Score Journey with 3 stages:
                           Stage 1: Score before live test (original AquaScore)
                           Stage 2: Score after live test (verified score)
                           Stage 3: Score with filtration system (the 94)

UPSELL
  17. boost              — "Go Even Further" (free RO system upsell)

CLOSE
  18. summary            — "Your Home Water Plan"
  19. decision           — "What Makes Sense For You"
  20. customerClose      — Customer handoff
  21. dealerClose        — Dealer wrap-up
```

### Key differences from previous fix prompt order:
- **`trust` moves to directly AFTER `system`** (not near the end)
- **Score improvement reveal comes right after impact** (before system/product page)
- **Score Journey (transform) moves to AFTER investment breakdown** — 3-stage comparison
- **System/product page must exist** — Jacob says it was removed. Restore it with filtration system info from Company Settings.
- **`rooms` step is gone** — replaced by `system` (the product page)

---

## SUMMARY OF UNIMPLEMENTED ITEMS FROM PREVIOUS PROMPT

These items from the original fix prompt were NOT implemented by the builder:
1. ❌ Remove "What concerns you most" from intake (§4.2)
2. ❌ Contaminant detail cards with real info (§5.1)
3. ❌ Impact tab content rewrite (§7.1)
4. ❌ Correct step order
5. ? Score labels (need to verify if At Risk/Bronze/Silver/Gold was applied)
6. ? Scoring math fix (need to verify)

---

## VERIFICATION CHECKLIST

After this round of fixes:
- [ ] Intake page: household info + water solution ONLY. No concern selection.
- [ ] "Customer" → "Homeowner" everywhere in demo UI
- [ ] Clicking a contaminant shows what it is + health effects + home effects
- [ ] Contaminants page has a Next button at bottom
- [ ] AquaScore reveal page explains what an AquaScore is
- [ ] Score result: gauge centered, more explanation in "How calculated" section
- [ ] Live test: sound effect plays when score drops
- [ ] Verified score: shows severity labels + before/after comparison
- [ ] Impact tabs: personalized content (no chemical dumps), uses live test data
- [ ] Step order matches §9 exactly
- [ ] System/product page exists with company filtration system info
- [ ] Trust page comes directly after system
- [ ] Score Journey has 3 stages (before test, after test, with system)
- [ ] "Homeowner" not "Customer" in all labels
