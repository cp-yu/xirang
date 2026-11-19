import { SAXParser, type SaxToken } from 'parse5-sax-parser';

export type SourceRange = [start: number, end: number];

// HTML supplies token boundaries; this list supplies the Section prose policy.
const LITERAL_CONTENT = new Set([
  'pre', 'code', 'script', 'style', 'template', 'title', 'textarea', 'iframe',
  'xmp', 'plaintext', 'noscript', 'noembed', 'noframes',
]);

/** Keep only Remark's HTML spans, without shifting any source offsets. */
export function projectHtml(source: string, from: number, to: number, ranges: SourceRange[]): string {
  let offset = from;
  const parts: string[] = [];
  for (const [left, right] of ranges.sort(([a], [b]) => a - b)) {
    const start = Math.max(offset, left);
    const end = Math.min(to, right);
    if (start >= end) continue;
    parts.push(' '.repeat(start - offset), source.slice(start, end));
    offset = end;
  }
  parts.push(' '.repeat(to - offset));
  return parts.join('');
}

export function firstHtmlComment(source: string, candidates: Set<number>): number {
  const parser = new SAXParser({ sourceCodeLocationInfo: true });
  let opening = -1;
  parser.on('comment', ({ sourceCodeLocation }) => {
    if (sourceCodeLocation && candidates.has(sourceCodeLocation.startOffset)) {
      opening = sourceCodeLocation.startOffset;
      parser.stop();
    }
  });
  // A new SAX parser emits tokens synchronously for the single input fragment.
  parser.end(source);
  return opening;
}

export function excludeHtmlProse(source: string, offset: number, exclusions: SourceRange[]): void {
  const parser = new SAXParser({ sourceCodeLocationInfo: true });
  const open = new Map<string, number[]>();
  const excludeMarkup = ({ sourceCodeLocation }: SaxToken) => {
    if (sourceCodeLocation) exclusions.push([offset + sourceCodeLocation.startOffset, offset + sourceCodeLocation.endOffset]);
  };
  parser.on('comment', excludeMarkup).on('doctype', excludeMarkup);
  parser.on('startTag', token => {
    excludeMarkup(token);
    if (!token.sourceCodeLocation || !LITERAL_CONTENT.has(token.tagName)) return;
    const starts = open.get(token.tagName) ?? [];
    starts.push(offset + token.sourceCodeLocation.startOffset);
    open.set(token.tagName, starts);
  });
  parser.on('endTag', token => {
    excludeMarkup(token);
    if (!token.sourceCodeLocation) return;
    const start = open.get(token.tagName)?.pop();
    if (start !== undefined) exclusions.push([start, offset + token.sourceCodeLocation.endOffset]);
  });
  parser.end(source);
  for (const starts of open.values()) {
    for (const start of starts) exclusions.push([start, offset + source.length]);
  }
}
