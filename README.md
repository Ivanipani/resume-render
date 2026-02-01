# cv-to-pdf

A CLI tool to convert Markdown resumes to PDF, inspired by [oh-my-cv](https://github.com/Renovamen/oh-my-cv).

## Overview

This tool takes a Markdown file with YAML front matter and produces a professionally formatted PDF resume. It uses:

- **markdown-it** for Markdown parsing with plugins for definition lists and custom commands
- **Puppeteer** for headless Chrome PDF generation
- **YAML front matter** for configuration (name, contact info, styling)

## Installation

```bash
npm install
```

## Usage

```bash
# Basic conversion (outputs resume.pdf next to input file)
npx tsx src/cli.ts resume.md

# Specify output path
npx tsx src/cli.ts resume.md -o output.pdf

# Generate HTML for debugging
npx tsx src/cli.ts resume.md --html debug.html

# Override styles via CLI
npx tsx src/cli.ts resume.md --paper letter --theme-color "#1a365d"
```

Or use just (requires [fzf](https://github.com/junegunn/fzf) for fuzzy selection):

```bash
just convert              # fuzzy select from markdown files
just convert resume.md    # convert specific file
just pdf                  # interactive selection with preview
just convert-debug        # convert with HTML output for debugging
```

## Markdown Format

### Front Matter

```yaml
---
name: John Doe
header:
  - text: (555) 123-4567
    newLine: true
  - text: john@email.com
    link: mailto:john@email.com
  - text: GitHub
    link: https://github.com/johndoe
styles:
  paper: A4           # or "letter"
  fontSize: 14
  themeColor: "#2563eb"
  marginV: 45
  marginH: 40
  lineHeight: 1.35
---
```

### Definition Lists (Job Entries)

Use the `~` syntax for two-column layouts:

```markdown
**Software Engineer**
  ~ Acme Corp
  ~ San Francisco, CA
  ~ 2020 - Present
```

### Special Commands

- `\newpage` - Force a page break
- `\\[10px]` - Add vertical spacing

### Icons

Use Iconify icons in the header:

```yaml
header:
  - text: <span class="iconify" data-icon="tabler:mail"></span> email@example.com
```

## Architecture

```
src/
├── cli.ts        # Command-line interface (commander)
├── markdown.ts   # Markdown parsing and HTML generation
├── pdf.ts        # Puppeteer PDF rendering
├── styles.ts     # CSS generation from style options
└── types.ts      # TypeScript types and defaults
```

### Data Flow

1. **CLI** reads the Markdown file
2. **MarkdownService** parses front matter and converts body to HTML
3. **Styles** generates CSS based on front matter settings
4. **PDF generator** creates an HTML document and uses Puppeteer to render it to PDF

## Style Options

| Option | Default | Description |
|--------|---------|-------------|
| `paper` | `A4` | Paper size: `A4` or `letter` |
| `fontSize` | `15` | Base font size in pixels |
| `themeColor` | `#377bb5` | Color for headings and links |
| `marginV` | `50` | Vertical margin in pixels |
| `marginH` | `45` | Horizontal margin in pixels |
| `lineHeight` | `1.3` | Line height multiplier |
| `paragraphSpace` | `5` | Space above h2 elements |
| `fontFamily` | `Georgia, serif` | Font stack |

## License

MIT
