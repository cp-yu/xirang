import type { ViewTreeField } from '@likec4/generators'
import { z } from 'zod'

export type TreeFormat = 'text' | 'markdown' | 'json'

/** The view node fields a tree line can carry. */
export type TreeFormatFields = ViewTreeField

export const DEFAULT_TREE_FORMAT = 'text' as const
export const DEFAULT_TREE_FIELDS: TreeFormatFields[] = ['title']

/** Search contract shared by both tree-export routes and the page. */
export const treeSearchSchema = z.object({
  format: z.enum(['text', 'markdown', 'json']).optional().catch('text'),
  fields: z.array(z.enum(['title', 'fqn', 'kind'])).optional().catch(['title']),
})

export const treeSearchDefaults = {
  format: DEFAULT_TREE_FORMAT,
  fields: DEFAULT_TREE_FIELDS,
} as const
