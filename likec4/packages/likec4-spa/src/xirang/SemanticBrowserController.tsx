import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import type { XirangRuntimeManifest, XirangViewMode, XirangViewSource } from '@likec4/diagram'

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
  changes: Record<string, XirangViewSource>
  candidate?: XirangViewSource
  candidateDiff?: XirangViewSource
}

function sourceForView(manifest: SemanticBrowserManifest, view: string): string[] {
  if (view === 'model') return identities(manifest.model)
  return manifest.authoredViews[view]?.selection ?? []
}

function identities(source: XirangViewSource): string[] {
  return (source.architecture?.elements ?? []).map(element => element.declaration.identity)
}

function validViews(manifest: SemanticBrowserManifest): Set<string> {
  return new Set(['model', ...Object.keys(manifest.authoredViews)])
}

function validChanges(manifest: SemanticBrowserManifest): Set<string> {
  return new Set(Object.keys(manifest.changes))
}

function defaultMode(change: string | null): SemanticBrowserMode {
  return change === null ? 'complete' : 'complete-with-diff'
}

function clampState(state: SemanticBrowserState, manifest: SemanticBrowserManifest): SemanticBrowserState {
  const viewSelection = validViews(manifest).has(state.viewSelection) ? state.viewSelection : 'model'
  const changeSelection = state.changeSelection && validChanges(manifest).has(state.changeSelection)
    ? state.changeSelection
    : null
  const allowed = new Set(sourceForView(manifest, viewSelection))
  const focus = state.focus && allowed.has(state.focus) ? state.focus : null
  const expanded = new Set([...state.expanded].filter(identity => allowed.has(identity)))
  const presentationMode = changeSelection === null
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

export function SemanticBrowserControls() {
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
    <div data-xirang-controller role="toolbar" aria-label="Semantic Browser controls">
      <select aria-label="View Selection" value={state.viewSelection} onChange={event => selectView(event.currentTarget.value)}>
        {viewOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <select aria-label="Change Selection" value={state.changeSelection ?? ''} onChange={event => selectChange(event.currentTarget.value || null)}>
        {changeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <select aria-label="Presentation Mode" value={state.presentationMode} onChange={event => selectMode(event.currentTarget.value as SemanticBrowserMode)}>
        {modeOptions.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
    </div>
  )
}

export function useSemanticBrowserController(): SemanticBrowserControllerValue {
  const value = useContext(SemanticBrowserControllerContext)
  if (!value) throw new Error('SemanticBrowserControllerProvider is required')
  return value
}

export function effectiveModeForSource(source: XirangViewSource['source'], mode: SemanticBrowserMode): XirangViewMode {
  if (source === 'candidate-diff') return 'diff'
  if (source === 'candidate') return 'full'
  return mode === 'complete' ? 'full' : 'diff'
}

export type { XirangRuntimeManifest }
