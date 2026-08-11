import { computeView } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import type { ComputedElementView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { ElementViewPrinter } from './ElementViewPrinter'
import { GraphvizLayouter, type GraphvizPort } from './GraphvizLayoter'
import type { DotSource } from './types'

class RecordingPort implements GraphvizPort {
  unflattenCalls = 0

  get name() {
    return 'recording'
  }

  get concurrency() {
    return 1
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    this.unflattenCalls += 1
    return dot
  }

  async acyclic(dot: DotSource): Promise<DotSource> {
    return dot
  }

  async layoutJson(_dot: DotSource): Promise<string> {
    return '{}'
  }

  async svg(_dot: DotSource): Promise<string> {
    return ''
  }

  dispose() {}

  [Symbol.dispose]() {
    this.dispose()
  }
}

function element(id: string, kind: string) {
  return { id, kind, title: id, technology: null, tags: null, links: null, style: {} }
}

function computedView(
  elements: Array<{ id: string; kind: string }>,
  relations: Array<{ id: string; source: string; target: string }>,
  include: string[],
): { view: ComputedElementView; styles: unknown } {
  const model = LikeC4Model.fromDump({
    _type: 'computed',
    projectId: 'test',
    project: { id: 'test' },
    elements: Object.fromEntries(elements.map(element => [element.id, element])),
    relations: Object.fromEntries(relations.map(relation => [relation.id, {
      id: relation.id,
      source: { model: relation.source },
      target: { model: relation.target },
      title: 'rel',
    }])),
    views: {},
    specification: { elements: { system: {}, component: {} }, relationships: {}, deployments: {}, tags: {} },
    deployments: { elements: {}, relations: {} },
    globals: { dynamicPredicates: {}, predicates: {}, styles: {} },
    imports: {},
  })
  const result = computeView({
    _stage: 'parsed',
    _type: 'element',
    id: 'index',
    title: '',
    description: null,
    tags: null,
    links: null,
    rules: [{ include: include.map(model => ({ ref: { model } })) }],
  } as never, model)
  if (!result.isSuccess) {
    throw result.error
  }
  return { view: result.view as ComputedElementView, styles: model.$styles }
}

const compoundElements = [
  element('cloud', 'system'),
  element('cloud.backend', 'component'),
  element('cloud.backend.graphql', 'component'),
  element('customer', 'system'),
]

function compoundEndpointView() {
  return computedView(
    compoundElements,
    [{ id: 'customer:cloud', source: 'customer', target: 'cloud' }],
    ['customer', 'cloud', 'cloud.backend', 'cloud.backend.graphql'],
  )
}

function flatView() {
  return computedView(
    [element('customer', 'system'), element('amazon', 'system')],
    [{ id: 'customer:amazon', source: 'customer', target: 'amazon' }],
    ['customer', 'amazon'],
  )
}

function compoundNodesWithLeafEdgesView() {
  return computedView(
    compoundElements,
    [{ id: 'graphql:customer', source: 'cloud.backend.graphql', target: 'customer' }],
    ['customer', 'cloud', 'cloud.backend', 'cloud.backend.graphql'],
  )
}

describe('GraphvizLayouter element view preprocessing', () => {
  it('skips unflatten when the view has compound endpoint edges', async () => {
    // cloud is a container (compound); the edge customer -> cloud has a compound endpoint
    const { view, styles } = compoundEndpointView()
    expect(new ElementViewPrinter(view, styles as never).hasEdgesWithCompounds).toBe(true)
    const port = new RecordingPort()
    const layouter = new GraphvizLayouter(port)
    try {
      await layouter.dot({ view, styles: styles as never })
      expect(port.unflattenCalls).toBe(0)
    } finally {
      layouter.dispose()
    }
  })

  it('keeps unflatten for a flat view without compound nodes', async () => {
    const { view, styles } = flatView()
    const port = new RecordingPort()
    const layouter = new GraphvizLayouter(port)
    try {
      await layouter.dot({ view, styles: styles as never })
      expect(port.unflattenCalls).toBe(1)
    } finally {
      layouter.dispose()
    }
  })

  it('keeps unflatten when compound nodes exist but every edge is leaf-to-leaf', async () => {
    const { view, styles } = compoundNodesWithLeafEdgesView()
    expect(new ElementViewPrinter(view, styles as never).hasEdgesWithCompounds).toBe(false)
    const port = new RecordingPort()
    const layouter = new GraphvizLayouter(port)
    try {
      await layouter.dot({ view, styles: styles as never })
      expect(port.unflattenCalls).toBe(1)
    } finally {
      layouter.dispose()
    }
  })
})
