import { EventEmitter } from 'node:events'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assertXirangProject,
  createXirangSpecWatcher,
  readXirangSpec,
  readXirangSpecRegistry,
  type XirangSpecIndex,
} from './xirang-spec-handler'

describe('OPSX Spec handler', () => {
  let projectRoot: string
  let indexed: Map<string, readonly string[]>
  let index: XirangSpecIndex

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-spec-handler-'))
    indexed = new Map([
      ['core.api', ['.xirang/specs/api/spec.md', '.xirang/specs/shared/spec.md']],
      ['core.other', ['.xirang/specs/other/spec.md']],
    ])
    index = {
      getIndexedSpecs: async element => indexed.get(element),
    }
    await fs.mkdir(path.join(projectRoot, '.xirang/specs/api'), { recursive: true })
    await fs.mkdir(path.join(projectRoot, '.xirang/specs/shared'), { recursive: true })
    await fs.mkdir(path.join(projectRoot, '.xirang/specs/other'), { recursive: true })
    await fs.writeFile(path.join(projectRoot, '.xirang/specs/api/spec.md'), '# API\n')
    await fs.writeFile(path.join(projectRoot, '.xirang/specs/shared/spec.md'), '# Shared\n')
    await fs.writeFile(path.join(projectRoot, '.xirang/specs/other/spec.md'), '# Other\n')
  })

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true })
  })

  it('reads a root-owned registry snapshot without consulting model metadata', async () => {
    const registryFile = path.join(projectRoot, 'xirang-spec-registry.json')
    await fs.writeFile(registryFile, JSON.stringify({
      version: 1,
      elements: {
        'payment.authorize': ['.xirang/specs/shared/spec.md', '.xirang/specs/api/spec.md'],
      },
    }))

    await expect(readXirangSpecRegistry(registryFile)).resolves.toEqual(new Map([
      ['payment.authorize', ['.xirang/specs/api/spec.md', '.xirang/specs/shared/spec.md']],
    ]))
  })

  it('rejects content access for an unknown model project', () => {
    expect(() => assertXirangProject('missing', [{ id: 'default' }]))
      .toThrow(expect.objectContaining({ statusCode: 404, message: 'Project not found' }))
    expect(() => assertXirangProject('default', [{ id: 'default' }])).not.toThrow()
  })

  it('reads only Markdown indexed by the requested element', async () => {
    await expect(readXirangSpec({
      projectRoot,
      element: 'core.api',
      specPath: '.xirang/specs/api/spec.md',
      index,
    })).resolves.toEqual({
      path: '.xirang/specs/api/spec.md',
      md: '# API\n',
    })

    await expect(readXirangSpec({
      projectRoot,
      element: 'core.api',
      specPath: '.xirang/specs/other/spec.md',
      index,
    })).rejects.toMatchObject({ statusCode: 403 })
  })

  it.each([
    '/tmp/spec.md',
    'C:\\tmp\\spec.md',
    '.xirang/specs/../secret.md',
    '.xirang/specs/./api/spec.md',
    '.xirang/specs/api/spec.txt',
    'specs/api/spec.md',
  ])('rejects unsafe path %s', async specPath => {
    indexed.set('core.api', [specPath])

    await expect(readXirangSpec({
      projectRoot,
      element: 'core.api',
      specPath,
      index,
    })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects unknown elements and missing files without exposing server paths', async () => {
    await expect(readXirangSpec({
      projectRoot,
      element: 'missing',
      specPath: '.xirang/specs/api/spec.md',
      index,
    })).rejects.toMatchObject({ statusCode: 404, message: 'Element not found' })

    indexed.set('core.api', ['.xirang/specs/missing/spec.md'])
    let error: unknown
    try {
      await readXirangSpec({
        projectRoot,
        element: 'core.api',
        specPath: '.xirang/specs/missing/spec.md',
        index,
      })
    } catch (cause) {
      error = cause
    }
    expect(error).toMatchObject({ statusCode: 404, message: 'Spec not found' })
    expect((error as Error).message).not.toContain(projectRoot)
  })

  it('rejects symlinks that escape the Specs root', async () => {
    const outside = path.join(projectRoot, 'outside.md')
    const link = path.join(projectRoot, '.xirang/specs/api/escape.md')
    await fs.writeFile(outside, '# Outside\n')
    await fs.symlink(outside, link)
    indexed.set('core.api', ['.xirang/specs/api/escape.md'])

    await expect(readXirangSpec({
      projectRoot,
      element: 'core.api',
      specPath: '.xirang/specs/api/escape.md',
      index,
    })).rejects.toMatchObject({ statusCode: 403 })
  })

  it('emits precise project-relative paths for Spec changes only', async () => {
    const emitter = new EventEmitter()
    const add = vi.fn<(path: string) => void>()
    const watcher = {
      add,
      on: (event: 'change', listener: (path: string) => void) => emitter.on(event, listener),
      off: (event: 'change', listener: (path: string) => void) => emitter.off(event, listener),
    }
    const notify = vi.fn()
    const dispose = createXirangSpecWatcher({ projectRoot, watcher, notify })
    const specFile = path.join(projectRoot, '.xirang/specs/api/spec.md')

    emitter.emit('change', specFile)
    emitter.emit('change', path.join(projectRoot, '.xirang/specs/api/spec.txt'))
    emitter.emit('change', path.join(projectRoot, 'README.md'))

    expect(add).toHaveBeenCalledWith(path.join(projectRoot, '.xirang/specs'))
    expect(notify).toHaveBeenCalledOnce()
    expect(notify).toHaveBeenCalledWith({ path: '.xirang/specs/api/spec.md' })

    dispose()
    emitter.emit('change', specFile)
    expect(notify).toHaveBeenCalledOnce()
  })
})
