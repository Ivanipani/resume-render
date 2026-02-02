import MarkdownIt from "markdown-it";
import deflist from "markdown-it-deflist";
import matter from "gray-matter";
import type { FrontMatter, HeaderItem } from "./types.js";

/**
 * Custom markdown-it plugin for \newpage command
 * Creates a page break element
 */
function newPagePlugin(md: MarkdownIt): void {
  md.block.ruler.before(
    "paragraph",
    "newpage",
    (state, startLine, _endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const line = state.src.slice(pos, max).trim();

      if (line !== "\\newpage") {
        return false;
      }

      if (silent) {
        return true;
      }

      state.line = startLine + 1;
      const token = state.push("newpage", "div", 0);
      token.markup = "\\newpage";
      token.map = [startLine, state.line];

      return true;
    },
  );

  md.renderer.rules.newpage = () => '<div class="md-it-newpage"></div>\n';
}

/**
 * Custom markdown-it plugin for \\[height] line break command
 * Creates a vertical spacer with specified height
 */
function lineBreakPlugin(md: MarkdownIt): void {
  md.block.ruler.before(
    "paragraph",
    "linebreak",
    (state, startLine, _endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const line = state.src.slice(pos, max).trim();

      // Match \\[10px] or \\[1em] etc.
      // Using RegExp constructor to avoid escaping issues
      const lineBreakRegex = new RegExp("^\\\\\\\\\\[(.+)\\]$");
      const match = line.match(lineBreakRegex);
      if (!match) {
        return false;
      }

      if (silent) {
        return true;
      }

      state.line = startLine + 1;
      const token = state.push("linebreak", "div", 0);
      token.markup = line;
      token.meta = { height: match[1] };
      token.map = [startLine, state.line];

      return true;
    },
  );

  md.renderer.rules.linebreak = (tokens, idx) => {
    const height = tokens[idx].meta?.height || "10px";
    return `<div class="md-it-linebreak" style="height: ${height};"></div>\n`;
  };
}

/**
 * Render a single header item
 */
function renderHeaderItem(item: HeaderItem, hasSeparator: boolean): string {
  const content = item.link
    ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.text}</a>`
    : item.text;

  const separatorClass = hasSeparator ? "" : "no-separator";
  const element = `<span class="resume-header-item ${separatorClass}">${content}</span>`;

  return item.newLine ? `<br>\n${element}` : element;
}

/**
 * Render the resume header from front matter
 */
function renderHeader(frontMatter: FrontMatter): string {
  const parts: string[] = [];

  if (frontMatter.name) {
    parts.push(`<h1>${frontMatter.name}</h1>`);
  }

  if (frontMatter.header && frontMatter.header.length > 0) {
    const headerItems = frontMatter.header
      .map((item, i, arr) => {
        const hasSeparator = i !== arr.length - 1 && !arr[i + 1]?.newLine;
        return renderHeaderItem(item, hasSeparator);
      })
      .join("\n");
    parts.push(headerItems);
  }

  return `<div class="resume-header">${parts.join("\n")}</div>`;
}

/**
 * Fix adjacent definition lists by wrapping them properly
 * Converts multiple adjacent dt/dd pairs into separate dl elements
 */
function resolveDeflist(html: string): string {
  return html.replace(/<dl>([\s\S]*?)<\/dl>/g, (match) =>
    match.replace(/<\/dd>\n<dt>/g, "</dd>\n</dl>\n<dl>\n<dt>"),
  );
}

/**
 * MarkdownService - Converts markdown with front matter to HTML
 */
export class MarkdownService {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });

    // Add plugins
    this.md.use(deflist);
    this.md.use(newPagePlugin);
    this.md.use(lineBreakPlugin);
  }

  /**
   * Parse markdown content and extract front matter
   */
  parse(content: string): { body: string; frontMatter: FrontMatter } {
    const { data, content: body } = matter(content);
    return {
      body,
      frontMatter: data as FrontMatter,
    };
  }

  /**
   * Render markdown body to HTML
   */
  renderMarkdown(body: string): string {
    const html = this.md.render(body);
    return resolveDeflist(html);
  }

  /**
   * Render complete resume (header + body) to HTML
   */
  renderResume(content: string): { html: string; frontMatter: FrontMatter } {
    const { body, frontMatter } = this.parse(content);
    const header = renderHeader(frontMatter);
    const bodyHtml = this.renderMarkdown(body);

    return {
      html: header + bodyHtml,
      frontMatter,
    };
  }
}

export const markdownService = new MarkdownService();
