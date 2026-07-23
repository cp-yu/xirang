import type { ChangeDiff, ChangeDiffEntry, ChangeDiagnostic, DiffScope } from './semantic-diff.js';

function symbol(operation: ChangeDiffEntry['operation']): string {
  return operation === 'ADDED' ? '+' : operation === 'MODIFIED' ? '~' : '-';
}

function renderEntry(entry: ChangeDiffEntry, indent = ''): string[] {
  const lines = [`${indent}${symbol(entry.operation)} ${entry.kind} ${entry.identity}`];
  for (const child of entry.children ?? []) lines.push(...renderEntry(child, `${indent}  `));
  return lines;
}

function diagnosticScope(diagnostic: ChangeDiagnostic): DiffScope {
  return diagnostic.path.includes('spec') || diagnostic.code.includes('REQUIREMENT') || diagnostic.code.includes('SPEC_')
    ? 'specs'
    : 'architecture';
}

function filteredEntries(diff: ChangeDiff, scope?: DiffScope): ChangeDiffEntry[] {
  return scope ? diff.entries.filter(entry => entry.scope === scope) : diff.entries;
}

function filteredDiagnostics(diff: ChangeDiff, scope?: DiffScope): ChangeDiagnostic[] {
  return scope ? diff.diagnostics.filter(item => diagnosticScope(item) === scope) : diff.diagnostics;
}

export function renderChangeDiff(diff: ChangeDiff, scope?: DiffScope): string {
  const lines = [
    `Change: ${diff.change}`,
    `Status: ${diff.valid ? 'Passed' : 'Failed'}`,
    `Summary: ${diff.summary.total} semantic changes`,
  ];
  const sections: Array<[DiffScope, string]> = [['specs', 'Specs'], ['architecture', 'Architecture']];
  for (const [sectionScope, title] of sections) {
    if (scope && scope !== sectionScope) continue;
    lines.push('', title);
    const entries = filteredEntries(diff, sectionScope);
    if (entries.length === 0) lines.push('  No semantic changes.');
    else for (const entry of entries) lines.push(...renderEntry(entry, '  '));
  }
  const diagnostics = filteredDiagnostics(diff, scope);
  if (diagnostics.length) {
    lines.push('', 'Diagnostics');
    for (const item of diagnostics) lines.push(`  ${item.level} ${item.code}: ${item.message}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderEffectiveChange(diff: ChangeDiff): string {
  const lines = [
    '# Effective Change',
    '',
    `Change: ${diff.change}`,
    `Status: ${diff.valid ? 'Passed' : 'Failed'}`,
    `Formal fingerprint: ${diff.formalFingerprint}`,
    `Change fingerprint: ${diff.changeFingerprint}`,
    '',
    '## Summary',
    '',
    `- Total: ${diff.summary.total}`,
    `- Specs: +${diff.summary.specs.ADDED} ~${diff.summary.specs.MODIFIED} -${diff.summary.specs.REMOVED}`,
    `- Architecture: +${diff.summary.architecture.ADDED} ~${diff.summary.architecture.MODIFIED} -${diff.summary.architecture.REMOVED}`,
  ];
  for (const [scope, title] of [['specs', 'Specs'], ['architecture', 'Architecture']] as const) {
    lines.push('', `## ${title}`, '');
    const entries = filteredEntries(diff, scope);
    if (!entries.length) lines.push('No semantic changes.');
    else for (const entry of entries) lines.push(...renderEntry(entry));
  }
  lines.push('', '## Diagnostics', '');
  if (!diff.diagnostics.length) lines.push('None.');
  else for (const item of diff.diagnostics) {
    const location = item.location ? `:${item.location.line}:${item.location.column}` : '';
    lines.push(`- ${item.level} ${item.code} ${item.path}${location}: ${item.message}`);
  }
  return `${lines.join('\n')}\n`;
}

export function conciseDiffEntries(diff: ChangeDiff): Array<Pick<ChangeDiffEntry, 'scope' | 'kind' | 'identity' | 'operation'>> {
  return diff.entries.map(({ scope, kind, identity, operation }) => ({ scope, kind, identity, operation }));
}
