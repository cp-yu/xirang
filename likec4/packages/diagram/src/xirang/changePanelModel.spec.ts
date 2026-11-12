import { describe, expect, it } from 'vitest'
import {
  collectChangedElements,
  collectChangedRelationships,
  filterByText,
  formatOperationCounts,
  groupByOperation,
  listDiffCategories,
  resolveLocateTarget,
  summarizeXirangDiff,
  xirangViewTitle,
} from './changePanelModel'
import type { XirangDiffEntry } from './ContractLoaderContext'

const declarations = new Map([
  ['root', { title: 'Root', parent: null }],
  ['parent', { title: 'Parent', parent: 'root' }],
  ['child', { title: 'Child', parent: 'parent' }],
  ['legacy', { title: 'Legacy', parent: 'parent' }],
])

describe('summarizeXirangDiff / listDiffCategories', () => {
  const entries: XirangDiffEntry[] = [
    { kind: 'element-declaration', identity: 'a', operation: 'ADDED' },
    { kind: 'element-declaration', identity: 'b', operation: 'MODIFIED' },
    { kind: 'relationship', identity: 'a|k|b', operation: 'ADDED' },
    { kind: 'section', identity: 'a#x', operation: 'ADDED' },
    { kind: 'section', identity: 'a#y', operation: 'ADDED' },
    { kind: 'element-kind', identity: 'ek', operation: 'ADDED' },
    { kind: 'relationship-kind', identity: 'rk', operation: 'ADDED' },
    { kind: 'authored-view', identity: 'v', operation: 'REMOVED' },
    { kind: 'acceptance-case', identity: 'a#x#case', operation: 'ADDED' },
    { kind: 'property', identity: 'a.title', operation: 'MODIFIED' },
  ]

  it('counts only top-level entries per category; child-only kinds are ignored', () => {
    const counts = summarizeXirangDiff(entries)
    expect(counts.elements).toEqual({ ADDED: 1, MODIFIED: 1, REMOVED: 0 })
    expect(counts.relationships).toEqual({ ADDED: 1, MODIFIED: 0, REMOVED: 0 })
    expect(counts.sections).toEqual({ ADDED: 2, MODIFIED: 0, REMOVED: 0 })
    expect(counts.metamodel).toEqual({ ADDED: 2, MODIFIED: 0, REMOVED: 0 })
    expect(counts.views).toEqual({ ADDED: 0, MODIFIED: 0, REMOVED: 1 })
  })

  it('lists non-empty categories in fixed order with formatted counts', () => {
    expect(listDiffCategories(summarizeXirangDiff(entries)).map(item => `${item.label} ${item.text}`)).toEqual([
      'Elements +1 ~1',
      'Relationships +1',
      'Sections +2',
      'Metamodel +2',
      'Views −1',
    ])
    expect(listDiffCategories(summarizeXirangDiff([]))).toEqual([])
    expect(formatOperationCounts({ ADDED: 0, MODIFIED: 0, REMOVED: 3 })).toBe('−3')
  })
})

describe('collectChangedElements', () => {
  it('merges section changes into hosts: declared hosts keep their operation, others become sections-only MODIFIED', () => {
    const result = collectChangedElements([
      { kind: 'element-declaration', identity: 'child', operation: 'ADDED', after: { title: 'New Child', parent: 'parent' } },
      { kind: 'section', identity: 'child#one', operation: 'ADDED' },
      { kind: 'section', identity: 'parent#two', operation: 'MODIFIED' },
      { kind: 'section', identity: 'parent#three', operation: 'REMOVED' },
      { kind: 'element-declaration', identity: 'legacy', operation: 'REMOVED', before: { title: 'Legacy', parent: 'parent' } },
    ], declarations)
    expect(result.map(item => ({ ...item }))).toEqual([
      { identity: 'child', operation: 'ADDED', title: 'New Child', parent: 'parent', sectionCount: 1, sectionsOnly: false },
      { identity: 'parent', operation: 'MODIFIED', title: 'Parent', parent: 'root', sectionCount: 2, sectionsOnly: true },
      { identity: 'legacy', operation: 'REMOVED', title: 'Legacy', parent: 'parent', sectionCount: 0, sectionsOnly: false },
    ])
  })

  it('falls back to identity when no title is known', () => {
    const [item] = collectChangedElements([{ kind: 'section', identity: 'ghost#s', operation: 'ADDED' }], new Map())
    expect(item).toMatchObject({ identity: 'ghost', title: 'ghost', parent: null })
  })
})

describe('collectChangedRelationships', () => {
  it('splits identity into source/kind/target, resolves titles and orders by operation', () => {
    const result = collectChangedRelationships([
      { kind: 'relationship', identity: 'child|uses|parent', operation: 'REMOVED' },
      { kind: 'relationship', identity: 'parent|uses|child', operation: 'ADDED' },
      { kind: 'relationship', identity: 'malformed', operation: 'ADDED' },
    ], id => declarations.get(id)?.title ?? id)
    expect(result.map(item => [item.operation, item.sourceTitle, item.kind, item.targetTitle])).toEqual([
      ['ADDED', 'Parent', 'uses', 'Child'],
      ['REMOVED', 'Child', 'uses', 'Parent'],
    ])
  })
})

describe('groupByOperation / filterByText', () => {
  it('groups in ADDED, MODIFIED, REMOVED order and omits empty groups', () => {
    const groups = groupByOperation([
      { operation: 'REMOVED' as const, id: 1 },
      { operation: 'ADDED' as const, id: 2 },
      { operation: 'ADDED' as const, id: 3 },
    ])
    expect(groups.map(group => [group.operation, group.items.map(item => item.id)])).toEqual([
      ['ADDED', [2, 3]],
      ['REMOVED', [1]],
    ])
  })

  it('filters case-insensitively over any field and keeps everything for a blank query', () => {
    const items = [{ title: 'Auth Service', id: 'auth' }, { title: 'Billing', id: 'pay' }]
    const fields = (item: { title: string; id: string }) => [item.title, item.id]
    expect(filterByText(items, 'AUTH', fields)).toEqual([items[0]])
    expect(filterByText(items, 'pay', fields)).toEqual([items[1]])
    expect(filterByText(items, '   ', fields)).toEqual(items)
  })
})

describe('resolveLocateTarget', () => {
  const base = {
    nodes: [{ id: 'root.parent', identity: 'parent' }],
    focusIdentity: 'root' as string | null,
    declaredIdentities: new Set(declarations.keys()),
    scope: null,
  }

  it('centers on the node when the Element is already projected', () => {
    expect(resolveLocateTarget({ ...base, identity: 'parent', operation: 'MODIFIED', parent: 'root' }))
      .toEqual({ type: 'center', nodeId: 'root.parent' })
  })

  it('focuses the parent when the Element is not projected and the parent is not the focus', () => {
    expect(resolveLocateTarget({ ...base, identity: 'child', operation: 'ADDED', parent: 'parent' }))
      .toEqual({ type: 'focus', focusIdentity: 'parent' })
  })

  it('reports a removed Element as hidden when its parent is already focused', () => {
    expect(resolveLocateTarget({ ...base, focusIdentity: 'parent', identity: 'legacy', operation: 'REMOVED', parent: 'parent' }))
      .toEqual({ type: 'unavailable', reason: 'removed-hidden' })
    expect(resolveLocateTarget({ ...base, focusIdentity: 'parent', identity: 'child', operation: 'ADDED', parent: 'parent' }))
      .toEqual({ type: 'unavailable', reason: 'hidden' })
  })

  it('reports unavailable when the parent is unknown, missing or outside the View scope', () => {
    expect(resolveLocateTarget({ ...base, identity: 'root', operation: 'MODIFIED', parent: null }))
      .toEqual({ type: 'unavailable', reason: 'no-parent' })
    expect(resolveLocateTarget({ ...base, identity: 'x', operation: 'ADDED', parent: 'missing' }))
      .toEqual({ type: 'unavailable', reason: 'hidden' })
    expect(resolveLocateTarget({ ...base, scope: new Set(['root']), identity: 'child', operation: 'ADDED', parent: 'parent' }))
      .toEqual({ type: 'unavailable', reason: 'out-of-scope' })
  })
})

describe('xirangViewTitle', () => {
  it('appends the focused Element title when present', () => {
    expect(xirangViewTitle('Full Model', null)).toBe('Full Model')
    expect(xirangViewTitle('Full Model', 'Parent')).toBe('Full Model · Parent')
  })
})
