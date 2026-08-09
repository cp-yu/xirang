import { describe, expect, it } from 'vitest'
import { assertXirangManifest, XirangContractError } from './xirang/xirang-contract-handler'

describe('assertXirangManifest', () => {
  const valid = { version: 4, modelFingerprint: 'fp0', model: {}, authoredViews: {}, changes: {} }

  it('accepts a valid version 4 manifest', () => {
    expect(() => assertXirangManifest(valid)).not.toThrow()
  })

  it.each([3, 2, 1, 0])('rejects manifest version %i instead of silently migrating it', version => {
    expect(() => assertXirangManifest({ ...valid, version }))
      .toThrow(expect.objectContaining({ statusCode: 500 }))
  })

  it.each([null, 'str', { ...valid, modelFingerprint: undefined }, { ...valid, authoredViews: undefined }])(
    'rejects malformed manifest %j',
    payload => {
      expect(() => assertXirangManifest(payload)).toThrow(XirangContractError)
    },
  )

  it('rejects a manifest without a modelFingerprint (version 3 shape)', () => {
    const v3like = { version: 4, model: {}, authoredViews: {}, changes: {} }
    expect(() => assertXirangManifest(v3like)).toThrow(XirangContractError)
  })
})
