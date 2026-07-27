import { promises as fs } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { assertXirangProject, readXirangContract } from './xirang-spec-handler'

const variants = [
  { id: 'formal', contracts: { 'core.api': '# API\n', 'core.other': '# Other\n' } },
  { id: 'change:auth', contracts: { 'core.api': '# API (auth)\n' } },
]

describe('Xirang Contract handler', () => {
  it('rejects content access for an unknown model project', () => {
    expect(() => assertXirangProject('missing', [{ id: 'default' }]))
      .toThrow(expect.objectContaining({ statusCode: 404, message: 'Project not found' }))
    expect(() => assertXirangProject('default', [{ id: 'default' }])).not.toThrow()
  })

  it('reads the Contract of the requested variant, defaulting to Formal', () => {
    expect(readXirangContract(variants, 'formal', 'core.api')).toEqual({ element: 'core.api', md: '# API\n' })
    expect(readXirangContract(variants, null, 'core.api')).toEqual({ element: 'core.api', md: '# API\n' })
    expect(readXirangContract(variants, 'change:auth', 'core.api'))
      .toEqual({ element: 'core.api', md: '# API (auth)\n' })
  })

  it('returns null for an Element without a Contract instead of failing', () => {
    expect(readXirangContract(variants, 'change:auth', 'core.other')).toBeNull()
    expect(readXirangContract([{ id: 'formal' }], 'formal', 'core.api')).toBeNull()
  })

  it('rejects an unknown variant', () => {
    expect(() => readXirangContract(variants, 'change:missing', 'core.api'))
      .toThrow(expect.objectContaining({ statusCode: 404, message: 'Variant not found' }))
    expect(() => readXirangContract(undefined, 'formal', 'core.api'))
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
      expect(readXirangContract(variants, 'formal', element)).toBeNull()
      expect(readFile).not.toHaveBeenCalled()
      expect(realpath).not.toHaveBeenCalled()
    } finally {
      readFile.mockRestore()
      realpath.mockRestore()
    }
  })
})
