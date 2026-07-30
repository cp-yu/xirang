import { promises as fs } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { assertXirangProject, readXirangContract, readXirangContractChange } from './xirang-contract-handler'

const manifest = {
  semanticModel: { contracts: { 'core.api': '# API\n', 'core.other': '# Other\n' } },
  changes: { auth: { contracts: { 'core.api': '# API (auth)\n' } } },
}

describe('Xirang Contract handler', () => {
  it('rejects content access for an unknown model project', () => {
    expect(() => assertXirangProject('missing', [{ id: 'default' }]))
      .toThrow(expect.objectContaining({ statusCode: 404, message: 'Project not found' }))
    expect(() => assertXirangProject('default', [{ id: 'default' }])).not.toThrow()
  })

  it('reads the Contract from the Semantic Model or requested Change', () => {
    expect(readXirangContract(manifest, null, 'core.api')).toEqual({ element: 'core.api', md: '# API\n' })
    expect(readXirangContract(manifest, 'auth', 'core.api'))
      .toEqual({ element: 'core.api', md: '# API (auth)\n' })
  })

  it('rejects the removed query parameter', () => {
    expect(() => readXirangContractChange(new URLSearchParams({ variant: 'formal' })))
      .toThrow(expect.objectContaining({ statusCode: 400, message: 'Unsupported query parameter: variant' }))
    expect(readXirangContractChange(new URLSearchParams({ change: 'auth' }))).toBe('auth')
  })

  it('returns null for an Element without a Contract instead of failing', () => {
    expect(readXirangContract(manifest, 'auth', 'core.other')).toBeNull()
    expect(readXirangContract({ semanticModel: {}, changes: {} }, null, 'core.api')).toBeNull()
  })

  it('rejects an unknown Change', () => {
    expect(() => readXirangContract(manifest, 'missing', 'core.api'))
      .toThrow(expect.objectContaining({ statusCode: 404, message: 'Change not found' }))
    expect(() => readXirangContract(undefined, null, 'core.api'))
      .toThrow(expect.objectContaining({ statusCode: 404 }))
  })

  it.each([
    '../../../etc/passwd',
    '..',
    '.',
    '/etc/passwd',
    'C:\\Windows\\win.ini',
    '..%2f..%2fetc%2fpasswd',
    '.xirang/model/elements/core.api.md',
    'core.api\u0000.md',
    'unknown.element',
    '__proto__',
    'constructor',
    'toString',
  ])('answers %j by lookup miss and never touches the file system', element => {
    const readFile = vi.spyOn(fs, 'readFile')
    const realpath = vi.spyOn(fs, 'realpath')
    try {
      expect(readXirangContract(manifest, null, element)).toBeNull()
      expect(readFile).not.toHaveBeenCalled()
      expect(realpath).not.toHaveBeenCalled()
    } finally {
      readFile.mockRestore()
      realpath.mockRestore()
    }
  })
})
