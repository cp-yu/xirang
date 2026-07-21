import { describe, expect, it } from 'vitest'
import { rpcModule } from './rpc'

describe('rpc virtual module', () => {
  it('exposes the runtime Vite hot channel for OPSX Spec events', async () => {
    const result = await rpcModule.load.call({} as never, {
      rpcEnabled: true,
      isAIAvailable: false,
      ai: undefined,
      assetsDir: '/tmp/assets',
    } as never)
    const code = typeof result === 'string' ? result : result?.code

    expect(code).toContain('export const likec4hot = import.meta.hot')
    expect(code).toContain('import.meta.hot.on(event, listener)')
    expect(code).toContain('import.meta.hot.off(event, listener)')
  })
})
