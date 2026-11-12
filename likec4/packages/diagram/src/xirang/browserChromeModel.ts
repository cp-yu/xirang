import type { XirangDiffOperation } from './ContractLoaderContext'
import { XIRANG_OPERATION_COLORS } from './changePanelModel'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Screen-space strip of the canvas covered by floating chrome. */
export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 }

/** Breathing room kept between a covering panel and a located node. */
const OBSTRUCTION_MARGIN = 12
/** The visible region keeps at least this share of the canvas, however large the panel is. */
const MIN_VISIBLE_SHARE = 0.4
/** A panel at least this share of the canvas width spans the canvas and is treated as a top obstruction. */
const FULL_WIDTH_SHARE = 0.6

const NEUTRAL_NODE = '#868e96'

export interface MinimapNodeStyle {
  fill: string
  stroke: string
}

/**
 * Minimap colors: changed nodes use their operation color; unchanged nodes are neutral gray. Compound nodes
 * get a translucent fill so the children drawn on top of them stay visible.
 */
export function minimapNodeStyle(operation: XirangDiffOperation | undefined, isCompound: boolean): MinimapNodeStyle {
  const base = operation ? XIRANG_OPERATION_COLORS[operation] : NEUTRAL_NODE
  return isCompound ? { fill: `${base}26`, stroke: base } : { fill: base, stroke: 'transparent' }
}

/**
 * Converts the client rect of a floating panel into the canvas strip it covers: a full-width panel covers
 * the top, otherwise the side the panel sits on. Panels outside the canvas cover nothing.
 */
export function obstructionInsets(panel: Rect | null, container: Rect): Insets {
  if (!panel || panel.width <= 0 || panel.height <= 0 || container.width <= 0 || container.height <= 0) {
    return NO_INSETS
  }
  const overlapsX = panel.x < container.x + container.width && panel.x + panel.width > container.x
  const overlapsY = panel.y < container.y + container.height && panel.y + panel.height > container.y
  if (!overlapsX || !overlapsY) return NO_INSETS
  if (panel.width >= container.width * FULL_WIDTH_SHARE) {
    const covered = panel.y + panel.height - container.y + OBSTRUCTION_MARGIN
    return { ...NO_INSETS, top: clamp(covered, 0, container.height * (1 - MIN_VISIBLE_SHARE)) }
  }
  const maxInset = container.width * (1 - MIN_VISIBLE_SHARE)
  const panelCenter = panel.x + panel.width / 2
  if (panelCenter >= container.x + container.width / 2) {
    return { ...NO_INSETS, right: clamp(container.x + container.width - panel.x + OBSTRUCTION_MARGIN, 0, maxInset) }
  }
  return { ...NO_INSETS, left: clamp(panel.x + panel.width - container.x + OBSTRUCTION_MARGIN, 0, maxInset) }
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

/**
 * Viewport that puts `node` in the center of the canvas minus `insets`. Zoom fits the node into
 * `fill` of the visible region, bounded by `[minZoom, maxZoom]`, so small nodes stay readable and large
 * compounds still fit.
 */
export function computeLocateViewport(args: {
  node: Rect
  container: { width: number; height: number }
  insets: Insets
  minZoom: number
  maxZoom: number
  fill?: number
}): Viewport {
  const { node, container, insets, minZoom, maxZoom, fill = 0.6 } = args
  const visibleWidth = Math.max(1, container.width - insets.left - insets.right)
  const visibleHeight = Math.max(1, container.height - insets.top - insets.bottom)
  const fitZoom = Math.min(
    (visibleWidth * fill) / Math.max(1, node.width),
    (visibleHeight * fill) / Math.max(1, node.height),
  )
  const zoom = clamp(fitZoom, minZoom, Math.max(minZoom, maxZoom))
  const centerX = insets.left + visibleWidth / 2
  const centerY = insets.top + visibleHeight / 2
  return {
    x: Math.round(centerX - (node.x + node.width / 2) * zoom),
    y: Math.round(centerY - (node.y + node.height / 2) * zoom),
    zoom,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
