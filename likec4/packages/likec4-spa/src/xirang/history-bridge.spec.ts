import { describe, expect, it } from 'vitest'
import {
  classifyFocusUrlChange,
  matchHistoryNeighbor,
  normalizeFocus,
  type NavigationHistoryLike,
} from './history-bridge'

function history(
  entries: Array<{ viewId?: string; focusIdentity?: string | null }>,
  currentIndex: number,
): NavigationHistoryLike {
  return {
    history: entries.map(entry => ({ viewId: entry.viewId ?? 'model', ...entry })),
    currentIndex,
  }
}

describe('normalizeFocus', () => {
  it('maps null and undefined to undefined (Project Root)', () => {
    expect(normalizeFocus(null)).toBeUndefined()
    expect(normalizeFocus(undefined)).toBeUndefined()
  })

  it('keeps a real identity unchanged', () => {
    expect(normalizeFocus('capability.drill')).toBe('capability.drill')
  })
})

describe('classifyFocusUrlChange', () => {
  it('pushes when the index is at the history tail (drill-down/breadcrumb append)', () => {
    expect(classifyFocusUrlChange(history([
      { focusIdentity: null },
      { focusIdentity: 'capability.drill' },
    ], 1))).toBe('push')
  })

  it('replaces when stepping inside existing history (panel back/forward)', () => {
    expect(classifyFocusUrlChange(history([
      { focusIdentity: null },
      { focusIdentity: 'capability.drill' },
    ], 0))).toBe('replace')
  })

  it('pushes on a single-entry reset (source switch history)', () => {
    expect(classifyFocusUrlChange(history([{ focusIdentity: null }], 0))).toBe('push')
  })
})

describe('matchHistoryNeighbor', () => {
  const entries = history([
    { focusIdentity: null },
    { focusIdentity: 'capability.a' },
    { focusIdentity: 'capability.b' },
  ], 1)

  it('selects back when the previous entry matches', () => {
    expect(matchHistoryNeighbor(entries, null)).toBe('back')
  })

  it('selects forward when the next entry matches', () => {
    expect(matchHistoryNeighbor(entries, 'capability.b')).toBe('forward')
  })

  it('returns null when neither neighbor matches', () => {
    expect(matchHistoryNeighbor(entries, 'capability.x')).toBeNull()
  })

  it('returns null on ambiguous matches', () => {
    const ambiguous = history([
      { focusIdentity: null },
      { focusIdentity: 'capability.a' },
      { focusIdentity: null },
    ], 1)
    expect(matchHistoryNeighbor(ambiguous, null)).toBeNull()
  })

  it('returns null when no neighbor exists', () => {
    expect(matchHistoryNeighbor(history([{ focusIdentity: 'capability.a' }], 0), 'capability.a')).toBeNull()
  })
})
