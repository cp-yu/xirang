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
  type SemanticBrowserState,
} from './SemanticBrowserController'

const changeArchitecture = {
  elements: [
    { declaration: { identity: 'root', kind: 'project', parent: null, title: 'Root', definition: '', summary: '', description: '' } },
    { declaration: { identity: 'root.api', kind: 'component', parent: 'root', title: 'API', definition: '', summary: '', description: '' } },
    { declaration: { identity: 'root.db', kind: 'component', parent: 'root', title: 'DB', definition: '', summary: '', description: '' } },
  ],
  relationships: [],
}

const manifest: SemanticBrowserManifest = {
  version: 5,
  modelFingerprint: 'model-fp',
  model: {
    id: 'full-model',
    label: 'Full Model',
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
  changes: {
    auth: {
      label: 'auth', change: 'auth', valid: true, diagnostics: [],
      architecture: changeArchitecture,
      authoredViews: {
        api: { title: 'API', selection: ['root', 'root.api'], roots: ['root'], virtualRoot: false },
        stale: { title: 'Stale', selection: [], roots: [], virtualRoot: false },
      },
    },
  },
  candidate: {
    id: 'candidate', label: 'Candidate', source: 'candidate', valid: true, diagnostics: [],
    architecture: changeArchitecture,
    authoredViews: {
      api: { title: 'API', selection: ['root', 'root.api'], roots: ['root'], virtualRoot: false },
      stale: { title: 'Stale', selection: [], roots: [], virtualRoot: false },
    },
    diff: { summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 }, entries: [] },
  },
}

describe('SemanticBrowserController state machine', () => {
  // SSR renders without matchMedia, so useMediaQuery is false and only the mobile
  // variant mounts; both variants share the same select structure and logic.
  it('renders Model, View and Mode controls in fixed order and disables diff modes on baseline', () => {
    const html = renderToStaticMarkup(createElement(
      MantineProvider,
      null,
      createElement(
        SemanticBrowserControllerProvider,
        { manifest },
        createElement(SemanticBrowserMobileControls),
      ),
    ))
    expect(html.indexOf('Model Selection')).toBeLessThan(html.indexOf('View Selection'))
    expect(html.indexOf('View Selection')).toBeLessThan(html.indexOf('Presentation Mode'))
    expect(html).toContain('<option value="complete-with-diff" disabled="">')
    expect(html).toContain('<option value="diff-only" disabled="">')
  })

  it('offers Candidate as a Model value with three-state modes', () => {
    const html = renderToStaticMarkup(createElement(
      MantineProvider,
      null,
      createElement(
        SemanticBrowserControllerProvider,
        { manifest, initialUrl: { model: 'candidate' } },
        createElement(SemanticBrowserMobileControls),
      ),
    ))
    expect(html).toContain('data-xirang-controller')
    expect(html).toMatch(/<option value="candidate"[^>]*selected="">Candidate<\/option>/)
    expect(html).toContain('<option value="complete" selected="">')
    expect(html).toContain('value="complete-with-diff"')
    // Empty-resolution views are not selectable in the current model.
    expect(html).not.toContain('value="stale"')
  })

  it('首页 Candidate 入口生成 model=candidate URL 状态', () => {
    const state = createSemanticBrowserState(manifest, { model: 'candidate' })
    expect(state).toMatchObject({ viewSelection: 'full-model', modelSelection: 'candidate', presentationMode: 'complete' })
    expect(encodeSemanticBrowserUrl(state)).toEqual({ model: 'candidate' })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toMatchObject({
      viewId: 'full-model',
      model: 'candidate',
      mode: 'complete',
    })
  })

  it('selects Candidate and keeps three-state modes with complete default', () => {
    const initial = createSemanticBrowserState(manifest)
    const selected = reduceSemanticBrowserState(initial, { type: 'model.select', model: 'candidate' }, manifest)
    expect(selected.modelSelection).toBe('candidate')
    expect(selected.presentationMode).toBe('complete')
    expect(reduceSemanticBrowserState(selected, { type: 'mode.select', mode: 'complete' }, manifest).presentationMode).toBe('complete')
    expect(reduceSemanticBrowserState(selected, { type: 'mode.select', mode: 'complete-with-diff' }, manifest).presentationMode).toBe('complete-with-diff')
    expect(reduceSemanticBrowserState(selected, { type: 'mode.select', mode: 'diff-only' }, manifest).presentationMode).toBe('diff-only')
  })

  it('accepts candidate complete-with-diff instead of clamping it', () => {
    const state = createSemanticBrowserState(manifest, { model: 'candidate', mode: 'complete-with-diff' })
    expect(state.presentationMode).toBe('complete-with-diff')
    expect(encodeSemanticBrowserUrl(state)).toEqual({ model: 'candidate', mode: 'complete-with-diff' })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toMatchObject({
      model: 'candidate',
      mode: 'complete-with-diff',
    })
  })

  it('encodes URL state for model=candidate', () => {
    const state = createSemanticBrowserState(manifest, { model: 'candidate' })
    expect(encodeSemanticBrowserUrl(state)).toEqual({ model: 'candidate' })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toMatchObject({ model: 'candidate', mode: 'complete' })
    const diffOnly = reduceSemanticBrowserState(state, { type: 'mode.select', mode: 'diff-only' }, manifest)
    expect(encodeSemanticBrowserUrl(diffOnly)).toEqual({ model: 'candidate', mode: 'diff-only' })
  })

  it('normalizes every presentation mode through state creation and the reducer', () => {
    const cases: Array<{
      model: 'semantic-model' | 'candidate' | 'change:auth'
      requestedMode?: 'complete' | 'complete-with-diff' | 'diff-only'
      expectedMode: 'complete' | 'complete-with-diff' | 'diff-only'
      expectedUrl: Record<string, string>
    }> = [
      { model: 'semantic-model', expectedMode: 'complete', expectedUrl: {} },
      { model: 'semantic-model', requestedMode: 'complete', expectedMode: 'complete', expectedUrl: {} },
      { model: 'semantic-model', requestedMode: 'complete-with-diff', expectedMode: 'complete', expectedUrl: {} },
      { model: 'semantic-model', requestedMode: 'diff-only', expectedMode: 'complete', expectedUrl: {} },
      { model: 'candidate', expectedMode: 'complete', expectedUrl: { model: 'candidate' } },
      { model: 'candidate', requestedMode: 'complete', expectedMode: 'complete', expectedUrl: { model: 'candidate' } },
      { model: 'candidate', requestedMode: 'complete-with-diff', expectedMode: 'complete-with-diff', expectedUrl: { model: 'candidate', mode: 'complete-with-diff' } },
      { model: 'candidate', requestedMode: 'diff-only', expectedMode: 'diff-only', expectedUrl: { model: 'candidate', mode: 'diff-only' } },
      { model: 'change:auth', expectedMode: 'complete-with-diff', expectedUrl: { model: 'change:auth' } },
      { model: 'change:auth', requestedMode: 'complete', expectedMode: 'complete', expectedUrl: { model: 'change:auth', mode: 'complete' } },
      { model: 'change:auth', requestedMode: 'complete-with-diff', expectedMode: 'complete-with-diff', expectedUrl: { model: 'change:auth' } },
      { model: 'change:auth', requestedMode: 'diff-only', expectedMode: 'diff-only', expectedUrl: { model: 'change:auth', mode: 'diff-only' } },
    ]

    for (const { model, requestedMode, expectedMode, expectedUrl } of cases) {
      const url = {
        ...(model === 'semantic-model' ? {} : { model }),
        ...(requestedMode === undefined ? {} : { mode: requestedMode }),
      }
      const created = createSemanticBrowserState(manifest, url)
      const selected = reduceSemanticBrowserState(
        createSemanticBrowserState(manifest),
        { type: 'model.select', model },
        manifest,
      )
      const reduced = requestedMode === undefined
        ? selected
        : reduceSemanticBrowserState(selected, { type: 'mode.select', mode: requestedMode }, manifest)

      for (const state of [created, reduced]) {
        expect(state.presentationMode).toBe(expectedMode)
        expect(encodeSemanticBrowserUrl(state)).toEqual(expectedUrl)
        expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint).mode).toBe(expectedMode)
      }
    }
  })

  it('ignores model=candidate without an active Candidate', () => {
    const { candidate: _candidate, ...noCandidate } = manifest
    const state = createSemanticBrowserState(noCandidate, { model: 'candidate' })
    expect(state.modelSelection).toBe('semantic-model')
    expect(state.presentationMode).toBe('complete')
  })

  it('converges after the Candidate is promoted and the manifest drops it', () => {
    const selected = createSemanticBrowserState(manifest, { model: 'candidate', mode: 'diff-only' }, { expanded: ['root.api'] })
    const { candidate: _candidate, ...noCandidate } = manifest
    const next = reconcileSemanticBrowserState(selected, noCandidate)
    expect(next).toMatchObject({
      viewSelection: 'full-model',
      modelSelection: 'semantic-model',
      presentationMode: 'complete',
    })
    expect([...next.expanded]).toEqual([])
  })

  it('preserves model-valid focus and expanded identities when the selected authored view disappears', () => {
    const staleState: SemanticBrowserState = {
      viewSelection: 'api',
      modelSelection: 'semantic-model',
      presentationMode: 'complete',
      focus: 'root.db',
      expanded: new Set(['root.api', 'root.db', 'ghost']),
    }
    const next = reconcileSemanticBrowserState({
      ...staleState,
      expanded: new Set(staleState.expanded),
    }, { ...manifest, authoredViews: {} })

    expect(next.viewSelection).toBe('full-model')
    expect(next.focus).toBe('root.db')
    expect([...next.expanded]).toEqual(['root.api', 'root.db'])
  })

  it('uses complete on baseline and complete-with-diff for a change model', () => {
    const initial = createSemanticBrowserState(manifest)
    expect(initial.presentationMode).toBe('complete')
    const withChange = reduceSemanticBrowserState(initial, { type: 'model.select', model: 'change:auth' }, manifest)
    expect(withChange.modelSelection).toBe('change:auth')
    expect(withChange.presentationMode).toBe('complete-with-diff')
    const cleared = reduceSemanticBrowserState(withChange, { type: 'model.select', model: 'semantic-model' }, manifest)
    expect(cleared.presentationMode).toBe('complete')
  })

  it('clears an archived Change and its diff expansion when the manifest refreshes', () => {
    const state = createSemanticBrowserState(
      manifest,
      { model: 'change:auth', mode: 'diff-only', focus: 'root.api' },
      { expanded: ['root.api', 'root.db'] },
    );
    const nextManifest: SemanticBrowserManifest = { ...manifest, changes: {} };
    const next = reconcileSemanticBrowserState(state, nextManifest);

    expect(next).toMatchObject({
      modelSelection: 'semantic-model',
      presentationMode: 'complete',
      focus: 'root.api',
    });
    expect([...next.expanded]).toEqual([]);
  });

  it('keeps the three dimensions independent', () => {
    const initial = createSemanticBrowserState(manifest, { model: 'change:auth', focus: 'root.api' })
    const next = reduceSemanticBrowserState(initial, { type: 'mode.select', mode: 'diff-only' }, manifest)
    expect(next.viewSelection).toBe('full-model')
    expect(next.modelSelection).toBe('change:auth')
    expect(next.focus).toBe('root.api')
    expect(next.presentationMode).toBe('diff-only')
  })

  it('disables diff modes on the baseline model', () => {
    const initial = createSemanticBrowserState(manifest)
    const next = reduceSemanticBrowserState(initial, { type: 'mode.select', mode: 'diff-only' }, manifest)
    expect(next.presentationMode).toBe('complete')
  })

  it('falls back to full-model when the view is not resolvable in the current model', () => {
    const nextManifest: SemanticBrowserManifest = {
      ...manifest,
      changes: { auth: { ...manifest.changes['auth']!, authoredViews: {} } },
    }
    const state = createSemanticBrowserState(nextManifest, { model: 'change:auth', view: 'api' })
    expect(state.viewSelection).toBe('full-model')
  })

  it('preserves legal focus and prunes focus and expanded identities outside a new view', () => {
    const initial = createSemanticBrowserState(manifest, { focus: 'root.api' }, { expanded: ['root.api', 'root.db'] })
    const next = reduceSemanticBrowserState(initial, { type: 'view.select', view: 'api' }, manifest)
    expect(next.focus).toBe('root.api')
    expect([...next.expanded]).toEqual(['root.api'])
    const fallback = reduceSemanticBrowserState(next, { type: 'focus.select', focus: 'root.db' }, manifest)
    expect(fallback.focus).toBeNull()
  })

  it('encodes only view, model, mode and focus, while expanded stays in history state', () => {
    const state = createSemanticBrowserState(manifest, { view: 'api', model: 'change:auth', mode: 'diff-only', focus: 'root.api' }, { expanded: ['root.api'] })
    expect(encodeSemanticBrowserUrl(state)).toEqual({ view: 'api', model: 'change:auth', mode: 'diff-only', focus: 'root.api' })
    expect(historyStateForSemanticBrowser(state)).toEqual({ expanded: ['root.api'] })
    expect(JSON.stringify(encodeSemanticBrowserUrl(state))).not.toContain('expanded')
  })

  it('builds a deterministic projection request with the expected fingerprint', () => {
    const state = createSemanticBrowserState(manifest, { model: 'change:auth' }, { expanded: ['root.db', 'root.api'] })
    expect(projectionRequestForSemanticBrowser(state, manifest.modelFingerprint)).toEqual({
      viewId: 'full-model',
      model: 'change:auth',
      mode: 'complete-with-diff',
      focus: null,
      expanded: ['root.api', 'root.db'],
      expectedFingerprint: 'model-fp',
    })
  })
})

describe('mirrorActorFocus', () => {
  const modelState = createSemanticBrowserState(manifest, { view: 'full-model' })
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

  it('leaves the full-model actor at its default null focus untouched', () => {
    expect(mirrorActorFocus(modelState, manifest, null, 'root')).toBeNull()
    expect(mirrorActorFocus(modelState, manifest, 'root', 'root')).toBeNull()
  })

  it('does not mirror an actor focus the controller already holds', () => {
    const focused = createSemanticBrowserState(manifest, { view: 'api', focus: 'root.api' })
    expect(mirrorActorFocus(focused, manifest, 'root.api', 'root')).toBeNull()
  })
})
