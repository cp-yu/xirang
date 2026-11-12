import { Builder } from '@likec4/core/builder'
import { configureLogger } from '@likec4/log'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { wrapView } from './__fixtures__/wrap-view'
import { type GraphvizPort, type LayoutJsonOptions, GraphvizLayouter } from './GraphvizLayoter'
import type { DotSource } from './types'
import type { GraphvizJson } from './types-dot'
import { GraphvizWasmAdapter } from './wasm/GraphvizWasmAdapter'
import { findWrappedLayoutDisadvantage, findWrappedLayoutProblem } from './wrap-fallback'

/**
 * Real Graphviz, but the n-th `layoutJson` call can be corrupted
 */
class ScriptedPort implements GraphvizPort {
  private inner = new GraphvizWasmAdapter()
  dots = [] as DotSource[]

  constructor(
    private script: (
      call: number,
      result: () => Promise<GraphvizJson>,
      options: LayoutJsonOptions | undefined,
    ) => Promise<string | GraphvizJson>,
  ) {}

  get name() {
    return 'scripted'
  }
  get concurrency() {
    return 1
  }
  unflatten(dot: DotSource) {
    return Promise.resolve(dot)
  }
  acyclic(dot: DotSource) {
    return this.inner.acyclic(dot)
  }
  svg(dot: DotSource) {
    return this.inner.svg(dot)
  }
  async layoutJson(dot: DotSource, options?: LayoutJsonOptions): Promise<string> {
    this.dots.push(dot)
    const out = await this.script(
      this.dots.length,
      async () => JSON.parse(await this.inner.layoutJson(dot)) as GraphvizJson,
      options,
    )
    return typeof out === 'string' ? out : JSON.stringify(out)
  }
  dispose() {}
  [Symbol.dispose]() {}
}

const view = wrapView()
const styles = Builder.specification({ elements: { el: {} } }).toLikeC4Model().$styles
const invisibleEdges = (dot: string) => dot.match(/invis/g)?.length ?? 0
const plainDot = () => new GraphvizLayouter(new ScriptedPort(async () => '{}')).dot({ view, styles })

const warnings = [] as string[]

beforeAll(() => {
  configureLogger({
    sinks: { memory: record => void warnings.push(record.message.join('')) },
    loggers: [{ category: 'likec4', sinks: ['memory'], lowestLevel: 'debug' }],
  })
})
afterAll(() => configureLogger())

async function layoutWith(script: ConstructorParameters<typeof ScriptedPort>[0], wrapSiblings = true) {
  const port = new ScriptedPort(script)
  const layouter = new GraphvizLayouter(port)
  warnings.length = 0
  const result = await layouter.layout({ view, styles, wrapSiblings })
  return { port, result, warnings: [...warnings] }
}

describe('GraphvizLayouter wrapSiblings fallback', () => {
  const passthrough = (_call: number, result: () => Promise<GraphvizJson>) => result()

  it('keeps the wrapped layout when it is sound', async () => {
    const { port, result, warnings } = await layoutWith(async (call, result) => {
      const json = await result()
      if (call === 2) json.bb = '0,10000,10000,0'
      return json
    })
    expect(port.dots).toHaveLength(2)
    expect(invisibleEdges(result.dot)).toBeGreaterThan(invisibleEdges(await plainDot()))
    expect(warnings.filter(w => w.includes('falling back'))).toEqual([])
  })

  it('is plain layout by default', async () => {
    const { port, result } = await layoutWith(passthrough, false)
    expect(port.dots).toHaveLength(1)
    expect(result.dot).toEqual(await plainDot())
  })

  it('returns the plain result when fit zoom improves by less than 5%', async () => {
    const { port, result, warnings } = await layoutWith(async (_call, result) => {
      const json = await result()
      json.bb = '0,10000,10000,0'
      return json
    })
    expect(port.dots).toHaveLength(2)
    expect(result.dot).toBe(port.dots[1])
    expect(warnings.some(w => w.includes('below 5%'))).toBe(true)
    expect(warnings.some(w => w.includes('falling back'))).toBe(false)
  })

  it('returns the plain result when edge length exceeds the limit despite a better zoom', async () => {
    const { port, result, warnings } = await layoutWith(async (call, result) => {
      const json = await result()
      json.bb = call === 1 ? '0,5000,5000,0' : '0,10000,10000,0'
      for (const edge of json.edges ?? []) {
        if (edge.likec4_id) edge._draw_ = [{ op: 'b', points: [[0, 0], [call === 1 ? 200 : 100, 0]] }]
      }
      return json
    })
    expect(port.dots).toHaveLength(2)
    expect(result.dot).toBe(port.dots[1])
    expect(warnings.some(w => w.includes('exceeds 1.5 times'))).toBe(true)
    expect(warnings.some(w => w.includes('falling back'))).toBe(false)
  })

  const fallbackCases = {
    'Graphviz fails': async (call: number, result: () => Promise<GraphvizJson>) => {
      if (call === 1) {
        throw new Error('boom')
      }
      return await result()
    },
    'Graphviz recovers from an error': async (
      call: number,
      result: () => Promise<GraphvizJson>,
      options: LayoutJsonOptions | undefined,
    ) => {
      if (call === 1) options?.onError?.(new Error('retry recovered'))
      return await result()
    },
    'Graphviz reports a pathplan warning': async (
      call: number,
      result: () => Promise<GraphvizJson>,
      options: LayoutJsonOptions | undefined,
    ) => {
      if (call === 1) {
        options?.onWarning?.('lib/pathplan/shortest.c:333: triangulation failed')
      }
      return await result()
    },
    'an edge is missing in the output': async (call: number, result: () => Promise<GraphvizJson>) => {
      const json = await result()
      if (call === 1) {
        json.edges = json.edges!.filter(e => e.likec4_id !== view.edges[0]!.id)
      }
      return json
    },
    'an edge has fewer than 2 points': async (call: number, result: () => Promise<GraphvizJson>) => {
      const json = await result()
      if (call === 1) {
        const edge = json.edges!.find(e => e.likec4_id === view.edges[0]!.id)!
        edge._draw_ = [{ op: 'b', points: [[0, 0]] }]
      }
      return json
    },
    'a node is outside of its parent': async (call: number, result: () => Promise<GraphvizJson>) => {
      const json = await result()
      if (call === 1) {
        const leaf = json.objects!.find(o => o.likec4_id === 'c.n1') as { pos: string }
        leaf.pos = '99999,99999'
      }
      return json
    },
  }

  const expectedInWarning: Record<keyof typeof fallbackCases, string> = {
    'Graphviz fails': 'boom',
    'Graphviz recovers from an error': 'retry recovered',
    'an edge has fewer than 2 points': 'edges are missing',
    'Graphviz reports a pathplan warning': 'triangulation failed',
    'an edge is missing in the output': 'edges are missing',
    'a node is outside of its parent': 'outside of its parent',
  }

  for (const [reason, script] of Object.entries(fallbackCases)) {
    it(`falls back to plain layout when ${reason}`, async () => {
      const { port, result, warnings } = await layoutWith(script)
      expect(port.dots).toHaveLength(2)
      const plain = await plainDot()
      expect(invisibleEdges(port.dots[0]!)).toBeGreaterThan(invisibleEdges(plain))
      expect(port.dots[1]).toEqual(plain)
      expect(result.dot).toEqual(plain)
      expect(result.diagram.edges).toHaveLength(view.edges.length)
      const warning = warnings.find(w => w.includes('falling back'))
      expect(warning).toContain(view.id)
      expect(warning).toContain(expectedInWarning[reason as keyof typeof fallbackCases])
    })
  }

  it('does not retry when the plain layout fails', async () => {
    const port = new ScriptedPort(async () => {
      throw new Error('boom')
    })
    await expect(new GraphvizLayouter(port).layout({ view, styles, wrapSiblings: true })).rejects.toThrow()
    expect(port.dots).toHaveLength(2)
  })
})

describe('findWrappedLayoutProblem', () => {
  const node = (id: string, x: number, y: number, width: number, height: number, parent: string | null = null) =>
    ({ id, x, y, width, height, parent }) as any
  const edge = (id: string, points: number) => ({ id, points: Array.from({ length: points }, (_, i) => [i, i]) }) as any
  const nodes = [node('p', 0, 0, 100, 100), node('c', 10, 10, 50, 50, 'p')]

  it('accepts a sound layout', () => {
    expect(findWrappedLayoutProblem({ edges: [{}] }, { nodes, edges: [edge('e', 4)] }, [])).toBeNull()
  })

  it('rejects edges with fewer than 2 points', () => {
    expect(findWrappedLayoutProblem({ edges: [{}] }, { nodes, edges: [edge('e', 1)] }, [])).toContain('fewer than 2')
  })

  it('rejects a child out of the parent bbox, but tolerates rounding', () => {
    const outside = [node('p', 0, 0, 100, 100), node('c', 80, 10, 50, 50, 'p')]
    expect(findWrappedLayoutProblem({ edges: [] }, { nodes: outside, edges: [] }, [])).toContain('outside')
    const rounding = [node('p', 0, 0, 100, 100), node('c', 51, 10, 50, 50, 'p')]
    expect(findWrappedLayoutProblem({ edges: [] }, { nodes: rounding, edges: [] }, [])).toBeNull()
  })

  it.each(['pathplan failed', 'triangulation failed', 'not in any triangle'])(
    'rejects routing diagnostic %s',
    warning => {
      expect(findWrappedLayoutProblem({ edges: [] }, { nodes, edges: [] }, [warning])).toContain(warning)
    },
  )

  it('ignores unrelated stderr output', () => {
    expect(findWrappedLayoutProblem({ edges: [] }, { nodes, edges: [] }, ['Warning: something else'])).toBeNull()
  })
})

describe('findWrappedLayoutDisadvantage', () => {
  const layout = (zoom: number, length = 100) =>
    ({
      bounds: { x: 0, y: 0, width: 1600 / zoom, height: 1000 / zoom },
      edges: [{ ...view.edges[0]!, points: [[0, 0], [length / 2, 0], [length, 0]] }],
    }) as Parameters<typeof findWrappedLayoutDisadvantage>[0]

  it('accepts the exact zoom and edge length thresholds', () => {
    expect(findWrappedLayoutDisadvantage(layout(1.05, 150), layout(1, 100))).toBeNull()
  })

  it('rejects a zoom regression or an improvement below 5%', () => {
    expect(findWrappedLayoutDisadvantage(layout(0.9), layout(1))).toContain('below 5%')
    expect(findWrappedLayoutDisadvantage(layout(1.049), layout(1))).toContain('below 5%')
  })

  it('sums every polyline segment and rejects excess length', () => {
    expect(findWrappedLayoutDisadvantage(layout(1.1, 150.01), layout(1, 100))).toContain('exceeds 1.5')
  })

  it('accepts views without edges', () => {
    expect(findWrappedLayoutDisadvantage({ ...layout(1.1), edges: [] }, { ...layout(1), edges: [] })).toBeNull()
  })
})

describe('GraphvizLayouter ignores wrapping for other view types', () => {
  const model = Builder
    .specification({ elements: { el: {} }, deployments: { node: {} } })
    .model(({ el, rel }, _) => _(el('a'), el('b'), rel('a', 'b')))
    .deployment(({ node, instanceOf }, _) => _(node('host').with(instanceOf('a'), instanceOf('b'))))
    .views(({ dynamicView, deploymentView, $step, $include }, _) =>
      _(
        dynamicView('flow').with($step('a -> b')),
        deploymentView('deployment').with($include('*'), $include('host.**')),
      )
    )
    .toLikeC4Model()

  it.each(['flow', 'deployment'] as const)('keeps %s layout unchanged', async id => {
    const port = new ScriptedPort((_call, result) => result())
    const layouter = new GraphvizLayouter(port)
    const task = { view: model.view(id).$view, styles: model.$styles }
    const result = await layouter.layout({ ...task, wrapSiblings: true })
    expect(port.dots).toHaveLength(1)
    expect(result.dot).toBe(await layouter.dot(task))
  })
})
