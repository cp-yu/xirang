import type { XirangDiffEntry, XirangDiffOperation } from './ContractLoaderContext'

export const XIRANG_DIFF_OPERATIONS = ['ADDED', 'MODIFIED', 'REMOVED'] as const

export type XirangOperationCounts = Record<XirangDiffOperation, number>

/** Display categories shared by the Change panel and the landing-page Change cards. */
export type XirangDiffCategory = 'elements' | 'relationships' | 'sections' | 'metamodel' | 'views'

export type XirangDiffCounts = Record<XirangDiffCategory, XirangOperationCounts>

export const XIRANG_DIFF_CATEGORY_LABELS: Record<XirangDiffCategory, string> = {
  elements: 'Elements',
  relationships: 'Relationships',
  sections: 'Sections',
  metamodel: 'Metamodel',
  views: 'Views',
}

const categoryOfKind: Partial<Record<XirangDiffEntry['kind'], XirangDiffCategory>> = {
  'element-declaration': 'elements',
  'relationship': 'relationships',
  'section': 'sections',
  'element-kind': 'metamodel',
  'relationship-kind': 'metamodel',
  'authored-view': 'views',
}

const emptyOperationCounts = (): XirangOperationCounts => ({ ADDED: 0, MODIFIED: 0, REMOVED: 0 })

/** Classifies top-level diff entries; child-only kinds (acceptance-case, property) are not counted. */
export function summarizeXirangDiff(entries: readonly XirangDiffEntry[]): XirangDiffCounts {
  const counts: XirangDiffCounts = {
    elements: emptyOperationCounts(),
    relationships: emptyOperationCounts(),
    sections: emptyOperationCounts(),
    metamodel: emptyOperationCounts(),
    views: emptyOperationCounts(),
  }
  for (const entry of entries) {
    const category = categoryOfKind[entry.kind]
    if (category && entry.operation in counts[category]) counts[category][entry.operation] += 1
  }
  return counts
}

/** `+1 ~2 −3`, omitting zero operations; empty string when nothing changed. */
export function formatOperationCounts(counts: XirangOperationCounts): string {
  return [
    counts.ADDED > 0 ? `+${counts.ADDED}` : '',
    counts.MODIFIED > 0 ? `~${counts.MODIFIED}` : '',
    counts.REMOVED > 0 ? `−${counts.REMOVED}` : '',
  ].filter(Boolean).join(' ')
}

/** Non-empty categories in fixed display order with their formatted counts. */
export function listDiffCategories(counts: XirangDiffCounts) {
  return (Object.keys(XIRANG_DIFF_CATEGORY_LABELS) as XirangDiffCategory[]).flatMap(category => {
    const text = formatOperationCounts(counts[category])
    return text ? [{ category, label: XIRANG_DIFF_CATEGORY_LABELS[category], counts: counts[category], text }] : []
  })
}

export const XIRANG_OPERATION_COLORS: Record<XirangDiffOperation, string> = {
  ADDED: '#2f9e44',
  MODIFIED: '#ff9f0a',
  REMOVED: '#e03131',
}

export const XIRANG_OPERATION_GLYPHS: Record<XirangDiffOperation, string> = {
  ADDED: '+',
  MODIFIED: '~',
  REMOVED: '−',
}

export interface XirangDeclarationRef {
  title: string
  parent: string | null
}

export interface ChangedElement {
  identity: string
  operation: XirangDiffOperation
  title: string
  parent: string | null
  /** Number of Section entries hosted by this Element. */
  sectionCount: number
  /** True when the Element has Contract changes but no Declaration entry. */
  sectionsOnly: boolean
}

export interface ChangedRelationship {
  identity: string
  operation: XirangDiffOperation
  source: string
  kind: string
  target: string
  sourceTitle: string
  targetTitle: string
}

function declarationFrom(value: unknown): Partial<XirangDeclarationRef> {
  if (!value || typeof value !== 'object') return {}
  const { title, parent } = value as { title?: unknown; parent?: unknown }
  return {
    ...(typeof title === 'string' && title ? { title } : {}),
    ...(typeof parent === 'string' ? { parent } : parent === null ? { parent: null } : {}),
  }
}

const operationRank: Record<XirangDiffOperation, number> = { ADDED: 0, MODIFIED: 1, REMOVED: 2 }

/**
 * Every Element with a difference: Declaration ADDED/MODIFIED/REMOVED entries, plus Elements that only
 * have Section changes (reported as MODIFIED, `sectionsOnly`). Section entries are merged into their
 * host by the identity before `#`.
 */
export function collectChangedElements(
  entries: readonly XirangDiffEntry[],
  declarations: ReadonlyMap<string, XirangDeclarationRef>,
): ChangedElement[] {
  const result = new Map<string, ChangedElement>()
  const sectionCounts = new Map<string, number>()
  for (const entry of entries) {
    if (entry.kind === 'section') {
      const host = entry.identity.split('#')[0]
      if (host) sectionCounts.set(host, (sectionCounts.get(host) ?? 0) + 1)
    }
  }
  const describe = (identity: string, entry?: XirangDiffEntry) => {
    const fromEntry = { ...declarationFrom(entry?.before), ...declarationFrom(entry?.after) }
    const known = declarations.get(identity)
    return {
      title: fromEntry.title ?? known?.title ?? identity,
      parent: fromEntry.parent !== undefined ? fromEntry.parent : known?.parent ?? null,
    }
  }
  for (const entry of entries) {
    if (entry.kind !== 'element-declaration') continue
    result.set(entry.identity, {
      identity: entry.identity,
      operation: entry.operation,
      ...describe(entry.identity, entry),
      sectionCount: sectionCounts.get(entry.identity) ?? 0,
      sectionsOnly: false,
    })
  }
  for (const [host, sectionCount] of sectionCounts) {
    if (result.has(host)) continue
    result.set(host, {
      identity: host,
      operation: 'MODIFIED',
      ...describe(host),
      sectionCount,
      sectionsOnly: true,
    })
  }
  return [...result.values()].sort((left, right) =>
    operationRank[left.operation] - operationRank[right.operation]
    || left.title.localeCompare(right.title)
    || left.identity.localeCompare(right.identity)
  )
}

export function collectChangedRelationships(
  entries: readonly XirangDiffEntry[],
  titleOf: (identity: string) => string,
): ChangedRelationship[] {
  const result: ChangedRelationship[] = []
  for (const entry of entries) {
    if (entry.kind !== 'relationship') continue
    const [source, kind, target] = entry.identity.split('|')
    if (!source || !kind || !target) continue
    result.push({
      identity: entry.identity,
      operation: entry.operation,
      source,
      kind,
      target,
      sourceTitle: titleOf(source),
      targetTitle: titleOf(target),
    })
  }
  return result.sort((left, right) =>
    operationRank[left.operation] - operationRank[right.operation] || left.identity.localeCompare(right.identity)
  )
}

/** Groups already-sorted items by operation in ADDED, MODIFIED, REMOVED order, omitting empty groups. */
export function groupByOperation<T extends { operation: XirangDiffOperation }>(items: readonly T[]) {
  return XIRANG_DIFF_OPERATIONS.flatMap(operation => {
    const group = items.filter(item => item.operation === operation)
    return group.length > 0 ? [{ operation, items: group }] : []
  })
}

/** Case-insensitive substring filter over the given searchable fields; an empty query keeps everything. */
export function filterByText<T>(items: readonly T[], query: string, fields: (item: T) => readonly string[]): T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...items]
  return items.filter(item => fields(item).some(field => field.toLowerCase().includes(needle)))
}

export interface ProjectionNodeRef {
  id: string
  identity: string
}

export type LocateUnavailableReason = 'removed-hidden' | 'hidden' | 'no-parent' | 'out-of-scope'

export type LocateResolution =
  | { type: 'center'; nodeId: string }
  | { type: 'focus'; focusIdentity: string }
  | { type: 'unavailable'; reason: LocateUnavailableReason }

/**
 * Decides how to bring an Element into view: center on its node when it is projected; otherwise focus its
 * parent (which makes it a visible child); otherwise report why it cannot be shown.
 */
export function resolveLocateTarget(args: {
  identity: string
  operation: XirangDiffOperation
  parent: string | null
  nodes: readonly ProjectionNodeRef[]
  /** Currently effective focus (explicit focus or breadcrumb root). */
  focusIdentity: string | null
  declaredIdentities: ReadonlySet<string>
  /** Identities selectable in the current View; null means unrestricted. */
  scope: ReadonlySet<string> | null
}): LocateResolution {
  const node = args.nodes.find(candidate => candidate.identity === args.identity)
  if (node) return { type: 'center', nodeId: node.id }
  const { parent } = args
  if (parent === null) return { type: 'unavailable', reason: 'no-parent' }
  if (!args.declaredIdentities.has(parent)) return { type: 'unavailable', reason: 'hidden' }
  if (args.scope && !args.scope.has(parent)) return { type: 'unavailable', reason: 'out-of-scope' }
  if (parent === args.focusIdentity) {
    return { type: 'unavailable', reason: args.operation === 'REMOVED' ? 'removed-hidden' : 'hidden' }
  }
  return { type: 'focus', focusIdentity: parent }
}

/** Title shown for the current View Selection, with the focused Element appended when it is not the root. */
export function xirangViewTitle(viewLabel: string, focusTitle: string | null): string {
  return focusTitle ? `${viewLabel} · ${focusTitle}` : viewLabel
}
