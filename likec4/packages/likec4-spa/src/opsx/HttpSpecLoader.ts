import type { OpsxRuntimeManifest, OpsxSpecContent, OpsxSpecLoader } from '@likec4/diagram'
import {
  opsxChangeManifestChangedEvent,
  opsxSpecChangedEvent,
  type OpsxSpecChangedEvent,
} from '@likec4/vite-plugin/protocol'

export interface OpsxHotChannel {
  on(event: string, listener: (payload: any) => void): void
  off(event: string, listener: (payload: any) => void): void
}

export class HttpSpecLoader implements OpsxSpecLoader {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly hot?: OpsxHotChannel,
  ) {}

  async list(project: string, element: string, signal: AbortSignal, variant = 'formal'): Promise<readonly string[]> {
    const query = new URLSearchParams({ project, element, variant })
    const response = await this.fetcher.call(globalThis, `/__opsx/specs?${query}`, { signal })
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

  async load(project: string, element: string, path: string, signal: AbortSignal, variant = 'formal'): Promise<OpsxSpecContent> {
    const query = new URLSearchParams({ project, element, path, variant })
    const response = await this.fetcher.call(globalThis, `/__opsx/spec?${query}`, { signal })
    const payload = await response.json() as OpsxSpecContent | { error?: string }
    if (!response.ok) {
      throw new Error('error' in payload && payload.error ? payload.error : `Unable to load Spec (${response.status})`)
    }
    if (!('path' in payload) || !('md' in payload)) {
      throw new Error('Invalid Spec response')
    }
    return payload
  }

  async variants(signal: AbortSignal): Promise<OpsxRuntimeManifest> {
    const response = await this.fetcher.call(globalThis, '/__opsx/changes', { signal })
    const payload = await response.json() as OpsxRuntimeManifest | { error?: string }
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
    const onChange = (event: OpsxSpecChangedEvent) => listener(event.path)
    this.hot.on(opsxSpecChangedEvent, onChange)
    return () => this.hot?.off(opsxSpecChangedEvent, onChange)
  }

  subscribeVariants(listener: () => void): () => void {
    if (!this.hot) return () => undefined
    this.hot.on(opsxChangeManifestChangedEvent, listener)
    return () => this.hot?.off(opsxChangeManifestChangedEvent, listener)
  }
}
