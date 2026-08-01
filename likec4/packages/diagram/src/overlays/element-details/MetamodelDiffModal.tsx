import { Modal, Stack } from '@mantine/core'
import type { XirangDiffEntry, XirangDiffOperation } from '../../xirang/ContractLoaderContext'
import { XirangDiffViewer } from './XirangDiffViewer'

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
        <XirangDiffViewer
          before={formatJson(entry.before)}
          after={formatJson(entry.after)}
        />
      </Stack>
    </Modal>
  )
}
