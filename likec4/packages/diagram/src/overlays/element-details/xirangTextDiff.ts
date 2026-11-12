/**
 * Pure text-diff logic for the Semantic Browser Diff presentation.
 *
 * Prose is compared line by line; lines that changed in place are compared again
 * on word level (Intl.Segmenter, character level when unavailable) so that only
 * the really changed fragment is highlighted, also for text without spaces.
 */

export type DiffPieceType = 'equal' | 'delete' | 'insert'

export interface DiffPiece {
  type: DiffPieceType
  text: string
}

export type LineDiffRow =
  | { type: 'equal'; text: string }
  | { type: 'delete'; text: string }
  | { type: 'insert'; text: string }
  | { type: 'change'; pieces: DiffPiece[] }

export type TextDiffKind = 'added' | 'removed' | 'modified' | 'unchanged'

export type Tokenizer = (text: string) => string[]

/** Above this many table cells a token diff degrades to replace-all instead of an LCS table. */
const MAX_LCS_CELLS = 4_000_000

/** Minimal share of unchanged characters for two lines to be shown as one changed line. */
const MIN_LINE_SIMILARITY = 0.4

const wordSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'word' })
  : undefined

export function splitChars(text: string): string[] {
  return Array.from(text)
}

/** Word segments (including whitespace and punctuation segments); characters when Intl.Segmenter is unavailable. */
export function splitWords(text: string): string[] {
  if (!wordSegmenter) return splitChars(text)
  return Array.from(wordSegmenter.segment(text), part => part.segment)
}

export function textDiffKind(before: string, after: string): TextDiffKind {
  if (before === after) return 'unchanged'
  if (before === '') return 'added'
  if (after === '') return 'removed'
  return 'modified'
}

interface SequenceOp {
  type: DiffPieceType
  value: string
}

function lcsOps(a: string[], b: string[]): SequenceOp[] {
  const n = a.length
  const m = b.length
  if (n === 0) return b.map(value => ({ type: 'insert', value }))
  if (m === 0) return a.map(value => ({ type: 'delete', value }))
  if (n * m > MAX_LCS_CELLS) {
    return [
      ...a.map((value): SequenceOp => ({ type: 'delete', value })),
      ...b.map((value): SequenceOp => ({ type: 'insert', value })),
    ]
  }
  const width = m + 1
  const table = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j]
        ? table[(i + 1) * width + j + 1]! + 1
        : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!)
    }
  }
  const ops: SequenceOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', value: a[i]! })
      i++
      j++
    } else if (table[(i + 1) * width + j]! >= table[i * width + j + 1]!) {
      ops.push({ type: 'delete', value: a[i++]! })
    } else {
      ops.push({ type: 'insert', value: b[j++]! })
    }
  }
  while (i < n) ops.push({ type: 'delete', value: a[i++]! })
  while (j < m) ops.push({ type: 'insert', value: b[j++]! })
  return ops
}

/** Shortest edit script; common prefix and suffix are stripped first so that appended text stays cheap. */
function diffSequence(a: string[], b: string[]): SequenceOp[] {
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  const equal = (values: string[]): SequenceOp[] => values.map(value => ({ type: 'equal', value }))
  return [
    ...equal(a.slice(0, start)),
    ...lcsOps(a.slice(start, endA), b.slice(start, endB)),
    ...equal(a.slice(endA)),
  ]
}

function isBlank(value: string): boolean {
  return value.trim() === ''
}

/** Joins ops into pieces: blank equal tokens between two changes join the change, every change run lists deletions before insertions. */
function toPieces(ops: SequenceOp[]): DiffPiece[] {
  const pieces: DiffPiece[] = []
  let deleted = ''
  let inserted = ''
  let equal = ''
  const flushChange = () => {
    if (deleted) pieces.push({ type: 'delete', text: deleted })
    if (inserted) pieces.push({ type: 'insert', text: inserted })
    deleted = ''
    inserted = ''
  }
  const flushEqual = () => {
    if (equal) pieces.push({ type: 'equal', text: equal })
    equal = ''
  }
  ops.forEach((op, index) => {
    const bridgesChanges = op.type === 'equal'
      && isBlank(op.value)
      && ops[index - 1]?.type !== undefined && ops[index - 1]!.type !== 'equal'
      && ops[index + 1]?.type !== undefined && ops[index + 1]!.type !== 'equal'
    if (op.type === 'equal' && !bridgesChanges) {
      flushChange()
      equal += op.value
      return
    }
    flushEqual()
    if (bridgesChanges) {
      deleted += op.value
      inserted += op.value
    } else if (op.type === 'delete') {
      deleted += op.value
    } else {
      inserted += op.value
    }
  })
  flushChange()
  flushEqual()
  return pieces
}

export function diffWords(before: string, after: string, tokenize: Tokenizer = splitWords): DiffPiece[] {
  return toPieces(diffSequence(tokenize(before), tokenize(after)))
}

function similarity(pieces: DiffPiece[], before: string, after: string): number {
  const longest = Math.max(before.length, after.length)
  if (longest === 0) return 1
  const kept = pieces.reduce((sum, piece) => piece.type === 'equal' ? sum + piece.text.length : sum, 0)
  return kept / longest
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/)
}

/** Line-aligned diff; a deleted line followed by a similar inserted line becomes one `change` row with word-level pieces. */
export function diffLines(before: string, after: string, tokenize: Tokenizer = splitWords): LineDiffRow[] {
  const ops = diffSequence(splitLines(before), splitLines(after))
  const rows: LineDiffRow[] = []
  let index = 0
  while (index < ops.length) {
    const op = ops[index]!
    if (op.type === 'equal') {
      rows.push({ type: 'equal', text: op.value })
      index++
      continue
    }
    const deleted: string[] = []
    const inserted: string[] = []
    while (index < ops.length && ops[index]!.type !== 'equal') {
      const run = ops[index++]!
      ;(run.type === 'delete' ? deleted : inserted).push(run.value)
    }
    const paired = Math.min(deleted.length, inserted.length)
    for (let pair = 0; pair < paired; pair++) {
      const pieces = diffWords(deleted[pair]!, inserted[pair]!, tokenize)
      if (similarity(pieces, deleted[pair]!, inserted[pair]!) >= MIN_LINE_SIMILARITY) {
        rows.push({ type: 'change', pieces })
      } else {
        rows.push({ type: 'delete', text: deleted[pair]! }, { type: 'insert', text: inserted[pair]! })
      }
    }
    for (const text of deleted.slice(paired)) rows.push({ type: 'delete', text })
    for (const text of inserted.slice(paired)) rows.push({ type: 'insert', text })
  }
  return rows
}

export function piecesOfSide(pieces: DiffPiece[], side: 'before' | 'after'): DiffPiece[] {
  const dropped: DiffPieceType = side === 'before' ? 'insert' : 'delete'
  return pieces.filter(piece => piece.type !== dropped)
}

const ACCEPTANCE_CASE_HEADING = /^#### Acceptance Case: ?/

/** Prefix length of an Acceptance Case title line (`#### Acceptance Case: <name>`), or 0 when the line is not one. */
export function acceptanceCaseHeadingPrefix(line: string): number {
  return ACCEPTANCE_CASE_HEADING.exec(line)?.[0].length ?? 0
}

/** Flags lines that are code-like (inside a ``` fence, fence lines, or indented by 4+ spaces / a tab) so they can be set in monospace. */
export function codeLineFlags(lines: string[]): boolean[] {
  let inFence = false
  return lines.map(line => {
    const isFence = line.trimStart().startsWith('```')
    if (isFence) {
      inFence = !inFence
      return true
    }
    return inFence || /^( {4}|\t)/.test(line)
  })
}

/** The line text a row presents on one side; `change` rows use the after text. */
export function rowText(row: LineDiffRow): string {
  return row.type === 'change' ? piecesOfSide(row.pieces, 'after').map(piece => piece.text).join('') : row.text
}
