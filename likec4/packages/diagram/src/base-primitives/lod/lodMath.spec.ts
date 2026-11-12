import { describe, expect, it } from 'vitest'
import {
  COMPOUND_FILL_OPACITY_BY_LEVEL,
  COMPOUND_TITLE_BASE_PX,
  COMPOUND_TITLE_MIN_PX,
  DIFF_MARK_MAX_SCALE,
  compoundFillOpacity,
  diffMarkScale,
  edgeLabelsHiddenAtZoom,
  overviewTextInsets,
  quantizeZoom,
  resolveCompoundTitleFontSize,
  resolveLodLevel,
  resolveOverviewTitleFontSize,
  shouldRenderEdgeLabel,
} from './lodMath'

describe('resolveLodLevel', () => {
  it('title 屏幕字号低于 11px 进入 overview，达到 11px 为 detail', () => {
    expect(resolveLodLevel(19.2, 0.13)).toBe('overview')
    expect(resolveLodLevel(19.2, 0.6)).toBe('detail')
    // 边界：19.2 * z = 11 → z ≈ 0.5729
    expect(resolveLodLevel(19.2, 11 / 19.2)).toBe('detail')
    expect(resolveLodLevel(19.2, 11 / 19.2 - 0.001)).toBe('overview')
  })

  it('字号更大的节点更晚进入 overview', () => {
    expect(resolveLodLevel(27.65, 0.45)).toBe('detail')
    expect(resolveLodLevel(13.33, 0.45)).toBe('overview')
  })
})

describe('resolveOverviewTitleFontSize', () => {
  it('朝 14px 屏幕字号放大，受 fitMax 限制', () => {
    expect(resolveOverviewTitleFontSize({ zoom: 0.13, baseFontSize: 19.2, fitMax: 500 })).toBeCloseTo(14 / 0.13, 5)
    expect(resolveOverviewTitleFontSize({ zoom: 0.13, baseFontSize: 19.2, fitMax: 60 })).toBe(60)
  })

  it('不小于基础字号，除非 fitMax 更小（必须不溢出）', () => {
    expect(resolveOverviewTitleFontSize({ zoom: 0.9, baseFontSize: 19.2, fitMax: 500 })).toBe(19.2)
    expect(resolveOverviewTitleFontSize({ zoom: 0.9, baseFontSize: 19.2, fitMax: 12 })).toBe(12)
  })
})

describe('quantizeZoom', () => {
  it('同一步长内的 zoom 得到相同值，跨步才变化', () => {
    expect(quantizeZoom(0.130)).toBe(quantizeZoom(0.131))
    expect(quantizeZoom(0.13)).not.toBe(quantizeZoom(0.2))
  })

  it('放大到 1 以上不再变化，非法值回落到 1', () => {
    expect(quantizeZoom(1)).toBe(1)
    expect(quantizeZoom(3)).toBe(1)
    expect(quantizeZoom(0)).toBe(1)
    expect(quantizeZoom(Number.NaN)).toBe(1)
  })

  it('量化值与原值相差不超过半个步长（约 6%）', () => {
    for (const zoom of [0.05, 0.13, 0.31, 0.6, 0.9]) {
      expect(Math.abs(quantizeZoom(zoom) / zoom - 1)).toBeLessThan(0.07)
    }
  })
})

describe('diffMarkScale', () => {
  it('普通缩放不放大，总览按反比放大并有上限', () => {
    expect(diffMarkScale(1)).toBe(1)
    expect(diffMarkScale(0.667)).toBe(1)
    expect(diffMarkScale(0.3)).toBeCloseTo(0.667 / 0.3, 5)
    expect(diffMarkScale(0.01)).toBe(DIFF_MARK_MAX_SCALE)
  })
})

describe('overviewTextInsets', () => {
  it('矩形使用 padding 与额外 8px 水平边距，特殊形状预留装饰空间', () => {
    expect(overviewTextInsets('rectangle', 16)).toEqual({ top: 16, right: 24, bottom: 16, left: 24 })
    expect(overviewTextInsets('cylinder', 16).top).toBe(30)
    expect(overviewTextInsets('browser', 16)).toMatchObject({ top: 32, bottom: 28 })
    expect(overviewTextInsets('queue', 16)).toMatchObject({ left: 46, right: 16 })
  })
})

describe('resolveCompoundTitleFontSize', () => {
  it('放大到屏幕 13px 对应的 world 字号，并受 maxFit 限制', () => {
    expect(resolveCompoundTitleFontSize({ zoom: 0.13, maxFit: 1000 })).toBeCloseTo(100, 5)
    expect(resolveCompoundTitleFontSize({ zoom: 0.13, maxFit: 50 })).toBe(50)
  })

  it('maxFit 小于基础字号时才低于基础字号，且不低于下限', () => {
    expect(resolveCompoundTitleFontSize({ zoom: 1, maxFit: 12 })).toBe(12)
    expect(resolveCompoundTitleFontSize({ zoom: 1, maxFit: 2 })).toBe(COMPOUND_TITLE_MIN_PX)
    expect(resolveCompoundTitleFontSize({ zoom: 1, maxFit: 1000 })).toBe(COMPOUND_TITLE_BASE_PX)
  })
})

describe('compoundFillOpacity', () => {
  it('按嵌套层级逐层降低填充不透明度上限，深层不再继续变浅', () => {
    expect(compoundFillOpacity(100, 0)).toBe(20)
    expect(compoundFillOpacity(100, 1)).toBe(14)
    expect(compoundFillOpacity(100, 3)).toBe(7)
    expect(compoundFillOpacity(100, 4)).toBe(5)
    expect(compoundFillOpacity(100, 9)).toBe(5)
  })

  it('不抬高本来更透明的设置；未指定时保持未指定', () => {
    expect(compoundFillOpacity(3, 0)).toBe(3)
    expect(compoundFillOpacity(undefined, 2)).toBeUndefined()
  })

  it('累计覆盖率在 5 层嵌套时仍低于 50%', () => {
    const covered = 1 - COMPOUND_FILL_OPACITY_BY_LEVEL.reduce((rest, alpha) => rest * (1 - alpha / 100), 1)
    expect(covered).toBeLessThan(0.5)
  })
})

describe('edge label LOD', () => {
  it('与节点同一阈值：缩放 0.4 隐藏，0.6 显示', () => {
    expect(edgeLabelsHiddenAtZoom(0.4)).toBe(true)
    expect(edgeLabelsHiddenAtZoom(0.6)).toBe(false)
  })

  it('LOD 隐藏时 hover、选中或激活的 edge 仍显示 label', () => {
    const idle = { hideWhenIdle: true, hovered: false, selected: false, active: false }
    expect(shouldRenderEdgeLabel(idle)).toBe(false)
    expect(shouldRenderEdgeLabel({ ...idle, hovered: true })).toBe(true)
    expect(shouldRenderEdgeLabel({ ...idle, selected: true })).toBe(true)
    expect(shouldRenderEdgeLabel({ ...idle, active: true })).toBe(true)
    expect(shouldRenderEdgeLabel({ ...idle, hideWhenIdle: false })).toBe(true)
  })
})
