import { css } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { NativeSelect } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { type XirangRuntimeManifest, type XirangViewMode, type XirangViewSource, useXirangViewSources } from '@likec4/diagram'
import { HttpProjectionLoader } from './HttpProjectionLoader'
import { selectDiagramSnapshot, useDiagramActorRef, useDiagramSelector } from '@likec4/diagram'
import { type DiagramView } from '@likec4/core/types'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react'

type XirangChangeSource = Omit<XirangViewSource, 'id' | 'source'> & { change: string }

const projectionLoader = new HttpProjectionLoader<DiagramView>()

export type SemanticBrowserViewSelection = 'model' | string
export type SemanticBrowserChangeSelection = string | null
export type SemanticBrowserMode = 'complete' | 'complete-with-diff' | 'diff-only'

export interface SemanticBrowserState {
  viewSelection: SemanticBrowserViewSelection
  changeSelection: SemanticBrowserChangeSelection
  presentationMode: SemanticBrowserMode
  focus: string | null
  expanded: ReadonlySet<string>
}

export interface SemanticBrowserUrlState {
  view?: string
  change?: string
  mode?: SemanticBrowserMode
  focus?: string
}

export interface SemanticBrowserHistoryState {
  expanded: string[]
}

export type SemanticBrowserAction =
  | { type: 'view.select'; view: string }
  | { type: 'change.select'; change: string | null }
  | { type: 'mode.select'; mode: SemanticBrowserMode }
  | { type: 'focus.select'; focus: string | null }
  | { type: 'expanded.set'; expanded: Iterable<string> }
  | { type: 'expanded.toggle'; identity: string }

export interface ProjectionRequestDescriptor {
  viewId: string
  change: string | null
  mode: SemanticBrowserMode
  focus: string | null
  expanded: string[]
  expectedFingerprint: string
}

export interface SemanticBrowserProjectionLoader<T = unknown> {
  load(request: ProjectionRequestDescriptor, signal: AbortSignal): Promise<T>
}

export interface SemanticBrowserControllerValue {
  manifest: SemanticBrowserManifest
  state: SemanticBrowserState
  dispatch(action: SemanticBrowserAction): void
  selectView(view: string): void
  selectChange(change: string | null): void
  selectMode(mode: SemanticBrowserMode): void
  selectFocus(focus: string | null): void
  setExpanded(expanded: Iterable<string>): void
}

export interface SemanticBrowserManifest {
  version: 4
  modelFingerprint: string
  model: XirangViewSource
  authoredViews: Record<string, { title: string; selection: string[]; roots: string[]; virtualRoot: boolean }>
  changes: Record<string, XirangChangeSource>
  candidate?: XirangViewSource
  candidateDiff?: XirangViewSource
}

function sourceForView(manifest: SemanticBrowserManifest, view: string): string[] {
  if (view === 'model') return identities(manifest.model)
  if (view === 'candidate') return manifest.candidate ? identities(manifest.candidate) : []
  if (view === 'candidate-diff') return manifest.candidateDiff ? identities(manifest.candidateDiff) : []
  return manifest.authoredViews[view]?.selection ?? []
}

function identities(source: XirangViewSource): string[] {
  return (source.architecture?.elements ?? []).map(element => element.declaration.identity)
}

function validViews(manifest: SemanticBrowserManifest): Set<string> {
  return new Set([
    'model',
    ...Object.keys(manifest.authoredViews),
    ...(manifest.candidate ? ['candidate'] : []),
    ...(manifest.candidateDiff ? ['candidate-diff'] : []),
  ])
}

function validChanges(manifest: SemanticBrowserManifest): Set<string> {
  return new Set(Object.keys(manifest.changes))
}

function defaultMode(change: string | null): SemanticBrowserMode {
  return change === null ? 'complete' : 'complete-with-diff'
}

function clampState(state: SemanticBrowserState, manifest: SemanticBrowserManifest): SemanticBrowserState {
  const viewSelection = validViews(manifest).has(state.viewSelection) ? state.viewSelection : 'model'
  const candidateView = viewSelection === 'candidate' || viewSelection === 'candidate-diff'
  const changeSelection = !candidateView && state.changeSelection && validChanges(manifest).has(state.changeSelection)
    ? state.changeSelection
    : null
  const changeSource = state.changeSelection ? manifest.changes[state.changeSelection] : undefined
  const allowed = new Set([
    ...sourceForView(manifest, viewSelection),
    ...(changeSource?.architecture?.elements ?? []).map(element => element.declaration.identity),
  ])
  const focus = state.focus && allowed.has(state.focus) ? state.focus : null
  const expanded = new Set([...state.expanded].filter(identity => allowed.has(identity)))
  const presentationMode = viewSelection === 'candidate-diff'
    ? 'diff-only'
    : viewSelection === 'candidate'
    ? 'complete'
    : changeSelection === null
    ? 'complete'
    : state.presentationMode
  return { viewSelection, changeSelection, presentationMode, focus, expanded }
}

export function createSemanticBrowserState(
  manifest: SemanticBrowserManifest,
  url: SemanticBrowserUrlState = {},
  history: SemanticBrowserHistoryState = { expanded: [] },
): SemanticBrowserState {
  const change = url.change && validChanges(manifest).has(url.change) ? url.change : null
  const mode = url.mode === 'diff-only' || url.mode === 'complete-with-diff' || url.mode === 'complete'
    ? url.mode
    : defaultMode(change)
  return clampState({
    viewSelection: url.view && validViews(manifest).has(url.view) ? url.view : 'model',
    changeSelection: change,
    presentationMode: mode,
    focus: url.focus ?? null,
    expanded: new Set(history.expanded),
  }, manifest)
}

export function reduceSemanticBrowserState(
  state: SemanticBrowserState,
  action: SemanticBrowserAction,
  manifest: SemanticBrowserManifest,
): SemanticBrowserState {
  switch (action.type) {
    case 'view.select':
      return clampState({ ...state, viewSelection: action.view }, manifest)
    case 'change.select':
      return clampState({
        ...state,
        changeSelection: action.change,
        presentationMode: defaultMode(action.change),
      }, manifest)
    case 'mode.select':
      return clampState({
        ...state,
        presentationMode: state.changeSelection === null ? 'complete' : action.mode,
      }, manifest)
    case 'focus.select':
      return clampState({ ...state, focus: action.focus }, manifest)
    case 'expanded.set':
      return clampState({ ...state, expanded: new Set(action.expanded) }, manifest)
    case 'expanded.toggle': {
      const expanded = new Set(state.expanded)
      if (expanded.has(action.identity)) expanded.delete(action.identity)
      else expanded.add(action.identity)
      return clampState({ ...state, expanded }, manifest)
    }
  }
}

export function encodeSemanticBrowserUrl(state: SemanticBrowserState): SemanticBrowserUrlState {
  return {
    ...(state.viewSelection !== 'model' ? { view: state.viewSelection } : {}),
    ...(state.changeSelection ? { change: state.changeSelection } : {}),
    ...(state.changeSelection && state.presentationMode !== 'complete-with-diff'
      ? { mode: state.presentationMode }
      : {}),
    ...(state.focus ? { focus: state.focus } : {}),
  }
}

export function historyStateForSemanticBrowser(state: SemanticBrowserState): SemanticBrowserHistoryState {
  return { expanded: [...state.expanded].sort() }
}

export function projectionRequestForSemanticBrowser(
  state: SemanticBrowserState,
  modelFingerprint: string,
): ProjectionRequestDescriptor {
  return {
    viewId: state.viewSelection,
    change: state.changeSelection,
    mode: state.presentationMode,
    focus: state.focus,
    expanded: [...state.expanded].sort(),
    expectedFingerprint: modelFingerprint,
  }
}

const SemanticBrowserControllerContext = createContext<SemanticBrowserControllerValue | null>(null)

export function SemanticBrowserControllerProvider({
  manifest,
  initialUrl,
  initialHistory,
  children,
}: PropsWithChildren<{
  manifest: SemanticBrowserManifest
  initialUrl?: SemanticBrowserUrlState
  initialHistory?: SemanticBrowserHistoryState
}>) {
  const [state, setState] = useState(() => createSemanticBrowserState(manifest, initialUrl, initialHistory))
  useEffect(() => {
    setState(current => clampState(current, manifest))
  }, [manifest])
  const dispatch = (action: SemanticBrowserAction) => {
    setState(current => reduceSemanticBrowserState(current, action, manifest))
  }
  const value = useMemo<SemanticBrowserControllerValue>(() => ({
    manifest,
    state,
    dispatch,
    selectView: view => dispatch({ type: 'view.select', view }),
    selectChange: change => dispatch({ type: 'change.select', change }),
    selectMode: mode => dispatch({ type: 'mode.select', mode }),
    selectFocus: focus => dispatch({ type: 'focus.select', focus }),
    setExpanded: expanded => dispatch({ type: 'expanded.set', expanded }),
  }), [manifest, state])
  return <SemanticBrowserControllerContext.Provider value={value}>{children}</SemanticBrowserControllerContext.Provider>
}

export function SemanticBrowserRuntimeProvider({
  loader,
  children,
}: PropsWithChildren<{
  loader: { manifest?(signal: AbortSignal): Promise<unknown>; subscribeManifest?(listener: () => void): () => void }
}>) {
  const [manifest, setManifest] = useState<SemanticBrowserManifest | null>(null)
  useEffect(() => {
    if (!loader.manifest) return
    let active = true
    let controller = new AbortController()
    const load = () => {
      controller.abort()
      controller = new AbortController()
      void loader.manifest!(controller.signal).then(payload => {
        if (!active || controller.signal.aborted) return
        setManifest(payload as SemanticBrowserManifest)
      }).catch(() => undefined)
    }
    load()
    const unsubscribe = loader.subscribeManifest?.(load)
    return () => {
      active = false
      controller.abort()
      unsubscribe?.()
    }
  }, [loader])

  if (!manifest) return <>{children}</>
  return <SemanticBrowserControllerProvider manifest={manifest}>{children}</SemanticBrowserControllerProvider>
}

export function SemanticBrowserRouteSync() {
  const controller = useContext(SemanticBrowserControllerContext)
  const navigate = useNavigate()
  const search = useSearch({ from: '__root__' })
  const runtime = useXirangViewSources()
  const actorRef = useDiagramActorRef()
  const diagramFocus = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.focusIdentity))
  const diagramExpanded = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.expandedNodes))
  const initializedUrl = useRef(false)
  const applyingUrl = useRef(false)
  const seenUrl = useRef('')
  const pendingUrl = useRef<string | null>(null)
  const lastCommitted = useRef('')

  useEffect(() => {
    if (!controller) return
    runtime.select(controller.state.viewSelection)
    const abort = new AbortController()
    const request = projectionRequestForSemanticBrowser(controller.state, controller.manifest.modelFingerprint)
    // Defer the request by one microtask and check the abort signal before sending so
    // React StrictMode's mount→cleanup→mount double-fire in dev never ships a
    // throwaway projection request that the cleanup would abort anyway.
    void Promise.resolve().then(async () => {
      if (abort.signal.aborted) return
      try {
        const result = await projectionLoader.load(request, abort.signal)
        if (abort.signal.aborted) return
        runtime.applyBrowserProjection({
          viewId: controller.state.viewSelection,
          change: controller.state.changeSelection,
          mode: controller.state.presentationMode === 'diff-only' ? 'diff' : 'full',
          showDiff: controller.state.presentationMode !== 'complete',
          projectionKey: result.projectionKey,
          view: result.view,
        })
        // The controller (URL / selection) is the single source of truth for focus.
        // Drive the actor once per projection apply rather than reactively, so the
        // controller→actor and actor→controller syncs cannot fight and oscillate.
        actorRef.send({ type: 'navigate.focus', focusIdentity: request.focus ?? null, replaceHistory: true })
      } catch (error) {
        if (!abort.signal.aborted) console.error('Unable to load Semantic Browser projection', error)
      }
    })
    return () => abort.abort()
  }, [controller?.manifest.modelFingerprint, controller?.state, runtime.applyBrowserProjection, runtime.select])

  useEffect(() => {
    if (!controller) return
    const current = JSON.stringify({
      view: search.view === 'model' ? undefined : search.view,
      change: search.change,
      mode: search.mode === 'complete' ? undefined : search.mode,
      focus: search.focus,
    })
    if (current === seenUrl.current) return
    if (current === pendingUrl.current) {
      pendingUrl.current = null
      seenUrl.current = current
      return
    }
    if (pendingUrl.current !== null) return
    seenUrl.current = current
    initializedUrl.current = true
    if (current === lastCommitted.current) return
    applyingUrl.current = true
    controller.dispatch({ type: 'view.select', view: search.view })
    controller.dispatch({ type: 'change.select', change: search.change ?? null })
    controller.dispatch({ type: 'mode.select', mode: search.mode })
    controller.dispatch({ type: 'focus.select', focus: search.focus ?? null })
  }, [controller, search.change, search.focus, search.mode, search.view])

  useEffect(() => {
    if (!controller || !initializedUrl.current) return
    const next = encodeSemanticBrowserUrl(controller.state)
    const key = JSON.stringify(next)
    const current = JSON.stringify({ view: search.view === 'model' ? undefined : search.view, change: search.change, mode: search.mode === 'complete' ? undefined : search.mode, focus: search.focus })
    if (applyingUrl.current) {
      if (key === current) {
        applyingUrl.current = false
        lastCommitted.current = current
      }
      return
    }
    if (key === lastCommitted.current) return
    if (key === current) return
    lastCommitted.current = key
    pendingUrl.current = key
    void navigate({
      to: './',
      viewTransition: false,
      search: previous => {
        const nextSearch = { ...previous, ...next }
        for (const key of ['view', 'change', 'mode', 'focus'] as const) {
          if (!(key in next)) delete nextSearch[key]
        }
        return nextSearch
      },
    })
  }, [controller, navigate, search.change, search.focus, search.mode, search.view, controller?.state])

  const architectureRoot = runtime.selected.roots?.[0]
    ?? runtime.selected.architecture?.elements.find(element => element.declaration.parent === null)?.declaration.identity
  const diagramTargetFocus = diagramFocus ?? architectureRoot ?? null
  const diagramExpandedKey = JSON.stringify([...diagramExpanded].sort())
  const controllerExpandedKey = JSON.stringify([...(controller?.state.expanded ?? [])].sort())
  const previousDiagramExpanded = useRef(diagramExpandedKey)
  const previousControllerExpanded = useRef(controllerExpandedKey)

  useEffect(() => {
    if (!controller || !architectureRoot) return
    const diagramChanged = diagramExpandedKey !== previousDiagramExpanded.current
    const controllerChanged = controllerExpandedKey !== previousControllerExpanded.current
    previousDiagramExpanded.current = diagramExpandedKey
    previousControllerExpanded.current = controllerExpandedKey
    if (diagramExpandedKey === controllerExpandedKey) return
    if (diagramChanged && !controllerChanged) {
      controller.dispatch({ type: 'expanded.set', expanded: diagramExpanded })
      return
    }
    actorRef.send({ type: 'expand.set', expanded: new Set(controller.state.expanded) })
  }, [actorRef, architectureRoot, controller, controllerExpandedKey, diagramExpanded, diagramExpandedKey])

  useEffect(() => {
    if (!controller || !architectureRoot) return
    const semanticFocus = diagramTargetFocus === architectureRoot ? null : diagramTargetFocus
    if (semanticFocus === null) {
      // The actor is at the model root. Clear the controller focus only when the user
      // explicitly navigated to the root element (breadcrumb click, diagramFocus is the
      // root id); when the actor is still at its default null state a deep-link
      // projection is in flight and the controller focus must not be cleared.
      if (diagramFocus === architectureRoot && controller.state.focus !== null) {
        controller.dispatch({ type: 'focus.select', focus: null })
      }
      return
    }
    if (semanticFocus !== controller.state.focus) {
      controller.dispatch({ type: 'focus.select', focus: semanticFocus })
    }
  }, [architectureRoot, controller, diagramFocus, diagramTargetFocus])
  useEffect(() => {
    if (!controller) return
    const state = historyStateForSemanticBrowser(controller.state)
    const serialized = JSON.stringify(state)
    // Only write when the Xirang history payload actually differs. Writing a fresh
    // state object on every effect run notifies the router (TanStack patches
    // replaceState), which can re-mount this route and re-run the effect forever.
    const current = (window.history.state as { xirang?: SemanticBrowserHistoryState } | null)?.xirang
    if (current && JSON.stringify(current) === serialized) return
    window.history.replaceState({ ...window.history.state, xirang: state }, '')
  }, [controller, controller?.state])

  return null
}

const semanticBrowserControlsBar = hstack({
  layerStyle: 'likec4.panel',
  position: 'relative',
  gap: 'xs',
  pointerEvents: 'all',
  width: 'max-content',
  maxWidth: 'calc(100vw - 2 * {spacing.xs})',
  flexWrap: 'wrap',
})

/**
 * Mobile: rendered as a canvas child so the chip pans with the flow and never
 * blocks nodes brought into view; the fixed panel slot would cover them.
 */
const semanticBrowserControlsChip = css({
  position: 'absolute',
  top: '[44px]',
  left: '0',
  margin: 'xs',
  layerStyle: 'likec4.panel',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'xs',
  minHeight: '40px',
  pointerEvents: 'all',
  width: 'max-content',
  maxWidth: 'calc(100vw - 2 * {spacing.xs})',
  zIndex: 5,
})

function SemanticBrowserControlsSelects() {
  const controller = useContext(SemanticBrowserControllerContext)
  if (!controller) return null
  const { manifest, state, selectView, selectChange, selectMode } = controller
  const viewOptions = [
    { value: 'model', label: 'Model View' },
    ...Object.entries(manifest.authoredViews).map(([id, view]) => ({ value: id, label: view.title })),
  ]
  const changeOptions = [
    { value: '', label: 'No Change' },
    ...Object.entries(manifest.changes).map(([id, change]) => ({ value: id, label: change.label })),
  ]
  const modeOptions = [
    { value: 'complete', label: 'Complete' },
    { value: 'complete-with-diff', label: 'Complete with diff', disabled: state.changeSelection === null },
    { value: 'diff-only', label: 'Diff only', disabled: state.changeSelection === null },
  ]
  return (
    <>
      <NativeSelect
        aria-label="View Selection"
        label="View"
        size="xs"
        value={state.viewSelection}
        data={viewOptions}
        onChange={event => selectView(event.currentTarget.value)}
      />
      <NativeSelect
        aria-label="Change Selection"
        label="Change"
        size="xs"
        value={state.changeSelection ?? ''}
        data={changeOptions}
        onChange={event => selectChange(event.currentTarget.value || null)}
      />
      <NativeSelect
        aria-label="Presentation Mode"
        label="Mode"
        size="xs"
        value={state.presentationMode}
        data={modeOptions}
        onChange={event => selectMode(event.currentTarget.value as SemanticBrowserMode)}
      />
    </>
  )
}

function SemanticBrowserControlsShell({ className }: { className: string }) {
  const controller = useContext(SemanticBrowserControllerContext)
  if (!controller) return null
  if (controller.state.viewSelection === 'candidate' || controller.state.viewSelection === 'candidate-diff') return null
  return (
    <div
      className={className}
      data-xirang-controller
      role="toolbar"
      aria-label="Semantic Browser controls">
      <SemanticBrowserControlsSelects />
    </div>
  )
}

/** Desktop: rendered in the navigation panel slot, merged into the top-left chrome. */
export function SemanticBrowserControls() {
  const isDesktop = useMediaQuery('(min-width: 48em)') ?? true
  if (!isDesktop) return null
  return <SemanticBrowserControlsShell className={semanticBrowserControlsBar} />
}

/** Mobile: rendered in the diagram canvas so it pans with the flow. */
export function SemanticBrowserMobileControls() {
  const isDesktop = useMediaQuery('(min-width: 48em)') ?? true
  if (isDesktop) return null
  return <SemanticBrowserControlsShell className={semanticBrowserControlsChip} />
}

export function useSemanticBrowserController(): SemanticBrowserControllerValue {
  const value = useContext(SemanticBrowserControllerContext)
  if (!value) throw new Error('SemanticBrowserControllerProvider is required')
  return value
}

export function effectiveModeForSource(source: XirangViewSource['source'], mode: SemanticBrowserMode): XirangViewMode {
  if (source === 'candidate-diff') return 'diff'
  if (source === 'candidate') return 'full'
  return mode === 'diff-only' ? 'diff' : 'full'
}

export type { XirangRuntimeManifest }
