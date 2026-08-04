import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod'
import { ViewAsTree } from '../../pages/ViewAsTree'

export const Route = createFileRoute('/project/$projectId/view/$viewId/tree')({
  validateSearch: z.object({
    format: z.enum(['text', 'markdown', 'json']).optional().catch('text'),
    fields: z.array(z.enum(['title', 'fqn', 'kind'])).optional().catch(['title']),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        format: 'text',
        fields: ['title'],
      }),
    ],
  },
  component: ViewAsTree,
})
