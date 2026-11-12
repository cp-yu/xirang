import spawn, { SubprocessError } from 'nano-spawn'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DotSource } from '../types'
import { GraphvizBinaryAdapter } from './GraphvizBinaryAdapter'

vi.mock('nano-spawn', async importOriginal => ({
  ...await importOriginal<typeof import('nano-spawn')>(),
  default: vi.fn(),
}))
afterEach(() => vi.resetAllMocks())

describe('GraphvizBinaryAdapter diagnostics', () => {
  it('reports stderr from successful output', async () => {
    vi.mocked(spawn).mockResolvedValue({
      stdout: '{}',
      stderr: 'pathplan: triangulation failed',
      command: 'dot',
    } as Awaited<ReturnType<typeof spawn>>)
    const onWarning = vi.fn()
    const adapter = new GraphvizBinaryAdapter('dot')
    expect(await adapter.layoutJson('digraph {}' as DotSource, { onWarning })).toBe('{}')
    expect(onWarning).toHaveBeenCalledExactlyOnceWith('pathplan: triangulation failed')
  })

  it('reports a nonzero exit even when Graphviz returns usable JSON', async () => {
    const error = Object.assign(Object.create(SubprocessError.prototype), {
      stdout: '{}',
      stderr: 'routing failed',
      exitCode: 1,
      command: 'dot',
      message: 'dot failed',
    })
    vi.mocked(spawn).mockRejectedValue(error)
    const onError = vi.fn()
    const onWarning = vi.fn()
    const adapter = new GraphvizBinaryAdapter('dot')
    expect(await adapter.layoutJson('digraph {}' as DotSource, { onError, onWarning })).toBe('{}')
    expect(onError).toHaveBeenCalledExactlyOnceWith(error)
    expect(onWarning).toHaveBeenCalledExactlyOnceWith('routing failed')
  })
})
