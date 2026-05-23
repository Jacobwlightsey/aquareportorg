type Contaminant = {
  contaminant?: string;
  name?: string;
  detected?: boolean;
  detection_status?: "detected" | "not_detected" | "trace" | "unknown";
  detected_level?: number;
  value?: number;
  unit?: string;
  legal_limit?: number | null;
  health_guideline?: number | null;
  over_legal?: boolean;
  over_health?: boolean;
  times_above_ewg?: number | null;
  effect?: string | null;
  source_type?: string;
};

type SolutionProduct = {
  name: string;
  description: string;
  image?: string;
  bullets: string[];
};

type ReportTemplateParams = {
  customerName: string;
  customerAddress?: string;
  customerCityStateZip: string;
  customerPhone?: string;
  companyName: string;
  companyPhone?: string;
  accentColor: string;
  score: number;
  utilityName: string;
  waterSource: string;
  populationServed?: number;
  city?: string;
  state?: string;
  zip?: string;
  contaminants: Contaminant[];
  overHealth: number;
  overLegal: number;
  chlorine?: number;
  hardness?: number;
  tds?: number;
  ph?: number;
  testNotes?: string;
  repName?: string;
  repDate?: string;
  repPhone?: string;
  products?: SolutionProduct[];
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cName(c: Contaminant) {
  return c.contaminant || c.name || "Unknown";
}

function isDetected(c: Contaminant): boolean {
  return c.detected !== false && c.detection_status !== "not_detected";
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trihalomethane") || n.includes("tthm") || n.includes("bromate"))
    return "Disinfection Byproduct";
  if (n.includes("haloacetic")) return "Haloacetic Acid";
  if (n.includes("radium") || n.includes("uranium") || n.includes("radon") || n.includes("gross alpha"))
    return "Radioactive Element";
  if (n.includes("lead") || n.includes("chromium") || n.includes("mercury") || n.includes("arsenic") || n.includes("cadmium"))
    return "Heavy Metal";
  if (n.includes("butadiene") || n.includes("benzene") || n.includes("vinyl"))
    return "Industrial Chemical";
  if (n.includes("barium") || n.includes("molybdenum") || n.includes("strontium") || n.includes("vanadium") || n.includes("manganese"))
    return "Heavy Metal / Mineral";
  if (n.includes("fluoride")) return "Water Additive";
  if (n.includes("nitrate") || n.includes("nitrite")) return "Fertilizer / Runoff";
  return "Chemical";
}

function healthDescription(c: Contaminant): string {
  const n = cName(c).toLowerCase();
  if (n.includes("trihalomethane") || n.includes("tthm"))
    return "THMs form when chlorine reacts with organic matter. Long-term exposure is linked to increased risk of bladder cancer, colon cancer, and reproductive problems.";
  if (n.includes("haloacetic"))
    return "Haloacetic acids form during chlorine disinfection. Associated with liver and kidney damage, nervous system effects, and increased cancer risk.";
  if (n.includes("bromate"))
    return "Bromate forms as a byproduct of water disinfection with ozone. Long-term exposure is associated with increased cancer risk and kidney damage.";
  if (n.includes("radium"))
    return "Radium is a naturally occurring radioactive element. Long-term exposure increases risk of bone cancer and other cancers.";
  if (n.includes("chromium"))
    return "Hexavalent chromium is a known carcinogen linked to stomach cancer, liver damage, and reproductive harm.";
  if (n.includes("butadiene"))
    return "1,3-Butadiene is classified as a known human carcinogen linked to leukemia and lymphoma.";
  if (n.includes("lead"))
    return "Lead is a toxic heavy metal with no safe level. It causes brain damage in children, kidney disease, and cardiovascular problems.";
  if (c.effect) return c.effect;
  return "Elevated levels may pose health risks with long-term exposure.";
}

function letterGrade(score: number): { letter: string; label: string; color: string; bg: string; tier: string } {
  if (score >= 80) return { letter: "A", label: "Gold", color: "#16a34a", bg: "#f0fdf4", tier: "Gold" };
  if (score >= 60) return { letter: "B", label: "Silver", color: "#d97706", bg: "#fffbeb", tier: "Silver" };
  if (score >= 40) return { letter: "C", label: "Bronze", color: "#ea580c", bg: "#fff7ed", tier: "Bronze" };
  if (score >= 20) return { letter: "D", label: "At Risk", color: "#dc2626", bg: "#fef2f2", tier: "At Risk" };
  return { letter: "F", label: "At Risk", color: "#991b1b", bg: "#fef2f2", tier: "At Risk" };
}

function legalGradeInfo(violations: number): { letter: string; label: string; color: string } {
  if (violations === 0) return { letter: "A", label: "No violations", color: "#16a34a" };
  if (violations === 1) return { letter: "B", label: `${violations} legal violation`, color: "#d97706" };
  if (violations <= 3) return { letter: "C", label: `${violations} legal violations`, color: "#ea580c" };
  return { letter: "D", label: `${violations} legal violations`, color: "#dc2626" };
}

function healthGradeInfo(exceeding: number): { letter: string; label: string; color: string } {
  if (exceeding === 0) return { letter: "A", label: "All within guidelines", color: "#16a34a" };
  if (exceeding <= 2) return { letter: "B", label: `${exceeding} contaminants exceed`, color: "#d97706" };
  if (exceeding <= 5) return { letter: "C", label: `${exceeding} contaminants exceed`, color: "#ea580c" };
  return { letter: "D", label: `${exceeding} contaminants exceed`, color: "#dc2626" };
}

function formatNum(n: number | undefined | null): string {
  if (n == null) return "0";
  return n.toLocaleString("en-US");
}

function filtrationReduction(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("chlor") || n.includes("trihalomethane") || n.includes("tthm") || n.includes("haloacetic") || n.includes("haa")) return 0.05;
  if (n.includes("lead") || n.includes("mercury") || n.includes("arsenic") || n.includes("cadmium") || n.includes("chromium") || n.includes("copper") || n.includes("barium")) return 0.1;
  if (n.includes("benzene") || n.includes("butadiene") || n.includes("ethylene") || n.includes("vinyl") || n.includes("tetrachloro") || n.includes("trichloro")) return 0.08;
  if (n.includes("radium") || n.includes("uranium") || n.includes("radon") || n.includes("gross alpha") || n.includes("gross beta")) return 0.2;
  if (n.includes("nitrate") || n.includes("nitrite")) return 0.25;
  if (n.includes("fluoride")) return 0.3;
  return 0.35;
}


function buildScoreImprovementPage(params: ReportTemplateParams): string {
  const detected = params.contaminants.filter(c => isDetected(c) && (c.detected_level ?? 0) > 0);
  const currentScore = params.score;
  const currentGrade = letterGrade(currentScore);

  // Always project to Gold tier (80+)
  const projectedScore = Math.max(85, Math.min(98, currentScore + Math.max(20, 85 - currentScore)));
  const projectedGrade = letterGrade(projectedScore);
  const scoreDelta = projectedScore - currentScore;

  // Build improvement rows for contaminants over health/legal guidelines
  const improvements = detected
    .filter(c => c.over_health || c.over_legal)
    .map(c => {
      const factor = filtrationReduction(cName(c));
      const current = c.detected_level ?? 0;
      const projected = +(current * factor).toFixed(3);
      const guideline = c.health_guideline ?? c.legal_limit ?? 0;
      const nowSafe = guideline > 0 && projected <= guideline;
      return { name: cName(c), current, projected, unit: c.unit ?? "", guideline, nowSafe, reduction: Math.round((1 - factor) * 100) };
    })
    .sort((a, b) => b.reduction - a.reduction);

  const resolved = improvements.filter(i => i.nowSafe).length;

  const rows = improvements.slice(0, 8).map((item, i) =>
    `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
      <td style="padding:8px 12px;font-weight:500;color:#1e293b">${esc(item.name)}</td>
      <td style="padding:8px 12px;text-align:right;color:#dc2626;font-weight:600">${esc(item.current)} ${esc(item.unit)}</td>
      <td style="padding:8px 12px;text-align:right;color:#16a34a;font-weight:600">${esc(item.projected)} ${esc(item.unit)}</td>
      <td style="padding:8px 12px;text-align:right;color:#64748b">${item.guideline ? `${esc(item.guideline)} ${esc(item.unit)}` : '—'}</td>
      <td style="padding:8px 12px;text-align:center">${item.nowSafe
        ? '<span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600">✓ Safe</span>'
        : '<span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600">↓ Reduced</span>'
      }</td>
    </tr>`
  ).join("\n");

  return `<div class="page" style="padding:40px">
  <div class="page-header">
    <span class="section-label">Score Improvement Projection</span>
    <span class="utility-label">${esc(params.utilityName)}</span>
  </div>

  <h2 style="font-size:28px;font-weight:700;color:#0f172a" class="serif">How Filtration Improves Your Score</h2>
  <p style="margin-top:8px;font-size:12px;color:#475569">
    Installing a whole-home advanced filtration system can dramatically improve your water quality. Here's what your AquaScore could look like after professional filtration.
  </p>

  <!-- Before / After cards -->
  <div style="margin-top:24px;display:flex;align-items:center;gap:16px">
    <div style="flex:1;border:2px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;background:#fff">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#64748b;text-transform:uppercase">Current Score</div>
      <div style="margin-top:8px;font-size:56px;font-weight:700;color:${currentGrade.color}" class="serif">${currentScore}</div>
      <div style="margin-top:4px;font-size:13px;font-weight:600;color:${currentGrade.color}">${currentGrade.tier}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#10b981);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px">→</div>
      <span style="font-size:11px;font-weight:700;color:#16a34a">+${scoreDelta} pts</span>
    </div>
    <div style="flex:1;border:2px solid ${projectedGrade.color}40;border-radius:12px;padding:24px;text-align:center;background:#fff">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#64748b;text-transform:uppercase">After Filtration</div>
      <div style="margin-top:8px;font-size:56px;font-weight:700;color:${projectedGrade.color}" class="serif">${projectedScore}</div>
      <div style="margin-top:4px;font-size:13px;font-weight:600;color:${projectedGrade.color}">${projectedGrade.tier}</div>
    </div>
  </div>

  <!-- Stats -->
  <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#15803d">+${scoreDelta}</div>
      <div style="margin-top:4px;font-size:10px;font-weight:500;color:#16a34a">Point Improvement</div>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#1d4ed8">${resolved}</div>
      <div style="margin-top:4px;font-size:10px;font-weight:500;color:#2563eb">Contaminants Resolved</div>
    </div>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#b45309">${improvements.length}</div>
      <div style="margin-top:4px;font-size:10px;font-weight:500;color:#d97706">Contaminants Improved</div>
    </div>
  </div>

  <!-- Table -->
  <div style="margin-top:20px">
    <div style="font-size:13px;font-weight:700;color:#0f172a">📈 Projected Contaminant Reductions</div>
    <table style="width:100%;margin-top:8px;border-collapse:collapse;font-size:11px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Contaminant</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Current</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">After Filtration</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Guideline</th>
          <th style="padding:8px 12px;text-align:center;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- CTA -->
  <div style="margin-top:20px;background:linear-gradient(135deg,#0f2444,#1a3a6c);border-radius:12px;padding:24px;color:#fff;text-align:center">
    <div style="font-size:28px">⚡</div>
    <div style="margin-top:8px;font-size:20px;font-weight:700">Take Action Today</div>
    <p style="margin-top:8px;font-size:12px;color:#bfdbfe;max-width:400px;margin-left:auto;margin-right:auto">
      A whole-home filtration system from ${esc(params.companyName)} could raise your AquaScore
      from <strong style="color:#fff">${currentScore}</strong> to <strong style="color:#6ee7b7">${projectedScore}</strong> —
      resolving ${resolved} contaminant${resolved !== 1 ? 's' : ''} and protecting your family's health.
    </p>
    <p style="margin-top:12px;font-size:11px;color:rgba(191,219,254,0.8);font-style:italic">
      Contact your water specialist for a free in-home consultation.
    </p>
  </div>

  <div class="page-footer"><div class="page-footer-inner"><span>Personalized Water Report</span><span>Page 6</span></div></div>
</div>`;
}

export function buildReportHtml(params: ReportTemplateParams): string {
  const junk = [
    "reverse osmosis", "how your levels compare", "surface water treatment rule",
    "consumer confidence rule", "lead and copper rule", "total coliform rule",
    "ground water rule", "filter backwash", "disinfection byproducts rule",
    "enhanced surface water", "aircraft drinking water",
  ];
  const filtered = params.contaminants
    .filter((item) => !junk.some((blocked) => cName(item).toLowerCase().includes(blocked)))
    .filter(isDetected);

  const overHealthList = filtered.filter((c) => c.over_health);
  const belowHealthList = filtered.filter((c) => !c.over_health);
  const legalViolations = filtered.filter((c) => c.over_legal).length;
  const totalContaminants = filtered.length;
  const healthExceedances = overHealthList.length;
  const belowGuidelines = belowHealthList.length;

  const overall = letterGrade(params.score);
  const legal = legalGradeInfo(legalViolations);
  const health = healthGradeInfo(healthExceedances);

  // Top contaminants by severity
  const topContaminants = [...overHealthList]
    .sort((a, b) => {
      const aScore = (a.over_legal ? 1000 : 0) + (a.times_above_ewg ?? 0);
      const bScore = (b.over_legal ? 1000 : 0) + (b.times_above_ewg ?? 0);
      return bScore - aScore;
    })
    .slice(0, 4);

  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const city = params.city || "";
  const state = params.state || "";
  const zip = params.zip || "";
  const populationServed = params.populationServed || 0;
  const waterSource = params.waterSource || "Unknown";

  // Products / solutions
  const products = params.products && params.products.length > 0
    ? params.products
    : [{
        name: "Whole Home Advanced Filtration System",
        description: "Hand-picked for this home's water profile and designed to protect every tap.",
        bullets: ["Reduces chemicals, heavy metals, and harmful contaminants", "Protects your health and home", "Improves taste, skin, and hair", "High capacity, low maintenance"],
      }];

  // ─── Exceeding table rows ───
  const exceedingRows = overHealthList
    .map(
      (c, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
        <td style="padding:8px 10px;font-weight:600;color:#0f172a">${esc(cName(c))}</td>
        <td style="padding:8px 6px;color:#334155">${c.detected_level ?? "–"} ${esc(c.unit ?? "")}</td>
        <td style="padding:8px 6px;color:#64748b">${c.health_guideline != null ? `${c.health_guideline} ${esc(c.unit ?? "")}` : "N/A"}</td>
        <td style="padding:8px 6px;color:#64748b">${c.legal_limit != null ? `${c.legal_limit} ${esc(c.unit ?? "")}` : "N/A"}</td>
        <td style="padding:8px 6px;font-weight:700;color:#0f172a">${c.times_above_ewg ? `${Math.round(c.times_above_ewg)}×` : "–"}</td>
        <td style="padding:8px 6px"><span style="display:inline-block;background:#dc2626;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px">Exceeds</span></td>
        <td style="padding:8px 6px;color:#64748b">${esc(guessCategory(cName(c)))}</td>
      </tr>`,
    )
    .join("");

  // ─── Below-guideline table rows ───
  const belowRows = belowHealthList
    .map(
      (c, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
        <td style="padding:8px 10px;font-weight:600;color:#0f172a">${esc(cName(c))}</td>
        <td style="padding:8px 6px;color:#334155">${c.detected_level ?? "–"} ${esc(c.unit ?? "")}</td>
        <td style="padding:8px 6px;color:#64748b">${c.legal_limit != null ? `${c.legal_limit} ${esc(c.unit ?? "")}` : "N/A"}</td>
        <td style="padding:8px 6px"><span style="display:inline-block;background:#059669;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px">Meets</span></td>
        <td style="padding:8px 6px;color:#64748b">${esc(guessCategory(cName(c)))}</td>
      </tr>`,
    )
    .join("");

  // ─── Contaminant details cards ───
  const detailCards = topContaminants
    .map((c) => {
      const timesOver = c.times_above_ewg ? `${Math.round(c.times_above_ewg)}× above guideline` : "";
      const cat = guessCategory(cName(c));
      return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:14px">
        <div style="font-size:15px;font-weight:700;color:#0f172a">${esc(cName(c))}</div>
        <div style="margin-top:2px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px">${esc(cat)}${timesOver ? ` · ${timesOver}` : ""}</div>
        <p style="margin-top:12px;font-size:12px;line-height:1.6;color:#334155">${esc(healthDescription(c))}</p>
        <div style="margin-top:12px;border-top:1px solid #f1f5f9;padding-top:10px;font-size:11px;color:#64748b;display:flex;gap:24px">
          <span>Detected: <strong style="color:#0f172a">${c.detected_level ?? "–"} ${esc(c.unit ?? "")}</strong></span>
          <span>Guideline: <strong style="color:#0f172a">${c.health_guideline != null ? `${c.health_guideline} ${esc(c.unit ?? "")}` : "N/A"}</strong></span>
          <span>Legal: <strong style="color:#0f172a">${c.legal_limit != null ? `${c.legal_limit} ${esc(c.unit ?? "")}` : "N/A"}</strong></span>
        </div>
      </div>`;
    })
    .join("");

  // ─── Products cards ───
  const productCards = products
    .map((p) => {
      const bulletHtml = p.bullets
        .map(
          (b) => `<div style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#334155;margin-bottom:5px">
            <span style="color:#059669;font-weight:bold;flex-shrink:0">✓</span>
            <span>${esc(b)}</span>
          </div>`,
        )
        .join("");
      return `<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:14px">
        <div style="display:flex">
          <div style="width:160px;flex-shrink:0;background:#f8fafc;display:flex;align-items:center;justify-content:center;padding:16px;border-right:1px solid #e2e8f0">
            ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" style="max-height:140px;max-width:100%;object-fit:contain" />` : `<div style="color:#cbd5e1;text-align:center"><div style="font-size:40px">🛡️</div><div style="font-size:10px;margin-top:4px">Filtration System</div></div>`}
          </div>
          <div style="flex:1;padding:20px">
            <div style="font-size:15px;font-weight:700;color:#0f172a">${esc(p.name)}</div>
            <p style="margin-top:6px;font-size:12px;color:#475569;line-height:1.5">${esc(p.description)}</p>
            <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">${bulletHtml}</div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .page {
    width: 816px;
    min-height: 1056px;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    page-break-after: always;
    background: #fff;
  }
  .page:last-child {
    page-break-after: auto;
  }

  .serif { font-family: 'Playfair Display', Georgia, serif; }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 8px;
    margin-bottom: 24px;
  }
  .page-header .section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #1e293b;
    text-transform: uppercase;
  }
  .page-header .utility-label {
    font-size: 11px;
    color: #64748b;
  }

  .page-footer {
    margin-top: auto;
    padding-top: 24px;
  }
  .page-footer-inner {
    border-top: 1px solid #cbd5e1;
    padding-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    color: #94a3b8;
  }

  .amber-callout {
    border: 1px solid #fde68a;
    background: rgba(254, 243, 199, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;
  }
  .amber-callout .title {
    font-size: 12px;
    font-weight: 600;
    color: #92400e;
  }
  .amber-callout p {
    margin-top: 6px;
    font-size: 11.5px;
    line-height: 1.6;
    color: #334155;
  }

  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th {
    background: #1a2332;
    color: #fff;
    text-align: left;
    padding: 10px 6px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  th:first-child { padding-left: 10px; }
</style>
</head>
<body>

<!-- ═════════════════════════════════════════════════
     PAGE 1 — COVER
     ═════════════════════════════════════════════════ -->
<div class="page" style="padding:0">
  <div style="flex:1;display:flex;flex-direction:column;padding:48px;color:#fff;background:linear-gradient(160deg,#0a1628 0%,#0f2444 40%,#162d50 70%,#0a1628 100%)">
    <div style="height:96px"></div>
    <div style="border:1px solid rgba(100,116,139,0.4);border-radius:4px;padding:8px 16px;display:inline-block;align-self:flex-start">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;color:#cbd5e1;text-transform:uppercase">Personalized Water Quality Analysis</span>
    </div>
    <h1 style="margin-top:32px" class="serif">
      <span style="display:block;font-size:56px;font-weight:700;line-height:1.1;color:#fff">Your Home's</span>
      <span style="display:block;font-size:56px;font-weight:700;line-height:1.1;color:#6ba3d6">Water Report</span>
    </h1>
    <p style="margin-top:20px;font-size:15px;line-height:1.6;color:#cbd5e1;max-width:420px">
      A detailed analysis of contaminants detected in your local water supply by ${esc(params.utilityName)}.
    </p>
    <div style="margin-top:48px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:24px;max-width:340px;backdrop-filter:blur(4px)">
      <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:#94a3b8;text-transform:uppercase">Prepared For</span>
      <div style="margin-top:8px;font-size:20px;font-weight:700;color:#fff" class="serif">${esc(params.customerName)}</div>
      <div style="margin-top:8px;font-size:13px;color:#cbd5e1;line-height:1.6">
        ${params.customerAddress ? `<div>${esc(params.customerAddress)}</div>` : ""}
        <div>${esc(params.customerCityStateZip)}</div>
        ${params.customerPhone ? `<div>${esc(params.customerPhone)}</div>` : ""}
      </div>
    </div>
    <div style="flex:1"></div>
    <div style="border-top:1px solid rgba(71,85,105,0.4);padding-top:12px;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#94a3b8">
      <span>${esc(reportDate)}</span>
      <span>Powered by AquaReport</span>
    </div>
  </div>
</div>

<!-- ═════════════════════════════════════════════════
     PAGE 2 — WATER QUALITY OVERVIEW
     ═════════════════════════════════════════════════ -->
<div class="page" style="padding:40px">
  <div class="page-header">
    <span class="section-label">Water Quality Overview</span>
    <span class="utility-label">${esc(params.utilityName)}</span>
  </div>

  <h2 style="font-size:28px;font-weight:700;color:#0f172a" class="serif">Water Quality Score</h2>
  <p style="margin-top:8px;font-size:14px;color:#475569">
    Your water is supplied by ${esc(params.utilityName)}, serving approximately ~${formatNum(populationServed)} residents in the ${esc(city)}, ${esc(state)} area.
  </p>

  <!-- Score cards -->
  <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
    <div style="border-radius:8px;border:1px solid ${overall.color}30;background:${overall.bg};padding:20px;text-align:center">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#475569;text-transform:uppercase">AquaScore</div>
      <div style="margin-top:8px;font-size:52px;font-weight:700;color:${overall.color}" class="serif">${params.score}</div>
      <div style="margin-top:4px;font-size:12px;font-weight:600;color:${overall.color}">${overall.tier}</div>
    </div>
    <div style="border-radius:8px;border:1px solid ${legal.color}30;background:#fffbeb;padding:20px;text-align:center">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#475569;text-transform:uppercase">Legal Compliance</div>
      <div style="margin-top:8px;font-size:60px;font-weight:700;color:${legal.color}" class="serif">${legal.letter}</div>
      <div style="margin-top:4px;font-size:11px;color:#64748b">${legal.label}</div>
    </div>
    <div style="border-radius:8px;border:1px solid ${health.color}30;background:#fef2f2;padding:20px;text-align:center">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;color:#475569;text-transform:uppercase">Health Guidelines</div>
      <div style="margin-top:8px;font-size:60px;font-weight:700;color:${health.color}" class="serif">${health.letter}</div>
      <div style="margin-top:4px;font-size:11px;color:#64748b">${health.label}</div>
    </div>
  </div>

  <!-- What does this mean -->
  <div class="amber-callout">
    <div class="title">⚠️ What does this mean?</div>
    <p>While your water may meet EPA legal minimums, it does <strong>not</strong> meet stricter health-based guidelines recommended by independent health organizations. Many federal standards have not been updated in decades, while scientific research has identified health risks at far lower concentrations.</p>
  </div>

  <!-- Utility info -->
  <div style="margin-top:20px;border:1px solid #e2e8f0;border-radius:8px;padding:20px">
    <div style="font-size:14px;font-weight:700;color:#0f172a">Your Water Utility</div>
    <div style="margin-top:12px;display:grid;grid-template-columns:120px 1fr;gap:8px;font-size:12px">
      <span style="color:#64748b">Provider</span><span style="font-weight:600;color:#1e293b">${esc(params.utilityName)}</span>
      <span style="color:#64748b">Population Served</span><span style="font-weight:600;color:#1e293b">~${formatNum(populationServed)}</span>
      <span style="color:#64748b">Water Source</span><span style="font-weight:600;color:#1e293b">${esc(waterSource)}</span>
      <span style="color:#64748b">Location</span><span style="font-weight:600;color:#1e293b">${esc(city)}, ${esc(state)} ${esc(zip)}</span>
    </div>
  </div>

  <!-- Stat boxes -->
  <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px">
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#0f172a">${totalContaminants}</div>
      <div style="margin-top:4px;font-size:10px;color:#64748b;line-height:1.3">Total Contaminants<br/>Detected</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#dc2626">${healthExceedances}</div>
      <div style="margin-top:4px;font-size:10px;color:#64748b;line-height:1.3">Exceeding Health<br/>Guidelines</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#16a34a">${belowGuidelines}</div>
      <div style="margin-top:4px;font-size:10px;color:#64748b;line-height:1.3">Detected Below<br/>Guidelines</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#d97706">${legalViolations}</div>
      <div style="margin-top:4px;font-size:10px;color:#64748b;line-height:1.3">EPA Legal Limit<br/>Violations</div>
    </div>
  </div>

  <!-- Water source info -->
  <div style="margin-top:20px;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
    <div style="font-size:12px;font-weight:600;color:#1e293b">💧 About Your Water Source</div>
    <p style="margin-top:6px;font-size:11.5px;line-height:1.6;color:#475569">
      Your water is drawn from <strong>${waterSource.toLowerCase().includes("ground") ? "underground aquifers (groundwater)" : esc(waterSource.toLowerCase())}</strong> serving the ${esc(city)} area.
      ${waterSource.toLowerCase().includes("ground") ? "Groundwater picks up minerals and naturally occurring contaminants as it filters through rock and soil layers." : "Surface water can be affected by agricultural runoff, industrial discharge, and natural contaminants."}
    </p>
  </div>

  <div class="page-footer"><div class="page-footer-inner"><span>Personalized Water Report</span><span>Page 1</span></div></div>
</div>

<!-- ═════════════════════════════════════════════════
     PAGE 3 — CONTAMINANTS TABLE
     ═════════════════════════════════════════════════ -->
<div class="page" style="padding:40px">
  <div class="page-header">
    <span class="section-label">Contaminants Detected</span>
    <span class="utility-label">${esc(params.utilityName)}</span>
  </div>

  <h2 style="font-size:28px;font-weight:700;color:#0f172a" class="serif">Contaminants Exceeding Health Guidelines</h2>
  <p style="margin-top:8px;font-size:12px;color:#475569">
    These ${healthExceedances} contaminants were detected at levels above health-based guidelines set by independent health organizations.
  </p>

  <div style="margin-top:16px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <table>
      <thead>
        <tr><th>Contaminant</th><th>Detected</th><th>Health Guideline</th><th>Legal Limit</th><th>× Over</th><th>Status</th><th>Category</th></tr>
      </thead>
      <tbody>${exceedingRows}</tbody>
    </table>
  </div>

  <div class="page-footer"><div class="page-footer-inner"><span>Personalized Water Report</span><span>Page 2</span></div></div>
</div>

<!-- ═════════════════════════════════════════════════
     PAGE 3B — OTHER CONTAMINANTS
     ═════════════════════════════════════════════════ -->
<div class="page" style="padding:40px">
  <div class="page-header">
    <span class="section-label">Other Contaminants</span>
    <span class="utility-label">${esc(params.utilityName)}</span>
  </div>

  <h2 style="font-size:28px;font-weight:700;color:#0f172a" class="serif">Other Contaminants Detected</h2>
  <p style="margin-top:8px;font-size:12px;color:#475569">
    These ${belowGuidelines} contaminants were detected but at levels within health-based guidelines.
  </p>

  <div style="margin-top:16px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <table>
      <thead>
        <tr><th>Contaminant</th><th>Detected</th><th>Legal Limit</th><th>Status</th><th>Category</th></tr>
      </thead>
      <tbody>${belowRows}</tbody>
    </table>
  </div>

  <div class="page-footer"><div class="page-footer-inner"><span>Personalized Water Report</span><span>Page 3</span></div></div>
</div>

<!-- ═════════════════════════════════════════════════
     PAGE 4 — CONTAMINANT DETAILS
     ═════════════════════════════════════════════════ -->
<div class="page" style="padding:40px">
  <div class="page-header">
    <span class="section-label">Contaminant Details &amp; Health Risks</span>
    <span class="utility-label">${esc(params.utilityName)}</span>
  </div>

  <h2 style="font-size:28px;font-weight:700;color:#0f172a" class="serif">Understanding Your Contaminants</h2>
  <p style="margin-top:8px;font-size:12px;color:#475569">
    Detailed breakdown of the most significant contaminants found in your water and their potential health effects.
  </p>

  <div style="margin-top:20px">${detailCards}</div>

  <div class="amber-callout">
    <div class="title">⚠️ "Legal" Does Not Mean "Safe"</div>
    <p>Federal EPA standards were set years — sometimes decades — ago. Independent health organizations set stricter guidelines based on <strong>current scientific research</strong>. Contaminants like chromium-6, trihalomethanes, and nitrates are colorless, odorless, and tasteless — they cannot be detected without testing.</p>
  </div>

  <div class="page-footer"><div class="page-footer-inner"><span>Personalized Water Report</span><span>Page 4</span></div></div>
</div>

<!-- ═════════════════════════════════════════════════
     PAGE 5 — COMBINED HEALTH OVERVIEW & SOLUTIONS
     ═════════════════════════════════════════════════ -->
<div class="page" style="padding:40px">
  <div class="page-header">
    <span class="section-label">Health Overview &amp; Solutions</span>
    <span class="utility-label">${esc(params.utilityName)}</span>
  </div>

  <h2 style="font-size:28px;font-weight:700;color:#0f172a" class="serif">What This Means &amp; What You Can Do</h2>
  <p style="margin-top:8px;font-size:12px;color:#475569">
    Understanding the health impact of your water quality — and the best solutions to protect your family.
  </p>

  <!-- Exceedance cards row -->
  <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div style="border:1px solid #fde68a;background:rgba(254,243,199,0.2);border-radius:8px;padding:16px">
      <div style="font-size:24px;font-weight:700;color:#b45309">${healthExceedances}</div>
      <div style="margin-top:2px;font-size:12px;font-weight:700;color:#0f172a">Health Guideline Exceedances</div>
      <p style="margin-top:4px;font-size:11px;color:#475569;line-height:1.5">Contaminants above levels health organizations consider safe.</p>
    </div>
    <div style="border:1px solid #fecaca;background:rgba(254,226,226,0.2);border-radius:8px;padding:16px">
      <div style="font-size:24px;font-weight:700;color:#b91c1c">${legalViolations}</div>
      <div style="margin-top:2px;font-size:12px;font-weight:700;color:#0f172a">Legal Limit Violations</div>
      <p style="margin-top:4px;font-size:11px;color:#475569;line-height:1.5">Contaminant(s) exceeding EPA legal limits — requires attention.</p>
    </div>
  </div>

  <!-- Who is at risk - compact -->
  <div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
    <div style="font-size:12px;font-weight:700;color:#0f172a">💧 Who Is Most at Risk?</div>
    <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:11px;color:#334155;line-height:1.5">
      <p><strong>Children &amp; infants:</strong> Developing bodies are more vulnerable to chemical exposure.</p>
      <p><strong>Pregnant women:</strong> DBPs and heavy metals linked to reproductive complications.</p>
      <p><strong>Elderly:</strong> Weakened immune systems less equipped to handle exposure.</p>
    </div>
  </div>

  <!-- Filtration callout -->
  <div style="margin-top:10px;border:1px solid #fde68a;background:rgba(254,243,199,0.15);border-radius:8px;padding:12px">
    <p style="font-size:11px;color:#334155;line-height:1.5">
      <strong style="color:#92400e">Whole-home filtration</strong> is the most effective solution — exposure occurs through <strong>drinking, showering, bathing, and cooking</strong>.
      A system customized for your ${totalContaminants} detected contaminants provides the best protection at every tap.
    </p>
  </div>

  <!-- Products -->
  ${productCards ? `
  <div style="margin-top:14px">
    <div style="font-size:13px;font-weight:700;color:#0f172a">🛡️ Recommended Solutions</div>
    <div style="margin-top:8px">${productCards}</div>
  </div>` : ""}

  <!-- Why Choose Us - compact -->
  <div style="margin-top:14px;background:#0f2444;border-radius:8px;padding:20px;color:#fff">
    <div style="font-size:16px;font-weight:700">Why Choose ${esc(params.companyName)}?</div>
    <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:11px">
      <div>
        <div style="font-weight:600">🛡️ Custom Solutions</div>
        <div style="margin-top:2px;color:rgba(191,219,254,0.8)">Matched to your water profile</div>
      </div>
      <div>
        <div style="font-weight:600">👥 Expert Installation</div>
        <div style="margin-top:2px;color:rgba(191,219,254,0.8)">Certified technicians</div>
      </div>
      <div>
        <div style="font-weight:600">❤️ Family Protection</div>
        <div style="margin-top:2px;color:rgba(191,219,254,0.8)">Clean water at every tap</div>
      </div>
    </div>
    ${params.companyPhone ? `<div style="margin-top:12px;text-align:center;font-size:12px;font-weight:600;color:#bfdbfe">Call us today: ${esc(params.companyPhone)}</div>` : ""}
  </div>

  <div class="page-footer"><div class="page-footer-inner"><span>Personalized Water Report</span><span>Page 5</span></div></div>
</div>

<!-- ═════════════════════════════════════════════════
     PAGE 6 — SCORE IMPROVEMENT PROJECTION
     ═════════════════════════════════════════════════ -->
${buildScoreImprovementPage(params)}

<!-- ═════════════════════════════════════════════════
     PAGE 7 — ON-SITE TEST RESULTS
     ═════════════════════════════════════════════════ -->
<div class="page" style="padding:40px">
  <div style="text-align:center;margin-top:16px">
    <h2 style="font-size:28px;font-weight:700;color:#0f172a" class="serif">On-Site Water Quality Test Results</h2>
    <p style="margin-top:8px;font-size:13px;color:#64748b">Completed at the time of the in-home water quality consultation</p>
  </div>

  <div style="margin-top:8px;border-top:2px solid #3b82f6"></div>

  <!-- Test Results -->
  <div style="margin-top:24px;border:1px solid #e2e8f0;border-radius:8px;padding:24px">
    <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:24px">Test Results</div>

    <div style="margin-bottom:20px;display:flex;align-items:center;gap:16px">
      <span style="font-size:24px;width:40px;text-align:center">💧</span>
      <span style="font-size:13px;font-weight:600;color:#1e293b;width:160px">Water Hardness Level</span>
      <div style="flex:1;border-bottom:1px solid #cbd5e1;padding:4px 8px;min-height:28px;font-size:14px;font-weight:600;color:#0f172a">${params.hardness !== undefined ? esc(String(params.hardness)) : ""}</div>
      <span style="font-size:11px;color:#94a3b8;width:140px;text-align:right">GPG (grains per gallon)</span>
    </div>

    <div style="margin-bottom:20px;display:flex;align-items:center;gap:16px">
      <span style="font-size:24px;width:40px;text-align:center">🧪</span>
      <span style="font-size:13px;font-weight:600;color:#1e293b;width:160px">Chlorine Level</span>
      <div style="flex:1;border-bottom:1px solid #cbd5e1;padding:4px 8px;min-height:28px;font-size:14px;font-weight:600;color:#0f172a">${params.chlorine !== undefined ? esc(String(params.chlorine)) : ""}</div>
      <span style="font-size:11px;color:#94a3b8;width:140px;text-align:right">ppm (parts per million)</span>
    </div>

    <div style="margin-bottom:20px;display:flex;align-items:center;gap:16px">
      <span style="font-size:24px;width:40px;text-align:center">⚗️</span>
      <span style="font-size:13px;font-weight:600;color:#1e293b;width:160px">TDS Level</span>
      <div style="flex:1;border-bottom:1px solid #cbd5e1;padding:4px 8px;min-height:28px;font-size:14px;font-weight:600;color:#0f172a">${params.tds !== undefined ? esc(String(params.tds)) : ""}</div>
      <span style="font-size:11px;color:#94a3b8;width:140px;text-align:right">ppm (parts per million)</span>
    </div>

    <div style="display:flex;align-items:center;gap:16px">
      <span style="font-size:24px;width:40px;text-align:center">📊</span>
      <span style="font-size:13px;font-weight:600;color:#1e293b;width:160px">pH Level</span>
      <div style="flex:1;border-bottom:1px solid #cbd5e1;padding:4px 8px;min-height:28px;font-size:14px;font-weight:600;color:#0f172a">${params.ph !== undefined ? esc(String(params.ph)) : ""}</div>
      <span style="font-size:11px;color:#94a3b8;width:140px;text-align:right">(ideal: 6.5 – 8.5)</span>
    </div>
  </div>

  <!-- Notes -->
  <div style="margin-top:24px">
    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px">Additional Notes / Observations</div>
    <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:24px;font-size:14px;color:#0f172a;margin-bottom:12px">${params.testNotes ? esc(params.testNotes) : ""}</div>
    <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:24px;margin-bottom:12px"></div>
    <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:24px;margin-bottom:12px"></div>
    <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:24px"></div>
  </div>

  <!-- Performed by -->
  <div style="margin-top:32px;border-top:2px solid #3b82f6;padding-top:24px">
    <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:24px">Water Quality Test Performed By</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px 48px">
      <div>
        <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:28px;font-size:14px;font-weight:600;color:#0f172a">${params.repName ? esc(params.repName) : ""}</div>
        <div style="margin-top:6px;font-size:11px;color:#64748b">Representative Name</div>
      </div>
      <div>
        <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:28px;font-size:14px;font-weight:600;color:#0f172a">${params.repDate ? esc(params.repDate) : ""}</div>
        <div style="margin-top:6px;font-size:11px;color:#64748b">Date</div>
      </div>
      <div>
        <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:28px;font-size:14px;font-style:italic;color:#94a3b8">&nbsp;</div>
        <div style="margin-top:6px;font-size:11px;color:#64748b">Representative Signature</div>
      </div>
      <div>
        <div style="border-bottom:1px solid #cbd5e1;padding:4px 0;min-height:28px;font-size:14px;font-weight:600;color:#0f172a">${params.repPhone ? esc(params.repPhone) : ""}</div>
        <div style="margin-top:6px;font-size:11px;color:#64748b">Phone Number</div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="page-footer-inner" style="justify-content:center">
      <span>Personalized Water Report · ${esc(params.utilityName)} Service Area · ${esc(reportDate)}</span>
    </div>
  </div>
</div>

</body>
</html>`;
}
