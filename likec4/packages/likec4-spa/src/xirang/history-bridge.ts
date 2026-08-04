/**
 * Minimal shape of the diagram in-memory navigation history needed to classify URL focus
 * changes. `focusIdentity` null means the Project Root.
 */
export interface NavigationHistoryLike {
  history: ReadonlyArray<{ viewId: string; focusIdentity?: string | null }>
  currentIndex: number
}

/** Normalize focus: null and undefined both mean "Project Root" (no URL param). */
export function normalizeFocus(focus: string | null | undefined): string | undefined {
  return focus ?? undefined
}

/**
 * Whether a focus change observed in the diagram should push a new URL history entry or
 * replace the current one. Appending navigation (drill-down, breadcrumb jump) leaves the
 * index at the tail → push; stepping inside existing history (panel back/forward) → replace,
 * so the browser history does not gain a duplicate entry.
 */
export function classifyFocusUrlChange(history: NavigationHistoryLike): 'push' | 'replace' {
  return history.currentIndex >= history.history.length - 1 ? 'push' : 'replace'
}

/**
 * When the URL focus moves to `focusIdentity` (browser back/forward or deep link), find the
 * in-memory history step that reproduces it. Exactly one matching neighbor selects back or
 * forward; an ambiguous or absent match returns null and the caller appends instead.
 */
export function matchHistoryNeighbor(
  history: NavigationHistoryLike,
  focusIdentity: string | null,
): 'back' | 'forward' | null {
  const back = history.history[history.currentIndex - 1]
  const forward = history.history[history.currentIndex + 1]
  const backMatches = !!back && (back.focusIdentity ?? null) === focusIdentity
  const forwardMatches = !!forward && (forward.focusIdentity ?? null) === focusIdentity
  if (backMatches && !forwardMatches) return 'back'
  if (forwardMatches && !backMatches) return 'forward'
  return null
}
