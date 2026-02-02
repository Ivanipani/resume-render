import puppeteer from 'puppeteer';
import type { ResumeStyles, PaperSize } from './types.js';
import { PAPER_SIZES } from './types.js';
import { generateCSS, generateContainerStyles } from './styles.js';

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
  const paperDimensions = PAPER_SIZES[styles.paper];

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
  <!-- Iconify for icons in contact info -->
  <script src="https://code.iconify.design/2/2.2.1/iconify.min.js"></script>
</head>
<body>
  <div class="resume" style="${containerStyles} width: ${paperDimensions.width}mm; min-height: ${paperDimensions.height}mm;">
${resumeHtml}
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
 * Generate PDF from resume HTML
 */
export async function generatePDF(
  resumeHtml: string,
  styles: ResumeStyles,
  options: PDFOptions
): Promise<void> {
  const html = generateHTML(resumeHtml, styles);
  const paperDimensions = PAPER_SIZES[styles.paper];

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport to paper dimensions
    await page.setViewport({
      width: mmToPx(paperDimensions.width),
      height: mmToPx(paperDimensions.height),
      deviceScaleFactor: 2 // Higher quality
    });

    // Set content and wait for everything to load
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0']
    });

    // Wait for Iconify icons to render
    await page.waitForFunction(() => {
      const icons = document.querySelectorAll('.iconify');
      return Array.from(icons).every(icon => icon.querySelector('svg'));
    }, { timeout: 5000 }).catch(() => {
      // Icons may not be present, continue anyway
    });

    // Generate PDF
    await page.pdf({
      path: options.outputPath,
      format: styles.paper.toUpperCase() as 'A4' | 'Letter',
      printBackground: options.printBackground ?? true,
      displayHeaderFooter: options.displayHeaderFooter ?? false,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      preferCSSPageSize: true
    });

    console.log(`PDF generated: ${options.outputPath}`);
  } finally {
    await browser.close();
  }
}

/**
 * Run wkhtmltopdf command
 */
function runWkhtmltopdf(
  inputPath: string,
  outputPath: string,
  styles: ResumeStyles
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '--page-size', styles.paper.toUpperCase(),
      '--margin-top', '0',
      '--margin-right', '0',
      '--margin-bottom', '0',
      '--margin-left', '0',
      '--print-media-type',
      '--enable-local-file-access',
      '--encoding', 'UTF-8',
      inputPath,
      outputPath,
    ];

    const proc = spawn('wkhtmltopdf', args);

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`wkhtmltopdf exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error(
          'wkhtmltopdf not found. Please install it:\n' +
          '  macOS: brew install wkhtmltopdf\n' +
          '  Ubuntu: apt install wkhtmltopdf\n' +
          '  Windows: https://wkhtmltopdf.org/downloads.html'
        ));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Generate HTML file for debugging
 */
export function generateHTMLFile(resumeHtml: string, styles: ResumeStyles): string {
  return generateHTML(resumeHtml, styles);
}
