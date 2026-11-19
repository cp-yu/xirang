/** Delta operation boundaries and the existing Formal fence reader. */

import remarkParse from 'remark-parse';
import { unified } from 'unified';

const METADATA_LINE = /^\*\*[^*]+\*\*:/;
const ACCEPTANCE_CASE_HEADER = /^ {0,3}####[ \t]+Acceptance Case:(.*)$/;
const FENCE_START = /^(?:`{3,}|~{3,})/;
const markdown = unified().use(remarkParse);
type MarkdownNode = ReturnType<typeof markdown.parse>['children'][number];

/** Undefined means no case heading; an empty name means the heading has no title. */
function readAcceptanceCaseHeader(line: string): string | undefined {
  const match = line.match(ACCEPTANCE_CASE_HEADER);
  if (!match) return undefined;
  const title = match[1].trim();
  return /^#+$/.test(title) ? '' : title;
}

export function buildCodeFenceMask(lines: string[]): boolean[] {
  const mask = new Array(lines.length).fill(false);
  let activeFence: { marker: '`' | '~'; length: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const fence = getFenceMarker(lines[i]);

    if (!activeFence) {
      if (fence) {
        activeFence = fence;
        mask[i] = true;
      }
      continue;
    }

    mask[i] = true;
    if (isClosingFence(lines[i], activeFence)) {
      activeFence = null;
    }
  }

  return mask;
}

function getFenceMarker(line: string): { marker: '`' | '~'; length: number } | null {
  const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
  if (!fenceMatch) {
    return null;
  }

  return {
    marker: fenceMatch[1][0] as '`' | '~',
    length: fenceMatch[1].length,
  };
}

function isClosingFence(
  line: string,
  activeFence: { marker: '`' | '~'; length: number },
): boolean {
  const fenceMatch = line.match(/^\s*(`{3,}|~{3,})\s*$/);
  return Boolean(
    fenceMatch &&
      fenceMatch[1][0] === activeFence.marker &&
      fenceMatch[1].length >= activeFence.length,
  );
}

export function readDeltaSectionMarkdown(lines: string[]) {
  const literal = new Array<boolean>(lines.length).fill(false);
  const hidden = new Array<boolean>(lines.length).fill(false);
  const headings = new Map<number, { depth: number; end: number }>();
  const acceptanceCases = new Map<number, string>();
  const removalItems = new Set<number>();
  const { children } = markdown.parse(lines.join('\n'));
  const visit = (node: MarkdownNode, topLevel: boolean, inline: boolean): void => {
    if (!node.position) return;
    const { start, end } = node.position;
    const first = start.line - 1;
    const last = end.line - 1;
    if (node.type === 'definition' || node.type === 'code') {
      if (node.type === 'code') hidden.fill(true, first, last + 1);
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
      const childInline = inline || node.type === 'paragraph' || node.type === 'heading';
      node.children.forEach(child => visit(child, false, childInline));
    }
  };
  children.forEach(node => visit(node, true, false));
  return { literal, hidden, headings, acceptanceCases, removalItems };
}

/** Whole-word SHALL/MUST detection shared by Contract and Delta validation. */
export function containsShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

export interface SectionBodyMarkdown {
  lines: string[];
  acceptanceCases: ReadonlyMap<number, string>;
  hidden: boolean[];
}

/** Extracts Delta Section text before its first Acceptance Case. */
export function extractSectionBody({ lines, acceptanceCases, hidden }: SectionBodyMarkdown): string {
  const captured: string[] = [];
  const metadata: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (acceptanceCases.has(i)) break;
    if (hidden[i]) continue;
    const trimmed = lines[i].trim();
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
