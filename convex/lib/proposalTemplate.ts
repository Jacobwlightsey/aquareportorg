/**
 * Sprint 4D — Proposal PDF HTML template.
 *
 * Generates a branded sales proposal that the dealer can send/print.
 */

export interface ProposalData {
  // Customer
  customerName: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerPhone?: string;
  customerEmail?: string;

  // Company / Dealer
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  accentColor: string;

  // Water data
  waterScore: number;
  utilityName: string;
  city: string;
  state: string;
  totalContaminants: number;
  overHealthGuidelines: number;
  overLegalLimits: number;
  topContaminants: Array<{
    name: string;
    detected: string;
    limit: string;
    severity: string;
  }>;

  // Solution
  systemName?: string;
  systemDescription?: string;
  systemFeatures?: string[];

  // Pricing (optional — dealer can hide)
  showPricing?: boolean;
  monthlyPrice?: string;
  totalPrice?: string;

  // Rep
  repName?: string;
  repPhone?: string;
  date: string;
}

function tierLabel(score: number) {
  if (score >= 80) return { label: "Gold", color: "#f59e0b" };
  if (score >= 60) return { label: "Silver", color: "#94a3b8" };
  if (score >= 40) return { label: "Bronze", color: "#f97316" };
  return { label: "At Risk", color: "#ef4444" };
}

export function buildProposalHtml(d: ProposalData): string {
  const tier = tierLabel(d.waterScore);
  const projectedScore = Math.min(d.waterScore + 30, 99);

  const contaminantRows = d.topContaminants
    .map(
      (c) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500">${c.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${c.detected}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${c.limit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">
        <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase;
          ${c.severity === "critical" ? "background:#fef2f2;color:#dc2626" : c.severity === "warning" ? "background:#fffbeb;color:#d97706" : "background:#f0fdf4;color:#16a34a"}">
          ${c.severity === "critical" ? "Over Legal" : c.severity === "warning" ? "Over Health" : "Within Limits"}
        </span>
      </td>
    </tr>`
    )
    .join("");

  const featuresList = (d.systemFeatures || [])
    .map((f) => `<li style="margin-bottom:4px">${f}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin:0; padding:0; color:#1f2937; line-height:1.5; }
  .page { max-width:800px; margin:0 auto; padding:40px; }
  .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; padding-bottom:16px; border-bottom:3px solid ${d.accentColor}; }
  .header-left h1 { margin:0; font-size:24px; color:${d.accentColor}; }
  .header-left p { margin:4px 0 0; color:#6b7280; font-size:13px; }
  .section { margin-bottom:28px; }
  .section-title { font-size:16px; font-weight:700; color:${d.accentColor}; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px; }
  .score-box { display:flex; align-items:center; gap:24px; padding:20px; background:#f8fafc; border-radius:12px; border:1px solid #e5e7eb; }
  .score-circle { width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:white; background:${tier.color}; }
  .stats-row { display:flex; gap:12px; margin-top:16px; }
  .stat-box { flex:1; padding:12px; background:#f8fafc; border-radius:8px; border:1px solid #e5e7eb; text-align:center; }
  .stat-value { font-size:24px; font-weight:800; }
  .stat-label { font-size:10px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; }
  table { width:100%; border-collapse:collapse; }
  th { padding:8px 12px; background:${d.accentColor}; color:white; font-size:11px; text-transform:uppercase; letter-spacing:1px; text-align:left; }
  th:nth-child(n+2) { text-align:center; }
  .improvement { display:flex; align-items:center; gap:16px; padding:20px; background:linear-gradient(135deg,#f0fdf4,#ecfdf5); border-radius:12px; border:1px solid #bbf7d0; }
  .arrow { font-size:24px; color:#16a34a; }
  .cta { text-align:center; padding:24px; background:${d.accentColor}; color:white; border-radius:12px; margin-top:24px; }
  .cta h3 { margin:0 0 8px; font-size:18px; }
  .cta p { margin:0; opacity:0.9; font-size:14px; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:11px; color:#9ca3af; text-align:center; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>${d.companyName}</h1>
      <p>Water Treatment Proposal for ${d.customerName}</p>
    </div>
    <div style="text-align:right;font-size:12px;color:#6b7280">
      <div>${d.date}</div>
      ${d.repName ? `<div>Prepared by: ${d.repName}</div>` : ""}
      ${d.repPhone ? `<div>${d.repPhone}</div>` : ""}
    </div>
  </div>

  <!-- Customer Info -->
  <div class="section">
    <div class="section-title">Customer Information</div>
    <div style="display:flex;gap:32px;font-size:14px">
      <div>
        <strong>${d.customerName}</strong><br/>
        ${d.customerAddress ? `${d.customerAddress}<br/>` : ""}
        ${d.customerCity ? `${d.customerCity}, ${d.customerState} ${d.customerZip}` : ""}
      </div>
      <div style="color:#6b7280">
        ${d.customerPhone ? `Phone: ${d.customerPhone}<br/>` : ""}
        ${d.customerEmail ? `Email: ${d.customerEmail}` : ""}
      </div>
    </div>
  </div>

  <!-- Water Quality Score -->
  <div class="section">
    <div class="section-title">Current Water Quality</div>
    <div class="score-box">
      <div class="score-circle">${d.waterScore}</div>
      <div>
        <div style="font-size:20px;font-weight:700;color:${tier.color}">${tier.label} Tier</div>
        <div style="font-size:13px;color:#6b7280">Water source: ${d.utilityName} · ${d.city}, ${d.state}</div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-value">${d.totalContaminants}</div>
        <div class="stat-label">Contaminants Detected</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color:#d97706">${d.overHealthGuidelines}</div>
        <div class="stat-label">Over Health Guidelines</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color:#dc2626">${d.overLegalLimits}</div>
        <div class="stat-label">Over Legal Limits</div>
      </div>
    </div>
  </div>

  <!-- Top Contaminants -->
  ${
    d.topContaminants.length > 0
      ? `<div class="section">
    <div class="section-title">Key Contaminants Found</div>
    <table>
      <thead>
        <tr>
          <th>Contaminant</th>
          <th>Detected</th>
          <th>Limit</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${contaminantRows}</tbody>
    </table>
  </div>`
      : ""
  }

  <!-- Projected Improvement -->
  <div class="section">
    <div class="section-title">Projected Improvement</div>
    <div class="improvement">
      <div style="text-align:center">
        <div style="font-size:36px;font-weight:800;color:${tier.color}">${d.waterScore}</div>
        <div style="font-size:11px;color:#6b7280">Current</div>
      </div>
      <div class="arrow">→</div>
      <div style="text-align:center">
        <div style="font-size:36px;font-weight:800;color:#16a34a">${projectedScore}</div>
        <div style="font-size:11px;color:#6b7280">Projected</div>
      </div>
      <div style="flex:1;font-size:14px;color:#374151">
        A whole-home water treatment system could improve your water quality score by
        <strong style="color:#16a34a">+${projectedScore - d.waterScore} points</strong>, removing or reducing
        the majority of detected contaminants.
      </div>
    </div>
  </div>

  <!-- Recommended System -->
  ${
    d.systemName
      ? `<div class="section">
    <div class="section-title">Recommended Solution</div>
    <div style="padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e5e7eb">
      <h3 style="margin:0 0 8px;font-size:18px;color:${d.accentColor}">${d.systemName}</h3>
      ${d.systemDescription ? `<p style="margin:0 0 12px;font-size:14px;color:#6b7280">${d.systemDescription}</p>` : ""}
      ${featuresList ? `<ul style="margin:0;padding-left:20px;font-size:14px;color:#374151">${featuresList}</ul>` : ""}
    </div>
  </div>`
      : ""
  }

  ${
    d.showPricing && (d.monthlyPrice || d.totalPrice)
      ? `<div class="section">
    <div class="section-title">Investment</div>
    <div style="padding:20px;background:${d.accentColor}10;border-radius:12px;border:2px solid ${d.accentColor}30">
      ${d.monthlyPrice ? `<div style="font-size:14px;color:#6b7280">Monthly: <strong style="font-size:20px;color:${d.accentColor}">${d.monthlyPrice}</strong></div>` : ""}
      ${d.totalPrice ? `<div style="font-size:14px;color:#6b7280;margin-top:4px">Total: <strong style="font-size:20px;color:${d.accentColor}">${d.totalPrice}</strong></div>` : ""}
    </div>
  </div>`
      : ""
  }

  <!-- CTA -->
  <div class="cta">
    <h3>Ready to Improve Your Water Quality?</h3>
    <p>
      Contact ${d.companyName} to schedule your installation.
      ${d.companyPhone ? `Call ${d.companyPhone}` : ""}
      ${d.companyEmail ? `or email ${d.companyEmail}` : ""}
    </p>
  </div>

  <div class="footer">
    This proposal was prepared by ${d.companyName} based on water quality data from ${d.utilityName}.
    Results may vary. Powered by AquaReport.
  </div>

</div>
</body>
</html>`;
}
