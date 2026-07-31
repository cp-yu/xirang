import { RichText } from '@likec4/core'
import { Badge, Box, Code, Group, Stack, Text } from '@mantine/core'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Markdown } from '../../base-primitives'
import {
  type XirangContractContent,
  type XirangDiffEntry,
  type XirangViewSource,
  type XirangContractLoader,
  useXirangContractLoader,
  useXirangViewSources,
  xirangViewSourceRevision,
} from '../../xirang/ContractLoaderContext'

export type ContractLoadState =
  | { status: 'idle' }
  | { status: 'loading'; project: string; element: string }
  | { status: 'success'; project: string; element: string; content: XirangContractContent | null }
  | { status: 'error'; project: string; element: string; message: string }

export class XirangContractLoadController {
  private abortController: AbortController | undefined
  private requestId = 0

  constructor(private readonly update: (state: ContractLoadState) => void) {}

  load(loader: XirangContractLoader, project: string, element: string, change?: string): void {
    this.abortController?.abort()
    const abortController = this.abortController = new AbortController()
    const requestId = ++this.requestId
    this.update({ status: 'loading', project, element })

    loader.load(project, element, abortController.signal, change).then(
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
          message: error instanceof Error ? error.message : 'Unable to load Contract',
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

export interface TextDiffLine {
  operation: 'UNCHANGED' | 'ADDED' | 'REMOVED'
  text: string
  words?: Array<{ operation: 'UNCHANGED' | 'ADDED' | 'REMOVED'; text: string }>
}

export interface StructuredContractDiff {
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
  diagnostics: XirangViewSource['diagnostics']
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

/** Requirement identity is `<element identity>#<name>`, so the host Element is the only filter key. */
export function getStructuredContractDiff(source: XirangViewSource, element: string): StructuredContractDiff {
  const prefix = `${element}#`
  const requirements = (source.diff?.entries ?? [])
    .filter(entry => entry.kind === 'requirement' && entry.identity.startsWith(prefix))
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
    diagnostics: source.diagnostics.filter(diagnostic => diagnostic.identity?.startsWith(prefix) ?? false),
  }
}

export function OperationBadge({ operation }: { operation: XirangDiffEntry['operation'] }) {
  const color = operation === 'ADDED' ? 'green' : operation === 'REMOVED' ? 'red' : 'yellow'
  return <Badge size="xs" color={color}>{operation}</Badge>
}

export function TextDiff({ lines }: { lines: TextDiffLine[] }) {
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

function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n?/, '')
}

export function ContractsTab({
  project,
  element,
  active,
}: {
  project: string
  element: string
  active: boolean
}) {
  const loader = useXirangContractLoader()
  const runtime = useXirangViewSources()
  const [state, setState] = useState<ContractLoadState>({ status: 'idle' })
  const controller = useMemo(() => new XirangContractLoadController(setState), [])
  const revision = xirangViewSourceRevision(runtime.selected)
  const displayState = state.status === 'idle'
      || (state.project === project && state.element === element)
    ? state
    : { status: 'idle' as const }

  useEffect(() => {
    setState({ status: 'idle' })
    controller.dispose()
  }, [controller, element, project])

  useEffect(() => {
    if (!active || !loader) {
      return
    }
    controller.load(loader, project, element, runtime.selected.change)
    return () => controller.dispose()
  }, [active, controller, element, loader, project, runtime.selected.id, revision])

  return (
    <Stack gap="sm" h="100%" data-xirang-contracts data-xirang-view-source={runtime.selected.id}>
      {displayState.status === 'loading' && (
        <ContractPath path={displayState.element}>Loading…</ContractPath>
      )}
      {displayState.status === 'error' && (
        <ContractPath path={displayState.element} color="red">{displayState.message}</ContractPath>
      )}
      {displayState.status === 'success' && displayState.content && (
        <>
          <Text size="xs" c="dimmed" style={{ userSelect: 'all' }}>
            {displayState.content.element}
          </Text>
          <Box data-xirang-contract-content style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Markdown value={RichText.from({ md: stripFrontmatter(displayState.content.md) })} />
          </Box>
        </>
      )}
    </Stack>
  )
}

function ContractPath({
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
