import { Box, useComputedColorScheme } from '@mantine/core'
import { useEffect, useRef } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

export function XirangDiffViewer({
  before,
  after,
}: {
  before: string
  after: string
}) {
  const colorScheme = useComputedColorScheme('light')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!before && after && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [after, before])

  return (
    <Box ref={scrollRef} data-xirang-split-diff style={{ overflow: 'auto', maxHeight: '60vh' }}>
      <Box style={{ minWidth: 640 }}>
        <ReactDiffViewer
          oldValue={before}
          newValue={after}
          splitView
          compareMethod={DiffMethod.WORDS_WITH_SPACE}
          leftTitle="Before"
          rightTitle="After"
          showDiffOnly={false}
          hideSummary
          disableWorker
          useDarkTheme={colorScheme === 'dark'}
          styles={{
            diffContainer: { fontSize: 11 },
            contentText: { fontFamily: 'monospace', lineHeight: 1.5 },
            line: { minHeight: 20 },
            titleBlock: { padding: '6px 8px', fontSize: 11, fontWeight: 600 },
          }}
        />
      </Box>
    </Box>
  )
}
