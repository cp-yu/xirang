import type {
  AnyAux,
  ComputedEdge,
  ComputedElementView,
  ComputedNode,
  Fqn,
  HexColor,
  LikeC4Styles,
  NodeId,
} from '@likec4/core'
import { nonNullable } from '@likec4/core/utils'
import { createLogger } from '@likec4/log'
import { chunk, filter, first, isEmpty, isNonNullish, last, map, pipe } from 'remeda'
import type { EdgeModel, NodeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { CompoundLabelFontSize, edgelabel } from './dot-labels'
import { DotPrinter } from './DotPrinter'
import { isCompound, toArrowType } from './utils'
import { type Extent, chooseColumns, rowLinks, wrappedExtent } from './wrap-siblings'

const rankLogger = createLogger('dot.rank')

export type ElementViewPrinterOptions = {
  /**
   * Wrap sibling units of every cluster (and of the root) into rows,
   * chained with invisible edges, to keep the aspect ratio of large views reasonable.
   * @default false
   */
  wrapSiblings?: boolean | undefined
}

/**
 * Cluster title takes a text line (font size x Graphviz line spacing)
 * plus the label padding Graphviz adds for clusters (2 * GAP, GAP = 4)
 */
const CompoundTitleHeight = Math.ceil(CompoundLabelFontSize * 1.2) + 8

export class ElementViewPrinter<A extends AnyAux> extends DotPrinter<ComputedElementView<A>> {
  constructor(
    view: ComputedElementView<A>,
    styles: LikeC4Styles,
    private readonly options: ElementViewPrinterOptions = {},
  ) {
    super(view, styles)
  }

  protected override postBuild(): void {
    // Assign groups to improve layout
    this
      .assignGroups()
      .tileNodesWithoutEdges()
      .wrapSiblingUnits()
      .applyExplicitRankBlocks()
      .enableNewRankIfNeeded()
  }

  private tileNodesWithoutEdges(): this {
    const compoundIds = new Set<Fqn>()
    const compounds = this.view.nodes.reduce((acc, node) => {
      if (isCompound(node)) {
        compoundIds.add(node.id)
        acc.push(node)
      }
      return acc
    }, [] as ComputedNode[])

    for (const compound of compounds) {
      const children = pipe(
        compound.children,
        filter(id => !this.compoundIds.has(id) && this.graphology.degree(id) === 0),
        map(id => this.computedNode(id)),
      )
      if (children.length <= 2) {
        continue
      }

      let chunkSize = 2
      switch (true) {
        case children.length > 11:
          chunkSize = 4
          break
        case children.length > 4:
          chunkSize = 3
          break
      }
      const subgraph = nonNullable(this.getSubgraph(compound.id), `Subgraph not found for ${compound.id}`)
      let prevChunkHead: NodeModel | null = null
      chunk(children, chunkSize).forEach((chunk) => {
        const ranked = chunk.length > 1
          ? subgraph.createSubgraph({ [_.rank]: 'same' })
          : null
        chunk.forEach((child, i) => {
          const nd = this.getGraphNode(child.id)
          if (!nd) {
            return
          }
          ranked?.node(nd.id)
          // Make invisible edges between chunks (link heads)
          if (i === 0) {
            if (prevChunkHead) {
              subgraph.edge([prevChunkHead, nd], {
                [_.style]: 'invis',
                // [_.weight]: 0 /
              })
            }
            prevChunkHead = nd
          }
        })
      })
    }
    return this
  }

  /**
   * Splits direct children of every cluster (and top-level nodes) into rows,
   * choosing the number of columns that brings the estimated aspect ratio closest to the target.
   * Rows are chained with invisible edges from a leaf of the unit above to a leaf of the unit below.
   * Such edges have no `likec4_id`, so they are ignored when the layout is parsed.
   */
  private wrapSiblingUnits(): this {
    if (!this.options.wrapSiblings) {
      return this
    }
    const { direction, nodeSep = 110, rankSep = 120 } = this.view.autoLayout
    const transposed = direction === 'LR' || direction === 'RL'
    // Sizes are measured in rank coordinates:
    // `w` runs across a rank, `h` runs along the rank axis (rows are stacked along it).
    const toRank = (extent: Extent): Extent => transposed ? { w: extent.h, h: extent.w } : extent

    const wraps = [] as Array<{ parent: NodeId | null; units: ComputedNode[]; columns: number }>
    const planWrap = (parent: NodeId | null, units: ComputedNode[], cells: Extent[]) => {
      const columns = chooseColumns(cells, { transposed })
      wraps.push({ parent, units, columns })
      return columns
    }

    // Size of a unit together with the spacing Graphviz keeps around it
    const cellOf = (unit: ComputedNode): Extent => {
      if (!isCompound(unit)) {
        const { width, height } = this.nodeSize(unit)
        const { w, h } = toRank({ w: width, h: height })
        return { w: w + nodeSep, h: h + rankSep }
      }
      const units = unit.children.map(id => this.computedNode(id))
      const cells = units.map(cellOf)
      const body = wrappedExtent(cells, planWrap(unit.id, units, cells))
      const title = isEmpty(unit.title.trim()) ? 0 : CompoundTitleHeight
      const margin = this.clusterMargin(unit)
      const border = toRank({ w: 2 * margin, h: 2 * margin + title })
      return { w: body.w + border.w, h: body.h + border.h }
    }

    const topUnits = this.view.nodes.filter(n => n.parent === null)
    planWrap(null, topUnits, topUnits.map(cellOf))

    const leavesOf = (unit: ComputedNode) => isCompound(unit) ? this.leafElements(unit.id) : [unit]
    for (const { parent, units, columns } of wraps) {
      const container = parent === null ? this.G : nonNullable(this.getSubgraph(parent))
      for (const [from, to] of rowLinks(units.length, columns)) {
        const upper = leavesOf(units[from]!).at(-1)
        const lower = leavesOf(units[to]!).at(0)
        const upperNode = upper && this.getGraphNode(upper.id)
        const lowerNode = lower && this.getGraphNode(lower.id)
        if (upperNode && lowerNode) {
          container.edge([upperNode, lowerNode], { [_.style]: 'invis' })
        }
      }
    }
    return this
  }

  private applyExplicitRankBlocks(): this {
    const ranks = this.view.ranks ?? []
    if (ranks.length === 0) {
      return this
    }
    let applied = 0
    for (const constraint of ranks) {
      const nodes = [...new Set(constraint.nodes)]
        .map(id => this.getGraphNode(id))
        .filter((node): node is NodeModel => Boolean(node))
      if (nodes.length === 0) {
        continue
      }
      const rankSubgraph = this.G.createSubgraph({ [_.rank]: constraint.type })
      nodes.forEach(node => rankSubgraph.node(node.id))
      applied += 1
      rankLogger.trace`rank ${constraint.type} => ${nodes.map(node => node.id).join(', ')}`
    }
    if (applied > 0) {
      this.G.set('likec4_rankBlocks' as any, applied)
    }
    return this
  }

  protected override addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null {
    // const viewEdges = this.view.edges
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const edgeParentId = edge.parent

    const edgeAttrs = this.graphology.getEdgeAttributes(edge.id)

    const e = G.edge([source, target], {
      [_.likec4_id]: edge.id,
    })
    if (edge.line && edge.line !== this.$defaults.relationship.line) {
      e.attributes.set(_.style, edge.line)
    }

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    const hasCompoundEndpoint = isNonNullish(lhead) || isNonNullish(ltail)

    const label = edgelabel(edge)
    if (label) {
      e.attributes.set(
        hasCompoundEndpoint ? _.xlabel : _.label,
        label,
      )
    }
    if (edge.color && edge.color !== this.$defaults.relationship.color) {
      const colorValues = this.styles.colors(edge.color).relationships
      e.attributes.apply({
        [_.color]: colorValues.line,
        [_.fontcolor]: colorValues.label as HexColor,
      })
    }

    if (!this.graphology.hasDirectedEdge(edge.target, edge.source) && edgeAttrs.weight > 1) {
      e.attributes.set(_.weight, edgeAttrs.weight)
    }

    let [head, tail] = [edge.head ?? this.$defaults.relationship.arrow, edge.tail ?? 'none']

    if (edge.dir === 'back') {
      e.attributes.apply({
        [_.arrowtail]: toArrowType(head),
        [_.dir]: 'back',
      })
      if (tail !== 'none') {
        e.attributes.apply({
          [_.arrowhead]: toArrowType(tail),
          [_.dir]: 'both',
          [_.minlen]: 0,
        })
      }
      return e
    }

    if (head === 'none' && tail === 'none') {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        [_.minlen]: 0,
        [_.constraint]: false,
      })
      return e
    }

    if (head !== 'none' && tail !== 'none') {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(head),
        [_.arrowtail]: toArrowType(tail),
        [_.dir]: 'both',
        // [_.minlen]: 0,
      })
      return e
    }

    e.attributes.set(_.arrowhead, toArrowType(head))
    if (tail !== 'none') {
      e.attributes.set(_.arrowtail, toArrowType(tail))
    }

    // Skip the following heuristic if this is the only edge in view
    if (this.view.edges.length === 1) {
      return e
    }

    // This heuristic removes the rank constraint from the edge
    // if it is the only edge within container.
    let otherEdges
    if (edgeParentId === null && sourceNode.parent == null && targetNode.parent == null) {
      otherEdges = this.view.edges.filter(e => {
        // exclude self
        if (e.id === edge.id) {
          return false
        }
        // exclude edges inside clusters
        if (e.parent !== null) {
          return false
        }
        // exclude edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        const edgeSource = this.computedNode(e.source)
        const edgeTarget = this.computedNode(e.target)
        // hide edges with compound endpoints
        if (isCompound(edgeSource) || isCompound(edgeTarget)) {
          return false
        }
        // only edges between top-level nodes
        return edgeSource.parent == null && edgeTarget.parent == null
      })
    } else {
      otherEdges = this.findInternalEdges(edgeParentId).filter(e => {
        // exclude self
        if (e.id === edge.id) {
          return false
        }
        // exclude edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        return true
      })
    }
    const isTheOnlyEdge = otherEdges.length === 0
    if (isTheOnlyEdge) {
      if (edgeParentId === null || this.leafElements(edgeParentId).length <= 3) {
        // don't rank the edge
        e.attributes.set(_.minlen, 0)
        // e.attributes.set(_.constraint, false)
      }
    }

    return e
  }
}
