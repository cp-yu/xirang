import { describe, expect, it } from 'vitest'
import {
  acceptanceCaseHeadingPrefix,
  codeLineFlags,
  diffLines,
  diffWords,
  piecesOfSide,
  splitChars,
  splitWords,
  textDiffKind,
} from './xirangTextDiff'

const changedText = (pieces: ReturnType<typeof diffWords>, type: 'insert' | 'delete') =>
  pieces.filter(piece => piece.type === type).map(piece => piece.text).join('')

describe('textDiffKind', () => {
  it.each([
    ['', 'new', 'added'],
    ['old', '', 'removed'],
    ['old', 'new', 'modified'],
    ['same', 'same', 'unchanged'],
  ] as const)('classifies %j -> %j as %s', (before, after, expected) => {
    expect(textDiffKind(before, after)).toBe(expected)
  })
})

describe('splitWords', () => {
  it('splits unspaced Chinese prose into several segments when Intl.Segmenter is available', () => {
    if (typeof Intl.Segmenter !== 'function') return
    expect(splitWords('语义模型是项目意图').length).toBeGreaterThan(1)
  })

  it('keeps every character: joined segments equal the input', () => {
    const text = 'Change-derived 视图 and 语义模型, 2 items.'
    expect(splitWords(text).join('')).toBe(text)
    expect(splitChars(text).join('')).toBe(text)
  })
})

describe('diffWords', () => {
  it('highlights only the appended sentence when Chinese text gets a new sentence at the end', () => {
    const before = '语义模型是项目意图的结构化表达。'
    const after = '语义模型是项目意图的结构化表达。它为 Agent 导航提供依据。'
    const pieces = diffWords(before, after)

    expect(changedText(pieces, 'delete')).toBe('')
    expect(changedText(pieces, 'insert')).toBe('它为 Agent 导航提供依据。')
    expect(pieces[0]).toEqual({ type: 'equal', text: before })
  })

  it('highlights only the replaced word in English prose', () => {
    const pieces = diffWords('The quick brown fox', 'The quick red fox')

    expect(changedText(pieces, 'delete')).toBe('brown')
    expect(changedText(pieces, 'insert')).toBe('red')
  })

  it('works with the character tokenizer used when Intl.Segmenter is unavailable', () => {
    const pieces = diffWords('项目意图', '项目目标', splitChars)

    expect(changedText(pieces, 'delete')).toBe('意图')
    expect(changedText(pieces, 'insert')).toBe('目标')
  })

  it('reconstructs both sides from the pieces', () => {
    const before = 'alpha beta 模型 gamma'
    const after = 'alpha delta 模型 gamma epsilon'
    const pieces = diffWords(before, after)

    expect(piecesOfSide(pieces, 'before').map(piece => piece.text).join('')).toBe(before)
    expect(piecesOfSide(pieces, 'after').map(piece => piece.text).join('')).toBe(after)
  })
})

describe('diffLines', () => {
  it('keeps unchanged lines as equal rows and pairs a similar edited line into one change row', () => {
    const rows = diffLines('Intro\nThe user sees the old value.\nOutro', 'Intro\nThe user sees the new value.\nOutro')

    expect(rows.map(row => row.type)).toEqual(['equal', 'change', 'equal'])
    const change = rows[1]
    if (change?.type !== 'change') throw new Error('expected change row')
    expect(changedText(change.pieces, 'delete')).toBe('old')
    expect(changedText(change.pieces, 'insert')).toBe('new')
  })

  it('emits inserted lines for appended Acceptance Case lines', () => {
    const rows = diffLines('Rule.', 'Rule.\n\n#### Scenario: Basic\n\nGiven x')

    expect(rows[0]).toEqual({ type: 'equal', text: 'Rule.' })
    expect(rows.slice(1).filter(row => row.type === 'insert').map(row => row.text)).toEqual([
      '',
      '#### Scenario: Basic',
      '',
      'Given x',
    ])
  })

  it('treats completely different lines as delete plus insert, not as a word-level change', () => {
    const rows = diffLines('abcdef', 'uvwxyz')

    expect(rows).toEqual([{ type: 'delete', text: 'abcdef' }, { type: 'insert', text: 'uvwxyz' }])
  })
})

describe('acceptanceCaseHeadingPrefix', () => {
  it('measures the markdown prefix of Acceptance Case title lines only', () => {
    expect(acceptanceCaseHeadingPrefix('#### Acceptance Case: Login')).toBe('#### Acceptance Case: '.length)
    expect(acceptanceCaseHeadingPrefix('#### Other')).toBe(0)
    expect(acceptanceCaseHeadingPrefix('plain #### Acceptance Case: x')).toBe(0)
  })
})

describe('codeLineFlags', () => {
  it('flags fenced and 4-space indented lines but not prose', () => {
    expect(codeLineFlags(['prose', '```', 'a', '```', 'if (x)', '    y = 1', '\tz'])).toEqual([
      false,
      true,
      true,
      true,
      false,
      true,
      true,
    ])
  })
})
