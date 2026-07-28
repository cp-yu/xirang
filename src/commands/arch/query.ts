import { deriveLocalNames } from '../../core/likec4/local-names.js';
import type { ElementDeclaration, Relationship, Requirement, SemanticModel } from '../../core/model/types.js';
import { readValidArchitecture } from './reader.js';

export interface ArchQueryOptions {
  relations?: boolean;
  depth?: number;
  contract?: boolean;
}

export interface QueryElement extends ElementDeclaration {
  contract: 'required' | 'optional';
  hasContract: boolean;
  /** Derived from the reverse `parent` index; Declarations only carry `parent`. */
  children: string[];
  requirements?: Requirement[];
}

export interface RefinementElement extends QueryElement {
  depth: number;
}

export interface DepthRelation extends Relationship {
  depth: number;
}

export interface RelatedArchitectureElement {
  element: QueryElement;
  depth: number;
}

export interface ArchQueryResult {
  element: QueryElement;
  refinement: RefinementElement[];
  relations?: DepthRelation[];
  relatedElements?: RelatedArchitectureElement[];
}

/** FQN is a LikeC4 artifact name derived per generation; it never addresses the persistent source. */
function isDerivedFqn(model: SemanticModel, id: string): boolean {
  if (!id.includes('.') || model.elements.length === 0) return false;
  const names = deriveLocalNames(model.elements);
  return model.elements.some(element => names.pathOf(element.declaration.identity) === id);
}

function buildElements(model: SemanticModel, includeContract: boolean): Map<string, QueryElement> {
  const kinds = new Map(model.elementKinds.map(kind => [kind.identity, kind]));
  const children = new Map<string, string[]>();
  for (const element of model.elements) {
    const parent = element.declaration.parent;
    if (parent === null) continue;
    children.set(parent, [...(children.get(parent) ?? []), element.declaration.identity]);
  }
  for (const list of children.values()) list.sort();

  return new Map(model.elements.map(element => [element.declaration.identity, {
    ...element.declaration,
    contract: kinds.get(element.declaration.kind)?.contract ?? 'optional',
    hasContract: element.requirements.length > 0,
    children: children.get(element.declaration.identity) ?? [],
    ...(includeContract ? { requirements: element.requirements } : {}),
  }]));
}

export async function queryArchitecture(
  projectRoot: string,
  id: string,
  options: ArchQueryOptions = {},
): Promise<ArchQueryResult> {
  const model = await readValidArchitecture(projectRoot);
  const elementById = buildElements(model, options.contract === true);
  const element = elementById.get(id);
  if (!element) {
    if (isDerivedFqn(model, id)) {
      throw new Error(`Element must use stable identity, not FQN: ${id}. Use xirang arch search first.`);
    }
    throw new Error(`Element not found: ${id}`);
  }

  const maxDepth = Math.max(1, options.depth ?? 1);
  const refinement: RefinementElement[] = [];
  let frontier = [element];
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next = frontier.flatMap(parent => parent.children)
      .map(child => elementById.get(child))
      .filter((child): child is QueryElement => child !== undefined)
      .sort((left, right) => left.identity.localeCompare(right.identity));
    refinement.push(...next.map(child => ({ ...child, depth })));
    frontier = next;
  }

  if (!options.relations) return { element, refinement };

  const depths = new Map<string, number>([[element.identity, 0], ...refinement.map(child => [child.identity, child.depth] as const)]);
  const adjacency = new Map<string, Relationship[]>();
  for (const relationship of model.relationships) {
    for (const endpoint of new Set([relationship.source, relationship.target])) {
      adjacency.set(endpoint, [...(adjacency.get(endpoint) ?? []), relationship]);
    }
  }
  const queue = [...depths.keys()];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const depth = depths.get(current)!;
    if (depth >= maxDepth) continue;
    for (const relationship of adjacency.get(current) ?? []) {
      const adjacent = relationship.source === current ? relationship.target : relationship.source;
      if (depths.has(adjacent) || !elementById.has(adjacent)) continue;
      depths.set(adjacent, depth + 1);
      queue.push(adjacent);
    }
  }

  const relatedElements = [...depths.entries()]
    .filter(([identity]) => identity !== element.identity)
    .map(([identity, depth]) => ({ element: elementById.get(identity)!, depth }))
    .sort((left, right) => left.depth - right.depth || left.element.identity.localeCompare(right.element.identity));
  const relations = model.relationships
    .filter(relationship => depths.has(relationship.source) && depths.has(relationship.target))
    .map(relationship => ({ ...relationship, depth: Math.max(depths.get(relationship.source)!, depths.get(relationship.target)!) }))
    .sort((left, right) => left.depth - right.depth
      || left.source.localeCompare(right.source)
      || left.target.localeCompare(right.target));
  return { element, refinement, relations, relatedElements };
}

export function formatArchitectureQueryText(result: ArchQueryResult): string {
  const element = result.element;
  const lines = [
    `Element: ${element.identity}`,
    `Type: ${element.kind}`,
    `Title: ${element.title}`,
    `Definition: ${element.definition}`,
  ];
  if (element.parent) lines.push(`Parent: ${element.parent}`);
  lines.push(`Contract: ${element.contract}${element.hasContract ? '' : ' (absent)'}`);
  for (const requirement of element.requirements ?? []) {
    lines.push(`  Requirement: ${requirement.name}`);
    for (const scenario of requirement.scenarios) lines.push(`    Scenario: ${scenario.name}`);
  }
  if (result.refinement.length) {
    lines.push('Refinement Overview:');
    for (const child of result.refinement) lines.push(`  [depth ${child.depth}] Element: ${child.identity}`);
  }
  if (result.relations) {
    lines.push('Relations:');
    for (const relationship of result.relations) {
      lines.push(`  [depth ${relationship.depth}] ${relationship.source} --${relationship.kind}--> ${relationship.target}`);
    }
  }
  return lines.join('\n');
}
