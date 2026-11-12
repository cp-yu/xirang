import {
  type AnyAux,
  type aux,
  type ComputedView,
  type DiagramView,
  type LayoutedDynamicView,
  isDeploymentView,
  isDynamicView,
  isElementView,
  LikeC4Styles,
} from '@likec4/core'
import type { ComputedProjectsView, LayoutedProjectsView } from '@likec4/core/compute-view'
import { nonexhaustive } from '@likec4/core/utils'
import { loggable, rootLogger as mainLogger, wrapError } from '@likec4/log'
import { randomString } from 'remeda'
import { calcSequenceLayout } from '../sequence'
import type { AILayoutHints } from './ai/types'
import { AiLayoutViewPrinter } from './AiLayoutPrinter'
import { DeploymentViewPrinter } from './DeploymentViewPrinter'
import { GraphClusterSpace } from './DotPrinter'
import { DynamicViewPrinter } from './DynamicViewPrinter'
import { ElementViewPrinter } from './ElementViewPrinter'
import { parseGraphvizJson, parseGraphvizJsonOfProjectsView } from './GraphvizParser'
import { ProjectsViewPrinter } from './ProjectsViewPrinter'
import type { DotSource } from './types'
import type { GraphvizJson } from './types-dot'
import { GraphvizWasmAdapter } from './wasm/GraphvizWasmAdapter'
import { findWrappedLayoutDisadvantage, findWrappedLayoutProblem } from './wrap-fallback'

export type LayoutJsonOptions = {
  /**
   * Receives the stderr output Graphviz produced during this call
   */
  onWarning?: ((message: string) => void) | undefined
  /** Includes failures recovered by an adapter retry or partial output. */
  onError?: ((error: unknown) => void) | undefined
}

export interface GraphvizPort extends Disposable {
  get name(): string
  get concurrency(): number
  unflatten(dot: DotSource): Promise<DotSource>
  acyclic(dot: DotSource): Promise<DotSource>
  layoutJson(dot: DotSource, options?: LayoutJsonOptions): Promise<string>
  svg(dot: DotSource): Promise<string>
  dispose(): void
}

const getPrinter = <A extends AnyAux>({ view, styles, wrapSiblings }: LayoutTaskParams<A>) => {
  switch (true) {
    case isDynamicView(view):
      return new DynamicViewPrinter(view, styles)
    case isDeploymentView(view):
      return new DeploymentViewPrinter(view, styles)
    case isElementView(view):
      return new ElementViewPrinter(view, styles, { wrapSiblings })
    default:
      nonexhaustive(view)
  }
}

export type LayoutTaskParams<A extends aux.Any = aux.Any> = {
  view: ComputedView<A>
  styles: LikeC4Styles
  /**
   * Wrap sibling units of element views into rows (see {@link ElementViewPrinter}).
   * Keeps wrapping only when safe, with at least 5% better fit in a 1600x1000 viewport
   * and at most 1.5 times the total edge length of the plain layout.
   * Ignored for dynamic and deployment views.
   * @default false
   */
  wrapSiblings?: boolean | undefined
}

export type LayoutResult<A extends aux.Any = aux.Any> = {
  dot: DotSource
  diagram: DiagramView<A>
}

const rootLogger = mainLogger.getChild('layouter')

function normalizeDot(dot: DotSource): DotSource {
  return dot
    .split('\n')
    .filter((l) => !(l.includes('margin') && l.includes(`${GraphClusterSpace}`))) // see DotPrinter.ts#L175
    .join('\n') as DotSource
}

export class GraphvizLayouter implements Disposable {
  private graphviz: GraphvizPort

  constructor(graphviz?: GraphvizPort) {
    this.graphviz = graphviz ?? new GraphvizWasmAdapter()
    rootLogger.trace`created with port ${this.graphviz.name}`
  }

  dispose(): void {
    this.graphviz.dispose()
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  get graphvizPort(): GraphvizPort {
    return this.graphviz
  }

  changePort(graphviz: GraphvizPort) {
    this.graphviz.dispose()
    this.graphviz = graphviz
    rootLogger.trace`change port to ${this.graphviz.name}`
  }

  /**
   * Generates DOT source for the given view and styles.
   * If `hints` are provided, they will be used to influence the layout (e.g. by specifying node/edge order).
   * This method does not perform unflattening or any other post-processing on the DOT output, so it may be used for debugging or to generate DOT for external processing.
   */
  printToDot(params: LayoutTaskParams, hints?: AILayoutHints): DotSource {
    const printer = hints ? new AiLayoutViewPrinter(params.view, params.styles, hints) : getPrinter(params)
    return normalizeDot(printer.print())
  }

  protected newScopedLogger(operation: string) {
    return rootLogger.getChild([operation, '_', randomString(4).toLowerCase()])
  }

  async dotToJson(dot: DotSource, options?: LayoutJsonOptions): Promise<GraphvizJson> {
    const logger = this.newScopedLogger('dotToJson')
    let json
    try {
      json = await this.graphviz.layoutJson(dot, options)
    } catch (error) {
      logger.error(loggable(error))
      logger.error('Failed to convert DOT to JSON:\n' + dot)
      throw error
    }
    try {
      return JSON.parse(json) as GraphvizJson
    } catch (error) {
      logger.error(loggable(error))
      logger.error`Failed to parse JSON:\n${json}\n. Generated from DOT:\n${dot}`
      throw error
    }
  }

  async layout<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<LayoutResult<A>> {
    const logger = this.newScopedLogger('layout')
    try {
      if (params.wrapSiblings && isElementView(params.view)) {
        const wrapped = await this.layoutWrapped(params, logger)
        const plain = await this.layoutOnce({ ...params, wrapSiblings: false }, logger)
        if (wrapped) {
          const disadvantage = findWrappedLayoutDisadvantage(wrapped.diagram, plain.diagram)
          if (disadvantage === null) {
            return wrapped
          }
          logger.debug(`Wrapped layout of view ${params.view.id} is discarded: ${disadvantage}`)
        }
        return plain
      }
      return await this.layoutOnce(params, logger)
    } catch (e) {
      logger.warn(loggable(e))
      throw wrapError(e, `Error during layout: ${params.view.id}`)
    }
  }

  private async layoutOnce<A extends AnyAux>(
    params: LayoutTaskParams<A>,
    logger: ReturnType<GraphvizLayouter['newScopedLogger']>,
    options?: LayoutJsonOptions,
  ): Promise<LayoutResult<A>> {
    logger.trace`layouting view ${params.view.id}...`
    let dot = await this.dot(params)
    const { view } = params
    const json = await this.dotToJson(dot, options)
    let diagram = parseGraphvizJson(json, view)

    if (isDynamicView(diagram)) {
      Object.assign(
        diagram,
        {
          sequenceLayout: calcSequenceLayout(diagram),
        } satisfies Partial<LayoutedDynamicView<A>>,
      )
    }

    logger.trace`layouting view ${params.view.id} done`
    return { dot, diagram }
  }

  /**
   * @returns `null` if the wrapped layout is discarded
   */
  private async layoutWrapped<A extends AnyAux>(
    params: LayoutTaskParams<A>,
    logger: ReturnType<GraphvizLayouter['newScopedLogger']>,
  ): Promise<LayoutResult<A> | null> {
    const warnings = [] as string[]
    const errors = [] as unknown[]
    let problem: string | null
    try {
      const result = await this.layoutOnce(params, logger, {
        onWarning: message => warnings.push(message),
        onError: error => errors.push(error),
      })
      problem = errors.length > 0
        ? `Graphviz failed: ${loggable(errors[0])}`
        : findWrappedLayoutProblem(params.view, result.diagram, warnings)
      if (problem === null) {
        return result
      }
    } catch (error) {
      problem = `Graphviz failed: ${loggable(error)}`
    }
    logger.warn(`Wrapped layout of view ${params.view.id} is discarded, falling back to plain layout: ${problem}`)
    return null
  }

  async aiLayout<A extends AnyAux>(
    { view, styles }: LayoutTaskParams<A>,
    hints: AILayoutHints,
  ): Promise<LayoutResult<A>> {
    const logger = this.newScopedLogger('ai-layout')
    try {
      logger.trace`layouting view ${view.id} using AI hints...`
      const printer = new AiLayoutViewPrinter(view, styles, hints)
      let dot = printer.print()
      const json = await this.dotToJson(dot)
      let diagram = parseGraphvizJson(json, view)
      if (isDynamicView(diagram)) {
        Object.assign(
          diagram,
          {
            sequenceLayout: calcSequenceLayout(diagram),
          } satisfies Partial<LayoutedDynamicView<A>>,
        )
      }
      dot = normalizeDot(dot)
      logger.trace`layouting view ${view.id} done`
      return { dot, diagram }
    } catch (e) {
      logger.warn(loggable(e))
      throw wrapError(e, `Error during AI layout: ${view.id}`)
    }
  }

  async svg<A extends AnyAux>(params: LayoutTaskParams<A>) {
    let dot = await this.dot(params)
    const svg = await this.graphviz.svg(dot)
    return {
      svg,
      dot,
    }
  }

  async dot<A extends AnyAux>(params: LayoutTaskParams<A>): Promise<DotSource> {
    const logger = this.newScopedLogger('dot')
    logger.trace`generating dot for view ${params.view.id}`
    const printer = getPrinter(params)
    let dot = printer.print()
    if (isElementView(params.view) && !printer.hasEdgesWithCompounds) {
      // unflatten chains disconnected nodes with invisible edges, which breaks
      // compound routing (lhead/ltail); such views must go straight to Graphviz
      try {
        logger.trace`unflattening dot`
        dot = await this.graphviz.unflatten(dot)
      } catch (error) {
        logger.warn(`Error during unflatten: ${params.view.id}`, { error })
      }
    }
    return normalizeDot(dot)
  }

  async layoutProjectsView(view: ComputedProjectsView): Promise<LayoutedProjectsView> {
    const logger = this.newScopedLogger('layoutProjectsView')
    logger.debug`layouting projects overview...`
    const printer = new ProjectsViewPrinter(view)
    let dot = printer.print()
    try {
      dot = await this.graphviz.unflatten(dot)
    } catch (error) {
      logger.warn(`Error during unflatten of projects view`, { error })
    }
    const json = await this.dotToJson(dot)
    logger.debug`layouting ${'projects overview'}`
    return parseGraphvizJsonOfProjectsView(json, view)
  }
}
