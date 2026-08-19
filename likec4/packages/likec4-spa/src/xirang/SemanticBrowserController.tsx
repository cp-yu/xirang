import { css } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { NativeSelect } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { type XirangRuntimeManifest, type XirangViewSource, useXirangViewSources } from '@likec4/diagram'
import { HttpProjectionLoader } from './HttpProjectionLoader'
import type { SearchParams } from '../searchParams'
import { selectDiagramSnapshot, useDiagramActorRef, useDiagramSelector } from '@likec4/diagram'
import { type DiagramView } from '@likec4/core/types'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react'

type XirangChangeSource = Omit<XirangViewSource, 'id' | 'source'> & { change: string }

const projectionLoader = new HttpProjectionLoader<DiagramView>()

export type SemanticBrowserViewSelection = 'full-model' | string
export type SemanticBrowserModelSelection = 'semantic-model' | 'candidate' | `change:${string}`
export type SemanticBrowserMode = 'complete' | 'complete-with-diff' | 'diff-only'

export interface SemanticBrowserState {
  modelSelection: SemanticBrowserModelSelection
  viewSelection: SemanticBrowserViewSelection
  presentationMode: SemanticBrowserMode
  focus: string | null
  expanded: ReadonlySet<string>
}

export interface SemanticBrowserUrlState {
  view?: string
  model?: string
  mode?: SemanticBrowserMode
  focus?: string
}

export interface SemanticBrowserHistoryState {
  expanded: string[]
}

export type SemanticBrowserAction =
  | { type: 'view.select'; view: string }
  | { type: 'model.select'; model: SemanticBrowserModelSelection }
  | { type: 'mode.select'; mode: SemanticBrowserMode }
  | { type: 'focus.select'; focus: string | null }
  | { type: 'expanded.set'; expanded: Iterable<string> }
  | { type: 'expanded.toggle'; identity: string }

export interface ProjectionRequestDescriptor {
  viewId: string
  model: SemanticBrowserModelSelection
  mode: SemanticBrowserMode
  focus: string | null
  expanded: string[]
  expectedFingerprint: string
}

export interface ProjectionRequestDescriptor {
  viewId: string
  model: SemanticBrowserModelSelection
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
  selectModel(model: SemanticBrowserModelSelection): void
  selectMode(mode: SemanticBrowserMode): void
  selectFocus(focus: string | null): void
  setExpanded(expanded: Iterable<string>): void
}

export interface SemanticBrowserManifest {
  version: 5
  modelFingerprint: string
  model: XirangViewSource
  authoredViews: Record<string, { title: string; selection: string[]; roots: string[]; virtualRoot: boolean }>
  changes: Record<string, XirangChangeSource>
  candidate?: XirangViewSource
}

function modelViewKey(model: SemanticBrowserModelSelection): string | null {
  return model.startsWith('change:') ? model.slice('change:'.length) : null
}

function sourceForModel(manifest: SemanticBrowserManifest, model: SemanticBrowserModelSelection): XirangChangeSource | XirangViewSource | undefined {
  if (model === 'semantic-model') return manifest.model
  if (model === 'candidate') return manifest.candidate
  return manifest.changes[modelViewKey(model)!]
}

/** Authored Views resolved against the browsed model instance; empty selections are unselectable. */
function sourceViewsFor(manifest: SemanticBrowserManifest, model: SemanticBrowserModelSelection) {
  const views = model === 'semantic-model'
    ? manifest.authoredViews
    : (sourceForModel(manifest, model) as { authoredViews?: SemanticBrowserManifest['authoredViews'] } | undefined)?.authoredViews ?? {}
  return Object.fromEntries(Object.entries(views).filter(([, view]) => view.selection.length > 0))
}

function sourceForView(
  manifest: SemanticBrowserManifest,
  model: SemanticBrowserModelSelection,
  view: string,
): string[] {
  if (view === 'full-model') {
    return (sourceForModel(manifest, model)?.architecture?.elements ?? []).map(element => element.declaration.identity)
  }
  return sourceViewsFor(manifest, model)[view]?.selection ?? []
}

function validViews(manifest: SemanticBrowserManifest, model: SemanticBrowserModelSelection): Set<string> {
  return new Set(['full-model', ...Object.keys(sourceViewsFor(manifest, model))])
}

function validModels(manifest: SemanticBrowserManifest): Set<SemanticBrowserModelSelection> {
  return new Set([
    'semantic-model',
    ...(manifest.candidate ? ['candidate' as const] : []),
    ...Object.keys(manifest.changes).map(change => `change:${change}` as const),
  ])
}

function defaultMode(model: SemanticBrowserModelSelection): SemanticBrowserMode {
  return model === 'semantic-model' || model === 'candidate' ? 'complete' : 'complete-with-diff'
}

function normalizeMode(model: SemanticBrowserModelSelection, requestedMode?: SemanticBrowserMode): SemanticBrowserMode {
  return model === 'semantic-model' ? 'complete' : (requestedMode ?? defaultMode(model))
}

/** Identities the actor may focus in a view; shared by clamping and the actor→controller mirror. */
function focusableIdentities(
  state: Pick<SemanticBrowserState, 'modelSelection' | 'viewSelection'>,
  manifest: SemanticBrowserManifest,
): Set<string> {
  return new Set(sourceForView(manifest, state.modelSelection, state.viewSelection))
}

/**
 * Focus the controller should mirror from the actor: `'clear'` when the actor reached the
 * view root (breadcrumb click), a focus identity when the actor navigated inside the view,
 * or `null` when the controller already agrees or the actor focus is outside the view.
 * Out-of-view actor focus must never be mirrored: the clamp would reject it and the effect
 * would re-fire forever, starving in-flight projections.
 */
export function mirrorActorFocus(
  state: SemanticBrowserState,
  manifest: SemanticBrowserManifest,
  diagramFocus: string | null,
  architectureRoot: string,
): 'clear' | string | null {
  const semanticFocus = (diagramFocus ?? architectureRoot) === architectureRoot ? null : diagramFocus
  if (semanticFocus === null) {
    // Clear only when the user explicitly navigated to the root element (breadcrumb click,
    // diagramFocus is the root id); a null actor focus means a deep-link projection is in
    // flight and the controller focus must not be cleared.
    return diagramFocus === architectureRoot && state.focus !== null ? 'clear' : null
  }
  return semanticFocus !== state.focus && focusableIdentities(state, manifest).has(semanticFocus) ? semanticFocus : null
}

function clampState(state: SemanticBrowserState, manifest: SemanticBrowserManifest): SemanticBrowserState {
  const modelSelection = validModels(manifest).has(state.modelSelection) ? state.modelSelection : 'semantic-model'
  const viewSelection = validViews(manifest, modelSelection).has(state.viewSelection) ? state.viewSelection : 'full-model'
  const normalizedState = { ...state, modelSelection, viewSelection }
  const allowed = focusableIdentities(normalizedState, manifest)
  const focus = state.focus && allowed.has(state.focus) ? state.focus : null
  const expanded = new Set([...state.expanded].filter(identity => allowed.has(identity)))
  const presentationMode = normalizeMode(modelSelection, state.presentationMode)
  return { modelSelection, viewSelection, presentationMode, focus, expanded }
}

export function reconcileSemanticBrowserState(
  state: SemanticBrowserState,
  manifest: SemanticBrowserManifest,
): SemanticBrowserState {
  const modelRemoved = state.modelSelection !== 'semantic-model' && !validModels(manifest).has(state.modelSelection)
  return clampState(modelRemoved ? { ...state, expanded: new Set() } : state, manifest)
}

export function createSemanticBrowserState(
  manifest: SemanticBrowserManifest,
  url: SemanticBrowserUrlState = {},
  history: SemanticBrowserHistoryState = { expanded: [] },
): SemanticBrowserState {
  const requestedModel = url.model === 'candidate' || (url.model?.startsWith('change:') && url.model.length > 'change:'.length)
    ? url.model as SemanticBrowserModelSelection
    : 'semantic-model'
  const modelSelection = validModels(manifest).has(requestedModel) ? requestedModel : 'semantic-model'
  const requestedMode = url.mode === 'diff-only' || url.mode === 'complete-with-diff' || url.mode === 'complete'
    ? url.mode
    : undefined
  const mode = normalizeMode(modelSelection, requestedMode)
  return clampState({
    modelSelection,
    viewSelection: url.view && validViews(manifest, modelSelection).has(url.view) ? url.view : 'full-model',
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
    case 'model.select':
      return clampState({
        ...state,
        modelSelection: action.model,
        presentationMode: defaultMode(action.model),
      }, manifest)
    case 'mode.select':
      return clampState({
        ...state,
        presentationMode: state.modelSelection === 'semantic-model' ? 'complete' : action.mode,
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
    ...(state.viewSelection !== 'full-model' ? { view: state.viewSelection } : {}),
    ...(state.modelSelection !== 'semantic-model' ? { model: state.modelSelection } : {}),
    ...(state.modelSelection !== 'semantic-model' && state.presentationMode !== defaultMode(state.modelSelection)
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
    model: state.modelSelection,
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
    setState(current => reconcileSemanticBrowserState(current, manifest))
  }, [manifest])
  const dispatch = (action: SemanticBrowserAction) => {
    setState(current => reduceSemanticBrowserState(current, action, manifest))
  }
  const value = useMemo<SemanticBrowserControllerValue>(() => ({
    manifest,
    state,
    dispatch,
    selectView: view => dispatch({ type: 'view.select', view }),
    selectModel: model => dispatch({ type: 'model.select', model }),
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

/** Canonical URL-state key shared by the URL-apply and URL-commit effects; they must never drift. */
function canonicalSearchKey(search: Pick<SearchParams, 'view' | 'model' | 'mode' | 'focus'>): string {
  const model = (search.model === 'candidate' || search.model?.startsWith('change:')
    ? search.model
    : 'semantic-model') as SemanticBrowserModelSelection
  const normalizedMode = normalizeMode(model, search.mode)
  return JSON.stringify({
    view: search.view === 'full-model' ? undefined : search.view,
    model: search.model,
    mode: normalizedMode === defaultMode(model) ? undefined : normalizedMode,
    focus: search.focus,
  })
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
          model: controller.state.modelSelection,
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
    const current = canonicalSearchKey(search)
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
    controller.dispatch({
      type: 'model.select',
      model: search.model === 'candidate' || search.model?.startsWith('change:')
        ? search.model as SemanticBrowserModelSelection
        : 'semantic-model',
    })
    controller.dispatch({ type: 'mode.select', mode: search.mode ?? defaultMode('semantic-model') })
    controller.dispatch({ type: 'focus.select', focus: search.focus ?? null })
  }, [controller, search.model, search.focus, search.mode, search.view])

  useEffect(() => {
    if (!controller || !initializedUrl.current) return
    const next = encodeSemanticBrowserUrl(controller.state)
    const key = JSON.stringify(next)
    const current = canonicalSearchKey(search)
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
        for (const key of ['view', 'model', 'mode', 'focus'] as const) {
          if (!(key in next)) delete nextSearch[key]
        }
        return nextSearch
      },
    })
  }, [controller, navigate, search.model, search.focus, search.mode, search.view, controller?.state])

  const architectureRoot = runtime.selected.roots?.[0]
    ?? runtime.selected.architecture?.elements.find(element => element.declaration.parent === null)?.declaration.identity
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
    const mirrored = mirrorActorFocus(controller.state, controller.manifest, diagramFocus, architectureRoot)
    if (mirrored === 'clear') controller.dispatch({ type: 'focus.select', focus: null })
    else if (mirrored !== null) controller.dispatch({ type: 'focus.select', focus: mirrored })
  }, [architectureRoot, controller, diagramFocus])
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
  const { manifest, state, selectView, selectModel, selectMode } = controller
  const viewOptions = [
    { value: 'full-model', label: manifest.model.label ?? 'Full Model' },
    ...Object.entries(sourceViewsFor(manifest, state.modelSelection))
      .map(([id, view]) => ({ value: id, label: view.title })),
  ]
  const modelOptions = [
    { value: 'semantic-model', label: 'Semantic Model' },
    ...(manifest.candidate ? [{ value: 'candidate', label: manifest.candidate.label ?? 'Candidate' }] : []),
    ...Object.entries(manifest.changes).map(([id, change]) => ({ value: `change:${id}`, label: change.label })),
  ]
  const modeOptions = state.modelSelection === 'semantic-model'
    ? [
        { value: 'complete', label: 'Complete' },
        { value: 'complete-with-diff', label: 'Complete with diff', disabled: true },
        { value: 'diff-only', label: 'Diff only', disabled: true },
      ]
    : [
        { value: 'complete', label: 'Complete' },
        { value: 'complete-with-diff', label: 'Complete with diff' },
        { value: 'diff-only', label: 'Diff only' },
      ]
  return (
    <>
      <NativeSelect
        aria-label="Model Selection"
        label="Model"
        size="xs"
        value={state.modelSelection}
        data={modelOptions}
        onChange={event => selectModel(event.currentTarget.value as SemanticBrowserModelSelection)}
      />
      <NativeSelect
        aria-label="View Selection"
        label="View"
        size="xs"
        value={state.viewSelection}
        data={viewOptions}
        onChange={event => selectView(event.currentTarget.value)}
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

export type { XirangRuntimeManifest }
