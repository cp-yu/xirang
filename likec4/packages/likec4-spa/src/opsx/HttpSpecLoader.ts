import type { OpsxSpecContent, OpsxSpecLoader } from '@likec4/diagram'
import {
  opsxSpecChangedEvent,
  type OpsxSpecChangedEvent,
} from '@likec4/vite-plugin/protocol'

export interface OpsxHotChannel {
  on(event: typeof opsxSpecChangedEvent, listener: (payload: OpsxSpecChangedEvent) => void): void
  off(event: typeof opsxSpecChangedEvent, listener: (payload: OpsxSpecChangedEvent) => void): void
}

export class HttpSpecLoader implements OpsxSpecLoader {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly hot?: OpsxHotChannel,
  ) {}

  async load(element: string, path: string, signal: AbortSignal): Promise<OpsxSpecContent> {
    const query = new URLSearchParams({ element, path })
    const response = await this.fetcher(`/__opsx/spec?${query}`, { signal })
    const payload = await response.json() as OpsxSpecContent | { error?: string }
    if (!response.ok) {
      throw new Error('error' in payload && payload.error ? payload.error : `Unable to load Spec (${response.status})`)
    }
    if (!('path' in payload) || !('md' in payload)) {
      throw new Error('Invalid Spec response')
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
}
