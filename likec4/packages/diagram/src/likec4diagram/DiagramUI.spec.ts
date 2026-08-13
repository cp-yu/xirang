import { describe, expect, it } from 'vitest'
import type { XirangViewSource } from '../xirang/ContractLoaderContext'
import { getArchitectureOverlayModel } from './DiagramUI'

const source = (
  diff: XirangViewSource['diff'] | undefined,
  diagnostics: XirangViewSource['diagnostics'] = [],
): XirangViewSource => ({
  id: 'change:test',
  label: 'test',
  source: 'change-derived-view',
  change: 'test',
  valid: true,
  diagnostics,
  ...(diff ? { diff } : {}),
})

describe('getArchitectureOverlayModel', () => {
  it('只统计 element-declaration 与 relationship 级变更', () => {
    const overlay = getArchitectureOverlayModel(source({
      summary: { total: 5, ADDED: 2, MODIFIED: 2, REMOVED: 1 },
      entries: [
        { kind: 'element-declaration', identity: 'a', operation: 'ADDED' },
        { kind: 'element-declaration', identity: 'b', operation: 'MODIFIED' },
        { kind: 'relationship', identity: 'a|invokes|b', operation: 'REMOVED' },
        { kind: 'requirement', identity: 'a#新增', operation: 'ADDED' },
        { kind: 'requirement', identity: 'b#修改', operation: 'MODIFIED' },
      ],
    }))
    expect(overlay.counts).toEqual({ ADDED: 1, MODIFIED: 1, REMOVED: 1 })
  })

  it('纯 requirement 变更不计入计数，也不标记 changed', () => {
    const overlay = getArchitectureOverlayModel(source({
      summary: { total: 1, ADDED: 0, MODIFIED: 1, REMOVED: 0 },
      entries: [{ kind: 'requirement', identity: 'a#修改', operation: 'MODIFIED' }],
    }))
    expect(overlay.counts).toEqual({ ADDED: 0, MODIFIED: 0, REMOVED: 0 })
    expect(overlay.changed).toEqual([])
  })

  it('保持 diff entry 原始顺序并按 kind、identity 排序 metamodel', () => {
    const overlay = getArchitectureOverlayModel(source({
      summary: { total: 3, ADDED: 3, MODIFIED: 0, REMOVED: 0 },
      entries: [
        { kind: 'element-kind', identity: 'zeta-kind', operation: 'ADDED' },
        { kind: 'relationship-kind', identity: 'invokes', operation: 'ADDED' },
        { kind: 'element-kind', identity: 'alpha-kind', operation: 'ADDED' },
      ],
    }))
    expect(overlay.entries.map(entry => entry.identity)).toEqual(['zeta-kind', 'invokes', 'alpha-kind'])
    expect(overlay.metamodel.map(entry => `${entry.kind}:${entry.identity}`)).toEqual([
      'element-kind:alpha-kind',
      'element-kind:zeta-kind',
      'relationship-kind:invokes',
    ])
  })

  it('从 context 移除 changed identity，并过滤 contract 诊断', () => {
    const overlay = getArchitectureOverlayModel(source({
      summary: { total: 1, ADDED: 1, MODIFIED: 0, REMOVED: 0 },
      entries: [{
        kind: 'element-declaration',
        identity: 'a',
        operation: 'ADDED',
        before: { parent: 'old-parent' },
        after: { parent: 'new-parent' },
      }],
    }, [
      { level: 'ERROR', code: 'E1', path: 'p', message: 'contract diagnostic', identity: 'a#req' },
      { level: 'ERROR', code: 'E2', path: 'p', message: 'structural diagnostic' },
    ]))
    expect(overlay.changed).toEqual(['a'])
    expect(overlay.context).toEqual(['new-parent', 'old-parent'])
    expect(overlay.diagnostics.map(diagnostic => diagnostic.code)).toEqual(['E2'])
  })
})
