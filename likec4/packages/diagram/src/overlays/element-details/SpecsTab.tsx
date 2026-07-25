import { RichText } from '@likec4/core'
import { Badge, Box, Code, Group, NativeSelect, Stack, Text } from '@mantine/core'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Markdown } from '../../base-primitives'
import {
  type XirangDiffEntry,
  type XirangRuntimeVariant,
  type XirangSpecContent,
  type XirangSpecLoader,
  useXirangSpecLoader,
  useXirangVariants,
} from '../../xirang/SpecLoaderContext'

export type SpecLoadState =
  | { status: 'idle' }
  | { status: 'loading'; project: string; element: string; path: string }
  | { status: 'success'; project: string; element: string; content: XirangSpecContent }
  | { status: 'error'; project: string; element: string; path: string; message: string }

export interface XirangSpecIndexState {
  project: string
  element: string
  variant?: string
  paths: string[]
}

export class XirangSpecIndexController {
  private abortController: AbortController | undefined
  private requestId = 0

  constructor(private readonly update: (state: XirangSpecIndexState) => void) {}

  load(loader: XirangSpecLoader, project: string, element: string, variant = 'formal'): void {
    this.abortController?.abort()
    const abortController = this.abortController = new AbortController()
    const requestId = ++this.requestId
    this.update({ project, element, ...(variant !== 'formal' ? { variant } : {}), paths: [] })
    loader.list(project, element, abortController.signal, variant).then(
      paths => {
        if (requestId === this.requestId && !abortController.signal.aborted) {
          this.update({ project, element, ...(variant !== 'formal' ? { variant } : {}), paths: normalizeSpecPaths(paths) })
        }
      },
      () => {
        if (requestId === this.requestId && !abortController.signal.aborted) {
          this.update({ project, element, ...(variant !== 'formal' ? { variant } : {}), paths: [] })
        }
      },
    )
  }

  dispose(): void {
    this.requestId++
    this.abortController?.abort()
    this.abortController = undefined
  }
}

export class XirangSpecLoadController {
  private abortController: AbortController | undefined
  private requestId = 0

  constructor(private readonly update: (state: SpecLoadState) => void) {}

  load(loader: XirangSpecLoader, project: string, element: string, specPath: string, variant = 'formal'): void {
    this.abortController?.abort()
    const abortController = this.abortController = new AbortController()
    const requestId = ++this.requestId
    this.update({ status: 'loading', project, element, path: specPath })

    loader.load(project, element, specPath, abortController.signal, variant).then(
      content => {
        if (requestId === this.requestId && !abortController.signal.aborted) {
          this.update({ status: 'success', project, element, content })
        }
      },
      error => {
        if (requestId !== this.requestId || abortController.signal.aborted) {
          return
        }
        this.update({
          status: 'error',
          project,
          element,
          path: specPath,
          message: error instanceof Error ? error.message : 'Unable to load Spec',
        })
      },
    )
  }

  dispose(): void {
    this.requestId++
    this.abortController?.abort()
    this.abortController = undefined
  }
}

export function normalizeSpecPaths(value: unknown): string[] {
  const paths = typeof value === 'string'
    ? [value]
    : Array.isArray(value)
    ? value
    : []
  return [...new Set(paths.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))].sort()
}

export function getSpecsTabModel(value: unknown) {
  const paths = normalizeSpecPaths(value)
  return {
    paths,
    visible: paths.length > 0,
    showSelector: paths.length > 1,
    selected: paths[0] ?? null,
  }
}

export interface TextDiffLine {
  operation: 'UNCHANGED' | 'ADDED' | 'REMOVED'
  text: string
  words?: Array<{ operation: 'UNCHANGED' | 'ADDED' | 'REMOVED'; text: string }>
}

export interface StructuredSpecDiff {
  requirements: Array<{
    identity: string
    title: string
    operation: 'ADDED' | 'MODIFIED' | 'REMOVED'
    text: TextDiffLine[]
    scenarios: Array<{
      identity: string
      title: string
      operation: 'ADDED' | 'MODIFIED' | 'REMOVED'
      text: TextDiffLine[]
    }>
  }>
  diagnostics: XirangRuntimeVariant['diagnostics']
}

function body(value: unknown): string {
  return value && typeof value === 'object' && typeof (value as { body?: unknown }).body === 'string'
    ? (value as { body: string }).body
    : ''
}

function wordDiff(before: string, after: string): TextDiffLine['words'] {
  const left = before.split(/(\s+)/)
  const right = after.split(/(\s+)/)
  let prefix = 0
  while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix++
  let suffix = 0
  while (suffix < left.length - prefix && suffix < right.length - prefix
    && left[left.length - 1 - suffix] === right[right.length - 1 - suffix]) suffix++
  return [
    ...(prefix ? [{ operation: 'UNCHANGED' as const, text: left.slice(0, prefix).join('') }] : []),
    ...(left.length - prefix - suffix ? [{ operation: 'REMOVED' as const, text: left.slice(prefix, left.length - suffix).join('') }] : []),
    ...(right.length - prefix - suffix ? [{ operation: 'ADDED' as const, text: right.slice(prefix, right.length - suffix).join('') }] : []),
    ...(suffix ? [{ operation: 'UNCHANGED' as const, text: left.slice(left.length - suffix).join('') }] : []),
  ]
}

export function createTextDiff(before: string, after: string): TextDiffLine[] {
  if (before === after) return before.split('\n').map(text => ({ operation: 'UNCHANGED', text }))
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  let prefix = 0
  while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) prefix++
  let suffix = 0
  while (suffix < beforeLines.length - prefix && suffix < afterLines.length - prefix
    && beforeLines[beforeLines.length - 1 - suffix] === afterLines[afterLines.length - 1 - suffix]) suffix++
  const unchangedBefore = beforeLines.slice(0, prefix).map(text => ({ operation: 'UNCHANGED' as const, text }))
  const removed = beforeLines.slice(prefix, beforeLines.length - suffix)
  const added = afterLines.slice(prefix, afterLines.length - suffix)
  const changed = removed.length === 1 && added.length === 1
    ? [
      { operation: 'REMOVED' as const, text: removed[0]!, words: wordDiff(removed[0]!, added[0]!) },
      { operation: 'ADDED' as const, text: added[0]!, words: wordDiff(removed[0]!, added[0]!) },
    ]
    : [
      ...removed.map(text => ({ operation: 'REMOVED' as const, text })),
      ...added.map(text => ({ operation: 'ADDED' as const, text })),
    ]
  const unchangedAfter = suffix
    ? beforeLines.slice(beforeLines.length - suffix).map(text => ({ operation: 'UNCHANGED' as const, text }))
    : []
  return [...unchangedBefore, ...changed, ...unchangedAfter]
}

export function getStructuredSpecDiff(variant: XirangRuntimeVariant, specPath: string): StructuredSpecDiff {
  const specId = specPath.match(/^\.xirang\/specs\/([^/]+)\/spec\.md$/)?.[1]
  const entries = variant.diff?.entries ?? []
  const requirements = specId
    ? entries.filter(entry => entry.scope === 'specs' && entry.kind === 'requirement' && entry.identity.startsWith(`${specId}#`))
    : []
  return {
    requirements: requirements.map(entry => ({
      identity: entry.identity,
      title: entry.identity.slice(entry.identity.indexOf('#') + 1),
      operation: entry.operation,
      text: createTextDiff(body(entry.before), body(entry.after)),
      scenarios: (entry.children ?? []).filter(child => child.kind === 'scenario').map(child => ({
        identity: child.identity,
        title: child.identity.slice(child.identity.lastIndexOf('#') + 1),
        operation: child.operation,
        text: createTextDiff(body(child.before), body(child.after)),
      })),
    })),
    diagnostics: variant.diagnostics.filter(diagnostic => !specId || diagnostic.path.includes(specId)),
  }
}

function OperationBadge({ operation }: { operation: XirangDiffEntry['operation'] }) {
  const color = operation === 'ADDED' ? 'green' : operation === 'REMOVED' ? 'red' : 'yellow'
  return <Badge size="xs" color={color}>{operation}</Badge>
}

function TextDiff({ lines }: { lines: TextDiffLine[] }) {
  return (
    <Code block data-xirang-text-diff>
      {lines.map((line, index) => (
        <Box
          key={index}
          component="span"
          display="block"
          {...(line.operation === 'ADDED' ? { c: 'green' } : line.operation === 'REMOVED' ? { c: 'red' } : {})}
          {...(line.operation === 'UNCHANGED' ? { style: { opacity: .65 } } : {})}
        >
          {line.words?.map((word, wordIndex) => (
            <Box
              key={wordIndex}
              component={word.operation === 'REMOVED' ? 'del' : word.operation === 'ADDED' ? 'ins' : 'span'}
              style={{ fontWeight: word.operation === 'UNCHANGED' ? undefined : 700 }}
            >{word.text}</Box>
          )) ?? line.text}
          {'\n'}
        </Box>
      ))}
    </Code>
  )
}

export function SpecsTab({
  project,
  element,
  specs,
  active,
}: {
  project: string
  element: string
  specs: readonly string[]
  active: boolean
}) {
  const loader = useXirangSpecLoader()
  const runtime = useXirangVariants()
  const [selected, setSelected] = useState(specs[0] ?? '')
  const [state, setState] = useState<SpecLoadState>({ status: 'idle' })
  const controller = useMemo(() => new XirangSpecLoadController(setState), [])
  const selectedPath = specs.includes(selected) ? selected : specs[0] ?? ''
  const displayState = state.status === 'idle'
    || (state.project === project && state.element === element)
    ? state
    : { status: 'idle' as const }

  useEffect(() => {
    setSelected(specs[0] ?? '')
    setState({ status: 'idle' })
    controller.dispose()
  }, [controller, element, project, specs])

  useEffect(() => {
    if (!active || !loader || !selectedPath) {
      return
    }
    controller.load(loader, project, element, selectedPath, runtime.selected.id)
    return () => controller.dispose()
  }, [active, controller, element, loader, project, runtime.selected.id, selectedPath])

  useEffect(() => {
    if (!active || !loader?.subscribe || !selectedPath) {
      return
    }
    return loader.subscribe(changedPath => {
      if (changedPath === selectedPath) {
        controller.load(loader, project, element, selectedPath, runtime.selected.id)
      }
    })
  }, [active, controller, element, loader, project, runtime.selected.id, selectedPath])

  const structuredDiff = runtime.selected.kind === 'change'
    ? getStructuredSpecDiff(runtime.selected, selectedPath)
    : null

  return (
    <Stack gap="sm" h="100%" data-xirang-specs data-xirang-variant={runtime.selected.id}>
      {specs.length > 1 && (
        <NativeSelect
          aria-label="Select Spec"
          size="xs"
          value={selectedPath}
          data={specs.map(spec => ({ label: spec, value: spec }))}
          onChange={event => setSelected(event.currentTarget.value)}
        />
      )}
      {displayState.status === 'idle' && (
        <Text size="sm" c="dimmed">Select a Spec</Text>
      )}
      {displayState.status === 'loading' && (
        <SpecPath path={displayState.path}>Loading…</SpecPath>
      )}
      {displayState.status === 'error' && (
        <SpecPath path={displayState.path} color="red">{displayState.message}</SpecPath>
      )}
      {structuredDiff && (structuredDiff.requirements.length > 0 || structuredDiff.diagnostics.length > 0) && (
        <Stack gap="xs" data-xirang-structured-diff>
          {structuredDiff.diagnostics.map((diagnostic, index) => (
            <Text key={index} size="xs" c={diagnostic.level === 'ERROR' ? 'red' : 'yellow'}>
              {diagnostic.path}: {diagnostic.message}
            </Text>
          ))}
          {structuredDiff.requirements.map(requirement => (
            <Stack key={requirement.identity} gap={4} p="xs" style={{ border: '1px solid var(--mantine-color-default-border)' }}>
              <Group gap="xs"><OperationBadge operation={requirement.operation} /><Text fw={600}>{requirement.title}</Text></Group>
              <TextDiff lines={requirement.text} />
              {requirement.scenarios.map(scenario => (
                <Stack key={scenario.identity} gap={4} pl="sm">
                  <Group gap="xs"><OperationBadge operation={scenario.operation} /><Text size="sm">{scenario.title}</Text></Group>
                  <TextDiff lines={scenario.text} />
                </Stack>
              ))}
            </Stack>
          ))}
        </Stack>
      )}
      {displayState.status === 'success' && (
        <>
          <Text size="xs" c="dimmed" style={{ userSelect: 'all' }}>
            {displayState.content.path}
          </Text>
          <Box data-xirang-spec-content style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Markdown value={RichText.from({ md: displayState.content.md })} />
          </Box>
        </>
      )}
    </Stack>
  )
}

function SpecPath({
  path,
  color = 'dimmed',
  children,
}: {
  path: string
  color?: string
  children: ReactNode
}) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" style={{ userSelect: 'all' }}>{path}</Text>
      <Text size="sm" c={color}>{children}</Text>
    </Stack>
  )
}
