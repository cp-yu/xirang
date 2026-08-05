import type { Relationship, SemanticModel } from '../../core/model/types.js';
import { compareCodePoints } from '../../utils/stable-order.js';
import { readValidArchitecture } from './reader.js';

/** Flat declaration projection: every Element in the model, with hierarchy links. */
export interface SnapshotElement {
  identity: string;
  kind: string;
  definition: string;
  parent: string | null;
  children: string[];
}

/** Nested tree node used by the text/markdown renderers; indentation implies parent. */
export interface SnapshotTreeNode {
  identity: string;
  kind: string;
  definition: string;
  children: SnapshotTreeNode[];
}

export interface SnapshotMetamodel {
  elementKinds: Array<{ identity: string; contract: 'required' | 'optional'; body: string }>;
  relationshipKinds: Array<{ identity: string; body: string }>;
}

export interface ArchitectureSnapshotResult {
  elements: SnapshotElement[];
  relations: Relationship[];
  metamodel: SnapshotMetamodel;
  statistics: {
    elementCount: number;
    relationshipCount: number;
    kindCount: number;
  };
}

export interface SnapshotJson {
  elements: SnapshotElement[];
  relations: Relationship[];
  metamodel: SnapshotMetamodel;
  statistics: ArchitectureSnapshotResult['statistics'];
}

function sortElements(declarations: SnapshotElement[]): SnapshotElement[] {
  return [...declarations].sort((left, right) => compareCodePoints(left.identity, right.identity));
}

/** Builds the nested element tree from a flat declaration list; parents are never repeated. */
function buildTree(elements: readonly SnapshotElement[]): SnapshotTreeNode[] {
  const byId = new Map<string, SnapshotTreeNode>(
    elements.map(element => [element.identity, {
      identity: element.identity,
      kind: element.kind,
      definition: element.definition,
      children: [],
    }]),
  );
  const roots: SnapshotTreeNode[] = [];
  for (const element of elements) {
    const node = byId.get(element.identity)!;
    const parent = element.parent === null ? null : byId.get(element.parent);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRecursive = (nodes: SnapshotTreeNode[]) => {
    nodes.sort((left, right) => compareCodePoints(left.identity, right.identity));
    for (const node of nodes) sortRecursive(node.children);
  };
  sortRecursive(roots);
  return roots;
}

/** Projects every Element Declaration as a flat list with parent/children links. */
export function buildModelTree(model: SemanticModel): SnapshotElement[] {
  const childrenOf = new Map<string, string[]>();
  for (const element of model.elements) {
    const parent = element.declaration.parent;
    if (parent === null) continue;
    childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), element.declaration.identity]);
  }
  for (const list of childrenOf.values()) list.sort(compareCodePoints);

  return sortElements(model.elements.map(element => ({
    identity: element.declaration.identity,
    kind: element.declaration.kind,
    definition: element.declaration.definition,
    parent: element.declaration.parent,
    children: childrenOf.get(element.declaration.identity) ?? [],
  })));
}

const nodeLabel = (node: SnapshotTreeNode): string => `${node.identity} (${node.kind}) | ${node.definition}`;

const renderTextNode = (node: SnapshotTreeNode, prefix: string, isLast: boolean, lines: string[]): void => {
  lines.push(`${prefix}${isLast ? '└── ' : '├── '}${nodeLabel(node)}`);
  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  node.children.forEach((child, index) => renderTextNode(child, childPrefix, index === node.children.length - 1, lines));
};

function renderTreeText(elements: readonly SnapshotElement[]): string {
  const roots = buildTree(elements);
  const lines: string[] = [];
  roots.forEach((root, index) => renderTextNode(root, '', index === roots.length - 1, lines));
  return lines.join('\n');
}

function renderTreeMarkdown(elements: readonly SnapshotElement[]): string {
  const roots = buildTree(elements);
  const lines: string[] = [];
  const walk = (node: SnapshotTreeNode, depth: number) => {
    lines.push(`${'  '.repeat(depth)}- ${nodeLabel(node)}`);
    for (const child of node.children) walk(child, depth + 1);
  };
  for (const root of roots) walk(root, 0);
  return lines.join('\n');
}

function renderRelationsText(relations: readonly Relationship[]): string {
  const byKind = new Map<string, string[]>();
  for (const relation of relations) {
    byKind.set(relation.kind, [...(byKind.get(relation.kind) ?? []), `${relation.source} --> ${relation.target}`]);
  }
  const kinds = [...byKind.keys()].sort(compareCodePoints);
  const lines = ['[relationships]'];
  for (const kind of kinds) {
    lines.push(`${kind}: ${byKind.get(kind)!.join('; ')}`);
  }
  return lines.join('\n');
}

function renderMetamodelText(metamodel: SnapshotMetamodel): string {
  const lines = ['[metamodel]'];
  const elementKinds = [...metamodel.elementKinds].sort((left, right) => compareCodePoints(left.identity, right.identity));
  for (const kind of elementKinds) {
    lines.push(`element-kind: ${kind.identity} (contract: ${kind.contract})${kind.body ? ` — ${kind.body}` : ''}`);
  }
  const relationshipKinds = [...metamodel.relationshipKinds].sort((left, right) => compareCodePoints(left.identity, right.identity));
  for (const kind of relationshipKinds) {
    lines.push(`relationship-kind: ${kind.identity}${kind.body ? ` — ${kind.body}` : ''}`);
  }
  return lines.join('\n');
}

export function formatArchitectureSnapshotText(result: ArchitectureSnapshotResult): string {
  return [
    renderTreeText(result.elements),
    '',
    renderRelationsText(result.relations),
    '',
    renderMetamodelText(result.metamodel),
  ].join('\n');
}

export function formatArchitectureSnapshotMarkdown(result: ArchitectureSnapshotResult): string {
  const relations = renderRelationsText(result.relations)
    .split('\n')
    .map(line => line.startsWith('[') ? `## ${line}` : line)
    .join('\n');
  const metamodel = renderMetamodelText(result.metamodel)
    .split('\n')
    .map(line => line.startsWith('[') ? `## ${line}` : line)
    .join('\n');
  return [renderTreeMarkdown(result.elements), '', relations, '', metamodel].join('\n');
}

export function treeToSnapshotJson(result: ArchitectureSnapshotResult): SnapshotJson {
  return {
    elements: result.elements.map(element => ({ ...element })),
    relations: result.relations,
    metamodel: {
      elementKinds: result.metamodel.elementKinds.map(kind => ({ ...kind })),
      relationshipKinds: result.metamodel.relationshipKinds.map(kind => ({ ...kind })),
    },
    statistics: result.statistics,
  };
}

export async function snapshotArchitecture(
  projectRoot: string,
): Promise<ArchitectureSnapshotResult> {
  const model = await readValidArchitecture(projectRoot);
  if (model.elements.length === 0) {
    throw new Error('Semantic Model unavailable: no Elements found');
  }

  const elements = buildModelTree(model);
  const relations = [...model.relationships].sort((left, right) => compareCodePoints(left.kind, right.kind)
    || compareCodePoints(left.source, right.source)
    || compareCodePoints(left.target, right.target));
  const elementKinds = model.elementKinds.map(kind => ({
    identity: kind.identity,
    contract: kind.contract,
    body: kind.body,
  }));
  const relationshipKinds = model.relationshipKinds.map(kind => ({
    identity: kind.identity,
    body: kind.body,
  }));

  return {
    elements,
    relations,
    metamodel: { elementKinds, relationshipKinds },
    statistics: {
      elementCount: model.elements.length,
      relationshipCount: relations.length,
      kindCount: elementKinds.length + relationshipKinds.length,
    },
  };
}
