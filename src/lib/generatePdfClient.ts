/**
 * Client-side PDF generation using html2canvas-pro + jsPDF.
 * Captures the React-rendered report pages exactly as they appear,
 * eliminating any mismatch between the preview and the PDF output.
 *
 * Pages that overflow the standard letter height are automatically
 * split across multiple PDF pages (no content clipping).
 */
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056; // 11" at 96dpi

// Letter size in points (jsPDF uses points: 72pt = 1 inch)
const LETTER_W_PT = 612; // 8.5"
const LETTER_H_PT = 792; // 11"

/**
 * Capture every `[data-report-page]` element inside the given container,
 * render each to a canvas, and assemble into a multi-page PDF.
 *
 * If a page's content is taller than one letter page, it is sliced
 * across multiple PDF pages so nothing gets cut off.
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

  const SCALE = 2; // 2× for crisp output
  let isFirstPdfPage = true;

  for (const pageEl of pages) {
    // ── Capture at *natural* height ─────────────────────────────
    // Remove any height constraints so we get the true content size.
    const origStyles = {
      height: pageEl.style.height,
      minHeight: pageEl.style.minHeight,
      maxHeight: pageEl.style.maxHeight,
      overflow: pageEl.style.overflow,
    };

    // Let it expand to its natural content height
    pageEl.style.height = "auto";
    pageEl.style.minHeight = `${PAGE_HEIGHT_PX}px`;
    pageEl.style.maxHeight = "none";
    pageEl.style.overflow = "visible";

    const naturalHeight = pageEl.scrollHeight;

    const canvas = await html2canvas(pageEl, {
      scale: SCALE,
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

    // ── Map canvas → PDF pages ──────────────────────────────────
    const canvasW = canvas.width; // PAGE_WIDTH_PX * SCALE
    const canvasH = canvas.height; // naturalHeight * SCALE

    // One PDF-page worth of canvas pixels (height)
    const pageSliceH = PAGE_HEIGHT_PX * SCALE;
    const numSlices = Math.ceil(canvasH / pageSliceH);

    for (let s = 0; s < numSlices; s++) {
      if (!isFirstPdfPage) {
        pdf.addPage("letter", "portrait");
      }
      isFirstPdfPage = false;

      const srcY = s * pageSliceH;
      const srcH = Math.min(pageSliceH, canvasH - srcY);

      // Create a sub-canvas for this slice
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvasW;
      sliceCanvas.height = Math.ceil(srcH);
      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D context");

      // Draw the relevant horizontal strip from the full canvas
      ctx.drawImage(
        canvas,
        0,
        srcY, // source x, y
        canvasW,
        srcH, // source w, h
        0,
        0, // dest x, y
        canvasW,
        srcH // dest w, h
      );

      const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);

      // Destination height: proportional to how much of the page this slice fills
      const destH = (srcH / pageSliceH) * LETTER_H_PT;
      pdf.addImage(imgData, "JPEG", 0, 0, LETTER_W_PT, destH);
    }
  }

  return pdf.output("blob");
}
