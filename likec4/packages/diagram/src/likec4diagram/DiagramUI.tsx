import { type Fqn, hasProp, isDynamicView, RichText } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { Badge, Box, Button, Group, Modal, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconGripVertical } from '@tabler/icons-react'
import { useRerender } from '@react-hookz/web'
import { motion, useDragControls } from 'motion/react'
import { memo, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { Markdown } from '../base-primitives'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { selectDiagramSnapshot, useDiagramSelector, useOnDiagramEvent } from '../hooks'
import { useDiagram, useDiagramActorRef } from '../hooks/useDiagram'
import { NavigationPanel } from '../navigationpanel'
import { MetamodelDiffModal } from '../overlays/element-details/MetamodelDiffModal'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { applyXirangPresentationOverlay, applyXirangRelationshipPresentation } from '../xirang/architectureView'
import {
  type XirangDiffEntry,
  type XirangDiffKind,
  type XirangDiffOperation,
  type XirangViewSource,
  isXirangContractDiagnostic,
  resolveEffectiveMode,
  useXirangViewSources,
  xirangViewSourceRevision,
} from '../xirang/ContractLoaderContext'
import { addedXirangProjectionIdentity } from '../xirang/projectionNode'
import { setXirangExportSnapshot } from '../xirang/export-state'
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

const structuralDiffKinds = new Set([
  'element-declaration',
  'element-kind',
  'relationship-kind',
  'authored-view',
  'relationship',
])

/**
 * Right-side inspection panel model for the selected Change. Counts cover structural
 * diffs (element-declaration + relationship) only; requirement-level changes surface
 * as per-node count badges and Diff tabs, not panel counters.
 */
export function getArchitectureOverlayModel(source: XirangViewSource) {
  const entries = (source.diff?.entries ?? []).filter(entry => structuralDiffKinds.has(entry.kind))
  const changed = new Set<string>()
  const context = new Set<string>()
  const counts: Record<XirangDiffOperation, number> = { ADDED: 0, MODIFIED: 0, REMOVED: 0 }
  const metamodel = [] as typeof entries
  for (const entry of entries) {
    if (entry.kind === 'element-declaration') {
      changed.add(entry.identity)
      counts[entry.operation] += 1
      const beforeParent = entry.before && typeof entry.before === 'object'
        ? (entry.before as { parent?: unknown }).parent
        : null
      const afterParent = entry.after && typeof entry.after === 'object'
        ? (entry.after as { parent?: unknown }).parent
        : null
      if (typeof beforeParent === 'string') context.add(beforeParent)
      if (typeof afterParent === 'string') context.add(afterParent)
    } else if (entry.kind === 'relationship') {
      counts[entry.operation] += 1
      const [source, , target] = entry.identity.split('|')
      if (source) context.add(source)
      if (target) context.add(target)
    } else {
      metamodel.push(entry)
    }
  }
  for (const identity of changed) context.delete(identity)
  return {
    entries,
    changed: [...changed].sort(),
    context: [...context].sort(),
    counts,
    metamodel: metamodel.sort((left, right) => left.kind.localeCompare(right.kind) || left.identity.localeCompare(right.identity)),
    diagnostics: source.diagnostics.filter(diagnostic => !isXirangContractDiagnostic(diagnostic)),
  }
}

/** Right-side inspection panel for the selected Change: plan files, metamodel diffs, diagnostics. */
const changeDetailsPanel = css({
  position: 'absolute',
  top: '[64px]',
  right: '4',
  zIndex: 5,
  pointerEvents: 'all',
  width: 'max-content',
  maxWidth: 'calc(100vw - 2 * {spacing.md})',
  layerStyle: 'likec4.panel',
  display: 'none',
  sm: {
    display: 'block',
  },
})

/** Metamodel entries above this count collapse into group summary rows. */
export const METAMODEL_COLLAPSE_THRESHOLD = 6

const metamodelGroupOrder = [
  { kind: 'element-kind', label: 'Kind' },
  { kind: 'relationship-kind', label: 'Relationship' },
  { kind: 'authored-view', label: 'View' },
] as const

export interface MetamodelGroup {
  kind: XirangDiffKind
  label: string
  entries: XirangDiffEntry[]
  counts: Record<XirangDiffOperation, number>
}

/** Groups metamodel diff entries into fixed-order Kind/Relationship/View groups; collapsed when total exceeds the threshold. */
export function getMetamodelGroups(
  entries: readonly XirangDiffEntry[],
  threshold: number = METAMODEL_COLLAPSE_THRESHOLD,
): { collapsed: boolean; groups: MetamodelGroup[] } {
  const groups = metamodelGroupOrder.flatMap(({ kind, label }) => {
    const groupEntries = entries.filter(entry => entry.kind === kind)
    if (groupEntries.length === 0) return []
    const counts: Record<XirangDiffOperation, number> = { ADDED: 0, MODIFIED: 0, REMOVED: 0 }
    for (const entry of groupEntries) counts[entry.operation] += 1
    return [{ kind, label, entries: groupEntries, counts }]
  })
  return { collapsed: entries.length > threshold, groups }
}

function FloatingChrome({
  dragControls,
  position,
  children,
}: PropsWithChildren<{
  dragControls: ReturnType<typeof useDragControls>
  position: { left?: number; right?: number; top?: number; bottom?: number }
}>) {
  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragElastic={0}
      dragMomentum={false}
      dragListener={false}
      style={{ position: 'absolute', zIndex: 5, pointerEvents: 'all', touchAction: 'none', ...position }}
    >
      {children}
    </motion.div>
  )
}

function XirangArchitectureOverlay() {
  const { selected, mode } = useXirangViewSources()
  const { enableStaticView } = useEnabledFeatures()
  const breadcrumbDragControls = useDragControls()
  const selectedRevision = xirangViewSourceRevision(selected)
  const actorRef = useDiagramActorRef()
  const diagram = useDiagram()
  const currentView = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.view))
  const isReady = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.matches('ready')))
  const focusIdentity = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.focusIdentity))
  const expandedNodes = useDiagramSelector(selectDiagramSnapshot(snapshot => snapshot.context.expandedNodes))
  const modelView = useRef(currentView)
  const previousFocusAncestors = useRef<string[]>([])
  const effectiveMode = resolveEffectiveMode(selected.source, mode)
  /** Previous run's View/Change/Mode selection; null before the first projection update. */
  const previousSelection = useRef<{ id: string; change: string | null; mode: ReturnType<typeof resolveEffectiveMode> } | null>(null)
  const [relationshipDetails, setRelationshipDetails] = useState<string[]>([])
  const [relationshipModalOpened, setRelationshipModalOpened] = useState(false)
  const [metamodelEntry, setMetamodelEntry] = useState<{ entry: XirangDiffEntry; opened: boolean } | null>(null)
  const [planFile, setPlanFile] = useState<{ name: string; content: string; opened: boolean } | null>(null)
  const [expandedMetamodelGroup, setExpandedMetamodelGroup] = useState<XirangDiffKind | null>(null)
  useEffect(() => setExpandedMetamodelGroup(null), [selectedRevision])
  const overlay = useMemo(() => getArchitectureOverlayModel(selected), [selected])
  const { declarations, childrenByIdentity, rootIdentity } = useMemo(() => {
    const declarations = new Map((selected.architecture?.elements ?? [])
      .map(element => [element.declaration.identity, element.declaration]))
    const rootIdentity = [...declarations.values()].find(declaration => declaration.parent === null)?.identity
    const childrenByIdentity = new Map<string, string[]>()
    for (const declaration of declarations.values()) {
      if (!declaration.parent) continue
      let children = childrenByIdentity.get(declaration.parent)
      if (!children) {
        children = []
        childrenByIdentity.set(declaration.parent, children)
      }
      children.push(declaration.identity)
    }
    return { declarations, childrenByIdentity, rootIdentity }
  }, [selected])
  const hasChildren = (identity: string) => (childrenByIdentity.get(identity)?.length ?? 0) > 0
  const nodeIdentity = (node: { id: string; metadata?: Readonly<Record<string, unknown>> | null | undefined }) =>
    typeof node.metadata?.['xirangIdentity'] === 'string'
      ? node.metadata['xirangIdentity'] as string
      : typeof node.metadata?.['elementId'] === 'string'
        ? node.metadata['elementId'] as string
        : node.id
  const breadcrumbRoot = selected.roots?.[0] ?? rootIdentity
  const viewScope = selected.selection ? new Set(selected.selection) : null
  const breadcrumbIdentities = useMemo(() => {
    const identities: string[] = []
    let breadcrumbIdentity = focusIdentity ?? breadcrumbRoot
    while (breadcrumbIdentity && declarations.has(breadcrumbIdentity)) {
      identities.unshift(breadcrumbIdentity)
      const parent = declarations.get(breadcrumbIdentity)?.parent ?? null
      if (parent === null || (viewScope !== null && !viewScope.has(parent))) break
      breadcrumbIdentity = parent
    }
    return identities
  }, [declarations, focusIdentity, breadcrumbRoot, viewScope])
  const breadcrumb = (selected.source === 'semantic-model' || selected.change === 'candidate') && breadcrumbIdentities.length > 0 && (
    <FloatingChrome dragControls={breadcrumbDragControls} position={{ left: 60, bottom: 16 }}>
      <Group
        data-xirang-focus-breadcrumb
        data-xirang-drag-handle
        gap={2}
        onPointerDown={event => {
          event.stopPropagation()
          breadcrumbDragControls.start(event)
        }}
        style={{ cursor: 'grab', flexWrap: 'wrap', maxWidth: 'calc(100vw - 80px)' }}
      >
        <IconGripVertical size={12} />
        {breadcrumbIdentities.map(identity => (
          <Button
            key={identity}
            data-xirang-focus-identity={identity}
            size="compact-xs"
            variant={identity === (focusIdentity ?? breadcrumbRoot) ? 'filled' : 'subtle'}
            onClick={() => actorRef.send({ type: 'navigate.focus', focusIdentity: identity })}
          >
            {declarations.get(identity)?.title ?? identity}
          </Button>
        ))}
      </Group>
    </FloatingChrome>
  )

  useOnDiagramEvent('nodeClick', event => {
    if (!event.ctrlKey) return
    const identity = nodeIdentity(event.node)
    if (hasChildren(identity)) actorRef.send({ type: 'expand.toggle', identity })
  })

  useOnDiagramEvent('nodeDoubleClick', event => {
    const identity = nodeIdentity(event.node)
    const addedIdentity = addedXirangProjectionIdentity(event.xynode.data)
    if (addedIdentity) {
      diagram.openElementDetails(addedIdentity as Fqn, event.node.id)
      return
    }
    if (hasChildren(identity) && declarations.has(identity)) {
      actorRef.send({ type: 'navigate.focus', focusIdentity: identity })
    }
  })

  useOnDiagramEvent('edgeClick', event => {
    const clicked = event.edge as unknown as { xirangRelations?: string[] }
    const directRelation = (event.xyedge.data as typeof event.xyedge.data & {
      xirang?: { relation?: string }
    }).xirang?.relation
    const edgeId = event.edge.id
    const edge = currentView.edges.find(candidate => candidate.id === edgeId) as
      | { xirangRelations?: string[] }
      | undefined
    const details = directRelation ? [directRelation] : clicked.xirangRelations ?? edge?.xirangRelations ?? []
    setRelationshipDetails(details)
    if (details.length > 0) setRelationshipModalOpened(true)
  })

  useOnDiagramEvent('paneClick', () => {
    setRelationshipDetails([])
    setRelationshipModalOpened(false)
  })

  /**
   * Shift+N expands N levels below the focus, so the intermediate levels 1..N-1 are the ones that
   * must carry expansion; Shift+1 is therefore the collapsed baseline and Shift+0 clears the set.
   * `event.code` is required because Shift+2 reports `@` in `event.key` on a US layout.
   * The handler reads mutable state through a ref so the listener binds once per view instead of
   * being torn down and re-added on every render.
   */
  const expandDepthState = useRef({ focus: focusIdentity ?? breadcrumbRoot, childrenByIdentity, hasChildren })
  expandDepthState.current = { focus: focusIdentity ?? breadcrumbRoot, childrenByIdentity, hasChildren }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
      const match = /^Digit([0-9])$/.exec(event.code)
      if (!match) return
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      event.preventDefault()
      const depth = Number(match[1])
      const { focus, childrenByIdentity: children, hasChildren: branch } = expandDepthState.current
      if (depth <= 1 || !focus) {
        actorRef.send({ type: 'expand.set', expanded: new Set() })
        return
      }
      const expanded = new Set<string>()
      let level = [focus]
      for (let distance = 1; distance < depth; distance++) {
        const next: string[] = []
        for (const identity of level) {
          for (const child of children.get(identity) ?? []) {
            if (!branch(child)) continue
            expanded.add(child)
            next.push(child)
          }
        }
        if (next.length === 0) break
        level = next
      }
      actorRef.send({ type: 'expand.set', expanded })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actorRef, selected.id])

  useEffect(() => {
    if (selected.id === 'full-model' && !currentView.hash.includes(':xirang:')) modelView.current = currentView
  }, [currentView])

  useEffect(() => {
    if (!isReady) return
    const previousSelectionState = previousSelection.current
    const selectionChanged = previousSelectionState === null
      || previousSelectionState.id !== selected.id
      || previousSelectionState.change !== (selected.change ?? null)
      || previousSelectionState.mode !== effectiveMode
    if (previousSelectionState !== null && previousSelectionState.id !== selected.id) {
      previousFocusAncestors.current = []
      if (!focusIdentity) actorRef.send({ type: 'navigate.focus', focusIdentity: breadcrumbRoot ?? null, replaceHistory: true })
      // Send the view update immediately instead of returning,
      // so the change-derived view is rendered even when focusIdentity
      // is already the root identity and won't trigger a re-render.
    }
    previousSelection.current = { id: selected.id, change: selected.change ?? null, mode: effectiveMode }
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
    const projectionView = selected.projection ?? modelView.current
    const view = selected.architecture
      ? applyXirangPresentationOverlay(applyXirangRelationshipPresentation(projectionView, selected), selected)
      : projectionView
    actorRef.send({
      type: 'update.view',
      view,
      source: 'projection',
      // Anchor the viewport only on a real semantic focus; anchoring on the
      // breadcrumb root across unrelated layouts shifts the viewport to a
      // distant region of the canvas (blank screen after entering a
      // change-derived view from the landing page).
      anchorIdentity: focusIdentity ?? null,
      // Fit on the first projection and whenever the View/Change/Mode
      // selection changes (including the quick-entry path); focus drills and
      // expand-in-place keep the current viewport.
      initialProjection: selectionChanged,
    })
    if (focusIdentity && resolvedFocus !== focusIdentity) {
      actorRef.send({ type: 'navigate.focus', focusIdentity: resolvedFocus ?? null })
    }
  }, [actorRef, currentView.id, declarations, effectiveMode, expandedNodes, focusIdentity, isReady, rootIdentity, selected, selectedRevision])

  // Mirror the interactive view state so the Header export can reproduce it in the export tab.
  // Static rendering (the export page) never writes: its own defaults must not overwrite the snapshot.
  useEffect(() => {
    if (enableStaticView) return
    setXirangExportSnapshot({
      view: selected.id,
      model: selected.change ?? 'semantic-model',
      mode: effectiveMode,
      focus: focusIdentity,
      expanded: [...expandedNodes].sort(),
      projection: currentView,
    })
  }, [currentView, enableStaticView, effectiveMode, expandedNodes, focusIdentity, selected.change, selected.id])

  const relationshipPanel = (
    <Modal
      opened={relationshipModalOpened}
      onClose={() => setRelationshipModalOpened(false)}
      title="Relationship Details"
      size="md"
      data-xirang-relationship-details
    >
      <Stack gap={4}>
        {relationshipDetails.map(triple => <Text key={triple} size="sm">{triple}</Text>)}
        {relationshipDetails.length === 0 && <Text size="sm" c="dimmed">No relationship details</Text>}
      </Stack>
    </Modal>
  )

  const metamodelGroups = useMemo(() => getMetamodelGroups(overlay.metamodel), [overlay.metamodel])

  const metamodelEntryRow = (entry: XirangDiffEntry) => (
    <UnstyledButton
      key={`${entry.kind}:${entry.identity}`}
      onClick={() => setMetamodelEntry({ entry, opened: true })}
      style={{ textAlign: 'left' }}
    >
      <Text size="xs" c="dimmed">
        {entry.operation === 'ADDED' ? '+' : entry.operation === 'REMOVED' ? '−' : '~'} {entry.kind} {entry.identity}
      </Text>
    </UnstyledButton>
  )

  const changeDetails = !enableStaticView && (selected.change || selected.diff || selected.changePlan) && (
    <Stack className={changeDetailsPanel} p="xs" gap={4}>
      <Group gap="xs">
        <Text size="xs" fw={600}>Model · {selected.change ?? selected.label}</Text>
        <Badge size="xs" color={selected.valid ? 'green' : 'red'}>{selected.valid ? 'Valid' : 'Invalid'}</Badge>
      </Group>
      <Text size="xs" c="dimmed">+{overlay.counts.ADDED} ~{overlay.counts.MODIFIED} −{overlay.counts.REMOVED}</Text>
      {!metamodelGroups.collapsed && overlay.metamodel.map(metamodelEntryRow)}
      {metamodelGroups.collapsed && metamodelGroups.groups.map(group => (
        <Stack key={group.kind} gap={0}>
          <UnstyledButton
            data-xirang-metamodel-group={group.kind}
            onClick={() => setExpandedMetamodelGroup(current => current === group.kind ? null : group.kind)}
            style={{ textAlign: 'left' }}
          >
            <Text size="xs" c="dimmed" fw={600}>
              {expandedMetamodelGroup === group.kind ? '▾' : '▸'} {group.label} +{group.counts.ADDED} ~{group.counts.MODIFIED} −{group.counts.REMOVED}
            </Text>
          </UnstyledButton>
          {expandedMetamodelGroup === group.kind && group.entries.map(metamodelEntryRow)}
        </Stack>
      ))}
      {selected.changePlan && (
        <Stack gap={2}>
          <Text size="xs" fw={600} c="dimmed" mt={4}>Plan</Text>
          {['design.md', 'proposal.md', 'tasks.md'].map(file => {
            const content = selected.changePlan![file]
            if (!content) return null
            return (
              <UnstyledButton
                key={file}
                onClick={() => setPlanFile({ name: file, content, opened: true })}
                style={{ textAlign: 'left' }}
              >
                <Text size="xs" c="dimmed">📄 {file}</Text>
              </UnstyledButton>
            )
          })}
        </Stack>
      )}
      {overlay.diagnostics.map((diagnostic, index) => (
        <Text key={index} size="xs" c={diagnostic.level === 'ERROR' ? 'red' : 'yellow'}>{diagnostic.message}</Text>
      ))}
    </Stack>
  )

  return (
    <>
      {!enableStaticView && breadcrumb}
      {relationshipPanel}
      {changeDetails}
      <MetamodelDiffModal
        entry={metamodelEntry?.entry ?? null}
        opened={metamodelEntry?.opened ?? false}
        onClose={() => setMetamodelEntry(null)}
      />
      <Modal
        opened={planFile?.opened ?? false}
        onClose={() => setPlanFile(null)}
        title={planFile?.name ?? ''}
        size="xl"
        data-xirang-plan-file
      >
        <Box style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Markdown value={RichText.from({ md: planFile?.content ?? '' })} />
        </Box>
      </Modal>
      <Box
        hidden
        data-xirang-architecture-overlay
        data-xirang-current-view={currentView.id}
        data-xirang-current-view-hash={currentView.hash}
        data-xirang-rendered-node-count={currentView.nodes.length}
        data-xirang-source={selected.id}
        data-xirang-architecture-mode={effectiveMode}
      />
    </>
  )
}

export const LikeC4DiagramUI = memo(({ navigationPanelExtra }: { navigationPanelExtra?: ReactNode }) => {
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
      {enableControls && actors.navigation && !isActiveWalkthrough && <NavigationPanel actorRef={actors.navigation} extra={navigationPanelExtra} />}
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
