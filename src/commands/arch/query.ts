import { buildSpecRegistry } from '../../core/spec-registry.js';
import { readLikeC4Architecture, type LikeC4Architecture } from '../../utils/likec4-reader.js';
import type { ArchitectureCapability, ArchitectureDomain, ArchitectureRelation } from '../../utils/likec4-parser.js';
import type { ContractPolicy, SemanticElement } from '../../utils/semantic-model.js';

export interface ArchQueryOptions { relations?: boolean; depth?: number }
export type ArchitectureElement = ArchitectureCapability | ArchitectureDomain;
export interface RelatedArchitectureElement { element: ArchitectureElement; depth: number }
export interface DepthRelation extends ArchitectureRelation { depth: number }
export interface SemanticQueryElement extends SemanticElement {
  contractPolicy: ContractPolicy;
  specs: string[];
}
export interface RefinementElement extends SemanticQueryElement { depth: number }

function findLegacyElement(architecture: LikeC4Architecture, id: string): ArchitectureElement | undefined {
  return architecture.capabilities.find(capability => capability.capabilityId === id || capability.id === id)
    ?? architecture.domains.find(domain => domain.id === id);
}

function canonicalId(element: ArchitectureElement | SemanticQueryElement): string {
  return 'capabilityId' in element && element.capabilityId ? element.capabilityId : element.id;
}

function specPath(specId: string): string {
  return `.opsx/specs/${specId}/spec.md`;
}

async function querySemanticArchitecture(
  projectRoot: string,
  architecture: LikeC4Architecture,
  id: string,
  options: ArchQueryOptions,
) {
  const source = architecture.elements.find(element => element.id === id || element.fqn === id);
  if (!source) throw new Error(`Element not found: ${id}`);

  const registry = await buildSpecRegistry(projectRoot);
  const elements = architecture.elements.map((element): SemanticQueryElement => ({
    ...element,
    contractPolicy: architecture.metamodel.elements[element.kind]?.contractPolicy ?? 'optional',
    specs: registry.getSpecsForElement(element.id).map(specPath),
  }));
  const elementById = new Map(elements.map(element => [element.id, element]));
  const element = elementById.get(source.id)!;
  const maxDepth = Math.max(1, options.depth ?? 1);
  const refinement: RefinementElement[] = [];
  let frontier = [element];
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next = frontier.flatMap(parent => parent.children)
      .map(child => elementById.get(child))
      .filter((child): child is SemanticQueryElement => child !== undefined)
      .sort((left, right) => left.id.localeCompare(right.id));
    refinement.push(...next.map(child => ({ ...child, depth })));
    frontier = next;
  }

  if (!options.relations) return { element, refinement };

  const depths = new Map<string, number>([[element.id, 0], ...refinement.map(child => [child.id, child.depth] as const)]);
  const adjacency = new Map<string, ArchitectureRelation[]>();
  for (const relation of architecture.relations) {
    for (const endpoint of [relation.source, relation.target]) {
      const adjacent = adjacency.get(endpoint);
      if (adjacent) adjacent.push(relation);
      else adjacency.set(endpoint, [relation]);
    }
  }
  const queue = [...depths.keys()];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const depth = depths.get(current)!;
    if (depth >= maxDepth) continue;
    for (const relation of adjacency.get(current) ?? []) {
      const adjacent = relation.source === current ? relation.target : relation.source;
      if (depths.has(adjacent) || !elementById.has(adjacent)) continue;
      depths.set(adjacent, depth + 1);
      queue.push(adjacent);
    }
  }
  const relatedElements = [...depths.entries()]
    .filter(([elementId]) => elementId !== element.id)
    .map(([elementId, depth]) => ({ element: elementById.get(elementId)!, depth }))
    .sort((left, right) => left.depth - right.depth || left.element.id.localeCompare(right.element.id));
  const relations = architecture.relations
    .filter(relation => depths.has(relation.source) && depths.has(relation.target))
    .map(relation => ({ ...relation, depth: Math.max(depths.get(relation.source)!, depths.get(relation.target)!) }))
    .sort((left, right) => left.depth - right.depth || left.source.localeCompare(right.source) || left.target.localeCompare(right.target));
  return { element, refinement, relations, relatedElements };
}

function queryLegacyArchitecture(architecture: LikeC4Architecture, id: string, options: ArchQueryOptions) {
  const element = findLegacyElement(architecture, id);
  if (!element) throw new Error(`Element not found: ${id}`);
  if (!options.relations) return { element };

  const maxDepth = Math.max(1, options.depth ?? 1);
  const elementById = new Map<string, ArchitectureElement>([
    ...architecture.domains.map(domain => [domain.id, domain] as const),
    ...architecture.capabilities.map(capability => [capability.id, capability] as const),
  ]);
  const adjacency = new Map<string, ArchitectureRelation[]>();
  for (const relation of architecture.relations) {
    for (const endpoint of [relation.source, relation.target]) {
      const adjacent = adjacency.get(endpoint);
      if (adjacent) adjacent.push(relation);
      else adjacency.set(endpoint, [relation]);
    }
  }
  const depths = new Map([[element.id, 0]]);
  const queue = [element.id];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const depth = depths.get(current)!;
    if (depth >= maxDepth) continue;
    for (const relation of adjacency.get(current) ?? []) {
      const adjacent = relation.source === current ? relation.target : relation.source;
      if (depths.has(adjacent) || !elementById.has(adjacent)) continue;
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

export async function queryArchitecture(projectRoot: string, id: string, options: ArchQueryOptions = {}) {
  const architecture = await readLikeC4Architecture(projectRoot);
  return architecture.profile === 'v1'
    ? querySemanticArchitecture(projectRoot, architecture, id, options)
    : queryLegacyArchitecture(architecture, id, options);
}

function relationEndpoint(id: string, endpointLabels: Map<string, string>): string {
  return endpointLabels.get(id) ?? id;
}

export async function formatArchitectureQueryText(_projectRoot: string, result: Awaited<ReturnType<typeof queryArchitecture>>): Promise<string> {
  const element = result.element;
  const semantic = 'fqn' in element;
  const endpointLabels = new Map([[semantic ? element.id : element.id, canonicalId(element)]]);
  for (const related of result.relatedElements ?? []) {
    endpointLabels.set(related.element.id, canonicalId(related.element));
  }
  const lines = [
    `Element: ${canonicalId(element)}`,
    `Type: ${semantic ? element.kind : 'capabilityId' in element ? 'capability' : 'domain'}`,
  ];
  if (semantic) {
    lines.push(`FQN: ${element.fqn}`, `Title: ${element.title}`, `Summary: ${element.summary}`);
    if (element.parent) lines.push(`Parent: ${element.parent}`);
    lines.push(`Contract Policy: ${element.contractPolicy}`);
  } else if (element.description) {
    lines.push(`Description: ${element.description}`);
  }
  if ('specs' in element && element.specs.length) lines.push('Specs:', ...element.specs.map(spec => `  ${spec}`));
  if ('refinement' in result && result.refinement.length) {
    lines.push('Refinement Overview:');
    for (const child of result.refinement) lines.push(`  [depth ${child.depth}] Element: ${child.id}`);
  }
  if (result.relations && result.relatedElements) {
    lines.push('Relations:');
    for (const relation of result.relations) {
      const description = relation.description ? ` - ${relation.description}` : '';
      lines.push(`  [depth ${relation.depth}] ${relationEndpoint(relation.source, endpointLabels)} --${relation.kind}--> ${relationEndpoint(relation.target, endpointLabels)}${description}`);
    }
    if (!semantic) {
      for (const related of result.relatedElements) lines.push(`  [depth ${related.depth}] Element: ${canonicalId(related.element)}`);
    }
  }
  return lines.join('\n');
}
