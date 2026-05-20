type Contaminant = {
  contaminant?: string;
  name?: string;
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

type ReportTemplateParams = {
  customerName: string;
  customerAddress?: string;
  customerCityStateZip: string;
  companyName: string;
  accentColor: string;
  score: number;
  utilityName: string;
  waterSource: string;
  contaminants: Contaminant[];
  overHealth: number;
  overLegal: number;
  chlorine?: number;
  hardness?: number;
  tds?: number;
  ph?: number;
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function contaminantName(item: Contaminant) {
  return item.contaminant || item.name || "Unknown contaminant";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Gold";
  if (score >= 60) return "Silver";
  if (score >= 40) return "Bronze";
  return "At Risk";
}

function scoreGrade(score: number) {
  if (score >= 80) return "Gold";
  if (score >= 60) return "Silver";
  if (score >= 40) return "Bronze";
  return "At Risk";
}

function scoreColor(score: number) {
  if (score >= 80) return "#ffb000";
  if (score >= 60) return "#a8c7e8";
  if (score >= 40) return "#ff8a00";
  return "#ff4b5c";
}

function valueWithUnit(value?: number | null, unit?: string) {
  if (value === undefined || value === null) return "N/A";
  return `${esc(value)} ${esc(unit || "")}`.trim();
}

function categoryFor(item: Contaminant) {
  const name = contaminantName(item).toLowerCase();
  if (name.includes("trihalomethane") || name.includes("haloacetic") || name.includes("chloroform")) {
    return "Disinfection Byproduct";
  }
  if (name.includes("lead") || name.includes("mercury") || name.includes("chromium") || name.includes("arsenic")) {
    return "Heavy Metal";
  }
  if (name.includes("nitrate") || name.includes("atrazine") || name.includes("metolachlor")) {
    return "Agricultural Runoff";
  }
  if (name.includes("radium") || name.includes("uranium")) return "Radioactive Element";
  if (name.includes("fluoride")) return "Water Additive";
  return "Chemical";
}

function explainContaminant(item: Contaminant) {
  const name = contaminantName(item).toLowerCase();
  if (name.includes("trihalomethane") || name.includes("chloroform")) {
    return "These compounds can form when disinfectants react with organic matter in water. They are important because families are exposed through drinking water, cooking steam, and hot showers.";
  }
  if (name.includes("haloacetic")) {
    return "Haloacetic acids can form during chlorine disinfection. They are often invisible in the home, so a report or test is usually the only way a homeowner knows they are present.";
  }
  if (name.includes("lead")) {
    return "Lead is commonly associated with plumbing and service lines. It is especially important for children, infants, and pregnant women.";
  }
  if (name.includes("mercury")) {
    return "Mercury is a serious contaminant when confirmed. It should be treated as a priority finding and verified with current in-home testing.";
  }
  if (item.effect) return item.effect;
  return "This contaminant was detected in the water profile and should be reviewed in the context of the health guideline and legal limit shown in this report.";
}

function rowStatus(item: Contaminant) {
  if (item.over_legal) return '<span class="status bad">Legal issue</span>';
  if (item.over_health) return '<span class="status warn">Exceeds health</span>';
  return '<span class="status ok">Meets guideline</span>';
}

function tableRows(items: Contaminant[], compact = false) {
  if (!items.length) {
    return '<tr><td colspan="6" class="empty">No contaminants in this section.</td></tr>';
  }
  return items
    .map((item) => {
      const multiple = item.times_above_ewg && item.times_above_ewg > 1 ? `${esc(item.times_above_ewg)}x` : "-";
      return `<tr>
        <td><strong>${esc(contaminantName(item))}</strong>${compact ? "" : `<br><span>${esc(categoryFor(item))}</span>`}</td>
        <td>${valueWithUnit(item.detected_level ?? item.value, item.unit)}</td>
        <td>${valueWithUnit(item.health_guideline, item.unit)}</td>
        <td>${valueWithUnit(item.legal_limit, item.unit)}</td>
        <td>${multiple}</td>
        <td>${rowStatus(item)}</td>
      </tr>`;
    })
    .join("");
}

export function buildReportHtml(params: ReportTemplateParams): string {
  const accent = params.accentColor || "#0b5d91";
  const score = Math.max(0, Math.min(100, Math.round(params.score)));
  const scoreAccent = scoreColor(score);
  const detected = params.contaminants.filter((item) => item.detected_level !== undefined || item.value !== undefined);
  const priority = detected
    .filter((item) => item.over_legal || item.over_health)
    .sort((a, b) => {
      if (a.over_legal && !b.over_legal) return -1;
      if (!a.over_legal && b.over_legal) return 1;
      return (b.times_above_ewg ?? 0) - (a.times_above_ewg ?? 0);
    });
  const otherDetected = detected.filter((item) => !item.over_legal && !item.over_health);
  const topDetails = priority.slice(0, 4);
  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const sourceDescription = params.waterSource.toLowerCase().includes("ground")
    ? "Your water is drawn from underground sources. Groundwater can pick up naturally occurring minerals, heavy metals, and dissolved substances as it moves through rock and soil."
    : "Your water is drawn from surface water sources. Surface water can be affected by treatment byproducts, runoff, industrial activity, and seasonal changes.";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(params.customerName)} Water Report</title>
  <style>
    @page { size: Letter; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #12243a; background: #eaf4fb; }
    .page { width: 8.5in; min-height: 11in; margin: 0 auto; padding: 0.42in; background: #fff; page-break-after: always; position: relative; overflow: hidden; }
    .page:before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at top right, ${accent}18, transparent 40%); }
    .content { position: relative; z-index: 1; }
    .cover { color: white; background: linear-gradient(140deg, #06182f 0%, #0a3564 52%, ${accent} 100%); }
    .cover:before { background: radial-gradient(circle at 75% 18%, rgba(255,255,255,.22), transparent 30%); }
    .eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: 12px; font-weight: 800; color: ${accent}; }
    .cover .eyebrow { color: #a7e7ff; }
    h1 { margin: 0; font-size: 58px; line-height: .95; letter-spacing: -0.04em; }
    h2 { margin: 0 0 16px; font-size: 28px; letter-spacing: -0.03em; color: #0b2d50; }
    h3 { margin: 0 0 8px; font-size: 16px; color: #0b2d50; }
    p { margin: 0 0 10px; line-height: 1.45; }
    .topbar { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 28px; }
    .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; }
    .brand small { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .22em; font-weight: 800; opacity: .7; }
    .powered { text-align: right; font-weight: 800; }
    .cover-card { position: absolute; left: .42in; right: .42in; bottom: .46in; display: grid; grid-template-columns: 1.15fr .85fr; gap: 18px; align-items: end; }
    .prepared { padding: 24px; border: 1px solid rgba(255,255,255,.24); border-radius: 18px; background: rgba(255,255,255,.12); backdrop-filter: blur(8px); }
    .prepared strong { display: block; font-size: 22px; margin-bottom: 8px; }
    .score-box { padding: 22px; border-radius: 18px; background: #fff; color: #0b2441; text-align: center; box-shadow: 0 22px 55px rgba(0,0,0,.22); }
    .score-number { font-size: 72px; line-height: 1; font-weight: 950; color: ${scoreAccent}; }
    .score-grade { display: inline-flex; align-items: center; justify-content: center; min-width: 104px; height: 38px; padding: 0 14px; border-radius: 999px; background: ${scoreAccent}; color: white; font-size: 16px; text-transform: uppercase; letter-spacing: .08em; font-weight: 950; margin-top: 12px; }
    .grid { display: grid; gap: 16px; }
    .two { grid-template-columns: 1fr 1fr; }
    .three { grid-template-columns: repeat(3, 1fr); }
    .four { grid-template-columns: repeat(4, 1fr); }
    .card { border: 1px solid #d7e8f4; border-radius: 14px; background: #fff; padding: 18px; box-shadow: 0 10px 28px rgba(9,44,78,.06); }
    .dark-card { background: #062b4f; color: white; border-color: #062b4f; }
    .metric { border-radius: 14px; padding: 16px; background: #f1f8fc; border: 1px solid #d7e8f4; }
    .metric strong { display: block; font-size: 34px; line-height: 1; color: #0b2d50; }
    .metric span { color: #506478; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .grade-row { display: grid; grid-template-columns: 70px 1fr; gap: 16px; align-items: center; padding: 13px 0; border-bottom: 1px solid #dcebf4; }
    .grade { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 950; background: ${scoreAccent}; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 10px 8px; color: #31506d; background: #ecf6fc; text-transform: uppercase; font-size: 10px; letter-spacing: .05em; }
    td { padding: 10px 8px; border-top: 1px solid #dbeaf4; vertical-align: top; }
    td span { color: #687b8e; font-size: 10px; }
    .status { display: inline-block; padding: 5px 7px; border-radius: 999px; font-size: 9px; font-weight: 900; text-transform: uppercase; white-space: nowrap; }
    .bad { color: #991b1b; background: #fee2e2; }
    .warn { color: #92400e; background: #fef3c7; }
    .ok { color: #166534; background: #dcfce7; }
    .empty { text-align: center; color: #60748a; padding: 20px; }
    .detail { padding: 16px 0; border-bottom: 1px solid #dbeaf4; }
    .detail-title { display: flex; justify-content: space-between; gap: 12px; color: #0b2d50; font-size: 18px; font-weight: 900; }
    .detail-meta { color: ${accent}; text-transform: uppercase; font-size: 10px; letter-spacing: .08em; font-weight: 900; margin: 3px 0 8px; }
    .callout { padding: 18px; border-radius: 14px; background: #fff7ed; border: 1px solid #fed7aa; color: #7c2d12; }
    .solution { background: linear-gradient(135deg, #08213d, ${accent}); color: white; border: none; }
    .solution h2, .solution h3 { color: white; }
    .test-row { display: grid; grid-template-columns: 1fr 180px; gap: 16px; align-items: center; padding: 17px 0; border-bottom: 1px solid #dbeaf4; }
    .blank { height: 34px; border: 1px solid #b7cedd; border-radius: 8px; background: #fff; }
    .footer { position: absolute; left: .42in; right: .42in; bottom: .22in; color: #75879a; font-size: 10px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <section class="page cover">
    <div class="content">
      <div class="topbar">
        <div class="brand">${esc(params.companyName)}<small>Water Solutions</small></div>
        <div class="powered">Powered by<br>AquaReport</div>
      </div>
      <div class="eyebrow">Personalized Water Quality Analysis</div>
      <h1>Your Home's<br>Water Report</h1>
      <p style="font-size:20px;max-width:470px;margin-top:20px;color:#d8f3ff">A detailed analysis of contaminants detected in your local water supply by ${esc(params.utilityName)}.</p>
      <div class="cover-card">
        <div class="prepared">
          <div class="eyebrow">Prepared For</div>
          <strong>${esc(params.customerName || "Homeowner")}</strong>
          <p>${esc(params.customerAddress || "Home address")}<br>${esc(params.customerCityStateZip)}</p>
          <p>${esc(reportDate)}</p>
        </div>
        <div class="score-box">
          <div class="eyebrow">AquaScore</div>
          <div class="score-number">${score}</div>
          <div>${esc(scoreLabel(score))}</div>
          <div class="score-grade">${scoreGrade(score)}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="page">
    <div class="content">
      <div class="topbar"><div><div class="eyebrow">Water Quality Overview</div><h2>${esc(params.utilityName)}</h2></div><div class="brand">AquaReport</div></div>
      <div class="grid two">
        <div class="card">
          <h3>AquaScore Certification</h3>
          <div class="grade-row"><div class="grade" style="font-size:12px;text-transform:uppercase">${scoreGrade(score)}</div><div><strong>Overall AquaScore: ${score}</strong><p>${esc(scoreLabel(score))} rating. Properties are certified based on their AquaScore rating.</p></div></div>
          <div class="grade-row"><div class="grade" style="background:${params.overLegal > 0 ? "#dc2626" : "#16a34a"}">${params.overLegal > 0 ? "D" : "A"}</div><div><strong>Legal Compliance</strong><p>${esc(params.overLegal)} legal limit violation${params.overLegal === 1 ? "" : "s"} found.</p></div></div>
          <div class="grade-row"><div class="grade" style="background:${params.overHealth > 0 ? "#d97706" : "#16a34a"}">${params.overHealth > 0 ? "D" : "A"}</div><div><strong>Health Guidelines</strong><p>${esc(params.overHealth)} contaminant${params.overHealth === 1 ? "" : "s"} exceed health-based guidelines.</p></div></div>
        </div>
        <div class="card dark-card">
          <h3>Your Water Utility</h3>
          <p><strong>Provider</strong><br>${esc(params.utilityName)}</p>
          <p><strong>Water Source</strong><br>${esc(params.waterSource || "Unknown")}</p>
          <p><strong>Location</strong><br>${esc(params.customerCityStateZip)}</p>
          <p>${esc(sourceDescription)}</p>
        </div>
      </div>
      <div class="grid four" style="margin-top:16px">
        <div class="metric"><strong>${detected.length}</strong><span>Total detected</span></div>
        <div class="metric"><strong>${params.overHealth}</strong><span>Over health</span></div>
        <div class="metric"><strong>${otherDetected.length}</strong><span>Below guideline</span></div>
        <div class="metric"><strong>${params.overLegal}</strong><span>Legal violations</span></div>
      </div>
      <div class="callout" style="margin-top:16px"><strong>What does this mean?</strong><br>Some water can meet minimum legal standards while still exceeding stricter health-based guidelines. This report is designed to help homeowners understand what was detected and why whole-home protection may be worth discussing.</div>
    </div>
    <div class="footer"><span>Personalized Water Report</span><span>Page 1</span></div>
  </section>

  <section class="page">
    <div class="content">
      <div class="topbar"><div><div class="eyebrow">Contaminants Detected</div><h2>${esc(params.utilityName)}</h2></div><div class="brand">AquaReport</div></div>
      <h3>Contaminants Exceeding Health Guidelines</h3>
      <p>These contaminants were detected at levels above health-based guidelines or legal limits.</p>
      <table><thead><tr><th>Contaminant</th><th>Detected</th><th>Health Guideline</th><th>Legal Limit</th><th>Over</th><th>Status</th></tr></thead><tbody>${tableRows(priority.slice(0, 12))}</tbody></table>
      <h3 style="margin-top:22px">Other Contaminants Detected</h3>
      <p>These contaminants were detected but are lower priority compared with the findings above.</p>
      <table><thead><tr><th>Contaminant</th><th>Detected</th><th>Health Guideline</th><th>Legal Limit</th><th>Over</th><th>Status</th></tr></thead><tbody>${tableRows(otherDetected.slice(0, 10), true)}</tbody></table>
    </div>
    <div class="footer"><span>Personalized Water Report</span><span>Page 2</span></div>
  </section>

  <section class="page">
    <div class="content">
      <div class="topbar"><div><div class="eyebrow">Contaminant Details and Health Risks</div><h2>${esc(params.utilityName)}</h2></div><div class="brand">AquaReport</div></div>
      <p>Detailed breakdown of the most significant contaminants found in the water profile and why they matter for a home.</p>
      ${topDetails
        .map((item) => `<div class="detail">
          <div class="detail-title"><span>${esc(contaminantName(item))}</span><span>${item.times_above_ewg && item.times_above_ewg > 1 ? `${esc(item.times_above_ewg)}x` : ""}</span></div>
          <div class="detail-meta">${esc(categoryFor(item))}${item.over_legal ? " - legal limit issue" : item.over_health ? " - above health guideline" : ""}</div>
          <p>${esc(explainContaminant(item))}</p>
          <p><strong>Detected:</strong> ${valueWithUnit(item.detected_level ?? item.value, item.unit)} &nbsp; <strong>Guideline:</strong> ${valueWithUnit(item.health_guideline, item.unit)} &nbsp; <strong>Legal:</strong> ${valueWithUnit(item.legal_limit, item.unit)}</p>
        </div>`)
        .join("")}
      <div class="callout" style="margin-top:18px"><strong>"Legal" does not always mean "ideal."</strong><br>Federal standards and health-based guidelines are not the same thing. A homeowner may still want filtration when contaminants are below a legal limit but above a more protective health guideline.</div>
    </div>
    <div class="footer"><span>Personalized Water Report</span><span>Page 3</span></div>
  </section>

  <section class="page">
    <div class="content">
      <div class="topbar"><div><div class="eyebrow">Health Overview</div><h2>What This Means For Your Family</h2></div><div class="brand">AquaReport</div></div>
      <div class="grid two">
        <div class="card"><div class="metric"><strong>${params.overHealth}</strong><span>Health guideline exceedances</span></div><p style="margin-top:14px">These are the findings most useful in a homeowner conversation because they show where water quality may fall short of modern health-based recommendations.</p></div>
        <div class="card"><div class="metric"><strong>${params.overLegal}</strong><span>Legal limit violations</span></div><p style="margin-top:14px">${params.overLegal > 0 ? "Legal-limit issues should be treated as priority findings and verified with current testing." : "No legal-limit violation is shown in this report, but health guideline concerns may still matter."}</p></div>
      </div>
      <div class="card" style="margin-top:16px"><h3>Who Is Most at Risk?</h3><p><strong>Children and infants:</strong> Developing bodies are more vulnerable to contaminant exposure.</p><p><strong>Pregnant women:</strong> Disinfection byproducts and heavy metals may be more concerning during pregnancy.</p><p><strong>Older adults and immunocompromised people:</strong> Added contaminant exposure can matter more when health is already fragile.</p></div>
      <div class="card solution" style="margin-top:16px"><h2>Your Personalized Recommendation</h2><p>Based on the contaminants detected in this water profile, a whole-home advanced filtration system is the strongest conversation to have. It helps address drinking, cooking, bathing, laundry, and shower exposure instead of only treating one faucet.</p><p><strong>Recommended next step:</strong> confirm current tap conditions with an in-home test, then match treatment to the specific contaminant profile shown here.</p></div>
    </div>
    <div class="footer"><span>Personalized Water Report</span><span>Page 4</span></div>
  </section>

  <section class="page">
    <div class="content">
      <div class="topbar"><div><div class="eyebrow">On-Site Water Quality Test Results</div><h2>Completed During Consultation</h2></div><div class="brand">AquaReport</div></div>
      <div class="card">
        <div class="test-row"><div><strong>Water Hardness Level</strong><p>GPG or ppm</p></div><div class="blank">${params.hardness === undefined ? "" : esc(params.hardness)}</div></div>
        <div class="test-row"><div><strong>Chlorine Level</strong><p>ppm</p></div><div class="blank">${params.chlorine === undefined ? "" : esc(params.chlorine)}</div></div>
        <div class="test-row"><div><strong>TDS Level</strong><p>ppm</p></div><div class="blank">${params.tds === undefined ? "" : esc(params.tds)}</div></div>
        <div class="test-row"><div><strong>pH Level</strong><p>Ideal range: 6.5 - 8.5</p></div><div class="blank">${params.ph === undefined ? "" : esc(params.ph)}</div></div>
      </div>
      <div class="card" style="margin-top:18px"><h3>Additional Notes / Observations</h3><div style="height:160px;border:1px solid #b7cedd;border-radius:10px;background:#fff"></div></div>
      <div class="grid two" style="margin-top:18px">
        <div class="card"><h3>Water Quality Test Performed By</h3><div class="blank"></div><p style="margin-top:8px">Representative name</p></div>
        <div class="card"><h3>Date / Phone</h3><div class="blank"></div><p style="margin-top:8px">Contact information</p></div>
      </div>
    </div>
    <div class="footer"><span>Personalized Water Report - ${esc(params.utilityName)} Service Area</span><span>${esc(reportDate)}</span></div>
  </section>
</body>
</html>`;
}
