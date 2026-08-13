import { describe, expect, it } from 'vitest'
import type { XirangViewSource } from '../xirang/ContractLoaderContext'
import { getArchitectureOverlayModel } from './DiagramUI'

const source = (diff: XirangViewSource['diff'] | undefined): XirangViewSource => ({
  id: 'change:test',
  label: 'test',
  source: 'change-derived-view',
  change: 'test',
  valid: true,
  diagnostics: [],
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
})
