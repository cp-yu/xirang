import type { XirangDiffOperation } from './ContractLoaderContext'

const operations = new Set<XirangDiffOperation>(['ADDED', 'MODIFIED', 'REMOVED'])

export interface XirangProjectionNodeData {
  identity: string
  operation: XirangDiffOperation
  hasChildren: boolean
  expanded: boolean
}

type ProjectionNode = {
  metadata?: Readonly<Record<string, string | string[] | undefined>> | null
  children?: readonly unknown[]
}

export function xirangProjectionMetadata(
  identity: string,
  operation: XirangDiffOperation,
  hasChildren: boolean,
): Readonly<Record<string, string>> {
  return {
    xirangIdentity: identity,
    xirangOperation: operation,
    xirangHasChildren: String(hasChildren),
  }
}

export function readXirangProjectionNode(node: ProjectionNode): XirangProjectionNodeData | null {
  const identity = node.metadata?.['xirangIdentity'] ?? node.metadata?.['elementId']
  const operation = node.metadata?.['xirangOperation']
  if (
    typeof identity !== 'string' || typeof operation !== 'string' || !operations.has(operation as XirangDiffOperation)
  ) {
    return null
  }
  return {
    identity,
    operation: operation as XirangDiffOperation,
    hasChildren: node.metadata?.['xirangHasChildren'] === 'true',
    expanded: (node.children?.length ?? 0) > 0,
  }
}

export interface XirangProjectionEdgeData {
  operation?: XirangDiffOperation
  relation?: string
}

export function readXirangProjectionEdge(edge: ProjectionNode): XirangProjectionEdgeData | null {
  const rawOperation = edge.metadata?.['xirangOperation']
  const relation = edge.metadata?.['xirangRelation']
  if (typeof rawOperation !== 'string' && typeof relation !== 'string') return null
  if (rawOperation !== undefined && !operations.has(rawOperation as XirangDiffOperation)) return null
  return {
    ...(typeof rawOperation === 'string' ? { operation: rawOperation as XirangDiffOperation } : {}),
    ...(typeof relation === 'string' ? { relation } : {}),
  }
}

export function addedXirangProjectionIdentity(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('xirang' in data)) return null
  const xirang = (data as { xirang?: XirangProjectionNodeData }).xirang
  return xirang?.operation === 'ADDED' ? xirang.identity : null
}
