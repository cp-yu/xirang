import { RichText } from '@likec4/core'
import { Box, Code, Group, Stack, Text } from '@mantine/core'
import {
  type XirangDiffEntry,
  useXirangViewSources,
} from '../../xirang/ContractLoaderContext'
import {
  OperationBadge,
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

/**
 * Editor-style dual-pane diff: left panel shows removed lines (red bg),
 * right panel shows added lines (green bg), unchanged lines on both sides.
 */
function DualPaneTextDiff({ before, after }: { before: string; after: string }) {
  const lines = createTextDiff(before, after)
  // Build left/right content arrays
  const left: Array<{
    text: string
    op: 'removed' | 'unchanged'
    words?: Array<{ operation: 'REMOVED' | 'ADDED' | 'UNCHANGED'; text: string }>
  }> = []
  const right: Array<{
    text: string
    op: 'added' | 'unchanged'
    words?: Array<{ operation: 'REMOVED' | 'ADDED' | 'UNCHANGED'; text: string }>
  }> = []
  for (const line of lines) {
    if (line.operation === 'REMOVED') {
      left.push({ text: line.text, op: 'removed', words: line.words })
      right.push({ text: '', op: 'unchanged' })
    } else if (line.operation === 'ADDED') {
      left.push({ text: '', op: 'unchanged' })
      right.push({ text: line.text, op: 'added', words: line.words })
    } else {
      left.push({ text: line.text, op: 'unchanged' })
      right.push({ text: line.text, op: 'unchanged' })
    }
  }
  const maxLines = Math.max(left.length, right.length, 1)
  const lineNumWidth = String(maxLines).length

  const renderCell = (text: string, words?: Array<{ operation: string; text: string }>) => {
    if (!words) return <>{text || '\u00A0'}</>
    return (
      <>
        {words.map((word, i) => {
          if (word.operation === 'UNCHANGED') return <span key={i} style={{ opacity: 0.7 }}>{word.text}</span>
          if (word.operation === 'REMOVED') return <span key={i} style={{ background: 'rgba(255,0,0,0.2)', fontWeight: 700 }}>{word.text}</span>
          if (word.operation === 'ADDED') return <span key={i} style={{ background: 'rgba(0,200,0,0.2)', fontWeight: 700 }}>{word.text}</span>
          return <span key={i}>{word.text}</span>
        })}
      </>
    )
  }

  return (
    <Group gap={0} wrap="nowrap" align="stretch" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 }}>
      {/* Left: Before */}
      <Box style={{ flex: 1, minWidth: 0, overflow: 'auto', maxHeight: '60vh' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {left.map((line, i) => (
              <tr
                key={i}
                style={{
                  background: line.op === 'removed' ? 'rgba(255, 0, 0, 0.08)' : 'transparent',
                }}
              >
                <td style={{ width: `${lineNumWidth + 1}ch`, padding: '0 4px', textAlign: 'right', color: 'var(--mantine-color-dimmed)', userSelect: 'none', borderRight: '1px solid var(--mantine-color-default-border)' }}>
                  {line.text !== '' ? String(i + 1).padStart(lineNumWidth) : ''}
                </td>
                <td style={{ padding: '0 4px', whiteSpace: 'pre-wrap', opacity: line.op === 'unchanged' ? 0.7 : 1 }}>
                  {renderCell(line.text, line.words)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      {/* Right: After */}
      <Box style={{ flex: 1, minWidth: 0, overflow: 'auto', maxHeight: '60vh', borderLeft: '1px solid var(--mantine-color-default-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {right.map((line, i) => (
              <tr
                key={i}
                style={{
                  background: line.op === 'added' ? 'rgba(0, 200, 0, 0.08)' : 'transparent',
                }}
              >
                <td style={{ width: `${lineNumWidth + 1}ch`, padding: '0 4px', textAlign: 'right', color: 'var(--mantine-color-dimmed)', userSelect: 'none', borderRight: '1px solid var(--mantine-color-default-border)' }}>
                  {line.text !== '' ? String(i + 1).padStart(lineNumWidth) : ''}
                </td>
                <td style={{ padding: '0 4px', whiteSpace: 'pre-wrap', opacity: line.op === 'unchanged' ? 0.7 : 1 }}>
                  {renderCell(line.text, line.words)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <DualPaneTextDiff before={field.before} after={field.after} />
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

function ContractRequirementDiff({
  req,
}: {
  req: {
    identity: string
    title: string
    text: TextDiffLine[]
    scenarios: Array<{
      identity: string
      title: string
      text: TextDiffLine[]
    }>
  }
}) {
  const hasChanges = req.text.some(l => l.operation !== 'UNCHANGED')
    || req.scenarios.some(s => s.text.some(l => l.operation !== 'UNCHANGED'))
  const beforeLines = req.text.filter(l => l.operation !== 'ADDED').map(l => l.text)
  const afterLines = req.text.filter(l => l.operation !== 'REMOVED').map(l => l.text)

  return (
    <Box
      p={4}
      style={{
        borderRadius: 4,
        ...(hasChanges ? { background: 'rgba(250, 176, 5, 0.1)' } : {}),
      }}
    >
      <Text size="xs" fw={600} c="dimmed" mb={2}>{req.title}</Text>
      <DualPaneTextDiff before={beforeLines.join('\n')} after={afterLines.join('\n')} />
      {req.scenarios.map(scenario => {
        const sBefore = scenario.text.filter(l => l.operation !== 'ADDED').map(l => l.text)
        const sAfter = scenario.text.filter(l => l.operation !== 'REMOVED').map(l => l.text)
        return (
          <Box key={scenario.identity} pl="sm" mt={2}>
            <Text size="xs" c="dimmed" mb={2}>{scenario.title}</Text>
            <DualPaneTextDiff before={sBefore.join('\n')} after={sAfter.join('\n')} />
          </Box>
        )
      })}
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
          {contractDiff.requirements.map(req => (
            <ContractRequirementDiff key={req.identity} req={req} />
          ))}
        </Stack>
      )}
      {fields.length === 0 && contractDiff.requirements.length === 0 && contractDiff.diagnostics.length === 0 && (
        <Text size="sm" c="dimmed">No changes for this element</Text>
      )}
    </Stack>
  )
}

/** Export for reuse in MetamodelDiffModal */
export { DualPaneTextDiff }