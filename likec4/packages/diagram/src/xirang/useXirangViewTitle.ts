import { selectDiagramSnapshot, useDiagramSelector } from '../hooks'
import { xirangViewTitle } from './changePanelModel'
import { useXirangViewSources } from './ContractLoaderContext'

/**
 * Title of the current Xirang View Selection (Full Model or Authored View, plus the focused Element when it
 * is not the View root). Null outside a Xirang runtime, so the LikeC4 view title keeps applying.
 */
export function useXirangViewTitle(): string | null {
  const { selected } = useXirangViewSources()
  const focusIdentity = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.focusIdentity))
  if (!selected.architecture) return null
  const root = selected.roots?.[0]
    ?? selected.architecture.elements.find(element => element.declaration.parent === null)?.declaration.identity
  const focusTitle = focusIdentity && focusIdentity !== root
    ? selected.architecture.elements.find(element => element.declaration.identity === focusIdentity)?.declaration.title ?? null
    : null
  return xirangViewTitle(selected.label, focusTitle)
}
