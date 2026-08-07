import {
  resolveEffectiveMode,
  selectDiagramSnapshot,
  useDiagram,
  useDiagramSelector,
  useXirangViewSources,
} from '@likec4/diagram'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { shallowEqual } from 'fast-equals'
import { useEffect, useRef } from 'react'
import { useCurrentViewId } from '../hooks'
import { classifyFocusUrlChange, matchHistoryNeighbor, type NavigationHistoryLike } from './history-bridge'

const selectNavState = selectDiagramSnapshot(
  snapshot => ({
    focusIdentity: snapshot.context.focusIdentity,
    history: snapshot.context.navigationHistory as NavigationHistoryLike,
    ready: snapshot.matches('ready'),
  }),
  shallowEqual,
)

function browserState(runtime: ReturnType<typeof useXirangViewSources>) {
  if (runtime.selected.source === 'change-derived-view') {
    return {
      view: 'model',
      change: runtime.selected.change ?? runtime.selected.id.replace(/^change:/, ''),
      mode: resolveEffectiveMode(runtime.selected.source, runtime.mode) === 'diff' ? 'diff-only' as const : 'complete-with-diff' as const,
    }
  }
  return {
    view: runtime.selected.id,
    change: undefined,
    mode: 'complete' as const,
  }
}

/** Synchronizes Diagram focus and the new Xirang view/change/mode URL contract. */
export function ViewHistoryBridge() {
  const navigate = useNavigate()
  const diagram = useDiagram()
  const runtime = useXirangViewSources()
  const { view: urlView, change: urlChange, focus: urlFocus, mode: urlMode } = useSearch({ from: '__root__' })
  const currentViewId = useCurrentViewId()
  const { focusIdentity, history, ready } = useDiagramSelector(selectNavState)
  const state = browserState(runtime)
  const lastUrlState = useRef<string>('')
  const previousUrlTarget = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (currentViewId !== 'model') {
      if (urlView || urlChange || urlFocus || urlMode !== 'complete') {
        void navigate({
          to: './',
          replace: true,
          viewTransition: false,
          search: (previous: Record<string, unknown>) => {
            const { view: _view, change: _change, focus: _focus, mode: _mode, ...rest } = previous
            return rest
          },
        })
      }
      return
    }
    if (!ready) return
    const targetSelection = urlChange ? `change:${urlChange}` : (urlView ?? 'model')
    if (targetSelection !== runtime.selected.id && targetSelection !== previousUrlTarget.current) {
      previousUrlTarget.current = targetSelection
      if (runtime.sources.some(source => source.id === targetSelection)) runtime.select(targetSelection)
      return
    }
    previousUrlTarget.current = undefined
    const targetFocus = urlFocus ?? null
    if (targetFocus === (focusIdentity ?? null)) return
    const step = matchHistoryNeighbor(history, targetFocus)
    if (step === 'back') diagram.navigate('back')
    else if (step === 'forward') diagram.navigate('forward')
    else diagram.focusWithinView(targetFocus)
  }, [currentViewId, diagram, focusIdentity, history, navigate, ready, runtime, urlChange, urlFocus, urlMode, urlView])

  useEffect(() => {
    if (currentViewId !== 'model' || !ready) return
    const focus = focusIdentity ?? undefined
    const next = {
      view: state.view === 'model' ? undefined : state.view,
      change: state.change,
      mode: state.mode,
      focus,
    }
    const key = JSON.stringify(next)
    const current = JSON.stringify({
      view: urlView,
      change: urlChange,
      mode: urlMode,
      focus: urlFocus,
    })
    if (key === current || key === lastUrlState.current) return
    lastUrlState.current = key
    const focusChanged = focus !== (urlFocus ?? undefined)
    void navigate({
      to: './',
      replace: focusChanged ? classifyFocusUrlChange(history) === 'replace' : false,
      viewTransition: false,
      search: previous => {
        const nextSearch = { ...previous, mode: next.mode }
        if (next.view) nextSearch.view = next.view
        else delete nextSearch.view
        if (next.change) nextSearch.change = next.change
        else delete nextSearch.change
        if (next.focus) nextSearch.focus = next.focus
        else delete nextSearch.focus
        return nextSearch
      },
    })
  }, [currentViewId, focusIdentity, history, navigate, ready, state.change, state.mode, state.view, urlChange, urlFocus, urlMode, urlView])

  return null
}
