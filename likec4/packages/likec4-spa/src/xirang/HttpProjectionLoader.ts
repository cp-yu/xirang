import type { ProjectionRequestDescriptor, SemanticBrowserProjectionLoader } from './SemanticBrowserController'

export interface XirangProjectionResponse<T = unknown> {
  projectionKey: string
  view: T
  diagnostics: string[]
}

export class XirangProjectionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly diagnostic?: unknown,
  ) {
    super(message)
  }
}

export class HttpProjectionLoader<T = unknown> implements SemanticBrowserProjectionLoader<XirangProjectionResponse<T>> {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async load(request: ProjectionRequestDescriptor, signal: AbortSignal): Promise<XirangProjectionResponse<T>> {
    const response = await this.fetcher.call(globalThis, '/__xirang/projection', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const payload = await response.json() as unknown
    if (!response.ok) {
      const diagnostic = payload && typeof payload === 'object' ? payload : undefined
      const message = diagnostic && 'message' in diagnostic && typeof diagnostic.message === 'string'
        ? diagnostic.message
        : diagnostic && 'error' in diagnostic && typeof diagnostic.error === 'string'
        ? diagnostic.error
        : `Unable to load projection (${response.status})`
      throw new XirangProjectionError(message, response.status, diagnostic)
    }
    if (!payload || typeof payload !== 'object'
      || typeof (payload as { projectionKey?: unknown }).projectionKey !== 'string'
      || !('view' in payload)
      || !Array.isArray((payload as { diagnostics?: unknown }).diagnostics)) {
      throw new XirangProjectionError('Invalid projection response', response.status)
    }
    return payload as XirangProjectionResponse<T>
  }
}
