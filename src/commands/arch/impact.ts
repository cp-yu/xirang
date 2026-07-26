import { buildSpecRegistry } from '../../core/spec-registry.js';
import { readLikeC4Architecture } from '../../utils/likec4-reader.js';
import type { ContractPolicy, SemanticElement, SemanticRelationship } from '../../utils/semantic-model.js';
import { compareCodePoints } from '../../utils/stable-order.js';

export interface ArchitectureImpactOptions {
  depth?: number;
}

export interface ArchitectureImpactElement extends SemanticElement {
  contractPolicy: ContractPolicy;
}

export interface ArchitectureRefinementContext {
  focusElementId: string;
  element: ArchitectureImpactElement;
  direction: 'ancestor' | 'descendant';
  depth: number;
}

export interface ArchitectureRelationPathStep extends SemanticRelationship {
  traversal: 'incoming' | 'outgoing';
}

export interface ArchitectureRelationPath {
  focusElementId: string;
  relatedElementId: string;
  steps: ArchitectureRelationPathStep[];
}

export interface ArchitectureImpactContract {
  specId: string;
  elementId: string;
  path: string;
  content: string;
}

export interface ArchitectureImpactResult {
  focusElements: ArchitectureImpactElement[];
  elements: ArchitectureImpactElement[];
  refinementContext: ArchitectureRefinementContext[];
  relations: SemanticRelationship[];
  relationPaths: ArchitectureRelationPath[];
  contracts: ArchitectureImpactContract[];
  statistics: {
    focusElementCount: number;
    elementCount: number;
    relationCount: number;
    contractCount: number;
    contractBytes: number;
  };
  diagnostics: string[];
}

function relationKey(relation: SemanticRelationship): string {
  return [relation.source, relation.kind, relation.target, relation.description ?? ''].join('\u0000');
}

function compareRelations(left: SemanticRelationship, right: SemanticRelationship): number {
  return compareCodePoints(relationKey(left), relationKey(right));
}

function pathKey(steps: ArchitectureRelationPathStep[]): string {
  return steps.map(step => [step.source, step.kind, step.target].join('\u0000')).join('\u0001');
}

function canonicalPaths(
  focusElementId: string,
  depth: number,
  adjacency: Map<string, SemanticRelationship[]>,
): Map<string, ArchitectureRelationPathStep[]> {
  const paths = new Map<string, ArchitectureRelationPathStep[]>([[focusElementId, []]]);
  let frontier = new Map<string, ArchitectureRelationPathStep[]>([[focusElementId, []]]);

  for (let currentDepth = 1; currentDepth <= depth; currentDepth += 1) {
    const candidates = new Map<string, ArchitectureRelationPathStep[]>();
    for (const [current, currentPath] of [...frontier].sort(([left], [right]) => compareCodePoints(left, right))) {
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
  if (!Number.isInteger(depth) || depth < 0) throw new Error('Impact depth must be a non-negative integer');
  if (focusElementIds.length === 0) throw new Error('At least one focus Element is required');

  const architecture = await readLikeC4Architecture(projectRoot);
  if (architecture.profile !== 'v1') {
    throw new Error('Architecture impact requires a Xirang languageVersion 1 Formal Semantic Model');
  }

  const elements = architecture.elements.map((element): ArchitectureImpactElement => ({
    ...element,
    contractPolicy: architecture.metamodel.elements[element.kind]?.contractPolicy ?? 'optional',
  }));
  const elementById = new Map(elements.map(element => [element.id, element]));
  const roots = elements.filter(element => architecture.metamodel.elements[element.kind]?.root === true);
  if (roots.length !== 1) throw new Error(`Formal Semantic Model must contain exactly one Project Root; found ${roots.length}`);

  const uniqueFocusIds = [...new Set(focusElementIds)].sort(compareCodePoints);
  for (const elementId of uniqueFocusIds) {
    if (elementById.has(elementId)) continue;
    if (elements.some(element => element.fqn === elementId)) {
      throw new Error(`Focus Element must use stable elementId, not FQN: ${elementId}. Use xirang arch search first.`);
    }
    throw new Error(`Focus Element not found: ${elementId}. Use xirang arch search first.`);
  }

  const uniqueRelations = [...new Map(architecture.relations.map(relation => [relationKey(relation), relation])).values()]
    .sort(compareRelations);
  for (const relation of uniqueRelations) {
    if (!elementById.has(relation.source)) throw new Error(`Relationship source not found: ${relation.source}`);
    if (!elementById.has(relation.target)) throw new Error(`Relationship target not found: ${relation.target}`);
  }

  const adjacency = new Map<string, SemanticRelationship[]>();
  for (const relation of uniqueRelations) {
    for (const endpoint of new Set([relation.source, relation.target])) {
      const adjacent = adjacency.get(endpoint) ?? [];
      adjacent.push(relation);
      adjacency.set(endpoint, adjacent);
    }
  }
  for (const adjacent of adjacency.values()) adjacent.sort(compareRelations);

  const reachableIds = new Set(uniqueFocusIds);
  const relationPaths: ArchitectureRelationPath[] = [];
  for (const focusElementId of uniqueFocusIds) {
    const paths = canonicalPaths(focusElementId, depth, adjacency);
    for (const [relatedElementId, steps] of paths) {
      reachableIds.add(relatedElementId);
      if (relatedElementId === focusElementId) continue;
      relationPaths.push({ focusElementId, relatedElementId, steps });
    }
  }
  relationPaths.sort((left, right) => compareCodePoints(left.focusElementId, right.focusElementId)
    || compareCodePoints(left.relatedElementId, right.relatedElementId));

  const refinementContext: ArchitectureRefinementContext[] = [];
  const contextElementIds = new Set<string>();
  for (const focusElementId of uniqueFocusIds) {
    let current = elementById.get(focusElementId)!;
    const seenAncestors = new Set([focusElementId]);
    let ancestorDepth = 0;
    while (current.parent !== null) {
      ancestorDepth += 1;
      const parent = elementById.get(current.parent);
      if (!parent) throw new Error(`Refinement parent not found: ${current.parent}`);
      if (seenAncestors.has(parent.id)) throw new Error(`Refinement cycle detected at: ${parent.id}`);
      seenAncestors.add(parent.id);
      contextElementIds.add(parent.id);
      refinementContext.push({ focusElementId, element: parent, direction: 'ancestor', depth: ancestorDepth });
      current = parent;
    }
    if (current.id !== roots[0].id) {
      throw new Error(`Focus Element ancestor chain does not reach Project Root: ${focusElementId}`);
    }

    let frontier = [elementById.get(focusElementId)!];
    const seenDescendants = new Set([focusElementId]);
    for (let descendantDepth = 1; descendantDepth <= depth; descendantDepth += 1) {
      const next = frontier.flatMap(element => element.children)
        .map(elementId => {
          const child = elementById.get(elementId);
          if (!child) throw new Error(`Refinement child not found: ${elementId}`);
          return child;
        })
        .filter(child => {
          if (seenDescendants.has(child.id)) return false;
          seenDescendants.add(child.id);
          return true;
        })
        .sort((left, right) => compareCodePoints(left.id, right.id));
      for (const child of next) {
        contextElementIds.add(child.id);
        refinementContext.push({ focusElementId, element: child, direction: 'descendant', depth: descendantDepth });
      }
      frontier = next;
    }
  }
  refinementContext.sort((left, right) => compareCodePoints(left.focusElementId, right.focusElementId)
    || compareCodePoints(left.direction, right.direction)
    || left.depth - right.depth
    || compareCodePoints(left.element.id, right.element.id));

  const returnedIds = new Set([...reachableIds, ...contextElementIds]);
  const returnedElements = [...returnedIds].map(elementId => elementById.get(elementId)!)
    .sort((left, right) => compareCodePoints(left.id, right.id));
  const relations = uniqueRelations.filter(relation => reachableIds.has(relation.source) && reachableIds.has(relation.target));

  const registry = await buildSpecRegistry(projectRoot);
  const registryDiagnostics = registry.getDiagnostics();
  if (registryDiagnostics.length > 0) {
    throw new Error(
      `Invalid Element Contract registry:\n${registryDiagnostics
        .map(diagnostic => `  ${diagnostic.specId} [${diagnostic.code}]: ${diagnostic.message}`)
        .join('\n')}`
    );
  }
  const invalidBindings = [...registry.specToElement]
    .filter(([, elementId]) => !elementById.has(elementId))
    .sort(([left], [right]) => compareCodePoints(left, right));
  if (invalidBindings.length > 0) {
    throw new Error(
      `Element Contract owner not found:\n${invalidBindings
        .map(([specId, elementId]) => `  ${specId}: ${elementId}`)
        .join('\n')}`
    );
  }

  const contracts: ArchitectureImpactContract[] = [];
  for (const element of returnedElements) {
    const specIds = registry.getSpecsForElement(element.id);
    if (element.contractPolicy === 'required' && specIds.length === 0) {
      throw new Error(`Required Element Contract missing: ${element.id}`);
    }
    for (const specId of specIds) {
      const source = registry.getSpecSource(specId);
      if (!source) throw new Error(`Element Contract source missing: ${specId} (${element.id})`);
      contracts.push({ specId, elementId: element.id, path: source.path, content: source.content });
    }
  }
  contracts.sort((left, right) => compareCodePoints(left.elementId, right.elementId)
    || compareCodePoints(left.specId, right.specId));

  const focusElements = uniqueFocusIds.map(elementId => elementById.get(elementId)!);
  return {
    focusElements,
    elements: returnedElements,
    refinementContext,
    relations,
    relationPaths,
    contracts,
    statistics: {
      focusElementCount: focusElements.length,
      elementCount: returnedElements.length,
      relationCount: relations.length,
      contractCount: contracts.length,
      contractBytes: contracts.reduce((total, contract) => total + Buffer.byteLength(contract.content), 0),
    },
    diagnostics: [],
  };
}

export function formatArchitectureImpactText(result: ArchitectureImpactResult): string {
  const lines = [
    `Focus Elements: ${result.focusElements.map(element => element.id).join(', ')}`,
    `Elements: ${result.statistics.elementCount}`,
    `Relationships: ${result.statistics.relationCount}`,
    `Contracts: ${result.statistics.contractCount}`,
  ];
  for (const relation of result.relations) {
    lines.push(`${relation.source} --${relation.kind}--> ${relation.target}`);
  }
  return lines.join('\n');
}
