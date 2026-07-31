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

const LEAF_WIDTH = 320
const LEAF_HEIGHT = 180
const CELL_GAP = 40
const GRID_COLUMNS = 4
const ORIGIN = 40
/** Room for the container's own title above its children. */
const CONTAINER_HEADER = 60
const CONTAINER_PADDING = 40

type Size = { width: number; height: number }

/**
 * The focus always shows its direct children; a deeper level is visible only when every ancestor up
 * to the focus is expanded. Expansion is a view-wide set, so identities outside the focus subtree
 * are simply never reached.
 */
type VisibleNode = { identity: string; children: VisibleNode[] }

function visibleTree(
  identity: string,
  declarationChildren: Map<string, string[]>,
  expandedNodes: ReadonlySet<string>,
  isFocus: boolean,
): VisibleNode {
  const children = isFocus || expandedNodes.has(identity)
    ? (declarationChildren.get(identity) ?? [])
      .map(child => visibleTree(child, declarationChildren, expandedNodes, false))
    : []
  return { identity, children }
}

type Measured = { node: VisibleNode; size: Size; rows: Measured[][] }

/**
 * Leaves pack into a grid row; an expanded child is a container of unpredictable size, so it takes a
 * row of its own instead of being packed against leaves.
 */
function packRows(children: readonly Measured[]): Measured[][] {
  const rows: Measured[][] = []
  let row: Measured[] = []
  for (const child of children) {
    if (child.rows.length > 0) {
      if (row.length > 0) rows.push(row)
      row = []
      rows.push([child])
      continue
    }
    row.push(child)
    if (row.length === GRID_COLUMNS) {
      rows.push(row)
      row = []
    }
  }
  if (row.length > 0) rows.push(row)
  return rows
}

/**
 * `parent` makes LikeC4 render a node inside its container, so every container geometry must
 * actually enclose the rows beneath it. A flat grid shared by focus and children renders the focus
 * as one more same-sized cell instead of a boundary, and sizes are measured bottom-up because a
 * container's extent depends on how deep its own expanded subtree runs.
 */
function measure(node: VisibleNode): Measured {
  if (node.children.length === 0) {
    return { node, size: { width: LEAF_WIDTH, height: LEAF_HEIGHT }, rows: [] }
  }
  const rows = packRows(node.children.map(measure))
  let contentWidth = 0
  let contentHeight = 0
  rows.forEach((row, index) => {
    const rowWidth = row.reduce((sum, item) => sum + item.size.width, 0) + (row.length - 1) * CELL_GAP
    contentWidth = Math.max(contentWidth, rowWidth)
    contentHeight += Math.max(...row.map(item => item.size.height)) + (index > 0 ? CELL_GAP : 0)
  })
  return {
    node,
    size: {
      width: contentWidth + CONTAINER_PADDING * 2,
      height: CONTAINER_HEADER + contentHeight + CONTAINER_PADDING,
    },
    rows,
  }
}

/** Geometry is absolute at every level; the header offset is what keeps a container's title clear. */
function place(measured: Measured, x: number, y: number, into: Map<string, Geometry>): void {
  into.set(measured.node.identity, { x, y, ...measured.size })
  let cursorY = y + CONTAINER_HEADER
  for (const row of measured.rows) {
    let cursorX = x + CONTAINER_PADDING
    for (const item of row) {
      place(item, cursorX, cursorY, into)
      cursorX += item.size.width + CELL_GAP
    }
    cursorY += Math.max(...row.map(item => item.size.height)) + CELL_GAP
  }
}

/**
 * Perspectives need a shape that reads as a distinct boundary without fixed decoration: LikeC4's
 * `component` draws two rects offset outside the node's left edge with their own stroke color, which
 * neither respects the Perspective color nor survives being used as a focus container.
 */
const PERSPECTIVE_SHAPE = 'document' as const

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
  expandedNodes: ReadonlySet<string> = new Set(),
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

  const declarationChildren = new Map<string, string[]>()
  for (const declaration of declarations.values()) {
    if (!declaration.parent) continue
    const children = declarationChildren.get(declaration.parent) ?? []
    children.push(declaration.identity)
    declarationChildren.set(declaration.parent, children)
  }

  const layout = measure(visibleTree(focus, declarationChildren, expandedNodes, true))
  const geometries = new Map<string, Geometry>()
  place(layout, ORIGIN, ORIGIN, geometries)

  const visibleDeclarations = [...declarations.values()]
    .filter(declaration => geometries.has(declaration.identity))
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

  const nodes = visibleDeclarations.map(declaration => {
    const modelNode = modelNodes.get(declaration.identity)
    const presentation = declaration.kind === 'perspective'
      ? {
          shape: PERSPECTIVE_SHAPE,
          color: perspectiveColors.get(declaration.identity) ?? 'primary' as const,
          modelRef: modelNode?.modelRef,
        }
      : modelNode ? { shape: modelNode.shape, color: modelNode.color, modelRef: modelNode.modelRef } : undefined
    return createNode(
      declaration,
      declaration.identity === focus ? null : declaration.parent,
      geometries.get(declaration.identity)!,
      declarationEntries.get(declaration.identity)?.operation,
      presentation,
    )
  })
  const nodesById = new Map<string, ViewNode>(nodes.map(node => [node.id, node]))

  /**
   * Every endpoint resolves to its deepest visible ancestor-or-self, so expanding a container moves
   * its relationships from the container down onto the newly visible descendants. Pre-order keeps
   * the deeper assignment last.
   */
  const endpointByIdentity = new Map<string, string>()
  const assignEndpoints = (visible: VisibleNode): void => {
    const stack = [visible.identity]
    const seen = new Set<string>()
    while (stack.length > 0) {
      const identity = stack.pop()!
      if (seen.has(identity)) continue
      seen.add(identity)
      endpointByIdentity.set(identity, visible.identity)
      for (const child of declarationChildren.get(identity) ?? []) stack.push(child)
    }
    for (const child of visible.children) assignEndpoints(child)
  }
  assignEndpoints(layout.node)

  const targetRelationships = mode === 'full'
    ? architecture.relationships
    : [...relationshipEntries.values()]
      .map(entry => asRelationship(entry.after) ?? asRelationship(entry.before))
      .filter((relationship): relationship is XirangRelationship => relationship !== undefined)
  const aggregate = new Map<string, {
    source: string
    target: string
    kinds: Set<string>
    relations: Set<string>
    triples: Set<string>
    operation: XirangDiffOperation | undefined
  }>()
  for (const relationship of targetRelationships) {
    const mappedSource = endpointByIdentity.get(relationship.source)
    const mappedTarget = endpointByIdentity.get(relationship.target)
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
