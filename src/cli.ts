#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, dirname, join } from 'path';
import { program } from 'commander';
import { markdownService } from './markdown.js';
import { generatePDF, generateHTMLFile } from './pdf.js';
import { mergeStyles, DEFAULT_STYLES } from './types.js';
import type { PaperSize } from './types.js';

/**
 * Get output path from input path if not specified
 */
function getOutputPath(inputPath: string, ext: string): string {
  const dir = dirname(inputPath);
  const name = basename(inputPath, '.md');
  return join(dir, `${name}.${ext}`);
}

program
  .name('cv-to-pdf')
  .description('Convert Markdown resumes to PDF')
  .version('1.0.0')
  .argument('<input>', 'Input markdown file')
  .option('-o, --output <path>', 'Output PDF file path')
  .option('--html <path>', 'Also output HTML file for debugging')
  .option('--paper <size>', 'Paper size: A4 or letter', 'A4')
  .option('--font-size <px>', 'Font size in pixels', '15')
  .option('--theme-color <color>', 'Theme color (hex)', '#377bb5')
  .option('--margin-v <px>', 'Vertical margin in pixels', '50')
  .option('--margin-h <px>', 'Horizontal margin in pixels', '45')
  .option('--line-height <value>', 'Line height', '1.3')
  .option('--font-family <family>', 'Font family', DEFAULT_STYLES.fontFamily)
  .action(async (input: string, options) => {
    try {
      // Resolve input path
      const inputPath = resolve(input);

      // Read input file
      const content = readFileSync(inputPath, 'utf-8');

      // Parse and render markdown
      const { html, frontMatter } = markdownService.renderResume(content);

      // Build styles from CLI options and front matter
      // Priority: CLI options > front matter > defaults
      const cliStyles = {
        paper: options.paper as PaperSize,
        fontSize: parseInt(options.fontSize, 10),
        themeColor: options.themeColor,
        marginV: parseInt(options.marginV, 10),
        marginH: parseInt(options.marginH, 10),
        lineHeight: parseFloat(options.lineHeight),
        fontFamily: options.fontFamily
      };

      // Merge: defaults <- front matter <- CLI (CLI wins)
      const styles = mergeStyles({
        ...frontMatter.styles,
        ...Object.fromEntries(
          Object.entries(cliStyles).filter(([key, value]) => {
            // Only include CLI options that differ from defaults
            const defaultValue = DEFAULT_STYLES[key as keyof typeof DEFAULT_STYLES];
            return value !== defaultValue;
          })
        )
      });

      // Determine output path
      const outputPath = options.output
        ? resolve(options.output)
        : getOutputPath(inputPath, 'pdf');

      // Generate PDF
      await generatePDF(html, styles, { outputPath });

      // Optionally output HTML for debugging
      if (options.html) {
        const htmlPath = resolve(options.html);
        const htmlContent = generateHTMLFile(html, styles);
        writeFileSync(htmlPath, htmlContent, 'utf-8');
        console.log(`HTML generated: ${htmlPath}`);
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

program.parse();
