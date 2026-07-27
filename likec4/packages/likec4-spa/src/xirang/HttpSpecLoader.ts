import type { XirangContractContent, XirangRuntimeManifest, XirangSpecLoader } from '@likec4/diagram'
import { xirangChangeManifestChangedEvent } from '@likec4/vite-plugin/protocol'

export interface XirangHotChannel {
  on(event: string, listener: (payload: any) => void): void
  off(event: string, listener: (payload: any) => void): void
}

export class HttpSpecLoader implements XirangSpecLoader {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly hot?: XirangHotChannel,
  ) {}

  /** 404 is the "no Contract" answer, not a failure: one Element carries at most one Contract. */
  async load(project: string, element: string, signal: AbortSignal, variant = 'formal'): Promise<XirangContractContent | null> {
    const query = new URLSearchParams({ project, element, variant })
    const response = await this.fetcher.call(globalThis, `/__xirang/spec?${query}`, { signal })
    const payload = await response.json() as XirangContractContent | { error?: string }
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('error' in payload && payload.error ? payload.error : `Unable to load Contract (${response.status})`)
    }
    if (!('element' in payload) || !('md' in payload)) {
      throw new Error('Invalid Contract response')
    }
    return payload
  }

  async variants(signal: AbortSignal): Promise<XirangRuntimeManifest> {
    const response = await this.fetcher.call(globalThis, '/__xirang/changes', { signal })
    const payload = await response.json() as XirangRuntimeManifest | { error?: string }
    if (!response.ok) {
      throw new Error('error' in payload && payload.error ? payload.error : `Unable to load active changes (${response.status})`)
    }
    if (!('version' in payload) || payload.version !== 1 || !Array.isArray(payload.variants)) {
      throw new Error('Invalid active change response')
    }
    return payload
  }

  subscribeVariants(listener: () => void): () => void {
    if (!this.hot) return () => undefined
    this.hot.on(xirangChangeManifestChangedEvent, listener)
    return () => this.hot?.off(xirangChangeManifestChangedEvent, listener)
  }
}
