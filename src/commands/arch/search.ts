import type { ElementDeclaration } from '../../core/model/types.js';
import { compareCodePoints } from '../../utils/stable-order.js';
import { readValidArchitecture } from './reader.js';

export interface ArchitectureSearchOptions {
  limit?: number;
}

export interface ArchitectureSearchEvidence {
  field: 'elementId' | 'title' | 'definition' | 'section';
  text: string;
}

export interface ArchitectureSearchMatch {
  element: Pick<ElementDeclaration, 'identity' | 'title' | 'parent'>;
  matchedFields: ArchitectureSearchEvidence['field'][];
  evidence: ArchitectureSearchEvidence[];
}

export interface ArchitectureSearchResult {
  query: string;
  matches: ArchitectureSearchMatch[];
  totalMatches: number;
  diagnostics: string[];
}

interface RankedEvidence extends ArchitectureSearchEvidence {
  rank: number;
}

interface RankedCandidate {
  declaration: ElementDeclaration;
  evidence: RankedEvidence[];
  rank: number;
}

function boundedEvidence(text: string, query: string): string {
  const maxLength = 160;
  if (text.length <= maxLength) return text;
  const matchIndex = text.toLowerCase().indexOf(query.toLowerCase());
  const start = Math.max(0, matchIndex - Math.floor((maxLength - query.length) / 2));
  const end = Math.min(text.length, start + maxLength);
  const adjustedStart = Math.max(0, end - maxLength);
  return `${adjustedStart > 0 ? '…' : ''}${text.slice(adjustedStart, end)}${end < text.length ? '…' : ''}`;
}

function addEvidence(
  target: RankedEvidence[],
  query: string,
  field: ArchitectureSearchEvidence['field'],
  text: string,
  rank: number,
  exact = false,
): void {
  const candidate = text.toLowerCase();
  const search = query.toLowerCase();
  if (exact ? candidate !== search : !candidate.includes(search)) return;
  target.push({ field, text, rank });
}

export async function searchArchitecture(
  projectRoot: string,
  query: string,
  options: ArchitectureSearchOptions = {},
): Promise<ArchitectureSearchResult> {
  const searchQuery = query.trim();
  if (!searchQuery) throw new Error('Search query must not be empty');
  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error('Search limit must be a positive integer');
  }

  const model = await readValidArchitecture(projectRoot);
  const candidates: RankedCandidate[] = [];

  for (const element of model.elements) {
    const declaration = element.declaration;
    const evidence: RankedEvidence[] = [];
    addEvidence(evidence, searchQuery, 'elementId', declaration.identity, 0, true);
    addEvidence(evidence, searchQuery, 'title', declaration.title, 1, true);
    addEvidence(evidence, searchQuery, 'title', declaration.title, 2);
    addEvidence(evidence, searchQuery, 'definition', declaration.definition, 3);
    for (const section of element.sections) {
      addEvidence(evidence, searchQuery, 'section', section.name, 4);
    }

    if (evidence.length === 0) continue;
    evidence.sort((left, right) => left.rank - right.rank
      || compareCodePoints(left.field, right.field)
      || compareCodePoints(left.text, right.text));
    candidates.push({ declaration, evidence, rank: evidence[0].rank });
  }

  candidates.sort((left, right) => left.rank - right.rank
    || compareCodePoints(left.declaration.identity, right.declaration.identity));
  const totalMatches = candidates.length;
  const limited = options.limit === undefined ? candidates : candidates.slice(0, options.limit);

  return {
    query: searchQuery,
    matches: limited.map(({ declaration, evidence }) => ({
      element: {
        identity: declaration.identity,
        title: declaration.title,
        parent: declaration.parent,
      },
      matchedFields: [...new Set(evidence.map(item => item.field))].sort(compareCodePoints),
      evidence: evidence.map(({ rank: _rank, ...item }) => ({
        ...item,
        text: boundedEvidence(item.text, searchQuery),
      })),
    })),
    totalMatches,
    diagnostics: [],
  };
}

export function formatArchitectureSearchText(result: ArchitectureSearchResult): string {
  if (result.matches.length === 0) return `No Semantic Model matches for: ${result.query}`;
  return result.matches.map(match => [
    `${match.element.identity}  ${match.element.title} (parent: ${match.element.parent ?? '(none)'})`,
    `Matched fields: ${match.matchedFields.join(', ')}`,
    ...match.evidence.map(item => `  ${item.field}: ${item.text}`),
  ].join('\n')).join('\n\n');
}
