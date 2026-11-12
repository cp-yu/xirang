/**
 * Size of a layout unit measured in rank coordinates:
 * `w` runs across a rank, `h` runs along the rank axis (the direction rows are stacked).
 */
export type Extent = { w: number; h: number }

/** Preferred width / height ratio of a cluster body whose sibling units are wrapped into rows. */
export const WrapTargetAspect = 1.6

/**
 * Bounding extent of `cells` laid out in rows of `columns` units.
 * Cells are expected to include the spacing around them.
 */
export function wrappedExtent(cells: readonly Extent[], columns: number): Extent {
  let w = 0
  let h = 0
  for (let i = 0; i < cells.length; i += columns) {
    const row = cells.slice(i, i + columns)
    w = Math.max(w, row.reduce((sum, cell) => sum + cell.w, 0))
    h += Math.max(...row.map(cell => cell.h))
  }
  return { w, h }
}

/**
 * Picks the number of units per row so the estimated width / height ratio
 * is closest to `target` (compared on a log scale). Ties go to fewer columns.
 *
 * @param transposed rows run horizontally (rankdir LR/RL), so the real ratio is `h / w`
 */
export function chooseColumns(
  cells: readonly Extent[],
  { target = WrapTargetAspect, transposed = false }: { target?: number; transposed?: boolean } = {},
): number {
  let best = Math.max(cells.length, 1)
  let bestScore = Infinity
  for (let columns = 1; columns <= cells.length; columns++) {
    const { w, h } = wrappedExtent(cells, columns)
    const ratio = transposed ? h / w : w / h
    const score = Math.abs(Math.log(ratio / target))
    if (score < bestScore - 1e-9) {
      bestScore = score
      best = columns
    }
  }
  return best
}

/**
 * Pairs of unit indexes to join with an invisible edge:
 * every unit hangs below the unit right above it, so a unit never links to a later row.
 */
export function rowLinks(count: number, columns: number): Array<[from: number, to: number]> {
  const links = [] as Array<[number, number]>
  for (let to = columns; to < count; to++) {
    links.push([to - columns, to])
  }
  return links
}
