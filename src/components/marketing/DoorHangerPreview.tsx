/**
 * DoorHangerPreview — print-ready 4.25″ × 11″ door hanger
 * styled after the classic water-test flyer: urgency header,
 * common water issues, 3-step instructions, and contact form.
 *
 * Auto-populates company name, phone, website, and logo.
 */

import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DoorHangerProps {
  companyName: string;
  companyPhone: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  /** Items for the "Common water issues" checklist */
  waterIssues?: string[];
  /** Override the headline */
  headline?: string;
  /** Override the sub-headline */
  subheadline?: string;
  /** Override the pickup time text */
  pickupText?: string;
}

const DEFAULT_ISSUES = [
  "Chlorine taste & odor",
  "Hard water buildup",
  "Rust staining",
  "Sulfur smells",
  "Elevated TDS levels",
];

/**
 * Builds the full HTML for the print-ready door hanger.
 * 4.25in × 11in with crop marks, proper bleed, and print CSS.
 */
function buildPrintHTML(props: DoorHangerProps): string {
  const {
    companyName,
    companyPhone,
    companyWebsite,
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
          <span style="color:#1a7a4c;font-size:13px;">☑</span>
          <span>${issue}</span>
        </div>`
    )
    .join("");

  const logoHTML = companyLogoUrl
    ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-height:36px;max-width:160px;object-fit:contain;margin:0 auto 4px;" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Door Hanger — ${companyName}</title>
<style>
  @page {
    size: 4.25in 11in;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 4.25in;
    height: 11in;
    font-family: Arial, Helvetica, sans-serif;
    color: #1a1a1a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .hanger {
    width: 4.25in;
    height: 11in;
    padding: 0.25in 0.3in 0.2in;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* ---- Hole cutout ---- */
  .hole-area {
    display: flex;
    justify-content: center;
    margin-bottom: 6px;
  }
  .hole {
    width: 1.15in;
    height: 1.15in;
    border-radius: 50%;
    border: 2px dashed #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #aaa;
  }

  /* ---- Urgency header ---- */
  .urgency-bar {
    background: #1a1a1a;
    color: #fff;
    text-align: center;
    padding: 4px 8px 3px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-radius: 3px 3px 0 0;
  }
  .header-block {
    background: #f8f8f8;
    border: 2px solid #1a1a1a;
    border-top: none;
    text-align: center;
    padding: 8px 10px 10px;
    border-radius: 0 0 3px 3px;
  }
  .header-block h1 {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 1px;
    margin: 2px 0;
    line-height: 1.1;
  }
  .header-block .subheadline {
    font-size: 13px;
    font-weight: 800;
    border-top: 2px solid #1a1a1a;
    border-bottom: 2px solid #1a1a1a;
    display: inline-block;
    padding: 2px 12px;
    margin: 4px 0;
    letter-spacing: 1px;
  }
  .company-name {
    font-size: 16px;
    font-weight: 800;
    margin: 4px 0 1px;
  }
  .company-phone {
    font-size: 14px;
    font-weight: 700;
    margin: 1px 0;
  }
  .company-sub {
    font-size: 9px;
    color: #555;
    font-style: italic;
  }

  /* ---- Issues box ---- */
  .issues-box {
    border: 1.5px solid #ccc;
    border-radius: 4px;
    padding: 8px 10px;
    margin: 8px 0;
  }
  .issues-title {
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 3px;
    color: #333;
  }
  .issues-footer {
    font-size: 9px;
    color: #555;
    margin-top: 5px;
    font-style: italic;
  }

  /* ---- DO THIS NOW ---- */
  .action-bar {
    background: #1a1a1a;
    color: #fff;
    text-align: center;
    padding: 5px 0;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 2px;
    margin: 6px 0 0;
    border-radius: 3px 3px 0 0;
  }
  .action-bar span {
    font-size: 14px;
  }
  .steps {
    border: 2px solid #1a1a1a;
    border-top: none;
    padding: 10px 12px;
    border-radius: 0 0 3px 3px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 5px 0;
    font-size: 13px;
    font-weight: 700;
  }
  .step-num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #1a1a1a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }
  .pickup {
    text-align: center;
    font-size: 14px;
    font-weight: 800;
    color: #c00;
    margin: 8px 0 2px;
  }
  .unreturned {
    text-align: center;
    font-size: 9px;
    color: #666;
    margin: 2px 0 8px;
    font-style: italic;
  }

  /* ---- Contact Form ---- */
  .form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .form-title {
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    text-decoration: underline;
    margin-bottom: 6px;
  }
  .form-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 4px 0;
    font-size: 11px;
  }
  .form-label {
    font-weight: 700;
    white-space: nowrap;
    min-width: 50px;
  }
  .form-line {
    flex: 1;
    border-bottom: 1px solid #999;
    min-height: 16px;
  }
  .form-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 10px;
    margin: 4px 0;
  }
  .form-checkboxes label {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .form-checkboxes input[type="checkbox"] {
    width: 11px;
    height: 11px;
  }

  /* ---- Footer ---- */
  .footer-block {
    background: #f0f0f0;
    border: 1.5px solid #ccc;
    border-radius: 3px;
    padding: 6px 8px;
    text-align: center;
    margin-top: auto;
    font-size: 10px;
    line-height: 1.4;
  }
  .footer-block b {
    font-size: 11px;
  }
  .footer-bold {
    font-weight: 800;
    font-size: 9px;
    text-align: center;
    margin-top: 3px;
    color: #444;
  }

  @media print {
    body { width: 4.25in; height: 11in; }
  }
</style>
</head>
<body>
<div class="hanger">
  <!-- Hole for doorknob -->
  <div class="hole-area">
    <div class="hole">✂ cut</div>
  </div>

  <!-- Urgency header -->
  <div class="urgency-bar">Urgency &amp; Action</div>
  <div class="header-block">
    ${logoHTML}
    <h1>${headline}</h1>
    <div class="subheadline">— ${subheadline} —</div>
    <div class="company-name">${companyName}</div>
    <div class="company-phone">${companyPhone}</div>
    <div class="company-sub">Local testing in your area this week only</div>
  </div>

  <!-- Common issues checklist -->
  <div class="issues-box">
    <div class="issues-title">Common water issues reported locally include:</div>
    ${issueItems}
    <div class="issues-footer">This free test helps homeowners understand what may be in their tap water.</div>
  </div>

  <!-- DO THIS NOW -->
  <div class="action-bar"><span>—</span> DO THIS NOW <span>—</span></div>
  <div class="steps">
    <div class="step"><div class="step-num">1</div> Fill bottle with tap water</div>
    <div class="step"><div class="step-num">2</div> Complete &amp; sign form</div>
    <div class="step"><div class="step-num">3</div> Hang bag back on your door</div>
  </div>
  <div class="pickup">${pickupText}</div>
  <div class="unreturned">⚠ Unreturned samples cannot be tested</div>

  <!-- Contact form -->
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

  <!-- Footer -->
  <div class="footer-block">
    <b>Results explained by phone within 7 days.</b><br/>
    This is a <b>free test.</b><br/>
    We are not affiliated with the city.
  </div>
  <div class="footer-bold">Signature &amp; Phone number required for results</div>
</div>
</body>
</html>`;
}

export function DoorHangerPreview(props: DoorHangerProps) {
  const {
    companyName,
    companyPhone,
    companyWebsite,
    companyLogoUrl,
    waterIssues = DEFAULT_ISSUES,
    headline = "FREE WATER TEST",
    subheadline = "TIME SENSITIVE",
    pickupText = "Pickup by 9:00 AM tomorrow",
  } = props;

  const handlePrint = () => {
    const html = buildPrintHTML(props);
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      // Short delay to let images load before printing
      setTimeout(() => printWin.print(), 400);
    }
  };

  const handleDownload = () => {
    const html = buildPrintHTML(props);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `door-hanger-${companyName.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded! Open in browser and print at 4.25″ × 11″");
  };

  return (
    <div className="space-y-4">
      {/* In-app scaled preview */}
      <div className="mx-auto w-[306px] origin-top">
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
          <div className="border-2 border-t-0 border-gray-900 bg-gray-50 text-center py-2 px-2 rounded-b">
            {companyLogoUrl && (
              <img src={companyLogoUrl} alt="" className="mx-auto h-6 max-w-[120px] object-contain mb-1" />
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
                <span className="text-green-700 text-[10px]">☑</span>
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
          <p className="text-center text-[10px] font-extrabold text-red-700 mt-1">{pickupText}</p>
          <p className="text-center text-[7px] text-gray-500 italic">⚠ Unreturned samples cannot be tested</p>

          {/* Contact Form */}
          <div className="flex-1 flex flex-col mt-1">
            <p className="text-center text-[9px] font-bold underline mb-1">Results Contact Information</p>
            {["Name", "Address", "Phone"].map((label) => (
              <div key={label} className="flex items-baseline gap-1 my-[2px]">
                <span className="text-[8px] font-bold w-10 shrink-0">{label}</span>
                <span className="flex-1 border-b border-gray-400 min-h-[12px]" />
              </div>
            ))}
            <div className="flex gap-3 text-[8px] my-0.5">
              <span>☐ Call</span> <span>☐ Text</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] my-0.5">
              <span className="font-semibold">Water source:</span>
              <span>☐ City</span> <span>☐ Well</span>
            </div>
            <p className="text-[8px] font-semibold my-0.5">Check any issues you've noticed:</p>
            <div className="flex gap-2 text-[8px]">
              <span>☐ Bad taste</span> <span>☐ Hard water</span> <span>☐ Stains</span> <span>☐ Odor</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[8px] font-bold w-12 shrink-0">Signature</span>
              <span className="flex-1 border-b border-gray-400 min-h-[12px]" />
              <span className="text-[8px] font-bold w-6 shrink-0 ml-1">Date</span>
              <span className="w-12 border-b border-gray-400 min-h-[12px]" />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 border border-gray-300 rounded px-2 py-1.5 text-center mt-1">
            <p className="text-[8px] font-bold">Results explained by phone within 7 days.</p>
            <p className="text-[8px]">This is a <b>free test.</b></p>
            <p className="text-[8px]">We are not affiliated with the city.</p>
          </div>
          <p className="text-[7px] font-extrabold text-center text-gray-600 mt-0.5">Signature &amp; Phone number required for results</p>
        </div>
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
