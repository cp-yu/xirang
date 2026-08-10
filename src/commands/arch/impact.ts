import { deriveLocalNames } from '../../core/likec4/local-names.js';
import type { Relationship, SemanticModel } from '../../core/model/types.js';
import { compareCodePoints } from '../../utils/stable-order.js';
import { readValidArchitecture } from './reader.js';

export interface ArchitectureImpactOptions {
  depth?: number;
}

export interface ArchitectureRefinementContext {
  focusElementId: string;
  elementId: string;
  direction: 'ancestor' | 'descendant';
  depth: number;
}

export interface ArchitectureRelationPathStep extends Relationship {
  traversal: 'incoming' | 'outgoing';
}

export interface ArchitectureRelationPath {
  focusElementId: string;
  relatedElementId: string;
  steps: ArchitectureRelationPathStep[];
}

export interface ArchitectureImpactResult {
  focusElements: string[];
  elements: string[];
  refinementContext: ArchitectureRefinementContext[];
  relations: Relationship[];
  relationPaths: ArchitectureRelationPath[];
  statistics: {
    focusElementCount: number;
    elementCount: number;
    relationCount: number;
  };
  diagnostics: string[];
}

function relationKey(relation: Relationship): string {
  return [relation.source, relation.kind, relation.target].join('\u0000');
}

function compareRelations(left: Relationship, right: Relationship): number {
  return compareCodePoints(relationKey(left), relationKey(right));
}

function pathKey(steps: ArchitectureRelationPathStep[]): string {
  return steps.map(step => relationKey(step)).join('\u0001');
}

function isDerivedFqn(model: SemanticModel, id: string): boolean {
  if (!id.includes('.') || model.elements.length === 0) return false;
  const names = deriveLocalNames(model.elements);
  return model.elements.some(element => names.pathOf(element.declaration.identity) === id);
}

function canonicalPaths(
  focusElementId: string,
  depth: number,
  adjacency: Map<string, Relationship[]>,
): Map<string, ArchitectureRelationPathStep[]> {
  const paths = new Map<string, ArchitectureRelationPathStep[]>([[focusElementId, []]]);
  let frontier = new Map<string, ArchitectureRelationPathStep[]>([[focusElementId, []]]);

  for (let currentDepth = 1; currentDepth <= depth; currentDepth += 1) {
    const candidates = new Map<string, ArchitectureRelationPathStep[]>();
    for (const [current, currentPath] of frontier) {
      for (const relation of adjacency.get(current) ?? []) {
        const outgoing = relation.source === current;
        const adjacent = outgoing ? relation.target : relation.source;
        if (paths.has(adjacent)) continue;
        const candidate = [
          ...currentPath,
          { ...relation, traversal: outgoing ? 'outgoing' as const : 'incoming' as const },
        ];
        const existing = candidates.get(adjacent);
        if (!existing || compareCodePoints(pathKey(candidate), pathKey(existing)) < 0) {
          candidates.set(adjacent, candidate);
        }
      }
    }
    if (candidates.size === 0) break;
    for (const [elementId, steps] of candidates) paths.set(elementId, steps);
    frontier = candidates;
  }

  return paths;
}

export async function impactArchitecture(
  projectRoot: string,
  focusElementIds: string[],
  options: ArchitectureImpactOptions = {},
): Promise<ArchitectureImpactResult> {
  const depth = options.depth ?? 2;
  if (!Number.isInteger(depth) || depth < 0) {
    throw new Error('Impact depth must be a non-negative integer');
  }
  if (focusElementIds.length === 0) {
    throw new Error('At least one focus Element is required');
  }

  const model = await readValidArchitecture(projectRoot);
  const kinds = new Map(model.elementKinds.map(kind => [kind.identity, kind]));
  const elementById = new Map(
    model.elements.map(element => [element.declaration.identity, element.declaration]),
  );
  const childrenOf = new Map<string, string[]>();
  for (const element of model.elements) {
    const parent = element.declaration.parent;
    if (parent === null) continue;
    const children = childrenOf.get(parent);
    if (children) children.push(element.declaration.identity);
    else childrenOf.set(parent, [element.declaration.identity]);
  }
  for (const children of childrenOf.values()) children.sort(compareCodePoints);

  const roots = model.elements
    .map(element => element.declaration)
    .filter(element => kinds.get(element.kind)?.root === true);
  if (roots.length !== 1) {
    throw new Error(`Semantic Model must contain exactly one Project Root; found ${roots.length}`);
  }

  const focusElements = [...new Set(focusElementIds)].sort(compareCodePoints);
  for (const elementId of focusElements) {
    if (elementById.has(elementId)) continue;
    if (isDerivedFqn(model, elementId)) {
      throw new Error(`Focus Element must use stable elementId, not FQN: ${elementId}. Use xirang arch search first.`);
    }
    throw new Error(`Focus Element not found: ${elementId}. Use xirang arch search first.`);
  }

  const uniqueRelations = [...new Map(
    model.relationships.map(relation => [relationKey(relation), relation]),
  ).values()].sort(compareRelations);
  for (const relation of uniqueRelations) {
    if (!elementById.has(relation.source)) {
      throw new Error(`Relationship source not found: ${relation.source}`);
    }
    if (!elementById.has(relation.target)) {
      throw new Error(`Relationship target not found: ${relation.target}`);
    }
  }

  const adjacency = new Map<string, Relationship[]>();
  for (const relation of uniqueRelations) {
    for (const endpoint of new Set([relation.source, relation.target])) {
      const relations = adjacency.get(endpoint);
      if (relations) relations.push(relation);
      else adjacency.set(endpoint, [relation]);
    }
  }
  for (const adjacent of adjacency.values()) adjacent.sort(compareRelations);

  const reachableIds = new Set(focusElements);
  const relationPaths: ArchitectureRelationPath[] = [];
  for (const focusElementId of focusElements) {
    const paths = canonicalPaths(focusElementId, depth, adjacency);
    for (const [relatedElementId, steps] of paths) {
      reachableIds.add(relatedElementId);
      if (relatedElementId !== focusElementId) {
        relationPaths.push({ focusElementId, relatedElementId, steps });
      }
    }
  }
  relationPaths.sort((left, right) => compareCodePoints(left.focusElementId, right.focusElementId)
    || compareCodePoints(left.relatedElementId, right.relatedElementId));

  const refinementContext: ArchitectureRefinementContext[] = [];
  const contextElementIds = new Set<string>();
  for (const focusElementId of focusElements) {
    let current = elementById.get(focusElementId)!;
    const seenAncestors = new Set([focusElementId]);
    let ancestorDepth = 0;
    while (current.parent !== null) {
      ancestorDepth += 1;
      const parent = elementById.get(current.parent);
      if (!parent) throw new Error(`Refinement parent not found: ${current.parent}`);
      if (seenAncestors.has(parent.identity)) {
        throw new Error(`Refinement cycle detected at: ${parent.identity}`);
      }
      seenAncestors.add(parent.identity);
      contextElementIds.add(parent.identity);
      refinementContext.push({
        focusElementId,
        elementId: parent.identity,
        direction: 'ancestor',
        depth: ancestorDepth,
      });
      current = parent;
    }
    if (current.identity !== roots[0].identity) {
      throw new Error(`Focus Element ancestor chain does not reach Project Root: ${focusElementId}`);
    }

    let frontier = [focusElementId];
    const seenDescendants = new Set([focusElementId]);
    for (let descendantDepth = 1; descendantDepth <= depth; descendantDepth += 1) {
      const next = frontier
        .flatMap(elementId => childrenOf.get(elementId) ?? [])
        .filter(elementId => {
          if (seenDescendants.has(elementId)) return false;
          seenDescendants.add(elementId);
          return true;
        })
        .sort(compareCodePoints);
      for (const elementId of next) {
        contextElementIds.add(elementId);
        refinementContext.push({
          focusElementId,
          elementId,
          direction: 'descendant',
          depth: descendantDepth,
        });
      }
      frontier = next;
    }
  }
  refinementContext.sort((left, right) => compareCodePoints(left.focusElementId, right.focusElementId)
    || compareCodePoints(left.direction, right.direction)
    || left.depth - right.depth
    || compareCodePoints(left.elementId, right.elementId));

  const elements = [...new Set([...reachableIds, ...contextElementIds])].sort(compareCodePoints);
  const relations = uniqueRelations.filter(
    relation => reachableIds.has(relation.source) && reachableIds.has(relation.target),
  );

  return {
    focusElements,
    elements,
    refinementContext,
    relations,
    relationPaths,
    statistics: {
      focusElementCount: focusElements.length,
      elementCount: elements.length,
      relationCount: relations.length,
    },
    diagnostics: [],
  };
}

export function formatArchitectureImpactText(result: ArchitectureImpactResult): string {
  const lines = [
    `Focus Elements: ${result.focusElements.join(', ')}`,
    `Element identities: ${result.elements.join(', ')}`,
    `Relationships: ${result.statistics.relationCount}`,
  ];
  for (const context of result.refinementContext) {
    lines.push(
      `${context.focusElementId} ${context.direction} ${context.elementId} [depth ${context.depth}]`,
    );
  }
  for (const relation of result.relations) {
    lines.push(`${relation.source} --${relation.kind}--> ${relation.target}`);
  }
  return lines.join('\n');
}
