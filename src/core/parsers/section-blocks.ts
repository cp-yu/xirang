import { readSectionMarkdown, type SectionBodyMarkdown } from './section-text.js';

export interface SectionBlock {
  headerLine: string; // e.g., '### Section: Something'
  name: string; // e.g., 'Something'
  raw: string; // full block including headerLine and following content
  body: SectionBodyMarkdown;
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
const ENCLOSING_HEADING = /^ {0,3}(#{1,2})(?:[ \t]+(.*))?$/;
const REMOVED_BULLET_PREFIX = /^ {0,3}-\s+`?###\s+Section:/;
const DELTA_SECTION_HEADER = /^ {0,3}###\s+Section:\s*(.+)$/;
const OVER_INDENTED_OPERATION = /^(?: {4}|[ \t]*\t)[ \t]*##[ \t]+\S.*[ \t]+Sections[ \t]*#*[ \t]*$/i;

function deltaSectionName(raw: string | undefined): string | undefined {
  const name = raw?.trim();
  return name && !/(?:^|[ \t])#+$/.test(name) ? name : undefined;
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n');
}

function makeSectionBlock(lines: string[], markdown: ReturnType<typeof readSectionMarkdown>, start: number, end: number, name: string): SectionBlock {
  const headerLine = lines[start];
  return {
    headerLine,
    name,
    raw: lines.slice(start, end).join('\n').trim(),
    body: {
      lines: lines.slice(start + 1, end),
      literal: markdown.literal.slice(start + 1, end),
      hidden: markdown.hidden.slice(start + 1, end),
      visible: markdown.visible.slice(start + 1, end),
    },
  };
}

/**
 * Extracts the Specification section from an Element unit and parses Section blocks.
 */
export function extractSpecificationSection(content: string): SpecificationSectionParts {
  const normalized = normalizeLineEndings(content);
  const lines = normalized.split('\n');
  const markdown = readSectionMarkdown(lines, { includeSetext: true });
  const { literal: literalMask, setext: underlined } = markdown;
  const specHeaderIndex = lines.findIndex((line, index) => !literalMask[index]
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

  // A heading at level one or two ends the Specification, even without a title.
  let endIndex = lines.length;
  for (let i = specHeaderIndex + 1; i < lines.length; i++) {
    if (!literalMask[i] && (ENCLOSING_HEADING.test(lines[i]) || underlined.has(i))) {
      endIndex = i;
      break;
    }
  }

  const before = lines.slice(0, specHeaderIndex).join('\n');
  const headerLine = lines[specHeaderIndex];
  const isSectionHeader = (index: number) => !literalMask[index] && SECTION_HEADER_REGEX.test(lines[index]);
  const blocks: SectionBlock[] = [];
  const first = specHeaderIndex + 1;
  let cursor = first;
  while (cursor < endIndex && !isSectionHeader(cursor)) cursor++;
  const preamble = lines.slice(first, cursor).join('\n').trimEnd();
  while (cursor < endIndex) {
    const start = cursor++;
    const name = normalizeSectionName(lines[start].match(SECTION_HEADER_REGEX)![1]);
    while (cursor < endIndex && !isSectionHeader(cursor)) cursor++;
    blocks.push(makeSectionBlock(lines, markdown, start, cursor, name));
  }

  const after = lines.slice(endIndex).join('\n');

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
  malformedOperationLines: number[];
  malformedSectionLines: number[];
  unscopedContentLines: number[];
  removedContentLines: number[];
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
  const { sections, removed, unscopedSections, malformedOperationLines, malformedSectionLines, unscopedContentLines, removedContentLines } = splitTopLevelSections(normalized);
  const added = sections.find(([title]) => title.toLowerCase() === 'added sections');
  const modified = sections.find(([title]) => title.toLowerCase() === 'modified sections');
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
    added: added?.[1] ?? [],
    modified: modified?.[1] ?? [],
    removed,
    unsupportedSections,
    duplicateSections,
    unscopedSections,
    malformedOperationLines,
    malformedSectionLines,
    unscopedContentLines,
    removedContentLines,
    sectionPresence: {
      added: added !== undefined,
      modified: modified !== undefined,
      removed: seen.has('removed sections'),
    },
  };
}

function splitTopLevelSections(content: string): {
  sections: Array<[string, SectionBlock[]]>;
  removed: string[];
  unscopedSections: string[];
  malformedOperationLines: number[];
  malformedSectionLines: number[];
  unscopedContentLines: number[];
  removedContentLines: number[];
} {
  const lines = content.split('\n');
  const sections: Array<[string, SectionBlock[]]> = [];
  const removed: string[] = [];
  const unscopedSections: string[] = [];
  const malformedOperationLines: number[] = [];
  const malformedSectionLines: number[] = [];
  const unscopedContentLines: number[] = [];
  const removedContentLines: number[] = [];
  const markdown = readSectionMarkdown(lines, { includeSetext: true, includeListItems: true });
  const { literal: mask, setext: underlined, listItems } = markdown;
  const indices: Array<{ title: string; index: number }> = [];
  let block = '';
  let hasSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const setextEnd = mask[i] ? undefined : underlined.get(i);
    if (setextEnd !== undefined) {
      malformedOperationLines.push(i + 1);
      indices.push({ title: '', index: i });
      block = '';
      hasSection = false;
      i = setextEnd;
      continue;
    }
    if (!mask[i] && OVER_INDENTED_OPERATION.test(line)) {
      malformedOperationLines.push(i + 1);
      indices.push({ title: '', index: i });
      block = '';
      hasSection = false;
      continue;
    }
    const heading = !mask[i] && line.match(ENCLOSING_HEADING);
    if (heading) {
      const topLevel = heading[1] === '#';
      const title = topLevel ? '' : heading[2]?.trim() ?? '';
      if (topLevel) unscopedContentLines.push(i + 1);
      else if (!title) malformedOperationLines.push(i + 1);
      indices.push({ title, index: i });
      block = title.toLowerCase();
      hasSection = false;
    } else if (!mask[i] && /^ {0,3}###\s*Section:/.test(line)) {
      const name = deltaSectionName(line.match(DELTA_SECTION_HEADER)?.[1]);
      if (!name) malformedSectionLines.push(i + 1);
      else if (!block) unscopedSections.push(name);
      else if (block === 'removed sections') removed.push(name);
      else hasSection = true;
    } else if (block === 'removed sections') {
      // A plain removal bullet contains a nested heading; the list item itself must be top-level.
      const prefix = listItems.has(i) ? line.match(REMOVED_BULLET_PREFIX)?.[0] : undefined;
      if (!prefix) removedContentLines.push(i + 1);
      else {
        const name = removedBulletName(line, prefix);
        if (name) removed.push(name);
        else malformedSectionLines.push(i + 1);
      }
    } else if (!block || (!hasSection && /^(added|modified) sections$/.test(block))) {
      unscopedContentLines.push(i + 1);
    }
  }
  for (let i = 0; i < indices.length; i++) {
    const current = indices[i];
    if (!current.title) continue;
    const next = indices[i + 1];
    const blocks = /^(added|modified) sections$/i.test(current.title)
      ? parseSectionBlocks(lines, markdown, current.index + 1, next?.index ?? lines.length)
      : [];
    sections.push([current.title, blocks]);
  }
  return { sections, removed, unscopedSections, malformedOperationLines, malformedSectionLines, unscopedContentLines, removedContentLines };
}

function parseSectionBlocks(lines: string[], markdown: ReturnType<typeof readSectionMarkdown>, start: number, end: number): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  const isHeader = (index: number) => !markdown.literal[index] && /^ {0,3}###\s*Section:/.test(lines[index]);
  let i = start;
  while (i < end) {
    while (i < end && !isHeader(i)) i++;
    if (i >= end) break;
    const first = i++;
    const name = deltaSectionName(lines[first].match(DELTA_SECTION_HEADER)?.[1]);
    if (!name) continue;
    while (i < end && !isHeader(i)) i++;
    blocks.push(makeSectionBlock(lines, markdown, first, i, name));
  }
  return blocks;
}

function removedBulletName(line: string, prefix: string): string | undefined {
  const name = line.slice(prefix.length).trim();
  return deltaSectionName(prefix.includes('`') ? (name.endsWith('`') ? name.slice(0, -1) : undefined) : name);
}
