import type { ComputedNodeStyle, ElementShape } from '@likec4/core/types'
import { useMemo } from 'react'
import { type CompoundTitleRoom, compoundTitleMaxFontSize, compoundTitleRoomByNode } from '../base-primitives/lod/compoundTitleRoom'
import { type ElementLod, resolveElementLod } from '../base-primitives/lod/elementLod'
import { resolveCompoundTitleFont, resolveElementTitleFont } from '../base-primitives/lod/fontProbe'
import {
  COMPOUND_TITLE_ICON_ROOM,
  COMPOUND_TITLE_INSET_X,
  COMPOUND_TITLE_LEFT_INSET,
  COMPOUND_TITLE_LETTER_SPACING_PX,
  COMPOUND_TITLE_MIN_VISIBLE_FRACTION,
  edgeLabelsHiddenAtZoom,
  OVERVIEW_TITLE_LINE_HEIGHT,
  quantizeZoom,
  resolveCompoundTitleFontSize,
} from '../base-primitives/lod/lodMath'
import { createCanvasMeasurer, fitMaxSingleLineFontSize, fitTitleToBox } from '../base-primitives/lod/titleFit'
import { useCurrentView } from './useCurrentView'
import { useLikeC4Styles } from './useLikeC4Styles'
import { type XYStoreState, useXYStore } from './useXYFlow'

const selectQuantizedZoom = (state: XYStoreState) => quantizeZoom(state.transform[2])

/**
 * Current xyflow zoom quantized to {@link quantizeZoom} steps and capped at the zoom where LOD output stops
 * changing. Subscribers re-render only when the value changes, so panning and zooming in do not re-render nodes.
 */
export function useQuantizedZoom(): number {
  return useXYStore(selectQuantizedZoom)
}

/** Space available for a compound title in the current view layout. */
export function useCompoundTitleRoom(compoundId: string): CompoundTitleRoom | undefined {
  const nodes = useCurrentView().nodes
  return compoundTitleRoomByNode(nodes).get(compoundId)
}

/** Level of detail (and fitted title size in overview) of an element node at the current zoom. */
export function useElementLod(data: {
  title: string
  width: number
  height: number
  shape: ElementShape
  style: ComputedNodeStyle
}): ElementLod {
  const zoom = useQuantizedZoom()
  const styles = useLikeC4Styles()
  const { values } = styles.nodeSizes(data.style)
  const { title, width, height, shape } = data
  const baseFontSize = values.textSize
  const padding = values.padding
  return useMemo(() =>
    resolveElementLod({
      zoom,
      width,
      height,
      shape,
      baseFontSize,
      padding,
      fitTitle: box => {
        const font = resolveElementTitleFont()
        return fitTitleToBox({
          title,
          width: box.width,
          height: box.height,
          lineHeight: OVERVIEW_TITLE_LINE_HEIGHT,
          fontFamily: font.fontFamily,
          fontWeight: font.fontWeight,
        })
      },
    }), [zoom, title, width, height, shape, baseFontSize, padding])
}

/** Compound title size (world px) at the current zoom, bounded by the free space around the title and the compound width. */
export function useCompoundTitleFontSize(compoundId: string, title: string, hasIcon: boolean): number {
  const zoom = useQuantizedZoom()
  const room = useCompoundTitleRoom(compoundId)
  return useMemo(() => {
    if (!room) return resolveCompoundTitleFontSize({ zoom, maxFit: Infinity })
    const font = resolveCompoundTitleFont()
    const measure = createCanvasMeasurer(font.fontFamily, font.fontWeight)
    const text = title.toUpperCase()
    const chars = Array.from(text).length
    const iconRoom = hasIcon ? COMPOUND_TITLE_ICON_ROOM : 0
    const maxFit = compoundTitleMaxFontSize({
      room,
      leftInset: COMPOUND_TITLE_LEFT_INSET + iconRoom,
      maxWidth: room.width - COMPOUND_TITLE_INSET_X - iconRoom,
      minVisibleFraction: COMPOUND_TITLE_MIN_VISIBLE_FRACTION,
      titleWidthAt: size => measure(text, size) + COMPOUND_TITLE_LETTER_SPACING_PX * chars,
    })
    return resolveCompoundTitleFontSize({ zoom, maxFit })
  }, [zoom, title, hasIcon, room])
}

/** Nesting level (0 = top level) of a compound in the current view. */
export function useCompoundLevel(compoundId: string): number {
  return useCompoundTitleRoom(compoundId)?.level ?? 0
}

/** Whether relationship labels are hidden by overview LOD at the current zoom. */
export function useEdgeLabelsHidden(): boolean {
  return edgeLabelsHiddenAtZoom(useQuantizedZoom())
}
