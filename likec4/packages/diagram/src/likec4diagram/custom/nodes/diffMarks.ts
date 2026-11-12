import type { XirangDiffOperation } from '../../../xirang/ContractLoaderContext'
import type { XirangRequirementCounts } from '../../../xirang/projectionNode'

export const DIFF_OPERATION_COLOR: Record<XirangDiffOperation, string> = {
  ADDED: '#2f9e44',
  MODIFIED: '#ff9f0a',
  REMOVED: '#e03131',
}

export const DIFF_OPERATION_GLYPH: Record<XirangDiffOperation, string> = {
  ADDED: '+',
  MODIFIED: '~',
  REMOVED: '\u2212',
}

const DIFF_OPERATION_LABEL: Record<XirangDiffOperation, string> = {
  ADDED: 'Element added',
  MODIFIED: 'Element modified',
  REMOVED: 'Element removed',
}

/** Outline width (px at zoom ≥ full-size zoom) per operation. */
const DIFF_OUTLINE_WIDTH: Record<XirangDiffOperation, number> = { ADDED: 3, MODIFIED: 5, REMOVED: 3 }
/** Non-color operation cue: dotted / solid / dashed. */
const DIFF_OUTLINE_STYLE: Record<XirangDiffOperation, 'dotted' | 'solid' | 'dashed'> = {
  ADDED: 'dotted',
  MODIFIED: 'solid',
  REMOVED: 'dashed',
}
const DIFF_OUTLINE_OFFSET = 2

export const elementOperationLabel = (operation: XirangDiffOperation): string => DIFF_OPERATION_LABEL[operation]

export interface DiffOutlineStyle {
  outlineColor: string
  outlineStyle: 'dotted' | 'solid' | 'dashed'
  outlineWidth: string
  outlineOffset: string
}

/**
 * Complete inline outline for a changed node, scaled by `scale` (reverse-zoom factor ≥ 1) so overview still shows
 * it. Set inline (not through generated classes) so no focus/selection/highlight rule can override the operation color.
 */
export function diffOutlineStyle(operation: XirangDiffOperation, scale: number): DiffOutlineStyle {
  return {
    outlineColor: DIFF_OPERATION_COLOR[operation],
    outlineStyle: DIFF_OUTLINE_STYLE[operation],
    outlineWidth: `${DIFF_OUTLINE_WIDTH[operation] * scale}px`,
    outlineOffset: `${DIFF_OUTLINE_OFFSET * scale}px`,
  }
}

export const requirementCountBadges = [
  { key: 'added', glyph: '+', color: DIFF_OPERATION_COLOR.ADDED, verb: 'added' },
  { key: 'modified', glyph: '~', color: DIFF_OPERATION_COLOR.MODIFIED, verb: 'modified' },
  { key: 'removed', glyph: '\u2212', color: DIFF_OPERATION_COLOR.REMOVED, verb: 'removed' },
] as const satisfies ReadonlyArray<{ key: keyof XirangRequirementCounts; glyph: string; color: string; verb: string }>

/** e.g. `2 sections added`, `1 section modified`. */
export function sectionCountLabel(count: number, verb: string): string {
  return `${count} ${count === 1 ? 'section' : 'sections'} ${verb}`
}
