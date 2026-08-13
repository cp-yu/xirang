import type { DiagramView } from '@likec4/core/types'
import type {
  XirangDiffOperation,
  XirangElementDeclaration,
  XirangViewSource,
} from './ContractLoaderContext'
import { xirangProjectionMetadata, type XirangRequirementCounts } from './projectionNode'

type ViewNode = DiagramView['nodes'][number]
type ViewEdge = DiagramView['edges'][number]

type KindStyle = {
  shape?: ViewNode['shape']
  color?: ViewNode['color']
  border?: ViewNode['style']['border']
}

const operations = new Set<XirangDiffOperation>(['ADDED', 'MODIFIED', 'REMOVED'])

/** Diff-mode node opacity per operation; unchanged nodes (no operation) dim to 25. */
const diffNodeOpacity: Record<XirangDiffOperation, number> = { ADDED: 100, MODIFIED: 100, REMOVED: 45 }

interface DiffClassification {
  /** element-declaration 操作（last write wins）；只驱动 outline。 */
  elementOperations: Map<string, XirangDiffOperation>
  /** requirement 级变更按宿主聚合计数；scenario/property 不计。 */
  requirementCounts: Map<string, XirangRequirementCounts>
  /** relationship 操作（first write wins）。 */
  relationshipOperations: Map<string, XirangDiffOperation>
  /** 存在 element-declaration 或 relationship 级 entry（不看 operation 合法性）时激活 dimming。 */
  diffActive: boolean
}

/** 单次遍历把 diff entries 分类为 element 操作、requirement 计数与 relationship 操作。 */
function classifyDiffEntries(source: XirangViewSource): DiffClassification {
  const elementOperations = new Map<string, XirangDiffOperation>()
  const requirementCounts = new Map<string, XirangRequirementCounts>()
  const relationshipOperations = new Map<string, XirangDiffOperation>()
  let diffActive = false
  for (const entry of source.diff?.entries ?? []) {
    if (entry.kind === 'element-declaration' || entry.kind === 'relationship') diffActive = true
    if (!operations.has(entry.operation)) continue
    if (entry.kind === 'element-declaration') {
      elementOperations.set(entry.identity, entry.operation)
    } else if (entry.kind === 'relationship') {
      if (!relationshipOperations.has(entry.identity)) {
        relationshipOperations.set(entry.identity, entry.operation)
      }
    } else if (entry.kind === 'requirement') {
      const host = entry.identity.split('#')[0]
      if (!host) continue
      const counts = requirementCounts.get(host) ?? { added: 0, modified: 0, removed: 0 }
      counts[entry.operation.toLowerCase() as 'added' | 'modified' | 'removed'] += 1
      requirementCounts.set(host, counts)
    }
  }
  return { elementOperations, requirementCounts, relationshipOperations, diffActive }
}

function kindStylesByKind(source: XirangViewSource): Map<string, KindStyle> {
  const result = new Map<string, KindStyle>()
  for (const elementKind of source.architecture?.elementKinds ?? []) {
    const presentation = elementKind.nodePresentation
    if (!presentation || result.has(elementKind.identity)) continue
    result.set(elementKind.identity, {
      ...(presentation.shape ? { shape: presentation.shape as ViewNode['shape'] } : {}),
      ...(presentation.color ? { color: presentation.color as ViewNode['color'] } : {}),
      ...(presentation.border ? { border: presentation.border as ViewNode['style']['border'] } : {}),
    })
  }
  return result
}

function nodeIdentity(node: ViewNode): string | undefined {
  const identity = node.metadata?.['elementId']
  return typeof identity === 'string' ? identity : typeof node.modelRef === 'string' ? node.modelRef : node.id
}

function relationshipIdentity(edge: ViewEdge): string[] {
  const edgeWithMetadata = edge as ViewEdge & { xirangRelations?: unknown; metadata?: { xirangRelations?: unknown } }
  const xirangRelations = edgeWithMetadata.xirangRelations ?? edgeWithMetadata.metadata?.xirangRelations
  return Array.isArray(xirangRelations) ? xirangRelations.filter((value): value is string => typeof value === 'string') : []
}

/**
 * Applies Xirang business presentation and diff metadata without changing official layout geometry.
 * The layouted view remains the source of truth for node boxes, edge paths and viewport bounds.
 */
export function applyXirangPresentationOverlay(
  layoutedView: DiagramView,
  source: XirangViewSource,
): DiagramView {
  const { elementOperations, requirementCounts, relationshipOperations, diffActive } = classifyDiffEntries(source)
  const kindStyles = kindStylesByKind(source)
  const elementsByIdentity = new Map<string, XirangElementDeclaration>()
  const parentIdentities = new Set<string>()
  for (const element of source.architecture?.elements ?? []) {
    if (!elementsByIdentity.has(element.declaration.identity)) {
      elementsByIdentity.set(element.declaration.identity, element.declaration)
    }
    if (element.declaration.parent !== null) parentIdentities.add(element.declaration.parent)
  }
  const nodes = layoutedView.nodes.map(node => {
    const identity = nodeIdentity(node)
    const declaration = identity ? elementsByIdentity.get(identity) : undefined
    const style = declaration ? kindStyles.get(declaration.kind) : undefined
    const operation = identity ? elementOperations.get(identity) : undefined
    const counts = identity ? requirementCounts.get(identity) : undefined
    const hasSemanticChildren = identity ? parentIdentities.has(identity) : false
    const hasCounts = counts !== undefined && (counts.added > 0 || counts.modified > 0 || counts.removed > 0)
    const metadata = {
      ...(node.metadata ?? {}),
      ...(identity ? { elementId: identity } : {}),
      ...(identity && (operation || hasCounts)
        ? xirangProjectionMetadata(identity, operation, hasSemanticChildren, counts)
        : {}),
    }
    return {
      ...node,
      ...(style?.shape ? { shape: style.shape } : {}),
      ...(style?.color ? { color: style.color } : {}),
      style: {
        ...node.style,
        ...(style?.border ? { border: style.border } : {}),
        ...(diffActive ? { opacity: operation ? diffNodeOpacity[operation] : 25 } : {}),
      },
      metadata,
    } as ViewNode
  })

  const edges = layoutedView.edges.map(edge => {
    const triples = relationshipIdentity(edge)
    const relationshipOperation = triples
      .map(identity => relationshipOperations.get(identity))
      .find((operation): operation is XirangDiffOperation => operation !== undefined)
    return {
      ...edge,
      ...(diffActive && !relationshipOperation ? { style: { opacity: 25 } } : {}),
      metadata: {
        ...((edge as ViewEdge & { metadata?: Readonly<Record<string, unknown>> }).metadata ?? {}),
        ...(triples.length > 0 ? { xirangRelations: triples } : {}),
        ...(triples.length === 1 ? { xirangRelation: triples[0] } : {}),
        ...(relationshipOperation ? { xirangOperation: relationshipOperation } : {}),
      },
    } as ViewEdge
  })

  return { ...layoutedView, nodes, edges }
}

/**
 * Expands a layouted edge carrying Xirang relation identities into independent visual edges.
 * Geometry is reused from the official path; identity, metadata and click targets remain
 * independent so reciprocal and same-direction relationships cannot be merged semantically.
 * Kind presentation is applied to every relation edge, including single-relation edges, because
 * the generator no longer lowers relationship styles into specification.c4.
 */
export function expandXirangRelationshipEdges(
  layoutedView: DiagramView,
  source?: XirangViewSource,
): DiagramView {
  const relationshipKinds = new Map((source?.architecture?.relationshipKinds ?? [])
    .map(kind => [kind.identity, kind.presentation] as const))
  const edges = layoutedView.edges.flatMap(edge => {
    const triples = relationshipIdentity(edge)
    if (triples.length === 0) return [edge]
    const single = triples.length === 1
    return triples.map((triple, index) => {
      const kind = triple.split('|')[1]
      const presentation = kind ? relationshipKinds.get(kind) : undefined
      return {
        ...edge,
        id: single ? edge.id : `${edge.id}:xirang:${index}:${triple}`,
        label: single ? (edge.label ?? kind) : (kind ?? edge.label),
        ...(presentation?.color ? { color: presentation.color } : {}),
        ...(presentation?.line ? { line: presentation.line } : {}),
        ...(presentation?.head ? { head: presentation.head } : {}),
        ...(presentation?.tail ? { tail: presentation.tail } : {}),
        metadata: {
          ...((edge as ViewEdge & { metadata?: Readonly<Record<string, unknown>> }).metadata ?? {}),
          ...(single ? {} : { xirangRelation: triple }),
        },
        xirangRelations: [triple],
      } as unknown as ViewEdge
    })
  })
  const changed = edges.length !== layoutedView.edges.length
    || edges.some((edge, index) => edge !== layoutedView.edges[index])
  return changed ? { ...layoutedView, edges } : layoutedView
}
