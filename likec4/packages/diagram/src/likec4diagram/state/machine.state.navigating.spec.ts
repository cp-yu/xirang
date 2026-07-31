import type { DiagramView, LayoutedDynamicView, LayoutedElementView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActor, fromCallback } from 'xstate'
import { DefaultFeatures } from '../../context/DiagramFeatures'
import type { XYFlowInstance, XYStoreApi } from '../../hooks/useXYFlow'
import { diagramMachine } from './machine'

// Minimal mock views — use `satisfies` so TypeScript validates the shapes.
// `scalar.ViewId()` is required because the `id` field is a branded type.
const mockElementView = {
  _type: 'element' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:element'),
  title: 'Element View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-element',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
} satisfies LayoutedElementView

const mockDiagramDynamicView = {
  _type: 'dynamic' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:dynamic-diagram'),
  title: 'Diagram Dynamic View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-diagram',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  variant: 'diagram' as const,
  sequenceLayout: {
    actors: [],
    compounds: [],
    parallelAreas: [],
    subflows: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} satisfies LayoutedDynamicView

const mockSequenceDynamicView = {
  _type: 'dynamic' as const,
  _stage: 'layouted' as const,
  id: scalar.ViewId('view:dynamic-sequence'),
  title: 'Sequence Dynamic View',
  description: null,
  tags: null,
  links: null,
  hash: 'mock-hash-sequence',
  autoLayout: { direction: 'TB' as const },
  nodes: [],
  edges: [],
  bounds: { x: 0, y: 0, width: 800, height: 600 },
  variant: 'sequence' as const,
  sequenceLayout: {
    actors: [],
    compounds: [],
    subflows: [],
    parallelAreas: [],
    steps: [],
    bounds: { x: 0, y: 0, width: 800, height: 600 },
  },
} satisfies LayoutedDynamicView

// XYStore and XYFlow are intentional partial stubs: only the methods the machine
// actually calls are implemented, so satisfies cannot be used here.
const mockXYStore = {
  getState: () => ({
    width: 800,
    height: 600,
    transform: [0, 0, 1] as [number, number, number],
    panZoom: undefined,
    panBy: async () => false,
  }),
  setState: () => {},
  subscribe: () => () => {},
} as unknown as XYStoreApi

const mockXYFlow = {
  getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
  setViewport: () => Promise.resolve(true),
  getInternalNode: (_id: string) => undefined,
  flowToScreenPosition: (pt: { x: number; y: number }) => pt,
  fitView: async () => true,
} as unknown as XYFlowInstance

/**
 * Creates a test actor for the diagram machine and starts it.
 * Overrides mediaPrintActorLogic with a no-op to avoid window.addEventListener in Node.js.
 */
function createTestActor(initialView: DiagramView) {
  const actor = createActor(
    diagramMachine.provide({
      actors: {
        // mediaPrint actor uses window.addEventListener — replace with no-op for tests
        mediaPrint: fromCallback(() => () => {}),
      },
    }),
    {
      input: {
        view: initialView,
        xystore: mockXYStore,
        zoomable: true,
        pannable: true,
        nodesDraggable: false,
        nodesSelectable: false,
        fitViewPadding: {},
        where: null,
        features: DefaultFeatures,
      },
    },
  )
  actor.start()
  return actor
}

/**
 * Advances the machine from `initializing` to `ready` state by sending the two
 * events required by the initializing state: xyflow.init and update.view.
 */
function advanceToReady(actor: ReturnType<typeof createTestActor>, view: DiagramView) {
  actor.send({ type: 'xyflow.init', instance: mockXYFlow })
  actor.send({
    type: 'update.view',
    view,
    source: 'external',
    xynodes: [],
    xyedges: [],
  })
}

describe('navigating state - dynamicViewVariant', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps View identity stable while recording focus history', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    actor.send({ type: 'navigate.focus', focusIdentity: 'project.root' })
    actor.send({ type: 'navigate.focus', focusIdentity: 'project.root.child' })

    expect(actor.getSnapshot().context.view.id).toBe(mockElementView.id)
    expect(actor.getSnapshot().context.focusIdentity).toBe('project.root.child')
    expect(actor.getSnapshot().context.navigationHistory.currentIndex).toBe(2)

    actor.send({ type: 'navigate.back' })
    expect(actor.getSnapshot().context.view.id).toBe(mockElementView.id)
    expect(actor.getSnapshot().context.focusIdentity).toBe('project.root')

    actor.send({ type: 'navigate.forward' })
    expect(actor.getSnapshot().context.focusIdentity).toBe('project.root.child')
    actor.stop()
  })

  it('replaces focus history when a new View source is selected', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    actor.send({ type: 'navigate.focus', focusIdentity: 'project.root' })
    actor.send({ type: 'navigate.focus', focusIdentity: 'project.root.child' })
    actor.send({ type: 'navigate.focus', focusIdentity: 'change.root', replaceHistory: true })

    expect(actor.getSnapshot().context.focusIdentity).toBe('change.root')
    expect(actor.getSnapshot().context.navigationHistory).toMatchObject({ currentIndex: 0 })
    expect(actor.getSnapshot().context.navigationHistory.history).toHaveLength(1)
    actor.stop()
  })

  it('sets dynamicViewVariant to "sequence" when navigating from a non-dynamic view', () => {
    const actor = createTestActor(mockElementView)

    advanceToReady(actor, mockElementView)

    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })

  it('sets dynamicViewVariant to "sequence" when navigating from a diagram-variant dynamic view', () => {
    const actor = createTestActor(mockDiagramDynamicView)

    advanceToReady(actor, mockDiagramDynamicView)

    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })

  it('initializes dynamicViewVariant from the view variant on first load (sequence)', () => {
    const actor = createTestActor(mockSequenceDynamicView)

    // Machine initializes context.dynamicViewVariant from input.view.variant
    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })

  it('restores dynamicViewVariant to "sequence" when navigating back to a sequence view', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    // First navigation to sequence view
    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })
    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    // Navigate away to element view
    actor.send({
      type: 'update.view',
      view: mockElementView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    // Navigate back to sequence view — history restore path
    actor.send({
      type: 'update.view',
      view: mockSequenceDynamicView,
      source: 'external',
      xynodes: [],
      xyedges: [],
    })

    expect(actor.getSnapshot().context.dynamicViewVariant).toBe('sequence')

    actor.stop()
  })
})

describe('expand state - view-wide expansion set', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts empty and toggles one identity at a time', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    expect([...actor.getSnapshot().context.expandedNodes]).toEqual([])

    actor.send({ type: 'expand.toggle', identity: 'b' })
    expect([...actor.getSnapshot().context.expandedNodes]).toEqual(['b'])

    actor.send({ type: 'expand.toggle', identity: 'c' })
    expect([...actor.getSnapshot().context.expandedNodes].sort()).toEqual(['b', 'c'])

    actor.send({ type: 'expand.toggle', identity: 'b' })
    expect([...actor.getSnapshot().context.expandedNodes]).toEqual(['c'])
    actor.stop()
  })

  it('replaces the whole set on expand.set and clears it with an empty set', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    actor.send({ type: 'expand.set', expanded: new Set(['b', 'c', 'd']) })
    expect([...actor.getSnapshot().context.expandedNodes].sort()).toEqual(['b', 'c', 'd'])

    actor.send({ type: 'expand.set', expanded: new Set() })
    expect([...actor.getSnapshot().context.expandedNodes]).toEqual([])
    actor.stop()
  })

  /** Expansion belongs to the View, not to a focus level: drill-down and back must not reset it. */
  it('survives focus changes and history navigation', () => {
    const actor = createTestActor(mockElementView)
    advanceToReady(actor, mockElementView)

    actor.send({ type: 'expand.toggle', identity: 'c' })
    actor.send({ type: 'navigate.focus', focusIdentity: 'a' })
    actor.send({ type: 'navigate.focus', focusIdentity: 'b' })
    expect([...actor.getSnapshot().context.expandedNodes]).toEqual(['c'])

    actor.send({ type: 'navigate.back' })
    expect(actor.getSnapshot().context.focusIdentity).toBe('a')
    expect([...actor.getSnapshot().context.expandedNodes]).toEqual(['c'])
    actor.stop()
  })
})
