import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
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
      width: ${paperDimensions.width}mm;
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
 * Generate PDF from resume HTML using wkhtmltopdf
 */
export async function generatePDF(
  resumeHtml: string,
  styles: ResumeStyles,
  options: PDFOptions
): Promise<void> {
  const html = generateHTML(resumeHtml, styles);

  // Write HTML to temp file
  const tempHtmlPath = join(tmpdir(), `resume-${Date.now()}.html`);
  await writeFile(tempHtmlPath, html, 'utf-8');

  try {
    await runWkhtmltopdf(tempHtmlPath, options.outputPath, styles);
    console.log(`PDF generated: ${options.outputPath}`);
  } finally {
    // Clean up temp file
    await unlink(tempHtmlPath).catch(() => {});
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
