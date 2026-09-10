import type { Diagnostic } from './types.js';

export function formatDiagnostics(diagnostics: Diagnostic[]): string {
  return diagnostics
    .map((item) => `  - ${item.path}: expected ${item.expected}, got ${item.actual}\n    fix: ${item.fix}`)
    .join('\n');
}
