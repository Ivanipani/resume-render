import puppeteer from 'puppeteer';
import type { ResumeStyles } from './types.js';
import { PAPER_SIZES } from './types.js';
import { generateCSS, generateContainerStyles } from './styles.js';
import { replaceIconifySpans } from './icons.js';

/**
 * Generate complete HTML document for PDF rendering
 */
function generateHTML(resumeHtml: string, styles: ResumeStyles): string {
  const css = generateCSS(styles);
  const containerStyles = generateContainerStyles(styles);
  const paperDimensions = PAPER_SIZES[styles.paper];

  // Replace Iconify spans with inline SVGs
  const htmlWithIcons = replaceIconifySpans(resumeHtml);

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
      width: 1em;
      height: 1em;
    }
  </style>
</head>
<body>
  <div class="resume" style="${containerStyles} width: 100%; min-height: ${paperDimensions.height}mm;">
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
  options: PDFOptions
): Promise<void> {
  const html = generateHTML(resumeHtml, styles);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set content and wait for rendering to complete
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Emulate print media for @media print rules
    await page.emulateMediaType('print');

    // Generate PDF
    await page.pdf({
      path: options.outputPath,
      format: styles.paper === 'A4' ? 'A4' : 'Letter',
      printBackground: options.printBackground ?? true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });

    console.log(`PDF generated: ${options.outputPath}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generate HTML file for debugging
 */
export function generateHTMLFile(resumeHtml: string, styles: ResumeStyles): string {
  return generateHTML(resumeHtml, styles);
}
