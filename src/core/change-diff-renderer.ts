import type { ChangeDiff, ChangeDiffEntry, DiffKind } from './semantic-diff.js';

function symbol(operation: ChangeDiffEntry['operation']): string {
  return operation === 'ADDED' ? '+' : operation === 'MODIFIED' ? '~' : '-';
}

function renderEntry(entry: ChangeDiffEntry, indent = ''): string[] {
  const lines = [`${indent}${symbol(entry.operation)} ${entry.kind} ${entry.identity}`];
  for (const child of entry.children ?? []) lines.push(...renderEntry(child, `${indent}  `));
  return lines;
}

function filterEntries(diff: ChangeDiff, entities?: ReadonlySet<DiffKind>): ChangeDiffEntry[] {
  return entities ? diff.entries.filter(entry => entities.has(entry.kind)) : diff.entries;
}

function renderSummary(diff: ChangeDiff): string {
  return `${diff.summary.total} semantic changes (+${diff.summary.ADDED} ~${diff.summary.MODIFIED} -${diff.summary.REMOVED})`;
}

export function renderChangeDiff(diff: ChangeDiff, entities?: ReadonlySet<DiffKind>): string {
  const lines = [
    `Change: ${diff.change}`,
    `Status: ${diff.valid ? 'Passed' : 'Failed'}`,
    `Summary: ${renderSummary(diff)}`,
    '',
    'Semantic Delta',
  ];
  const entries = filterEntries(diff, entities);
  if (entries.length === 0) lines.push('  No semantic changes.');
  else for (const entry of entries) lines.push(...renderEntry(entry, '  '));
  if (diff.diagnostics.length) {
    lines.push('', 'Diagnostics');
    for (const item of diff.diagnostics) lines.push(`  ${item.level} ${item.code}: ${item.message}`);
  }
  return `${lines.join('\n')}\n`;
}

export function conciseDiffEntries(diff: ChangeDiff): Array<Pick<ChangeDiffEntry, 'kind' | 'identity' | 'operation'>> {
  return diff.entries.map(({ kind, identity, operation }) => ({ kind, identity, operation }));
}
