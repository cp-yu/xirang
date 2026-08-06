import { describe, expect, it } from 'vitest'
import type { XirangViewMode } from './ContractLoaderContext'
import {
  readXirangExportSnapshotFromStorage,
  writeXirangExportSnapshotToStorage,
  XIRANG_EXPORT_SNAPSHOT_KEY,
  type XirangExportSnapshot,
} from './export-state'

function snapshot(overrides: Partial<XirangExportSnapshot> = {}): XirangExportSnapshot {
  return {
    source: 'model',
    mode: 'full' as XirangViewMode,
    focus: null,
    expanded: [],
    ...overrides,
  }
}

function mockStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: key => map.get(key) ?? null,
    key: index => [...map.keys()][index] ?? null,
    removeItem: key => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

describe('export snapshot storage round-trip', () => {
  it('persists a full snapshot through storage', () => {
    const storage = mockStorage()
    writeXirangExportSnapshotToStorage(snapshot({
      source: 'change:browser-change',
      mode: 'diff' as XirangViewMode,
      focus: 'capability.added-parent',
      expanded: ['capability.added-child'],
    }), storage)
    expect(storage.getItem(XIRANG_EXPORT_SNAPSHOT_KEY)).toContain('capability.added-parent')
    expect(readXirangExportSnapshotFromStorage(storage)).toEqual(snapshot({
      source: 'change:browser-change',
      mode: 'diff' as XirangViewMode,
      focus: 'capability.added-parent',
      expanded: ['capability.added-child'],
    }))
  })

  it('normalizes a null focus and empty expansion', () => {
    const storage = mockStorage()
    writeXirangExportSnapshotToStorage(snapshot(), storage)
    expect(readXirangExportSnapshotFromStorage(storage)).toEqual(snapshot())
  })

  it('returns null when no snapshot is present or the payload is malformed', () => {
    const storage = mockStorage()
    expect(readXirangExportSnapshotFromStorage(storage)).toBeNull()
    storage.setItem(XIRANG_EXPORT_SNAPSHOT_KEY, 'not-json')
    expect(readXirangExportSnapshotFromStorage(storage)).toBeNull()
    storage.setItem(XIRANG_EXPORT_SNAPSHOT_KEY, JSON.stringify({ source: 42 }))
    expect(readXirangExportSnapshotFromStorage(storage)).toBeNull()
  })
})
