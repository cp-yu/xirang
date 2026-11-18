/**
 * Shared fence-aware Section body extraction and keyword helpers.
 * Element Contract and Delta validation use these helpers over Section bodies.
 */

import remarkParse from 'remark-parse';
import { unified } from 'unified';

const METADATA_LINE = /^\*\*[^*]+\*\*:/;
const HEADER_LINE = /^ {0,3}#{1,6}(?:[ \t]|$)/;
const ACCEPTANCE_CASE_HEADER = /^ {0,3}####[ \t]+Acceptance Case:(.*)$/;
const FENCE_START = /^ {0,3}(?:`{3,}|~{3,})/;
const SETEXT_UNDERLINE = /^ {0,3}(?:-+|=+)[ \t]*$/;
const markdown = unified().use(remarkParse);

/** Undefined means no case heading; an empty name means the heading has no title. */
export function readAcceptanceCaseHeader(line: string): string | undefined {
  const match = line.match(ACCEPTANCE_CASE_HEADER);
  if (!match) return undefined;
  const title = match[1].trim();
  return /^#+$/.test(title) ? '' : title;
}

export function readSectionMarkdown(lines: string[], includeSetext = false) {
  const fences = new Array<boolean>(lines.length).fill(false);
  const setext = new Map<number, number>();
  if (lines.some(line => FENCE_START.test(line) || (includeSetext && SETEXT_UNDERLINE.test(line)))) {
    for (const node of markdown.parse(lines.join('\n')).children) {
      if (!node.position) continue;
      const start = node.position.start.line - 1;
      const end = node.position.end.line - 1;
      if (node.type === 'code' && FENCE_START.test(lines[start])) fences.fill(true, start, end + 1);
      if (includeSetext && node.type === 'heading' && start !== end) setext.set(start, end);
    }
  }
  return { fences, setext };
}

export function buildCodeFenceMask(lines: string[]): boolean[] {
  return readSectionMarkdown(lines).fences;
}

/** Whole-word SHALL/MUST detection shared by Contract and Delta validation. */
export function containsShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

/**
 * Extract the full Section body after a Section header.
 * Skips fenced lines and headings; stops at the first Acceptance Case.
 * Metadata lines skipped when other prose exists; otherwise kept as body.
 */
export function extractSectionBody(bodyLines: string[]): string {
  const mask = buildCodeFenceMask(bodyLines);
  const captured: string[] = [];
  const metadata: string[] = [];

  for (let i = 0; i < bodyLines.length; i++) {
    if (mask[i]) continue;
    const line = bodyLines[i];
    if (readAcceptanceCaseHeader(line) !== undefined) break;
    if (HEADER_LINE.test(line)) continue;
    const trimmed = line.trim();
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
