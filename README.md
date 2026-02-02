# resume-render

A CLI tool to convert Markdown resumes to PDF, inspired by [oh-my-cv](https://github.com/Renovamen/oh-my-cv).

## Usage

```bash
npm install

# Specify output path
npx tsx src/cli.ts resume.md -o output.pdf
```

Or use just (requires [fzf](https://github.com/junegunn/fzf) for fuzzy selection):

```bash
just convert              # fuzzy select from markdown files
just dev                  # live reload PDF if source code or markdown files change
```

## Extensions to Markdown

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

Icons are rendered SVGs, courtesy of [Tabler Icons](https://tabler.io/icons)

```yaml
header:
  - text: <span class="icon" data-icon="tabler:mail"></span> email@example.com
```

### Data Flow

1. **CLI** reads the Markdown file
2. **MarkdownService** parses front matter and converts body to HTML
3. **Styles** generates CSS based on front matter settings
4. **PDF generator** creates an HTML document and uses Puppeteer to render it to PDF

## License

MIT
