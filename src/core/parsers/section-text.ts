/** Shared Markdown block boundaries and normative prose helpers. */

import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { excludeHtmlProse, firstHtmlComment, projectHtml, type SourceRange } from './section-html.js';

const METADATA_LINE = /^\*\*[^*]+\*\*:/;
const ACCEPTANCE_CASE_HEADER = /^ {0,3}####[ \t]+Acceptance Case:(.*)$/;
const FENCE_START = /^(?:`{3,}|~{3,})/;
const INLINE_SUFFIX_PREFIX = 'x ';
const markdown = unified().use(remarkParse);
type MarkdownNode = ReturnType<typeof markdown.parse>['children'][number];

/** Undefined means no case heading; an empty name means the heading has no title. */
function readAcceptanceCaseHeader(line: string): string | undefined {
  const match = line.match(ACCEPTANCE_CASE_HEADER);
  if (!match) return undefined;
  const title = match[1].trim();
  return /^#+$/.test(title) ? '' : title;
}

function readInlineSuffix(source: string, from: number, definitions: string): MarkdownNode | undefined {
  const paragraph = source.slice(from).split(/\n[ \t]*\n/, 1)[0];
  return markdown.parse(INLINE_SUFFIX_PREFIX + paragraph + definitions).children[0];
}

function nextCommentOpening(source: string, from: number, end: number, definitions: string): number {
  let opening = source.indexOf('<!--', from);
  if (opening < 0 || opening + 4 > end) return -1;
  if (!/[`\\<\[]/.test(source.slice(from, opening))) return opening;

  // A flow HTML node includes the rest of its closing line as raw text. Read that
  // suffix as inline Markdown before interpreting any more comment delimiters.
  const literals: SourceRange[] = [];
  const html: SourceRange[] = [];
  const comments = new Set<number>();
  const visit = (node: MarkdownNode): void => {
    const start = node.position?.start.offset;
    const stop = node.position?.end.offset;
    if (start === undefined || stop === undefined) return;
    if (node.type === 'html') {
      html.push([from + start - INLINE_SUFFIX_PREFIX.length, from + stop - INLINE_SUFFIX_PREFIX.length]);
      if (node.value.startsWith('<!--')) comments.add(start);
      else literals.push([start, stop]);
    } else if (node.type === 'inlineCode' || node.type === 'image' || node.type === 'imageReference'
      || node.type === 'link' || node.type === 'linkReference') literals.push([start, stop]);
    if ('children' in node) node.children.forEach(visit);
  };
  const head = readInlineSuffix(source, from, definitions);
  if (head) visit(head);
  const candidates = new Set<number>();
  for (; opening >= 0 && opening + 4 <= end; opening = source.indexOf('<!--', opening + 4)) {
    const relative = opening - from + INLINE_SUFFIX_PREFIX.length;
    if (!comments.has(relative) && literals.some(([start, stop]) => start <= relative && relative < stop)) continue;
    let backslash = opening;
    while (backslash > from && source[backslash - 1] === '\\') backslash--;
    if ((opening - backslash) % 2 === 0) {
      candidates.add(opening - from);
      html.push([opening, opening + 4]);
    }
  }
  if (!candidates.size) return -1;
  const comment = firstHtmlComment(projectHtml(source, from, end, html), candidates);
  return comment < 0 ? -1 : from + comment;
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

function collectInlineProse(node: MarkdownNode, source: string, origin: number, limit: number, exclusions: SourceRange[]): void {
  const html: SourceRange[] = [];
  const visit = (child: MarkdownNode): void => {
    const start = child.position?.start.offset;
    const end = child.position?.end.offset;
    if (start === undefined || end === undefined || origin + start >= limit) return;
    if (child.type === 'html') html.push([origin + start, origin + end]);
    else if (child.type === 'inlineCode') exclusions.push([origin + start, origin + end]);
    if ('children' in child) child.children.forEach(visit);
  };
  visit(node);
  if (html.length) {
    const start = html[0][0];
    const end = html.reduce((last, [, stop]) => Math.max(last, stop), limit);
    excludeHtmlProse(projectHtml(source, start, end, html), start, exclusions);
  }
}

export function readSectionMarkdown(lines: string[]) {
  const literal = new Array<boolean>(lines.length).fill(false);
  const hidden = new Array<boolean>(lines.length).fill(false);
  const headings = new Map<number, { depth: number; end: number }>();
  const acceptanceCases = new Map<number, string>();
  const removalItems = new Set<number>();
  let visible = lines;
  const maskColumns = (line: number, from: number, to: number): void => {
    if (visible === lines) visible = [...lines];
    const text = visible[line];
    visible[line] = text.slice(0, from) + ' '.repeat(to - from) + text.slice(to);
  };
  const source = lines.join('\n');
  const { children, definitions } = parseMarkdownBlocks(source);
  const proseExclusions: SourceRange[] = [];
  const comments: SourceRange[] = [];
  const suffixes = new Map<number, number>();
  const collectFlowComment = (start: number, end: number): void => {
    // A flow comment's closing line can also contain Markdown prose and subsequent comments.
    for (let opening = start; opening >= 0;) {
      const closing = source.indexOf('-->', opening + 4);
      if (closing < 0 || closing + 3 > end) {
        comments.push([opening, end]);
        break;
      }
      const after = closing + 3;
      comments.push([opening, after]);
      const newline = source.indexOf('\n', after);
      const limit = newline < 0 ? end : Math.min(end, newline);
      if (after < limit && !suffixes.has(limit)) suffixes.set(limit, after);
      opening = nextCommentOpening(source, after, limit, definitions);
    }
  };
  const visit = (node: MarkdownNode, topLevel: boolean, inline: boolean): void => {
    if (!node.position) return;
    const { start, end } = node.position;
    const first = start.line - 1;
    const last = end.line - 1;
    if (node.type === 'definition' || node.type === 'code') {
      hidden.fill(true, first, last + 1);
      if (node.type === 'definition' || !topLevel || FENCE_START.test(lines[first].slice(start.column - 1))) {
        literal.fill(true, first, last + 1);
      }
    } else if (node.type === 'inlineCode') {
      literal.fill(true, first + 1, last + 1);
    } else if (node.type === 'html') {
      // Inline markup does not hide other Markdown on its opening and closing lines.
      const from = inline ? first + 1 : first;
      const to = inline ? last : last + 1;
      literal.fill(true, from, to);
      if (!inline && start.offset !== undefined && end.offset !== undefined) {
        if (node.value.startsWith('<!--')) collectFlowComment(start.offset, end.offset);
        else excludeHtmlProse(source.slice(start.offset, end.offset), start.offset, proseExclusions);
      }
    } else if (node.type === 'heading') {
      hidden.fill(true, first, last + 1);
      if (!topLevel) literal.fill(true, first, last + 1);
      else {
        headings.set(first, { depth: node.depth, end: last });
        if (node.depth === 4 && first === last) {
          const title = readAcceptanceCaseHeader(lines[first]);
          if (title !== undefined) acceptanceCases.set(first, title);
        }
      }
    } else if (topLevel && node.type === 'list') {
      for (const item of node.children) {
        const firstBlock = item.children[0];
        const line = item.position?.start.line;
        if (line === undefined || firstBlock?.position?.end.line !== line) continue;
        if ((firstBlock.type === 'heading' && firstBlock.depth === 3)
          || (firstBlock.type === 'paragraph' && firstBlock.children.length === 1 && firstBlock.children[0].type === 'inlineCode')) {
          removalItems.add(line - 1);
        }
      }
    }
    if ('children' in node) {
      const phrasing = node.type === 'paragraph' || node.type === 'heading';
      if (phrasing && end.offset !== undefined) collectInlineProse(node, source, 0, end.offset, proseExclusions);
      node.children.forEach(child => visit(child, false, inline || phrasing));
    }
  };
  children.forEach(node => visit(node, true, false));
  if (suffixes.size) {
    const uncommented: string[] = [];
    let offset = 0;
    for (const [start, end] of comments) {
      uncommented.push(source.slice(offset, start), source.slice(start, end).replace(/[^\n]/g, ' '));
      offset = end;
    }
    uncommented.push(source.slice(offset));
    const projected = uncommented.join('');
    for (const [limit, from] of suffixes) {
      const head = readInlineSuffix(projected, from, definitions);
      if (head) collectInlineProse(head, projected, from - INLINE_SUFFIX_PREFIX.length, limit, proseExclusions);
    }
  }
  proseExclusions.push(...comments);
  const ranges: typeof proseExclusions = [];
  for (const [from, to] of proseExclusions.sort(([a], [b]) => a - b)) {
    const last = ranges.at(-1);
    if (last && last[1] >= from) last[1] = Math.max(last[1], to);
    else ranges.push([from, to]);
  }
  for (let i = 0, offset = 0, range = 0; i < lines.length && range < ranges.length; i++) {
    const end = offset + lines[i].length;
    while (range < ranges.length && ranges[range][1] <= offset) range++;
    for (let j = range; j < ranges.length && ranges[j][0] < end; j++) {
      const [from, to] = ranges[j];
      maskColumns(i, Math.max(0, from - offset), Math.min(end, to) - offset);
    }
    offset = end + 1;
  }
  return { literal, hidden, headings, acceptanceCases, visible, removalItems };
}

/** Whole-word SHALL/MUST detection shared by Contract and Delta validation. */
export function containsShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

export interface SectionBodyMarkdown {
  lines: string[];
  acceptanceCases: ReadonlyMap<number, string>;
  hidden: boolean[];
  visible: string[];
}

/** Extracts normative prose, excluding literal code, comments, headings and Acceptance Cases. */
export function extractSectionBody({ lines, acceptanceCases, hidden, visible }: SectionBodyMarkdown): string {
  const captured: string[] = [];
  const metadata: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (acceptanceCases.has(i)) break;
    if (hidden[i]) continue;
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
