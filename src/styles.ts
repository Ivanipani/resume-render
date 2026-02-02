import type { ResumeStyles, PaperSize } from './types.js';

/**
 * Base CSS styles for the resume
 * These are constant regardless of user settings
 */
const BASE_CSS = `
/* Reset and base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: white;
}

/* Resume container */
.resume {
  background: white;
}

/* Header styles */
.resume-header {
  text-align: center;
  margin-bottom: 1em;
}

.resume-header h1 {
  font-weight: bold;
  margin-bottom: 8px;
}

.resume-header-item {
  display: inline;
}

.resume-header-item:not(.no-separator)::after {
  content: " | ";
}

.resume-header-item a {
  text-decoration: none;
}

/* Section headings */
h2 {
  font-size: 1.1em;
  font-weight: bold;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  padding-bottom: 2px;
  margin-bottom: 0.5em;
}

h3 {
  font-size: 1em;
  font-weight: bold;
  margin-top: 0.5em;
  margin-bottom: 0.3em;
}

/* Paragraphs and lists */
p {
  margin-bottom: 0.5em;
}

ul, ol {
  margin-left: 1.5em;
  margin-bottom: 0.5em;
}

li {
  margin-bottom: 0.2em;
}

/* Definition lists - used for job entries with dates */
/* Table-based layout works in both modern browsers and print rendering */
dl {
  display: table;
  width: 100%;
  margin-bottom: 0.3em;
}

dt {
  display: table-cell;
  font-weight: bold;
  vertical-align: baseline;
}

dd {
  display: table-cell;
  text-align: right;
  vertical-align: baseline;
  padding-left: 0.5em;
}

dd::before {
  content: " ~ ";
  opacity: 0.5;
}

dd:first-of-type::before {
  content: "";
}

/* Second line in job entries (title/location) */
dl + dl dt {
  font-weight: normal;
  font-style: italic;
}

/* Links */
a {
  text-decoration: none;
}

/* Strong and emphasis */
strong {
  font-weight: bold;
}

em {
  font-style: italic;
}

/* Page break elements */
.md-it-newpage {
  break-before: page;
  page-break-before: always;
}

.md-it-linebreak {
  display: block;
}

/* Iconify icons (used in contact info) */
svg.iconify {
  display: inline-block;
  vertical-align: middle;
  width: 1em;
  height: 1em;
}

/* Print styles */
@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
`;

/**
 * Generate dynamic CSS based on user styles
 */
function generateDynamicCSS(styles: ResumeStyles): string {
  const { themeColor, fontSize, lineHeight, paragraphSpace, fontFamily } = styles;

  return `
/* Dynamic styles based on user settings */
body, .resume {
  font-family: ${fontFamily};
  font-size: ${fontSize}px;
  line-height: ${lineHeight};
}

/* Theme color */
h1, h2, h3 {
  color: ${themeColor};
}

h2 {
  border-bottom-color: ${themeColor};
}

a {
  color: ${themeColor};
}

.resume-header-item > a {
  color: inherit;
}

/* Paragraph spacing */
h2 {
  margin-top: ${paragraphSpace}px;
}

/* Line heights for different elements */
p, li {
  line-height: ${lineHeight.toFixed(2)};
}

h2, h3 {
  line-height: ${(lineHeight * 1.154).toFixed(2)};
}

dl {
  line-height: ${(lineHeight * 1.038).toFixed(2)};
}
`;
}

/**
 * Generate print-specific CSS for page size
 */
function generatePrintCSS(paper: PaperSize): string {
  return `
@page {
  size: ${paper};
  margin: 0;
}
`;
}

/**
 * Generate complete CSS stylesheet for the resume
 */
export function generateCSS(styles: ResumeStyles): string {
  return BASE_CSS + generateDynamicCSS(styles) + generatePrintCSS(styles.paper);
}

/**
 * Generate inline styles for the resume container
 */
export function generateContainerStyles(styles: ResumeStyles): string {
  return `
    padding: ${styles.marginV}px ${styles.marginH}px;
  `;
}
