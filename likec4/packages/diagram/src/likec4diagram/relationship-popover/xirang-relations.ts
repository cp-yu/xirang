import type { XirangSemanticModel } from '../../xirang/ContractLoaderContext'

/**
 * A relationship shown in a projection view, resolved from the Xirang architecture instead of
 * the LikeC4 model. Projection views are computed from in-memory sources whose relation ids
 * hash the (virtual) document URI, so they never match the SPA model built from disk; the
 * edge metadata therefore carries the stable Xirang identity `source|kind|target`.
 */
export interface XirangRelationView {
  /** Full Xirang relationship identity `source|kind|target`. */
  triple: string
  source: string
  kind: string
  target: string
  sourceLabel: string
  targetLabel: string
  /** Relationship-kind semantics, when the kind is declared in the architecture. */
  description: string | null
}

/** Reads the Xirang relationship identities attached to a projection edge, or null when absent. */
export function readXirangTriples(edge: object): string[] | null {
  const metadata = (edge as { metadata?: unknown }).metadata
  if (!metadata || typeof metadata !== 'object') return null
  const record = metadata as Record<string, unknown>
  const relations = record['xirangRelations']
  if (Array.isArray(relations) && relations.every(item => typeof item === 'string')) {
    return relations as string[]
  }
  const single = record['xirangRelation']
  return typeof single === 'string' ? [single] : null
}

/** Splits a relationship identity and enriches it with element titles and kind semantics. */
export function resolveXirangRelation(triple: string, architecture: XirangSemanticModel): XirangRelationView | null {
  const [source, kind, target] = triple.split('|')
  if (!source || !kind || !target) return null
  const sourceElement = architecture.elements.find(element => element.declaration.identity === source)
  const targetElement = architecture.elements.find(element => element.declaration.identity === target)
  const kindDefinition = architecture.relationshipKinds?.find(item => item.identity === kind)
  return {
    triple,
    source,
    kind,
    target,
    sourceLabel: sourceElement?.declaration.title ?? source,
    targetLabel: targetElement?.declaration.title ?? target,
    description: kindDefinition?.body ?? null,
  }
}

export function resolveXirangRelations(triples: readonly string[], architecture: XirangSemanticModel): XirangRelationView[] {
  return triples.flatMap(triple => {
    const resolved = resolveXirangRelation(triple, architecture)
    return resolved ? [resolved] : []
  })
}
