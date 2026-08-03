import type { DiagramView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { isXirangContractDiagnostic, type XirangViewSource } from './ContractLoaderContext'
import { getArchitectureOverlayModel } from '../likec4diagram/DiagramUI'
import { materializeXirangArchitectureView } from './architectureView'

/** Model View nodes use derived local names; semantic identity travels in `metadata.elementId`. */
const node = (fqn: string, elementId: string, title: string, x: number) => ({
  id: fqn,
  modelRef: fqn,
  metadata: { elementId },
  parent: elementId === 'project.root' ? null : 'projectRoot',
  level: elementId === 'project.root' ? 0 : 1,
  children: [],
  inEdges: [],
  outEdges: [],
  title,
  shape: 'rectangle',
  color: 'primary',
  style: { opacity: 15, size: 'md' },
  kind: 'el',
  x,
  y: 40,
  width: 320,
  height: 180,
})

const modelView = {
  _type: 'element',
  _stage: 'layouted',
  id: 'index',
  title: 'Index',
  hash: 'modelView',
  bounds: { x: 0, y: 0, width: 1200, height: 400 },
  nodes: [
    node('projectRoot', 'project.root', 'Project', 0),
    node('projectRoot.alpha', 'alpha.id', 'Alpha', 360),
    node('projectRoot.beta', 'beta.id', 'Beta', 720),
  ],
  edges: [],
} as unknown as DiagramView

const declaration = (identity: string, title: string, definition: string, parent: string | null, kind = 'capability') => ({
  declaration: { identity, kind, parent, title, definition, summary: definition, description: definition },
})

const viewSource: XirangViewSource = {
  id: 'change:test',
  label: 'test',
  source: 'change-derived-view',
  change: 'test',
  valid: true,
  changeFingerprint: 'fingerprint',
  diagnostics: [],
  architecture: {
    elements: [
      declaration('project.root', 'Project', 'Project', null),
      declaration('alpha.id', 'Alpha target', 'Changed', 'project.root'),
      declaration('gamma.id', 'Gamma', 'Added', 'project.root'),
    ],
    relationships: [{ source: 'alpha.id', kind: 'invokes', target: 'gamma.id' }],
  },
  diff: {
    summary: { total: 4, ADDED: 2, MODIFIED: 1, REMOVED: 1 },
    entries: [
      {
        kind: 'element-declaration',
        identity: 'alpha.id',
        operation: 'MODIFIED',
        after: {
          identity: 'alpha.id',
          kind: 'capability',
          parent: 'project.root',
          title: 'Alpha target',
          definition: 'Changed',
          summary: 'Changed',
          description: 'Changed',
        },
      },
      {
        kind: 'element-declaration',
        identity: 'gamma.id',
        operation: 'ADDED',
        after: {
          identity: 'gamma.id',
          kind: 'capability',
          parent: 'project.root',
          title: 'Gamma',
          definition: 'Added',
          summary: 'Added',
          description: 'Added',
        },
      },
      {
        kind: 'element-declaration',
        identity: 'beta.id',
        operation: 'REMOVED',
        before: {
          identity: 'beta.id',
          kind: 'capability',
          parent: 'project.root',
          title: 'Beta',
          definition: 'Removed',
          summary: 'Removed',
          description: 'Removed',
        },
      },
      {
        kind: 'relationship',
        identity: 'alpha.id|invokes|gamma.id',
        operation: 'ADDED',
        after: { source: 'alpha.id', kind: 'invokes', target: 'gamma.id' },
      },
      { kind: 'requirement', identity: 'alpha.id#Login', operation: 'MODIFIED' },
    ],
  },
}

function summarize(view: DiagramView) {
  return {
    nodes: view.nodes.map(item => item.id),
    parents: view.nodes.map(item => [item.id, item.parent]),
    children: view.nodes.map(item => [item.id, item.children]),
    edges: view.edges.map(item => item.id),
    colors: view.nodes.map(item => [item.id, item.color]),
  }
}

describe('materializeXirangArchitectureView', () => {

  it('uses model shape regardless of declaration Kind while preserving diff color', () => {
    const source: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null, 'project'),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root', 'perspective'),
        ],
        relationships: [],
      },
    }

    const alpha = materializeXirangArchitectureView(modelView, source, 'full')
      .nodes.find(node => node.id === 'alpha.id')!

    expect(alpha).toMatchObject({ shape: 'rectangle', color: 'amber' })
  })

  it('projects focus and direct children without changing the View identity', () => {
    const focused: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root'),
          declaration('gamma.id', 'Gamma', 'Gamma', 'project.root'),
          declaration('alpha.deep', 'Alpha Deep', 'Alpha Deep', 'alpha.id'),
          declaration('gamma.deep', 'Gamma Deep', 'Gamma Deep', 'gamma.id'),
        ],
        relationships: [],
      },
    }

    const target = materializeXirangArchitectureView(modelView, focused, 'full', 'alpha.id')

    expect(target.id).toBe(modelView.id)
    expect(target.nodes.map(node => node.id)).toEqual(['alpha.id', 'alpha.deep'])
  })

  it('aggregates deep descendant relationships with stable output', () => {
    const focused: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root'),
          declaration('gamma.id', 'Gamma', 'Gamma', 'project.root'),
          declaration('alpha.mid', 'Alpha Mid', 'Alpha Mid', 'alpha.id'),
          declaration('alpha.deep', 'Alpha Deep', 'Alpha Deep', 'alpha.mid'),
          declaration('alpha.deep.two', 'Alpha Deep Two', 'Alpha Deep Two', 'alpha.mid'),
          declaration('gamma.mid', 'Gamma Mid', 'Gamma Mid', 'gamma.id'),
          declaration('gamma.deep', 'Gamma Deep', 'Gamma Deep', 'gamma.mid'),
        ],
        relationships: [
          { source: 'alpha.deep', kind: 'invokes', target: 'gamma.deep' },
          { source: 'alpha.deep.two', kind: 'covers', target: 'gamma.deep' },
          { source: 'alpha.deep', kind: 'invokes', target: 'alpha.id' },
          { source: 'missing', kind: 'external', target: 'gamma.deep' },
        ],
      },
    }

    const modelWithRelations = {
      ...modelView,
      nodes: [
        ...modelView.nodes,
        node('projectRoot.alpha.mid', 'alpha.mid', 'Alpha Mid', 400),
        node('projectRoot.alpha.deep', 'alpha.deep', 'Alpha Deep', 400),
        node('projectRoot.alpha.deep.two', 'alpha.deep.two', 'Alpha Deep Two', 400),
        node('projectRoot.gamma.mid', 'gamma.mid', 'Gamma Mid', 760),
        node('projectRoot.gamma.deep', 'gamma.deep', 'Gamma Deep', 760),
      ],
      edges: [
        { source: 'projectRoot.alpha.deep.two', target: 'projectRoot.gamma.deep', label: 'covers', relations: ['rel-covers'] },
        { source: 'projectRoot.alpha.deep', target: 'projectRoot.gamma.deep', label: 'invokes', relations: ['rel-invokes'] },
      ],
    } as unknown as DiagramView
    const target = materializeXirangArchitectureView(modelWithRelations, focused, 'full', 'project.root')

    expect(target.nodes.map(node => node.id)).toEqual(['project.root', 'alpha.id', 'gamma.id'])
    expect(target.edges).toHaveLength(1)
    expect(target.edges[0]?.points).toHaveLength(4)
    expect(target.edges[0]?.controlPoints).toHaveLength(1)
    expect(target.edges[0]).toMatchObject({
      source: 'alpha.id',
      target: 'gamma.id',
      label: 'covers, invokes',
      relations: ['rel-covers', 'rel-invokes'],
      xirangRelations: [
        'alpha.deep.two|covers|gamma.deep',
        'alpha.deep|invokes|gamma.deep',
      ],
    })
  })

  it('preserves target-only Relationship triples when no current LikeC4 relation ID exists', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'full', 'project.root')
    const edge = target.edges[0] as typeof target.edges[number] & { xirangRelations?: string[] }

    expect(edge.relations).toEqual([])
    expect(edge.xirangRelations).toEqual(['alpha.id|invokes|gamma.id'])
  })

  it('projects contract-only Changes from the target Project Root', () => {
    const source: XirangViewSource = {
      ...viewSource,
      diff: {
        summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 },
        entries: [{ kind: 'requirement', identity: 'alpha.id#Contract', operation: 'MODIFIED' }],
      },
    }

    const target = materializeXirangArchitectureView(modelView, source, 'full')
    expect(target.nodes.map(node => node.id)).toEqual(['project.root', 'alpha.id', 'gamma.id'])
    expect(target.hash).toContain(':xirang:')
  })

  it('falls back along the previous ancestor path when focus disappears', () => {
    const target = materializeXirangArchitectureView(
      modelView,
      viewSource,
      'full',
      'removed.deep',
      ['removed.deep', 'alpha.id', 'project.root'],
    )

    expect(target.nodes.map(node => node.id)).toEqual(['alpha.id'])
  })

  it('separates Contract diagnostics from structural ones by identity, not by storage path', () => {
    expect(isXirangContractDiagnostic({ identity: 'auth.id#Login' })).toBe(true)
    expect(isXirangContractDiagnostic({ identity: 'auth.id#Login#MFA' })).toBe(true)
    expect(isXirangContractDiagnostic({ identity: 'auth.id' })).toBe(false)
    expect(isXirangContractDiagnostic({})).toBe(false)
    const withContractError: XirangViewSource = {
      ...viewSource,
      diagnostics: [{
        level: 'ERROR',
        code: 'UNSUPPORTED_CONTRACT_CONTENT',
        path: 'elements/auth.id.md',
        message: 'Bad Requirement',
        identity: 'auth.id#Login',
      }],
    }
    expect(getArchitectureOverlayModel(withContractError).diagnostics).toEqual([])
  })

  it('counts only structural entries in the overlay summary', () => {
    const overlay = getArchitectureOverlayModel(viewSource)

    expect(overlay.counts).toEqual({ ADDED: 2, MODIFIED: 1, REMOVED: 1 })
    expect(overlay.changed).toEqual(['alpha.id', 'beta.id', 'gamma.id'])
    expect(overlay.metamodel).toEqual([])
  })

  it('lists metamodel entries separately from the graph overlay', () => {
    const source: XirangViewSource = {
      ...viewSource,
      diff: {
        summary: { total: 3, ADDED: 2, MODIFIED: 0, REMOVED: 1 },
        entries: [
          { kind: 'element-kind', identity: 'kind.a', operation: 'ADDED' },
          { kind: 'authored-view', identity: 'views.v', operation: 'REMOVED' },
          { kind: 'relationship-kind', identity: 'kind.b', operation: 'ADDED' },
        ],
      },
    }
    const overlay = getArchitectureOverlayModel(source)

    expect(overlay.counts).toEqual({ ADDED: 2, MODIFIED: 0, REMOVED: 1 })
    expect(overlay.changed).toEqual([])
    expect(overlay.metamodel.map(entry => [entry.kind, entry.identity, entry.operation])).toEqual([
      ['authored-view', 'views.v', 'REMOVED'],
      ['element-kind', 'kind.a', 'ADDED'],
      ['relationship-kind', 'kind.b', 'ADDED'],
    ])
  })

  it('renders the selected complete target graph keyed by identity', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'full')

    expect(target.nodes.map(item => item.id)).toEqual(['project.root', 'alpha.id', 'gamma.id'])
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({ title: 'Alpha target', color: 'amber' })
    expect(target.nodes.find(item => item.id === 'gamma.id')).toMatchObject({ color: 'green' })
    expect(target.edges).toEqual([expect.objectContaining({ source: 'alpha.id', target: 'gamma.id', color: 'green' })])
  })

  it('uses the shared excerpt for nodes and preserves the full Definition for details', () => {
    const fullDefinition = `First   paragraph ${'😀'.repeat(121)}.\n\nSecond paragraph remains complete.`
    const projected: XirangViewSource = {
      ...viewSource,
      architecture: {
        ...viewSource.architecture!,
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          {
            declaration: {
              identity: 'alpha.id',
              kind: 'capability',
              parent: 'project.root',
              title: 'Alpha target',
              definition: fullDefinition,
              summary: `First paragraph ${'😀'.repeat(104)}...`,
              description: fullDefinition,
            },
          },
        ],
      },
    }

    const target = materializeXirangArchitectureView(modelView, projected, 'full')
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({
      description: { txt: `First paragraph ${'😀'.repeat(104)}...` },
      metadata: { elementId: 'alpha.id', definition: fullDefinition },
    })
  })

  it('keeps only changed elements in Diff only mode', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'diff')

    expect(target.nodes.map(item => item.id)).toEqual(['alpha.id', 'gamma.id', 'beta.id'])
    expect(target.nodes.find(item => item.id === 'beta.id')).toMatchObject({ color: 'red', parent: null })
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({ color: 'amber' })
    expect(target.nodes.find(item => item.id === 'gamma.id')).toMatchObject({ color: 'green' })
    expect(target.edges).toHaveLength(1)
  })

  it('keeps delta hierarchy in Diff only mode when parent and child are both changed', () => {
    const source: XirangViewSource = {
      ...viewSource,
      diff: {
        summary: { total: 2, ADDED: 1, MODIFIED: 1, REMOVED: 0 },
        entries: [
          {
            kind: 'element-declaration',
            identity: 'project.root',
            operation: 'MODIFIED',
            after: {
              identity: 'project.root',
              kind: 'project',
              parent: null,
              title: 'Project',
              definition: 'Changed',
              summary: 'Changed',
              description: 'Changed',
            },
          },
          {
            kind: 'element-declaration',
            identity: 'alpha.id',
            operation: 'ADDED',
            after: {
              identity: 'alpha.id',
              kind: 'capability',
              parent: 'project.root',
              title: 'Alpha',
              definition: 'Added',
              summary: 'Added',
              description: 'Added',
            },
          },
        ],
      },
    }

    const target = materializeXirangArchitectureView(modelView, source, 'diff')
    expect(target.nodes.map(item => item.id)).toEqual(['project.root', 'alpha.id'])
    expect(target.nodes.find(item => item.id === 'project.root')).toMatchObject({ parent: null, color: 'amber' })
    expect(target.nodes.find(item => item.id === 'alpha.id')).toMatchObject({ parent: 'project.root', color: 'green' })
  })

  it('renders an empty graph in Diff only mode when no element changes exist', () => {
    const source: XirangViewSource = {
      ...viewSource,
      diff: {
        summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 },
        entries: [{ kind: 'relationship-kind', identity: 'kind.id', operation: 'ADDED' }],
      },
    }

    const target = materializeXirangArchitectureView(modelView, source, 'diff')
    expect(target.nodes).toEqual([])
    expect(target.edges).toEqual([])
    expect(target.hash).toContain(':xirang:')
  })

  it('stays stable when every derived local name changes but identities do not', () => {
    const regenerated = {
      ...modelView,
      nodes: modelView.nodes.map((item, index) => ({
        ...item,
        id: `renamed_${index}`,
        modelRef: `renamed_${index}`,
        parent: item.parent === null ? null : 'renamed_0',
      })),
    } as unknown as DiagramView

    for (const mode of ['full', 'diff'] as const) {
      expect(summarize(materializeXirangArchitectureView(regenerated, viewSource, mode)))
        .toEqual(summarize(materializeXirangArchitectureView(modelView, viewSource, mode)))
    }
  })

  it('uses deterministic projection geometry independent from complete-model coordinates', () => {
    const target = materializeXirangArchitectureView(modelView, viewSource, 'full')
    const alpha = target.nodes.find(item => item.id === 'alpha.id')!

    expect(alpha).toMatchObject({ width: 320, height: 180 })
    expect(materializeXirangArchitectureView(modelView, viewSource, 'full').nodes.find(item => item.id === 'alpha.id'))
      .toEqual(alpha)
  })

  it('sizes the focus node as a container that encloses every direct child', () => {
    for (const focus of ['project.root', 'perspective.0'] as const) {
      const source: XirangViewSource = {
        ...viewSource,
        architecture: {
          elements: [
            declaration('project.root', 'Project', 'Project', null, 'project'),
            declaration('perspective.0', 'Perspective', 'Perspective', 'project.root', 'perspective'),
            ...Array.from({ length: 7 }, (_, index) =>
              declaration(`child.${index}`, `Child ${index}`, `Child ${index}`, focus)),
          ],
          relationships: [],
        },
      }
      const target = materializeXirangArchitectureView(modelView, source, 'full', focus)
      const container = target.nodes.find(node => node.id === focus)!
      const children = target.nodes.filter(node => node.parent === focus)

      expect(children.length).toBeGreaterThanOrEqual(7)
      for (const child of children) {
        expect(child.x).toBeGreaterThan(container.x)
        expect(child.y).toBeGreaterThan(container.y)
        expect(child.x + child.width).toBeLessThan(container.x + container.width)
        expect(child.y + child.height).toBeLessThan(container.y + container.height)
      }
      // The container must not be mistakeable for one more sibling cell.
      expect(container.width).toBeGreaterThan(Math.max(...children.map(child => child.width)))
      expect(container.height).toBeGreaterThan(Math.max(...children.map(child => child.height)))
    }
  })

  it('keeps a childless focus at leaf size', () => {
    const source: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root'),
        ],
        relationships: [],
      },
    }
    const target = materializeXirangArchitectureView(modelView, source, 'full', 'alpha.id')

    expect(target.nodes).toHaveLength(1)
    expect(target.nodes[0]).toMatchObject({ id: 'alpha.id', width: 320, height: 180 })
  })

  it('falls back to the grid without diagnostics when no modelView node carries the identity', () => {
    const withoutMetadata = {
      ...modelView,
      nodes: modelView.nodes.map(({ metadata: _metadata, ...rest }) => rest),
    } as unknown as DiagramView

    const target = materializeXirangArchitectureView(withoutMetadata, viewSource, 'full')
    const container = target.nodes.find(node => node.id === 'project.root')!

    expect(target.nodes.map(item => item.id)).toEqual(['project.root', 'alpha.id', 'gamma.id'])
    for (const child of target.nodes.filter(node => node.parent === 'project.root')) {
      expect(child.x).toBeGreaterThan(container.x)
      expect(child.x + child.width).toBeLessThan(container.x + container.width)
    }
    expect(getArchitectureOverlayModel(viewSource).diagnostics).toEqual([])
  })

  it('preserves node and edge order when building adjacency', () => {
    const ordered: XirangViewSource = {
      ...viewSource,
      architecture: {
        elements: [
          ...viewSource.architecture!.elements,
          declaration('delta.id', 'Delta', 'Delta', 'project.root'),
          declaration('epsilon.id', 'Epsilon', 'Disconnected', 'project.root'),
        ],
        relationships: [
          { source: 'gamma.id', kind: 'first', target: 'alpha.id' },
          { source: 'alpha.id', kind: 'second', target: 'gamma.id' },
          { source: 'delta.id', kind: 'third', target: 'alpha.id' },
          { source: 'missing.id', kind: 'omitted', target: 'alpha.id' },
        ],
      },
    }
    const target = materializeXirangArchitectureView(modelView, ordered, 'full')
    const root = target.nodes.find(item => item.id === 'project.root')!
    const alpha = target.nodes.find(item => item.id === 'alpha.id')!
    const epsilon = target.nodes.find(item => item.id === 'epsilon.id')!

    expect(root.children).toEqual(['alpha.id', 'gamma.id', 'delta.id', 'epsilon.id'])
    expect(alpha.inEdges).toEqual([
      'xirang:delta.id|third|alpha.id',
      'xirang:gamma.id|first|alpha.id',
    ])
    expect(alpha.outEdges).toEqual(['xirang:alpha.id|second|gamma.id'])
    expect(epsilon).toMatchObject({ inEdges: [], outEdges: [], children: [] })
    expect(target.edges).toHaveLength(3)
  })
})

describe('materializeXirangArchitectureView expand-in-place', () => {
  /** a > b > c > d, one letter one level, plus a leaf sibling at each level. */
  const nested: XirangViewSource = {
    ...viewSource,
    architecture: {
      elements: [
        declaration('a', 'A', 'A', null),
        declaration('b', 'B', 'B', 'a'),
        declaration('a.leaf', 'A Leaf', 'A Leaf', 'a'),
        declaration('c', 'C', 'C', 'b'),
        declaration('b.leaf', 'B Leaf', 'B Leaf', 'b'),
        declaration('d', 'D', 'D', 'c'),
        declaration('c.leaf', 'C Leaf', 'C Leaf', 'c'),
      ],
      relationships: [],
    },
  }

  const encloses = (outer: { x: number; y: number; width: number; height: number }, inner: typeof outer) =>
    inner.x > outer.x && inner.y > outer.y
    && inner.x + inner.width < outer.x + outer.width
    && inner.y + inner.height < outer.y + outer.height

  const disjoint = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y

  it('keeps the direct-children projection when nothing is expanded', () => {
    const collapsed = materializeXirangArchitectureView(modelView, nested, 'full', 'a', [], new Set())

    expect(collapsed.nodes.map(node => node.id)).toEqual(['a', 'b', 'a.leaf'])
    expect(collapsed).toEqual(materializeXirangArchitectureView(modelView, nested, 'full', 'a'))
  })

  it('reveals the children of an expanded direct child inside its container', () => {
    const target = materializeXirangArchitectureView(modelView, nested, 'full', 'a', [], new Set(['b']))
    const byId = new Map<string, DiagramView['nodes'][number]>(target.nodes.map(node => [node.id, node]))

    expect([...byId.keys()].sort()).toEqual(['a', 'a.leaf', 'b', 'b.leaf', 'c'])
    expect(byId.get('c')!.parent).toBe('b')
    expect(byId.get('b.leaf')!.parent).toBe('b')
    expect(byId.get('b')!.children).toEqual(['c', 'b.leaf'])
    expect(encloses(byId.get('b')!, byId.get('c')!)).toBe(true)
    expect(encloses(byId.get('b')!, byId.get('b.leaf')!)).toBe(true)
    expect(encloses(byId.get('a')!, byId.get('b')!)).toBe(true)
    expect(disjoint(byId.get('b')!, byId.get('a.leaf')!)).toBe(true)
  })

  it('nests multiple expanded levels simultaneously', () => {
    const target = materializeXirangArchitectureView(modelView, nested, 'full', 'a', [], new Set(['b', 'c']))
    const byId = new Map<string, DiagramView['nodes'][number]>(target.nodes.map(node => [node.id, node]))

    expect([...byId.keys()].sort()).toEqual(['a', 'a.leaf', 'b', 'b.leaf', 'c', 'c.leaf', 'd'])
    expect(byId.get('d')!.parent).toBe('c')
    expect(encloses(byId.get('c')!, byId.get('d')!)).toBe(true)
    expect(encloses(byId.get('b')!, byId.get('c')!)).toBe(true)
    expect(encloses(byId.get('a')!, byId.get('b')!)).toBe(true)
    expect(disjoint(byId.get('c')!, byId.get('b.leaf')!)).toBe(true)
  })

  it('ignores expanded identities outside the focus subtree', () => {
    const outside = materializeXirangArchitectureView(modelView, nested, 'full', 'c', [], new Set(['b']))

    expect(outside).toEqual(materializeXirangArchitectureView(modelView, nested, 'full', 'c'))
  })

  it('keeps an expanded childless identity at leaf size', () => {
    const target = materializeXirangArchitectureView(modelView, nested, 'full', 'a', [], new Set(['a.leaf']))

    expect(target.nodes.find(node => node.id === 'a.leaf')).toMatchObject({ width: 320, height: 180 })
    expect(target.nodes.map(node => node.id)).toEqual(['a', 'b', 'a.leaf'])
  })

  it('maps relationships to the deepest visible endpoint once its ancestor is expanded', () => {
    const related: XirangViewSource = {
      ...nested,
      architecture: {
        elements: nested.architecture!.elements,
        relationships: [{ source: 'c', kind: 'invokes', target: 'a.leaf' }],
      },
    }

    const collapsed = materializeXirangArchitectureView(modelView, related, 'full', 'a', [], new Set())
    expect(collapsed.edges.map(edge => [edge.source, edge.target])).toEqual([['b', 'a.leaf']])

    const expanded = materializeXirangArchitectureView(modelView, related, 'full', 'a', [], new Set(['b']))
    expect(expanded.edges.map(edge => [edge.source, edge.target])).toEqual([['c', 'a.leaf']])
  })
})

describe('materializeXirangArchitectureView candidate-only elements', () => {
  it('materializes candidate only elements in full mode', () => {
    const candidateSource: XirangViewSource = {
      id: 'candidate',
      label: 'Candidate',
      source: 'candidate',
      valid: true,
      changeFingerprint: 'candidate-fp',
      diagnostics: [],
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root'),
          declaration('new.id', 'New Element', 'Candidate-only element', 'project.root'),
        ],
        relationships: [{ source: 'alpha.id', kind: 'invokes', target: 'new.id' }],
      },
    }

    const target = materializeXirangArchitectureView(modelView, candidateSource, 'full')
    const newElement = target.nodes.find(node => node.id === 'new.id')

    expect(target.nodes.map(node => node.id)).toEqual(['project.root', 'alpha.id', 'new.id'])
    expect(newElement).toBeDefined()
    expect(newElement).toMatchObject({
      id: 'new.id',
      modelRef: 'new.id',
      title: 'New Element',
      metadata: {
        elementId: 'new.id',
        definition: 'Candidate-only element',
      },
      parent: 'project.root',
      shape: 'rectangle',
      color: 'primary',
    })
    expect(newElement!.x).toBeGreaterThan(0)
    expect(newElement!.y).toBeGreaterThan(0)
    expect(newElement!.width).toBe(320)
    expect(newElement!.height).toBe(180)

    const edge = target.edges.find(e => e.source === 'alpha.id' && e.target === 'new.id')
    expect(edge).toBeDefined()
    expect(edge).toMatchObject({
      source: 'alpha.id',
      target: 'new.id',
      label: 'invokes',
    })
  })

  it('keeps candidate view free of diff state', () => {
    const candidateSource: XirangViewSource = {
      id: 'candidate',
      label: 'Candidate',
      source: 'candidate',
      valid: true,
      changeFingerprint: 'candidate-fp',
      diagnostics: [],
      architecture: {
        elements: [
          declaration('project.root', 'Project', 'Project', null),
          declaration('alpha.id', 'Alpha', 'Alpha', 'project.root'),
          declaration('new.id', 'New', 'New', 'project.root'),
        ],
        relationships: [{ source: 'alpha.id', kind: 'invokes', target: 'new.id' }],
      },
      diff: {
        summary: { total: 2, ADDED: 1, MODIFIED: 1, REMOVED: 0 },
        entries: [
          {
            kind: 'element-declaration',
            identity: 'alpha.id',
            operation: 'MODIFIED',
            after: declaration('alpha.id', 'Alpha', 'Alpha', 'project.root').declaration,
          },
          {
            kind: 'element-declaration',
            identity: 'new.id',
            operation: 'ADDED',
            after: declaration('new.id', 'New', 'New', 'project.root').declaration,
          },
        ],
      },
    }

    const target = materializeXirangArchitectureView(modelView, candidateSource, 'full')

    expect(target.nodes.map(node => node.id)).toEqual(['project.root', 'alpha.id', 'new.id'])
    for (const node of target.nodes) {
      expect(node.color).not.toBe('green')
      expect(node.color).not.toBe('amber')
      expect(node.color).not.toBe('red')
      expect(node.metadata?.['xirangOperation']).toBeUndefined()
    }
    for (const edge of target.edges) {
      expect(edge.color).not.toBe('green')
      expect(edge.color).not.toBe('amber')
      expect(edge.color).not.toBe('red')
    }
  })
})
