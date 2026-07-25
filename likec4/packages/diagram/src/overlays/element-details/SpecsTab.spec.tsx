import { RichText } from '@likec4/core'
import { describe, expect, it, vi } from 'vitest'
import type { XirangSpecLoader } from '../../xirang/SpecLoaderContext'
import {
  createTextDiff,
  getSpecsTabModel,
  getStructuredSpecDiff,
  XirangSpecIndexController,
  XirangSpecLoadController,
  normalizeSpecPaths,
  type XirangSpecIndexState,
  type SpecLoadState,
} from './SpecsTab'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('SpecsTab', () => {
  it('normalizes absent, single, and multiple registry entries deterministically', () => {
    expect(normalizeSpecPaths(undefined)).toEqual([])
    expect(normalizeSpecPaths('')).toEqual([])
    expect(normalizeSpecPaths('.xirang/specs/api/spec.md')).toEqual([
      '.xirang/specs/api/spec.md',
    ])
    expect(normalizeSpecPaths([
      '.xirang/specs/a/spec.md',
      '',
      '.xirang/specs/b/spec.md',
      '.xirang/specs/a/spec.md',
    ])).toEqual([
      '.xirang/specs/a/spec.md',
      '.xirang/specs/b/spec.md',
    ])
    expect(normalizeSpecPaths([
      '.xirang/specs/z/spec.md',
      '.xirang/specs/a/spec.md',
    ])).toEqual([
      '.xirang/specs/a/spec.md',
      '.xirang/specs/z/spec.md',
    ])
  })

  it('shows no tab, direct content, or a selector for zero, one, or many Specs', () => {
    expect(getSpecsTabModel(undefined)).toEqual({
      paths: [], visible: false, showSelector: false, selected: null,
    })
    expect(getSpecsTabModel('.xirang/specs/a/spec.md')).toEqual({
      paths: ['.xirang/specs/a/spec.md'], visible: true, showSelector: false,
      selected: '.xirang/specs/a/spec.md',
    })
    expect(getSpecsTabModel(['.xirang/specs/a/spec.md', '.xirang/specs/b/spec.md'])).toEqual({
      paths: ['.xirang/specs/a/spec.md', '.xirang/specs/b/spec.md'],
      visible: true, showSelector: true, selected: '.xirang/specs/a/spec.md',
    })
  })

  it('clears the old index and ignores late element index responses', async () => {
    const first = deferred<readonly string[]>()
    const second = deferred<readonly string[]>()
    const loader: XirangSpecLoader = {
      list: vi.fn((_project, element) => element === 'element.a' ? first.promise : second.promise),
      load: vi.fn(),
    }
    const indexes: XirangSpecIndexState[] = []
    const controller = new XirangSpecIndexController(index => indexes.push(index))

    controller.load(loader, 'default', 'element.a')
    controller.load(loader, 'default', 'element.b')
    second.resolve(['.xirang/specs/b/spec.md'])
    await second.promise
    await Promise.resolve()
    first.resolve(['.xirang/specs/a/spec.md'])
    await first.promise
    await Promise.resolve()

    expect(indexes.at(-1)).toEqual({
      project: 'default',
      element: 'element.b',
      paths: ['.xirang/specs/b/spec.md'],
    })
    expect(indexes.slice(2)).not.toContainEqual({
      project: 'default',
      element: 'element.a',
      paths: ['.xirang/specs/a/spec.md'],
    })
  })

  it('aborts the previous request and ignores stale responses', async () => {
    const first = deferred<{ path: string; md: string }>()
    const second = deferred<{ path: string; md: string }>()
    const signals: AbortSignal[] = []
    const loader: XirangSpecLoader = {
      list: vi.fn(),
      load: vi.fn((_project, _element, specPath, signal) => {
        signals.push(signal)
        return specPath.includes('/a/') ? first.promise : second.promise
      }),
    }
    const states: SpecLoadState[] = []
    const controller = new XirangSpecLoadController(state => states.push(state))

    controller.load(loader, 'default', 'core.a', '.xirang/specs/a/spec.md')
    controller.load(loader, 'default', 'core.b', '.xirang/specs/b/spec.md')
    expect(signals[0]?.aborted).toBe(true)

    second.resolve({ path: '.xirang/specs/b/spec.md', md: '# B' })
    await second.promise
    await Promise.resolve()
    first.resolve({ path: '.xirang/specs/a/spec.md', md: '# A' })
    await first.promise
    await Promise.resolve()

    expect(states.at(-1)).toEqual({
      status: 'success',
      project: 'default',
      element: 'core.b',
      content: { path: '.xirang/specs/b/spec.md', md: '# B' },
    })
    expect(states).not.toContainEqual({
      status: 'success',
      project: 'default',
      element: 'core.a',
      content: { path: '.xirang/specs/a/spec.md', md: '# A' },
    })
  })

  it('isolates errors to the selected Spec and supports retry', async () => {
    const loader: XirangSpecLoader = {
      list: vi.fn(),
      load: vi.fn()
        .mockRejectedValueOnce(new Error('permission denied'))
        .mockResolvedValueOnce({ path: '.xirang/specs/a/spec.md', md: '# A' }),
    }
    const states: SpecLoadState[] = []
    const controller = new XirangSpecLoadController(state => states.push(state))

    controller.load(loader, 'default', 'core.a', '.xirang/specs/a/spec.md')
    await Promise.resolve()
    await Promise.resolve()
    expect(states.at(-1)).toEqual({
      status: 'error',
      project: 'default',
      element: 'core.a',
      path: '.xirang/specs/a/spec.md',
      message: 'permission denied',
    })

    controller.load(loader, 'default', 'core.a', '.xirang/specs/a/spec.md')
    await Promise.resolve()
    await Promise.resolve()
    expect(states.at(-1)?.status).toBe('success')
  })

  it('derives Requirement and Scenario badges from the unified Diff IR', () => {
    const model = getStructuredSpecDiff({
      id: 'change:auth', label: 'auth', kind: 'change', valid: true, diagnostics: [],
      diff: {
        summary: {
          total: 1,
          specs: { ADDED: 0, MODIFIED: 1, REMOVED: 0 },
          architecture: { ADDED: 0, MODIFIED: 0, REMOVED: 0 },
        },
        entries: [{
          scope: 'specs', kind: 'requirement', identity: 'auth#Login', operation: 'MODIFIED',
          before: { body: 'The system SHALL use password login.' },
          after: { body: 'The system SHALL use secure password login.' },
          children: [
            { scope: 'specs', kind: 'scenario', identity: 'auth#Login#Legacy', operation: 'REMOVED', before: { body: 'legacy' } },
            { scope: 'specs', kind: 'scenario', identity: 'auth#Login#MFA', operation: 'ADDED', after: { body: 'mfa' } },
          ],
        }],
      },
    }, '.xirang/specs/auth/spec.md')

    expect(model.requirements).toEqual([
      expect.objectContaining({
        title: 'Login', operation: 'MODIFIED',
        scenarios: expect.arrayContaining([
          expect.objectContaining({ title: 'Legacy', operation: 'REMOVED' }),
          expect.objectContaining({ title: 'MFA', operation: 'ADDED' }),
        ]),
      }),
    ])
    expect(model.requirements[0]?.text.flatMap(line => line.words ?? []).some(word => word.operation === 'ADDED')).toBe(true)
  })

  it('builds line and inline word additions/removals while retaining unchanged context', () => {
    const diff = createTextDiff('same\nold phrase here\ntail', 'same\nnew phrase here\ntail')

    expect(diff.map(line => line.operation)).toEqual(['UNCHANGED', 'REMOVED', 'ADDED', 'UNCHANGED'])
    expect(diff[1]?.words).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: 'REMOVED', text: 'old' }),
    ]))
    expect(diff[2]?.words).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: 'ADDED', text: 'new' }),
    ]))
  })

  it('keeps Spec diagnostics partitioned from usable structured diff content', () => {
    const model = getStructuredSpecDiff({
      id: 'change:auth', label: 'auth', kind: 'change', valid: false,
      diagnostics: [
        { level: 'ERROR', code: 'SPEC_PARSE', path: 'specs/auth/spec.md:8', message: 'Bad Scenario' },
        { level: 'ERROR', code: 'ARCH', path: 'architecture-delta.c4:2', message: 'Bad element' },
      ],
      diff: {
        summary: {
          total: 1,
          specs: { ADDED: 1, MODIFIED: 0, REMOVED: 0 },
          architecture: { ADDED: 0, MODIFIED: 0, REMOVED: 0 },
        },
        entries: [{ scope: 'specs', kind: 'requirement', identity: 'auth#Login', operation: 'ADDED', after: { body: 'new' } }],
      },
    }, '.xirang/specs/auth/spec.md')

    expect(model.requirements).toHaveLength(1)
    expect(model.diagnostics).toEqual([
      expect.objectContaining({ code: 'SPEC_PARSE' }),
    ])
  })

  it('uses the existing sanitized RichText Markdown pipeline', () => {
    const value = RichText.from({
      md: '# Safe\n<script>alert(1)</script><img src=x onerror="alert(2)">',
    })

    expect(value.html).toContain('<h1>Safe</h1>')
    expect(value.html).not.toContain('<script')
    expect(value.html).not.toContain('onerror')
  })
})
