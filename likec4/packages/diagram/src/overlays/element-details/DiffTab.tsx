import { Box, Stack, Text } from '@mantine/core'
import {
  type XirangDiffEntry,
  useXirangViewSources,
} from '../../xirang/ContractLoaderContext'
import { getStructuredContractDiff } from './ContractsTab'
import { XirangDiffViewer } from './XirangDiffViewer'

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

function DeclarationDiff({ fields }: { fields: DeclarationFieldDiff[] }) {
  return (
    <Stack gap="xs" data-xirang-declaration-diff>
      {fields.map(field => (
        <Box key={field.label} data-xirang-field-changed={field.changed || undefined}>
          <Text size="xs" fw={600} c="dimmed" mb={2}>{field.label}</Text>
          <XirangDiffViewer before={field.before} after={field.after} />
        </Box>
      ))}
    </Stack>
  )
}

function ContractRequirementDiff({
  requirement,
}: {
  requirement: ReturnType<typeof getStructuredContractDiff>['requirements'][number]
}) {
  return (
    <Box>
      <Text size="xs" fw={600} c="dimmed" mb={2}>{requirement.title}</Text>
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
