/**
 * DoorHangerPreview — print-ready 4.25″ × 11″ door hanger
 * Two modes: Color (vibrant water-themed graphics) and Blank (B&W, cheap to print).
 * Auto-populates company name, phone, website, and logo.
 */

import { useState } from "react";
import { Printer, Download, Palette, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DoorHangerProps {
  companyName: string;
  companyPhone: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  waterIssues?: string[];
  headline?: string;
  subheadline?: string;
  pickupText?: string;
}

const DEFAULT_ISSUES = [
  "Chlorine taste & odor",
  "Hard water buildup",
  "Rust staining",
  "Sulfur smells",
  "Elevated TDS levels",
];

/* ─── SVG assets (inline, no external deps) ─── */

const WAVE_TOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 32" preserveAspectRatio="none" style="width:100%;height:20px;display:block;">
  <path d="M0,16 C80,0 120,32 200,16 C280,0 320,32 400,16 L400,32 L0,32 Z" fill="#0c4a6e"/>
</svg>`;

const WAVE_MID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 24" preserveAspectRatio="none" style="width:100%;height:14px;display:block;">
  <path d="M0,12 C60,4 140,20 200,12 C260,4 340,20 400,12 L400,24 L0,24 Z" fill="#0369a1" opacity="0.5"/>
  <path d="M0,14 C80,6 120,22 200,14 C280,6 320,22 400,14 L400,24 L0,24 Z" fill="#0284c7" opacity="0.4"/>
</svg>`;

const DROPLET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;color:rgba(56,189,248,0.35);"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;

const BUBBLES_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" style="position:absolute;right:4px;top:4px;width:50px;opacity:0.18;">
  <circle cx="20" cy="30" r="8" fill="none" stroke="#7dd3fc" stroke-width="1.2"/>
  <circle cx="45" cy="15" r="5" fill="none" stroke="#7dd3fc" stroke-width="1"/>
  <circle cx="38" cy="42" r="6" fill="none" stroke="#7dd3fc" stroke-width="1"/>
  <circle cx="65" cy="25" r="4" fill="none" stroke="#7dd3fc" stroke-width="0.8"/>
  <circle cx="80" cy="45" r="7" fill="none" stroke="#7dd3fc" stroke-width="1"/>
  <circle cx="100" cy="18" r="5" fill="none" stroke="#7dd3fc" stroke-width="0.8"/>
</svg>`;

/* ─── Print HTML builders ─── */

function buildColorPrintHTML(props: DoorHangerProps): string {
  const {
    companyName,
    companyPhone,
    companyLogoUrl,
    waterIssues = DEFAULT_ISSUES,
    headline = "FREE WATER TEST",
    subheadline = "TIME SENSITIVE",
    pickupText = "Pickup by 9:00 AM tomorrow",
  } = props;

  const issueItems = waterIssues
    .map(
      (issue) =>
        `<div style="display:flex;align-items:center;gap:5px;margin:3px 0;font-size:11px;color:#1e3a5f;">
          <span style="color:#0ea5e9;font-size:14px;">💧</span>
          <span>${issue}</span>
        </div>`
    )
    .join("");

  const logoHTML = companyLogoUrl
    ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-height:32px;max-width:140px;object-fit:contain;margin:0 auto 4px;" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Door Hanger — ${companyName}</title>
<style>
  @page { size: 4.25in 11in; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:4.25in; height:11in;
    font-family: Arial, Helvetica, sans-serif;
    color:#1a1a1a; background:#fff;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .hanger {
    width:4.25in; height:11in;
    display:flex; flex-direction:column;
    position:relative; overflow:hidden;
  }

  /* Header zone */
  .header-zone {
    background: linear-gradient(175deg, #0c4a6e 0%, #0369a1 40%, #0ea5e9 100%);
    padding: 0.15in 0.25in 0;
    text-align:center; color:#fff; position:relative;
  }
  .hole-area { display:flex; justify-content:center; margin-bottom:4px; }
  .hole {
    width:1.1in; height:1.1in; border-radius:50%;
    border:2px dashed rgba(255,255,255,0.4);
    background: rgba(0,0,0,0.15);
    display:flex; align-items:center; justify-content:center;
    font-size:8px; color:rgba(255,255,255,0.5);
  }
  .header-zone h1 {
    font-size:26px; font-weight:900; letter-spacing:2px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3); margin:2px 0;
  }
  .subheadline-pill {
    display:inline-block; background:rgba(255,255,255,0.2);
    border:1.5px solid rgba(255,255,255,0.5);
    border-radius:20px; padding:2px 16px;
    font-size:11px; font-weight:800; letter-spacing:1.5px;
    margin:4px 0;
  }
  .company-name { font-size:15px; font-weight:800; margin:3px 0 1px; }
  .company-phone { font-size:14px; font-weight:700; }
  .company-sub { font-size:8px; opacity:0.75; font-style:italic; margin-top:2px; }

  /* Wave separator */
  .wave-sep {
    width:100%; height:20px; display:block; margin-top:-1px;
    background: linear-gradient(175deg, #0ea5e9 0%, transparent 100%);
  }
  .wave-sep svg { display:block; width:100%; height:20px; }
  .wave-sep-path { fill:#fff; }

  /* Bubbles decoration */
  .bubbles { position:absolute; right:8px; top:8px; width:50px; opacity:0.2; }

  /* Body section */
  .body-zone { padding: 6px 0.3in 0; flex:1; display:flex; flex-direction:column; }

  /* Issues */
  .issues-box {
    border:1.5px solid #bae6fd; border-radius:6px;
    padding:8px 10px; margin:4px 0 6px;
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    position:relative;
  }
  .issues-title { font-size:11px; font-weight:700; color:#0c4a6e; margin-bottom:3px; }
  .issues-footer { font-size:9px; color:#64748b; margin-top:4px; font-style:italic; }

  /* Action bar */
  .action-bar {
    background: linear-gradient(90deg, #0c4a6e, #0369a1);
    color:#fff; text-align:center; padding:6px 0;
    font-size:16px; font-weight:900; letter-spacing:2px;
    border-radius:6px 6px 0 0; margin-top:4px;
  }
  .steps {
    border:2px solid #0369a1; border-top:none;
    padding:8px 12px; border-radius:0 0 6px 6px;
    background:#f0f9ff;
  }
  .step {
    display:flex; align-items:center; gap:8px;
    margin:5px 0; font-size:13px; font-weight:700; color:#0c4a6e;
  }
  .step-num {
    width:22px; height:22px; border-radius:50%;
    background: linear-gradient(135deg, #0369a1, #0ea5e9);
    color:#fff; display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:800; flex-shrink:0;
  }
  .pickup { text-align:center; font-size:14px; font-weight:800; color:#dc2626; margin:6px 0 2px; }
  .unreturned { text-align:center; font-size:9px; color:#64748b; font-style:italic; }

  /* Form */
  .form-section { flex:1; display:flex; flex-direction:column; margin-top:6px; }
  .form-title {
    text-align:center; font-size:13px; font-weight:700;
    color:#0c4a6e; margin-bottom:5px;
    border-bottom:2px solid #0ea5e9; display:inline-block;
    margin-left:auto; margin-right:auto; padding-bottom:2px;
  }
  .form-row { display:flex; align-items:baseline; gap:4px; margin:4px 0; font-size:11px; }
  .form-label { font-weight:700; white-space:nowrap; min-width:50px; color:#0c4a6e; }
  .form-line { flex:1; border-bottom:1px solid #94a3b8; min-height:16px; }
  .form-checkboxes { display:flex; flex-wrap:wrap; gap:8px; font-size:10px; margin:4px 0; color:#334155; }
  .form-checkboxes label { display:flex; align-items:center; gap:3px; }
  .form-checkboxes input[type="checkbox"] { width:11px; height:11px; accent-color:#0ea5e9; }

  /* Footer */
  .footer-block {
    background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
    border:1.5px solid #bae6fd; border-radius:6px;
    padding:6px 8px; text-align:center; margin-top:auto;
    font-size:10px; line-height:1.4; color:#0c4a6e;
  }
  .footer-bold {
    font-weight:800; font-size:9px; text-align:center;
    margin-top:3px; color:#0369a1;
  }

  @media print { body { width:4.25in; height:11in; } }
</style>
</head>
<body>
<div class="hanger">
  <div class="header-zone">
    <!-- bubbles decoration -->
    <svg viewBox="0 0 120 80" class="bubbles">
      <circle cx="20" cy="30" r="8" fill="none" stroke="#7dd3fc" stroke-width="1.2"/>
      <circle cx="45" cy="15" r="5" fill="none" stroke="#7dd3fc" stroke-width="1"/>
      <circle cx="38" cy="52" r="6" fill="none" stroke="#7dd3fc" stroke-width="1"/>
      <circle cx="65" cy="35" r="4" fill="none" stroke="#7dd3fc" stroke-width="0.8"/>
      <circle cx="85" cy="55" r="7" fill="none" stroke="#7dd3fc" stroke-width="1"/>
      <circle cx="105" cy="20" r="5" fill="none" stroke="#7dd3fc" stroke-width="0.8"/>
      <circle cx="15" cy="60" r="4" fill="none" stroke="#7dd3fc" stroke-width="0.7"/>
      <circle cx="75" cy="10" r="3" fill="none" stroke="#7dd3fc" stroke-width="0.6"/>
    </svg>
    <div class="hole-area"><div class="hole">✂ cut</div></div>
    ${logoHTML}
    <h1>${headline}</h1>
    <div class="subheadline-pill">— ${subheadline} —</div>
    <div class="company-name">${companyName}</div>
    <div class="company-phone">${companyPhone}</div>
    <div class="company-sub">Local testing in your area this week only</div>
    <div style="height:8px;"></div>
  </div>

  <!-- Wave transition -->
  <div style="margin-top:-1px;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 32" preserveAspectRatio="none" style="width:100%;height:22px;display:block;background:linear-gradient(180deg,#0ea5e9 0%,transparent 100%);">
      <path d="M0,8 C50,0 100,16 150,12 C200,8 250,20 300,14 C350,8 375,18 400,12 L400,32 L0,32 Z" fill="#ffffff"/>
    </svg>
  </div>

  <div class="body-zone">
    <div class="issues-box">
      <div class="issues-title">Common water issues reported locally:</div>
      ${issueItems}
      <div class="issues-footer">A free test to help homeowners understand what may be in their tap water.</div>
    </div>

    <div class="action-bar">— DO THIS NOW —</div>
    <div class="steps">
      <div class="step"><div class="step-num">1</div> Fill bottle with tap water</div>
      <div class="step"><div class="step-num">2</div> Complete &amp; sign form below</div>
      <div class="step"><div class="step-num">3</div> Hang bag back on your door</div>
    </div>
    <div class="pickup">${pickupText}</div>
    <div class="unreturned">⚠ Unreturned samples cannot be tested</div>

    <div class="form-section">
      <div class="form-title">Results Contact Information</div>
      <div class="form-row"><span class="form-label">Name</span><span class="form-line"></span></div>
      <div class="form-row"><span class="form-label">Address</span><span class="form-line"></span></div>
      <div class="form-row"><span class="form-label">Phone</span><span class="form-line"></span></div>
      <div class="form-checkboxes">
        <label><input type="checkbox" disabled /> Call</label>
        <label><input type="checkbox" disabled /> Text</label>
      </div>
      <div class="form-row" style="margin-top:2px;">
        <span style="font-size:10px;font-weight:600;color:#0c4a6e;">Water source:</span>
        <span class="form-checkboxes" style="margin:0;gap:6px;">
          <label><input type="checkbox" disabled /> City</label>
          <label><input type="checkbox" disabled /> Well</label>
        </span>
      </div>
      <div style="font-size:10px;font-weight:600;margin:3px 0 2px;color:#0c4a6e;">Check any issues you've noticed:</div>
      <div class="form-checkboxes">
        <label><input type="checkbox" disabled /> Bad taste</label>
        <label><input type="checkbox" disabled /> Hard water</label>
        <label><input type="checkbox" disabled /> Stains</label>
        <label><input type="checkbox" disabled /> Odor</label>
      </div>
      <div class="form-row" style="margin-top:4px;">
        <span class="form-label">Signature</span><span class="form-line"></span>
        <span class="form-label" style="min-width:30px;">Date</span><span class="form-line" style="max-width:60px;"></span>
      </div>
    </div>

    <div class="footer-block">
      <b>Results explained by phone within 7 days.</b><br/>
      This is a <b>free test.</b> We are not affiliated with the city.
    </div>
    <div class="footer-bold">Signature &amp; Phone number required for results</div>
  </div>
</div>
</body>
</html>`;
}

function buildBlankPrintHTML(props: DoorHangerProps): string {
  const {
    companyName,
    companyPhone,
    companyLogoUrl,
    waterIssues = DEFAULT_ISSUES,
    headline = "FREE WATER TEST",
    subheadline = "TIME SENSITIVE",
    pickupText = "Pickup by 9:00 AM tomorrow",
  } = props;

  const issueItems = waterIssues
    .map(
      (issue) =>
        `<div style="display:flex;align-items:center;gap:5px;margin:2px 0;font-size:11px;">
          <span style="font-size:13px;">☑</span>
          <span>${issue}</span>
        </div>`
    )
    .join("");

  const logoHTML = companyLogoUrl
    ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-height:32px;max-width:140px;object-fit:contain;margin:0 auto 4px;filter:grayscale(1);" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Door Hanger — ${companyName} (B&amp;W)</title>
<style>
  @page { size: 4.25in 11in; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:4.25in; height:11in;
    font-family: Arial, Helvetica, sans-serif;
    color:#1a1a1a; background:#fff;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .hanger {
    width:4.25in; height:11in;
    padding: 0.2in 0.3in 0.15in;
    display:flex; flex-direction:column;
  }
  .hole-area { display:flex; justify-content:center; margin-bottom:6px; }
  .hole {
    width:1.1in; height:1.1in; border-radius:50%;
    border:2px dashed #aaa;
    display:flex; align-items:center; justify-content:center;
    font-size:8px; color:#aaa;
  }
  .urgency-bar {
    background:#1a1a1a; color:#fff; text-align:center;
    padding:4px 8px 3px; font-size:10px; font-weight:700;
    letter-spacing:1.5px; text-transform:uppercase; border-radius:3px 3px 0 0;
  }
  .header-block {
    border:2px solid #1a1a1a; border-top:none; text-align:center;
    padding:8px 10px 10px; border-radius:0 0 3px 3px;
  }
  .header-block h1 { font-size:22px; font-weight:900; letter-spacing:1px; margin:2px 0; }
  .subheadline {
    font-size:13px; font-weight:800;
    border-top:2px solid #1a1a1a; border-bottom:2px solid #1a1a1a;
    display:inline-block; padding:2px 12px; margin:4px 0; letter-spacing:1px;
  }
  .company-name { font-size:16px; font-weight:800; margin:4px 0 1px; }
  .company-phone { font-size:14px; font-weight:700; }
  .company-sub { font-size:9px; color:#555; font-style:italic; }
  .issues-box { border:1.5px solid #ccc; border-radius:4px; padding:8px 10px; margin:8px 0; }
  .issues-title { font-size:11px; font-weight:700; margin-bottom:3px; color:#333; }
  .issues-footer { font-size:9px; color:#555; margin-top:5px; font-style:italic; }
  .action-bar {
    background:#1a1a1a; color:#fff; text-align:center; padding:5px 0;
    font-size:16px; font-weight:900; letter-spacing:2px;
    margin:6px 0 0; border-radius:3px 3px 0 0;
  }
  .steps { border:2px solid #1a1a1a; border-top:none; padding:10px 12px; border-radius:0 0 3px 3px; }
  .step { display:flex; align-items:center; gap:8px; margin:5px 0; font-size:13px; font-weight:700; }
  .step-num {
    width:22px; height:22px; border-radius:50%; background:#1a1a1a; color:#fff;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:800; flex-shrink:0;
  }
  .pickup { text-align:center; font-size:14px; font-weight:800; margin:8px 0 2px; }
  .unreturned { text-align:center; font-size:9px; color:#666; margin:2px 0 8px; font-style:italic; }
  .form-section { flex:1; display:flex; flex-direction:column; }
  .form-title { text-align:center; font-size:13px; font-weight:700; text-decoration:underline; margin-bottom:6px; }
  .form-row { display:flex; align-items:baseline; gap:4px; margin:4px 0; font-size:11px; }
  .form-label { font-weight:700; white-space:nowrap; min-width:50px; }
  .form-line { flex:1; border-bottom:1px solid #999; min-height:16px; }
  .form-checkboxes { display:flex; flex-wrap:wrap; gap:8px; font-size:10px; margin:4px 0; }
  .form-checkboxes label { display:flex; align-items:center; gap:3px; }
  .form-checkboxes input[type="checkbox"] { width:11px; height:11px; }
  .footer-block {
    border:1.5px solid #ccc; border-radius:3px; padding:6px 8px;
    text-align:center; margin-top:auto; font-size:10px; line-height:1.4;
  }
  .footer-bold { font-weight:800; font-size:9px; text-align:center; margin-top:3px; color:#444; }
  @media print { body { width:4.25in; height:11in; } }
</style>
</head>
<body>
<div class="hanger">
  <div class="hole-area"><div class="hole">✂ cut</div></div>
  <div class="urgency-bar">Urgency &amp; Action</div>
  <div class="header-block">
    ${logoHTML}
    <h1>${headline}</h1>
    <div class="subheadline">— ${subheadline} —</div>
    <div class="company-name">${companyName}</div>
    <div class="company-phone">${companyPhone}</div>
    <div class="company-sub">Local testing in your area this week only</div>
  </div>
  <div class="issues-box">
    <div class="issues-title">Common water issues reported locally include:</div>
    ${issueItems}
    <div class="issues-footer">This free test helps homeowners understand what may be in their tap water.</div>
  </div>
  <div class="action-bar">— DO THIS NOW —</div>
  <div class="steps">
    <div class="step"><div class="step-num">1</div> Fill bottle with tap water</div>
    <div class="step"><div class="step-num">2</div> Complete &amp; sign form</div>
    <div class="step"><div class="step-num">3</div> Hang bag back on your door</div>
  </div>
  <div class="pickup">${pickupText}</div>
  <div class="unreturned">⚠ Unreturned samples cannot be tested</div>
  <div class="form-section">
    <div class="form-title">Results Contact Information</div>
    <div class="form-row"><span class="form-label">Name</span><span class="form-line"></span></div>
    <div class="form-row"><span class="form-label">Address</span><span class="form-line"></span></div>
    <div class="form-row"><span class="form-label">Phone</span><span class="form-line"></span></div>
    <div class="form-checkboxes">
      <label><input type="checkbox" disabled /> Call</label>
      <label><input type="checkbox" disabled /> Text</label>
    </div>
    <div class="form-row" style="margin-top:2px;">
      <span style="font-size:10px;font-weight:600;">Water source:</span>
      <span class="form-checkboxes" style="margin:0;gap:6px;">
        <label><input type="checkbox" disabled /> City</label>
        <label><input type="checkbox" disabled /> Well</label>
      </span>
    </div>
    <div style="font-size:10px;font-weight:600;margin:4px 0 2px;">Check any issues you've noticed:</div>
    <div class="form-checkboxes">
      <label><input type="checkbox" disabled /> Bad taste</label>
      <label><input type="checkbox" disabled /> Hard water</label>
      <label><input type="checkbox" disabled /> Stains</label>
      <label><input type="checkbox" disabled /> Odor</label>
    </div>
    <div class="form-row" style="margin-top:4px;">
      <span class="form-label">Signature</span><span class="form-line"></span>
      <span class="form-label" style="min-width:30px;">Date</span><span class="form-line" style="max-width:60px;"></span>
    </div>
  </div>
  <div class="footer-block">
    <b>Results explained by phone within 7 days.</b><br/>
    This is a <b>free test.</b> We are not affiliated with the city.
  </div>
  <div class="footer-bold">Signature &amp; Phone number required for results</div>
</div>
</body>
</html>`;
}

/* ─── Component ─── */

export function DoorHangerPreview(props: DoorHangerProps) {
  const [mode, setMode] = useState<"color" | "blank">("color");

  const {
    companyName,
    companyPhone,
    companyLogoUrl,
    waterIssues = DEFAULT_ISSUES,
    headline = "FREE WATER TEST",
    subheadline = "TIME SENSITIVE",
    pickupText = "Pickup by 9:00 AM tomorrow",
  } = props;

  const handlePrint = () => {
    const html = mode === "color" ? buildColorPrintHTML(props) : buildBlankPrintHTML(props);
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => printWin.print(), 400);
    }
  };

  const handleDownload = () => {
    const html = mode === "color" ? buildColorPrintHTML(props) : buildBlankPrintHTML(props);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `door-hanger-${mode}-${companyName.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded! Open in browser and print at 4.25″ × 11″");
  };

  /* ─── Shared form section (used in both previews) ─── */
  const formSection = (labelColor: string, lineColor: string) => (
    <div className="flex-1 flex flex-col mt-1">
      <p
        className="text-center text-[9px] font-bold mb-1"
        style={{ color: labelColor, borderBottom: mode === "color" ? "2px solid #0ea5e9" : "none", textDecoration: mode === "blank" ? "underline" : "none", display: "inline-block", margin: "0 auto", paddingBottom: 2 }}
      >
        Results Contact Information
      </p>
      {["Name", "Address", "Phone"].map((label) => (
        <div key={label} className="flex items-baseline gap-1 my-[2px]">
          <span className="text-[8px] font-bold w-10 shrink-0" style={{ color: labelColor }}>{label}</span>
          <span className="flex-1 min-h-[12px]" style={{ borderBottom: `1px solid ${lineColor}` }} />
        </div>
      ))}
      <div className="flex gap-3 text-[8px] my-0.5" style={{ color: mode === "color" ? "#334155" : undefined }}>
        <span>☐ Call</span> <span>☐ Text</span>
      </div>
      <div className="flex items-center gap-1 text-[8px] my-0.5">
        <span className="font-semibold" style={{ color: labelColor }}>Water source:</span>
        <span>☐ City</span> <span>☐ Well</span>
      </div>
      <p className="text-[8px] font-semibold my-0.5" style={{ color: labelColor }}>Check any issues you've noticed:</p>
      <div className="flex gap-2 text-[8px]" style={{ color: mode === "color" ? "#334155" : undefined }}>
        <span>☐ Bad taste</span> <span>☐ Hard water</span> <span>☐ Stains</span> <span>☐ Odor</span>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[8px] font-bold w-12 shrink-0" style={{ color: labelColor }}>Signature</span>
        <span className="flex-1 min-h-[12px]" style={{ borderBottom: `1px solid ${lineColor}` }} />
        <span className="text-[8px] font-bold w-6 shrink-0 ml-1" style={{ color: labelColor }}>Date</span>
        <span className="w-12 min-h-[12px]" style={{ borderBottom: `1px solid ${lineColor}` }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex justify-center gap-1">
        <Button
          size="sm"
          variant={mode === "color" ? "default" : "outline"}
          className="text-xs h-7 px-3"
          onClick={() => setMode("color")}
        >
          <Palette className="size-3 mr-1" /> Color
        </Button>
        <Button
          size="sm"
          variant={mode === "blank" ? "default" : "outline"}
          className="text-xs h-7 px-3"
          onClick={() => setMode("blank")}
        >
          <FileText className="size-3 mr-1" /> Blank
        </Button>
      </div>

      {mode === "blank" && (
        <p className="text-center text-[10px] text-muted-foreground italic">Black & white — cheaper to print</p>
      )}

      {/* ─── In-app scaled preview ─── */}
      <div className="mx-auto w-[306px] origin-top">
        {mode === "color" ? (
          /* ═══════ COLOR PREVIEW ═══════ */
          <div
            className="rounded-lg border-2 border-sky-300/40 shadow-xl overflow-hidden"
            style={{ width: 306, height: 792, display: "flex", flexDirection: "column", fontSize: 11 }}
          >
            {/* Blue gradient header */}
            <div
              className="text-white text-center relative"
              style={{
                background: "linear-gradient(175deg, #0c4a6e 0%, #0369a1 40%, #0ea5e9 100%)",
                padding: "8px 14px 0",
              }}
            >
              {/* Bubble decorations */}
              <svg viewBox="0 0 120 80" className="absolute right-1 top-1 w-10 opacity-20">
                <circle cx="20" cy="30" r="8" fill="none" stroke="#7dd3fc" strokeWidth="1.2"/>
                <circle cx="45" cy="15" r="5" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
                <circle cx="38" cy="52" r="6" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
                <circle cx="65" cy="35" r="4" fill="none" stroke="#7dd3fc" strokeWidth="0.8"/>
                <circle cx="85" cy="55" r="7" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
                <circle cx="105" cy="20" r="5" fill="none" stroke="#7dd3fc" strokeWidth="0.8"/>
              </svg>
              <svg viewBox="0 0 120 80" className="absolute left-1 bottom-2 w-8 opacity-15">
                <circle cx="30" cy="20" r="6" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
                <circle cx="55" cy="45" r="4" fill="none" stroke="#7dd3fc" strokeWidth="0.8"/>
                <circle cx="80" cy="25" r="5" fill="none" stroke="#7dd3fc" strokeWidth="0.9"/>
              </svg>

              {/* Hole */}
              <div className="flex justify-center mb-1">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-[7px]"
                  style={{ border: "2px dashed rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.15)", color: "rgba(255,255,255,0.5)" }}
                >
                  ✂ cut
                </div>
              </div>

              {companyLogoUrl && (
                <img src={companyLogoUrl} alt="" className="mx-auto h-5 max-w-[100px] object-contain mb-0.5" />
              )}
              <h3 className="text-[18px] font-black leading-tight tracking-wider" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
                {headline}
              </h3>
              <div
                className="inline-block px-3 py-[1px] text-[9px] font-extrabold tracking-wider my-1"
                style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 20 }}
              >
                — {subheadline} —
              </div>
              <p className="text-[11px] font-extrabold">{companyName}</p>
              <p className="text-[10px] font-bold">{companyPhone}</p>
              <p className="text-[6px] opacity-75 italic mb-1">Local testing in your area this week only</p>
            </div>

            {/* Wave transition */}
            <div style={{ marginTop: -1 }}>
              <svg viewBox="0 0 400 32" preserveAspectRatio="none" className="w-full block" style={{ height: 16, background: "linear-gradient(180deg, #0ea5e9, transparent)" }}>
                <path d="M0,8 C50,0 100,16 150,12 C200,8 250,20 300,14 C350,8 375,18 400,12 L400,32 L0,32 Z" fill="white"/>
              </svg>
            </div>

            {/* Body */}
            <div className="bg-white text-black px-3 flex-1 flex flex-col" style={{ paddingTop: 2 }}>
              {/* Issues */}
              <div className="rounded-md px-2 py-1.5 my-1" style={{ border: "1.5px solid #bae6fd", background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)" }}>
                <p className="text-[8px] font-bold mb-0.5" style={{ color: "#0c4a6e" }}>Common water issues reported locally:</p>
                {waterIssues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-1 text-[8px]" style={{ color: "#1e3a5f" }}>
                    <span className="text-[9px]" style={{ color: "#0ea5e9" }}>💧</span>
                    <span>{issue}</span>
                  </div>
                ))}
                <p className="text-[7px] italic mt-1" style={{ color: "#64748b" }}>A free test to help homeowners understand what may be in their tap water.</p>
              </div>

              {/* DO THIS NOW */}
              <div className="text-white text-center py-1 text-[12px] font-black tracking-widest rounded-t" style={{ background: "linear-gradient(90deg, #0c4a6e, #0369a1)" }}>
                — DO THIS NOW —
              </div>
              <div className="px-2 py-1.5 rounded-b" style={{ border: "2px solid #0369a1", borderTop: "none", background: "#f0f9ff" }}>
                {["Fill bottle with tap water", "Complete & sign form below", "Hang bag back on your door"].map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5 my-0.5 text-[10px] font-bold" style={{ color: "#0c4a6e" }}>
                    <span
                      className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[8px] font-extrabold shrink-0"
                      style={{ background: "linear-gradient(135deg, #0369a1, #0ea5e9)" }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] font-extrabold text-red-600 mt-1">{pickupText}</p>
              <p className="text-center text-[7px] italic" style={{ color: "#64748b" }}>⚠ Unreturned samples cannot be tested</p>

              {formSection("#0c4a6e", "#94a3b8")}

              {/* Footer */}
              <div className="rounded-md px-2 py-1.5 text-center mt-1" style={{ background: "linear-gradient(135deg, #e0f2fe, #f0f9ff)", border: "1.5px solid #bae6fd", color: "#0c4a6e", fontSize: 8 }}>
                <p className="font-bold text-[8px]">Results explained by phone within 7 days.</p>
                <p className="text-[8px]">This is a <b>free test.</b> We are not affiliated with the city.</p>
              </div>
              <p className="text-[7px] font-extrabold text-center mt-0.5" style={{ color: "#0369a1" }}>Signature &amp; Phone number required for results</p>
            </div>
          </div>
        ) : (
          /* ═══════ BLANK PREVIEW ═══════ */
          <div
            className="bg-white text-black rounded-lg border-2 border-gray-300 shadow-xl overflow-hidden"
            style={{ width: 306, height: 792, padding: "12px 14px 10px", display: "flex", flexDirection: "column", fontSize: 11 }}
          >
            {/* Hole */}
            <div className="flex justify-center mb-1">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400">
                ✂ cut
              </div>
            </div>

            {/* Urgency bar */}
            <div className="bg-gray-900 text-white text-center py-[3px] text-[8px] font-bold tracking-widest uppercase rounded-t">
              Urgency &amp; Action
            </div>
            <div className="border-2 border-t-0 border-gray-900 bg-white text-center py-2 px-2 rounded-b">
              {companyLogoUrl && (
                <img src={companyLogoUrl} alt="" className="mx-auto h-6 max-w-[120px] object-contain mb-1 grayscale" />
              )}
              <h3 className="text-[16px] font-black leading-tight tracking-wide">{headline}</h3>
              <div className="inline-block border-y-2 border-gray-900 px-3 py-[1px] text-[10px] font-extrabold tracking-wide my-1">
                — {subheadline} —
              </div>
              <p className="text-[12px] font-extrabold">{companyName}</p>
              <p className="text-[11px] font-bold">{companyPhone}</p>
              <p className="text-[7px] text-gray-500 italic">Local testing in your area this week only</p>
            </div>

            {/* Issues box */}
            <div className="border border-gray-300 rounded px-2 py-1.5 my-1.5">
              <p className="text-[8px] font-bold text-gray-700 mb-0.5">Common water issues reported locally include:</p>
              {waterIssues.map((issue, i) => (
                <div key={i} className="flex items-center gap-1 text-[8px]">
                  <span className="text-[10px]">☑</span>
                  <span>{issue}</span>
                </div>
              ))}
              <p className="text-[7px] text-gray-500 italic mt-1">This free test helps homeowners understand what may be in their tap water.</p>
            </div>

            {/* DO THIS NOW */}
            <div className="bg-gray-900 text-white text-center py-1 text-[12px] font-black tracking-widest rounded-t">
              — DO THIS NOW —
            </div>
            <div className="border-2 border-t-0 border-gray-900 px-2 py-1.5 rounded-b">
              {["Fill bottle with tap water", "Complete & sign form", "Hang bag back on your door"].map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 my-0.5 text-[10px] font-bold">
                  <span className="w-4 h-4 rounded-full bg-gray-900 text-white flex items-center justify-center text-[8px] font-extrabold shrink-0">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] font-extrabold text-gray-900 mt-1">{pickupText}</p>
            <p className="text-center text-[7px] text-gray-500 italic">⚠ Unreturned samples cannot be tested</p>

            {formSection("#1a1a1a", "#999")}

            {/* Footer */}
            <div className="border border-gray-300 rounded px-2 py-1.5 text-center mt-1">
              <p className="text-[8px] font-bold">Results explained by phone within 7 days.</p>
              <p className="text-[8px]">This is a <b>free test.</b> We are not affiliated with the city.</p>
            </div>
            <p className="text-[7px] font-extrabold text-center text-gray-600 mt-0.5">Signature &amp; Phone number required for results</p>
          </div>
        )}
      </div>

      {/* Size callout */}
      <p className="text-center text-[10px] text-muted-foreground">
        Standard print size: 4.25″ × 11″ — fits most door hanger templates
      </p>

      {/* Actions */}
      <div className="flex gap-2 justify-center">
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="size-3 mr-1" /> Print
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="size-3 mr-1" /> Download HTML
        </Button>
      </div>
    </div>
  );
}
