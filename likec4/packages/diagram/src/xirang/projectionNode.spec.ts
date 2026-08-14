import { describe, expect, it } from 'vitest'
import {
  addedXirangProjectionIdentity,
  readXirangProjectionEdge,
  readXirangProjectionNode,
  readXirangRelationCounts,
  xirangProjectionMetadata,
} from './projectionNode'

describe('Xirang projection node metadata', () => {
  it('round-trips ADDED identity and hidden-child state', () => {
    const metadata = xirangProjectionMetadata('test-entity', 'ADDED', true)

    expect(readXirangProjectionNode({ metadata, children: [] })).toEqual({
      identity: 'test-entity',
      operation: 'ADDED',
      requirementCounts: { added: 0, modified: 0, removed: 0 },
      hasChildren: true,
      expanded: false,
    })
  })

  it('round-trips requirement counts with an element operation', () => {
    const metadata = xirangProjectionMetadata('test-entity', 'MODIFIED', false, { added: 2, modified: 1, removed: 0 })

    expect(readXirangProjectionNode({ metadata, children: [] })).toMatchObject({
      identity: 'test-entity',
      operation: 'MODIFIED',
      requirementCounts: { added: 2, modified: 1, removed: 0 },
    })
  })

  it('resolves counts-only nodes without an element operation', () => {
    const metadata = xirangProjectionMetadata('test-entity', undefined, false, { added: 0, modified: 1, removed: 0 })

    expect(readXirangProjectionNode({ metadata, children: [] })).toEqual({
      identity: 'test-entity',
      requirementCounts: { added: 0, modified: 1, removed: 0 },
      hasChildren: false,
      expanded: false,
    })
  })

  it('resolves nodes from elementId metadata without counts', () => {
    expect(readXirangProjectionNode({ metadata: { elementId: 'legacy-entity' }, children: [] })).toEqual({
      identity: 'legacy-entity',
      requirementCounts: { added: 0, modified: 0, removed: 0 },
      hasChildren: false,
      expanded: false,
    })
  })

  it('resolves only ADDED XYFlow projection data for details', () => {
    expect(addedXirangProjectionIdentity({
      xirang: {
        identity: 'test-entity',
        operation: 'ADDED',
        hasChildren: false,
        expanded: false,
      },
    })).toBe('test-entity')
    expect(addedXirangProjectionIdentity({
      xirang: {
        identity: 'test-entity',
        operation: 'MODIFIED',
        hasChildren: false,
        expanded: false,
      },
    })).toBeNull()
  })
})

describe('Xirang projection edge relation counts', () => {
  it('parses added,modified,removed counts', () => {
    expect(readXirangRelationCounts('2,1,0')).toEqual({ added: 2, modified: 1, removed: 0 })
    expect(readXirangRelationCounts('0,0,3')).toEqual({ added: 0, modified: 0, removed: 3 })
  })

  it('rejects malformed or non-string counts', () => {
    expect(readXirangRelationCounts('x')).toBeUndefined()
    expect(readXirangRelationCounts('1,2')).toBeUndefined()
    expect(readXirangRelationCounts('1,2,3,4')).toBeUndefined()
    expect(readXirangRelationCounts(['1,0,0'])).toBeUndefined()
    expect(readXirangRelationCounts(undefined)).toBeUndefined()
  })

  it('resolves edge metadata with relation counts and without them', () => {
    expect(readXirangProjectionEdge({ metadata: { xirangRelationCounts: '1,0,2', xirangRelation: 'a|calls|b' } }))
      .toMatchObject({ relation: 'a|calls|b', relationCounts: { added: 1, modified: 0, removed: 2 } })
    const without = readXirangProjectionEdge({ metadata: { xirangRelation: 'a|calls|b' } })
    expect(without).toMatchObject({ relation: 'a|calls|b' })
    expect(without).not.toHaveProperty('relationCounts')
  })
})
