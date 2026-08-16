import type { XirangDiffOperation } from './ContractLoaderContext'

const operations = new Set<XirangDiffOperation>(['ADDED', 'MODIFIED', 'REMOVED'])

export interface XirangRequirementCounts {
  added: number
  modified: number
  removed: number
}

export const EMPTY_REQUIREMENT_COUNTS: XirangRequirementCounts = { added: 0, modified: 0, removed: 0 }

export interface XirangProjectionNodeData {
  identity: string
  operation?: XirangDiffOperation
  requirementCounts: XirangRequirementCounts
  hasChildren: boolean
  expanded: boolean
}

type ProjectionNode = {
  metadata?: Readonly<Record<string, string | string[] | undefined>> | null
  children?: readonly unknown[]
}

export function xirangProjectionMetadata(
  identity: string,
  operation: XirangDiffOperation | undefined,
  hasChildren: boolean,
  requirementCounts: XirangRequirementCounts = EMPTY_REQUIREMENT_COUNTS,
): Readonly<Record<string, string>> {
  const counts = `${requirementCounts.added},${requirementCounts.modified},${requirementCounts.removed}`
  return {
    xirangIdentity: identity,
    ...(operation ? { xirangOperation: operation } : {}),
    ...(requirementCounts.added || requirementCounts.modified || requirementCounts.removed
      ? { xirangRequirementCounts: counts }
      : {}),
    xirangHasChildren: String(hasChildren),
  }
}

/** `added,modified,removed`；缺失或非法时按零计数处理。 */
export function readXirangRequirementCounts(raw: string | string[] | undefined): XirangRequirementCounts {
  if (typeof raw !== 'string') return EMPTY_REQUIREMENT_COUNTS
  const parts = raw.split(',').map(part => Number(part))
  const added = parts[0]
  const modified = parts[1]
  const removed = parts[2]
  if (added === undefined || modified === undefined || removed === undefined
    || !Number.isInteger(added) || !Number.isInteger(modified) || !Number.isInteger(removed)) {
    return EMPTY_REQUIREMENT_COUNTS
  }
  return { added, modified, removed }
}

export function readXirangProjectionNode(node: ProjectionNode): XirangProjectionNodeData | null {
  const identity = node.metadata?.['xirangIdentity'] ?? node.metadata?.['elementId']
  const operation = node.metadata?.['xirangOperation']
  if (typeof identity !== 'string' || identity === '') return null
  if (operation !== undefined && (typeof operation !== 'string' || !operations.has(operation as XirangDiffOperation))) {
    return null
  }
  return {
    identity,
    ...(typeof operation === 'string' ? { operation: operation as XirangDiffOperation } : {}),
    requirementCounts: readXirangRequirementCounts(node.metadata?.['xirangRequirementCounts']),
    hasChildren: node.metadata?.['xirangHasChildren'] === 'true',
    expanded: (node.children?.length ?? 0) > 0,
  }
}

export interface XirangProjectionEdgeData {
  operation?: XirangDiffOperation
  relation?: string
  relationCounts?: XirangRelationCounts
}

export interface XirangRelationCounts {
  added: number
  modified: number
  removed: number
}

/** `added,modified,removed`；缺失或非法时按 undefined 处理。 */
export function readXirangRelationCounts(raw: string | string[] | undefined): XirangRelationCounts | undefined {
  if (typeof raw !== 'string') return undefined
  const parts = raw.split(',').map(part => Number(part))
  if (parts.length !== 3) return undefined
  const added = parts[0]
  const modified = parts[1]
  const removed = parts[2]
  if (added === undefined || modified === undefined || removed === undefined
    || !Number.isInteger(added) || !Number.isInteger(modified) || !Number.isInteger(removed)
    || added < 0 || modified < 0 || removed < 0) {
    return undefined
  }
  return { added, modified, removed }
}

export function readXirangProjectionEdge(edge: ProjectionNode): XirangProjectionEdgeData | null {
  const rawOperation = edge.metadata?.['xirangOperation']
  const relation = edge.metadata?.['xirangRelation']
  const relationCounts = readXirangRelationCounts(edge.metadata?.['xirangRelationCounts'])
  if (typeof rawOperation !== 'string' && typeof relation !== 'string' && relationCounts === undefined) return null
  if (rawOperation !== undefined && !operations.has(rawOperation as XirangDiffOperation)) return null
  return {
    ...(typeof rawOperation === 'string' ? { operation: rawOperation as XirangDiffOperation } : {}),
    ...(typeof relation === 'string' ? { relation } : {}),
    ...(relationCounts ? { relationCounts } : {}),
  }
}

export function addedXirangProjectionIdentity(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('xirang' in data)) return null
  const xirang = (data as { xirang?: XirangProjectionNodeData }).xirang
  return xirang?.operation === 'ADDED' ? xirang.identity : null
}
