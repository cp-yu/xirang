import type { DiagramView } from '@likec4/core/types'
import type { XirangDiffEntry, XirangDiffOperation, XirangRuntimeVariant } from './SpecLoaderContext'

type ViewNode = DiagramView['nodes'][number]
type ViewEdge = DiagramView['edges'][number]
type Architecture = NonNullable<XirangRuntimeVariant['architecture']>
type ArchitectureElement = Architecture['elements'][number]
type ArchitectureRelation = Architecture['relations'][number]

const operationColor: Record<XirangDiffOperation, ViewNode['color']> = {
  ADDED: 'green',
  MODIFIED: 'amber',
  REMOVED: 'red',
}

function architectureEntries(variant: XirangRuntimeVariant): XirangDiffEntry[] {
  return variant.diff?.entries.filter(entry => entry.scope === 'architecture') ?? []
}

function asElement(value: unknown): ArchitectureElement | undefined {
  if (!value || typeof value !== 'object') return undefined
  const element = value as Partial<ArchitectureElement>
  return typeof element.id === 'string' && typeof element.fqn === 'string' ? element as ArchitectureElement : undefined
}

function asRelation(value: unknown): ArchitectureRelation | undefined {
  if (!value || typeof value !== 'object') return undefined
  const relation = value as Partial<ArchitectureRelation>
  return typeof relation.source === 'string' && typeof relation.kind === 'string' && typeof relation.target === 'string'
    ? relation as ArchitectureRelation
    : undefined
}

function relationId(relation: ArchitectureRelation): string {
  return `${relation.source}|${relation.kind}|${relation.target}`
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

function createNode(
  element: ArchitectureElement,
  parentFqn: string | null,
  index: number,
  operation?: XirangDiffOperation,
): ViewNode {
  return {
    id: element.fqn,
    modelRef: element.fqn,
    parent: parentFqn,
    level: parentFqn ? 1 : 0,
    children: [],
    inEdges: [],
    outEdges: [],
    title: element.title,
    description: { txt: element.summary },
    shape: 'rectangle',
    color: operation ? operationColor[operation] : 'primary',
    style: { opacity: 15, size: 'md' },
    kind: 'el',
    x: 40 + (index % 4) * 360,
    y: 40 + Math.floor(index / 4) * 230,
    width: 320,
    height: 180,
  } as unknown as ViewNode
}

function createEdge(
  relation: ArchitectureRelation,
  source: ViewNode,
  target: ViewNode,
  operation?: XirangDiffOperation,
): ViewEdge {
  return {
    id: `xirang:${relationId(relation)}`,
    source: source.id,
    target: target.id,
    label: relation.kind,
    points: [center(source), center(target)],
    parent: null,
    relations: [],
    color: operation ? operationColor[operation] : 'gray',
    line: 'solid',
    head: 'normal',
  } as unknown as ViewEdge
}

export function materializeXirangArchitectureView(
  formal: DiagramView,
  variant: XirangRuntimeVariant,
  mode: 'full' | 'diff',
): DiagramView {
  const architecture = variant.architecture
  if (variant.kind !== 'change' || !architecture) return formal

  const entries = architectureEntries(variant)
  if (entries.length === 0) return formal
  const elementEntries = new Map(entries.filter(entry => entry.kind === 'element').map(entry => [entry.identity, entry]))
  const relationEntries = new Map(entries.filter(entry => entry.kind === 'relationship').map(entry => [entry.identity, entry]))
  const elements = new Map(architecture.elements.map(element => [element.id, element]))
  for (const entry of elementEntries.values()) {
    const removed = asElement(entry.before)
    if (entry.operation === 'REMOVED' && removed) elements.set(removed.id, removed)
  }

  const visible = new Set<string>()
  if (mode === 'full') {
    for (const element of architecture.elements) visible.add(element.id)
  } else {
    for (const entry of entries) {
      if (entry.kind === 'element') visible.add(entry.identity)
      if (entry.kind === 'relationship') {
        const relation = asRelation(entry.after) ?? asRelation(entry.before)
        if (relation) {
          visible.add(relation.source)
          visible.add(relation.target)
        }
      }
    }
    for (const identity of [...visible]) {
      let parent = elements.get(identity)?.parent ?? null
      while (parent) {
        visible.add(parent)
        parent = elements.get(parent)?.parent ?? null
      }
    }
  }

  const visibleElements = [...elements.values()].filter(element => visible.has(element.id))
  const byFqn = new Map(visibleElements.map(element => [element.fqn, element]))
  const formalNodes = new Map<string, ViewNode>(formal.nodes.flatMap(node => node.modelRef ? [[node.modelRef, node]] : []))
  const nodes = visibleElements.map((element, index) => {
    const parentFqn = element.parent ? elements.get(element.parent)?.fqn ?? null : null
    const operation = elementEntries.get(element.id)?.operation
    const existing = formalNodes.get(element.fqn)
    if (!existing) return createNode(element, parentFqn, index, operation)
    return {
      ...existing,
      parent: parentFqn && byFqn.has(parentFqn) ? parentFqn : null,
      title: element.title,
      description: { txt: element.summary },
      color: operation ? operationColor[operation] : existing.color,
      children: [],
      inEdges: [],
      outEdges: [],
    } as unknown as ViewNode
  })
  const nodesById = new Map<string, ViewNode>(nodes.map(node => [node.id, node]))

  const targetRelations = mode === 'full'
    ? architecture.relations
    : [...relationEntries.values()]
      .map(entry => asRelation(entry.after) ?? asRelation(entry.before))
      .filter((relation): relation is ArchitectureRelation => relation !== undefined)
  const formalEdges = new Map(formal.edges.map(edge => [`${edge.source}|${edge.target}`, edge]))
  const edges = targetRelations.flatMap(relation => {
    const sourceFqn = elements.get(relation.source)?.fqn
    const targetFqn = elements.get(relation.target)?.fqn
    if (!sourceFqn || !targetFqn) return []
    const source = nodesById.get(sourceFqn)
    const target = nodesById.get(targetFqn)
    if (!source || !target) return []
    const operation = relationEntries.get(relationId(relation))?.operation
    const existing = formalEdges.get(`${sourceFqn}|${targetFqn}`)
    return [{
      ...(existing ?? createEdge(relation, source, target, operation)),
      color: operation ? operationColor[operation] : existing?.color ?? 'gray',
      label: existing?.label ?? relation.kind,
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
    hash: `${formal.hash}:xirang:${variant.architectureFingerprint ?? variant.id}:${mode}`,
    nodes,
    edges,
    bounds: bounds(nodes, formal.bounds),
  } as DiagramView
}
