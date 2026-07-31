import { RichText } from '@likec4/core'
import { Box, Code, Group, Stack, Text } from '@mantine/core'
import {
  type XirangDiffEntry,
  useXirangViewSources,
} from '../../xirang/ContractLoaderContext'
import {
  OperationBadge,
  TextDiff,
  getStructuredContractDiff,
  createTextDiff,
  type TextDiffLine,
} from './ContractsTab'

interface DeclarationFieldDiff {
  label: string
  before: string
  after: string
  changed: boolean
  longText?: boolean
}

export function declarationFieldDiffs(
  entry: XirangDiffEntry | undefined,
): DeclarationFieldDiff[] {
  if (!entry) return []
  const before = entry.before as Record<string, unknown> | undefined
  const after = entry.after as Record<string, unknown> | undefined
  const toStr = (v: unknown): string => typeof v === 'string' ? v : JSON.stringify(v) ?? ''
  return [
    { label: 'kind', before: toStr(before?.['kind']), after: toStr(after?.['kind']), changed: before?.['kind'] !== after?.['kind'] },
    { label: 'parent', before: toStr(before?.['parent']), after: toStr(after?.['parent']), changed: before?.['parent'] !== after?.['parent'] },
    { label: 'title', before: toStr(before?.['title']), after: toStr(after?.['title']), changed: before?.['title'] !== after?.['title'] },
    { label: 'definition', before: toStr(before?.['definition'] ?? before?.['description']), after: toStr(after?.['definition'] ?? after?.['description']), changed: true, longText: true },
  ]
}

function DualPaneDiff({
  before,
  after,
  changed,
}: {
  before: string
  after: string
  changed: boolean
}) {
  return (
    <Group gap={0} wrap="nowrap" align="stretch" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }}>
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          padding: 4,
          ...(changed ? { background: 'rgba(250, 176, 5, 0.08)' } : {}),
        }}
      >
        <Code
          block
          style={{
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '60vh',
            fontSize: 11,
            opacity: changed ? 1 : 0.6,
          }}
        >
          {before || '—'}
        </Code>
      </Box>
      <Box
        style={{
          flex: 1,
          minWidth: 0,
          padding: 4,
          ...(changed ? { background: 'rgba(250, 176, 5, 0.08)' } : {}),
        }}
      >
        <Code
          block
          style={{
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '60vh',
            fontSize: 11,
          }}
        >
          {after || '—'}
        </Code>
      </Box>
    </Group>
  )
}

function DeclarationDiff({ fields }: { fields: DeclarationFieldDiff[] }) {
  return (
    <Stack gap="xs" data-xirang-declaration-diff>
      <Group gap="xs" wrap="nowrap" px={4}>
        <Text size="xs" fw={600} c="dimmed" style={{ flex: 1, minWidth: 0 }}>Before</Text>
        <Text size="xs" fw={600} c="dimmed" style={{ flex: 1, minWidth: 0 }}>After</Text>
      </Group>
      {fields.map(field => (
        <Box
          key={field.label}
          p={4}
          style={{
            borderRadius: 4,
            ...(field.changed ? { background: 'rgba(250, 176, 5, 0.1)' } : {}),
          }}
        >
          <Text size="xs" fw={600} c="dimmed" mb={2}>{field.label}</Text>
          {field.longText ? (
            <DualPaneDiff before={field.before} after={field.after} changed={field.changed} />
          ) : (
            <Group gap={0} wrap="nowrap" align="stretch" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }}>
              <Box
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '4px 8px',
                  ...(field.changed ? { background: 'rgba(250, 176, 5, 0.08)' } : {}),
                }}
              >
                <Text size="sm" style={{ opacity: field.changed ? 0.6 : 1 }}>{field.before || '—'}</Text>
              </Box>
              <Box
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '4px 8px',
                  ...(field.changed ? { background: 'rgba(250, 176, 5, 0.08)' } : {}),
                }}
              >
                <Text size="sm" fw={field.changed ? 600 : 400}>{field.after || '—'}</Text>
              </Box>
            </Group>
          )}
        </Box>
      ))}
    </Stack>
  )
}

function ContractDiffSide({
  requirements,
  label,
  operation,
}: {
  requirements: Array<{
    identity: string
    title: string
    text: TextDiffLine[]
    scenarios: Array<{
      identity: string
      title: string
      text: TextDiffLine[]
    }>
  }>
  label: string
  operation: 'ADDED' | 'REMOVED' | 'UNCHANGED'
}) {
  if (requirements.length === 0) {
    return (
      <Box p="sm" style={{ opacity: 0.4 }}>
        <Text size="xs" c="dimmed">(empty)</Text>
      </Box>
    )
  }
  return (
    <Stack gap="xs">
      {requirements.map(req => {
        const isRemoved = operation === 'REMOVED' || req.text.some(l => l.operation === 'REMOVED')
        const isAdded = operation === 'ADDED' || req.text.some(l => l.operation === 'ADDED')
        const opacity = isRemoved && !isAdded ? 0.4 : 1
        return (
          <Box
            key={req.identity}
            p={4}
            style={{
              borderRadius: 4,
              opacity,
              ...(isRemoved || isAdded ? { background: 'rgba(250, 176, 5, 0.1)' } : {}),
            }}
          >
            <Text size="xs" fw={600} c="dimmed" mb={2}>{req.title}</Text>
            <Code
              block
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 11,
                ...(isRemoved ? { opacity: 0.5 } : {}),
              }}
            >
              {req.text.map((line, i) => (
                <Box
                  key={i}
                  component="span"
                  display="block"
                  {...(line.operation === 'ADDED' ? { c: 'green' } : line.operation === 'REMOVED' ? { c: 'red' } : {})}
                  {...(line.operation === 'UNCHANGED' ? { style: { opacity: .65 } } : {})}
                >
                  {line.text}
                  {'\n'}
                </Box>
              ))}
            </Code>
          </Box>
        )
      })}
    </Stack>
  )
}

export function DiffTab({
  element,
  active,
}: {
  element: string
  active: boolean
}) {
  const runtime = useXirangViewSources()
  if (!active) return null

  const source = runtime.selected
  if (source.source !== 'change-derived-view') return null

  const declarationEntry = source.diff?.entries.find(
    entry => entry.kind === 'element-declaration' && entry.identity === element,
  )
  const fields = declarationFieldDiffs(declarationEntry)
  const contractDiff = getStructuredContractDiff(source, element)

  return (
    <Stack gap="md" p="sm" data-xirang-diff-tab>
      {fields.length > 0 && (
        <Stack gap="xs">
          <Text size="sm" fw={600}>Declaration</Text>
          <DeclarationDiff fields={fields} />
        </Stack>
      )}
      {(contractDiff.requirements.length > 0 || contractDiff.diagnostics.length > 0) && (
        <Stack gap="xs" data-xirang-contract-diff>
          <Text size="sm" fw={600}>Contract</Text>
          {contractDiff.diagnostics.map((diagnostic, index) => (
            <Text key={index} size="xs" c={diagnostic.level === 'ERROR' ? 'red' : 'yellow'}>
              {diagnostic.path}: {diagnostic.message}
            </Text>
          ))}
          <Group gap="md" wrap="nowrap" align="stretch">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" fw={600} c="dimmed" mb={4}>Before</Text>
              <ContractDiffSide
                requirements={contractDiff.requirements}
                label="before"
                operation="REMOVED"
              />
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" fw={600} c="dimmed" mb={4}>After</Text>
              <ContractDiffSide
                requirements={contractDiff.requirements}
                label="after"
                operation="ADDED"
              />
            </Box>
          </Group>
        </Stack>
      )}
      {fields.length === 0 && contractDiff.requirements.length === 0 && contractDiff.diagnostics.length === 0 && (
        <Text size="sm" c="dimmed">No changes for this element</Text>
      )}
    </Stack>
  )
}