import { Box, Code, Group, Modal, Stack, Text } from '@mantine/core'
import { type XirangDiffEntry, type XirangDiffOperation } from '../../xirang/ContractLoaderContext'

const operationLabel: Record<XirangDiffOperation, string> = {
  ADDED: '+',
  MODIFIED: '~',
  REMOVED: '-',
}

function formatJson(value: unknown): string {
  if (value === undefined || value === null) return '(empty)'
  return JSON.stringify(value, null, 2)
}

export function MetamodelDiffModal({
  entry,
  opened,
  onClose,
}: {
  entry: XirangDiffEntry | null
  opened: boolean
  onClose: () => void
}) {
  if (!entry) return null

  const title = `${operationLabel[entry.operation]} ${entry.kind} ${entry.identity}`

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      data-xirang-metamodel-diff
    >
      <Stack gap="md">
        <Group gap="xs" wrap="nowrap" align="stretch" style={{ minHeight: 200 }}>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={600} c="dimmed" mb={4}>Before</Text>
            <Code
              block
              style={{
                whiteSpace: 'pre',
                overflow: 'auto',
                maxHeight: '60vh',
                opacity: entry.operation === 'ADDED' ? 0.4 : 1,
              }}
            >
              {formatJson(entry.before)}
            </Code>
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" fw={600} c="dimmed" mb={4}>After</Text>
            <Code
              block
              style={{
                whiteSpace: 'pre',
                overflow: 'auto',
                maxHeight: '60vh',
                opacity: entry.operation === 'REMOVED' ? 0.4 : 1,
              }}
            >
              {formatJson(entry.after)}
            </Code>
          </Box>
        </Group>
      </Stack>
    </Modal>
  )
}