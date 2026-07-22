import type { LikeC4Architecture } from './likec4-reader.js';
import { validateOwnership } from './semantic-checks/ownership-validator.js';
import { detectPrecedesCycles } from './semantic-checks/cycle-detector.js';
import { validateMetadata } from './semantic-checks/metadata-validator.js';
import { validateSemanticModel } from './semantic-checks/semantic-model-validator.js';
import { validateSemanticRelations } from './semantic-checks/relation-validator.js';

export interface ArchitectureIssue { code: string; message: string; element?: string }
export interface ArchitectureValidationResult {
  success: boolean;
  errors: ArchitectureIssue[];
  warnings: ArchitectureIssue[];
}

export async function validateArchitecture(projectRoot: string, architecture: LikeC4Architecture): Promise<ArchitectureValidationResult> {
  const errors = architecture.profile === 'v1'
    ? [...validateSemanticModel(architecture), ...validateSemanticRelations(architecture)]
    : [...validateOwnership(architecture), ...detectPrecedesCycles(architecture)];
  const warnings = architecture.profile === 'v1' ? [] : await validateMetadata(projectRoot, architecture);
  return { success: errors.length === 0, errors, warnings };
}
