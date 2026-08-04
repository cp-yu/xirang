import {
  resolveEffectiveMode,
  selectDiagramSnapshot,
  useDiagram,
  useDiagramSelector,
  useXirangViewSources,
  type XirangViewMode,
} from '@likec4/diagram'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { shallowEqual } from 'fast-equals'
import { useCallback, useEffect, useRef } from 'react'
import { useCurrentViewId } from '../hooks'
import { classifyFocusUrlChange, matchHistoryNeighbor, normalizeFocus, type NavigationHistoryLike } from './history-bridge'

const selectNavState = selectDiagramSnapshot(
  snapshot => ({
    focusIdentity: snapshot.context.focusIdentity,
    history: snapshot.context.navigationHistory as NavigationHistoryLike,
    ready: snapshot.matches('ready'),
  }),
  shallowEqual,
)

/**
 * Bidirectional URL ⇄ diagram bridge for the Xirang navigation state (`source`, `focus`,
 * `mode`). The URL is the single source of truth: drill-down, breadcrumb jumps, source
 * switches and full/diff toggles become browser history steps, and browser back/forward
 * restores the encoded state. Runs no-op on non-Xirang (Authored View) routes and strips
 * the Xirang params from those URLs.
 */
export function ViewHistoryBridge() {
  const navigate = useNavigate()
  const diagram = useDiagram()
  const { selected, select, mode: modeState, setMode } = useXirangViewSources()
  const { source: urlSource, focus: urlFocus, mode: urlMode } = useSearch({ from: '__root__' })
  const currentViewId = useCurrentViewId()
  const { focusIdentity, history, ready } = useDiagramSelector(selectNavState)

  const isModelView = currentViewId === 'model'
  // Live view id for deferred URL commits: an incidental source reset while navigating away
  // from the Model View must not overwrite the in-flight view navigation.
  const currentViewIdRef = useRef(currentViewId)
  currentViewIdRef.current = currentViewId
  const effectiveMode = resolveEffectiveMode(selected.source, modeState)
  // The overlay represents the root focus both as null and as the root element identity;
  // both map to an absent `focus` URL param.
  const rootIdentity = selected.architecture?.elements
    .map(element => element.declaration)
    .find(declaration => declaration.parent === null)?.identity
  const rootFocus = (focus: string | null | undefined): string | undefined => {
    const value = normalizeFocus(focus)
    return value === rootIdentity ? undefined : value
  }
  const focusValue = rootFocus(focusIdentity)
  const urlFocusValue = rootFocus(urlFocus)
  // URL-derived navigation values, read through refs by the diagram→URL mirror (see below).
  const urlSourceRef = useRef(urlSource)
  urlSourceRef.current = urlSource
  const urlModeRef = useRef(urlMode)
  urlModeRef.current = urlMode
  const urlFocusValueRef = useRef(urlFocusValue)
  urlFocusValueRef.current = urlFocusValue

  // Pending URL→diagram transitions: while they settle, the diagram→URL mirror must not
  // overwrite the URL with the pre-transition diagram state.
  const sourceTransitionRef = useRef(false)
  const modeTransitionRef = useRef(false)
  // A URL-driven focus sync is settling; the mirror must not overwrite the URL until the
  // diagram focus reaches the URL target.
  const focusTransitionRef = useRef(false)
  // The last URL state this mirror pushed, so a source/focus transition that re-fires the
  // mirror with the same target does not duplicate history entries.
  const lastPushedRef = useRef<{ source: string; mode: XirangViewMode; focus?: string | undefined } | null>(null)
  // The last URL focus the URL→diagram effect applied; reset on source switches because the
  // source switch resets the in-memory focus and the URL focus must be re-applied.
  const lastAppliedFocusRef = useRef<string | undefined>(undefined)

  const commitUrl = useCallback((kind: 'push' | 'replace', next: { source: string; mode: XirangViewMode; focus?: string | undefined }) => {
    void navigate({
      to: './',
      replace: kind === 'replace',
      viewTransition: false,
      search: prev => {
        const search = { ...prev, source: next.source, mode: next.mode }
        if (next.focus) {
          search.focus = next.focus
        } else {
          delete search.focus
        }
        return search
      },
    })
  }, [navigate])

  // URL → diagram: source selection (deep link, browser back/forward across sources).
  // Acts only when the URL source itself changed; a user-driven source switch changes
  // `selected.id` with the URL source unchanged and must not be reverted.
  const prevUrlSourceRef = useRef(urlSource)
  useEffect(() => {
    if (!ready || !isModelView) return
    const prev = prevUrlSourceRef.current
    prevUrlSourceRef.current = urlSource
    if (prev === urlSource) return
    if (urlSource === selected.id) return
    sourceTransitionRef.current = true
    select(urlSource)
  }, [ready, isModelView, urlSource, selected.id, select])

  // A source switch resets the in-memory focus to the root, so the URL focus must be
  // re-applied after the selection settles.
  useEffect(() => {
    lastAppliedFocusRef.current = undefined
  }, [selected.id])

  // URL → diagram: focus (browser back/forward, deep link). The drive is deferred until the
  // diagram owns at least one history entry, because `navigate.focus` is a no-op on empty
  // history and the deep link would otherwise be dropped during initial load.
  useEffect(() => {
    if (!ready || !isModelView) return
    if (selected.id !== urlSource) return
    if (history.history.length === 0) return
    const target = urlFocusValue
    if (target === lastAppliedFocusRef.current) return
    lastAppliedFocusRef.current = target
    if (target === focusValue) return
    focusTransitionRef.current = true
    const step = matchHistoryNeighbor(history, target ?? null)
    if (step === 'back') diagram.navigate('back')
    else if (step === 'forward') diagram.navigate('forward')
    else diagram.focusWithinView(target ?? null)
  }, [ready, isModelView, urlFocusValue, urlSource, selected.id, focusValue, history, diagram])

  // URL → diagram: diff display mode (toggle popstate, deep link). Acts only when the URL
  // mode itself changed; a user full/diff toggle changes `modeState` with the URL mode
  // unchanged and must not be reverted.
  const prevUrlModeRef = useRef(urlMode)
  useEffect(() => {
    if (!ready || !isModelView) return
    if (selected.source !== 'change-derived-view') return
    const prev = prevUrlModeRef.current
    prevUrlModeRef.current = urlMode
    if (prev === urlMode) return
    if (urlMode === modeState) return
    modeTransitionRef.current = true
    setMode(urlMode)
  }, [ready, isModelView, urlMode, modeState, selected.source, setMode])

  // diagram → URL: mirror focus/source/mode changes with push/replace semantics. URL values are
  // read via refs so the mirror reacts only to diagram state changes, never to external URL
  // changes (popstate/deep link).
  useEffect(() => {
    if (!ready || !isModelView) return
    if (sourceTransitionRef.current || modeTransitionRef.current) {
      sourceTransitionRef.current = false
      modeTransitionRef.current = false
      return
    }
    if (focusTransitionRef.current) {
      // A URL-driven focus sync is settling; clear once the diagram focus reaches the target.
      if (focusValue === urlFocusValueRef.current) focusTransitionRef.current = false
      return
    }
    // The URL may not carry the params on first load; compare against the defaults.
    const urlSourceValue = urlSourceRef.current ?? 'model'
    const urlModeValue = urlModeRef.current ?? 'full'
    const urlFocus = urlFocusValueRef.current
    if (selected.id === urlSourceValue && effectiveMode === urlModeValue && focusValue === urlFocus) {
      // The URL already reflects the diagram state; no push is pending.
      lastPushedRef.current = null
      return
    }
    const next = { source: selected.id, mode: effectiveMode, focus: focusValue }
    if (lastPushedRef.current
      && lastPushedRef.current.source === next.source
      && lastPushedRef.current.mode === next.mode
      && (lastPushedRef.current.focus ?? undefined) === (next.focus ?? undefined)) {
      return
    }
    if (selected.id !== urlSourceValue) {
      // A source switch resets the focus to the root within the same history step, so the
      // committed entry never carries the pre-switch focus. The commit is deferred so an
      // incidental source reset while navigating to an Authored View does not overwrite the
      // in-flight view navigation.
      const target = { source: selected.id, mode: effectiveMode, focus: undefined }
      lastPushedRef.current = target
      setTimeout(() => {
        if (currentViewIdRef.current !== 'model') return
        commitUrl('push', target)
      }, 0)
      return
    }
    if (focusValue !== urlFocus) {
      lastPushedRef.current = next
      commitUrl(classifyFocusUrlChange(history), next)
      return
    }
    lastPushedRef.current = next
    commitUrl('push', next)
  }, [ready, isModelView, focusIdentity, history, selected.id, modeState, selected.source, effectiveMode, commitUrl, focusValue])

  // Authored View routes must not carry Xirang navigation params.
  useEffect(() => {
    if (isModelView) return
    if (!urlSource && !urlFocus && !urlMode) return
    void navigate({
      to: './',
      replace: true,
      viewTransition: false,
      search: (prev: Record<string, unknown>) => {
        const { source: _source, focus: _focus, mode: _mode, ...rest } = prev
        return rest
      },
    })
  }, [isModelView, urlSource, urlFocus, urlMode, navigate])

  return null
}
