import type {
  ElementKind,
  Relationship,
  RelationshipKind,
  SemanticModel,
} from '../../core/model/types.js';
import {
  PROJECT_CONFIG_FUNCTIONAL_DEFAULTS,
  readProjectConfig,
} from '../../core/project-config.js';
import { compareCodePoints } from '../../utils/stable-order.js';
import { buildModelTree, sortArchitectureRelationships } from './snapshot.js';
import { readValidArchitecture } from './reader.js';

export interface OutlineElement {
  identity: string;
  kind: string;
  title: string;
  parent: string | null;
  children: string[];
  depth: number;
  definitionState?: 'loaded' | 'unloaded';
  definition?: string;
}

export interface ArchitectureOutlineResult {
  definitionDepth?: number;
  elements: OutlineElement[];
  relations?: Relationship[];
  metamodel?: {
    elementKinds: ElementKind[];
    relationshipKinds: RelationshipKind[];
  };
  statistics: {
    elementCount: number;
    relationshipCount: number;
    kindCount: number;
    loadedDefinitionCount: number;
  };
}

export interface OutlineOptions {
  definitions?: boolean;
  definitionDepth?: number;
  relationships?: boolean;
  metamodel?: boolean;
}

function validateDefinitionDepth(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Definition depth must be a non-negative integer');
  }
  return value;
}

function hierarchyDepths(model: SemanticModel): Map<string, number> {
  const parents = new Map(
    model.elements.map(element => [element.declaration.identity, element.declaration.parent]),
  );
  const depths = new Map<string, number>();

  for (const identity of parents.keys()) {
    if (depths.has(identity)) continue;
    const trail: string[] = [];
    let current: string | null = identity;
    while (current !== null && !depths.has(current)) {
      trail.push(current);
      current = parents.get(current) ?? null;
    }
    let depth = current === null ? -1 : depths.get(current)!;
    for (let index = trail.length - 1; index >= 0; index -= 1) {
      depth += 1;
      depths.set(trail[index], depth);
    }
  }
  return depths;
}

function copyElementKind(kind: ElementKind): ElementKind {
  return {
    identity: kind.identity,
    contract: kind.contract,
    ...(kind.contractFormat === undefined ? {} : { contractFormat: kind.contractFormat }),
    ...(kind.root === undefined ? {} : { root: kind.root }),
    ...(kind.parents === undefined ? {} : { parents: [...kind.parents].sort(compareCodePoints) }),
    ...(kind.children === undefined ? {} : { children: [...kind.children].sort(compareCodePoints) }),
    ...(kind.nodePresentation === undefined ? {} : { nodePresentation: { ...kind.nodePresentation } }),
    body: kind.body,
  };
}

function copyRelationshipKind(kind: RelationshipKind): RelationshipKind {
  return {
    identity: kind.identity,
    ...(kind.sourceKinds === undefined ? {} : { sourceKinds: [...kind.sourceKinds].sort(compareCodePoints) }),
    ...(kind.targetKinds === undefined ? {} : { targetKinds: [...kind.targetKinds].sort(compareCodePoints) }),
    ...(kind.presentation === undefined ? {} : { presentation: { ...kind.presentation } }),
    body: kind.body,
  };
}

export async function outlineArchitecture(
  projectRoot: string,
  options: OutlineOptions = {},
): Promise<ArchitectureOutlineResult> {
  const model = await readValidArchitecture(projectRoot);
  if (model.elements.length === 0) {
    throw new Error('Semantic Model unavailable: no Elements found');
  }

  const definitionsSelected = options.definitions === true || options.definitionDepth !== undefined;
  const configuredDepth = definitionsSelected
    ? validateDefinitionDepth(options.definitionDepth
      ?? readProjectConfig(projectRoot)?.architecture?.outline.definitionDepth
      ?? PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.architecture.outline.definitionDepth)
    : undefined;
  const declarations = new Map(
    model.elements.map(element => [element.declaration.identity, element.declaration]),
  );
  const depths = hierarchyDepths(model);
  const elements = buildModelTree(model).map(element => {
    const declaration = declarations.get(element.identity)!;
    const depth = depths.get(element.identity)!;
    return {
      identity: element.identity,
      kind: element.kind,
      title: declaration.title,
      parent: element.parent,
      children: element.children,
      depth,
      ...(configuredDepth === undefined ? {} : {
        definitionState: depth <= configuredDepth ? 'loaded' as const : 'unloaded' as const,
        ...(depth <= configuredDepth ? { definition: element.definition } : {}),
      }),
    };
  });
  const relations = options.relationships ? sortArchitectureRelationships(model.relationships) : undefined;
  const metamodel = options.metamodel ? {
    elementKinds: model.elementKinds
      .map(copyElementKind)
      .sort((left, right) => compareCodePoints(left.identity, right.identity)),
    relationshipKinds: model.relationshipKinds
      .map(copyRelationshipKind)
      .sort((left, right) => compareCodePoints(left.identity, right.identity)),
  } : undefined;

  return {
    ...(configuredDepth === undefined ? {} : { definitionDepth: configuredDepth }),
    elements,
    ...(relations === undefined ? {} : { relations }),
    ...(metamodel === undefined ? {} : { metamodel }),
    statistics: {
      elementCount: elements.length,
      relationshipCount: model.relationships.length,
      kindCount: model.elementKinds.length + model.relationshipKinds.length,
      loadedDefinitionCount: elements.filter(element => element.definitionState === 'loaded').length,
    },
  };
}

interface OutlineTreeNode extends OutlineElement {
  childNodes: OutlineTreeNode[];
}

function buildOutlineTree(elements: readonly OutlineElement[]): OutlineTreeNode[] {
  const byId = new Map<string, OutlineTreeNode>(elements.map(element => [
    element.identity,
    { ...element, children: [...element.children], childNodes: [] },
  ]));
  const roots: OutlineTreeNode[] = [];
  for (const element of elements) {
    const node = byId.get(element.identity)!;
    const parent = element.parent === null ? undefined : byId.get(element.parent);
    if (parent) parent.childNodes.push(node);
    else roots.push(node);
  }
  return roots;
}

function outlineNodeLabel(element: OutlineElement): string {
  if (element.definitionState === undefined) return `${element.identity} (${element.kind}) ${element.title}`;
  const definition = element.definitionState === 'loaded'
    ? element.definition
    : '[definition unloaded]';
  return `${element.identity} (${element.kind}) ${element.title} | ${definition}`;
}

function renderRelations(relations: readonly Relationship[], markdown: boolean): string[] {
  const heading = markdown ? '## Relationships' : '[relationships]';
  return [heading, ...relations.map(relation => `${relation.source} --${relation.kind}--> ${relation.target}`)];
}

function renderMetamodel(metamodel: NonNullable<ArchitectureOutlineResult['metamodel']>, markdown: boolean): string[] {
  const lines = [markdown ? '## Metamodel' : '[metamodel]'];
  for (const kind of metamodel.elementKinds) {
    lines.push(`element-kind: ${kind.identity} ${JSON.stringify(kind)}`);
  }
  for (const kind of metamodel.relationshipKinds) {
    lines.push(`relationship-kind: ${kind.identity} ${JSON.stringify(kind)}`);
  }
  return lines;
}

export function formatArchitectureOutlineText(result: ArchitectureOutlineResult): string {
  const lines: string[] = [];
  const roots = buildOutlineTree(result.elements);
  const stack = roots.map((node, index) => ({
    node,
    prefix: '',
    isLast: index === roots.length - 1,
  })).reverse();
  while (stack.length > 0) {
    const { node, prefix, isLast } = stack.pop()!;
    lines.push(`${prefix}${isLast ? '└── ' : '├── '}${outlineNodeLabel(node)}`);
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    for (let index = node.childNodes.length - 1; index >= 0; index -= 1) {
      stack.push({
        node: node.childNodes[index],
        prefix: childPrefix,
        isLast: index === node.childNodes.length - 1,
      });
    }
  }
  const sections = [lines.join('\n')];
  if (result.relations !== undefined) sections.push(renderRelations(result.relations, false).join('\n'));
  if (result.metamodel !== undefined) sections.push(renderMetamodel(result.metamodel, false).join('\n'));
  return sections.join('\n\n');
}

export function formatArchitectureOutlineMarkdown(result: ArchitectureOutlineResult): string {
  const lines: string[] = [];
  const stack = buildOutlineTree(result.elements)
    .map(node => ({ node, depth: 0 }))
    .reverse();
  while (stack.length > 0) {
    const { node, depth } = stack.pop()!;
    lines.push(`${'  '.repeat(depth)}- ${outlineNodeLabel(node)}`);
    for (let index = node.childNodes.length - 1; index >= 0; index -= 1) {
      stack.push({ node: node.childNodes[index], depth: depth + 1 });
    }
  }
  const sections = [lines.join('\n')];
  if (result.relations !== undefined) sections.push(renderRelations(result.relations, true).join('\n'));
  if (result.metamodel !== undefined) sections.push(renderMetamodel(result.metamodel, true).join('\n'));
  return sections.join('\n\n');
}
