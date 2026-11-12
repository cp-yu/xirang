import { Builder } from '@likec4/core/builder'
import type { AdhocViewPredicate } from '@likec4/core/compute-view'
import type { LayoutedView } from '@likec4/core/types'
import type { LayoutTaskParams } from '@likec4/layouts'
import { describe, expect, it, vi } from 'vitest'
import { ProjectionCache } from './projection-cache'
import { layoutProjectionView } from './xirang-adhoc-layout'
import { handleProjection } from './xirang-projection-handler'

const model = Builder
  .specification({ elements: { el: {} } })
  .model(({ el }, _) => _(el('root'), el('root.a'), el('root.b')))
  .toLikeC4Model('xirang')

const predicates: AdhocViewPredicate[] = [{
  include: [{ ref: { model: 'root' } }, { ref: { model: 'root' }, selector: 'children' }],
}]

function fakeLikeC4() {
  const diagram = { id: 'adhoc', nodes: [], edges: [] } as unknown as LayoutedView
  const layout = vi.fn(async (_task: LayoutTaskParams) => ({ diagram }))
  const adhocView = vi.fn(async (_predicates: AdhocViewPredicate[], _projectId?: string) => diagram)
  const computedModel = vi.fn(async (_projectId?: string) => model)
  return {
    diagram,
    layout,
    adhocView,
    computedModel,
    likec4: { computedModel, viewsService: { adhocView, layouter: { layout } } },
  }
}

describe('layoutProjectionView', () => {
  it('lays out the computed adhoc view with sibling wrapping enabled', async () => {
    const { diagram, layout, adhocView, computedModel, likec4 } = fakeLikeC4()

    const result = await layoutProjectionView(likec4, predicates, 'xirang', true)

    expect(result).toBe(diagram)
    expect(computedModel).toHaveBeenCalledWith('xirang')
    expect(adhocView).not.toHaveBeenCalled()
    const task = layout.mock.calls[0]![0]
    expect(task.wrapSiblings).toBe(true)
    expect(task.styles).toBe(model.$styles)
    expect(task.view).toMatchObject({ _type: 'element', hash: '' })
    expect(task.view.nodes.map((n: { id: string }) => n.id).sort()).toEqual(['root', 'root.a', 'root.b'])
  })

  it('uses the plain adhocView when the layouter is not reachable', async () => {
    const { diagram, adhocView } = fakeLikeC4()

    const result = await layoutProjectionView({ viewsService: { adhocView } }, predicates, 'xirang', true)

    expect(result).toBe(diagram)
    expect(adhocView).toHaveBeenCalledWith(predicates, 'xirang')
  })
})

describe('handleProjection layout', () => {
  it.each(
    [
      ['full-model', 'semantic-model', true],
      ['full-model', 'candidate', true],
      ['full-model', 'change:next', true],
      ['authored', 'semantic-model', false],
      ['authored', 'change:next', false],
    ] as const,
  )('layout opt-in for %s / %s is %s', async (viewId, selection, wraps) => {
    const { layout, adhocView, likec4 } = fakeLikeC4()
    const manifest = {
      version: 5,
      modelFingerprint: 'fp',
      model: {
        sourceFingerprint: 'fp',
        architecture: {
          elements: [
            { declaration: { identity: 'root', parent: null } },
            { declaration: { identity: 'a', parent: 'root' } },
            { declaration: { identity: 'b', parent: 'root' } },
          ],
        },
        likec4Sources: { 'model.c4': 'model {}' },
        likec4ElementPaths: { root: 'root', a: 'root.a', b: 'root.b' },
      },
      authoredViews: {},
      changes: {},
    }

    const authoredViews = { authored: { roots: ['root'], selection: ['root', 'a', 'b'], virtualRoot: false } }
    Object.assign(manifest, {
      authoredViews,
      candidate: { ...manifest.model, authoredViews },
      changes: { next: { ...manifest.model, authoredViews } },
    })

    await handleProjection(
      { viewId, model: selection, mode: 'complete', focus: null, expanded: [], expectedFingerprint: 'fp' },
      {
        readManifest: async () => JSON.stringify(manifest),
        views: { diagrams: async () => [] },
        loadSources: async () => ({ diagrams: async () => [], ...likec4 }),
        cache: new ProjectionCache(50),
        projectId: 'xirang',
      },
    )

    if (wraps) {
      expect(adhocView).not.toHaveBeenCalled()
      expect(layout).toHaveBeenCalledTimes(1)
      expect(layout.mock.calls[0]![0].wrapSiblings).toBe(true)
    } else {
      expect(layout).not.toHaveBeenCalled()
      expect(adhocView).toHaveBeenCalledTimes(1)
    }
  })
})
