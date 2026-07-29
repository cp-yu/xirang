import type { DiagramView } from '@likec4/core/types'
import {
  type XirangDiffEntry,
  type XirangDiffKind,
  type XirangDiffOperation,
  type XirangElementDeclaration,
  type XirangRelationship,
  type XirangRuntimeVariant,
  xirangVariantRevision,
} from './ContractLoaderContext'

type ViewNode = DiagramView['nodes'][number]
type ViewEdge = DiagramView['edges'][number]

const operationColor: Record<XirangDiffOperation, ViewNode['color']> = {
  ADDED: 'green',
  MODIFIED: 'amber',
  REMOVED: 'red',
}

/** Structural entity types; Contract entries (`requirement`, `scenario`) never reach the view. */
const structuralKinds: ReadonlySet<XirangDiffKind> = new Set([
  'element-declaration',
  'element-kind',
  'relationship-kind',
  'authored-view',
  'relationship',
])

function structuralEntries(variant: XirangRuntimeVariant): XirangDiffEntry[] {
  return variant.diff?.entries.filter(entry => structuralKinds.has(entry.kind)) ?? []
}

function asDeclaration(value: unknown): XirangElementDeclaration | undefined {
  if (!value || typeof value !== 'object') return undefined
  const declaration = value as Partial<XirangElementDeclaration>
  return typeof declaration.identity === 'string' ? declaration as XirangElementDeclaration : undefined
}

function asRelationship(value: unknown): XirangRelationship | undefined {
  if (!value || typeof value !== 'object') return undefined
  const relationship = value as Partial<XirangRelationship>
  return typeof relationship.source === 'string' && typeof relationship.kind === 'string'
      && typeof relationship.target === 'string'
    ? relationship as XirangRelationship
    : undefined
}

function relationshipId(relationship: XirangRelationship): string {
  return `${relationship.source}|${relationship.kind}|${relationship.target}`
}

function center(node: ViewNode): [number, number] {
  return [node.x + node.width / 2, node.y + node.height / 2]
}

function bounds(nodes: ViewNode[], fallback: DiagramView['bounds']): DiagramView['bounds'] {
  if (nodes.length === 0) return fallback
  const minX = Math.min(...nodes.map(node => node.x))
  const minY = Math.min(...nodes.map(node => node.y))
  const maxX = Math.max(...nodes.map(node => node.x + node.width))
  const maxY = Math.max(...nodes.map(node => node.y + node.height))
  return { x: minX - 10, y: minY - 10, width: maxX - minX + 20, height: maxY - minY + 20 }
}

type Geometry = Pick<ViewNode, 'x' | 'y' | 'width' | 'height'>

function gridGeometry(index: number): Geometry {
  return {
    x: 40 + (index % 4) * 360,
    y: 40 + Math.floor(index / 4) * 230,
    width: 320,
    height: 180,
  }
}

function createNode(
  declaration: XirangElementDeclaration,
  parent: string | null,
  geometry: Geometry,
  operation?: XirangDiffOperation,
): ViewNode {
  return {
    id: declaration.identity,
    modelRef: declaration.identity,
    parent,
    level: parent ? 1 : 0,
    children: [],
    inEdges: [],
    outEdges: [],
    title: declaration.title,
    description: { txt: declaration.summary },
    metadata: { elementId: declaration.identity, definition: declaration.description },
    shape: 'rectangle',
    color: operation ? operationColor[operation] : 'primary',
    style: { opacity: 15, size: 'md' },
    kind: 'el',
    ...geometry,
  } as unknown as ViewNode
}

function createEdge(
  relationship: XirangRelationship,
  source: ViewNode,
  target: ViewNode,
  operation?: XirangDiffOperation,
): ViewEdge {
  return {
    id: `xirang:${relationshipId(relationship)}`,
    source: source.id,
    target: target.id,
    label: relationship.kind,
    points: [center(source), center(target)],
    parent: null,
    relations: [],
    color: operation ? operationColor[operation] : 'gray',
    line: 'solid',
    head: 'normal',
  } as unknown as ViewEdge
}

/**
 * Identity is the only alignment key: node ids, parents and edge endpoints are all identities.
 * The formal DiagramView is consulted for geometry alone, keyed by the `elementId` metadata the
 * generator anchors on each element; a miss falls back to the grid and is not a diagnostic.
 */
export function materializeXirangArchitectureView(
  formal: DiagramView,
  variant: XirangRuntimeVariant,
  mode: 'full' | 'diff',
): DiagramView {
  const architecture = variant.architecture
  if (variant.kind !== 'change' || !architecture) return formal

  const entries = structuralEntries(variant)
  if (entries.length === 0) return formal
  const declarationEntries = new Map(
    entries.filter(entry => entry.kind === 'element-declaration').map(entry => [entry.identity, entry]),
  )
  const relationshipEntries = new Map(
    entries.filter(entry => entry.kind === 'relationship').map(entry => [entry.identity, entry]),
  )
  const declarations = new Map(architecture.elements.map(element => [element.declaration.identity, element.declaration]))
  for (const entry of declarationEntries.values()) {
    const removed = asDeclaration(entry.before)
    if (entry.operation === 'REMOVED' && removed) declarations.set(removed.identity, removed)
  }

  const visible = new Set<string>()
  if (mode === 'full') {
    for (const element of architecture.elements) visible.add(element.declaration.identity)
  } else {
    for (const entry of entries) {
      if (entry.kind === 'element-declaration') visible.add(entry.identity)
      if (entry.kind === 'relationship') {
        const relationship = asRelationship(entry.after) ?? asRelationship(entry.before)
        if (relationship) {
          visible.add(relationship.source)
          visible.add(relationship.target)
        }
      }
    }
    for (const identity of [...visible]) {
      let parent = declarations.get(identity)?.parent ?? null
      while (parent) {
        visible.add(parent)
        parent = declarations.get(parent)?.parent ?? null
      }
    }
  }

  const visibleDeclarations = [...declarations.values()].filter(declaration => visible.has(declaration.identity))
  const visibleIdentities = new Set(visibleDeclarations.map(declaration => declaration.identity))
  const formalGeometry = new Map<string, Geometry>(
    formal.nodes.flatMap(node =>
      typeof node.metadata?.['elementId'] === 'string'
        ? [[node.metadata['elementId'], { x: node.x, y: node.y, width: node.width, height: node.height }] as const]
        : []
    ),
  )
  const nodes = visibleDeclarations.map((declaration, index) => {
    const parent = declaration.parent && visibleIdentities.has(declaration.parent) ? declaration.parent : null
    return createNode(
      declaration,
      parent,
      formalGeometry.get(declaration.identity) ?? gridGeometry(index),
      declarationEntries.get(declaration.identity)?.operation,
    )
  })
  const nodesById = new Map<string, ViewNode>(nodes.map(node => [node.id, node]))

  const targetRelationships = mode === 'full'
    ? architecture.relationships
    : [...relationshipEntries.values()]
      .map(entry => asRelationship(entry.after) ?? asRelationship(entry.before))
      .filter((relationship): relationship is XirangRelationship => relationship !== undefined)
  const formalEdges = new Map(formal.edges.map(edge => [`${edge.source}|${edge.target}`, edge]))
  const edges = targetRelationships.flatMap(relationship => {
    const source = nodesById.get(relationship.source)
    const target = nodesById.get(relationship.target)
    if (!source || !target) return []
    const operation = relationshipEntries.get(relationshipId(relationship))?.operation
    const existing = formalEdges.get(`${relationship.source}|${relationship.target}`)
    return [{
      ...(existing ?? createEdge(relationship, source, target, operation)),
      color: operation ? operationColor[operation] : existing?.color ?? 'gray',
      label: existing?.label ?? relationship.kind,
    } as unknown as ViewEdge]
  })

  const childrenByParent = new Map<string, ViewNode['children']>()
  const inEdgesByNode = new Map<string, ViewNode['inEdges']>()
  const outEdgesByNode = new Map<string, ViewNode['outEdges']>()
  for (const node of nodes) {
    if (!node.parent || !nodesById.has(node.parent)) continue
    const children = childrenByParent.get(node.parent) ?? []
    children.push(node.id)
    childrenByParent.set(node.parent, children)
  }
  for (const edge of edges) {
    const incoming = inEdgesByNode.get(edge.target) ?? []
    incoming.push(edge.id)
    inEdgesByNode.set(edge.target, incoming)
    const outgoing = outEdgesByNode.get(edge.source) ?? []
    outgoing.push(edge.id)
    outEdgesByNode.set(edge.source, outgoing)
  }
  for (const node of nodes) {
    node.children = childrenByParent.get(node.id) ?? []
    node.inEdges = inEdgesByNode.get(node.id) ?? []
    node.outEdges = outEdgesByNode.get(node.id) ?? []
  }

  return {
    ...formal,
    hash: `${formal.hash}:xirang:${xirangVariantRevision(variant)}:${mode}`,
    nodes,
    edges,
    bounds: bounds(nodes, formal.bounds),
  } as DiagramView
}
