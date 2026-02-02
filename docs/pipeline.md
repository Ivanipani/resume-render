# Document Pipeline: Markdown to PDF

This document explains how cv-to-pdf converts a Markdown resume into a PDF.

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Markdown      │────▶│   HTML          │────▶│   Styled HTML   │────▶│   PDF           │
│   + YAML        │     │   Content       │     │   Document      │     │   Output        │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
      cli.ts              markdown.ts            pdf.ts + styles.ts       wkhtmltopdf
```

## Pipeline Stages

### Stage 1: CLI Entry Point (`src/cli.ts`)

The CLI parses command-line arguments and orchestrates the pipeline.

**Input:** Path to a Markdown file + optional CLI flags

**Process:**
1. Read the input Markdown file
2. Parse CLI options (paper size, font size, theme color, margins, etc.)
3. Call `markdownService.renderResume()` to get HTML + front matter
4. Merge styles: `DEFAULT_STYLES` ← front matter styles ← CLI options
5. Call `generatePDF()` to produce the final PDF

**Key options:**
- `-o, --output <path>` - Output PDF path
- `--html <path>` - Also output HTML for debugging

---

### Stage 2: Markdown Parsing (`src/markdown.ts`)

The `MarkdownService` class converts Markdown to HTML using [markdown-it](https://github.com/markdown-it/markdown-it).

**Input:** Raw Markdown string with YAML front matter

**Process:**

1. **Parse front matter** using [gray-matter](https://github.com/jonschlinkert/gray-matter)
   - Extracts `name`, `header` items, and `styles` from YAML block

2. **Render header** from front matter
   - Name becomes `<h1>`
   - Header items become `<span class="resume-header-item">` elements
   - Links are wrapped in `<a>` tags
   - Items are separated by ` | ` via CSS

3. **Render body** with markdown-it plugins:
   - `markdown-it-deflist` - Definition lists for job entries (title ~ company ~ date)
   - `newPagePlugin` - `\newpage` command creates page breaks
   - `lineBreakPlugin` - `\\[height]` command creates vertical spacers

4. **Post-process** definition lists to handle adjacent entries

**Output:** `{ html: string, frontMatter: FrontMatter }`

#### Front Matter Example

```yaml
---
name: John Doe
header:
  - text: <span class="iconify" data-icon="tabler:mail"></span> john@example.com
    link: mailto:john@example.com
  - text: GitHub
    link: https://github.com/johndoe
styles:
  paper: A4
  fontSize: 14
  themeColor: "#2563eb"
---
```

---

### Stage 3: Icon Replacement (`src/icons.ts`)

Iconify spans are replaced with inline SVGs before PDF generation.

**Input:** HTML string containing `<span class="iconify" data-icon="tabler:phone"></span>`

**Process:**
- Regex matches Iconify span elements
- Looks up icon name in the `ICONS` map
- Replaces with `<span class="icon"><svg>...</svg></span>`

**Supported icons:**
- `tabler:phone` - Phone icon
- `tabler:mail` - Email envelope
- `tabler:brand-github` - GitHub logo
- `tabler:brand-linkedin` - LinkedIn logo
- `tabler:map-pin` - Location marker
- `tabler:world` - Globe/website icon

---

### Stage 4: CSS Generation (`src/styles.ts`)

Generates the complete stylesheet for the resume.

**Components:**

1. **BASE_CSS** - Fixed styles
   - CSS reset
   - Header layout (centered, separator pipes)
   - Section heading styles
   - Definition list layout (flexbox for job entries)
   - Page break elements
   - Print media styles

2. **generateDynamicCSS()** - User-configurable styles
   - Font family and size
   - Theme color for headings/links
   - Line height
   - Paragraph spacing

3. **generatePrintCSS()** - Print-specific rules
   - `@page` rule with paper size
   - Zero margins (margins are handled in content)

---

### Stage 5: HTML Document Assembly (`src/pdf.ts`)

Combines all pieces into a complete HTML document.

**Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* BASE_CSS */
    /* Dynamic CSS */
    /* Print CSS */
    /* Icon styles */
  </style>
</head>
<body>
  <div class="resume" style="padding: {marginV}px {marginH}px; width: 100%;">
    <!-- Resume content -->
  </div>
</body>
</html>
```

---

### Stage 6: PDF Generation (`src/pdf.ts`)

Uses [wkhtmltopdf](https://wkhtmltopdf.org/) to render HTML to PDF.

**Process:**
1. Write complete HTML to a temporary file
2. Spawn `wkhtmltopdf` with arguments:
   - `--page-size A4` (or letter)
   - `--margin-* 0` (zero margins, handled in CSS)
   - `--print-media-type` (use print stylesheet)
   - `--enable-local-file-access` (allow local resources)
   - `--encoding UTF-8`
3. Clean up temporary file

**Output:** PDF file at specified path

---

## Type Definitions (`src/types.ts`)

### ResumeStyles
```typescript
interface ResumeStyles {
  paper: 'A4' | 'letter';
  fontSize: number;        // Base font size in pixels
  themeColor: string;      // Hex color for headings/links
  marginV: number;         // Vertical margin in pixels
  marginH: number;         // Horizontal margin in pixels
  lineHeight: number;      // Line height multiplier
  paragraphSpace: number;  // Space between sections
  fontFamily: string;      // CSS font-family value
}
```

### HeaderItem
```typescript
interface HeaderItem {
  text: string;      // Display text (can include HTML)
  link?: string;     // Optional URL
  newLine?: boolean; // Start on new line
}
```

---

## File Structure

```
src/
├── cli.ts          # Entry point, argument parsing
├── markdown.ts     # Markdown → HTML conversion
├── icons.ts        # Iconify → inline SVG replacement
├── styles.ts       # CSS generation
├── pdf.ts          # HTML assembly + wkhtmltopdf
└── types.ts        # TypeScript interfaces + defaults
```

---

## Prerequisites

- **Node.js** 18+
- **wkhtmltopdf** installed on system:
  - macOS: `brew install wkhtmltopdf`
  - Ubuntu: `apt install wkhtmltopdf`
  - Windows: Download from https://wkhtmltopdf.org/downloads.html
