import puppeteer from "puppeteer";
import type { ResumeStyles, PaperSize } from "./types.js";
import { PAPER_SIZES } from "./types.js";
import { generateCSS, generateContainerStyles } from "./styles.js";

import { replaceIconSpans } from "./icons.js";

/**
 * Convert millimeters to pixels (96 DPI)
 */
function mmToPx(mm: number): number {
  return Math.round(mm * 3.7795275591);
}

/**
 * Generate complete HTML document for PDF rendering
 */
function generateHTML(resumeHtml: string, styles: ResumeStyles): string {
  const css = generateCSS(styles);
  const containerStyles = generateContainerStyles(styles);

  // Replace Iconify spans with inline SVGs
  const htmlWithIcons = replaceIconSpans(resumeHtml);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
${css}
    html, body {
      margin: 0;
      padding: 0;
    }
    .icon {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }
    .icon svg {
      width: 1.5em;
      height: 1.5em;
    }
  </style>
  <!-- Iconify for icons in contact info -->
  <script src="https://code.iconify.design/2/2.2.1/iconify.min.js"></script>
</head>
<body>
  <div class="resume" style="${containerStyles} width: 100%;">
${htmlWithIcons}
  </div>
</body>
</html>`;
}

/**
 * Options for PDF generation
 */
export interface PDFOptions {
  /** Output file path */
  outputPath: string;
  /** Whether to display header and footer */
  displayHeaderFooter?: boolean;
  /** Print background graphics */
  printBackground?: boolean;
}

/**
 * Generate PDF from resume HTML using Puppeteer
 */
export async function generatePDF(
  resumeHtml: string,
  styles: ResumeStyles,
  options: PDFOptions,
): Promise<void> {
  const html = generateHTML(resumeHtml, styles);
  const paperDimensions = PAPER_SIZES[styles.paper];

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to paper dimensions
    await page.setViewport({
      width: mmToPx(paperDimensions.width),
      height: mmToPx(paperDimensions.height),
      deviceScaleFactor: 2, // Higher quality
    });

    // Set content and wait for everything to load
    await page.setContent(html, {
      waitUntil: ["load", "networkidle0"],
    });

    // Wait for Iconify icons to render
    await page
      .waitForFunction(
        () => {
          const icons = document.querySelectorAll(".iconify");
          return Array.from(icons).every((icon) => icon.querySelector("svg"));
        },
        { timeout: 5000 },
      )
      .catch(() => {
        // Icons may not be present, continue anyway
      });

    // Generate PDF
    await page.pdf({
      path: options.outputPath,
      format: styles.paper.toUpperCase() as "A4" | "Letter",
      printBackground: options.printBackground ?? true,
      scale: 0.85,
    });

    console.log(`PDF generated: ${options.outputPath}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generate HTML file for debugging
 */
export function generateHTMLFile(
  resumeHtml: string,
  styles: ResumeStyles,
): string {
  return generateHTML(resumeHtml, styles);
}
