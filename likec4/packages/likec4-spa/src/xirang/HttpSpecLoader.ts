import type { XirangRuntimeManifest, XirangSpecContent, XirangSpecLoader } from '@likec4/diagram'
import {
  xirangChangeManifestChangedEvent,
  xirangSpecChangedEvent,
  type XirangSpecChangedEvent,
} from '@likec4/vite-plugin/protocol'

export interface XirangHotChannel {
  on(event: string, listener: (payload: any) => void): void
  off(event: string, listener: (payload: any) => void): void
}

export class HttpSpecLoader implements XirangSpecLoader {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly hot?: XirangHotChannel,
  ) {}

  async list(project: string, element: string, signal: AbortSignal, variant = 'formal'): Promise<readonly string[]> {
    const query = new URLSearchParams({ project, element, variant })
    const response = await this.fetcher.call(globalThis, `/__xirang/specs?${query}`, { signal })
    const payload = await response.json() as { specs?: unknown; error?: string }
    if (!response.ok) {
      if (response.status === 404) return []
      throw new Error(payload.error ?? `Unable to load Spec registry (${response.status})`)
    }
    if (!Array.isArray(payload.specs) || !payload.specs.every(spec => typeof spec === 'string')) {
      throw new Error('Invalid Spec registry response')
    }
    return [...new Set(payload.specs)].sort()
  }

  async load(project: string, element: string, path: string, signal: AbortSignal, variant = 'formal'): Promise<XirangSpecContent> {
    const query = new URLSearchParams({ project, element, path, variant })
    const response = await this.fetcher.call(globalThis, `/__xirang/spec?${query}`, { signal })
    const payload = await response.json() as XirangSpecContent | { error?: string }
    if (!response.ok) {
      throw new Error('error' in payload && payload.error ? payload.error : `Unable to load Spec (${response.status})`)
    }
    if (!('path' in payload) || !('md' in payload)) {
      throw new Error('Invalid Spec response')
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

  subscribe(listener: (path: string) => void): () => void {
    if (!this.hot) {
      return () => undefined
    }
    const onChange = (event: XirangSpecChangedEvent) => listener(event.path)
    this.hot.on(xirangSpecChangedEvent, onChange)
    return () => this.hot?.off(xirangSpecChangedEvent, onChange)
  }

  subscribeVariants(listener: () => void): () => void {
    if (!this.hot) return () => undefined
    this.hot.on(xirangChangeManifestChangedEvent, listener)
    return () => this.hot?.off(xirangChangeManifestChangedEvent, listener)
  }
}
