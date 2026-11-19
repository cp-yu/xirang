/** Shared Markdown block boundaries and normative prose helpers. */

import remarkParse from 'remark-parse';
import { unified } from 'unified';

const METADATA_LINE = /^\*\*[^*]+\*\*:/;
const HEADER_LINE = /^ {0,3}#{1,6}(?:[ \t]|$)/;
const ACCEPTANCE_CASE_HEADER = /^ {0,3}####[ \t]+Acceptance Case:(.*)$/;
const FENCE_START = /^(?:`{3,}|~{3,})/;
const BLOCK_CANDIDATE = /`|~{3,}|<|\]:|^[ \t]+#{1,6}(?:[ \t]|$)/;
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

function nextCommentOpening(source: string, from: number, end: number, definitions: string): number {
  let opening = source.indexOf('<!--', from);
  if (opening < 0 || opening + 4 > end) return -1;
  if (!/[`\\<\[]/.test(source.slice(from, opening))) return opening;

  // A flow HTML node includes the rest of its closing line as raw text. Read that
  // suffix as inline Markdown before interpreting any more comment delimiters.
  const prefix = 'x ';
  const paragraph = source.slice(from).split(/\n[ \t]*\n/, 1)[0];
  const ranges: Array<[number, number]> = [];
  const comments = new Set<number>();
  const visit = (node: MarkdownNode): void => {
    const start = node.position?.start.offset;
    const stop = node.position?.end.offset;
    if (start === undefined || stop === undefined) return;
    if (node.type === 'html' && node.value.startsWith('<!--')) comments.add(start);
    else if (node.type === 'inlineCode' || node.type === 'html' || node.type === 'image' || node.type === 'imageReference'
      || node.type === 'link' || node.type === 'linkReference') ranges.push([start, stop]);
    if ('children' in node) node.children.forEach(visit);
  };
  const head = markdown.parse(prefix + paragraph + definitions).children[0];
  if (head) visit(head);
  for (; opening >= 0 && opening + 4 <= end; opening = source.indexOf('<!--', opening + 4)) {
    const relative = opening - from + prefix.length;
    if (comments.has(relative)) return opening;
    if (ranges.some(([start, stop]) => start <= relative && relative < stop)) continue;
    let backslash = opening;
    while (backslash > from && source[backslash - 1] === '\\') backslash--;
    if ((opening - backslash) % 2 === 0) return opening;
  }
  return -1;
}

function parseMarkdownBlocks(source: string): { children: MarkdownNode[]; definitions: string } {
  for (;;) {
    const { children } = markdown.parse(source);
    const ids = new Set<string>();
    const collectDefinitions = (node: MarkdownNode): void => {
      if (node.type === 'definition') ids.add(node.identifier);
      if ('children' in node) node.children.forEach(collectDefinitions);
    };
    children.forEach(collectDefinitions);
    // A suffix needs document-wide reference resolution, not the original destinations.
    const definitions = ids.size ? '\n\n' + [...ids].map(id => `[${id}]: /`).join('\n') : '';
    if (!/-->[^\n]*<!--/.test(source)) return { children, definitions };
    const parts: string[] = [];
    let copied = 0;
    let consumed = 0;
    const visit = (node: MarkdownNode, topLevel: boolean): void => {
      if ('children' in node) {
        node.children.forEach(child => visit(child, false));
        return;
      }
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (node.type !== 'html' || !node.value.startsWith('<!--') || start === undefined || end === undefined || start < consumed) return;
      let closing = source.indexOf('-->', start + 4);
      if (closing < 0 || closing + 3 > end) return;
      while (closing >= 0) {
        const newline = source.indexOf('\n', closing + 3);
        const lineEnd = newline < 0 ? source.length : newline;
        const opening = nextCommentOpening(source, closing + 3, topLevel ? lineEnd : Math.min(lineEnd, end), definitions);
        if (opening < 0) break;
        // Markdown ends a comment block at the first closing line. Join adjacent spans in
        // this parse only, so a continuation cannot appear to start a heading or fence.
        parts.push(source.slice(copied, closing), ' '.repeat(opening + 4 - closing));
        copied = opening + 4;
        closing = source.indexOf('-->', copied);
        consumed = closing < 0 ? source.length : closing + 3;
      }
    };
    children.forEach(node => visit(node, true));
    if (!parts.length) return { children, definitions };
    source = parts.join('') + source.slice(copied);
  }
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
    const source = lines.join('\n');
    const { children, definitions } = parseMarkdownBlocks(source);
    const maskHtmlComments = (first: number, last: number, start: number, end: number, offset: number): void => {
      let inComment = false;
      for (let i = first; i <= last; i++) {
        const line = lines[i];
        const limit = i === last ? end : line.length;
        let cursor = i === first ? start : 0;
        while (cursor < limit) {
          const opening = inComment ? cursor : nextCommentOpening(source, offset + cursor, offset + limit, definitions) - offset;
          if (opening < 0) break;
          const closing = line.indexOf('-->', opening + (inComment ? 0 : 4));
          inComment = closing === -1 || closing + 3 > limit;
          cursor = inComment ? limit : closing + 3;
          maskColumns(i, opening, cursor);
        }
        offset += line.length + 1;
      }
    };
    const visit = (node: MarkdownNode, topLevel: boolean, inline: boolean): void => {
      if (!node.position) return;
      const { start, end } = node.position;
      const first = start.line - 1;
      const last = end.line - 1;
      if (node.type === 'definition' || (node.type === 'code' && FENCE_START.test(lines[first].slice(start.column - 1)))) {
        literal.fill(true, first, last + 1);
        hidden.fill(true, first, last + 1);
      } else if (node.type === 'inlineCode') {
        literal.fill(true, first + 1, last + 1);
      } else if (node.type === 'html') {
        // Inline markup does not hide other Markdown on its opening and closing lines.
        const from = inline ? first + 1 : first;
        const to = inline ? last : last + 1;
        literal.fill(true, from, to);
        if (node.value.includes('<!--') && start.offset !== undefined) {
          maskHtmlComments(first, last, start.column - 1, end.column - 1, start.offset - start.column + 1);
        }
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
    children.forEach(node => visit(node, true, false));
  }
  return { literal, hidden, setext, visible, listItems };
}

/** Whole-word SHALL/MUST detection shared by Contract and Delta validation. */
export function containsShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

export interface SectionBodyMarkdown {
  lines: string[];
  literal: boolean[];
  hidden: boolean[];
  visible: string[];
}

/** Skips fenced examples, comments, headings and Acceptance Cases using the unit's Markdown boundaries. */
export function extractSectionBody({ lines, literal, hidden, visible }: SectionBodyMarkdown): string {
  const captured: string[] = [];
  const metadata: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (hidden[i]) continue;
    const line = lines[i];
    if (!literal[i] && readAcceptanceCaseHeader(line) !== undefined) break;
    if (HEADER_LINE.test(visible[i])) continue;
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
