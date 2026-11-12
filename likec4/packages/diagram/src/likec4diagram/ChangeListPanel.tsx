import { ActionIcon, Box, Group, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconChevronDown, IconChevronRight, IconInfoCircle } from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import {
  type ChangedElement,
  type ChangedRelationship,
  filterByText,
  groupByOperation,
  XIRANG_OPERATION_COLORS,
  XIRANG_OPERATION_GLYPHS,
} from '../xirang/changePanelModel'
import type { XirangDiffOperation } from '../xirang/ContractLoaderContext'

/** The text filter appears once the lists hold more than this many rows in total. */
export const CHANGE_LIST_FILTER_THRESHOLD = 8

/** Comfortable touch target: rows and header buttons are at least this tall. */
const ROW_MIN_HEIGHT = 32

function GroupHeader({ operation, count }: { operation: XirangDiffOperation; count: number }) {
  return (
    <Text
      size="xs"
      fw={700}
      pl={4}
      pt={4}
      tt="uppercase"
      style={{ color: XIRANG_OPERATION_COLORS[operation], letterSpacing: '0.04em' }}
    >
      {operationNames[operation]} · {count}
    </Text>
  )
}

const operationNames: Record<XirangDiffOperation, string> = {
  ADDED: 'Added',
  MODIFIED: 'Modified',
  REMOVED: 'Removed',
}

function Glyph({ operation, sectionsOnly }: { operation: XirangDiffOperation; sectionsOnly?: boolean }) {
  return (
    <Text
      component="span"
      size="sm"
      fw={700}
      data-xirang-operation-glyph={operation}
      style={{ color: XIRANG_OPERATION_COLORS[operation], width: 14, textAlign: 'center', flexShrink: 0 }}
      title={sectionsOnly ? 'Contract sections changed' : operationNames[operation]}
    >
      {XIRANG_OPERATION_GLYPHS[operation]}
    </Text>
  )
}

function SectionHeader({ label, count, opened, onToggle, testId }: {
  label: string
  count: number
  opened: boolean
  onToggle: () => void
  testId: string
}) {
  return (
    <UnstyledButton
      data-xirang-change-list-toggle={testId}
      onClick={onToggle}
      aria-expanded={opened}
      style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4, minHeight: ROW_MIN_HEIGHT }}
    >
      {opened ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
      <Text size="sm" fw={700}>{label} <Text component="span" size="xs" c="dimmed" fw={500}>{count}</Text></Text>
    </UnstyledButton>
  )
}

export interface ChangeListPanelProps {
  elements: readonly ChangedElement[]
  relationships: readonly ChangedRelationship[]
  /** Reset filter and collapse state whenever the selected Change revision changes. */
  revision: string
  onLocateElement(element: ChangedElement): void
  onOpenElementDetails(element: ChangedElement): void
  onLocateRelationship(relationship: ChangedRelationship): void
  onOpenRelationshipDetails(relationship: ChangedRelationship): void
}

/** Changed Elements / Changed Relationships lists of the Change panel; rows locate, secondary buttons open details. */
export function ChangeListPanel({
  elements,
  relationships,
  revision,
  onLocateElement,
  onOpenElementDetails,
  onLocateRelationship,
  onOpenRelationshipDetails,
}: ChangeListPanelProps) {
  const [query, setQuery] = useState('')
  const [elementsOpened, setElementsOpened] = useState(true)
  const [relationshipsOpened, setRelationshipsOpened] = useState(false)
  useEffect(() => {
    setQuery('')
    setElementsOpened(true)
    setRelationshipsOpened(false)
  }, [revision])

  const visibleElements = useMemo(
    () => filterByText(elements, query, element => [element.title, element.identity, element.parent ?? '']),
    [elements, query],
  )
  const visibleRelationships = useMemo(
    () =>
      filterByText(relationships, query, relationship => [
        relationship.identity,
        relationship.sourceTitle,
        relationship.targetTitle,
      ]),
    [relationships, query],
  )
  const elementGroups = useMemo(() => groupByOperation(visibleElements), [visibleElements])
  const relationshipGroups = useMemo(() => groupByOperation(visibleRelationships), [visibleRelationships])
  const filtering = query.trim() !== ''

  if (elements.length === 0 && relationships.length === 0) return null

  return (
    <Stack gap={4} data-xirang-change-list>
      {elements.length + relationships.length > CHANGE_LIST_FILTER_THRESHOLD && (
        <TextInput
          size="xs"
          placeholder="Filter changes"
          aria-label="Filter changes"
          data-xirang-change-filter
          value={query}
          onChange={event => setQuery(event.currentTarget.value)}
        />
      )}
      <Box
        className="nowheel nopan nodrag"
        data-xirang-change-list-scroll
        style={{ maxHeight: 'min(360px, 45vh)', overflowY: 'auto', overscrollBehavior: 'contain' }}
      >
        {elements.length > 0 && (
          <Stack gap={2} data-xirang-changed-elements>
            <SectionHeader
              label="Changed Elements"
              count={visibleElements.length}
              opened={elementsOpened || filtering}
              onToggle={() => setElementsOpened(value => !value)}
              testId="elements"
            />
            {(elementsOpened || filtering) && elementGroups.map(group => (
              <Stack key={group.operation} gap={0} data-xirang-change-group={group.operation}>
                <GroupHeader operation={group.operation} count={group.items.length} />
                {group.items.map(element => (
                  <Group key={element.identity} gap={2} wrap="nowrap" align="center">
                    <UnstyledButton
                      data-xirang-changed-element={element.identity}
                      data-xirang-changed-operation={element.operation}
                      onClick={() => onLocateElement(element)}
                      style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '3px 4px', minHeight: ROW_MIN_HEIGHT }}
                    >
                      <Glyph operation={element.operation} sectionsOnly={element.sectionsOnly} />
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" lh={1.3} truncate>
                          {element.title}
                          {element.sectionCount > 0 && (
                            <Text component="span" size="xs" c="dimmed">
                              {' '}· {element.sectionCount} {element.sectionCount === 1 ? 'section' : 'sections'}
                            </Text>
                          )}
                        </Text>
                        <Text fz={11} lh={1.3} c="dimmed" truncate>
                          {element.parent ? `${element.identity} · in ${element.parent}` : element.identity}
                        </Text>
                      </Box>
                    </UnstyledButton>
                    <ActionIcon
                      size="lg"
                      variant="subtle"
                      color="gray"
                      aria-label={`Open details of ${element.title}`}
                      data-xirang-changed-element-details={element.identity}
                      onClick={() => onOpenElementDetails(element)}
                    >
                      <IconInfoCircle size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            ))}
          </Stack>
        )}
        {relationships.length > 0 && (
          <Stack gap={2} mt={elements.length > 0 ? 6 : 0} data-xirang-changed-relationships>
            <SectionHeader
              label="Changed Relationships"
              count={visibleRelationships.length}
              opened={relationshipsOpened || filtering}
              onToggle={() => setRelationshipsOpened(value => !value)}
              testId="relationships"
            />
            {(relationshipsOpened || filtering) && relationshipGroups.map(group => (
              <Stack key={group.operation} gap={0} data-xirang-change-group={group.operation}>
                <GroupHeader operation={group.operation} count={group.items.length} />
                {group.items.map(relationship => (
                  <Group key={relationship.identity} gap={2} wrap="nowrap" align="center">
                    <UnstyledButton
                      data-xirang-changed-relationship={relationship.identity}
                      data-xirang-changed-operation={relationship.operation}
                      onClick={() => onLocateRelationship(relationship)}
                      style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '3px 4px', minHeight: ROW_MIN_HEIGHT }}
                    >
                      <Glyph operation={relationship.operation} />
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" lh={1.3} truncate>
                          {relationship.sourceTitle} → {relationship.kind} → {relationship.targetTitle}
                        </Text>
                        <Text fz={11} lh={1.3} c="dimmed" truncate>{relationship.identity}</Text>
                      </Box>
                    </UnstyledButton>
                    <ActionIcon
                      size="lg"
                      variant="subtle"
                      color="gray"
                      aria-label={`Open details of ${relationship.identity}`}
                      data-xirang-changed-relationship-details={relationship.identity}
                      onClick={() => onOpenRelationshipDetails(relationship)}
                    >
                      <IconInfoCircle size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
