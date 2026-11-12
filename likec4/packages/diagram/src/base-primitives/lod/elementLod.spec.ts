import { describe, expect, it, vi } from 'vitest'
import { resolveElementLod } from './elementLod'

const opts = { width: 320, height: 180, shape: 'rectangle' as const, baseFontSize: 19.2, padding: 16 }

describe('resolveElementLod', () => {
  it('放大后保持 detail，且不测量标题', () => {
    const fitTitle = vi.fn(() => 50)
    expect(resolveElementLod({ ...opts, zoom: 0.8, fitTitle })).toEqual({ level: 'detail' })
    expect(fitTitle).not.toHaveBeenCalled()
  })

  it('总览时按文本盒子（扣除 insets）拟合，字号取 min(fitMax, max(base, 14/zoom))', () => {
    const fitTitle = vi.fn(() => 200)
    const lod = resolveElementLod({ ...opts, zoom: 0.13, fitTitle })
    expect(fitTitle).toHaveBeenCalledWith({ width: 320 - 48, height: 180 - 32 })
    expect(lod.level).toBe('overview')
    expect(lod.titleFontSize).toBeCloseTo(14 / 0.13, 5)
  })

  it('fitMax 较小时标题字号被限制在能容纳的范围内', () => {
    const lod = resolveElementLod({ ...opts, zoom: 0.13, fitTitle: () => 40 })
    expect(lod.titleFontSize).toBe(40)
  })
})
