import { hasProp, isDynamicView } from '@likec4/core'
import { useRerender } from '@react-hookz/web'
import { Badge, Box, Button, Group, NativeSelect, Stack, Text } from '@mantine/core'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { selectDiagramSnapshot, useDiagramSelector } from '../hooks'
import { useDiagramActorRef } from '../hooks/useDiagram'
import { NavigationPanel } from '../navigationpanel'
import { materializeOpsxArchitectureView } from '../opsx/architectureView'
import { isOpsxSpecDiagnostic, type OpsxRuntimeVariant, useOpsxVariants } from '../opsx/SpecLoaderContext'
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

export function getArchitectureOverlayModel(variant: OpsxRuntimeVariant) {
  const entries = variant.diff?.entries.filter(entry => entry.scope === 'architecture') ?? []
  const changed = new Set<string>()
  const context = new Set<string>()
  for (const entry of entries) {
    if (entry.kind === 'element') {
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
    counts: variant.diff?.summary.architecture ?? { ADDED: 0, MODIFIED: 0, REMOVED: 0 },
    diagnostics: variant.diagnostics.filter(diagnostic => !isOpsxSpecDiagnostic(diagnostic.path)),
  }
}

function OpsxArchitectureOverlay() {
  const runtime = useOpsxVariants()
  const actorRef = useDiagramActorRef()
  const currentView = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.view))
  const formalView = useRef(currentView)
  const selectedVariant = useRef(runtime.selected)
  selectedVariant.current = runtime.selected
  const [mode, setMode] = useState<'full' | 'diff'>('full')

  useEffect(() => {
    if (!currentView.hash.includes(':opsx:')) formalView.current = currentView
  }, [currentView])

  useEffect(() => {
    const selected = selectedVariant.current
    const view = selected.kind === 'change'
      ? materializeOpsxArchitectureView(formalView.current, selected, mode)
      : formalView.current
    actorRef.send({ type: 'update.view', view, source: 'external' })
  }, [actorRef, mode, runtime.selected.id, runtime.selected.kind, runtime.selected.architectureFingerprint])

  if (runtime.selected.kind !== 'change') return null
  const overlay = getArchitectureOverlayModel(runtime.selected)
  return (
    <Box
      data-opsx-architecture-overlay
      data-opsx-architecture-mode={mode}
      data-opsx-changed-count={overlay.changed.length}
      data-opsx-context-count={overlay.context.length}
      data-opsx-rendered-node-count={currentView.nodes.length}
      data-opsx-rendered-view-hash={currentView.hash}
      style={{ position: 'absolute', right: 16, top: 16, zIndex: 5, pointerEvents: 'all' }}
    >
      <Stack gap={6} p="xs" style={{ background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-default-border)', borderRadius: 6 }}>
        <Group gap="xs"><Text size="xs" fw={600}>Change / {runtime.selected.label}</Text>
          <Badge size="xs" color={runtime.selected.valid ? 'green' : 'red'}>{runtime.selected.valid ? 'Valid' : 'Invalid'}</Badge>
        </Group>
        <NativeSelect
          aria-label="Active change variant"
          size="xs"
          value={runtime.selected.id}
          data={runtime.variants.map(variant => ({ value: variant.id, label: variant.label }))}
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
      <OpsxArchitectureOverlay />
    </ErrorBoundary>
  )
})
LikeC4DiagramUI.displayName = 'DiagramUI'
