import type { DiagramView } from '@likec4/core'

/**
 * Graphviz writes these to stderr when it cannot route an edge
 */
const RoutingFailure = /pathplan|triangulation|not in any triangle/i

/**
 * Tolerance (px) for rounding of coordinates
 */
const BBoxTolerance = 1

/**
 * Checks the layout produced for the wrapped DOT.
 * @returns the reason to discard the layout, or `null` if it is sound
 */
export function findWrappedLayoutProblem(
  input: { edges: ReadonlyArray<unknown> },
  diagram: Pick<DiagramView, 'nodes' | 'edges'>,
  warnings: ReadonlyArray<string>,
): string | null {
  const routingWarning = warnings.find(w => RoutingFailure.test(w))
  if (routingWarning) {
    return `Graphviz routing warning: ${routingWarning.trim().split('\n')[0]}`
  }
  if (diagram.edges.length < input.edges.length) {
    return `${input.edges.length - diagram.edges.length} of ${input.edges.length} edges are missing in the layout`
  }
  const unrouted = diagram.edges.find(e => e.points.length < 2)
  if (unrouted) {
    return `edge ${unrouted.id} has fewer than 2 points`
  }
  const byId = new Map(diagram.nodes.map(n => [n.id, n]))
  for (const node of diagram.nodes) {
    const parent = node.parent && byId.get(node.parent)
    if (
      parent && (
        node.x < parent.x - BBoxTolerance
        || node.y < parent.y - BBoxTolerance
        || node.x + node.width > parent.x + parent.width + BBoxTolerance
        || node.y + node.height > parent.y + parent.height + BBoxTolerance
      )
    ) {
      return `node ${node.id} is outside of its parent ${parent.id}`
    }
  }
  return null
}

/** Compares actual output sizes and edge polylines, without rounding the thresholds. */
export function findWrappedLayoutDisadvantage(
  wrapped: Pick<DiagramView, 'bounds' | 'edges'>,
  plain: Pick<DiagramView, 'bounds' | 'edges'>,
): string | null {
  const fitZoom = ({ bounds }: typeof wrapped) => Math.min(1600 / bounds.width, 1000 / bounds.height)
  const wrappedZoom = fitZoom(wrapped)
  const plainZoom = fitZoom(plain)
  if (!(wrappedZoom >= plainZoom * 1.05)) {
    return `fit zoom improvement is below 5% (${wrappedZoom} vs ${plainZoom})`
  }
  const edgeLength = ({ edges }: typeof wrapped) =>
    edges.reduce((total, edge) => {
      for (let i = 1; i < edge.points.length; i++) {
        const [x, y] = edge.points[i]!
        const [previousX, previousY] = edge.points[i - 1]!
        total += Math.hypot(x - previousX, y - previousY)
      }
      return total
    }, 0)
  const wrappedLength = edgeLength(wrapped)
  const plainLength = edgeLength(plain)
  if (!(wrappedLength <= plainLength * 1.5)) {
    return `total edge length exceeds 1.5 times plain layout (${wrappedLength} vs ${plainLength})`
  }
  return null
}
