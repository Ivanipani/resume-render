#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { resolve, basename, dirname, join } from "path";
import { program } from "commander";
import { markdownService } from "./markdown.js";
import { generatePDF, generateHTMLFile } from "./pdf.js";
import { mergeStyles } from "./types.js";

/**
 * Get output path from input path if not specified
 */
function getOutputPath(inputPath: string, ext: string): string {
  const dir = dirname(inputPath);
  const name = basename(inputPath, ".md");
  return join(dir, `${name}.${ext}`);
}

program
  .name("cv-to-pdf")
  .description("Convert Markdown resumes to PDF")
  .version("1.0.0")
  .argument("<input>", "Input markdown file")
  .option("-o, --output <path>", "Output PDF file path")
  .option("--html <path>", "Also output HTML file for debugging")
  .action(async (input: string, options) => {
    try {
      // Resolve input path
      const inputPath = resolve(input);

      // Read input file
      const content = readFileSync(inputPath, "utf-8");

      // Parse and render markdown
      const { html, frontMatter } = markdownService.renderResume(content);

      // Merge front matter styles with defaults
      const styles = mergeStyles(frontMatter.styles);

      // Determine output path
      const outputPath = options.output
        ? resolve(options.output)
        : getOutputPath(inputPath, "pdf");

      // Generate PDF
      await generatePDF(html, styles, { outputPath });

      // Optionally output HTML for debugging
      if (options.html) {
        const htmlPath = resolve(options.html);
        const htmlContent = generateHTMLFile(html, styles);
        writeFileSync(htmlPath, htmlContent, "utf-8");
        console.log(`HTML generated: ${htmlPath}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("An unexpected error occurred");
      }
      process.exit(1);
    }
  });

program.parse();
