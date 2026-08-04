import {
  buildViewTree,
  renderTreeMarkdown,
  renderTreeText,
  treeToJson,
  type ViewTreeField,
} from '@likec4/generators'
import { Box, Button, Checkbox, Code, Group, ScrollArea, SegmentedControl } from '@mantine/core'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMemo } from 'react'
import { CopyToClipboard } from '../components/CopyToClipboard'
import { useCurrentView, useCurrentViewId } from '../hooks'
import * as styles from './styles.css'

type TreeFormat = 'text' | 'markdown' | 'json'

const formatOptions: { label: string; value: TreeFormat }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'JSON', value: 'json' },
]

const fieldOptions: { label: string; value: ViewTreeField }[] = [
  { label: 'Title', value: 'title' },
  { label: 'FQN', value: 'fqn' },
  { label: 'Kind', value: 'kind' },
]

const extensionFor = (format: string): string =>
  format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'

export function ViewAsTree() {
  const [view] = useCurrentView()
  const viewId = useCurrentViewId()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { format?: TreeFormat; fields?: ViewTreeField[] }
  const format = search.format ?? 'text'
  const fields = search.fields ?? ['title']

  const tree = useMemo(() => (view ? buildViewTree(view) : []), [view])
  const content = useMemo(() => {
    switch (format) {
      case 'markdown':
        return renderTreeMarkdown(tree, fields)
      case 'json':
        return JSON.stringify(treeToJson(tree), null, 2)
      default:
        return renderTreeText(tree, fields)
    }
  }, [format, fields, tree])

  const updateSearch = (patch: { format?: TreeFormat; fields?: ViewTreeField[] }) => {
    void navigate({
      to: './',
      viewTransition: false,
      search: prev => ({ ...prev, ...patch }),
    })
  }

  const download = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${viewId}.tree.${extensionFor(format)}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!view) {
    return <Box>Loading...</Box>
  }

  return (
    <Box className={styles.viewWithTopPadding} p="sm">
      <Group gap="sm" mb="sm" wrap="wrap">
        <SegmentedControl
          size="xs"
          aria-label="Tree format"
          value={format}
          onChange={value => updateSearch({ format: value })}
          data={formatOptions}
        />
        <Group gap="xs">
          {fieldOptions.map(option => (
            <Checkbox
              key={option.value}
              size="xs"
              label={option.label}
              checked={fields.includes(option.value)}
              onChange={event => {
                const next = event.currentTarget.checked
                  ? [...fields, option.value]
                  : fields.length > 1
                  ? fields.filter(field => field !== option.value)
                  : fields
                updateSearch({ fields: next })
              }}
            />
          ))}
        </Group>
        <Button size="xs" variant="light" onClick={download}>Download</Button>
      </Group>
      <ScrollArea
        className={styles.cssScrollArea}
        p={5}
        styles={{
          viewport: {
            borderRadius: 6,
          },
        }}>
        <Code block className={styles.cssCodeBlock}>
          {content}
        </Code>
        <Box data-xirang-tree-copy>
          <CopyToClipboard text={content} />
        </Box>
      </ScrollArea>
    </Box>
  )
}
