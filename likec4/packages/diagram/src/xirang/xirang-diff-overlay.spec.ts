import type { DiagramView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { XirangViewSource } from './ContractLoaderContext'
import { applyXirangPresentationOverlay } from './architectureView'

const baseView = (): DiagramView => ({
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
  ],
  edges: [
    {
      id: 'ab', source: 'a', target: 'b', relations: ['rel-ab'], label: 'invokes', metadata: { xirangRelations: ['a|invokes|b'] }, parent: null, points: [],
    },
    {
      id: 'bc', source: 'b', target: 'c', relations: ['rel-bc'], label: 'invokes', metadata: { xirangRelations: ['b|invokes|c'] }, parent: null, points: [],
    },
  ],
} as unknown as DiagramView)

const architecture = {
  elements: [
    { declaration: { identity: 'a', kind: 'service', parent: null, title: 'A', definition: '', summary: '', description: '' } },
    { declaration: { identity: 'b', kind: 'service', parent: null, title: 'B', definition: '', summary: '', description: '' } },
    { declaration: { identity: 'c', kind: 'service', parent: null, title: 'C', definition: '', summary: '', description: '' } },
  ],
  relationships: [],
}

const diff = {
  summary: { total: 3, ADDED: 1, MODIFIED: 1, REMOVED: 1 },
  entries: [
    { kind: 'element-declaration' as const, identity: 'a', operation: 'REMOVED' as const },
    { kind: 'element-declaration' as const, identity: 'b', operation: 'MODIFIED' as const },
    { kind: 'element-declaration' as const, identity: 'd', operation: 'ADDED' as const },
    { kind: 'relationship' as const, identity: 'a|invokes|b', operation: 'REMOVED' as const },
  ],
}

const candidateSource: XirangViewSource = {
  id: 'candidate',
  label: 'Candidate View',
  source: 'candidate',
  valid: true,
  diagnostics: [],
  architecture,
  diff,
}

const changeSource: XirangViewSource = {
  id: 'change:auth',
  label: 'auth',
  source: 'change-derived-view',
  change: 'auth',
  valid: true,
  diagnostics: [],
  architecture,
  diff,
}

describe('xirang diff overlay unifies Candidate and Change', () => {
  it('applies identical outline, badge and dim logic for change=candidate and ordinary Changes', () => {
    const candidateView = applyXirangPresentationOverlay(baseView(), candidateSource)
    const changeView = applyXirangPresentationOverlay(baseView(), changeSource)

    // Node-level visuals are byte-identical between the two selections.
    expect(candidateView.nodes).toEqual(changeView.nodes)
    expect(candidateView.edges).toEqual(changeView.edges)

    // REMOVED ghost keeps 45% opacity and its outline metadata.
    expect(candidateView.nodes[0]).toMatchObject({
      metadata: { xirangOperation: 'REMOVED' },
    })
    expect(candidateView.nodes[0]!.style.opacity).toBe(45)
    // MODIFIED node keeps 100% opacity with its operation badge metadata.
    expect(candidateView.nodes[1]!.style.opacity).toBe(100)
    expect(candidateView.nodes[1]).toMatchObject({ metadata: { xirangOperation: 'MODIFIED' } })
    // Unchanged node dims to 25% when diff is active.
    expect(candidateView.nodes[2]!.style.opacity).toBe(25)
  })

  it('applies identical relationship diff logic for Candidate and Change edges', () => {
    const candidateView = applyXirangPresentationOverlay(baseView(), candidateSource)
    const changeView = applyXirangPresentationOverlay(baseView(), changeSource)
    const edgeStyle = (edge: DiagramView['edges'][number]) =>
      (edge as DiagramView['edges'][number] & { style?: { opacity: number } }).style

    expect(candidateView.edges).toEqual(changeView.edges)
    // The REMOVED relationship edge keeps its badge and full opacity.
    expect(candidateView.edges[0]).toMatchObject({ metadata: { xirangOperation: 'REMOVED' } })
    expect(edgeStyle(candidateView.edges[0]!)).toBeUndefined()
    // The unchanged edge dims to 25%.
    expect(edgeStyle(candidateView.edges[1]!)).toEqual({ opacity: 25 })
  })
})
