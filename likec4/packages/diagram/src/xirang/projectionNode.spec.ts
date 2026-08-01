import { describe, expect, it } from 'vitest'
import {
  addedXirangProjectionIdentity,
  readXirangProjectionNode,
  xirangProjectionMetadata,
} from './projectionNode'

describe('Xirang projection node metadata', () => {
  it('round-trips ADDED identity and hidden-child state', () => {
    const metadata = xirangProjectionMetadata('test-entity', 'ADDED', true)

    expect(readXirangProjectionNode({ metadata, children: [] })).toEqual({
      identity: 'test-entity',
      operation: 'ADDED',
      hasChildren: true,
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
