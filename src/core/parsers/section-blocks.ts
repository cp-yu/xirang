import { buildCodeFenceMask, readDeltaSectionMarkdown, type SectionBodyMarkdown } from './section-text.js';

export interface SectionBlock {
  headerLine: string; // e.g., '### Section: Something'
  name: string; // e.g., 'Something'
  raw: string; // full block including headerLine and following content
}

export interface DeltaSectionBlock extends SectionBlock {
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

const FORMAL_SECTION_HEADER = /^###\s*Section:\s*(.+)\s*$/;
const SECTION_HEADER = /^ {0,3}###[ \t]+Section:(.*)$/;
const SECTION_LIKE = /^ {0,3}###\s*Section:/;
const REMOVED_BULLET_PREFIX = /^ {0,3}-[ \t]+`?###[ \t]+Section:/;
const OVER_INDENTED_OPERATION = /^(?: {4}|[ \t]*\t)[ \t]*##[ \t]+\S.*[ \t]+Sections[ \t]*#*[ \t]*$/i;

function deltaSectionName(raw: string | undefined): string | undefined {
  const name = raw?.trim();
  return name && !/(?:^|[ \t])#+$/.test(name) ? name : undefined;
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n');
}

function makeDeltaSectionBlock(lines: string[], markdown: ReturnType<typeof readDeltaSectionMarkdown>, start: number, end: number, name: string): DeltaSectionBlock {
  const headerLine = lines[start];
  const acceptanceCases = new Map<number, string>();
  for (let i = start + 1; i < end; i++) {
    const title = markdown.acceptanceCases.get(i);
    if (title !== undefined) acceptanceCases.set(i - start - 1, title);
  }
  return {
    headerLine,
    name,
    raw: lines.slice(start, end).join('\n').trim(),
    body: {
      lines: lines.slice(start + 1, end),
      acceptanceCases,
      hidden: markdown.hidden.slice(start + 1, end),
    },
  };
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
    && FORMAL_SECTION_HEADER.test(sectionBodyLines[index]);

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
    const headerMatch = headerLineCandidate.match(FORMAL_SECTION_HEADER);
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
  added: DeltaSectionBlock[];
  modified: DeltaSectionBlock[];
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
  sections: Array<[string, DeltaSectionBlock[]]>;
  removed: string[];
  unscopedSections: string[];
  malformedOperationLines: number[];
  malformedSectionLines: number[];
  unscopedContentLines: number[];
  removedContentLines: number[];
} {
  const lines = content.split('\n');
  const sections: Array<[string, DeltaSectionBlock[]]> = [];
  const removed: string[] = [];
  const unscopedSections: string[] = [];
  const malformedOperationLines: number[] = [];
  const malformedSectionLines: number[] = [];
  const unscopedContentLines: number[] = [];
  const removedContentLines: number[] = [];
  const markdown = readDeltaSectionMarkdown(lines);
  const { headings, literal, removalItems } = markdown;
  let block: [string, DeltaSectionBlock[]] | undefined;
  let section: { start: number; name: string } | undefined;
  const finishSection = (end: number) => {
    if (section && block) block[1].push(makeDeltaSectionBlock(lines, markdown, section.start, end, section.name));
    section = undefined;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const heading = headings.get(i);
    if ((heading && heading.end > i) || (!literal[i] && OVER_INDENTED_OPERATION.test(line))) {
      finishSection(i);
      malformedOperationLines.push(i + 1);
      block = undefined;
      i = heading?.end ?? i;
      continue;
    }
    if (heading && heading.depth <= 2) {
      finishSection(i);
      const title = heading.depth === 2 ? line.trim().slice(2).trim() : '';
      block = title ? [title, []] : undefined;
      if (block) sections.push(block);
      else if (heading.depth === 1) unscopedContentLines.push(i + 1);
      else malformedOperationLines.push(i + 1);
      continue;
    }
    const operation = block?.[0].toLowerCase();
    const sectionHeader = heading?.depth === 3 ? line.match(SECTION_HEADER) : null;
    if (sectionHeader || (!literal[i] && SECTION_LIKE.test(line))) {
      finishSection(i);
      const name = deltaSectionName(sectionHeader?.[1]);
      if (!name) malformedSectionLines.push(i + 1);
      else if (!block) unscopedSections.push(name);
      else if (operation === 'removed sections') removed.push(name);
      else if (operation === 'added sections' || operation === 'modified sections') section = { start: i, name };
    } else if (operation === 'removed sections') {
      const prefix = line.match(REMOVED_BULLET_PREFIX)?.[0];
      if (!prefix || !removalItems.has(i)) removedContentLines.push(i + 1);
      else {
        const name = removedBulletName(line, prefix);
        if (name) removed.push(name);
        else malformedSectionLines.push(i + 1);
      }
    } else if (!block || (!section && (operation === 'added sections' || operation === 'modified sections'))) {
      unscopedContentLines.push(i + 1);
    }
  }
  finishSection(lines.length);
  return { sections, removed, unscopedSections, malformedOperationLines, malformedSectionLines, unscopedContentLines, removedContentLines };
}

function removedBulletName(line: string, prefix: string): string | undefined {
  const name = line.slice(prefix.length).trim();
  return deltaSectionName(prefix.includes('`') ? (name.endsWith('`') ? name.slice(0, -1) : undefined) : name);
}
