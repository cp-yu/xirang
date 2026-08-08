import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  SemanticBrowserControllerProvider,
  SemanticBrowserControls,
  createSemanticBrowserState,
  encodeSemanticBrowserUrl,
  historyStateForSemanticBrowser,
  projectionRequestForSemanticBrowser,
  reduceSemanticBrowserState,
  type SemanticBrowserManifest,
} from './SemanticBrowserController'

const manifest: SemanticBrowserManifest = {
  version: 4,
  modelFingerprint: 'model-fp',
  model: {
    id: 'model',
    label: 'Model View',
    source: 'semantic-model',
    valid: true,
    diagnostics: [],
    architecture: {
      elements: [
        { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: '', summary: '', description: '' } },
        { declaration: { identity: 'root.api', kind: 'component', parent: 'root', title: 'API', definition: '', summary: '', description: '' } },
        { declaration: { identity: 'root.db', kind: 'component', parent: 'root', title: 'DB', definition: '', summary: '', description: '' } },
      ],
      relationships: [],
    },
  },
  authoredViews: {
    api: { title: 'API', selection: ['root', 'root.api'], roots: ['root'], virtualRoot: false },
  },
  changes: { auth: { label: 'auth', change: 'auth', valid: true, diagnostics: [] } },
  candidate: {
    id: 'candidate', label: 'Candidate View', source: 'candidate', valid: true, diagnostics: [],
    architecture: { elements: [], relationships: [] },
  },
  candidateDiff: {
    id: 'candidate-diff', label: 'Candidate Diff View', source: 'candidate-diff', valid: true, diagnostics: [],
    architecture: { elements: [], relationships: [] },
  },
}

describe('SemanticBrowserController state machine', () => {
  it('renders View, Change and Mode controls in fixed order and disables diff modes without a change', () => {
    const html = renderToStaticMarkup(createElement(
      SemanticBrowserControllerProvider,
      { manifest },
      createElement(SemanticBrowserControls),
    ))
    expect(html.indexOf('View Selection')).toBeLessThan(html.indexOf('Change Selection'))
    expect(html.indexOf('Change Selection')).toBeLessThan(html.indexOf('Presentation Mode'))
    expect(html).toContain('<option value="complete-with-diff" disabled="">')
    expect(html).toContain('<option value="diff-only" disabled="">')
  })

  it('keeps Candidate review outside the ordinary controls and fixes Candidate Diff to diff-only', () => {
    const candidate = createSemanticBrowserState(manifest, { view: 'candidate', change: 'auth', mode: 'diff-only' })
    expect(candidate).toMatchObject({ viewSelection: 'candidate', changeSelection: null, presentationMode: 'complete' })
    const diff = createSemanticBrowserState(manifest, { view: 'candidate-diff', change: 'auth', mode: 'complete' })
    expect(diff).toMatchObject({ viewSelection: 'candidate-diff', changeSelection: null, presentationMode: 'diff-only' })
    const html = renderToStaticMarkup(createElement(
      SemanticBrowserControllerProvider,
      { manifest, initialUrl: { view: 'candidate-diff' } },
      createElement(SemanticBrowserControls),
    ))
    expect(html).toBe('')
  })

  it('uses complete without a change and complete-with-diff when a change is selected', () => {
    const initial = createSemanticBrowserState(manifest)
    expect(initial.presentationMode).toBe('complete')
    const withChange = reduceSemanticBrowserState(initial, { type: 'change.select', change: 'auth' }, manifest)
    expect(withChange.changeSelection).toBe('auth')
    expect(withChange.presentationMode).toBe('complete-with-diff')
    const cleared = reduceSemanticBrowserState(withChange, { type: 'change.select', change: null }, manifest)
    expect(cleared.presentationMode).toBe('complete')
  })

  it('keeps the three dimensions independent', () => {
    const initial = createSemanticBrowserState(manifest, { change: 'auth', focus: 'root.api' })
    const next = reduceSemanticBrowserState(initial, { type: 'mode.select', mode: 'diff-only' }, manifest)
    expect(next.viewSelection).toBe('model')
    expect(next.changeSelection).toBe('auth')
    expect(next.focus).toBe('root.api')
    expect(next.presentationMode).toBe('diff-only')
  })

  it('disables diff modes when no change is selected', () => {
    const initial = createSemanticBrowserState(manifest)
    const next = reduceSemanticBrowserState(initial, { type: 'mode.select', mode: 'diff-only' }, manifest)
    expect(next.presentationMode).toBe('complete')
  })

  it('preserves legal focus and prunes focus and expanded identities outside a new view', () => {
    const initial = createSemanticBrowserState(manifest, { focus: 'root.api' }, { expanded: ['root.api', 'root.db'] })
    const next = reduceSemanticBrowserState(initial, { type: 'view.select', view: 'api' }, manifest)
    expect(next.focus).toBe('root.api')
    expect([...next.expanded]).toEqual(['root.api'])
    const fallback = reduceSemanticBrowserState(next, { type: 'focus.select', focus: 'root.db' }, manifest)
    expect(fallback.focus).toBeNull()
  })

  it('encodes only view, change, mode and focus, while expanded stays in history state', () => {
    const state = createSemanticBrowserState(manifest, { view: 'api', change: 'auth', mode: 'diff-only', focus: 'root.api' }, { expanded: ['root.api'] })
    expect(encodeSemanticBrowserUrl(state)).toEqual({ view: 'api', change: 'auth', mode: 'diff-only', focus: 'root.api' })
    expect(historyStateForSemanticBrowser(state)).toEqual({ expanded: ['root.api'] })
    expect(JSON.stringify(encodeSemanticBrowserUrl(state))).not.toContain('expanded')
  })

  it('builds a deterministic projection request with the expected fingerprint', () => {
    const state = createSemanticBrowserState(manifest, { change: 'auth' }, { expanded: ['root.db', 'root.api'] })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toEqual({
      viewId: 'model',
      change: 'auth',
      mode: 'complete-with-diff',
      focus: null,
      expanded: ['root.api', 'root.db'],
      expectedFingerprint: 'model-fp',
    })
  })
})
