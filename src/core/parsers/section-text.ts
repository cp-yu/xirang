/** Shared Markdown block boundaries and normative prose helpers. */

import remarkParse from 'remark-parse';
import { unified } from 'unified';

const METADATA_LINE = /^\*\*[^*]+\*\*:/;
const HEADER_LINE = /^ {0,3}#{1,6}(?:[ \t]|$)/;
const ACCEPTANCE_CASE_HEADER = /^ {0,3}####[ \t]+Acceptance Case:(.*)$/;
const FENCE_START = /^(?:`{3,}|~{3,})/;
const BLOCK_CANDIDATE = /`{3,}|~{3,}|<|^ {1,3}#{1,6}(?:[ \t]|$)/;
const SETEXT_UNDERLINE = /^ {0,3}(?:-+|=+)[ \t]*$/;
const markdown = unified().use(remarkParse);
type MarkdownNode = ReturnType<typeof markdown.parse>['children'][number];

/** Undefined means no case heading; an empty name means the heading has no title. */
export function readAcceptanceCaseHeader(line: string): string | undefined {
  const match = line.match(ACCEPTANCE_CASE_HEADER);
  if (!match) return undefined;
  const title = match[1].trim();
  return /^#+$/.test(title) ? '' : title;
}

export function readSectionMarkdown(lines: string[], { includeSetext = false, includeListItems = false } = {}) {
  const literal = new Array<boolean>(lines.length).fill(false);
  const hidden = new Array<boolean>(lines.length).fill(false);
  const setext = new Map<number, number>();
  const listItems = new Set<number>();
  let visible = lines;
  const maskColumns = (line: number, from: number, to: number): void => {
    if (visible === lines) visible = [...lines];
    const text = visible[line];
    visible[line] = text.slice(0, from) + ' '.repeat(to - from) + text.slice(to);
  };
  if (lines.some(line => BLOCK_CANDIDATE.test(line)
    || (includeSetext && SETEXT_UNDERLINE.test(line))
    || (includeListItems && /^ {0,3}-[ \t]+/.test(line)))) {
    const maskHtmlComments = (first: number, last: number, start: number, end: number): void => {
      let inComment = false;
      for (let i = first; i <= last; i++) {
        const line = lines[i];
        const limit = i === last ? end : line.length;
        let cursor = i === first ? start : 0;
        while (cursor < limit) {
          const opening = inComment ? cursor : line.indexOf('<!--', cursor);
          if (opening < 0 || (!inComment && opening + 4 > limit)) break;
          const closing = line.indexOf('-->', opening + (inComment ? 0 : 4));
          inComment = closing === -1 || closing + 3 > limit;
          cursor = inComment ? limit : closing + 3;
          maskColumns(i, opening, cursor);
        }
      }
    };
    const visit = (node: MarkdownNode, topLevel: boolean, inline: boolean): void => {
      if (!node.position) return;
      const { start, end } = node.position;
      const first = start.line - 1;
      const last = end.line - 1;
      if (node.type === 'code' && FENCE_START.test(lines[first].slice(start.column - 1))) {
        literal.fill(true, first, last + 1);
        hidden.fill(true, first, last + 1);
      } else if (node.type === 'html') {
        // Inline markup does not hide other Markdown on its opening and closing lines.
        const from = inline ? first + 1 : first;
        const to = inline ? last : last + 1;
        literal.fill(true, from, to);
        if (node.value.includes('<!--')) maskHtmlComments(first, last, start.column - 1, end.column - 1);
      } else if (node.type === 'heading') {
        if (!topLevel) literal.fill(true, first, last + 1);
        else if (includeSetext && first !== last) setext.set(first, last);
      } else if (includeListItems && topLevel && node.type === 'list') {
        for (const item of node.children) {
          if (item.position) listItems.add(item.position.start.line - 1);
        }
      }
      if ('children' in node) {
        const childInline = inline || node.type === 'paragraph' || node.type === 'heading';
        node.children.forEach(child => visit(child, false, childInline));
      }
    };
    markdown.parse(lines.join('\n')).children.forEach(node => visit(node, true, false));
  }
  return { literal, hidden, setext, visible, listItems };
}

export function buildLiteralBlockMask(lines: string[]): boolean[] {
  return readSectionMarkdown(lines).literal;
}

/** Whole-word SHALL/MUST detection shared by Contract and Delta validation. */
export function containsShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

/**
 * Extract the full Section body after a Section header.
 * Skips fenced examples, comments and headings; stops at the first Acceptance Case.
 * Metadata lines skipped when other prose exists; otherwise kept as body.
 */
export function extractSectionBody(bodyLines: string[]): string {
  const { literal, hidden, visible } = readSectionMarkdown(bodyLines);
  const captured: string[] = [];
  const metadata: string[] = [];

  for (let i = 0; i < bodyLines.length; i++) {
    if (hidden[i]) continue;
    const line = bodyLines[i];
    if (!literal[i] && readAcceptanceCaseHeader(line) !== undefined) break;
    if (HEADER_LINE.test(line)) continue;
    const trimmed = visible[i].trim();
    if (trimmed.length === 0) continue;
    if (METADATA_LINE.test(trimmed)) {
      metadata.push(trimmed);
      continue;
    }
    captured.push(trimmed);
  }

  if (captured.length > 0) return captured.join('\n');
  return metadata.join('\n');
}

/**
 * Display helper from a precomputed body: first line, else header title.
 * Callers must pass extractSectionBody output (no second extraction).
 */
export function extractSectionDisplayText(headerTitle: string, body: string): string {
  if (!body) return headerTitle.trim();
  return body.split('\n')[0] ?? headerTitle.trim();
}
