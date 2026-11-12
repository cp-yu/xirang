/**
 * Fits titles into boxes. Text is measured through an injected width function so the line breaking and the
 * binary search stay pure and testable; `fitTitleToBox` binds them to canvas measurement with caching.
 */
import { FIT_HEIGHT_SAFETY, FIT_WIDTH_SAFETY, OVERVIEW_MAX_TITLE_WORLD_PX, OVERVIEW_MIN_TITLE_WORLD_PX } from './lodMath'

/** Returns the rendered width in px of `text` at `fontSizePx`. */
export type TextWidthMeasurer = (text: string, fontSizePx: number) => number

const CJK_CLASS =
  '\\u1100-\\u11FF\\u2E80-\\u303F\\u3040-\\u30FF\\u3100-\\u318F\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uAC00-\\uD7AF\\uF900-\\uFAFF\\uFF00-\\uFFEF'
const TOKEN = new RegExp(`[${CJK_CLASS}]|\\s+|[^\\s${CJK_CLASS}]+`, 'gu')

/** Latin words are unbreakable tokens, whitespace separates, every CJK character may break anywhere. */
function tokenize(paragraph: string): string[] {
  return paragraph.match(TOKEN) ?? []
}

/**
 * Greedy line count of `title` in `maxWidth`. Explicit newlines force breaks, Latin words wrap on spaces
 * and an over-long word breaks by character. Returns Infinity when a single character cannot fit.
 */
export function countTitleLines(
  title: string,
  fontSize: number,
  maxWidth: number,
  measure: TextWidthMeasurer,
): number {
  const spaceWidth = measure(' ', fontSize)
  let lines = 0
  for (const paragraph of title.split('\n')) {
    lines += 1
    let lineWidth = 0
    let pendingSpace = false
    for (const token of tokenize(paragraph)) {
      if (/^\s+$/u.test(token)) {
        pendingSpace = lineWidth > 0
        continue
      }
      const tokenWidth = measure(token, fontSize)
      const gap = pendingSpace ? spaceWidth : 0
      pendingSpace = false
      if (lineWidth + gap + tokenWidth <= maxWidth) {
        lineWidth += gap + tokenWidth
        continue
      }
      if (lineWidth > 0) {
        lines += 1
        lineWidth = 0
      }
      if (tokenWidth <= maxWidth) {
        lineWidth = tokenWidth
        continue
      }
      for (const char of Array.from(token)) {
        const charWidth = measure(char, fontSize)
        if (charWidth > maxWidth) return Infinity
        if (lineWidth + charWidth > maxWidth && lineWidth > 0) {
          lines += 1
          lineWidth = charWidth
        } else {
          lineWidth += charWidth
        }
      }
    }
  }
  return lines
}

export interface FitTitleOptions {
  title: string
  /** Text box (node minus insets) in world px. */
  width: number
  height: number
  /** Unitless line-height multiplier. */
  lineHeight: number
  measure: TextWidthMeasurer
  minSize?: number
  maxSize?: number
}

/** Largest font size (world px) at which the wrapped title fits the box; `minSize` when none does. */
export function fitMaxTitleFontSize({
  title,
  width,
  height,
  lineHeight,
  measure,
  minSize = OVERVIEW_MIN_TITLE_WORLD_PX,
  maxSize = OVERVIEW_MAX_TITLE_WORLD_PX,
}: FitTitleOptions): number {
  const availableWidth = width * FIT_WIDTH_SAFETY
  const availableHeight = height * FIT_HEIGHT_SAFETY
  const fits = (size: number) =>
    countTitleLines(title, size, availableWidth, measure) * size * lineHeight <= availableHeight
  if (availableWidth <= 0 || availableHeight <= 0) return minSize
  if (fits(maxSize)) return maxSize
  if (!fits(minSize)) return minSize
  let low = minSize
  let high = maxSize
  while (high - low > 0.05) {
    const mid = (low + high) / 2
    if (fits(mid)) low = mid
    else high = mid
  }
  return low
}

/** Largest single-line font size (world px) at which `text` (plus fixed letter spacing) fits `availableWidth`. */
export function fitMaxSingleLineFontSize(opts: {
  text: string
  availableWidth: number
  letterSpacingPx: number
  measure: TextWidthMeasurer
}): number {
  const unitWidth = opts.measure(opts.text, 1)
  const spacing = opts.letterSpacingPx * Array.from(opts.text).length
  if (unitWidth <= 0) return Infinity
  return Math.max(0, (opts.availableWidth - spacing) / unitWidth)
}

const REFERENCE_FONT_PX = 100
const MAX_CACHE_ENTRIES = 4000
const widthCache = new Map<string, number>()
const fitCache = new Map<string, number>()
let canvasContext: CanvasRenderingContext2D | null | undefined

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (canvasContext === undefined) {
    canvasContext = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
  }
  return canvasContext
}

/** Rough width used when canvas measurement is unavailable (SSR, test DOMs without canvas). */
export function estimateTextWidth(text: string, fontSizePx: number): number {
  let em = 0
  for (const char of Array.from(text)) {
    em += new RegExp(`[${CJK_CLASS}]`, 'u').test(char) ? 1 : 0.56
  }
  return em * fontSizePx
}

/** Measures with the real font through a canvas at a reference size; widths scale linearly with font size. */
export function createCanvasMeasurer(fontFamily: string, fontWeight: string): TextWidthMeasurer {
  const font = `${fontWeight} ${REFERENCE_FONT_PX}px ${fontFamily}`
  return (text, fontSizePx) => {
    const key = `${font}\u0000${text}`
    let reference = widthCache.get(key)
    if (reference === undefined) {
      const context = getCanvasContext()
      if (context) {
        context.font = font
        reference = context.measureText(text).width
      } else {
        reference = estimateTextWidth(text, REFERENCE_FONT_PX)
      }
      if (widthCache.size >= MAX_CACHE_ENTRIES) widthCache.clear()
      widthCache.set(key, reference)
    }
    return reference * fontSizePx / REFERENCE_FONT_PX
  }
}

/** Cached {@link fitMaxTitleFontSize} keyed by (font, title, width, height, lineHeight). */
export function fitTitleToBox(opts: {
  title: string
  width: number
  height: number
  lineHeight: number
  fontFamily: string
  fontWeight: string
}): number {
  const key = [opts.fontFamily, opts.fontWeight, opts.lineHeight, opts.title, opts.width, opts.height].join('\u0000')
  let size = fitCache.get(key)
  if (size === undefined) {
    size = fitMaxTitleFontSize({
      title: opts.title,
      width: opts.width,
      height: opts.height,
      lineHeight: opts.lineHeight,
      measure: createCanvasMeasurer(opts.fontFamily, opts.fontWeight),
    })
    if (fitCache.size >= MAX_CACHE_ENTRIES) fitCache.clear()
    fitCache.set(key, size)
  }
  return size
}
