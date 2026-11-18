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
const REMOVED_BULLET_PREFIX = /^\s*-\s*`?###\s*Section:/;

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
  duplicateSections: string[];
  unscopedSections: string[];
  malformedSectionLines: number[];
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
  const { sections, unscopedSections, malformedSectionLines } = splitTopLevelSections(normalized);
  const addedLookup = getSectionCaseInsensitive(sections, 'ADDED Sections');
  const modifiedLookup = getSectionCaseInsensitive(sections, 'MODIFIED Sections');
  const removedLookup = getSectionCaseInsensitive(sections, 'REMOVED Sections');
  const added = parseSectionBlocksFromSection(addedLookup.body);
  const modified = parseSectionBlocksFromSection(modifiedLookup.body);
  const removedNames = parseRemovedNames(removedLookup.body);
  const seen = new Set<string>();
  const duplicateSections: string[] = [];
  const unsupportedSections: string[] = [];
  for (const [title] of sections) {
    const key = title.toLowerCase();
    if (!/^(added|modified|removed) sections$/.test(key)) {
      unsupportedSections.push(title);
      continue;
    }
    if (seen.has(key)) duplicateSections.push(title);
    seen.add(key);
  }
  return {
    added,
    modified,
    removed: removedNames,
    unsupportedSections,
    duplicateSections,
    unscopedSections,
    malformedSectionLines,
    sectionPresence: {
      added: addedLookup.found,
      modified: modifiedLookup.found,
      removed: removedLookup.found,
    },
  };
}

function splitTopLevelSections(content: string): {
  sections: Array<[string, string]>; unscopedSections: string[]; malformedSectionLines: number[];
} {
  const lines = content.split('\n');
  const sections: Array<[string, string]> = [];
  const unscopedSections: string[] = [];
  const malformedSectionLines: number[] = [];
  const mask = buildCodeFenceMask(lines);
  const indices: Array<{ title: string; index: number; level: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue;
    const heading = lines[i].match(/^(##)\s+(.+)$/);
    if (heading) indices.push({ title: heading[2].trim(), index: i, level: heading[1].length });
    else if (/^###\s*Section:/.test(lines[i])) {
      const name = lines[i].match(SECTION_HEADER_REGEX)?.[1]?.trim();
      if (!name || !/^###\s+Section:/.test(lines[i])) malformedSectionLines.push(i + 1);
      else if (indices.length === 0) unscopedSections.push(name);
    } else if (indices.at(-1)?.title.toLowerCase() === 'removed sections'
      && REMOVED_BULLET_PREFIX.test(lines[i]) && !removedBulletName(lines[i])) {
      malformedSectionLines.push(i + 1);
    }
  }
  for (let i = 0; i < indices.length; i++) {
    const current = indices[i];
    const next = indices[i + 1];
    const body = lines.slice(current.index + 1, next ? next.index : lines.length).join('\n');
    sections.push([current.title, body]);
  }
  return { sections, unscopedSections, malformedSectionLines };
}

function getSectionCaseInsensitive(sections: Array<[string, string]>, desired: string): { body: string; found: boolean } {
  const target = desired.toLowerCase();
  for (const [title, body] of sections) {
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

function removedBulletName(line: string): string | undefined {
  const prefix = line.match(REMOVED_BULLET_PREFIX)?.[0];
  if (!prefix) return undefined;
  const name = line.slice(prefix.length).trim();
  return (prefix.includes('`') ? (name.endsWith('`') ? name.slice(0, -1).trim() : '') : name) || undefined;
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
    const bullet = removedBulletName(line);
    if (bullet) names.push(bullet);
  }
  return names;
}
