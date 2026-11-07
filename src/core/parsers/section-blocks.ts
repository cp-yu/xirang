import { buildCodeFenceMask } from './section-text.js';

export interface SectionBlock {
  headerLine: string; // e.g., '### Section: Something'
  name: string; // e.g., 'Something'
  raw: string; // full block including headerLine and following content
}

export interface SpecificationSectionParts {
  before: string;
  headerLine: string; // the '## Specification' line
  preamble: string; // content between headerLine and the first Section block
  bodyBlocks: SectionBlock[]; // parsed Section blocks in order
  after: string;
}

export function normalizeSectionName(name: string): string {
  return name.trim();
}

const SECTION_HEADER_REGEX = /^###\s*Section:\s*(.+)\s*$/;

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n');
}

/**
 * Extracts the Specification section from an Element unit and parses Section blocks.
 */
export function extractSpecificationSection(content: string): SpecificationSectionParts {
  const normalized = normalizeLineEndings(content);
  const lines = normalized.split('\n');
  const codeFenceMask = buildCodeFenceMask(lines);
  const specHeaderIndex = lines.findIndex((line, index) => !codeFenceMask[index]
    && /^##\s+Specification\s*$/i.test(line));

  if (specHeaderIndex === -1) {
    // No Specification section; create an empty one at the end
    const before = content.trimEnd();
    const headerLine = '## Specification';
    return {
      before: before ? before + '\n\n' : '',
      headerLine,
      preamble: '',
      bodyBlocks: [],
      after: '\n',
    };
  }

  // Find end of this section: next line that starts with '## ' at same or higher level
  let endIndex = lines.length;
  for (let i = specHeaderIndex + 1; i < lines.length; i++) {
    if (!codeFenceMask[i] && /^##\s+/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  const before = lines.slice(0, specHeaderIndex).join('\n');
  const headerLine = lines[specHeaderIndex];
  const sectionBodyLines = lines.slice(specHeaderIndex + 1, endIndex);
  const sectionBodyFenceMask = codeFenceMask.slice(specHeaderIndex + 1, endIndex);
  const isSectionHeader = (index: number) => !sectionBodyFenceMask[index]
    && SECTION_HEADER_REGEX.test(sectionBodyLines[index]);

  const blocks: SectionBlock[] = [];
  let cursor = 0;
  const preambleLines: string[] = [];

  // Collect preamble lines until the first Section header
  while (cursor < sectionBodyLines.length && !isSectionHeader(cursor)) {
    preambleLines.push(sectionBodyLines[cursor]);
    cursor++;
  }

  while (cursor < sectionBodyLines.length) {
    const headerLineCandidate = sectionBodyLines[cursor];
    const headerMatch = headerLineCandidate.match(SECTION_HEADER_REGEX);
    if (!headerMatch) {
      // Not a Section header; skip line defensively
      cursor++;
      continue;
    }
    const name = normalizeSectionName(headerMatch[1]);
    cursor++;
    // Gather lines until the next Section header or end of the Specification section
    const bodyLines: string[] = [headerLineCandidate];
    while (cursor < sectionBodyLines.length && !isSectionHeader(cursor)) {
      bodyLines.push(sectionBodyLines[cursor]);
      cursor++;
    }
    const raw = bodyLines.join('\n').trimEnd();
    blocks.push({ headerLine: headerLineCandidate, name, raw });
  }

  const after = lines.slice(endIndex).join('\n');
  const preamble = preambleLines.join('\n').trimEnd();

  return {
    before: before.trimEnd() ? before + '\n' : before,
    headerLine,
    preamble,
    bodyBlocks: blocks,
    after: after.startsWith('\n') ? after : '\n' + after,
  };
}

export interface DeltaPlan {
  added: SectionBlock[];
  modified: SectionBlock[];
  removed: string[]; // Section titles
  unsupportedSections: string[];
  sectionPresence: {
    added: boolean;
    modified: boolean;
    removed: boolean;
  };
}

/**
 * Parse a delta-formatted change unit into a DeltaPlan with raw blocks.
 */
export function parseDeltaSpec(content: string): DeltaPlan {
  const normalized = normalizeLineEndings(content);
  const sections = splitTopLevelSections(normalized);
  const addedLookup = getSectionCaseInsensitive(sections, 'ADDED Sections');
  const modifiedLookup = getSectionCaseInsensitive(sections, 'MODIFIED Sections');
  const removedLookup = getSectionCaseInsensitive(sections, 'REMOVED Sections');
  const added = parseSectionBlocksFromSection(addedLookup.body);
  const modified = parseSectionBlocksFromSection(modifiedLookup.body);
  const removedNames = parseRemovedNames(removedLookup.body);
  return {
    added,
    modified,
    removed: removedNames,
    unsupportedSections: Object.keys(sections).filter(title => title.toLowerCase() === 'renamed sections'),
    sectionPresence: {
      added: addedLookup.found,
      modified: modifiedLookup.found,
      removed: removedLookup.found,
    },
  };
}

function splitTopLevelSections(content: string): Record<string, string> {
  const lines = content.split('\n');
  const result: Record<string, string> = {};
  const mask = buildCodeFenceMask(lines);
  const indices: Array<{ title: string; index: number; level: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    const m = !mask[i] && lines[i].match(/^(##)\s+(.+)$/);
    if (m) {
      indices.push({ title: m[2].trim(), index: i, level: m[1].length });
    }
  }
  for (let i = 0; i < indices.length; i++) {
    const current = indices[i];
    const next = indices[i + 1];
    const body = lines.slice(current.index + 1, next ? next.index : lines.length).join('\n');
    result[current.title] = body;
  }
  return result;
}

function getSectionCaseInsensitive(sections: Record<string, string>, desired: string): { body: string; found: boolean } {
  const target = desired.toLowerCase();
  for (const [title, body] of Object.entries(sections)) {
    if (title.toLowerCase() === target) return { body, found: true };
  }
  return { body: '', found: false };
}

function parseSectionBlocksFromSection(sectionBody: string): SectionBlock[] {
  if (!sectionBody) return [];
  const lines = normalizeLineEndings(sectionBody).split('\n');
  const blocks: SectionBlock[] = [];
  const mask = buildCodeFenceMask(lines);
  const isHeader = (index: number) => !mask[index] && /^###\s+Section:/.test(lines[index]);
  let i = 0;
  while (i < lines.length) {
    // Seek the next Section header
    while (i < lines.length && !isHeader(i)) i++;
    if (i >= lines.length) break;
    const headerLine = lines[i];
    const m = headerLine.match(SECTION_HEADER_REGEX);
    if (!m) { i++; continue; }
    const name = normalizeSectionName(m[1]);
    const buf: string[] = [headerLine];
    i++;
    while (i < lines.length && !isHeader(i) && (mask[i] || !/^##\s+/.test(lines[i]))) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ headerLine, name, raw: buf.join('\n').trimEnd() });
  }
  return blocks;
}

function parseRemovedNames(sectionBody: string): string[] {
  if (!sectionBody) return [];
  const names: string[] = [];
  const lines = normalizeLineEndings(sectionBody).split('\n');
  const mask = buildCodeFenceMask(lines);
  for (const [index, line] of lines.entries()) {
    if (mask[index]) continue;
    const m = line.match(SECTION_HEADER_REGEX);
    if (m) {
      names.push(normalizeSectionName(m[1]));
      continue;
    }
    // Also support bullet list of headers
    const bullet = line.match(/^\s*-\s*`?###\s*Section:\s*(.+?)`?\s*$/);
    if (bullet) {
      names.push(normalizeSectionName(bullet[1]));
    }
  }
  return names;
}
