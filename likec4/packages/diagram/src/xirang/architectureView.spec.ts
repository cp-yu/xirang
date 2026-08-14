import type { DiagramView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { XirangDiffOperation, XirangViewSource } from './ContractLoaderContext'
import { applyXirangPresentationOverlay, applyXirangRelationshipPresentation } from './architectureView'

const baseView = (edges: DiagramView['edges'] = []): DiagramView => ({
  id: 'model',
  title: 'Model',
  hash: 'hash',
  bounds: { x: 0, y: 0, width: 800, height: 500 },
  nodes: [
    {
      id: 'a', modelRef: 'a', parent: null, children: [], inEdges: [], outEdges: [],
      title: 'A', description: { txt: 'A' }, metadata: { elementId: 'a' },
      x: 100, y: 100, width: 120, height: 80, shape: 'rectangle', color: 'blue', style: { opacity: 100 }, kind: 'el',
    },
    {
      id: 'b', modelRef: 'b', parent: null, children: [], inEdges: [], outEdges: [],
      title: 'B', description: { txt: 'B' }, metadata: { elementId: 'b' },
      x: 400, y: 100, width: 120, height: 80, shape: 'rectangle', color: 'green', style: { opacity: 100 }, kind: 'el',
    },
    {
      id: 'c', modelRef: 'c', parent: null, children: [], inEdges: [], outEdges: [],
      title: 'C', description: { txt: 'C' }, metadata: { elementId: 'c' },
      x: 700, y: 100, width: 120, height: 80, shape: 'rectangle', color: 'red', style: { opacity: 100 }, kind: 'el',
    },
    {
      id: 'd', modelRef: 'd', parent: null, children: [], inEdges: [], outEdges: [],
      title: 'D', description: { txt: 'D' }, metadata: { elementId: 'd' },
      x: 100, y: 400, width: 120, height: 80, shape: 'rectangle', color: 'yellow', style: { opacity: 100 }, kind: 'el',
    },
  ],
  edges,
} as unknown as DiagramView)

const source: XirangViewSource = {
  id: 'change:auth', label: 'Auth', source: 'change-derived-view', change: 'auth', valid: true, diagnostics: [],
  architecture: {
    elements: [
      { declaration: { identity: 'a', kind: 'service', parent: null, title: 'A', definition: '', summary: '', description: '' } },
      { declaration: { identity: 'b', kind: 'service', parent: null, title: 'B', definition: '', summary: '', description: '' } },
      { declaration: { identity: 'c', kind: 'service', parent: null, title: 'C', definition: '', summary: '', description: '' } },
      { declaration: { identity: 'd', kind: 'service', parent: null, title: 'D', definition: '', summary: '', description: '' } },
    ],
    relationships: [],
    elementKinds: [{ identity: 'service', nodePresentation: { shape: 'hexagon', color: 'orange', border: 'dashed' } }],
  },
  diff: {
    summary: { total: 3, ADDED: 1, MODIFIED: 1, REMOVED: 1 },
    entries: [
      { kind: 'element-declaration', identity: 'a', operation: 'MODIFIED' },
      { kind: 'element-declaration', identity: 'b', operation: 'REMOVED' },
      { kind: 'element-declaration', identity: 'd', operation: 'ADDED' },
    ],
  },
}

describe('applyXirangPresentationOverlay', () => {
  it('preserves official geometry and business presentation while adding diff metadata', () => {
    const before = baseView()
    const after = applyXirangPresentationOverlay(before, source)
    expect(after.nodes.map(node => ({ id: node.id, x: node.x, y: node.y, width: node.width, height: node.height })))
      .toEqual(before.nodes.map(node => ({ id: node.id, x: node.x, y: node.y, width: node.width, height: node.height })))
    expect(after.nodes[0]).toMatchObject({ shape: 'hexagon', color: 'orange', metadata: { xirangOperation: 'MODIFIED' } })
    expect(after.nodes[1]).toMatchObject({ shape: 'hexagon', color: 'orange', metadata: { xirangOperation: 'REMOVED' } })
    expect(after.nodes[1]!.style.opacity).toBe(45)
  })

  it('dims nodes without a diff operation to 25% opacity when diff is active', () => {
    const after = applyXirangPresentationOverlay(baseView(), source)
    expect(after.nodes[2]!.style.opacity).toBe(25)
  })

  it('keeps ADDED and MODIFIED nodes at 100% opacity when diff is active', () => {
    const after = applyXirangPresentationOverlay(baseView(), source)
    expect(after.nodes[3]!.style.opacity).toBe(100)
    expect(after.nodes[0]!.style.opacity).toBe(100)
  })

  it('keeps REMOVED nodes at 45% ghost opacity when diff is active', () => {
    const ghostView = baseView()
    const after = applyXirangPresentationOverlay({
      ...ghostView,
      nodes: ghostView.nodes.map((node, index) => index === 1 ? { ...node, style: { opacity: 15 } } : node),
    } as DiagramView, source)
    expect(after.nodes[1]!.style.opacity).toBe(45)
  })

  it('does not outline the host element when only its contract requirement changes', () => {
    const contractOnlySource: XirangViewSource = {
      ...source,
      architecture: {
        ...source.architecture!,
        elements: [
          ...(source.architecture?.elements ?? []),
          { declaration: { identity: 'semantic-browser', kind: 'service', parent: null, title: 'SB', definition: '', summary: '', description: '' } },
        ],
      },
      diff: {
        summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 },
        entries: [{ kind: 'requirement', identity: 'semantic-browser#呈现 Change 目标与差异', operation: 'MODIFIED' }],
      },
    }
    const view = baseView()
    const withHost = {
      ...view,
      nodes: [
        ...view.nodes,
        {
          id: 'semantic-browser',
          modelRef: 'semantic-browser',
          parent: null,
          children: [],
          inEdges: [],
          outEdges: [],
          title: 'SB',
          description: { txt: 'SB' },
          metadata: { elementId: 'semantic-browser' },
          x: 100,
          y: 700,
          width: 120,
          height: 80,
          shape: 'rectangle',
          color: 'blue',
          style: { opacity: 100 },
          kind: 'el',
        },
      ],
    } as unknown as DiagramView
    const after = applyXirangPresentationOverlay(withHost, contractOnlySource)
    const host = after.nodes.find(node => node.id === 'semantic-browser')
    expect(host?.metadata).toMatchObject({ xirangRequirementCounts: '0,1,0' })
    expect(host?.metadata).not.toHaveProperty('xirangOperation')
    expect(host?.style.opacity).toBe(100)
    // 纯 contract 变更不激活 dimming
    expect(after.nodes.map(node => node.style.opacity)).toEqual([100, 100, 100, 100, 100])
  })

  it('aggregates multiple requirement operations into one host node metadata', () => {
    const mixedContractSource: XirangViewSource = {
      ...source,
      architecture: {
        ...source.architecture!,
        elements: [
          { declaration: { identity: 'a', kind: 'service', parent: null, title: 'A', definition: '', summary: '', description: '' } },
        ],
      },
      diff: {
        summary: { total: 4, ADDED: 2, MODIFIED: 1, REMOVED: 1 },
        entries: [
          { kind: 'requirement', identity: 'a#新增一', operation: 'ADDED' },
          { kind: 'requirement', identity: 'a#新增二', operation: 'ADDED' },
          { kind: 'requirement', identity: 'a#修改一', operation: 'MODIFIED' },
          { kind: 'requirement', identity: 'a#移除一', operation: 'REMOVED' },
        ],
      },
    }
    const after = applyXirangPresentationOverlay(baseView(), mixedContractSource)
    const host = after.nodes.find(node => node.id === 'a')
    expect(host?.metadata).toMatchObject({ xirangRequirementCounts: '2,1,1' })
    expect(host?.metadata).not.toHaveProperty('xirangOperation')
    expect(host?.style.opacity).toBe(100)
  })

  it('combines element operation with requirement counts on the same node', () => {
    const bothSource: XirangViewSource = {
      ...source,
      diff: {
        summary: { total: 2, ADDED: 1, MODIFIED: 1, REMOVED: 0 },
        entries: [
          { kind: 'element-declaration', identity: 'a', operation: 'MODIFIED' },
          { kind: 'requirement', identity: 'a#新增一', operation: 'ADDED' },
        ],
      },
    }
    const after = applyXirangPresentationOverlay(baseView(), bothSource)
    const host = after.nodes.find(node => node.id === 'a')
    expect(host?.metadata).toMatchObject({ xirangOperation: 'MODIFIED', xirangRequirementCounts: '1,0,0' })
    expect(host?.style.opacity).toBe(100)
  })

  it('dims unchanged nodes when an element-declaration entry has an invalid operation', () => {
    const invalidOpSource: XirangViewSource = {
      ...source,
      diff: {
        summary: { total: 1, ADDED: 0, MODIFIED: 0, REMOVED: 0 },
        entries: [{ kind: 'element-declaration', identity: 'a', operation: 'INVALID' as XirangDiffOperation }],
      },
    }
    const after = applyXirangPresentationOverlay(baseView(), invalidOpSource)
    expect(after.nodes.find(node => node.id === 'b')!.style.opacity).toBe(25)
    expect(after.nodes.every(node => !node.metadata?.['xirangOperation'])).toBe(true)
  })

  it('keeps the last element-declaration operation per identity', () => {
    const duplicateSource: XirangViewSource = {
      ...source,
      diff: {
        summary: { total: 2, ADDED: 0, MODIFIED: 1, REMOVED: 1 },
        entries: [
          { kind: 'element-declaration', identity: 'a', operation: 'MODIFIED' },
          { kind: 'element-declaration', identity: 'a', operation: 'REMOVED' },
        ],
      },
    }
    const after = applyXirangPresentationOverlay(baseView(), duplicateSource)
    const nodeA = after.nodes.find(node => node.id === 'a')
    expect(nodeA?.metadata).toMatchObject({ xirangOperation: 'REMOVED' })
    expect(nodeA?.style.opacity).toBe(45)
  })

  it('keeps the first relationship operation per identity', () => {
    const duplicateEdgeSource: XirangViewSource = {
      ...source,
      diff: {
        summary: { total: 2, ADDED: 1, MODIFIED: 0, REMOVED: 1 },
        entries: [
          { kind: 'relationship', identity: 'a|calls|b', operation: 'ADDED' },
          { kind: 'relationship', identity: 'a|calls|b', operation: 'REMOVED' },
        ],
      },
    }
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    const after = applyXirangPresentationOverlay(baseView([edge] as never), duplicateEdgeSource)
    expect((after.edges[0] as { metadata?: Record<string, unknown> }).metadata).toMatchObject({ xirangOperation: 'ADDED' })
  })

  it('does not invent element operations for kind-only metamodel diffs', () => {
    const kindOnlySource: XirangViewSource = {
      ...source,
      diff: {
        summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 },
        entries: [{ kind: 'element-kind', identity: 'service', operation: 'MODIFIED' }],
      },
    }
    const after = applyXirangPresentationOverlay(baseView(), kindOnlySource)
    expect(after.nodes.map(node => node.style.opacity)).toEqual([100, 100, 100, 100])
    expect(after.nodes.every(node => !node.metadata?.['xirangOperation'])).toBe(true)
  })

  it('keeps default opacity when no diff is active', () => {
    const { diff: _diff, ...noDiffSource } = source
    const after = applyXirangPresentationOverlay(baseView(), noDiffSource)
    expect(after.nodes[2]!.style.opacity).toBe(100)
  })

  it('dims unchanged relationship edges to 25% opacity when diff is active', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    const after = applyXirangPresentationOverlay(baseView([edge] as never), source)
    expect(after.edges[0]).toMatchObject({ style: { opacity: 25 } })
  })

  it('keeps changed relationship edges at full opacity when diff is active', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    const after = applyXirangPresentationOverlay(baseView([edge] as never), {
      ...source,
      diff: { summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 }, entries: [{ kind: 'relationship', identity: 'a|calls|b', operation: 'MODIFIED' }] },
    })
    expect((after.edges[0] as { style?: unknown }).style).toBeUndefined()
  })

  it('does not replace a Relationship presentation with a diff color', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', color: 'purple', line: 'dashed', head: 'vee', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    const after = applyXirangPresentationOverlay(baseView([edge] as never), {
      ...source,
      diff: { summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 }, entries: [{ kind: 'relationship', identity: 'a|calls|b', operation: 'MODIFIED' }] },
    })
    expect(after.edges[0]).toMatchObject({ color: 'purple', line: 'dashed', head: 'vee', metadata: { xirangOperation: 'MODIFIED' } })
  })

  it('aggregates relationship diff counts on merged edges and keeps single-operation glyphs', () => {
    const edges = [
      { id: 'merged', source: 'a', target: 'b', label: '[...]', points: [], relations: [], xirangRelations: ['a|calls|b', 'a|reads|b'] },
      { id: 'single', source: 'c', target: 'd', label: 'calls', points: [], relations: [], xirangRelations: ['c|calls|d'] },
    ]
    const after = applyXirangPresentationOverlay(baseView(edges as never), {
      ...source,
      diff: {
        summary: { total: 3, ADDED: 1, MODIFIED: 1, REMOVED: 1 },
        entries: [
          { kind: 'relationship', identity: 'a|calls|b', operation: 'ADDED' },
          { kind: 'relationship', identity: 'a|reads|b', operation: 'REMOVED' },
          { kind: 'relationship', identity: 'c|calls|d', operation: 'MODIFIED' },
        ],
      },
    })
    const mergedMetadata = (after.edges[0] as unknown as { metadata?: Record<string, unknown> }).metadata
    const singleMetadata = (after.edges[1] as unknown as { metadata?: Record<string, unknown> }).metadata
    expect(mergedMetadata).toMatchObject({ xirangRelationCounts: '1,0,1' })
    expect(mergedMetadata).not.toHaveProperty('xirangOperation')
    expect(singleMetadata).toMatchObject({ xirangOperation: 'MODIFIED' })
    expect(singleMetadata).not.toHaveProperty('xirangRelationCounts')
  })
})

describe('applyXirangRelationshipPresentation', () => {
  it('merges same-endpoint relationships into one edge with the layout label', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: '[...]', points: [], relations: [], xirangRelations: ['a|calls|b', 'a|reads|b'] }
    const presented = {
      ...source,
      architecture: {
        ...source.architecture!,
        relationshipKinds: [
          { identity: 'calls', presentation: { color: 'red', line: 'dashed', head: 'vee', tail: 'dot' } },
          { identity: 'reads', presentation: { color: 'blue', line: 'dotted', head: 'diamond', tail: 'none' } },
        ],
      },
    }
    const result = applyXirangRelationshipPresentation(baseView([edge] as never), presented)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0]).toMatchObject({ id: 'edge', label: '[...]' })
    expect(result.edges[0]).not.toHaveProperty('color')
    expect((result.edges[0] as unknown as { xirangRelations?: string[] }).xirangRelations).toEqual(['a|calls|b', 'a|reads|b'])
  })

  it('keeps reciprocal edges as separate identities with independent metadata', () => {
    const edges = [
      { id: 'forward', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] },
      { id: 'reverse', source: 'b', target: 'a', label: 'depends', points: [], relations: [], xirangRelations: ['b|depends|a'] },
    ]
    const result = applyXirangRelationshipPresentation(baseView(edges as never))
    expect(result.edges).toHaveLength(2)
    expect(result.edges.map(item => [item.source, item.target, item.id])).toEqual([
      ['a', 'b', 'forward'],
      ['b', 'a', 'reverse'],
    ])
  })

  it('does not alter a native independent edge', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    expect(applyXirangRelationshipPresentation(baseView([edge] as never)).edges).toHaveLength(1)
  })

  it('reads aggregated triples from edge.metadata (server transport) and keeps them merged', () => {
    // The server attaches xirangRelations inside metadata; the browser must not depend on a top-level field.
    const edge = { id: 'edge', source: 'a', target: 'b', label: '[...]', points: [], relations: [], metadata: { xirangRelations: ['a|calls|b', 'a|reads|b'] } }
    const result = applyXirangRelationshipPresentation(baseView([edge] as never))
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0]!.id).toBe('edge')
    expect((result.edges[0] as unknown as { xirangRelations?: string[] }).xirangRelations).toEqual(['a|calls|b', 'a|reads|b'])
  })

  it('applies Kind presentation to a single non-aggregated relationship edge', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    const presented = {
      ...source,
      architecture: {
        ...source.architecture!,
        relationshipKinds: [
          { identity: 'calls', presentation: { color: 'purple', line: 'solid', head: 'crow', tail: 'dot' } },
        ],
      },
    }
    const result = applyXirangRelationshipPresentation(baseView([edge] as never), presented)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0]).toMatchObject({ id: 'edge', color: 'purple', line: 'solid', head: 'crow', tail: 'dot' })
    expect((result.edges[0] as unknown as { xirangRelations?: string[] }).xirangRelations).toEqual(['a|calls|b'])
  })
})
