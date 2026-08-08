import type { DiagramView } from '@likec4/core/types'
import type {
  XirangDiffEntry,
  XirangDiffOperation,
  XirangElementDeclaration,
  XirangViewSource,
} from './ContractLoaderContext'
import { xirangProjectionMetadata } from './projectionNode'

type ViewNode = DiagramView['nodes'][number]
type ViewEdge = DiagramView['edges'][number]

type KindStyle = {
  shape?: ViewNode['shape']
  color?: ViewNode['color']
  border?: ViewNode['style']['border']
}

const structuralKinds = new Set([
  'element-declaration',
  'element-kind',
  'relationship-kind',
  'authored-view',
  'relationship',
])

const operations = new Set<XirangDiffOperation>(['ADDED', 'MODIFIED', 'REMOVED'])

function structuralEntries(source: XirangViewSource): XirangDiffEntry[] {
  return source.diff?.entries.filter(entry => structuralKinds.has(entry.kind)) ?? []
}

function operationByIdentity(source: XirangViewSource): Map<string, XirangDiffOperation> {
  const result = new Map<string, XirangDiffOperation>()
  for (const entry of structuralEntries(source)) {
    if (entry.kind === 'element-declaration' && operations.has(entry.operation)) {
      result.set(entry.identity, entry.operation)
    }
  }
  return result
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
  const xirangRelations = (edge as ViewEdge & { xirangRelations?: unknown }).xirangRelations
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
  const elementOperations = operationByIdentity(source)
  const kindStyles = kindStylesByKind(source)
  const nodes = layoutedView.nodes.map(node => {
    const identity = nodeIdentity(node)
    const declaration = source.architecture?.elements
      .find(element => element.declaration.identity === identity)?.declaration as XirangElementDeclaration | undefined
    const style = declaration ? kindStyles.get(declaration.kind) : undefined
    const operation = identity ? elementOperations.get(identity) : undefined
    const hasSemanticChildren = source.architecture?.elements.some(element => element.declaration.parent === identity) ?? false
    const metadata = {
      ...(node.metadata ?? {}),
      ...(identity ? { elementId: identity } : {}),
      ...(operation ? xirangProjectionMetadata(identity!, operation, hasSemanticChildren) : {}),
    }
    return {
      ...node,
      ...(style?.shape ? { shape: style.shape } : {}),
      ...(style?.color ? { color: style.color } : {}),
      style: {
        ...node.style,
        ...(style?.border ? { border: style.border } : {}),
        ...(operation === 'REMOVED' ? { opacity: Math.min(node.style.opacity ?? 100, 45) } : {}),
      },
      metadata,
    } as ViewNode
  })

  const edges = layoutedView.edges.map(edge => {
    const triples = relationshipIdentity(edge)
    const relationshipOperation = triples
      .map(identity => structuralEntries(source).find(entry => entry.kind === 'relationship' && entry.identity === identity)?.operation)
      .find((operation): operation is XirangDiffOperation => operation !== undefined)
    return {
      ...edge,
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
