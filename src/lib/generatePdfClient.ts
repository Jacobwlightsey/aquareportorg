/**
 * Client-side PDF generation using html2canvas-pro + jsPDF.
 * Captures the React-rendered report pages exactly as they appear,
 * eliminating any mismatch between the preview and the PDF output.
 *
 * Strategy for overflowing pages:
 *  - If content fits in one page → render 1:1
 *  - If content overflows by ≤30% → scale down to fit on one page
 *  - If content overflows by >30% → split across multiple PDF pages
 */
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056; // 11" at 96dpi

// Letter size in points (jsPDF uses points: 72pt = 1 inch)
const LETTER_W_PT = 612; // 8.5"
const LETTER_H_PT = 792; // 11"

// If a page overflows by no more than this ratio, scale to fit one page.
// Beyond this, split into multiple PDF pages to keep text readable.
const SCALE_FIT_THRESHOLD = 1.3; // 30% overflow → scale; above → split

/**
 * Capture every `[data-report-page]` element inside the given container,
 * render each to a canvas, and assemble into a multi-page PDF.
 *
 * @param container  The DOM element wrapping all the report pages
 * @returns          The PDF as a Blob
 */
export async function generatePdfFromDom(container: HTMLElement): Promise<Blob> {
  // Wait for fonts to be ready
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Collect all page divs
  const pages = Array.from(
    container.querySelectorAll<HTMLElement>("[data-report-page]")
  );
  if (pages.length === 0) {
    throw new Error(
      "No report pages found. Make sure each <Page> has data-report-page."
    );
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const RENDER_SCALE = 2; // 2× for crisp output
  let isFirstPdfPage = true;

  for (const pageEl of pages) {
    // ── Temporarily allow natural height ────────────────────────
    const origStyles = {
      height: pageEl.style.height,
      minHeight: pageEl.style.minHeight,
      maxHeight: pageEl.style.maxHeight,
      overflow: pageEl.style.overflow,
    };

    pageEl.style.height = "auto";
    pageEl.style.minHeight = `${PAGE_HEIGHT_PX}px`;
    pageEl.style.maxHeight = "none";
    pageEl.style.overflow = "visible";

    const naturalHeight = Math.max(pageEl.scrollHeight, PAGE_HEIGHT_PX);

    const canvas = await html2canvas(pageEl, {
      scale: RENDER_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: PAGE_WIDTH_PX,
      height: naturalHeight,
      windowWidth: PAGE_WIDTH_PX + 100,
      logging: false,
    });

    // Restore original styles
    pageEl.style.height = origStyles.height;
    pageEl.style.minHeight = origStyles.minHeight;
    pageEl.style.maxHeight = origStyles.maxHeight;
    pageEl.style.overflow = origStyles.overflow;

    // ── Determine strategy ──────────────────────────────────────
    const overflowRatio = naturalHeight / PAGE_HEIGHT_PX;

    if (overflowRatio <= SCALE_FIT_THRESHOLD) {
      // ── Strategy A: Scale to fit one page ─────────────────────
      // Content either fits exactly or overflows by ≤30%.
      // Scale the image proportionally so it fits within the letter page.
      if (!isFirstPdfPage) {
        pdf.addPage("letter", "portrait");
      }
      isFirstPdfPage = false;

      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      // Scale: the image width fills the page, height is proportional
      const destH = Math.min(LETTER_H_PT, LETTER_H_PT * overflowRatio <= LETTER_H_PT
        ? (naturalHeight / PAGE_HEIGHT_PX) * LETTER_H_PT
        : LETTER_H_PT);
      // Simpler: fit the full canvas into the page width, scale height proportionally
      const imgAspect = canvas.height / canvas.width;
      const scaledH = LETTER_W_PT * imgAspect;
      const finalH = Math.min(scaledH, LETTER_H_PT);
      const finalW = finalH === LETTER_H_PT ? LETTER_H_PT / imgAspect : LETTER_W_PT;

      pdf.addImage(imgData, "JPEG", 0, 0, finalW, finalH);
    } else {
      // ── Strategy B: Split across multiple pages ───────────────
      // Content is significantly taller than one page (e.g. long table).
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const pageSliceH = PAGE_HEIGHT_PX * RENDER_SCALE;
      const numSlices = Math.ceil(canvasH / pageSliceH);

      for (let s = 0; s < numSlices; s++) {
        // Skip the last slice if it's trivially small (< 5% of a page)
        const srcY = s * pageSliceH;
        const srcH = Math.min(pageSliceH, canvasH - srcY);
        if (s === numSlices - 1 && srcH < pageSliceH * 0.05) {
          continue; // Don't create a nearly-blank page for tiny overflow
        }

        if (!isFirstPdfPage) {
          pdf.addPage("letter", "portrait");
        }
        isFirstPdfPage = false;

        // Create a sub-canvas for this slice
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvasW;
        sliceCanvas.height = Math.ceil(srcH);
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2D context");

        ctx.drawImage(
          canvas,
          0, srcY, canvasW, srcH,  // source rect
          0, 0, canvasW, srcH      // dest rect
        );

        const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const destH = (srcH / pageSliceH) * LETTER_H_PT;
        pdf.addImage(imgData, "JPEG", 0, 0, LETTER_W_PT, destH);
      }
    }
  }

  return pdf.output("blob");
}
