import type { AnyAux } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { describe, expect, it } from 'vitest'
import { wrapView } from './__fixtures__/wrap-view'
import { ElementViewPrinter } from './ElementViewPrinter'
import { GraphvizLayouter } from './GraphvizLayoter'
import { parseGraphvizJson } from './GraphvizParser'
import type { GraphvizJson } from './types-dot'
import { GraphvizWasmAdapter } from './wasm/GraphvizWasmAdapter'
import { chooseColumns, rowLinks, wrappedExtent } from './wrap-siblings'

const cell = { w: 430, h: 300 }

describe('wrap-siblings', () => {
  it('computes extent of cells wrapped into rows', () => {
    const cells = [{ w: 100, h: 50 }, { w: 200, h: 80 }, { w: 50, h: 60 }]
    expect(wrappedExtent(cells, 3)).toEqual({ w: 350, h: 80 })
    expect(wrappedExtent(cells, 2)).toEqual({ w: 300, h: 140 })
    expect(wrappedExtent(cells, 1)).toEqual({ w: 200, h: 190 })
  })

  it('chooses the number of columns closest to the target aspect ratio', () => {
    const cells = Array.from({ length: 12 }, () => cell)
    // 3 columns: 1290x1200 => 1.075, 2 columns: 860x1800 => 0.48, 3 vs 4: 1720x900 => 1.9
    expect(chooseColumns(cells, { target: 1 })).toBe(3)
    // Default 1.6 is closer to 4 columns (1.91) than 3 columns (1.075).
    expect(chooseColumns(cells)).toBe(4)
    expect(chooseColumns(cells, { target: 0.5 })).toBe(2)
    // wide target gives all in a row, 1 cell is always 1 column
    expect(chooseColumns(cells, { target: 100 })).toBe(12)
    expect(chooseColumns([cell])).toBe(1)
  })

  it('compares on a log scale and prefers fewer columns on ties', () => {
    // 1 column => 100x200 (0.5), 2 columns => 200x100 (2): equally far from 1 on a log scale
    const cells = [{ w: 100, h: 100 }, { w: 100, h: 100 }]
    expect(chooseColumns(cells, { target: 1 })).toBe(1)
  })

  it('swaps the ratio for horizontal rank direction', () => {
    const cells = Array.from({ length: 12 }, () => cell)
    // 4 columns => 1720x900, 2 columns => 860x1800
    expect(chooseColumns(cells, { target: 1.5 })).toBe(4)
    expect(chooseColumns(cells, { target: 1.5, transposed: true })).toBe(2)
  })

  it('links every unit with the unit right above it', () => {
    expect(rowLinks(5, 2)).toEqual([[0, 2], [1, 3], [2, 4]])
    expect(rowLinks(4, 4)).toEqual([])
    expect(rowLinks(1, 1)).toEqual([])
    expect(rowLinks(3, 1)).toEqual([[0, 1], [1, 2]])
  })
})

type Invisible = { container: string | null; from: string; to: string }

/** Edges with style=invis, with the cluster they are declared in (null for the root graph) */
function invisibleEdges(printer: ElementViewPrinter<AnyAux>): Invisible[] {
  const result = [] as Invisible[]
  const visit = (
    graph: ElementViewPrinter<AnyAux>['G'] | ElementViewPrinter<AnyAux>['G']['subgraphs'][number],
    container: string | null,
  ) => {
    for (const edge of graph.edges) {
      if (edge.attributes.get('style') === 'invis') {
        const [from, to] = edge.targets.map(t => ('id' in t ? t.id : '?'))
        result.push({ container, from: from!, to: to! })
      }
    }
    for (const sub of graph.subgraphs) {
      visit(sub, sub.id ?? null)
    }
  }
  visit(printer.G, null)
  return result
}

describe('ElementViewPrinter wrapSiblings', () => {
  const view = wrapView()
  const styles = Builder.specification({ elements: { el: {} } }).toLikeC4Model().$styles

  it('prints the same DOT unless enabled', () => {
    const plain = new ElementViewPrinter(view, styles).print()
    expect(new ElementViewPrinter(view, styles, {}).print()).toEqual(plain)
    expect(new ElementViewPrinter(view, styles, { wrapSiblings: false }).print()).toEqual(plain)
    expect(new ElementViewPrinter(view, styles, { wrapSiblings: true }).print()).not.toEqual(plain)
  })

  it('adds invisible edges only between sibling units inside their cluster', () => {
    const plainPrinter = new ElementViewPrinter(view, styles)
    plainPrinter.print()
    const printer = new ElementViewPrinter(view, styles, { wrapSiblings: true })
    printer.print()
    const added = invisibleEdges(printer).length - invisibleEdges(plainPrinter).length
    expect(added).toBeGreaterThan(0)

    const leaves = new Map(view.nodes.map(n => [n.id.split('.').at(-1)!, n]))
    const declared = invisibleEdges(printer)
    expect(declared.some(e => e.container === null)).toBe(true)
    expect(declared.some(e => e.container !== null)).toBe(true)
    for (const { container, from, to } of declared) {
      const cluster = container?.replace('cluster_', '')
      const clusterNode = cluster ? view.nodes.find(n => n.id.split('.').at(-1) === cluster)! : null
      const byId = new Map(view.nodes.map(n => [n.id, n]))
      const directUnit = (name: string) => {
        let unit = leaves.get(name)!
        while (unit.parent !== (clusterNode?.id ?? null)) {
          unit = byId.get(unit.parent!)!
          expect(unit).toBeDefined()
        }
        return unit.id
      }
      expect(directUnit(from)).not.toBe(directUnit(to))
    }
  })

  it('does not give invisible edges compound endpoints or ids', () => {
    const printer = new ElementViewPrinter(view, styles, { wrapSiblings: true })
    printer.print()
    const edgesOf = (
      graph: ElementViewPrinter<AnyAux>['G'] | ElementViewPrinter<AnyAux>['G']['subgraphs'][number],
    ): typeof graph.edges => [...graph.edges, ...graph.subgraphs.flatMap(edgesOf)]
    const invis = edgesOf(printer.G).filter(e => e.attributes.get('style') === 'invis')
    expect(invis.length).toBeGreaterThan(0)
    for (const edge of invis) {
      expect(edge.attributes.get('lhead')).toBeUndefined()
      expect(edge.attributes.get('ltail')).toBeUndefined()
      expect(edge.attributes.get('likec4_id')).toBeUndefined()
    }
  })

  it('does not leak invisible edges into the layout output', async () => {
    const layouter = new GraphvizLayouter(new GraphvizWasmAdapter())
    const dot = await layouter.dot({ view, styles, wrapSiblings: true })
    const json: GraphvizJson = await layouter.dotToJson(dot)
    const diagram = parseGraphvizJson(json, view)
    const graphvizEdges = json.edges ?? []
    expect(graphvizEdges.length).toBeGreaterThan(view.edges.length)
    expect(graphvizEdges.filter(e => e.likec4_id).length).toBe(view.edges.length)
    expect(diagram.edges.map(e => e.id).sort()).toEqual(view.edges.map(e => e.id).sort())
  })
})
