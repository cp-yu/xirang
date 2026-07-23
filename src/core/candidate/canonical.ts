import path from 'node:path';

export type CanonicalTextIssue =
  | 'utf8'
  | 'utf8-bom'
  | 'unicode-nfc'
  | 'line-ending-lf'
  | 'final-newline'
  | 'trailing-whitespace';

export function compareUtf8Bytes(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

export function inspectCanonicalText(bytes: Uint8Array): CanonicalTextIssue[] {
  const issues: CanonicalTextIssue[] = [];
  let text: string;

  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return ['utf8'];
  }

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    issues.push('utf8-bom');
  }
  if (text !== text.normalize('NFC')) issues.push('unicode-nfc');
  if (text.includes('\r')) issues.push('line-ending-lf');
  if (!text.endsWith('\n') || text.endsWith('\n\n')) issues.push('final-newline');
  if (text.split(/\r?\n/).some((line) => /[\t ]+$/.test(line))) issues.push('trailing-whitespace');

  return issues;
}

export function normalizeDigestPath(value: string): string {
  const normalized = path.posix.normalize(value.replaceAll('\\', '/'));
  if (
    normalized === '.' ||
    normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    /^[A-Za-z]:\//.test(normalized)
  ) {
    throw new Error(`Digest path must be a safe relative path: ${value}`);
  }
  return normalized;
}
