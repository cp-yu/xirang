import { describe, expect, it } from 'vitest'
import { declarationFieldDiffs } from './DiffTab'

describe('declarationFieldDiffs', () => {
  it('extracts field diffs from a MODIFIED entry', () => {
    const fields = declarationFieldDiffs({
      kind: 'element-declaration',
      identity: 'alpha.id',
      operation: 'MODIFIED',
      before: { kind: 'capability', parent: 'project.root', title: 'Alpha', definition: 'Old def' },
      after: { kind: 'service', parent: 'project.root', title: 'Alpha Service', definition: 'New def' },
    })

    expect(fields).toEqual([
      { label: 'kind', before: 'capability', after: 'service', changed: true },
      { label: 'parent', before: 'project.root', after: 'project.root', changed: false },
      { label: 'title', before: 'Alpha', after: 'Alpha Service', changed: true },
      { label: 'definition', before: 'Old def', after: 'New def', changed: true, longText: true },
    ])
  })

  it('returns empty array for undefined entry', () => {
    expect(declarationFieldDiffs(undefined)).toEqual([])
  })

  it('handles ADDED entry with no before', () => {
    const fields = declarationFieldDiffs({
      kind: 'element-declaration',
      identity: 'gamma.id',
      operation: 'ADDED',
      after: { kind: 'capability', parent: 'project.root', title: 'Gamma', definition: 'Added' },
    })

    expect(fields[0]).toMatchObject({ label: 'kind', before: '', after: 'capability', changed: true })
    expect(fields[1]).toMatchObject({ label: 'parent', before: '', after: 'project.root', changed: true })
  })

  it('handles REMOVED entry with no after', () => {
    const fields = declarationFieldDiffs({
      kind: 'element-declaration',
      identity: 'beta.id',
      operation: 'REMOVED',
      before: { kind: 'capability', parent: 'project.root', title: 'Beta', definition: 'Removed' },
    })

    expect(fields[0]).toMatchObject({ label: 'kind', before: 'capability', after: '', changed: true })
    expect(fields[3]).toMatchObject({ label: 'definition', before: 'Removed', after: '', changed: true })
  })
})