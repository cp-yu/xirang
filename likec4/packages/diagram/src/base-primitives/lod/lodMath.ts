/**
 * Pure zoom-dependent presentation math for Semantic Browser nodes.
 *
 * Node titles are fixed-size in world pixels, so at overview zoom (e.g. 0.13 for a 70 node model)
 * they become unreadably small. These helpers decide which level of detail applies and how large
 * titles may grow without leaving their node.
 */
import type { ElementShape } from '@likec4/core/types'

/** Below this on-screen title size (px) a leaf node switches from detail (title + summary) to overview (title only). */
export const DETAIL_MIN_TITLE_SCREEN_PX = 11
/** On-screen size (px) the overview title tries to reach. */
export const OVERVIEW_TITLE_SCREEN_PX = 14
/** Overview title floor in world px; below this a title is considered unfittable (the node clips it). */
export const OVERVIEW_MIN_TITLE_WORLD_PX = 6
/** Upper search bound for the fitted overview title in world px. */
export const OVERVIEW_MAX_TITLE_WORLD_PX = 400
/** Unitless line-height of the overview title; the fitter and the rendered title use the same value. */
export const OVERVIEW_TITLE_LINE_HEIGHT = 1.25
/** Fraction of the node text box width/height the fitted title may use (measureText vs browser wrapping drift). */
export const FIT_WIDTH_SAFETY = 0.94
export const FIT_HEIGHT_SAFETY = 0.96

/** Zoom is quantized to this many steps per octave so nodes re-render only when crossing a step, never while panning. */
export const ZOOM_STEPS_PER_OCTAVE = 6

/** On-screen size (px) compound titles try to reach when zoomed out. */
export const COMPOUND_TITLE_SCREEN_PX = 13
/** Compound title base size in world px (matches the compoundNode recipe). */
export const COMPOUND_TITLE_BASE_PX = 15
/** Compound title top offset and the margin kept above the first child, in world px. */
export const COMPOUND_TITLE_PAD_TOP = 4
export const COMPOUND_TITLE_PAD_BOTTOM = 4
/** Horizontal room not available for the compound title (left inset + right action area), in world px. */
export const COMPOUND_TITLE_INSET_X = 40
/** Smallest compound title size in world px when the room above the first child is tighter than the base size. */
export const COMPOUND_TITLE_MIN_PX = 9
/** Letter spacing of the compound title in px (recipe `letterSpacing: 0.25px`). */
export const COMPOUND_TITLE_LETTER_SPACING_PX = 0.25

/** Below this zoom diff marks (badges, outline) are scaled up so changed nodes stay visible in overview. */
export const DIFF_MARK_FULL_ZOOM = 0.667
export const DIFF_MARK_MAX_SCALE = 4

/** LOD output does not depend on zoom above this value, so quantized zoom is capped here and zooming in never re-renders nodes. */
export const LOD_MAX_ZOOM = 1

export type LodLevel = 'overview' | 'detail'

export function quantizeZoom(zoom: number): number {
  if (!Number.isFinite(zoom) || zoom <= 0) return LOD_MAX_ZOOM
  const step = Math.round(Math.log2(Math.min(zoom, LOD_MAX_ZOOM)) * ZOOM_STEPS_PER_OCTAVE) / ZOOM_STEPS_PER_OCTAVE
  return Math.round(2 ** step * 1000) / 1000
}

/** `detail` while the node title is at least {@link DETAIL_MIN_TITLE_SCREEN_PX} on screen, `overview` below. */
export function resolveLodLevel(baseTitleSizePx: number, zoom: number): LodLevel {
  return baseTitleSizePx * zoom < DETAIL_MIN_TITLE_SCREEN_PX ? 'overview' : 'detail'
}

/** clamp(base, target, fitMax): grows toward the on-screen target, never below base unless it cannot fit. */
export function resolveOverviewTitleFontSize(opts: {
  zoom: number
  baseFontSize: number
  fitMax: number
}): number {
  const target = OVERVIEW_TITLE_SCREEN_PX / opts.zoom
  return Math.min(opts.fitMax, Math.max(opts.baseFontSize, target))
}

/** Reverse zoom scale for diff badges and outlines: 1 at/above {@link DIFF_MARK_FULL_ZOOM}, capped at {@link DIFF_MARK_MAX_SCALE}. */
export function diffMarkScale(zoom: number): number {
  if (!(zoom > 0)) return 1
  return Math.min(DIFF_MARK_MAX_SCALE, Math.max(1, DIFF_MARK_FULL_ZOOM / zoom))
}

export interface TextInsets {
  top: number
  right: number
  bottom: number
  left: number
}

/** Mirrors the paddings of the `elementNodeData` recipe so the fitted title never reaches into shape decorations. */
export function overviewTextInsets(shape: ElementShape, padding: number): TextInsets {
  const insets: TextInsets = { top: padding, right: padding + 8, bottom: padding, left: padding + 8 }
  switch (shape) {
    case 'queue':
    case 'mobile':
      insets.left = 46
      insets.right = 16
      break
    case 'cylinder':
    case 'storage':
      insets.top = 30
      break
    case 'browser':
      insets.top = 32
      insets.bottom = 28
      break
    case 'bucket':
      insets.left = padding + 20
      insets.right = padding + 20
      break
    case 'component':
      insets.left = padding + 30
      break
  }
  return insets
}

/**
 * Compound title size: grows toward the on-screen target but never beyond `maxFit`, the largest size that fits
 * without covering a child (see `compoundTitleMaxFontSize`). Keeps the base size unless `maxFit` is smaller, and
 * never drops below {@link COMPOUND_TITLE_MIN_PX}.
 */
export function resolveCompoundTitleFontSize(opts: { zoom: number; maxFit: number }): number {
  const target = COMPOUND_TITLE_SCREEN_PX / opts.zoom
  const grown = Math.min(target, opts.maxFit)
  const floor = Math.min(COMPOUND_TITLE_BASE_PX, opts.maxFit)
  return Math.max(COMPOUND_TITLE_MIN_PX, floor, grown)
}

/** Share of the title that must stay visible when it is ellipsized to fit the compound width. */
export const COMPOUND_TITLE_MIN_VISIBLE_FRACTION = 0.6
/** Title left edge inside the compound: 3px border + 10px recipe inset; extra room when an icon precedes the text. */
export const COMPOUND_TITLE_LEFT_INSET = 13
export const COMPOUND_TITLE_ICON_ROOM = 26

/**
 * Fill opacity (percent) cap per nesting level. Compound fills are translucent and stack, so deeper levels get a
 * lighter tint: cumulative coverage at level 4 stays around 40% and leaf nodes remain distinct from containers.
 */
export const COMPOUND_FILL_OPACITY_BY_LEVEL = [20, 14, 10, 7, 5] as const

export function compoundFillOpacity(opacity: number | undefined, level: number): number | undefined {
  if (opacity === undefined) return undefined
  const cap = COMPOUND_FILL_OPACITY_BY_LEVEL[Math.min(Math.max(0, Math.floor(level)), COMPOUND_FILL_OPACITY_BY_LEVEL.length - 1)]!
  return Math.min(opacity, cap)
}

/** Relationship labels are hidden at the same zoom where node titles drop to overview; the default title size is the reference. */
export const EDGE_LABEL_REFERENCE_TITLE_PX = 19.2

export function edgeLabelsHiddenAtZoom(zoom: number): boolean {
  return resolveLodLevel(EDGE_LABEL_REFERENCE_TITLE_PX, zoom) === 'overview'
}

/** A hidden-by-LOD label stays visible while its edge is hovered, selected or active. */
export function shouldRenderEdgeLabel(opts: {
  hideWhenIdle: boolean
  hovered: boolean
  selected: boolean
  active: boolean
}): boolean {
  return !opts.hideWhenIdle || opts.hovered || opts.selected || opts.active
}
