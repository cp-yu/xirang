import { describe, expect, it } from 'vitest'
import { countTitleLines, fitMaxSingleLineFontSize, fitMaxTitleFontSize, type TextWidthMeasurer } from './titleFit'

/** Deterministic metrics: CJK = 1em, everything else = 0.5em. */
const measure: TextWidthMeasurer = (text, size) =>
  Array.from(text).reduce((sum, char) => sum + (/[\u4e00-\u9fff]/u.test(char) ? 1 : 0.5) * size, 0)

describe('countTitleLines', () => {
  it('英文按词折行，空格不占行首', () => {
    // "aaaa bbbb": each word 20px @10px font, space 5px
    expect(countTitleLines('aaaa bbbb', 10, 50, measure)).toBe(1)
    expect(countTitleLines('aaaa bbbb', 10, 30, measure)).toBe(2)
  })

  it('超长单词按字符断开，单个字符放不下则返回 Infinity', () => {
    expect(countTitleLines('aaaaaaaaaa', 10, 20, measure)).toBe(3)
    expect(countTitleLines('中', 10, 9, measure)).toBe(Infinity)
  })

  it('CJK 可在任意字符处断行，显式换行强制断开', () => {
    expect(countTitleLines('一二三四五六', 10, 30, measure)).toBe(2)
    expect(countTitleLines('ab\ncd', 10, 100, measure)).toBe(2)
  })
})

describe('fitMaxTitleFontSize', () => {
  const base = { lineHeight: 1.25, measure }

  it('结果不溢出盒子：行数 × 字号 × 行高 ≤ 高度，且宽度可容纳', () => {
    const title = 'Semantic Browser Presentation'
    const width = 200
    const height = 100
    const size = fitMaxTitleFontSize({ ...base, title, width, height })
    const lines = countTitleLines(title, size, width, measure)
    expect(lines * size * 1.25).toBeLessThanOrEqual(height)
    // 再大一点就放不下 → 取到的是最大值
    const larger = size + 0.5
    expect(countTitleLines(title, larger, width * 0.94, measure) * larger * 1.25).toBeGreaterThan(height * 0.96)
  })

  it('较短标题获得更大字号，较窄盒子获得更小字号', () => {
    const short = fitMaxTitleFontSize({ ...base, title: 'AB', width: 200, height: 100 })
    const long = fitMaxTitleFontSize({ ...base, title: 'A much longer element title', width: 200, height: 100 })
    const narrow = fitMaxTitleFontSize({ ...base, title: 'AB', width: 50, height: 100 })
    expect(short).toBeGreaterThan(long)
    expect(short).toBeGreaterThan(narrow)
  })

  it('CJK 标题允许多行以放大字号', () => {
    const oneLine = fitMaxTitleFontSize({ ...base, title: '语义', width: 200, height: 40 })
    const multi = fitMaxTitleFontSize({ ...base, title: '语义浏览器视图呈现分级', width: 200, height: 120 })
    expect(oneLine).toBeGreaterThan(0)
    const lines = countTitleLines('语义浏览器视图呈现分级', multi, 200 * 0.94, measure)
    expect(lines).toBeGreaterThan(1)
    expect(lines * multi * 1.25).toBeLessThanOrEqual(120 * 0.96)
  })

  it('盒子无可用空间或放不下最小字号时返回最小字号', () => {
    expect(fitMaxTitleFontSize({ ...base, title: 'x', width: 0, height: 50, minSize: 6 })).toBe(6)
    expect(fitMaxTitleFontSize({ ...base, title: 'x'.repeat(500), width: 20, height: 20, minSize: 6 })).toBe(6)
  })
})

describe('fitMaxSingleLineFontSize', () => {
  it('扣除固定字间距后按宽度反推字号', () => {
    // "abcd" = 2em wide at 1px; 4 chars * 0.25 spacing = 1px; (101 - 1) / 2 = 50
    expect(fitMaxSingleLineFontSize({ text: 'abcd', availableWidth: 101, letterSpacingPx: 0.25, measure })).toBe(50)
  })

  it('可用宽度不足时为 0 而非负数', () => {
    expect(fitMaxSingleLineFontSize({ text: 'abcd', availableWidth: 0.5, letterSpacingPx: 0.25, measure })).toBe(0)
  })
})
