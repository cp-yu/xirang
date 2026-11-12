import { Graphviz } from '@hpcc-js/wasm-graphviz'
import { delay } from '@likec4/core/utils'
import { loggable, rootLogger } from '@likec4/log'
import pLimit from 'p-limit'
import { randomString } from 'remeda'
import type { GraphvizPort, LayoutJsonOptions } from '../GraphvizLayoter'
import type { DotSource } from '../types'

// limit to 1 concurrency to avoid wasm loading issues
const limit = pLimit(1)

/**
 * Receiver of the wasm stderr (pathplan failures are reported there only) for the running call.
 * Safe as a singleton, because calls are serialized by {@link limit}.
 */
let stderrReceiver: ((message: string) => void) | null = null

/**
 * The wasm module binds `console.error` when it is instantiated, so it can only be intercepted at load time.
 */
async function loadGraphviz(): Promise<Graphviz> {
  const original = console.error
  console.error = (...args: unknown[]) => {
    if (stderrReceiver) {
      stderrReceiver(args.join(' '))
    } else {
      original(...args)
    }
  }
  try {
    return await Graphviz.load()
  } finally {
    console.error = original
  }
}

export class GraphvizWasmAdapter implements GraphvizPort {
  /**
   * Workaround for graphviz wasm memory issues
   * After each N operations unload the wasm and reload it
   */
  private static opsCount = 0

  get name() {
    return 'wasm'
  }

  get concurrency() {
    return 1
  }

  dispose(): void {
    Graphviz.unload()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private async attempt<T>(
    logMessage: string,
    dot: string,
    fn: () => Promise<T>,
    onError?: (error: unknown) => void,
  ): Promise<T> {
    return await limit(async () => {
      const logger = rootLogger.getChild(['layouter', 'wasm', logMessage, '_', randomString(4).toLowerCase()])
      try {
        logger.trace`execute`
        const result = await fn()
        if (++GraphvizWasmAdapter.opsCount >= 20) {
          GraphvizWasmAdapter.opsCount = 0
          // very hacky, but helps
          logger.trace`reached 20 operations, unloading wasm`
          Graphviz.unload()
        }
        return result
      } catch (error) {
        onError?.(error)
        logger.trace('FAILED DOT\n' + dot)
        const errorStr = loggable(error)

        // don't retry on syntax errors
        if (errorStr.includes('syntax error')) {
          throw error
        }
        logger.warn(errorStr)

        GraphvizWasmAdapter.opsCount = 0
        Graphviz.unload()
      }
      logger.warn('Retrying...')
      await delay(30, 300)
      return await fn()
    })
  }

  async unflatten(dot: DotSource): Promise<DotSource> {
    return await this.attempt(`unflatten`, dot, async () => {
      const graphviz = await loadGraphviz()
      const unflattened = graphviz.unflatten(dot, 1, false, 3)
      return unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ') as DotSource
    })
  }

  async acyclic(dot: DotSource): Promise<DotSource> {
    return await this.attempt(`acyclic`, dot, async () => {
      const graphviz = await loadGraphviz()
      const res = graphviz.acyclic(dot, true)
      return res.acyclic ? (res.outFile as DotSource || dot) : dot
    })
  }

  async layoutJson(dot: DotSource, options?: LayoutJsonOptions): Promise<string> {
    return await this.attempt(`layout`, dot, async () => {
      const graphviz = await loadGraphviz()
      const onWarning = options?.onWarning
      stderrReceiver = onWarning ?? null
      try {
        return graphviz.layout(dot, 'json', undefined, {
          yInvert: true,
        })
      } finally {
        stderrReceiver = null
      }
    }, options?.onError)
  }

  async svg(dot: DotSource): Promise<string> {
    return await this.attempt(`svg`, dot, async () => {
      const graphviz = await loadGraphviz()
      return graphviz.layout(dot, 'svg')
    })
  }
}
