import { RichText } from '@likec4/core'
import { Box, Stack, Text } from '@mantine/core'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Markdown } from '../../base-primitives'
import {
  type XirangContractContent,
  type XirangContractLoader,
  type XirangViewSource,
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

export interface StructuredContractDiff {
  requirements: Array<{
    identity: string
    title: string
    operation: 'ADDED' | 'MODIFIED' | 'REMOVED'
    before: string
    after: string
    scenarios: Array<{
      identity: string
      title: string
      operation: 'ADDED' | 'MODIFIED' | 'REMOVED'
      before: string
      after: string
    }>
  }>
  diagnostics: XirangViewSource['diagnostics']
}

function body(value: unknown): string {
  return value && typeof value === 'object' && typeof (value as { body?: unknown }).body === 'string'
    ? (value as { body: string }).body
    : ''
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
      before: body(entry.before),
      after: body(entry.after),
      scenarios: (entry.children ?? []).filter(child => child.kind === 'scenario').map(child => ({
        identity: child.identity,
        title: child.identity.slice(child.identity.lastIndexOf('#') + 1),
        operation: child.operation,
        before: body(child.before),
        after: body(child.after),
      })),
    })),
    diagnostics: source.diagnostics.filter(diagnostic => diagnostic.identity?.startsWith(prefix) ?? false),
  }
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
  const selectedChange = runtime.selected.change
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
    controller.load(loader, project, element, selectedChange)
    return () => controller.dispose()
  }, [active, controller, element, loader, project, revision, selectedChange])

  return (
    <Stack gap="sm" h="100%" data-xirang-contracts data-xirang-view-source={runtime.selected.id}>
      {displayState.status === 'loading' && <ContractPath path={displayState.element}>Loading…</ContractPath>}
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
