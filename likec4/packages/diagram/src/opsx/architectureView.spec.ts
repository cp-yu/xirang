import type { DiagramView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { isOpsxSpecDiagnostic, type OpsxRuntimeVariant } from './SpecLoaderContext'
import { getArchitectureOverlayModel } from '../likec4diagram/DiagramUI'
import { materializeOpsxArchitectureView } from './architectureView'

const node = (id: string, title: string, x: number) => ({
  id,
  modelRef: id,
  parent: id === 'projectRoot' ? null : 'projectRoot',
  level: id === 'projectRoot' ? 0 : 1,
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

const formal = {
  _type: 'element',
  _stage: 'layouted',
  id: 'index',
  title: 'Index',
  hash: 'formal',
  bounds: { x: 0, y: 0, width: 1200, height: 400 },
  nodes: [node('projectRoot', 'Project', 0), node('projectRoot.alpha', 'Alpha', 360), node('projectRoot.beta', 'Beta', 720)],
  edges: [],
} as unknown as DiagramView

const variant: OpsxRuntimeVariant = {
  id: 'change:test',
  label: 'test',
  kind: 'change',
  change: 'test',
  valid: true,
  changeFingerprint: 'fingerprint',
  diagnostics: [],
  architecture: {
    languageVersion: '1',
    elements: [
      { id: 'project.root', fqn: 'projectRoot', kind: 'project', title: 'Project', summary: 'Project', parent: null, children: ['alpha.id', 'gamma.id'], metadata: {} },
      { id: 'alpha.id', fqn: 'projectRoot.alpha', kind: 'capability', title: 'Alpha target', summary: 'Changed', parent: 'project.root', children: [], metadata: {} },
      { id: 'gamma.id', fqn: 'projectRoot.gamma', kind: 'capability', title: 'Gamma', summary: 'Added', parent: 'project.root', children: [], metadata: {} },
    ],
    relations: [{ source: 'alpha.id', kind: 'invokes', target: 'gamma.id' }],
  },
  diff: {
    summary: { total: 4, specs: { ADDED: 0, MODIFIED: 0, REMOVED: 0 }, architecture: { ADDED: 2, MODIFIED: 1, REMOVED: 1 } },
    entries: [
      { scope: 'architecture', kind: 'element', identity: 'alpha.id', operation: 'MODIFIED' },
      { scope: 'architecture', kind: 'element', identity: 'gamma.id', operation: 'ADDED' },
      { scope: 'architecture', kind: 'element', identity: 'beta.id', operation: 'REMOVED', before: { id: 'beta.id', fqn: 'projectRoot.beta', kind: 'capability', title: 'Beta', summary: 'Removed', parent: 'project.root', children: [], metadata: {} } },
      { scope: 'architecture', kind: 'relationship', identity: 'alpha.id|invokes|gamma.id', operation: 'ADDED', after: { source: 'alpha.id', kind: 'invokes', target: 'gamma.id' } },
    ],
  },
}

describe('materializeOpsxArchitectureView', () => {
  it('partitions Spec diagnostic paths from Architecture diagnostics', () => {
    expect(isOpsxSpecDiagnostic('specs/auth/spec.md')).toBe(true)
    expect(isOpsxSpecDiagnostic('.opsx/changes/demo/specs/auth/spec.md')).toBe(true)
    expect(isOpsxSpecDiagnostic('architecture-delta.c4')).toBe(false)
    const withBindingError: OpsxRuntimeVariant = {
      ...variant,
      diagnostics: [{ level: 'ERROR', code: 'UNKNOWN_SPEC_ELEMENT', path: 'specs/auth/spec.md', message: 'Unknown owner' }],
    }
    expect(getArchitectureOverlayModel(withBindingError).diagnostics).toEqual([])
  })

  it('renders the selected complete target graph instead of the formal graph', () => {
    const target = materializeOpsxArchitectureView(formal, variant, 'full')

    expect(target.nodes.map(node => node.id)).toEqual(['projectRoot', 'projectRoot.alpha', 'projectRoot.gamma'])
    expect(target.nodes.find(node => node.id === 'projectRoot.alpha')).toMatchObject({ title: 'Alpha target', color: 'amber' })
    expect(target.nodes.find(node => node.id === 'projectRoot.gamma')).toMatchObject({ color: 'green' })
    expect(target.edges).toEqual([expect.objectContaining({ source: 'projectRoot.alpha', target: 'projectRoot.gamma', color: 'green' })])
  })

  it('keeps only changed graph, endpoints, and ancestor context in Diff only mode', () => {
    const target = materializeOpsxArchitectureView(formal, variant, 'diff')

    expect(target.nodes.map(node => node.id)).toEqual(['projectRoot', 'projectRoot.alpha', 'projectRoot.gamma', 'projectRoot.beta'])
    expect(target.nodes.find(node => node.id === 'projectRoot.beta')).toMatchObject({ color: 'red' })
    expect(target.edges).toHaveLength(1)
  })
})
