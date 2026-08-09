import type { DiagramView } from '@likec4/core/types'
import type { XirangViewMode } from './ContractLoaderContext'

/** sessionStorage key carrying the current interactive view state to the export tab. */
export const XIRANG_EXPORT_SNAPSHOT_KEY = 'xirang:export-snapshot'

/** The interactive view state the image export reproduces; expanded is an ordered array. */
export interface XirangExportSnapshot {
  view: string
  change: string | null
  mode: XirangViewMode
  focus: string | null
  expanded: string[]
  projection?: DiagramView
}

let current: XirangExportSnapshot | null = null

/** Keeps the latest interactive view state for the Header export click. */
export function setXirangExportSnapshot(next: XirangExportSnapshot): void {
  current = next
}

export function getXirangExportSnapshot(): XirangExportSnapshot | null {
  return current
}

export function writeXirangExportSnapshotToStorage(snapshot: XirangExportSnapshot, storage?: Storage): void {
  const target = storage ?? globalThis.sessionStorage
  target.setItem(XIRANG_EXPORT_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

/** Reads and normalizes the snapshot; malformed or missing payloads yield null. */
export function readXirangExportSnapshotFromStorage(storage?: Storage): XirangExportSnapshot | null {
  const target = storage ?? globalThis.sessionStorage
  const raw = target.getItem(XIRANG_EXPORT_SNAPSHOT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<XirangExportSnapshot>
    if (typeof parsed.view !== 'string' || (parsed.mode !== 'full' && parsed.mode !== 'diff')) return null
    if (!Array.isArray(parsed.expanded)) return null
    return {
      view: parsed.view,
      change: typeof parsed.change === 'string' ? parsed.change : null,
      mode: parsed.mode,
      focus: typeof parsed.focus === 'string' ? parsed.focus : null,
      expanded: parsed.expanded.filter((entry): entry is string => typeof entry === 'string'),
      ...(parsed.projection && typeof parsed.projection === 'object' ? { projection: parsed.projection } : {}),
    }
  } catch {
    return null
  }
}

/** Removes any stale snapshot so the export page falls back to default rendering. */
export function clearXirangExportSnapshotFromStorage(storage?: Storage): void {
  const target = storage ?? globalThis.sessionStorage
  target.removeItem(XIRANG_EXPORT_SNAPSHOT_KEY)
}
