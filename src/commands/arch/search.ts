import { MarkdownParser } from '../../core/parsers/markdown-parser.js';
import { extractRequirementsSection } from '../../core/parsers/requirement-blocks.js';
import { buildSpecRegistry } from '../../core/spec-registry.js';
import { readLikeC4Architecture } from '../../utils/likec4-reader.js';
import type { SemanticElement } from '../../utils/semantic-model.js';
import { compareCodePoints } from '../../utils/stable-order.js';

export interface ArchitectureSearchOptions {
  limit?: number;
}

export interface ArchitectureSearchEvidence {
  field: 'elementId' | 'fqn' | 'title' | 'summary' | 'specId' | 'spec.purpose' | 'spec.requirement';
  text: string;
  specId?: string;
}

export interface ArchitectureSearchMatch {
  element: SemanticElement;
  ownedSpecs: Array<{ specId: string; path: string }>;
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

function normalized(value: string): string {
  return value.toLowerCase();
}

function addEvidence(
  target: RankedEvidence[],
  query: string,
  field: ArchitectureSearchEvidence['field'],
  text: string,
  rank: number,
  specId?: string,
  exact = false,
): void {
  const candidate = normalized(text);
  const search = normalized(query);
  if (exact ? candidate !== search : !candidate.includes(search)) return;
  target.push({ field, text, ...(specId ? { specId } : {}), rank });
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

  const architecture = await readLikeC4Architecture(projectRoot);
  if (architecture.profile !== 'v1') {
    throw new Error('Architecture search requires a Xirang languageVersion 1 Formal Semantic Model');
  }

  const registry = await buildSpecRegistry(projectRoot);
  const matches: Array<ArchitectureSearchMatch & { rank: number }> = [];

  for (const element of architecture.elements) {
    const evidence: RankedEvidence[] = [];
    addEvidence(evidence, searchQuery, 'elementId', element.id, 0, undefined, true);
    addEvidence(evidence, searchQuery, 'fqn', element.fqn, 1, undefined, true);
    addEvidence(evidence, searchQuery, 'title', element.title, 2, undefined, true);
    addEvidence(evidence, searchQuery, 'title', element.title, 3);
    addEvidence(evidence, searchQuery, 'summary', element.summary, 4);

    const ownedSpecs: ArchitectureSearchMatch['ownedSpecs'] = [];
    for (const specId of registry.getSpecsForElement(element.id)) {
      const source = registry.getSpecSource(specId);
      if (!source) throw new Error(`Element Contract source missing: ${specId} (${element.id})`);
      const parsed = new MarkdownParser(source.content).parseSpec(specId);
      ownedSpecs.push({ specId, path: source.path });
      addEvidence(evidence, searchQuery, 'specId', specId, 5, specId);
      addEvidence(evidence, searchQuery, 'spec.purpose', parsed.overview, 5, specId);
      for (const requirement of extractRequirementsSection(source.content).bodyBlocks) {
        addEvidence(evidence, searchQuery, 'spec.requirement', requirement.name, 6, specId);
      }
    }

    if (evidence.length === 0) continue;
    evidence.sort((left, right) => left.rank - right.rank
      || compareCodePoints(left.specId ?? '', right.specId ?? '')
      || compareCodePoints(left.field, right.field)
      || compareCodePoints(left.text, right.text));
    matches.push({
      element,
      ownedSpecs,
      evidence: evidence.map(({ rank: _rank, ...item }) => item),
      rank: evidence[0].rank,
    });
  }

  matches.sort((left, right) => left.rank - right.rank || compareCodePoints(left.element.id, right.element.id));
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
    const evidence = match.evidence.map(item => {
      const spec = item.specId ? ` (${item.specId})` : '';
      return `  ${item.field}${spec}: ${item.text}`;
    }).join('\n');
    return `${match.element.id}  ${match.element.title}\n${evidence}`;
  }).join('\n\n');
}
