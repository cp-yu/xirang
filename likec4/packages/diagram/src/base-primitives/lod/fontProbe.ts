import { compoundNode, elementNodeData } from '@likec4/styles/recipes'

export interface ResolvedFont {
  fontFamily: string
  fontWeight: string
}

const FALLBACK: ResolvedFont = { fontFamily: 'sans-serif', fontWeight: '500' }
const cache = new Map<string, ResolvedFont>()

/**
 * Reads the computed font of the node title by mounting a hidden probe under `.likec4-root`, so canvas
 * measurement uses the same family and weight as the rendered DOM text. Falls back (uncached) while no
 * diagram root is mounted.
 */
function probeFont(key: string, markup: () => string, titleSelector: string): ResolvedFont {
  const cached = cache.get(key)
  if (cached) return cached
  if (typeof document === 'undefined') return FALLBACK
  const root = document.querySelector('.likec4-root')
  if (!root) return FALLBACK
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
  probe.innerHTML = markup()
  root.appendChild(probe)
  const title = probe.querySelector(titleSelector)
  const style = title ? getComputedStyle(title) : null
  const font = {
    fontFamily: style?.fontFamily || FALLBACK.fontFamily,
    fontWeight: style?.fontWeight || FALLBACK.fontWeight,
  }
  root.removeChild(probe)
  cache.set(key, font)
  return font
}

export const resolveElementTitleFont = () =>
  probeFont(
    'element-title',
    () =>
      `<div class="${elementNodeData()}"><div class="likec4-element-node-content"><div data-likec4-node-title></div></div></div>`,
    '[data-likec4-node-title]',
  )

export const resolveCompoundTitleFont = () =>
  probeFont(
    'compound-title',
    () => `<div class="${compoundNode()}"><div class="likec4-compound-title-container"><div class="likec4-compound-title"></div></div></div>`,
    '.likec4-compound-title',
  )
