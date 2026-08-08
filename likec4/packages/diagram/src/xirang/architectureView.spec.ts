import type { DiagramView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { XirangViewSource } from './ContractLoaderContext'
import { applyXirangPresentationOverlay, expandXirangRelationshipEdges } from './architectureView'

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
  ],
  edges,
} as unknown as DiagramView)

const source: XirangViewSource = {
  id: 'change:auth', label: 'Auth', source: 'change-derived-view', change: 'auth', valid: true, diagnostics: [],
  architecture: {
    elements: [
      { declaration: { identity: 'a', kind: 'service', parent: null, title: 'A', definition: '', summary: '', description: '' } },
      { declaration: { identity: 'b', kind: 'service', parent: null, title: 'B', definition: '', summary: '', description: '' } },
    ],
    relationships: [],
    elementKinds: [{ identity: 'service', nodePresentation: { shape: 'hexagon', color: 'orange', border: 'dashed' } }],
  },
  diff: {
    summary: { total: 2, ADDED: 0, MODIFIED: 1, REMOVED: 1 },
    entries: [
      { kind: 'element-declaration', identity: 'a', operation: 'MODIFIED' },
      { kind: 'element-declaration', identity: 'b', operation: 'REMOVED' },
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

  it('does not replace a Relationship presentation with a diff color', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', color: 'purple', line: 'dashed', head: 'vee', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    const after = applyXirangPresentationOverlay(baseView([edge] as never), {
      ...source,
      diff: { summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 }, entries: [{ kind: 'relationship', identity: 'a|calls|b', operation: 'MODIFIED' }] },
    })
    expect(after.edges[0]).toMatchObject({ color: 'purple', line: 'dashed', head: 'vee', metadata: { xirangOperation: 'MODIFIED' } })
  })
})

describe('expandXirangRelationshipEdges', () => {
  it('keeps reciprocal edges and expands same-endpoint relationships independently', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls,reads', points: [], relations: [], xirangRelations: ['a|calls|b', 'a|reads|b'] }
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
    const result = expandXirangRelationshipEdges(baseView([edge] as never), presented)
    expect(result.edges).toHaveLength(2)
    expect(new Set(result.edges.map(item => item.id)).size).toBe(2)
    expect(result.edges.map(item => item.label)).toEqual(['calls', 'reads'])
    expect(result.edges).toMatchObject([
      { color: 'red', line: 'dashed', head: 'vee', tail: 'dot' },
      { color: 'blue', line: 'dotted', head: 'diamond', tail: 'none' },
    ])
    expect(result.edges.every(item => item.source === 'a' && item.target === 'b')).toBe(true)
  })

  it('keeps reciprocal edges as separate identities with independent metadata', () => {
    const edges = [
      { id: 'forward', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] },
      { id: 'reverse', source: 'b', target: 'a', label: 'depends', points: [], relations: [], xirangRelations: ['b|depends|a'] },
    ]
    const result = expandXirangRelationshipEdges(baseView(edges as never))
    expect(result.edges).toHaveLength(2)
    expect(result.edges.map(item => [item.source, item.target, item.id])).toEqual([
      ['a', 'b', 'forward'],
      ['b', 'a', 'reverse'],
    ])
  })

  it('does not alter a native independent edge', () => {
    const edge = { id: 'edge', source: 'a', target: 'b', label: 'calls', points: [], relations: [], xirangRelations: ['a|calls|b'] }
    expect(expandXirangRelationshipEdges(baseView([edge] as never)).edges).toHaveLength(1)
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
    const result = expandXirangRelationshipEdges(baseView([edge] as never), presented)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0]).toMatchObject({ id: 'edge', color: 'purple', line: 'solid', head: 'crow', tail: 'dot' })
    expect((result.edges[0] as unknown as { xirangRelations?: string[] }).xirangRelations).toEqual(['a|calls|b'])
  })
})
