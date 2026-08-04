import { compareNatural } from '@likec4/core/utils'

/**
 * A node in a view's hierarchy tree, resolved from the computed view nodes.
 * `id` is the view-local node id used for parent/child linkage; `fqn` is the
 * element identity shown by the `fqn` field (`metadata.elementId` when present).
 */
export interface ViewTreeNode {
  id: string
  fqn: string
  title: string
  kind: string
  children: ViewTreeNode[]
}

/** The view node fields a tree line can carry. */
export type ViewTreeField = 'title' | 'fqn' | 'kind'

/** Fixed rendering order of the selectable line fields. */
const FIELD_ORDER: readonly ViewTreeField[] = ['title', 'fqn', 'kind']

export interface ViewTreeJsonNode {
  fqn: string
  title: string
  kind: string
  children: ViewTreeJsonNode[]
}

type ViewNodeLike = {
  id: string
  title: string
  kind: string
  parent: string | null
  children: readonly string[]
  metadata?: Readonly<Record<string, unknown>> | null
}

const elementFqn = (node: ViewNodeLike): string =>
  typeof node.metadata?.['elementId'] === 'string' ? node.metadata['elementId'] : node.id

/**
 * Builds the hierarchy tree of a view from its nodes: every node without a parent present in
 * the view becomes a root, children follow the `children` ids, and each level is sorted by
 * title using a natural order.
 */
export function buildViewTree(view: { nodes: readonly ViewNodeLike[] }): ViewTreeNode[] {
  const byId = new Map<string, ViewTreeNode>()
  for (const node of view.nodes) {
    byId.set(node.id, { id: node.id, fqn: elementFqn(node), title: node.title, kind: node.kind, children: [] })
  }
  const roots: ViewTreeNode[] = []
  for (const node of view.nodes) {
    const treeNode = byId.get(node.id)!
    const parent = node.parent === null ? null : byId.get(node.parent)
    if (parent) {
      parent.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
  }
  const sortRecursive = (nodes: ViewTreeNode[]) => {
    nodes.sort((left, right) => compareNatural(left.title, right.title))
    for (const node of nodes) sortRecursive(node.children)
  }
  sortRecursive(roots)
  return roots
}

const resolveFields = (fields: readonly ViewTreeField[]): readonly ViewTreeField[] => {
  const selected = FIELD_ORDER.filter(field => fields.includes(field))
  return selected.length > 0 ? selected : ['title']
}

const nodeLabel = (node: ViewTreeNode, fields: readonly ViewTreeField[]): string => {
  const parts: string[] = []
  for (const field of fields) {
    switch (field) {
      case 'title':
        parts.push(node.title)
        break
      case 'fqn':
        parts.push(`[${node.fqn}]`)
        break
      case 'kind':
        parts.push(`(${node.kind})`)
        break
    }
  }
  return parts.join(' ')
}

const renderTextNode = (
  node: ViewTreeNode,
  fields: readonly ViewTreeField[],
  prefix: string,
  isLast: boolean,
  lines: string[],
): void => {
  lines.push(`${prefix}${isLast ? '└── ' : '├── '}${nodeLabel(node, fields)}`)
  const childPrefix = prefix + (isLast ? '    ' : '│   ')
  node.children.forEach((child, index) => renderTextNode(child, fields, childPrefix, index === node.children.length - 1, lines))
}

/**
 * Serializes the tree as an indented plain-text tree with `├──`/`└──` line branches.
 */
export function renderTreeText(roots: readonly ViewTreeNode[], fields: readonly ViewTreeField[] = ['title']): string {
  const resolved = resolveFields(fields)
  const lines: string[] = []
  roots.forEach((root, index) => renderTextNode(root, resolved, '', index === roots.length - 1, lines))
  return lines.join('\n')
}

/**
 * Serializes the tree as a Markdown nested list with two-space indentation.
 */
export function renderTreeMarkdown(roots: readonly ViewTreeNode[], fields: readonly ViewTreeField[] = ['title']): string {
  const resolved = resolveFields(fields)
  const lines: string[] = []
  const walk = (node: ViewTreeNode, depth: number) => {
    lines.push(`${'  '.repeat(depth)}- ${nodeLabel(node, resolved)}`)
    for (const child of node.children) walk(child, depth + 1)
  }
  for (const root of roots) walk(root, 0)
  return lines.join('\n')
}

const toJson = (node: ViewTreeNode): ViewTreeJsonNode => ({
  fqn: node.fqn,
  title: node.title,
  kind: node.kind,
  children: node.children.map(toJson),
})

/**
 * Serializes the tree as JSON-compatible nested nodes, always carrying `fqn`, `title`,
 * `kind` and `children` regardless of the field selection.
 */
export function treeToJson(roots: readonly ViewTreeNode[]): ViewTreeJsonNode[] {
  return roots.map(toJson)
}
