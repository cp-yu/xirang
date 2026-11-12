import { Graphviz } from '@hpcc-js/wasm-graphviz'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DotSource } from '../types'
import { GraphvizWasmAdapter } from './GraphvizWasmAdapter'

afterEach(() => vi.restoreAllMocks())

function mockGraphviz(layout: (dot: string, stderr: typeof console.error) => string) {
  let cached: Graphviz | null = null
  vi.spyOn(Graphviz, 'load').mockImplementation(async () => {
    if (!cached) {
      // Emscripten captures the receiver when the module is first instantiated.
      const stderr = console.error
      cached = {
        unflatten: (dot: string) => dot,
        layout: (dot: string) => layout(dot, stderr),
      } as unknown as Graphviz
    }
    return cached
  })
  vi.spyOn(Graphviz, 'unload').mockImplementation(() => {
    cached = null
  })
}

describe('GraphvizWasmAdapter diagnostics', () => {
  it('captures stderr after unflatten loads the module, scoped to each serialized call', async () => {
    const original = console.error
    mockGraphviz((dot, stderr) => {
      if (dot === 'warn') stderr('lib/pathplan: triangulation failed')
      return '{}'
    })
    const adapter = new GraphvizWasmAdapter()
    await adapter.unflatten('digraph {}' as DotSource)
    const first = vi.fn()
    const second = vi.fn()
    await Promise.all([
      adapter.layoutJson('warn' as DotSource, { onWarning: first }),
      adapter.layoutJson('quiet' as DotSource, { onWarning: second }),
    ])
    expect(first).toHaveBeenCalledExactlyOnceWith('lib/pathplan: triangulation failed')
    expect(second).not.toHaveBeenCalled()
    expect(console.error).toBe(original)
  })

  it('reports a recovered error so the wrapped result can still be discarded', async () => {
    let calls = 0
    mockGraphviz(() => {
      if (++calls === 1) throw new Error('routing failed')
      return '{}'
    })
    const onError = vi.fn()
    const adapter = new GraphvizWasmAdapter()
    expect(await adapter.layoutJson('digraph {}' as DotSource, { onError })).toBe('{}')
    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ message: 'routing failed' }))
    expect(calls).toBe(2)
  })
})
