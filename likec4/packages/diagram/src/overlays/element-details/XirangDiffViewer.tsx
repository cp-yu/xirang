import { Box, SegmentedControl } from '@mantine/core'
import { type CSSProperties, type ReactNode, useState } from 'react'
import {
  acceptanceCaseHeadingPrefix,
  codeLineFlags,
  type DiffPiece,
  diffLines,
  type LineDiffRow,
  piecesOfSide,
  rowText,
  textDiffKind,
} from './xirangTextDiff'

type DiffViewMode = 'inline' | 'split'

const insertLine: CSSProperties = { background: 'var(--mantine-color-green-light)' }
const deleteLine: CSSProperties = { background: 'var(--mantine-color-red-light)' }
const insertPiece: CSSProperties = {
  background: 'var(--mantine-color-green-light-hover)',
  borderRadius: 2,
}
const deletePiece: CSSProperties = {
  background: 'var(--mantine-color-red-light-hover)',
  borderRadius: 2,
  textDecoration: 'line-through',
}

const textStyle = (monospace: boolean): CSSProperties => ({
  fontFamily: monospace ? 'var(--mantine-font-family-monospace)' : 'var(--mantine-font-family)',
  fontSize: monospace ? 12 : 14,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
})

const headingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--mantine-color-dimmed)',
  letterSpacing: '0.02em',
  paddingTop: 6,
}
const codeStyle: CSSProperties = {
  fontFamily: 'var(--mantine-font-family-monospace)',
  fontSize: 12,
}

/** Renders changed pieces; `skip` leading characters of the first equal piece (a markdown heading prefix) are not shown. */
function Pieces({ pieces, skip = 0 }: { pieces: DiffPiece[]; skip?: number }) {
  return pieces.map((piece, index) => {
    if (piece.type === 'equal') return index === 0 ? piece.text.slice(skip) : piece.text
    return (
      <span key={index} style={piece.type === 'insert' ? insertPiece : deletePiece}>
        {piece.text}
      </span>
    )
  })
}

/** One presented line: Acceptance Case title lines become small headings, code-like lines are monospace. */
function Line({
  text,
  pieces,
  code = false,
  style,
}: {
  text?: string | undefined
  pieces?: DiffPiece[] | undefined
  code?: boolean | undefined
  style?: CSSProperties | undefined
}) {
  const plain = text ?? pieces?.map(piece => piece.text).join('') ?? ''
  const headingPrefix = acceptanceCaseHeadingPrefix(plain)
  const lineStyle = headingPrefix > 0 ? headingStyle : code ? codeStyle : undefined
  return (
    <Box
      data-xirang-acceptance-case-title={headingPrefix > 0 || undefined}
      style={{ padding: '0 8px', minHeight: '1.6em', ...lineStyle, ...style }}
    >
      {pieces ? <Pieces pieces={pieces} skip={headingPrefix} /> : plain.slice(headingPrefix)}
    </Box>
  )
}

function InlineRows({ rows, code }: { rows: LineDiffRow[]; code: boolean[] }) {
  return rows.map((row, index) => {
    switch (row.type) {
      case 'equal':
        return <Line key={index} text={row.text} code={code[index]} />
      case 'insert':
        return <Line key={index} text={row.text} code={code[index]} style={insertLine} />
      case 'delete':
        return (
          <Line
            key={index}
            text={row.text}
            code={code[index]}
            style={{ ...deleteLine, textDecoration: 'line-through' }}
          />
        )
      case 'change':
        return <Line key={index} pieces={row.pieces} code={code[index]} />
    }
  })
}

const emptyCell = <Line text="" />

function SplitRows({ rows, code }: { rows: LineDiffRow[]; code: boolean[] }) {
  return rows.map((row, index) => {
    let left: ReactNode = emptyCell
    let right: ReactNode = emptyCell
    switch (row.type) {
      case 'equal':
        left = right = <Line text={row.text} code={code[index]} />
        break
      case 'delete':
        left = <Line text={row.text} code={code[index]} style={deleteLine} />
        break
      case 'insert':
        right = <Line text={row.text} code={code[index]} style={insertLine} />
        break
      case 'change':
        left = <Line pieces={piecesOfSide(row.pieces, 'before')} code={code[index]} style={deleteLine} />
        right = <Line pieces={piecesOfSide(row.pieces, 'after')} code={code[index]} style={insertLine} />
        break
    }
    return (
      <Box
        key={index}
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 2 }}
      >
        {left}
        {right}
      </Box>
    )
  })
}

function PlainLines({ text, style }: { text: string; style?: CSSProperties | undefined }) {
  const lines = text.split(/\r?\n/)
  const code = codeLineFlags(lines)
  return lines.map((line, index) => <Line key={index} text={line} code={code[index]} style={style} />)
}

/**
 * Text diff for prose and multi-line content.
 * ADDED / REMOVED content is shown in one column; MODIFIED content is shown as an inline
 * diff or aligned split columns, both with word-level highlighting of the changed fragments.
 */
export function XirangDiffViewer({
  before,
  after,
  monospace = false,
}: {
  before: string
  after: string
  monospace?: boolean
}) {
  const [mode, setMode] = useState<DiffViewMode>('inline')
  const kind = textDiffKind(before, after)
  const frame: CSSProperties = {
    ...textStyle(monospace),
    border: '1px solid var(--mantine-color-default-border)',
    borderRadius: 'var(--mantine-radius-sm)',
    overflow: 'hidden',
  }

  if (kind === 'added' || kind === 'removed') {
    const added = kind === 'added'
    return (
      <Box
        data-xirang-text-diff={kind}
        style={{ ...frame, ...(added ? insertLine : deleteLine), padding: '4px 0' }}
      >
        <PlainLines
          text={added ? after : before}
          style={added ? undefined : { textDecoration: 'line-through' }}
        />
      </Box>
    )
  }

  if (kind === 'unchanged') {
    return (
      <Box data-xirang-text-diff="unchanged" style={{ ...frame, padding: '4px 0' }}>
        <PlainLines text={after} />
      </Box>
    )
  }

  const rows = diffLines(before, after)
  const code = codeLineFlags(rows.map(rowText))
  return (
    <Box data-xirang-text-diff="modified" data-xirang-diff-mode={mode}>
      <SegmentedControl
        size="xs"
        mb={4}
        value={mode}
        onChange={value => setMode(value as DiffViewMode)}
        data={[{ value: 'inline', label: 'Inline' }, { value: 'split', label: 'Split' }]}
      />
      <Box data-xirang-split-diff={mode === 'split' || undefined} style={{ ...frame, padding: '4px 0' }}>
        {mode === 'split' ? <SplitRows rows={rows} code={code} /> : <InlineRows rows={rows} code={code} />}
      </Box>
    </Box>
  )
}

/** Single-line presentation of a short value: `before → after`, or just the value when added / removed / unchanged. */
export function XirangValueDiff({ before, after }: { before: string; after: string }) {
  const kind = textDiffKind(before, after)
  const base: CSSProperties = { ...textStyle(false), padding: '0 6px', borderRadius: 3 }
  return (
    <Box data-xirang-value-diff={kind} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'baseline' }}>
      {kind === 'modified' && (
        <>
          <span style={{ ...base, ...deleteLine, textDecoration: 'line-through' }}>{before}</span>
          <span aria-hidden>→</span>
          <span style={{ ...base, ...insertLine }}>{after}</span>
        </>
      )}
      {kind === 'added' && <span style={{ ...base, ...insertLine }}>{after}</span>}
      {kind === 'removed' && <span style={{ ...base, ...deleteLine, textDecoration: 'line-through' }}>{before}</span>}
      {kind === 'unchanged' && <span style={base}>{after === '' ? '—' : after}</span>}
    </Box>
  )
}
