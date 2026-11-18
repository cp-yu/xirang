/**
 * Shared fence-aware Section body extraction and keyword helpers.
 * Element Contract and Delta validation use these helpers over Section bodies.
 */

const METADATA_LINE = /^\*\*[^*]+\*\*:/;
const HEADER_LINE = /^ {0,3}#{1,6}(?:[ \t]|$)/;
export const ACCEPTANCE_CASE_HEADER = /^####\s+Acceptance Case:\s*(.+?)\s*$/;

export function buildCodeFenceMask(lines: string[]): boolean[] {
  const mask = new Array(lines.length).fill(false);
  let activeFence: { marker: '`' | '~'; length: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    if (!activeFence) {
      activeFence = getOpeningFence(lines[i]);
      mask[i] = activeFence !== null;
      continue;
    }

    mask[i] = true;
    if (isClosingFence(lines[i], activeFence)) {
      activeFence = null;
    }
  }

  return mask;
}

function getOpeningFence(line: string): { marker: '`' | '~'; length: number } | null {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (!match) return null;
  const [, fence, info] = match;
  const marker = fence[0] as '`' | '~';
  return marker === '`' && info.includes('`') ? null : { marker, length: fence.length };
}

function isClosingFence(
  line: string,
  activeFence: { marker: '`' | '~'; length: number },
): boolean {
  const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
  return Boolean(
    fenceMatch &&
      fenceMatch[1][0] === activeFence.marker &&
      fenceMatch[1].length >= activeFence.length,
  );
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
    if (ACCEPTANCE_CASE_HEADER.test(line)) break;
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
