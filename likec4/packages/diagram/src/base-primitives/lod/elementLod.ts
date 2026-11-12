import type { ElementShape } from '@likec4/core/types'
import { overviewTextInsets, resolveLodLevel, resolveOverviewTitleFontSize, type LodLevel } from './lodMath'

export interface ElementLod {
  level: LodLevel
  /** World-px title size; set only in overview. */
  titleFontSize?: number
}

export const DETAIL_LOD: ElementLod = { level: 'detail' }

/**
 * Resolves what an element node shows at `zoom`. `fitTitle` returns the largest title size (world px)
 * that fits the given text box; it is only called in overview.
 */
export function resolveElementLod(opts: {
  zoom: number
  width: number
  height: number
  shape: ElementShape
  baseFontSize: number
  padding: number
  fitTitle: (box: { width: number; height: number }) => number
}): ElementLod {
  if (resolveLodLevel(opts.baseFontSize, opts.zoom) === 'detail') return DETAIL_LOD
  const insets = overviewTextInsets(opts.shape, opts.padding)
  const fitMax = opts.fitTitle({
    width: opts.width - insets.left - insets.right,
    height: opts.height - insets.top - insets.bottom,
  })
  return {
    level: 'overview',
    titleFontSize: resolveOverviewTitleFontSize({ zoom: opts.zoom, baseFontSize: opts.baseFontSize, fitMax }),
  }
}
