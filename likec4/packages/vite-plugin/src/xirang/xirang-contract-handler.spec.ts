import { promises as fs } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { assertXirangManifest, assertXirangProject, parseXirangContractSource, readXirangContract, readXirangContractChange, XirangContractError } from './xirang-contract-handler'

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
    expect(readXirangContract(manifest, { type: 'change', name: 'auth' }, 'core.api'))
      .toEqual({ element: 'core.api', md: '# API (auth)\n' })
  })

  it('rejects the removed query parameter', () => {
    expect(() => readXirangContractChange(new URLSearchParams({ variant: 'formal' })))
      .toThrow(expect.objectContaining({ statusCode: 400, message: 'Unsupported query parameter: variant' }))
    expect(readXirangContractChange(new URLSearchParams({ change: 'auth' }))).toBe('auth')
  })

  it('returns null for an Element without a Contract instead of failing', () => {
    expect(readXirangContract(manifest, { type: 'change', name: 'auth' }, 'core.other')).toBeNull()
    expect(readXirangContract({ semanticModel: {}, changes: {} }, null, 'core.api')).toBeNull()
  })

  it('rejects an unknown Change', () => {
    expect(() => readXirangContract(manifest, { type: 'change', name: 'missing' }, 'core.api'))
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

describe('parseXirangContractSource', () => {
  it('returns null when no source parameter', () => {
    const params = new URLSearchParams()
    expect(parseXirangContractSource(params)).toBe(null)
  })

  it('returns { type: "candidate" } for source=candidate', () => {
    const params = new URLSearchParams({ source: 'candidate' })
    expect(parseXirangContractSource(params)).toEqual({ type: 'candidate' })
  })

  it('returns { type: "candidate-diff" } for source=candidate-diff', () => {
    const params = new URLSearchParams({ source: 'candidate-diff' })
    expect(parseXirangContractSource(params)).toEqual({ type: 'candidate-diff' })
  })

  it('returns { type: "change", name } for source=change:name', () => {
    const params = new URLSearchParams({ source: 'change:auth-refactor' })
    expect(parseXirangContractSource(params)).toEqual({ type: 'change', name: 'auth-refactor' })
  })

  it('throws 400 for invalid source format', () => {
    const params = new URLSearchParams({ source: 'invalid' })
    expect(() => parseXirangContractSource(params)).toThrow(XirangContractError)
    expect(() => parseXirangContractSource(params)).toThrow('Invalid source identity')
  })

  it('throws 400 when both source and change are present', () => {
    const params = new URLSearchParams({ source: 'candidate', change: 'auth' })
    expect(() => parseXirangContractSource(params)).toThrow(XirangContractError)
    expect(() => parseXirangContractSource(params)).toThrow('Cannot specify both source and change')
  })
})

describe('assertXirangManifest', () => {
  it('accepts a version 3 manifest with semanticModel and changes', () => {
    expect(() => assertXirangManifest({ version: 3, semanticModel: {}, changes: {} })).not.toThrow()
  })

  it('rejects a version 2 manifest', () => {
    expect(() => assertXirangManifest({ version: 2, semanticModel: {}, changes: {} }))
      .toThrow(expect.objectContaining({ statusCode: 500, message: 'Invalid active change manifest' }))
  })

  it.each([
    null,
    'v3',
    { version: 3, changes: {} },
    { version: 3, semanticModel: {} },
  ])('rejects malformed manifest %j', payload => {
    expect(() => assertXirangManifest(payload)).toThrow(XirangContractError)
  })
})

describe('readXirangContract with source parameter', () => {
  const manifestWithCandidate = {
    semanticModel: { contracts: { 'elem-1': '# Model contract' } },
    candidate: { contracts: { 'elem-1': '# Candidate contract', 'elem-2': '# New contract' } },
    candidateDiff: { contracts: { 'elem-1': '# Candidate contract', 'elem-2': '# New contract' } },
    changes: { 'auth': { contracts: { 'elem-3': '# Auth contract' } } },
  }

  it('returns model contract when source is null', () => {
    const result = readXirangContract(manifestWithCandidate, null, 'elem-1')
    expect(result).toEqual({ element: 'elem-1', md: '# Model contract' })
  })

  it('returns candidate contract when source is { type: "candidate" }', () => {
    const result = readXirangContract(manifestWithCandidate, { type: 'candidate' }, 'elem-1')
    expect(result).toEqual({ element: 'elem-1', md: '# Candidate contract' })
  })

  it('returns new element contract from candidate', () => {
    const result = readXirangContract(manifestWithCandidate, { type: 'candidate' }, 'elem-2')
    expect(result).toEqual({ element: 'elem-2', md: '# New contract' })
  })

  it('returns candidate-diff contract when source is { type: "candidate-diff" }', () => {
    const result = readXirangContract(manifestWithCandidate, { type: 'candidate-diff' }, 'elem-2')
    expect(result).toEqual({ element: 'elem-2', md: '# New contract' })
  })

  it('returns change contract when source is { type: "change", name }', () => {
    const result = readXirangContract(manifestWithCandidate, { type: 'change', name: 'auth' }, 'elem-3')
    expect(result).toEqual({ element: 'elem-3', md: '# Auth contract' })
  })

  it('throws 404 when candidate source not found', () => {
    const manifestWithoutCandidate = {
      semanticModel: { contracts: {} },
      changes: {},
    }
    expect(() => 
      readXirangContract(manifestWithoutCandidate, { type: 'candidate' }, 'elem-1')
    ).toThrow(XirangContractError)
  })
})
