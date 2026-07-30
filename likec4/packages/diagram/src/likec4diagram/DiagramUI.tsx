import { hasProp, isDynamicView } from '@likec4/core'
import { useRerender } from '@react-hookz/web'
import { Badge, Box, Button, Group, NativeSelect, Stack, Text } from '@mantine/core'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { selectDiagramSnapshot, useDiagramSelector, useOnDiagramEvent } from '../hooks'
import { useDiagramActorRef } from '../hooks/useDiagram'
import { NavigationPanel } from '../navigationpanel'
import { materializeXirangArchitectureView } from '../xirang/architectureView'
import {
  isXirangContractDiagnostic,
  type XirangDiffOperation,
  type XirangViewSource,
  useXirangViewSources,
  xirangViewSourceRevision,
} from '../xirang/ContractLoaderContext'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { FloatingSequenceActors, LayoutDriftFrame, NotationPanel, SequenceOutlinePanel } from './ui'

const selectChildren = selectDiagramSnapshot(s => ({
  overlays: s.children.overlays ?? null,
  search: s.children.search ?? null,
  navigation: s.children.navigationPanel ?? null,
  ...(isDynamicView(s.context.view) ?
    {
      isSequenceView: s.context.dynamicViewVariant === 'sequence',
      isActiveWalkthrough: s.context.dynamicViewVariant === 'sequence'
        && !!s.context.activeWalkthrough
        && hasProp(s.context.view, 'flow'),
    } :
    {
      isSequenceView: false,
      hasSequenceFlow: false,
      isActiveWalkthrough: false,
    }),
}))

const structuralDiffKinds = new Set(['element-declaration', 'element-kind', 'relationship-kind', 'authored-view', 'relationship'])

function countOperations(entries: readonly { operation: XirangDiffOperation }[]): Record<XirangDiffOperation, number> {
  const counts: Record<XirangDiffOperation, number> = { ADDED: 0, MODIFIED: 0, REMOVED: 0 }
  for (const entry of entries) counts[entry.operation] += 1
  return counts
}

export function getArchitectureOverlayModel(source: XirangViewSource) {
  const entries = source.diff?.entries.filter(entry => structuralDiffKinds.has(entry.kind)) ?? []
  const changed = new Set<string>()
  const context = new Set<string>()
  for (const entry of entries) {
    if (entry.kind === 'element-declaration') {
      changed.add(entry.identity)
      const beforeParent = entry.before && typeof entry.before === 'object' ? (entry.before as { parent?: unknown }).parent : null
      const afterParent = entry.after && typeof entry.after === 'object' ? (entry.after as { parent?: unknown }).parent : null
      if (typeof beforeParent === 'string') context.add(beforeParent)
      if (typeof afterParent === 'string') context.add(afterParent)
    }
    if (entry.kind === 'relationship') {
      const [source, , target] = entry.identity.split('|')
      if (source) context.add(source)
      if (target) context.add(target)
    }
  }
  for (const identity of changed) context.delete(identity)
  return {
    entries,
    changed: [...changed].sort(),
    context: [...context].sort(),
    counts: countOperations(entries),
    diagnostics: source.diagnostics.filter(diagnostic => !isXirangContractDiagnostic(diagnostic)),
  }
}

function XirangArchitectureOverlay() {
  const runtime = useXirangViewSources()
  const actorRef = useDiagramActorRef()
  const currentView = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.view))
  const isReady = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.matches('ready')))
  const focusIdentity = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.focusIdentity))
  const modelView = useRef(currentView)
  const selectedSource = useRef(runtime.selected)
  const selectedSourceId = useRef(runtime.selected.id)
  const previousFocusAncestors = useRef<string[]>([])
  selectedSource.current = runtime.selected
  const [mode, setMode] = useState<'full' | 'diff'>('full')
  const [relationshipDetails, setRelationshipDetails] = useState<string[]>([])
  const declarations = new Map((runtime.selected.architecture?.elements ?? [])
    .map(element => [element.declaration.identity, element.declaration]))
  const rootIdentity = [...declarations.values()].find(declaration => declaration.parent === null)?.identity
  const breadcrumbIdentities: string[] = []
  let breadcrumbIdentity = focusIdentity ?? rootIdentity
  while (breadcrumbIdentity && declarations.has(breadcrumbIdentity)) {
    breadcrumbIdentities.unshift(breadcrumbIdentity)
    breadcrumbIdentity = declarations.get(breadcrumbIdentity)?.parent ?? undefined
  }
  const breadcrumb = currentView.id === 'model' && breadcrumbIdentities.length > 0 && (
    <Group
      data-xirang-focus-breadcrumb
      gap={2}
      style={{ position: 'absolute', left: 16, top: 72, zIndex: 5, pointerEvents: 'all' }}
    >
      {breadcrumbIdentities.map(identity => (
        <Button
          key={identity}
          data-xirang-focus-identity={identity}
          size="compact-xs"
          variant={identity === (focusIdentity ?? rootIdentity) ? 'filled' : 'subtle'}
          onClick={() => actorRef.send({ type: 'navigate.focus', focusIdentity: identity })}
        >
          {declarations.get(identity)?.title ?? identity}
        </Button>
      ))}
    </Group>
  )

  useOnDiagramEvent('nodeClick', event => {
    if (currentView.id !== 'model') return
    const identity = typeof event.node.metadata?.['elementId'] === 'string'
      ? event.node.metadata['elementId']
      : event.node.id
    const hasChildren = selectedSource.current.architecture?.elements
      .some(element => element.declaration.parent === identity) ?? false
    if (hasChildren) actorRef.send({ type: 'navigate.focus', focusIdentity: identity })
  })

  useOnDiagramEvent('edgeClick', event => {
    const edgeId = event.edge.id
    const edge = currentView.edges.find(candidate => candidate.id === edgeId) as { xirangRelations?: string[] } | undefined
    setRelationshipDetails(edge?.xirangRelations ?? [])
  })

  useOnDiagramEvent('paneClick', () => setRelationshipDetails([]))

  useEffect(() => {
    if (currentView.id === 'model' && !currentView.hash.includes(':xirang:')) modelView.current = currentView
  }, [currentView])

  useEffect(() => {
    if (!isReady || currentView.id !== 'model') return
    const selected = selectedSource.current
    const elements = selected.architecture?.elements ?? []
    const declarations = new Map(elements.map(element => [element.declaration.identity, element.declaration]))
    const rootIdentity = elements
      .map(element => element.declaration)
      .find(declaration => declaration.parent === null)?.identity
    if (selectedSourceId.current !== selected.id) {
      selectedSourceId.current = selected.id
      previousFocusAncestors.current = []
      actorRef.send({ type: 'navigate.focus', focusIdentity: rootIdentity ?? null, replaceHistory: true })
      return
    }
    let previousAncestorPath = previousFocusAncestors.current
    if (focusIdentity && declarations.has(focusIdentity)) {
      previousAncestorPath = []
      let ancestor = declarations.get(focusIdentity)?.parent
      while (ancestor) {
        previousAncestorPath.push(ancestor)
        ancestor = declarations.get(ancestor)?.parent ?? null
      }
      previousFocusAncestors.current = previousAncestorPath
    }
    const resolvedFocus = [focusIdentity, ...previousAncestorPath, rootIdentity]
      .find((identity): identity is string => !!identity && declarations.has(identity))
    const view = selected.architecture
      ? materializeXirangArchitectureView(modelView.current, selected, mode, focusIdentity ?? undefined, previousAncestorPath)
      : modelView.current
    actorRef.send({ type: 'update.view', view, source: 'external' })
    if (focusIdentity && resolvedFocus !== focusIdentity) {
      actorRef.send({ type: 'navigate.focus', focusIdentity: resolvedFocus ?? null })
    }
  }, [actorRef, currentView.id, focusIdentity, isReady, mode, runtime.selected.id, runtime.selected.source, xirangViewSourceRevision(runtime.selected)])

  const relationshipPanel = relationshipDetails.length > 0 && (
    <Stack
      data-xirang-relationship-details
      gap={4}
      p="xs"
      style={{
        position: 'absolute',
        right: 16,
        bottom: 72,
        zIndex: 5,
        pointerEvents: 'all',
        background: 'var(--mantine-color-body)',
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 6,
      }}
    >
      {relationshipDetails.map(triple => <Text key={triple} size="xs">{triple}</Text>)}
    </Stack>
  )

  if (runtime.selected.source === 'semantic-model') {
    return (
      <>
        {breadcrumb}
        {relationshipPanel}
        <Box
          hidden
          data-xirang-architecture-overlay
          data-xirang-current-view={currentView.id}
          data-xirang-current-view-hash={currentView.hash}
          data-xirang-rendered-node-count={currentView.nodes.length}
        />
      </>
    )
  }
  const overlay = getArchitectureOverlayModel(runtime.selected)
  return (
    <>
      {breadcrumb}
      {relationshipPanel}
      <Box
      data-xirang-architecture-overlay
      data-xirang-architecture-mode={mode}
      data-xirang-changed-count={overlay.changed.length}
      data-xirang-context-count={overlay.context.length}
      data-xirang-rendered-node-count={currentView.nodes.length}
      data-xirang-rendered-view-hash={currentView.hash}
      style={{ position: 'absolute', right: 16, top: 16, zIndex: 5, pointerEvents: 'all' }}
    >
      <Stack gap={6} p="xs" style={{ background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-default-border)', borderRadius: 6 }}>
        <Group gap="xs"><Text size="xs" fw={600}>Change / {runtime.selected.label}</Text>
          <Badge size="xs" color={runtime.selected.valid ? 'green' : 'red'}>{runtime.selected.valid ? 'Valid' : 'Invalid'}</Badge>
        </Group>
        <NativeSelect
          aria-label="Active Change"
          size="xs"
          value={runtime.selected.id}
          data={runtime.sources.map(source => ({ value: source.id, label: source.label }))}
          onChange={event => runtime.select(event.currentTarget.value)}
        />
        <Group gap={4}>
          <Button size="compact-xs" variant={mode === 'full' ? 'filled' : 'subtle'} onClick={() => setMode('full')}>Full context</Button>
          <Button size="compact-xs" variant={mode === 'diff' ? 'filled' : 'subtle'} onClick={() => setMode('diff')}>Diff only</Button>
        </Group>
        <Text size="xs">+{overlay.counts.ADDED} ~{overlay.counts.MODIFIED} -{overlay.counts.REMOVED}</Text>
        {overlay.entries.length === 0 && <Text size="xs" c="dimmed">No semantic graph change</Text>}
        {overlay.diagnostics.map((diagnostic, index) => (
          <Text key={index} size="xs" c={diagnostic.level === 'ERROR' ? 'red' : 'yellow'}>{diagnostic.message}</Text>
        ))}
      </Stack>
      </Box>
    </>
  )
}

export const LikeC4DiagramUI = memo(() => {
  const {
    enableControls,
    enableNotations,
    enableSearch,
    enableRelationshipDetails,
    enableReadOnly,
    enableCompareWithLatest,
  } = useEnabledFeatures()
  const rerender = useRerender()
  const { isSequenceView, isActiveWalkthrough, ...actors } = useDiagramSelector(selectChildren)

  const handleReset = useCallback(() => {
    if (import.meta.env.DEV) {
      console.warn('DiagramUI: resetting error boundary and rerendering...')
    }
    rerender()
  }, [])

  return (
    <ErrorBoundary onReset={handleReset}>
      {isSequenceView && <FloatingSequenceActors isActiveWalkthrough={isActiveWalkthrough} />}
      {isActiveWalkthrough && <SequenceOutlinePanel />}
      {enableControls && actors.navigation && !isActiveWalkthrough && <NavigationPanel actorRef={actors.navigation} />}
      {actors.overlays && <Overlays overlaysActorRef={actors.overlays} />}
      {enableNotations && <NotationPanel />}
      {enableSearch && actors.search && <Search searchActorRef={actors.search} />}
      {enableRelationshipDetails && enableReadOnly && <RelationshipPopover />}
      {enableCompareWithLatest && <LayoutDriftFrame />}
      <XirangArchitectureOverlay />
    </ErrorBoundary>
  )
})
LikeC4DiagramUI.displayName = 'DiagramUI'
