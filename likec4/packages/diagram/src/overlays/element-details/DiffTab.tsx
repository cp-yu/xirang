import { Box, Stack, Text } from '@mantine/core'
import {
  type XirangDiffEntry,
  useXirangViewSources,
} from '../../xirang/ContractLoaderContext'
import { getStructuredContractDiff } from './ContractsTab'
import { XirangDiffViewer, XirangValueDiff } from './XirangDiffViewer'

interface DeclarationFieldDiff {
  label: string
  before: string
  after: string
  changed: boolean
}

export function declarationFieldDiffs(
  entry: XirangDiffEntry | undefined,
): DeclarationFieldDiff[] {
  if (!entry) return []
  const before = entry.before as Record<string, unknown> | undefined
  const after = entry.after as Record<string, unknown> | undefined
  const toString = (value: unknown): string => typeof value === 'string' ? value : JSON.stringify(value) ?? ''
  return [
    {
      label: 'kind',
      before: toString(before?.['kind']),
      after: toString(after?.['kind']),
      changed: before?.['kind'] !== after?.['kind'],
    },
    {
      label: 'parent',
      before: toString(before?.['parent']),
      after: toString(after?.['parent']),
      changed: before?.['parent'] !== after?.['parent'],
    },
    {
      label: 'title',
      before: toString(before?.['title']),
      after: toString(after?.['title']),
      changed: before?.['title'] !== after?.['title'],
    },
    {
      label: 'definition',
      before: toString(before?.['definition'] ?? before?.['description']),
      after: toString(after?.['definition'] ?? after?.['description']),
      changed:
        (before?.['definition'] ?? before?.['description']) !== (after?.['definition'] ?? after?.['description']),
    },
  ]
}

const shortValueLabels = new Set(['kind', 'parent', 'title'])

/** Splits declaration fields into the changed ones (presented in full) and the unchanged ones (collapsed to a summary). */
export function partitionDeclarationFields(fields: DeclarationFieldDiff[]): {
  changed: DeclarationFieldDiff[]
  unchanged: DeclarationFieldDiff[]
} {
  return {
    changed: fields.filter(field => field.changed),
    unchanged: fields.filter(field => !field.changed),
  }
}

function DeclarationDiff({ fields }: { fields: DeclarationFieldDiff[] }) {
  const { changed, unchanged } = partitionDeclarationFields(fields)
  return (
    <Stack gap="xs" data-xirang-declaration-diff>
      {changed.map(field => (
        <Box key={field.label} data-xirang-field-changed>
          <Text size="xs" fw={600} c="dimmed" mb={2}>{field.label}</Text>
          {shortValueLabels.has(field.label)
            ? <XirangValueDiff before={field.before} after={field.after} />
            : <XirangDiffViewer before={field.before} after={field.after} />}
        </Box>
      ))}
      {unchanged.length > 0 && (
        <Box component="details" data-xirang-unchanged-fields>
          <Text component="summary" size="xs" c="dimmed" style={{ cursor: 'pointer' }}>
            Unchanged: {unchanged.map(field => field.label).join(', ')}
          </Text>
          <Stack gap={4} mt={4}>
            {unchanged.map(field => (
              <Box key={field.label}>
                <Text size="xs" fw={600} c="dimmed">{field.label}</Text>
                <XirangValueDiff before={field.before} after={field.after} />
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}

const operationBadge = { ADDED: 'Added', MODIFIED: 'Modified', REMOVED: 'Removed' } as const

function ContractRequirementDiff({
  requirement,
}: {
  requirement: ReturnType<typeof getStructuredContractDiff>['requirements'][number]
}) {
  return (
    <Box data-xirang-requirement-diff={requirement.operation}>
      <Text size="xs" fw={600} c="dimmed" mb={2}>
        {requirement.title} · {operationBadge[requirement.operation]}
      </Text>
      <XirangDiffViewer before={requirement.before} after={requirement.after} />
    </Box>
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
    <Stack gap="md" p="sm" h="100%" style={{ minHeight: 0, overflowY: 'auto' }} data-xirang-diff-tab>
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
          {contractDiff.requirements.map(requirement => (
            <ContractRequirementDiff key={requirement.identity} requirement={requirement} />
          ))}
        </Stack>
      )}
      {fields.length === 0 && contractDiff.requirements.length === 0 && contractDiff.diagnostics.length === 0 && (
        <Text size="sm" c="dimmed">No changes for this element</Text>
      )}
    </Stack>
  )
}
