import type { ModelDiagnostic } from '../core/model/types.js';

export interface ArchitectureIssue { code: string; message: string; element?: string }
export interface ArchitectureValidationResult {
  success: boolean;
  errors: ArchitectureIssue[];
  warnings: ArchitectureIssue[];
}

function toIssue(diagnostic: ModelDiagnostic): ArchitectureIssue {
  return {
    code: diagnostic.code,
    message: diagnostic.message,
    ...(diagnostic.identity ? { element: diagnostic.identity } : {}),
  };
}

/** Projects Semantic Model diagnostics onto the architecture validation report shape. */
export function validateArchitecture(diagnostics: readonly ModelDiagnostic[]): ArchitectureValidationResult {
  const errors = diagnostics.filter(item => item.level === 'ERROR').map(toIssue);
  const warnings = diagnostics.filter(item => item.level === 'WARNING').map(toIssue);
  return { success: errors.length === 0, errors, warnings };
}
