/**
 * Client-side PDF generation using html2canvas + jsPDF.
 * Captures the React-rendered report pages exactly as they appear,
 * eliminating any mismatch between the preview and the PDF output.
 */
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056;

// Letter size in points (jsPDF uses points: 72pt = 1 inch)
const LETTER_W_PT = 612; // 8.5"
const LETTER_H_PT = 792; // 11"

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
  const pages = Array.from(container.querySelectorAll<HTMLElement>("[data-report-page]"));
  if (pages.length === 0) {
    throw new Error("No report pages found. Make sure each <Page> has data-report-page.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i];

    // Force exact dimensions for capture — clamp content to page boundary
    const origStyles = {
      height: pageEl.style.height,
      minHeight: pageEl.style.minHeight,
      maxHeight: pageEl.style.maxHeight,
      overflow: pageEl.style.overflow,
    };
    pageEl.style.height = `${PAGE_HEIGHT_PX}px`;
    pageEl.style.minHeight = `${PAGE_HEIGHT_PX}px`;
    pageEl.style.maxHeight = `${PAGE_HEIGHT_PX}px`;
    pageEl.style.overflow = "hidden";

    const canvas = await html2canvas(pageEl, {
      scale: 2, // 2× for crisp output
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: PAGE_WIDTH_PX,
      height: PAGE_HEIGHT_PX,
      windowWidth: PAGE_WIDTH_PX + 100,
      logging: false,
    });

    // Restore original styles
    pageEl.style.height = origStyles.height;
    pageEl.style.minHeight = origStyles.minHeight;
    pageEl.style.maxHeight = origStyles.maxHeight;
    pageEl.style.overflow = origStyles.overflow;

    // Add page (skip addPage for the first page — jsPDF starts with one)
    if (i > 0) {
      pdf.addPage("letter", "portrait");
    }

    // Draw canvas image onto the PDF page, filling exactly
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", 0, 0, LETTER_W_PT, LETTER_H_PT);
  }

  return pdf.output("blob");
}
