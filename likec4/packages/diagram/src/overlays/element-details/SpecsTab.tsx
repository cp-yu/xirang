import { RichText } from '@likec4/core'
import { Box, NativeSelect, Stack, Text } from '@mantine/core'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Markdown } from '../../base-primitives'
import {
  type OpsxSpecContent,
  type OpsxSpecLoader,
  useOpsxSpecLoader,
} from '../../opsx/SpecLoaderContext'

export type SpecLoadState =
  | { status: 'idle' }
  | { status: 'loading'; project: string; element: string; path: string }
  | { status: 'success'; project: string; element: string; content: OpsxSpecContent }
  | { status: 'error'; project: string; element: string; path: string; message: string }

export class OpsxSpecLoadController {
  private abortController: AbortController | undefined
  private requestId = 0

  constructor(private readonly update: (state: SpecLoadState) => void) {}

  load(loader: OpsxSpecLoader, project: string, element: string, specPath: string): void {
    this.abortController?.abort()
    const abortController = this.abortController = new AbortController()
    const requestId = ++this.requestId
    this.update({ status: 'loading', project, element, path: specPath })

    loader.load(project, element, specPath, abortController.signal).then(
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
  return [...new Set(paths.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))]
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
  const loader = useOpsxSpecLoader()
  const [selected, setSelected] = useState(specs[0] ?? '')
  const [state, setState] = useState<SpecLoadState>({ status: 'idle' })
  const controller = useMemo(() => new OpsxSpecLoadController(setState), [])
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
    controller.load(loader, project, element, selectedPath)
    return () => controller.dispose()
  }, [active, controller, element, loader, project, selectedPath])

  useEffect(() => {
    if (!active || !loader?.subscribe || !selectedPath) {
      return
    }
    return loader.subscribe(changedPath => {
      if (changedPath === selectedPath) {
        controller.load(loader, project, element, selectedPath)
      }
    })
  }, [active, controller, element, loader, project, selectedPath])

  return (
    <Stack gap="sm" h="100%" data-opsx-specs>
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
      {displayState.status === 'success' && (
        <>
          <Text size="xs" c="dimmed" style={{ userSelect: 'all' }}>
            {displayState.content.path}
          </Text>
          <Box data-opsx-spec-content style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
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
