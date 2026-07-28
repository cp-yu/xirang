import type { ElementDeclaration } from '../../core/model/types.js';
import { compareCodePoints } from '../../utils/stable-order.js';
import { readValidArchitecture } from './reader.js';

export interface ArchitectureSearchOptions {
  limit?: number;
}

export interface ArchitectureSearchEvidence {
  field: 'elementId' | 'title' | 'definition' | 'requirement';
  text: string;
}

export interface ArchitectureSearchMatch {
  element: ElementDeclaration;
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
  const matches: Array<ArchitectureSearchMatch & { rank: number }> = [];

  for (const element of model.elements) {
    const declaration = element.declaration;
    const evidence: RankedEvidence[] = [];
    addEvidence(evidence, searchQuery, 'elementId', declaration.identity, 0, true);
    addEvidence(evidence, searchQuery, 'title', declaration.title, 1, true);
    addEvidence(evidence, searchQuery, 'title', declaration.title, 2);
    addEvidence(evidence, searchQuery, 'definition', declaration.definition, 3);
    for (const requirement of element.requirements) {
      addEvidence(evidence, searchQuery, 'requirement', requirement.name, 4);
    }

    if (evidence.length === 0) continue;
    evidence.sort((left, right) => left.rank - right.rank
      || compareCodePoints(left.field, right.field)
      || compareCodePoints(left.text, right.text));
    matches.push({
      element: declaration,
      evidence: evidence.map(({ rank: _rank, ...item }) => item),
      rank: evidence[0].rank,
    });
  }

  matches.sort((left, right) => left.rank - right.rank
    || compareCodePoints(left.element.identity, right.element.identity));
  const totalMatches = matches.length;
  const limited = options.limit === undefined ? matches : matches.slice(0, options.limit);

  return {
    query: searchQuery,
    matches: limited.map(({ rank: _rank, ...match }) => match),
    totalMatches,
    diagnostics: [],
  };
}

export function formatArchitectureSearchText(result: ArchitectureSearchResult): string {
  if (result.matches.length === 0) return `No Formal Semantic Model matches for: ${result.query}`;
  return result.matches.map(match => {
    const evidence = match.evidence
      .filter(item => item.field !== 'definition')
      .map(item => `  ${item.field}: ${item.text}`);
    return [
      `${match.element.identity}  ${match.element.title}`,
      `Definition: ${match.element.definition}`,
      ...evidence,
    ].join('\n');
  }).join('\n\n');
}
