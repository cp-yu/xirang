import type { DiagramView } from '@likec4/core/types'
import {
  type XirangDiffEntry,
  type XirangDiffKind,
  type XirangDiffOperation,
  type XirangElementDeclaration,
  type XirangRelationship,
  type XirangViewSource,
  xirangViewSourceRevision,
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

function structuralEntries(source: XirangViewSource): XirangDiffEntry[] {
  return source.diff?.entries.filter(entry => structuralKinds.has(entry.kind)) ?? []
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

const encoder = new TextEncoder()

function compareUtf8Bytes(left: string, right: string): number {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  const length = Math.min(a.length, b.length)
  for (let index = 0; index < length; index++) {
    if (a[index] !== b[index]) return a[index]! - b[index]!
  }
  return a.length - b.length
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

function perspectiveColor(index: number): ViewNode['color'] {
  const hue = (index * 137.508) % 360
  const saturation = 68
  const lightness = 30
  const chroma = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100
  const segment = hue / 60
  const secondary = chroma * (1 - Math.abs(segment % 2 - 1))
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
    : segment < 3 ? [0, chroma, secondary]
    : segment < 4 ? [0, secondary, chroma]
    : segment < 5 ? [secondary, 0, chroma]
    : [chroma, 0, secondary]
  const match = lightness / 100 - chroma / 2
  return `#${[red, green, blue]
    .map(channel => Math.round((channel + match) * 255).toString(16).padStart(2, '0'))
    .join('')}` as ViewNode['color']
}

function createNode(
  declaration: XirangElementDeclaration,
  parent: string | null,
  geometry: Geometry,
  operation?: XirangDiffOperation,
  presentation?: { shape: ViewNode['shape']; color: ViewNode['color']; modelRef?: ViewNode['modelRef'] },
): ViewNode {
  return {
    id: declaration.identity,
    modelRef: presentation?.modelRef ?? declaration.identity,
    parent,
    level: parent ? 1 : 0,
    children: [],
    inEdges: [],
    outEdges: [],
    title: declaration.title,
    description: { txt: declaration.summary },
    metadata: { elementId: declaration.identity, definition: declaration.description },
    shape: presentation?.shape ?? 'rectangle',
    color: operation ? operationColor[operation] : presentation?.color ?? 'primary',
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
  const [startX, startY] = center(source)
  const [endX, endY] = center(target)
  const controlOffset = (endX - startX) / 3
  return {
    id: `xirang:${relationshipId(relationship)}`,
    source: source.id,
    target: target.id,
    label: relationship.kind,
    points: [
      [startX, startY],
      [startX + controlOffset, startY],
      [endX - controlOffset, endY],
      [endX, endY],
    ],
    controlPoints: [{ x: (startX + endX) / 2, y: (startY + endY) / 2 }],
    parent: null,
    relations: [],
    color: operation ? operationColor[operation] : 'gray',
    line: 'solid',
    head: 'normal',
  } as unknown as ViewEdge
}

/**
 * Identity is the only alignment key: node ids, parents and edge endpoints are all identities.
 * The Model View DiagramView is consulted for geometry alone, keyed by the `elementId` metadata the
 * generator anchors on each element; a miss falls back to the grid and is not a diagnostic.
 */
export function materializeXirangArchitectureView(
  modelView: DiagramView,
  source: XirangViewSource,
  mode: 'full' | 'diff',
  focusIdentity?: string,
  previousAncestorPath: readonly string[] = [],
): DiagramView {
  const architecture = source.architecture
  if (!architecture) return modelView

  const entries = structuralEntries(source)
  const declarationEntries = new Map(
    entries.filter(entry => entry.kind === 'element-declaration').map(entry => [entry.identity, entry]),
  )
  const relationshipEntries = new Map(
    entries.filter(entry => entry.kind === 'relationship').map(entry => [entry.identity, entry]),
  )
  const declarations = new Map(architecture.elements.map(element => [element.declaration.identity, element.declaration]))
  if (mode === 'diff') {
    for (const entry of declarationEntries.values()) {
      const removed = asDeclaration(entry.before)
      if (entry.operation === 'REMOVED' && removed) declarations.set(removed.identity, removed)
    }
  }

  const root = [...declarations.values()]
    .filter(declaration => declaration.parent === null)
    .sort((left, right) => compareUtf8Bytes(left.identity, right.identity))[0]
  const focus = [focusIdentity, ...previousAncestorPath, root?.identity]
    .find((identity): identity is string => identity !== undefined && declarations.has(identity))
  if (!focus) return modelView

  const visibleDeclarations = [...declarations.values()]
    .filter(declaration => declaration.identity === focus || declaration.parent === focus)
  const perspectives = visibleDeclarations
    .filter(declaration => declaration.kind === 'perspective')
    .map(declaration => declaration.identity)
    .sort(compareUtf8Bytes)
  const perspectiveColors = new Map(perspectives.map((identity, index) => [identity, perspectiveColor(index)]))
  const modelNodes = new Map(modelView.nodes.flatMap(node =>
    typeof node.metadata?.['elementId'] === 'string' ? [[node.metadata['elementId'], node] as const] : []))
  const identityByNodeId = new Map([...modelNodes].map(([identity, node]) => [node.id, identity]))
  const relationIdsByTriple = new Map<string, string[]>()
  for (const edge of modelView.edges) {
    const sourceIdentity = identityByNodeId.get(edge.source)
    const targetIdentity = identityByNodeId.get(edge.target)
    if (!sourceIdentity || !targetIdentity || !edge.label) continue
    for (const kind of edge.label.split(',').map(value => value.trim()).filter(Boolean)) {
      const triple = `${sourceIdentity}|${kind}|${targetIdentity}`
      relationIdsByTriple.set(triple, [...edge.relations])
    }
  }

  const nodes = visibleDeclarations.map((declaration, index) => {
    const parent = declaration.identity !== focus && declaration.parent === focus ? focus : null
    const modelNode = modelNodes.get(declaration.identity)
    const presentation = declaration.kind === 'perspective'
      ? {
          shape: 'component' as const,
          color: perspectiveColors.get(declaration.identity) ?? 'primary' as const,
          modelRef: modelNode?.modelRef,
        }
      : modelNode ? { shape: modelNode.shape, color: modelNode.color, modelRef: modelNode.modelRef } : undefined
    return createNode(
      declaration,
      parent,
      gridGeometry(index),
      declarationEntries.get(declaration.identity)?.operation,
      presentation,
    )
  })
  const nodesById = new Map<string, ViewNode>(nodes.map(node => [node.id, node]))

  const targetRelationships = mode === 'full'
    ? architecture.relationships
    : [...relationshipEntries.values()]
      .map(entry => asRelationship(entry.after) ?? asRelationship(entry.before))
      .filter((relationship): relationship is XirangRelationship => relationship !== undefined)
  const mapEndpoint = (identity: string): string | undefined => {
    if (identity === focus) return focus
    let current = declarations.get(identity)
    while (current?.parent) {
      if (current.parent === focus) return current.identity
      current = declarations.get(current.parent)
    }
    return undefined
  }
  const aggregate = new Map<string, {
    source: string
    target: string
    kinds: Set<string>
    relations: Set<string>
    triples: Set<string>
    operation: XirangDiffOperation | undefined
  }>()
  for (const relationship of targetRelationships) {
    const mappedSource = mapEndpoint(relationship.source)
    const mappedTarget = mapEndpoint(relationship.target)
    if (!mappedSource || !mappedTarget || mappedSource === mappedTarget) continue
    const key = `${mappedSource}|${mappedTarget}`
    const current = aggregate.get(key) ?? {
      source: mappedSource,
      target: mappedTarget,
      kinds: new Set<string>(),
      relations: new Set<string>(),
      triples: new Set<string>(),
      operation: undefined,
    }
    current.kinds.add(relationship.kind)
    const triple = relationshipId(relationship)
    current.triples.add(triple)
    for (const relationId of relationIdsByTriple.get(triple) ?? []) {
      current.relations.add(relationId)
    }
    current.operation ??= relationshipEntries.get(relationshipId(relationship))?.operation
    aggregate.set(key, current)
  }
  const edges = [...aggregate.values()]
    .sort((left, right) => compareUtf8Bytes(left.source, right.source) || compareUtf8Bytes(left.target, right.target))
    .flatMap(item => {
      const edgeSource = nodesById.get(item.source)
      const edgeTarget = nodesById.get(item.target)
      if (!edgeSource || !edgeTarget) return []
      const kinds = [...item.kinds].sort(compareUtf8Bytes)
      const relationship = { source: item.source, kind: kinds[0]!, target: item.target }
      return [{
        ...createEdge(relationship, edgeSource, edgeTarget, item.operation),
        label: kinds.join(', '),
        relations: [...item.relations].sort(compareUtf8Bytes),
        xirangRelations: [...item.triples].sort(compareUtf8Bytes),
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
    ...modelView,
    hash: `${modelView.hash}:xirang:${xirangViewSourceRevision(source)}:${mode}`,
    nodes,
    edges,
    bounds: bounds(nodes, modelView.bounds),
  } as DiagramView
}
