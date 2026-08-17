import { MantineProvider } from '@mantine/core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  SemanticBrowserControllerProvider,
  SemanticBrowserMobileControls,
  createSemanticBrowserState,
  encodeSemanticBrowserUrl,
  historyStateForSemanticBrowser,
  mirrorActorFocus,
  projectionRequestForSemanticBrowser,
  reconcileSemanticBrowserState,
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
    diff: { summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 }, entries: [] },
  },
}

describe('SemanticBrowserController state machine', () => {
  // SSR renders without matchMedia, so useMediaQuery is false and only the mobile
  // variant mounts; both variants share the same select structure and logic.
  it('renders View, Change and Mode controls in fixed order and disables diff modes without a change', () => {
    const html = renderToStaticMarkup(createElement(
      MantineProvider,
      null,
      createElement(
        SemanticBrowserControllerProvider,
        { manifest },
        createElement(SemanticBrowserMobileControls),
      ),
    ))
    expect(html.indexOf('View Selection')).toBeLessThan(html.indexOf('Change Selection'))
    expect(html.indexOf('Change Selection')).toBeLessThan(html.indexOf('Presentation Mode'))
    expect(html).toContain('<option value="complete-with-diff" disabled="">')
    expect(html).toContain('<option value="diff-only" disabled="">')
  })

  it('keeps Candidate as a Change Selection option with complete and diff-only', () => {
    const candidate = createSemanticBrowserState(manifest, { change: 'candidate', mode: 'diff-only' })
    expect(candidate).toMatchObject({ viewSelection: 'model', changeSelection: 'candidate', presentationMode: 'diff-only' })
    const html = renderToStaticMarkup(createElement(
      MantineProvider,
      null,
      createElement(
        SemanticBrowserControllerProvider,
        { manifest, initialUrl: { change: 'candidate' } },
        createElement(SemanticBrowserMobileControls),
      ),
    ))
    expect(html).toContain('data-xirang-controller')
    expect(html).toMatch(/<option value="candidate"[^>]*>Candidate View<\/option>/)
    expect(html).toContain('<option value="complete" selected="">')
    expect(html).not.toContain('value="complete-with-diff"')
  })

  it('首页 Candidate 入口生成 change=candidate URL 状态', () => {
    const state = createSemanticBrowserState(manifest, { change: 'candidate' })
    expect(state).toMatchObject({ viewSelection: 'model', changeSelection: 'candidate', presentationMode: 'complete' })
    expect(encodeSemanticBrowserUrl(state)).toEqual({ change: 'candidate' })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toMatchObject({
      viewId: 'model',
      change: 'candidate',
      mode: 'complete',
    })
  })

  it('selects Candidate and unlocks complete and diff-only', () => {
    const initial = createSemanticBrowserState(manifest)
    const selected = reduceSemanticBrowserState(initial, { type: 'change.select', change: 'candidate' }, manifest)
    expect(selected.changeSelection).toBe('candidate')
    expect(selected.presentationMode).toBe('complete')
    expect(reduceSemanticBrowserState(selected, { type: 'mode.select', mode: 'complete' }, manifest).presentationMode).toBe('complete')
    expect(reduceSemanticBrowserState(selected, { type: 'mode.select', mode: 'diff-only' }, manifest).presentationMode).toBe('diff-only')
    expect(reduceSemanticBrowserState(selected, { type: 'mode.select', mode: 'complete-with-diff' }, manifest).presentationMode).toBe('complete')
  })

  it('clamps change=candidate&mode=complete-with-diff to complete', () => {
    const state = createSemanticBrowserState(manifest, { change: 'candidate', mode: 'complete-with-diff' })
    expect(state.presentationMode).toBe('complete')
    expect(encodeSemanticBrowserUrl(state)).toEqual({ change: 'candidate' })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toMatchObject({
      change: 'candidate',
      mode: 'complete',
    })
  })

  it('encodes URL state for change=candidate', () => {
    const state = createSemanticBrowserState(manifest, { change: 'candidate' })
    expect(encodeSemanticBrowserUrl(state)).toEqual({ change: 'candidate' })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toMatchObject({ change: 'candidate', mode: 'complete' })
    const diffOnly = reduceSemanticBrowserState(state, { type: 'mode.select', mode: 'diff-only' }, manifest)
    expect(encodeSemanticBrowserUrl(diffOnly)).toEqual({ change: 'candidate', mode: 'diff-only' })
  })

  it('ignores change=candidate without an active Candidate', () => {
    const { candidate: _candidate, ...noCandidate } = manifest
    const state = createSemanticBrowserState(noCandidate, { change: 'candidate' })
    expect(state.changeSelection).toBeNull()
    expect(state.presentationMode).toBe('complete')
  })

  it('converges after the Candidate is promoted and the manifest drops it', () => {
    const selected = createSemanticBrowserState(manifest, { change: 'candidate', mode: 'diff-only' }, { expanded: ['root.api'] })
    const { candidate: _candidate, ...noCandidate } = manifest
    const next = reconcileSemanticBrowserState(selected, noCandidate)
    expect(next).toMatchObject({
      viewSelection: 'model',
      changeSelection: null,
      presentationMode: 'complete',
    })
    expect([...next.expanded]).toEqual([])
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

  it('clears an archived Change and its diff expansion when the manifest refreshes', () => {
    const state = createSemanticBrowserState(
      manifest,
      { change: 'auth', mode: 'diff-only', focus: 'root.api' },
      { expanded: ['root.api', 'root.db'] },
    );
    const nextManifest: SemanticBrowserManifest = { ...manifest, changes: {} };
    const next = reconcileSemanticBrowserState(state, nextManifest);

    expect(next).toMatchObject({
      changeSelection: null,
      presentationMode: 'complete',
      focus: 'root.api',
    });
    expect([...next.expanded]).toEqual([]);
  });

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

describe('mirrorActorFocus', () => {
  const modelState = createSemanticBrowserState(manifest, { view: 'model' })
  const authoredState = createSemanticBrowserState(manifest, { view: 'api' })

  it('mirrors an actor focus that is inside the view', () => {
    expect(mirrorActorFocus(authoredState, manifest, 'root.api', 'root')).toBe('root.api')
  })

  it('never mirrors an actor focus outside the view (would be clamped and loop)', () => {
    expect(mirrorActorFocus(authoredState, manifest, 'root.db', 'root')).toBeNull()
    // View root with no controller focus: nothing to clear.
    expect(mirrorActorFocus(authoredState, manifest, 'root', 'root')).toBeNull()
  })

  it('clears the controller focus only when the actor reaches the view root with a focus set', () => {
    const focused = createSemanticBrowserState(manifest, { view: 'api', focus: 'root.api' })
    expect(mirrorActorFocus(focused, manifest, 'root', 'root')).toBe('clear')
  })

  it('leaves the model-view actor at its default null focus untouched', () => {
    expect(mirrorActorFocus(modelState, manifest, null, 'root')).toBeNull()
    expect(mirrorActorFocus(modelState, manifest, 'root', 'root')).toBeNull()
  })

  it('does not mirror an actor focus the controller already holds', () => {
    const focused = createSemanticBrowserState(manifest, { view: 'api', focus: 'root.api' })
    expect(mirrorActorFocus(focused, manifest, 'root.api', 'root')).toBeNull()
  })
})
