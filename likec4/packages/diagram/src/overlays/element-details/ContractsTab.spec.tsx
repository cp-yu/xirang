import { RichText } from '@likec4/core'
import { describe, expect, it, vi } from 'vitest'
import type {
  XirangContractContent,
  XirangDiffEntry,
  XirangRuntimeVariant,
  XirangContractLoader,
} from '../../xirang/ContractLoaderContext'
import {
  createTextDiff,
  getStructuredContractDiff,
  XirangContractLoadController,
  type ContractLoadState,
} from './ContractsTab'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function changeVariant(
  entries: XirangDiffEntry[],
  diagnostics: XirangRuntimeVariant['diagnostics'] = [],
): XirangRuntimeVariant {
  return {
    id: 'change:auth',
    label: 'auth',
    kind: 'change',
    valid: true,
    diagnostics,
    diff: { summary: { total: entries.length, ADDED: 0, MODIFIED: 0, REMOVED: 0 }, entries },
  }
}

describe('ContractsTab', () => {
  it('aborts the previous request and ignores stale responses', async () => {
    const first = deferred<XirangContractContent | null>()
    const second = deferred<XirangContractContent | null>()
    const signals: AbortSignal[] = []
    const loader: XirangContractLoader = {
      load: vi.fn((_project, element, signal) => {
        signals.push(signal)
        return element === 'core.a' ? first.promise : second.promise
      }),
    }
    const states: ContractLoadState[] = []
    const controller = new XirangContractLoadController(state => states.push(state))

    controller.load(loader, 'default', 'core.a')
    controller.load(loader, 'default', 'core.b')
    expect(signals[0]?.aborted).toBe(true)

    second.resolve({ element: 'core.b', md: '# B' })
    await second.promise
    await Promise.resolve()
    first.resolve({ element: 'core.a', md: '# A' })
    await first.promise
    await Promise.resolve()

    expect(states.at(-1)).toEqual({
      status: 'success',
      project: 'default',
      element: 'core.b',
      content: { element: 'core.b', md: '# B' },
    })
    expect(states).not.toContainEqual({
      status: 'success',
      project: 'default',
      element: 'core.a',
      content: { element: 'core.a', md: '# A' },
    })
  })

  it('surfaces an absent Contract as a successful null result', async () => {
    const loader: XirangContractLoader = { load: vi.fn().mockResolvedValue(null) }
    const states: ContractLoadState[] = []
    const controller = new XirangContractLoadController(state => states.push(state))

    controller.load(loader, 'default', 'core.a')
    await Promise.resolve()
    await Promise.resolve()

    expect(states.at(-1)).toEqual({ status: 'success', project: 'default', element: 'core.a', content: null })
  })

  it('isolates errors to the selected Element and supports retry', async () => {
    const loader: XirangContractLoader = {
      load: vi.fn()
        .mockRejectedValueOnce(new Error('permission denied'))
        .mockResolvedValueOnce({ element: 'core.a', md: '# A' }),
    }
    const states: ContractLoadState[] = []
    const controller = new XirangContractLoadController(state => states.push(state))

    controller.load(loader, 'default', 'core.a')
    await Promise.resolve()
    await Promise.resolve()
    expect(states.at(-1)).toEqual({
      status: 'error',
      project: 'default',
      element: 'core.a',
      message: 'permission denied',
    })

    controller.load(loader, 'default', 'core.a')
    await Promise.resolve()
    await Promise.resolve()
    expect(states.at(-1)?.status).toBe('success')
  })

  it('derives Requirement and Scenario badges from the unified Diff IR', () => {
    const model = getStructuredContractDiff(
      changeVariant([{
        kind: 'requirement',
        identity: 'auth.core_v1#Login',
        operation: 'MODIFIED',
        before: { body: 'The system SHALL use password login.' },
        after: { body: 'The system SHALL use secure password login.' },
        children: [
          { kind: 'scenario', identity: 'auth.core_v1#Login#Legacy', operation: 'REMOVED', before: { body: 'legacy' } },
          { kind: 'scenario', identity: 'auth.core_v1#Login#MFA', operation: 'ADDED', after: { body: 'mfa' } },
        ],
      }]),
      'auth.core_v1',
    )

    expect(model.requirements).toEqual([
      expect.objectContaining({
        title: 'Login',
        operation: 'MODIFIED',
        scenarios: [
          expect.objectContaining({ title: 'Legacy', operation: 'REMOVED' }),
          expect.objectContaining({ title: 'MFA', operation: 'ADDED' }),
        ],
      }),
    ])
    expect(model.requirements[0]?.text.flatMap(line => line.words ?? []).some(word => word.operation === 'ADDED')).toBe(true)
  })

  it('filters by host Element identity without crossing an identity boundary', () => {
    const model = getStructuredContractDiff(
      changeVariant([
        { kind: 'requirement', identity: 'cap.a#Own', operation: 'ADDED', after: { body: 'own' } },
        { kind: 'requirement', identity: 'cap.ab#Foreign', operation: 'ADDED', after: { body: 'foreign' } },
        { kind: 'element-declaration', identity: 'cap.a', operation: 'MODIFIED' },
      ]),
      'cap.a',
    )

    expect(model.requirements.map(requirement => requirement.identity)).toEqual(['cap.a#Own'])
  })

  it('keeps Contract diagnostics partitioned from structural ones by identity', () => {
    const model = getStructuredContractDiff(
      changeVariant(
        [{ kind: 'requirement', identity: 'auth.id#Login', operation: 'ADDED', after: { body: 'new' } }],
        [
          { level: 'ERROR', code: 'CONTRACT', path: 'elements/auth.id.md', message: 'Bad Scenario', identity: 'auth.id#Login' },
          { level: 'ERROR', code: 'DECLARATION', path: 'elements/auth.id.md', message: 'Bad kind', identity: 'auth.id' },
          { level: 'ERROR', code: 'OTHER', path: 'elements/other.id.md', message: 'Bad', identity: 'other.id#Login' },
        ],
      ),
      'auth.id',
    )

    expect(model.requirements).toHaveLength(1)
    expect(model.diagnostics).toEqual([expect.objectContaining({ code: 'CONTRACT' })])
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

  it('uses the existing sanitized RichText Markdown pipeline', () => {
    const value = RichText.from({
      md: '# Safe\n<script>alert(1)</script><img src=x onerror="alert(2)">',
    })

    expect(value.html).toContain('<h1>Safe</h1>')
    expect(value.html).not.toContain('<script')
    expect(value.html).not.toContain('onerror')
  })
})
