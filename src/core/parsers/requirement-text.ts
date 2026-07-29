/**
 * Shared fence-aware requirement body extraction and keyword helpers.
 * Element Contract and Delta validation use these helpers over requirement bodies.
 */

const METADATA_LINE = /^\*\*[^*]+\*\*:/;
const HEADER_LINE = /^#{1,6}\s/;
const SCENARIO_HEADER = /^####\s+Scenario:\s+/;

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

/** Whole-word SHALL/MUST detection shared by Contract and Delta validation. */
export function containsShallOrMust(text: string): boolean {
  return /\b(SHALL|MUST)\b/.test(text);
}

/**
 * Extract full requirement body after a requirement header.
 * Skips fenced lines, blanks; stops at non-fenced headers.
 * Metadata lines skipped when other prose exists; otherwise kept as body.
 */
export function extractRequirementBody(bodyLines: string[]): string {
  const mask = buildCodeFenceMask(bodyLines);
  const captured: string[] = [];
  const metadata: string[] = [];

  for (let i = 0; i < bodyLines.length; i++) {
    if (mask[i]) continue;
    const line = bodyLines[i];
    if (HEADER_LINE.test(line)) break;
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
 * Callers must pass extractRequirementBody output (no second extraction).
 */
export function extractRequirementDisplayText(headerTitle: string, body: string): string {
  if (!body) return headerTitle.trim();
  return body.split('\n')[0] ?? headerTitle.trim();
}

/**
 * Yield non-fenced scenario header lines for label-aware surviving counts.
 */
export function listNonFencedScenarioHeaders(bodyLines: string[]): string[] {
  const mask = buildCodeFenceMask(bodyLines);
  const headers: string[] = [];
  for (let i = 0; i < bodyLines.length; i++) {
    if (mask[i]) continue;
    if (SCENARIO_HEADER.test(bodyLines[i])) headers.push(bodyLines[i]);
  }
  return headers;
}
