import { describe, expect, it } from 'vitest'
import { resolveForceColorScheme, searchParamsSchema } from './searchParams'

describe('resolveForceColorScheme', () => {
  it('should force light/dark and pass through auto/undefined', () => {
    expect(resolveForceColorScheme('light')).toBe('light')
    expect(resolveForceColorScheme('dark')).toBe('dark')
    expect(resolveForceColorScheme('auto')).toBeUndefined()
    expect(resolveForceColorScheme(undefined)).toBeUndefined()
  })
})

describe('Xirang navigation params', () => {
  it('defaults view to model and leaves mode, change and focus absent', () => {
    const parsed = searchParamsSchema.parse({})
    expect(parsed.view).toBe('model')
    expect(parsed.change).toBeUndefined()
    expect(parsed.mode).toBeUndefined()
    expect(parsed.focus).toBeUndefined()
  })

  it('parses explicit view, change, focus and mode values', () => {
    const parsed = searchParamsSchema.parse({
      view: 'overview',
      change: 'browser-change',
      focus: 'capability.drill',
      mode: 'diff-only',
    })
    expect(parsed.view).toBe('overview')
    expect(parsed.change).toBe('browser-change')
    expect(parsed.focus).toBe('capability.drill')
    expect(parsed.mode).toBe('diff-only')
  })

  it('drops an invalid mode instead of guessing', () => {
    const parsed = searchParamsSchema.parse({ mode: 'bogus' })
    expect(parsed.mode).toBeUndefined()
  })
})

describe('--theme build option', () => {
  // Logic from __root.tsx: theme === 'auto' ? 'auto' : defaultTheme
  // defaultTheme comes from likec4:app-config virtual module (defaults to 'auto')
  const deriveDefault = (url: string | undefined, build: string) => url === 'auto' ? 'auto' : build
  const defineValue = (theme: string | undefined) => JSON.stringify(theme ?? 'auto')

  it('should default to auto when --theme is omitted', () => {
    expect(defineValue(undefined)).toBe('"auto"')
    expect(deriveDefault(undefined, 'auto')).toBe('auto')
  })

  it('should use build default when no URL override', () => {
    expect(defineValue('dark')).toBe('"dark"')
    expect(deriveDefault(undefined, 'dark')).toBe('dark')
  })

  it('should restore auto when URL explicitly requests ?theme=auto', () => {
    expect(deriveDefault('auto', 'dark')).toBe('auto')
    expect(deriveDefault('auto', 'light')).toBe('auto')
  })
})
