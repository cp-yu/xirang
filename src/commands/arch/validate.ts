import { compileChange, readFormalSemanticModel } from '../../core/change-compiler.js';
import { validateSemanticModel } from '../../core/model/validator.js';
import { validateArchitecture, type ArchitectureValidationResult } from '../../utils/architecture-validator.js';

export interface ValidateArchitectureOptions {
  /** Validate the Expected Semantic Model of an active change instead of the Formal one. */
  change?: string;
}

/** Validates `.xirang/model/` as an in-memory Semantic Model; nothing is staged to disk. */
export async function validateArchitectureCommand(
  projectRoot: string,
  options: ValidateArchitectureOptions = {},
): Promise<ArchitectureValidationResult> {
  if (options.change) {
    const compiled = await compileChange(projectRoot, options.change);
    return {
      success: compiled.valid,
      errors: compiled.diagnostics.filter(item => item.level === 'ERROR').map(item => ({ code: item.code, message: item.message, element: item.identity })),
      warnings: compiled.diagnostics.filter(item => item.level === 'WARNING').map(item => ({ code: item.code, message: item.message, element: item.identity })),
    };
  }

  const parsed = await readFormalSemanticModel(projectRoot);
  return validateArchitecture([...parsed.diagnostics, ...validateSemanticModel(parsed.model)]);
}
