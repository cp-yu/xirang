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
  | { status: 'loading'; path: string }
  | { status: 'success'; content: OpsxSpecContent }
  | { status: 'error'; path: string; message: string }

export class OpsxSpecLoadController {
  private abortController: AbortController | undefined
  private requestId = 0

  constructor(private readonly update: (state: SpecLoadState) => void) {}

  load(loader: OpsxSpecLoader, element: string, specPath: string): void {
    this.abortController?.abort()
    const abortController = this.abortController = new AbortController()
    const requestId = ++this.requestId
    this.update({ status: 'loading', path: specPath })

    loader.load(element, specPath, abortController.signal).then(
      content => {
        if (requestId === this.requestId && !abortController.signal.aborted) {
          this.update({ status: 'success', content })
        }
      },
      error => {
        if (requestId !== this.requestId || abortController.signal.aborted) {
          return
        }
        this.update({
          status: 'error',
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
  element,
  specs,
  active,
}: {
  element: string
  specs: readonly string[]
  active: boolean
}) {
  const loader = useOpsxSpecLoader()
  const [selected, setSelected] = useState(specs[0] ?? '')
  const [state, setState] = useState<SpecLoadState>({ status: 'idle' })
  const controller = useMemo(() => new OpsxSpecLoadController(setState), [])

  useEffect(() => {
    setSelected(specs[0] ?? '')
    setState({ status: 'idle' })
    controller.dispose()
  }, [controller, element, specs])

  useEffect(() => {
    if (!active || !loader || !selected) {
      return
    }
    controller.load(loader, element, selected)
    return () => controller.dispose()
  }, [active, controller, element, loader, selected])

  useEffect(() => {
    if (!active || !loader?.subscribe || !selected) {
      return
    }
    return loader.subscribe(changedPath => {
      if (changedPath === selected) {
        controller.load(loader, element, selected)
      }
    })
  }, [active, controller, element, loader, selected])

  return (
    <Stack gap="sm" h="100%" data-opsx-specs>
      {specs.length > 1 && (
        <NativeSelect
          aria-label="Select Spec"
          size="xs"
          value={selected}
          data={specs.map(spec => ({ label: spec, value: spec }))}
          onChange={event => setSelected(event.currentTarget.value)}
        />
      )}
      {state.status === 'idle' && (
        <Text size="sm" c="dimmed">Select a Spec</Text>
      )}
      {state.status === 'loading' && (
        <SpecPath path={state.path}>Loading…</SpecPath>
      )}
      {state.status === 'error' && (
        <SpecPath path={state.path} color="red">{state.message}</SpecPath>
      )}
      {state.status === 'success' && (
        <>
          <Text size="xs" c="dimmed" style={{ userSelect: 'all' }}>
            {state.content.path}
          </Text>
          <Box style={{ minHeight: 0, overflow: 'auto' }}>
            <Markdown value={RichText.from({ md: state.content.md })} />
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
