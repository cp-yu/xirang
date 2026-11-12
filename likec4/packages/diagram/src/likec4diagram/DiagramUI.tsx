import { type Fqn, type NodeId, hasProp, isDynamicView, RichText } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { ActionIcon, Badge, Box, Button, Group, Modal, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronUp, IconGripVertical } from '@tabler/icons-react'
import { useRerender } from '@react-hookz/web'
import { motion, useDragControls } from 'motion/react'
import { nodeToRect } from '@xyflow/system'
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
import {
  type ChangedElement,
  type ChangedRelationship,
  collectChangedElements,
  collectChangedRelationships,
  type LocateUnavailableReason,
  listDiffCategories,
  resolveLocateTarget,
  summarizeXirangDiff,
  xirangViewTitle,
} from '../xirang/changePanelModel'
import {
  computeLocateViewport,
  NO_INSETS,
  obstructionInsets,
} from '../xirang/browserChromeModel'
import { addedXirangProjectionIdentity } from '../xirang/projectionNode'
import { setXirangExportSnapshot } from '../xirang/export-state'
import { ChangeListPanel } from './ChangeListPanel'
import { XirangMinimap } from './XirangMinimap'
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
 * Right-side inspection panel model for the selected Change. `categories` counts every top-level diff
 * entry by category (Elements, Relationships, Sections, Metamodel, Views) — the same classification the
 * landing-page Change cards use. `changedElements` merges Section changes into their host Element.
 */
export function getArchitectureOverlayModel(source: XirangViewSource) {
  const entries = (source.diff?.entries ?? []).filter(entry => structuralDiffKinds.has(entry.kind))
  const changed = new Set<string>()
  const context = new Set<string>()
  const metamodel = [] as typeof entries
  for (const entry of entries) {
    if (entry.kind === 'element-declaration') {
      changed.add(entry.identity)
      const beforeParent = entry.before && typeof entry.before === 'object'
        ? (entry.before as { parent?: unknown }).parent
        : null
      const afterParent = entry.after && typeof entry.after === 'object'
        ? (entry.after as { parent?: unknown }).parent
        : null
      if (typeof beforeParent === 'string') context.add(beforeParent)
      if (typeof afterParent === 'string') context.add(afterParent)
    } else if (entry.kind === 'relationship') {
      const [source, , target] = entry.identity.split('|')
      if (source) context.add(source)
      if (target) context.add(target)
    } else {
      metamodel.push(entry)
    }
  }
  for (const identity of changed) context.delete(identity)
  const allEntries = source.diff?.entries ?? []
  const declarations = new Map((source.architecture?.elements ?? [])
    .map(element => [element.declaration.identity, element.declaration]))
  return {
    entries,
    changed: [...changed].sort(),
    context: [...context].sort(),
    categories: summarizeXirangDiff(allEntries),
    changedElements: collectChangedElements(allEntries, declarations),
    changedRelationships: collectChangedRelationships(allEntries, identity => declarations.get(identity)?.title ?? identity),
    metamodel: metamodel.sort((left, right) => left.kind.localeCompare(right.kind) || left.identity.localeCompare(right.identity)),
    diagnostics: source.diagnostics.filter(diagnostic => !isXirangContractDiagnostic(diagnostic)),
  }
}

/** Right-side inspection panel for the selected Change: plan files, metamodel diffs, diagnostics. */
const changeDetailsPanel = css({
  position: 'absolute',
  top: '[64px]',
  left: '2',
  right: '2',
  zIndex: 5,
  pointerEvents: 'all',
  maxHeight: '[calc(100vh - 140px)]',
  overflowY: 'auto',
  layerStyle: 'likec4.panel',
  display: 'flex',
  flexDirection: 'column',
  // Collapsed, the panel shrinks to its header and hugs the right edge on every screen size.
  '&[data-xirang-change-panel-collapsed="true"]': {
    left: '[auto]',
    right: '4',
    width: 'max-content',
    maxWidth: '[calc(100vw - 16px)]',
  },
  sm: {
    left: '[auto]',
    right: '4',
    width: 'max-content',
    minWidth: '[280px]',
    maxWidth: '[400px]',
  },
})

function locateUnavailableMessage(reason: LocateUnavailableReason, identity: string): string {
  switch (reason) {
    case 'removed-hidden':
      return `${identity} is removed and not shown in this projection. Switch Mode to “Complete with diff” or “Diff only”.`
    case 'out-of-scope':
      return `${identity} is outside the current View Selection. Switch View to Full Model.`
    case 'no-parent':
    case 'hidden':
      return `${identity} is not visible in the current projection.`
  }
}

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
  /** Narrow screens start with the Change panel collapsed so it does not cover the canvas. */
  const [panelCollapsed, setPanelCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 48em)').matches === true,
  )
  const [locateNotice, setLocateNotice] = useState<string | null>(null)
  /** Element waiting for a focus-driven projection update before it can be centered. */
  const [pendingLocate, setPendingLocate] = useState<string | null>(null)
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const changePanelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    setLocateNotice(null)
    setPendingLocate(null)
  }, [selectedRevision])
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
  const breadcrumb = breadcrumbIdentities.length > 0 && (
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

  const projectionNodes = useMemo(
    () => currentView.nodes.map(node => ({ id: node.id as string, identity: nodeIdentity(node) })),
    [currentView.nodes],
  )

  /**
   * Centers the node in the part of the canvas not covered by the expanded Change panel, then highlights it.
   * Falls back to the plain diagram centering when the xyflow internals are not available yet.
   */
  const centerAndHighlight = useCallback((nodeId: string) => {
    const { xystore } = diagram.getContext()
    const state = xystore.getState()
    const internalNode = state.nodeLookup.get(nodeId)
    const canvas = state.domNode?.getBoundingClientRect()
    if (internalNode && canvas && state.panZoom) {
      const panel = !enableStaticView && !panelCollapsed ? changePanelRef.current?.getBoundingClientRect() ?? null : null
      const insets = panel
        ? obstructionInsets(
          { x: panel.x, y: panel.y, width: panel.width, height: panel.height },
          { x: canvas.x, y: canvas.y, width: canvas.width, height: canvas.height },
        )
        : NO_INSETS
      const viewport = computeLocateViewport({
        node: nodeToRect(internalNode),
        container: { width: state.width, height: state.height },
        insets,
        minZoom: state.minZoom,
        maxZoom: Math.max(state.transform[2], 1),
      })
      void state.panZoom.setViewport(viewport, { duration: 450, interpolate: 'smooth' })
    } else {
      diagram.centerViewportOnNode(nodeId as NodeId)
    }
    diagram.highlightNode(nodeId as NodeId)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => diagram.unhighlightAll(), 2500)
  }, [diagram, enableStaticView, panelCollapsed])
  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
  }, [])

  /** Centers a projected node, or focuses its parent first; reports why an Element cannot be shown. */
  const locate = useCallback((target: { identity: string; operation: XirangDiffOperation; parent: string | null }) => {
    setLocateNotice(null)
    const resolution = resolveLocateTarget({
      ...target,
      nodes: projectionNodes,
      focusIdentity: focusIdentity ?? breadcrumbRoot ?? null,
      declaredIdentities: new Set(declarations.keys()),
      scope: viewScope,
    })
    if (resolution.type === 'center') {
      setPendingLocate(null)
      centerAndHighlight(resolution.nodeId)
    } else if (resolution.type === 'focus') {
      setPendingLocate(target.identity)
      actorRef.send({ type: 'navigate.focus', focusIdentity: resolution.focusIdentity })
    } else {
      setPendingLocate(null)
      setLocateNotice(locateUnavailableMessage(resolution.reason, target.identity))
    }
    return resolution
  }, [actorRef, breadcrumbRoot, centerAndHighlight, declarations, focusIdentity, projectionNodes, viewScope])

  useEffect(() => {
    if (!pendingLocate) return
    const node = projectionNodes.find(candidate => candidate.identity === pendingLocate)
    if (node) {
      // Wait for the layout of the re-projected view before moving the viewport.
      const timer = setTimeout(() => {
        setPendingLocate(null)
        centerAndHighlight(node.id)
      }, 450)
      return () => clearTimeout(timer)
    }
    const timeout = setTimeout(() => {
      setPendingLocate(null)
      setLocateNotice(`${pendingLocate} did not appear in the current projection.`)
    }, 8000)
    return () => clearTimeout(timeout)
  }, [centerAndHighlight, pendingLocate, projectionNodes])

  const declarationParent = (identity: string) => declarations.get(identity)?.parent ?? null
  const locateElement = (element: ChangedElement) => locate(element)
  const openElementDetails = (element: ChangedElement) => {
    const node = projectionNodes.find(candidate => candidate.identity === element.identity)
    diagram.openElementDetails(element.identity as Fqn, node?.id as NodeId | undefined)
  }
  const locateRelationship = (relationship: ChangedRelationship) => {
    const attempt = (identity: string) => locate({ identity, operation: relationship.operation, parent: declarationParent(identity) })
    const resolution = attempt(relationship.source)
    if (resolution.type === 'unavailable') attempt(relationship.target)
  }
  const openRelationshipDetails = (relationship: ChangedRelationship) => {
    setRelationshipDetails([relationship.identity])
    setRelationshipModalOpened(true)
  }

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
      data-xirang-metamodel-entry={`${entry.kind}:${entry.identity}`}
      style={{ textAlign: 'left', display: 'block', padding: '4px 4px', minHeight: 28 }}
    >
      <Text size="xs" c="dimmed">
        {entry.operation === 'ADDED' ? '+' : entry.operation === 'REMOVED' ? '−' : '~'} {entry.kind} {entry.identity}
      </Text>
    </UnstyledButton>
  )

  const categories = useMemo(() => listDiffCategories(overlay.categories), [overlay.categories])

  const changeDetails = !enableStaticView && (selected.change || selected.diff || selected.changePlan) && (
    <Stack ref={changePanelRef} className={changeDetailsPanel} p="xs" gap={6} data-xirang-change-panel data-xirang-change-panel-collapsed={panelCollapsed}>
      <Group gap="xs" wrap="nowrap" justify="space-between">
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <Text size="xs" fw={600} truncate>Model · {selected.change ?? selected.label}</Text>
          <Badge size="xs" color={selected.valid ? 'green' : 'red'}>{selected.valid ? 'Valid' : 'Invalid'}</Badge>
        </Group>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          aria-label={panelCollapsed ? 'Expand Change panel' : 'Collapse Change panel'}
          aria-expanded={!panelCollapsed}
          data-xirang-change-panel-toggle
          onClick={() => setPanelCollapsed(value => !value)}
        >
          {panelCollapsed ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
        </ActionIcon>
      </Group>
      <Text size="xs" c="dimmed" data-xirang-change-counts>
        {categories.length === 0
          ? 'No semantic changes'
          : categories.map(category => `${category.label} ${category.text}`).join(' · ')}
      </Text>
      {!panelCollapsed && (
        <>
          <ChangeListPanel
            elements={overlay.changedElements}
            relationships={overlay.changedRelationships}
            revision={selectedRevision}
            onLocateElement={locateElement}
            onOpenElementDetails={openElementDetails}
            onLocateRelationship={locateRelationship}
            onOpenRelationshipDetails={openRelationshipDetails}
          />
          {locateNotice && (
            <Text size="xs" c="orange" data-xirang-locate-notice>{locateNotice}</Text>
          )}
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
        </>
      )}
    </Stack>
  )

  return (
    <>
      {!enableStaticView && breadcrumb}
      {relationshipPanel}
      {changeDetails}
      {!enableStaticView && <XirangMinimap />}
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
