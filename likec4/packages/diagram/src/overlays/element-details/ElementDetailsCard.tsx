// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// oxlint-disable no-misused-spread
// oxlint-disable no-misused-spread
import {
  type Any,
  type ComputedView,
  type DiagramView,
  type Element,
  type Fqn,
  type NodeId,
  type scalar,
  type ViewId,
  RichText,
} from '@likec4/core/types'
import { css, cx } from '@likec4/styles/css'
import { HStack } from '@likec4/styles/jsx'
import {
  type TextProps,
  ActionIcon,
  ActionIconGroup,
  Badge,
  Box,
  CloseButton,
  Divider as MantineDivider,
  Flex,
  Group,
  RemoveScroll,
  ScrollArea,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  ThemeIcon,
  Tooltip as MantineTooltip,
  UnstyledButton,
} from '@mantine/core'
import { useSessionStorage, useViewportSize } from '@mantine/hooks'
import { useDebouncedCallback, useTimeoutEffect } from '@react-hookz/web'
import { IconExternalLink, IconFileSymlink, IconStack2, IconZoomScan } from '@tabler/icons-react'
import type { Rect } from '@xyflow/system'
import { type PanInfo, m, useDragControls, useMotionValue } from 'motion/react'
import { type PropsWithChildren, type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clamp, entries, isNullish, map, only, partition, pipe } from 'remeda'
import { Markdown } from '../../base-primitives'
import { ElementTag } from '../../base-primitives/element/ElementTags'
import { Link } from '../../components/Link'
import { DiagramFeatures, IconRenderer, IfEnabled } from '../../context'
import { useCallbackRef, useUpdateEffect } from '../../hooks'
import { useCurrentViewModel } from '../../hooks/useCurrentViewModel'
import { useDiagram } from '../../hooks/useDiagram'
import type { OnNavigateTo } from '../../LikeC4Diagram.props'
import { stopPropagation } from '../../utils'
import { type XirangViewSource, useXirangViewSources } from '../../xirang/ContractLoaderContext'
import { ContractsTab } from './ContractsTab'
import { DiffTab } from './DiffTab'
import * as styles from './ElementDetailsCard.css'
import { MetadataProvider, MetadataValue } from './MetadataValue'
import { TabPanelDeployments } from './TabPanelDeployments'
import { TabPanelRelationships } from './TabPanelRelationships'
import { TabPanelStructure } from './TabPanelStructure'

const Divider = MantineDivider.withProps({
  mb: 8,
  labelPosition: 'left',
  variant: 'dashed',
})
const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 400,
  closeDelay: 150,
  label: '',
  children: null,
  offset: 4,
})

const SmallLabel = Text.withProps({
  component: 'div',
  fz: 11,
  fw: 500,
  c: 'dimmed',
  lh: 1,
})

const PropertyLabel = Text.withProps({
  component: 'div',
  fz: 'xs',
  c: 'dimmed',
  className: styles.propertyLabel,
})

type ElementDetailsCardProps = {
  viewId: ViewId
  fromNode: NodeId | null
  rectFromNode: Rect | null
  onClose: () => void
  fqn: Fqn
}

type ElementDefinitionPropertiesProps = {
  selected: XirangViewSource
  stableElementId: string
}

export function ElementDefinitionProperties({
  selected,
  stableElementId,
}: ElementDefinitionPropertiesProps) {
  const declaration = selected.architecture?.elements
    .find(item => item.declaration.identity === stableElementId)?.declaration
    ?? null

  return (
    <>
      <PropertyLabel>kind</PropertyLabel>
      <Text>{declaration?.kind ?? '—'}</Text>
      <PropertyLabel>parent</PropertyLabel>
      <Text>{declaration?.parent ?? '—'}</Text>
      <PropertyLabel>title</PropertyLabel>
      <Text>{declaration?.title ?? '—'}</Text>
      <PropertyLabel>definition</PropertyLabel>
      <Markdown value={RichText.from(declaration?.description)} emptyText="no definition" />
    </>
  )
}

const MIN_PADDING = 24

const TABS = ['Properties', 'Relationships', 'Views', 'Structure', 'Deployments'] as const
type TabName = typeof TABS[number] | 'Contracts' | 'Diff'

export function visibleElementDetailTabs({
  isAddedElement,
  hasContract,
  hasDiff,
}: {
  isAddedElement: boolean
  hasContract: boolean
  hasDiff: boolean
}): TabName[] {
  return [
    'Properties',
    ...(hasContract ? ['Contracts' as const] : []),
    ...(hasDiff ? ['Diff' as const] : []),
    ...(isAddedElement ? [] : TABS.slice(1)),
  ]
}

export function ElementDetailsCard({
  viewId,
  fromNode,
  rectFromNode,
  fqn,
  onClose,
}: ElementDetailsCardProps) {
  const [opened, setOpened] = useState(false)
  const windowSize = useViewportSize()
  const windowWidth = windowSize.width || window.innerWidth || 1200,
    windowHeight = windowSize.height || window.innerHeight || 800

  const [activeTab, setActiveTab] = useSessionStorage<TabName>({
    key: `likec4:element-details:active-tab`,
    defaultValue: 'Properties',
  })
  const diagram = useDiagram()
  const viewModel = useCurrentViewModel()
  const nodeModel = fromNode ? viewModel.findNode(fromNode) : viewModel.findNodeWithElement(fqn)

  const elementModel = viewModel.$model.findElement(fqn) ?? null
  const runtime = useXirangViewSources()
  const declarationEntry = runtime.selected.source === 'change-derived-view'
    ? runtime.selected.diff?.entries.find(entry => entry.kind === 'element-declaration' && entry.identity === fqn)
    : undefined
  const isAddedElement = !elementModel && declarationEntry?.operation === 'ADDED'
  const stableElementId = elementModel
    ? typeof elementModel.$element.metadata?.['elementId'] === 'string'
      ? elementModel.$element.metadata['elementId']
      : elementModel.id
    : fqn
  const declaration = isAddedElement
    ? runtime.selected.architecture?.elements
      .find(item => item.declaration.identity === fqn)?.declaration ?? null
    : null
  const elementTitle = declaration?.title ?? elementModel?.title ?? fqn
  const elementKind = declaration?.kind ?? elementModel?.kind ?? '—'
  const elementIcon = elementModel
    ? IconRenderer({
      element: {
        id: fqn,
        title: elementModel.title,
        icon: nodeModel?.icon ?? elementModel.icon,
      },
      className: styles.elementIcon,
    })
    : null
  const elementTags = elementModel?.tags ?? []
  const elementTechnology = elementModel?.technology ?? null
  const elementLinks = elementModel?.links ?? []
  const elementMetadata = elementModel?.$element.metadata ?? null
  const elementViews = elementModel ? [...elementModel.views()] : []
  const elementDefaultView = elementModel?.defaultView?.$view ?? null
  const elementColor = elementModel?.color ?? 'gray'
  const elementProjectId = elementModel?.projectId ?? ''
  // The Contract projection is root-owned: an absent key means the Element has no Contract.
  const hasContract = typeof runtime.selected.contracts?.[stableElementId] === 'string'
  const hasDiff = runtime.selected.source === 'change-derived-view'
    && (runtime.selected.diff?.entries ?? []).some(
      entry =>
        (entry.kind === 'element-declaration' && entry.identity === stableElementId)
        || (entry.kind === 'requirement' && entry.identity.startsWith(stableElementId + '#')),
    )

  const visibleTabs = useMemo(
    () => visibleElementDetailTabs({ isAddedElement, hasContract, hasDiff }),
    [hasContract, hasDiff, isAddedElement],
  )

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab('Properties')
    }
  }, [activeTab, setActiveTab, visibleTabs])

  const [viewsOf, otherViews] = pipe(
    [...elementViews],
    map(v => v.$view),
    partition(v => v._type === 'element' && v.viewOf === fqn),
  )

  let defaultView = nodeModel?.navigateTo?.$view ?? elementDefaultView
  // Ignore default view if it's the current view
  if (defaultView?.id === viewId) {
    defaultView = null
  }

  const defaultLink = only(elementLinks)
  const controls = useDragControls()

  const isCompound = (nodeModel?.$node.children?.length ?? 0) > 0
  const _width = Math.min(700, windowWidth - MIN_PADDING * 2)
  const _height = Math.min(650, windowHeight - MIN_PADDING * 2)

  const fromPosition = rectFromNode
    ? {
      x: rectFromNode.x + (isCompound ? (rectFromNode.width - _width / 2) : rectFromNode.width / 2),
      y: rectFromNode.y + (isCompound ? 0 : rectFromNode.height / 2),
    }
    : {
      x: windowWidth / 2,
      y: windowHeight / 2,
    }

  const fromScale = rectFromNode ? Math.min(rectFromNode.width / _width, rectFromNode.height / _height, 0.9) : 1

  const left = Math.round(
    clamp(fromPosition.x - _width / 2, {
      min: MIN_PADDING,
      max: windowWidth - _width - MIN_PADDING,
    }),
  )
  const top = Math.round(
    clamp(fromPosition.y - (isCompound ? 0 : 60), {
      min: MIN_PADDING,
      max: windowHeight - _height - MIN_PADDING,
    }),
  )

  const originX = clamp((fromPosition.x - left) / _width, {
    min: 0.1,
    max: 0.9,
  })
  const originY = clamp((fromPosition.y - top) / _height, {
    min: 0.1,
    max: 0.9,
  })

  const width = useMotionValue(_width)
  const height = useMotionValue(_height)

  useUpdateEffect(() => {
    width.set(_width)
    height.set(_height)
  }, [_width, _height])

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    width.set(Math.max(width.get() + info.delta.x, 320))
    height.set(Math.max(height.get() + info.delta.y, 300))
  }, [width, height])

  const ref = useRef<HTMLDialogElement>(null)

  const close = useDebouncedCallback(
    useCallbackRef(onClose),
    [],
    50,
  )
  const triggerClose = useCallbackRef((event?: SyntheticEvent) => {
    event?.stopPropagation()
    close()
  })

  const notation = nodeModel?.$node.notation ?? null

  useTimeoutEffect(() => {
    if (!ref.current?.open) {
      ref.current?.showModal()
    }
  }, 20)

  /**
   * This delay improves "enter" animations,
   * if  current tab is "Relationships"
   */
  useTimeoutEffect(() => {
    setOpened(true)
  }, 220)

  // For ADDED elements in a change (not in the base model), show a simplified card.

  return (
    <m.dialog
      ref={ref}
      className={cx(styles.dialog, RemoveScroll.classNames.fullWidth)}
      layout
      initial={{
        [styles.backdropBlur]: '0px',
        [styles.backdropOpacity]: '5%',
      }}
      animate={{
        [styles.backdropBlur]: '3px',
        [styles.backdropOpacity]: '60%',
      }}
      exit={{
        [styles.backdropBlur]: '0px',
        [styles.backdropOpacity]: '0%',
        transition: {
          duration: 0.1,
        },
      }}
      onClick={e => {
        e.stopPropagation()
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          ref.current?.close()
        }
      }}
      onDoubleClick={stopPropagation}
      onPointerDown={stopPropagation}
      onClose={triggerClose}
    >
      <RemoveScroll forwardProps removeScrollBar={false}>
        <m.div
          layout
          layoutRoot
          drag
          dragControls={controls}
          dragElastic={0}
          dragMomentum={false}
          dragListener={false}
          data-likec4-color={nodeModel?.color ?? elementColor}
          className={styles.card}
          initial={{
            top,
            left,
            width: _width,
            height: _height,
            opacity: 0,
            originX,
            originY,
            scale: Math.max(fromScale, 0.65),
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            translateY: -10,
            transition: {
              duration: 0.1,
            },
          }}
          style={{
            width,
            height,
          }}>
          <div className={styles.cardHeader} onPointerDown={e => controls.start(e)}>
            <HStack alignItems="start" justify="space-between" gap={'sm'} mb={'sm'} flexWrap="nowrap">
              <HStack
                alignItems="start"
                gap={'sm'}
                style={{ cursor: 'default', minWidth: 0, overflow: 'hidden' }}
                flexWrap="nowrap"
              >
                {elementIcon}
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <Tooltip label={elementTitle} openDelay={600} position="bottom-start">
                    <Text
                      component={'div'}
                      className={styles.title}>
                      {elementTitle}
                    </Text>
                  </Tooltip>
                  {notation && (
                    <Text component="div" c={'dimmed'} fz={'sm'} fw={500} lh={1.3} lineClamp={1}>
                      {notation}
                    </Text>
                  )}
                </div>
              </HStack>
              <CloseButton aria-label="Close element details" size={'lg'} onClick={triggerClose} />
            </HStack>
            <HStack alignItems="baseline" gap={'sm'} flexWrap="nowrap">
              <div>
                <SmallLabel>kind</SmallLabel>
                <Badge
                  radius={'sm'}
                  size="sm"
                  fw={600}
                  color="gray"
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    diagram.openSearch(`kind:${elementKind}`)
                  }}
                >
                  {elementKind}
                </Badge>
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <SmallLabel>tags</SmallLabel>
                <ElementTags
                  tags={elementTags}
                  onClick={tag => diagram.openSearch(`#${tag}`)} />
              </div>
              <ActionIconGroup
                style={{
                  alignSelf: 'flex-start',
                }}>
                {defaultLink && (
                  <ActionIcon
                    component="a"
                    href={defaultLink.url}
                    target="_blank"
                    size="lg"
                    variant="default"
                    radius="sm"
                  >
                    <IconExternalLink stroke={1.6} style={{ width: '65%' }} />
                  </ActionIcon>
                )}
                <IfEnabled feature="Vscode">
                  <Tooltip label="Open source">
                    <ActionIcon
                      size="lg"
                      variant="default"
                      radius="sm"
                      onClick={e => {
                        e.stopPropagation()
                        diagram.openSource({
                          element: elementModel?.id ?? fqn,
                        })
                      }}>
                      <IconFileSymlink stroke={1.8} style={{ width: '62%' }} />
                    </ActionIcon>
                  </Tooltip>
                </IfEnabled>
                {viewId !== ('model' as ViewId) && !isAddedElement && (
                  <Tooltip label="Open in Model View">
                    <ActionIcon
                      data-xirang-open-in-model-view
                      size="lg"
                      variant="default"
                      radius="sm"
                      onClick={e => {
                        e.stopPropagation()
                        runtime.select('model')
                        diagram.navigateTo(
                          'model' as scalar.ViewId,
                          fromNode ?? undefined,
                          undefined,
                          stableElementId,
                        )
                      }}>
                      <IconZoomScan style={{ width: '70%' }} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {defaultView && (
                  <Tooltip label="Open default view">
                    <ActionIcon
                      size="lg"
                      variant="default"
                      radius="sm"
                      onClick={e => {
                        e.stopPropagation()
                        diagram.navigateTo(defaultView.id, fromNode ?? undefined)
                      }}>
                      <IconZoomScan style={{ width: '70%' }} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </ActionIconGroup>
            </HStack>
          </div>
          <MetadataProvider>
            <Tabs
              value={visibleTabs.includes(activeTab) ? activeTab : 'Properties'}
              onChange={v => setActiveTab(v as any)}
              variant="none"
              classNames={{
                root: styles.tabsRoot,
                list: styles.tabsList,
                tab: styles.tabsTab,
                panel: styles.tabsPanel,
              }}>
              <TabsList>
                {visibleTabs.map(tab => (
                  <TabsTab key={tab} value={tab}>
                    {tab}
                  </TabsTab>
                ))}
              </TabsList>

              <TabsPanel value="Properties">
                <ScrollArea scrollbars="y" type="scroll" offsetScrollbars>
                  <Box className={styles.propertiesGrid} pt={'xs'}>
                    <ElementDefinitionProperties
                      selected={runtime.selected}
                      stableElementId={stableElementId}
                    />
                    {elementTechnology && (
                      <ElementProperty title="technology">
                        {elementTechnology}
                      </ElementProperty>
                    )}
                    {elementLinks.length > 0 && (
                      <>
                        <PropertyLabel>links</PropertyLabel>
                        <HStack gap={'xs'} flexWrap="wrap">
                          {elementLinks.map((link, i) => <Link key={i} value={link} />)}
                        </HStack>
                      </>
                    )}
                    {elementMetadata && <ElementMetata value={elementMetadata} />}
                  </Box>
                </ScrollArea>
              </TabsPanel>

              {!isAddedElement && (
                <>
                  <TabsPanel value="Relationships">
                    {elementModel && (
                      <DiagramFeatures
                        overrides={{
                          enableRelationshipBrowser: false,
                          enableNavigateTo: false,
                        }}>
                        {opened && activeTab === 'Relationships' && (
                          <TabPanelRelationships
                            element={elementModel}
                            node={nodeModel ?? null} />
                        )}
                      </DiagramFeatures>
                    )}
                  </TabsPanel>

                  <TabsPanel value="Views">
                    <ScrollArea scrollbars="y" type="auto">
                      <Stack gap={'lg'}>
                        {viewsOf.length > 0 && (
                          <Box>
                            <Divider label="views of the element (scoped)" />
                            <Stack gap={'sm'}>
                              {viewsOf.map((view) => (
                                <ViewButton
                                  key={view.id}
                                  view={view}
                                  onNavigateTo={to => diagram.navigateTo(to as scalar.ViewId, fromNode ?? undefined)} />
                              ))}
                            </Stack>
                          </Box>
                        )}
                        {otherViews.length > 0 && (
                          <Box>
                            <Divider label="views including this element" />
                            <Stack gap={'sm'}>
                              {otherViews.map((view) => (
                                <ViewButton
                                  key={view.id}
                                  view={view}
                                  onNavigateTo={to => diagram.navigateTo(to as scalar.ViewId, fromNode ?? undefined)} />
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    </ScrollArea>
                  </TabsPanel>

                  <TabsPanel value="Structure">
                    {elementModel && (
                      <ScrollArea scrollbars="y" type="auto">
                        <TabPanelStructure element={elementModel} />
                      </ScrollArea>
                    )}
                  </TabsPanel>

                  {elementModel && (
                    <TabsPanel value="Deployments">
                      <ScrollArea scrollbars="y" type="auto">
                        <TabPanelDeployments elementFqn={elementModel.id} />
                      </ScrollArea>
                    </TabsPanel>
                  )}
                </>
              )}

              {hasContract && (
                <TabsPanel value="Contracts">
                  <ContractsTab
                    project={elementProjectId}
                    element={stableElementId}
                    active={activeTab === 'Contracts'}
                  />
                </TabsPanel>
              )}
              {hasDiff && (
                <TabsPanel value="Diff">
                  <DiffTab
                    element={stableElementId}
                    active={activeTab === 'Diff'}
                  />
                </TabsPanel>
              )}
            </Tabs>
          </MetadataProvider>
          <m.div
            className={styles.resizeHandle}
            drag
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }} />
        </m.div>
      </RemoveScroll>
    </m.dialog>
  )
}

const ViewButton = <A extends Any>({
  view,
  onNavigateTo,
}: {
  view: ComputedView<A> | DiagramView<A>
  onNavigateTo: OnNavigateTo<A>
}) => {
  return (
    <UnstyledButton className={styles.viewButton} onClick={e => onNavigateTo(view.id, e)}>
      <Group gap={6} align="start" wrap="nowrap">
        <ThemeIcon size={'sm'} variant="transparent">
          {view._type === 'deployment'
            ? <IconStack2 stroke={1.8} />
            : <IconZoomScan stroke={1.8} />}
        </ThemeIcon>
        <Box>
          <Text component="div" className={styles.viewButtonTitle} lineClamp={1}>
            {view.title || 'untitled'}
          </Text>
          {
            /* {view.description && (
            <Text component="div" mt={2} fz={'xs'} c={'dimmed'} lh={1.4} lineClamp={1}>
              {view.description}
            </Text>
          )} */
          }
        </Box>
      </Group>
    </UnstyledButton>
  )
}

function ElementProperty({
  title,
  emptyValue = `undefined`,
  children,
  style,
  ...props
}: PropsWithChildren<
  Omit<TextProps, 'title'> & {
    title: string
    emptyValue?: string
  }
>) {
  return (
    <>
      <PropertyLabel>{title}</PropertyLabel>
      <Text
        component="div"
        {...(isNullish(children) && { c: 'dimmed' })}
        fz={'md'}
        style={{
          whiteSpace: 'preserve-breaks',
          userSelect: 'all',
          ...style,
        }}
        {...props}
      >
        {children || emptyValue}
      </Text>
    </>
  )
}

function ElementMetata({
  value: metadata,
}: {
  value: NonNullable<Element['metadata']>
}) {
  const metadataEntries = entries(metadata).sort(([a], [b]) => a.localeCompare(b))

  return (
    <MetadataProvider>
      <>
        <PropertyLabel style={{ justifySelf: 'end', textAlign: 'right' }}>metadata</PropertyLabel>
        <Box
          className={css({
            display: 'grid',
            gridTemplateColumns: 'min-content 1fr',
            gridAutoRows: 'min-content',
            gap: `[12px 16px]`,
            alignItems: 'baseline',
            justifyItems: 'stretch',
          })}
        >
          {metadataEntries.map(([key, value]) => <MetadataValue key={key} label={key} value={value} />)}
        </Box>
      </>
    </MetadataProvider>
  )
}

function ElementTags({ tags, onClick }: { tags: readonly string[]; onClick: (tag: string) => void }) {
  return (
    <Flex gap={4} flex={1} mt={6} wrap="wrap">
      {tags.map((tag) => (
        <ElementTag
          key={tag}
          tag={tag}
          cursor="pointer"
          onClick={e => {
            e.stopPropagation()
            onClick(tag)
          }}
        />
      ))}
      {tags.length === 0 && <Badge radius={'sm'} size="sm" fw={600} color="gray">—</Badge>}
    </Flex>
  )
}
