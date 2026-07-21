import { RichText } from '@likec4/core'
import { describe, expect, it, vi } from 'vitest'
import type { OpsxSpecLoader } from '../../opsx/SpecLoaderContext'
import {
  getSpecsTabModel,
  OpsxSpecLoadController,
  normalizeSpecPaths,
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
  it('normalizes absent, single, and multiple Spec indexes in order', () => {
    expect(normalizeSpecPaths(undefined)).toEqual([])
    expect(normalizeSpecPaths('')).toEqual([])
    expect(normalizeSpecPaths('.opsx/specs/api/spec.md')).toEqual([
      '.opsx/specs/api/spec.md',
    ])
    expect(normalizeSpecPaths([
      '.opsx/specs/a/spec.md',
      '',
      '.opsx/specs/b/spec.md',
      '.opsx/specs/a/spec.md',
    ])).toEqual([
      '.opsx/specs/a/spec.md',
      '.opsx/specs/b/spec.md',
    ])
  })

  it('shows no tab, direct content, or a selector for zero, one, or many Specs', () => {
    expect(getSpecsTabModel(undefined)).toEqual({
      paths: [], visible: false, showSelector: false, selected: null,
    })
    expect(getSpecsTabModel('.opsx/specs/a/spec.md')).toEqual({
      paths: ['.opsx/specs/a/spec.md'], visible: true, showSelector: false,
      selected: '.opsx/specs/a/spec.md',
    })
    expect(getSpecsTabModel(['.opsx/specs/a/spec.md', '.opsx/specs/b/spec.md'])).toEqual({
      paths: ['.opsx/specs/a/spec.md', '.opsx/specs/b/spec.md'],
      visible: true, showSelector: true, selected: '.opsx/specs/a/spec.md',
    })
  })

  it('aborts the previous request and ignores stale responses', async () => {
    const first = deferred<{ path: string; md: string }>()
    const second = deferred<{ path: string; md: string }>()
    const signals: AbortSignal[] = []
    const loader: OpsxSpecLoader = {
      load: vi.fn((_project, _element, specPath, signal) => {
        signals.push(signal)
        return specPath.includes('/a/') ? first.promise : second.promise
      }),
    }
    const states: SpecLoadState[] = []
    const controller = new OpsxSpecLoadController(state => states.push(state))

    controller.load(loader, 'default', 'core.a', '.opsx/specs/a/spec.md')
    controller.load(loader, 'default', 'core.b', '.opsx/specs/b/spec.md')
    expect(signals[0]?.aborted).toBe(true)

    second.resolve({ path: '.opsx/specs/b/spec.md', md: '# B' })
    await second.promise
    await Promise.resolve()
    first.resolve({ path: '.opsx/specs/a/spec.md', md: '# A' })
    await first.promise
    await Promise.resolve()

    expect(states.at(-1)).toEqual({
      status: 'success',
      project: 'default',
      element: 'core.b',
      content: { path: '.opsx/specs/b/spec.md', md: '# B' },
    })
    expect(states).not.toContainEqual({
      status: 'success',
      project: 'default',
      element: 'core.a',
      content: { path: '.opsx/specs/a/spec.md', md: '# A' },
    })
  })

  it('isolates errors to the selected Spec and supports retry', async () => {
    const loader: OpsxSpecLoader = {
      load: vi.fn()
        .mockRejectedValueOnce(new Error('permission denied'))
        .mockResolvedValueOnce({ path: '.opsx/specs/a/spec.md', md: '# A' }),
    }
    const states: SpecLoadState[] = []
    const controller = new OpsxSpecLoadController(state => states.push(state))

    controller.load(loader, 'default', 'core.a', '.opsx/specs/a/spec.md')
    await Promise.resolve()
    await Promise.resolve()
    expect(states.at(-1)).toEqual({
      status: 'error',
      project: 'default',
      element: 'core.a',
      path: '.opsx/specs/a/spec.md',
      message: 'permission denied',
    })

    controller.load(loader, 'default', 'core.a', '.opsx/specs/a/spec.md')
    await Promise.resolve()
    await Promise.resolve()
    expect(states.at(-1)?.status).toBe('success')
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
