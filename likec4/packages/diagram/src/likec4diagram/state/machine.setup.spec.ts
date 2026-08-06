import type { DiagramView, LayoutedElementView } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { ViewPaddings } from '../../LikeC4Diagram.props'
import { Context, type Input } from './machine.setup'

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

function baseInput(overrides: Partial<Input> = {}): Input {
  return {
    view: mockElementView as unknown as DiagramView,
    xystore: {} as Input['xystore'],
    zoomable: true,
    pannable: true,
    nodesDraggable: false,
    nodesSelectable: false,
    fitViewPadding: { x: '20px', y: '20px' } satisfies ViewPaddings,
    where: null,
    ...overrides,
  }
}

describe('machine setup Context seeding', () => {
  it('defaults to null focus and empty expanded set when no initial state is provided', () => {
    const context = Context({ input: baseInput() })
    expect(context.focusIdentity).toBeNull()
    expect(context.expandedNodes.size).toBe(0)
  })

  it('seeds focusIdentity and expandedNodes from the initial inputs', () => {
    const context = Context({
      input: baseInput({
        initialFocusIdentity: 'perspective.browser',
        initialExpanded: new Set(['capability.drill']),
      }),
    })
    expect(context.focusIdentity).toBe('perspective.browser')
    expect([...context.expandedNodes]).toEqual(['capability.drill'])
  })

  it('accepts a null initial focus while keeping expanded seeding', () => {
    const context = Context({
      input: baseInput({
        initialFocusIdentity: null,
        initialExpanded: new Set(['a', 'b']),
      }),
    })
    expect(context.focusIdentity).toBeNull()
    expect([...context.expandedNodes].sort()).toEqual(['a', 'b'])
  })
})
