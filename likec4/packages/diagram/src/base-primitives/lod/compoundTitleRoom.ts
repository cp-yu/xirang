import { COMPOUND_TITLE_PAD_BOTTOM, COMPOUND_TITLE_PAD_TOP } from './lodMath'

export interface LayoutBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  parent?: string | null | undefined
  children?: readonly string[] | undefined
}

/** Horizontal extent and top edge of a direct child, relative to its compound's top-left corner (world px). */
export interface ChildSpan {
  left: number
  right: number
  top: number
}

export interface CompoundTitleRoom {
  width: number
  height: number
  /** Nesting level: 0 for a top-level compound. */
  level: number
  children: readonly ChildSpan[]
}

export function buildCompoundTitleRoom(
  compound: LayoutBox,
  byId: ReadonlyMap<string, LayoutBox>,
  level = 0,
): CompoundTitleRoom {
  const children: ChildSpan[] = []
  for (const childId of compound.children ?? []) {
    const child = byId.get(childId)
    if (!child) continue
    children.push({
      left: child.x - compound.x,
      right: child.x - compound.x + child.width,
      top: child.y - compound.y,
    })
  }
  return { width: compound.width, height: compound.height, level, children }
}

/**
 * Largest font size (world px) a single-line compound title may use without covering a child.
 *
 * The title is anchored at the top-left; at size `f` it spans `[leftInset, leftInset + min(width(f), maxWidth)]`
 * horizontally and needs `f` + paddings of free height. Only children overlapping that horizontal span restrict the
 * height, so a title may grow into the empty band above the shorter or narrower part of the layout. Feasibility is
 * monotonic in `f` (a larger title is wider and taller), hence the binary search.
 *
 * `titleWidthAt(f)` is the full single-line width; wider titles are ellipsized at `maxWidth`, but at least
 * `minVisibleFraction` of the text must stay visible.
 */
export function compoundTitleMaxFontSize(opts: {
  room: CompoundTitleRoom
  leftInset: number
  maxWidth: number
  minVisibleFraction: number
  titleWidthAt: (fontSize: number) => number
  upperBound?: number
}): number {
  const { room, leftInset, maxWidth, minVisibleFraction, titleWidthAt } = opts
  const upper = Math.min(opts.upperBound ?? 1000, room.height)
  const fits = (fontSize: number): boolean => {
    const full = titleWidthAt(fontSize)
    if (full * minVisibleFraction > maxWidth) return false
    const right = leftInset + Math.min(full, maxWidth)
    let gap = room.height
    for (const child of room.children) {
      if (child.left < right && child.right > leftInset) gap = Math.min(gap, child.top)
    }
    return gap - COMPOUND_TITLE_PAD_TOP - COMPOUND_TITLE_PAD_BOTTOM >= fontSize
  }
  if (!fits(1)) return 0
  if (fits(upper)) return upper
  let low = 1
  let high = upper
  while (high - low > 0.25) {
    const mid = (low + high) / 2
    if (fits(mid)) low = mid
    else high = mid
  }
  return low
}

const roomCache = new WeakMap<readonly LayoutBox[], Map<string, CompoundTitleRoom>>()

/** Title room of every compound in a view layout; cached per `nodes` array identity. */
export function compoundTitleRoomByNode(nodes: readonly LayoutBox[]): ReadonlyMap<string, CompoundTitleRoom> {
  let rooms = roomCache.get(nodes)
  if (!rooms) {
    const byId = new Map(nodes.map(node => [node.id, node] as const))
    const levelOf = (node: LayoutBox): number => {
      let level = 0
      let parent = node.parent ? byId.get(node.parent) : undefined
      while (parent && level < 64) {
        level += 1
        parent = parent.parent ? byId.get(parent.parent) : undefined
      }
      return level
    }
    rooms = new Map()
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        rooms.set(node.id, buildCompoundTitleRoom(node, byId, levelOf(node)))
      }
    }
    roomCache.set(nodes, rooms)
  }
  return rooms
}
