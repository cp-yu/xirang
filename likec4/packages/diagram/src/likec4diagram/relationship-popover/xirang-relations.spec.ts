import { describe, expect, it } from 'vitest'
import { readXirangTriples, resolveXirangRelation, resolveXirangRelations } from './xirang-relations'
import type { XirangSemanticModel } from '../../xirang/ContractLoaderContext'

const architecture: XirangSemanticModel = {
  elements: [
    { declaration: { identity: 'apply', kind: 'element', parent: null, title: 'Apply', definition: '', summary: '', description: '' } },
    { declaration: { identity: 'review', kind: 'element', parent: 'verify', title: 'Review', definition: '', summary: '', description: '' } },
  ],
  relationships: [{ source: 'apply', kind: 'precedes', target: 'review' }],
  relationshipKinds: [{ identity: 'precedes', body: 'precedes semantics' }],
}

describe('readXirangTriples', () => {
  it('reads an aggregated xirangRelations array', () => {
    expect(readXirangTriples({ metadata: { xirangRelations: ['a|k|b', 'c|k|d'] } }))
      .toEqual(['a|k|b', 'c|k|d'])
  })

  it('reads a single xirangRelation', () => {
    expect(readXirangTriples({ metadata: { xirangRelation: 'a|k|b' } })).toEqual(['a|k|b'])
  })

  it('returns null when no Xirang metadata is present', () => {
    expect(readXirangTriples({ metadata: {} })).toBeNull()
    expect(readXirangTriples({ metadata: { xirangRelations: 'not-an-array' } })).toBeNull()
    expect(readXirangTriples({})).toBeNull()
  })
})

describe('resolveXirangRelations', () => {
  it('enriches triples with element titles and kind semantics', () => {
    const [relation] = resolveXirangRelations(['apply|precedes|review'], architecture)
    expect(relation).toMatchObject({
      triple: 'apply|precedes|review',
      source: 'apply',
      kind: 'precedes',
      target: 'review',
      sourceLabel: 'Apply',
      targetLabel: 'Review',
      description: 'precedes semantics',
    })
  })

  it('falls back to identities for unknown elements and drops malformed triples', () => {
    const [relation] = resolveXirangRelations(['unknown|precedes|review', 'malformed'], architecture)
    expect(relation?.sourceLabel).toBe('unknown')
    expect(relation?.targetLabel).toBe('Review')
    expect(resolveXirangRelations(['apply|unknown-kind|review'], architecture)[0]?.description).toBeNull()
    expect(resolveXirangRelation('not-a-triple', architecture)).toBeNull()
  })
})
