import { type AdhocViewPredicate, computeAdhocView } from '@likec4/core/compute-view'
import type { LayoutedView } from '@likec4/core/types'
import type { LayoutTaskParams } from '@likec4/layouts'

/** The subset of a LikeC4 instance that Xirang projections lay out through. */
export interface XirangLayoutSource {
  computedModel?(projectId?: string): Promise<Parameters<typeof computeAdhocView>[0]>
  viewsService?: {
    adhocView(predicates: AdhocViewPredicate[], projectId?: string): Promise<LayoutedView>
    layouter?: {
      layout(task: LayoutTaskParams): Promise<{ diagram: LayoutedView }>
    }
  }
}

/**
 * Passes sibling wrapping to the layouter for Full Model and Change-derived projections.
 * Authored projections keep the standard adhoc layout path.
 *
 * Mirrors `LikeC4Views.adhocView`, which cannot pass layout options.
 * Sources without direct access to the model and the layouter use `adhocView`, i.e. plain layout.
 */
export async function layoutProjectionView(
  likec4: XirangLayoutSource,
  predicates: AdhocViewPredicate[],
  projectId: string | undefined,
  wrapSiblings: boolean,
): Promise<LayoutedView> {
  const layouter = likec4.viewsService?.layouter
  if (!wrapSiblings || !likec4.computedModel || !layouter) {
    return await likec4.viewsService!.adhocView(predicates, projectId)
  }
  const model = await likec4.computedModel(projectId)
  const view = computeAdhocView(model, predicates)
  const { diagram } = await layouter.layout({
    view: { ...view, hash: '', _type: 'element' },
    styles: model.$styles,
    wrapSiblings,
  })
  return diagram
}
