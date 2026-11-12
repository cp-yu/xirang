import { describe, expect, it } from 'vitest'
import {
  compoundTitleMaxFontSize,
  compoundTitleRoomByNode,
  type CompoundTitleRoom,
  type LayoutBox,
} from './compoundTitleRoom'

/** Latin-like metrics: 0.5em per character, no letter spacing. */
const widthOf = (text: string) => (size: number) => text.length * 0.5 * size

const room = (children: CompoundTitleRoom['children'], width = 800, height = 500): CompoundTitleRoom => ({
  width,
  height,
  level: 0,
  children,
})

const fit = (r: CompoundTitleRoom, text = 'ABCD', maxWidth = 760) =>
  compoundTitleMaxFontSize({
    room: r,
    leftInset: 13,
    maxWidth,
    minVisibleFraction: 0.6,
    titleWidthAt: widthOf(text),
  })

describe('compoundTitleMaxFontSize', () => {
  it('子节点紧贴标题正下方时，字号受顶部空隙限制（扣除上下留白）', () => {
    // 标题宽度 = 2 * f，覆盖 child(left 0..300)；空隙 60 → f <= 60 - 8 = 52
    const size = fit(room([{ left: 0, right: 300, top: 60 }]))
    expect(size).toBeGreaterThan(51)
    expect(size).toBeLessThanOrEqual(52)
  })

  it('只有与标题横向范围重叠的子节点才限制高度，右侧较高的子节点不影响', () => {
    const blocked = fit(room([{ left: 0, right: 300, top: 60 }]))
    // 标题只到 x=13+2f≈117 时，右侧 child 在 x>=400 不重叠 → 标题可以更大，直到它延伸到 x=400 才受限
    const free = fit(room([{ left: 400, right: 700, top: 60 }]))
    expect(free).toBeGreaterThan(blocked)
  })

  it('标题随字号变宽后会进入其他子节点的横向范围，因此字号上限取决于那一侧的空隙', () => {
    // 右侧 child top=60 从 x=200 起：f 增大使 13+2f>200，即 f>93.5 前不受限，但高度 f+8 <= 空隙 500 不限
    const size = fit(room([{ left: 200, right: 700, top: 60 }]))
    // 在 f <= 93 范围内标题不触及右侧 child，但 f 超过 60-8=52 之前都可行；超过 93.5 后受 60 限制 → 结果落在 93.5 附近
    expect(size).toBeGreaterThan(90)
    expect(size).toBeLessThan(95)
  })

  it('过长标题允许省略，但至少保留 60% 可见：宽度极窄时返回 0', () => {
    expect(fit(room([]), 'A'.repeat(100), 10)).toBe(0)
  })

  it('没有子节点时受 compound 高度与上界限制', () => {
    expect(fit(room([], 800, 90))).toBeGreaterThan(80)
    expect(fit(room([], 800, 90))).toBeLessThanOrEqual(82)
  })
})

describe('compoundTitleRoomByNode', () => {
  const nodes: LayoutBox[] = [
    { id: 'root', x: 100, y: 100, width: 800, height: 500, parent: null, children: ['mid'] },
    { id: 'mid', x: 120, y: 160, width: 600, height: 300, parent: 'root', children: ['leaf'] },
    { id: 'leaf', x: 140, y: 230, width: 100, height: 80, parent: 'mid' },
  ]

  it('子节点范围换算为相对 compound 左上角，并按父链计算嵌套层级', () => {
    const rooms = compoundTitleRoomByNode(nodes)
    expect(rooms.get('root')).toEqual({
      width: 800,
      height: 500,
      level: 0,
      children: [{ left: 20, right: 620, top: 60 }],
    })
    expect(rooms.get('mid')?.level).toBe(1)
    expect(rooms.get('mid')?.children).toEqual([{ left: 20, right: 120, top: 70 }])
    expect(rooms.has('leaf')).toBe(false)
  })
})
