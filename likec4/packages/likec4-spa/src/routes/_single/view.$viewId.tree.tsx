import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { treeSearchDefaults, treeSearchSchema } from '../../lib/tree-route-search'
import { ViewAsTree } from '../../pages/ViewAsTree'

export const Route = createFileRoute('/_single/view/$viewId/tree')({
  validateSearch: treeSearchSchema,
  search: {
    middlewares: [
      stripSearchParams(treeSearchDefaults),
    ],
  },
  component: ViewAsTree,
})
