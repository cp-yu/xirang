import type { Fqn } from '@likec4/core/types'
import { z } from 'zod'

export const searchParamsSchema = z.object({
  theme: z.literal(['light', 'dark', 'auto'])
    .optional()
    .catch(undefined),
  dynamic: z.enum(['diagram', 'sequence'])
    .default('diagram')
    .catch('diagram'),
  padding: z.number()
    .min(0)
    .default(20)
    .catch(20),
  relationships: z.string()
    .nonempty()
    .optional()
    .catch(undefined)
    .transform(v => v as Fqn | undefined),
  focusOnElement: z.string()
    .nonempty()
    .optional()
    .catch(undefined)
    .transform(v => v as Fqn | undefined),
  /** Xirang navigation state — source is the selected Model/Candidate/Change source. */
  source: z.string()
    .nonempty()
    .default('model')
    .catch('model'),
  /** Xirang focus Element identity; absent means the Project Root. */
  focus: z.string()
    .nonempty()
    .optional()
    .catch(undefined),
  /** Xirang diff display mode; candidate-diff is fixed to diff, candidate to full. */
  mode: z.enum(['full', 'diff'])
    .default('full')
    .catch('full'),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

/**
 * Derives the Mantine `forceColorScheme` value from the parsed `?theme=` param.
 *
 * - `'light'` / `'dark'` → force that scheme (overrides localStorage, read-only)
 * - `'auto'` or `undefined` → no force (Mantine uses localStorage / system preference)
 */
export function resolveForceColorScheme(
  theme: SearchParams['theme'],
): 'light' | 'dark' | undefined {
  switch (theme) {
    case 'light':
    case 'dark':
      return theme
    default:
      return undefined
  }
}
