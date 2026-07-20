import { readLikeC4Architecture, type LikeC4Architecture } from '../../utils/likec4-reader.js';
import type { ArchitectureCapability, ArchitectureDomain, ArchitectureRelation } from '../../utils/likec4-parser.js';

export interface ArchQueryOptions { relations?: boolean; depth?: number }
export type ArchitectureElement = ArchitectureCapability | ArchitectureDomain;
export interface RelatedArchitectureElement { element: ArchitectureElement; depth: number }
export interface DepthRelation extends ArchitectureRelation { depth: number }

function findElement(architecture: LikeC4Architecture, id: string): ArchitectureElement | undefined {
  return architecture.capabilities.find(capability => capability.capabilityId === id || capability.id === id)
    ?? architecture.domains.find(domain => domain.id === id);
}

function canonicalId(element: ArchitectureElement): string {
  return 'capabilityId' in element && element.capabilityId ? element.capabilityId : element.id;
}

export async function queryArchitecture(projectRoot: string, id: string, options: ArchQueryOptions = {}) {
  const architecture = await readLikeC4Architecture(projectRoot);
  const element = findElement(architecture, id);
  if (!element) throw new Error(`Element not found: ${id}`);
  if (!options.relations) return { element };

  const maxDepth = Math.max(1, options.depth ?? 1);
  const elementById = new Map<string, ArchitectureElement>([
    ...architecture.domains.map(domain => [domain.id, domain] as const),
    ...architecture.capabilities.map(capability => [capability.id, capability] as const),
  ]);
  const depths = new Map([[element.id, 0]]);
  const queue = [element.id];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const depth = depths.get(current)!;
    if (depth >= maxDepth) continue;
    for (const relation of architecture.relations) {
      const adjacent = relation.source === current ? relation.target : relation.target === current ? relation.source : undefined;
      if (!adjacent || depths.has(adjacent) || !elementById.has(adjacent)) continue;
      depths.set(adjacent, depth + 1);
      queue.push(adjacent);
    }
  }

  const relatedElements = [...depths.entries()]
    .filter(([, depth]) => depth > 0)
    .map(([elementId, depth]) => ({ element: elementById.get(elementId)!, depth }))
    .sort((left, right) => left.depth - right.depth || canonicalId(left.element).localeCompare(canonicalId(right.element)));
  const relations = architecture.relations
    .filter(relation => depths.has(relation.source) && depths.has(relation.target))
    .map(relation => ({ ...relation, depth: Math.max(depths.get(relation.source)!, depths.get(relation.target)!) }))
    .sort((left, right) => left.depth - right.depth || left.source.localeCompare(right.source) || left.target.localeCompare(right.target));
  return { element, relations, relatedElements };
}

function relationEndpoint(id: string, architecture: LikeC4Architecture): string {
  const element = architecture.capabilities.find(capability => capability.id === id);
  return element?.capabilityId ?? id;
}

export async function formatArchitectureQueryText(projectRoot: string, result: Awaited<ReturnType<typeof queryArchitecture>>): Promise<string> {
  const architecture = await readLikeC4Architecture(projectRoot);
  const element = result.element;
  const lines = [
    `Element: ${canonicalId(element)}`,
    `Type: ${'capabilityId' in element ? 'capability' : 'domain'}`,
  ];
  if (element.description) lines.push(`Description: ${element.description}`);
  if ('specs' in element && element.specs.length) lines.push('Specs:', ...element.specs.map(spec => `  ${spec}`));
  if (result.relations && result.relatedElements) {
    lines.push('Relations:');
    for (const relation of result.relations) {
      const description = relation.description ? ` - ${relation.description}` : '';
      lines.push(`  [depth ${relation.depth}] ${relationEndpoint(relation.source, architecture)} --${relation.kind}--> ${relationEndpoint(relation.target, architecture)}${description}`);
    }
    for (const related of result.relatedElements) lines.push(`  [depth ${related.depth}] Element: ${canonicalId(related.element)}`);
  }
  return lines.join('\n');
}
