import { describe, expect, it } from 'vitest'
import { computeLocateViewport, minimapNodeStyle, NO_INSETS, obstructionInsets } from './browserChromeModel'

describe('minimapNodeStyle', () => {
  it('colors changed nodes by operation and unchanged nodes neutral gray', () => {
    expect(minimapNodeStyle('ADDED', false).fill).toBe('#2f9e44')
    expect(minimapNodeStyle('MODIFIED', false).fill).toBe('#ff9f0a')
    expect(minimapNodeStyle('REMOVED', false).fill).toBe('#e03131')
    expect(minimapNodeStyle(undefined, false).fill).toBe('#868e96')
  })

  it('keeps compound nodes translucent with an operation-colored outline', () => {
    expect(minimapNodeStyle('ADDED', true)).toEqual({ fill: '#2f9e4426', stroke: '#2f9e44' })
    expect(minimapNodeStyle(undefined, true).fill).toMatch(/26$/)
  })
})

describe('obstructionInsets', () => {
  const container = { x: 0, y: 0, width: 1600, height: 1000 }

  it('reserves the right strip for a panel hugging the right edge', () => {
    const panel = { x: 1200, y: 64, width: 380, height: 400 }
    expect(obstructionInsets(panel, container)).toEqual({ top: 0, right: 412, bottom: 0, left: 0 })
  })

  it('reserves the top strip for a panel spanning most of the canvas width (mobile)', () => {
    const mobile = { x: 0, y: 0, width: 412, height: 800 }
    const panel = { x: 8, y: 64, width: 396, height: 300 }
    expect(obstructionInsets(panel, mobile)).toEqual({ top: 376, right: 0, bottom: 0, left: 0 })
  })

  it('reserves the left strip for a panel on the left half', () => {
    expect(obstructionInsets({ x: 10, y: 10, width: 300, height: 200 }, container).left).toBe(322)
  })

  it('never reserves more than 60% of the canvas', () => {
    const mobile = { x: 0, y: 0, width: 412, height: 800 }
    const insets = obstructionInsets({ x: 8, y: 64, width: 396, height: 2000 }, mobile)
    expect(insets.top).toBe(480)
  })

  it('ignores missing, empty or off-canvas panels (collapsed panel is not measured)', () => {
    expect(obstructionInsets(null, container)).toEqual(NO_INSETS)
    expect(obstructionInsets({ x: 0, y: 0, width: 0, height: 0 }, container)).toEqual(NO_INSETS)
    expect(obstructionInsets({ x: 2000, y: 0, width: 100, height: 100 }, container)).toEqual(NO_INSETS)
  })
})

describe('computeLocateViewport', () => {
  const base = { container: { width: 1000, height: 800 }, minZoom: 0.05, maxZoom: 1 }

  it('centers the node in the full canvas when nothing obstructs it', () => {
    const viewport = computeLocateViewport({ ...base, node: { x: 500, y: 300, width: 200, height: 100 }, insets: NO_INSETS })
    expect(viewport.zoom).toBe(1)
    // node center (600, 350) lands on canvas center (500, 400)
    expect(viewport.x).toBe(-100)
    expect(viewport.y).toBe(50)
  })

  it('shifts the node center into the visible region when the right side is covered', () => {
    const viewport = computeLocateViewport({
      ...base,
      node: { x: 500, y: 300, width: 200, height: 100 },
      insets: { top: 0, right: 400, bottom: 0, left: 0 },
    })
    // visible width 600 → center at x=300
    expect(viewport.x + 600 * viewport.zoom).toBe(300)
  })

  it('zooms out so a large compound fits in the visible region, but never below minZoom', () => {
    const large = computeLocateViewport({ ...base, node: { x: 0, y: 0, width: 4000, height: 2000 }, insets: NO_INSETS })
    expect(large.zoom).toBeCloseTo(0.15, 2)
    const huge = computeLocateViewport({ ...base, node: { x: 0, y: 0, width: 1_000_000, height: 1_000_000 }, insets: NO_INSETS })
    expect(huge.zoom).toBe(0.05)
  })

  it('caps zoom at maxZoom for small nodes', () => {
    expect(computeLocateViewport({ ...base, node: { x: 0, y: 0, width: 10, height: 10 }, insets: NO_INSETS, maxZoom: 1.5 }).zoom).toBe(1.5)
  })
})
