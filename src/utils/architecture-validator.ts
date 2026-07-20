import type { LikeC4Architecture } from './likec4-reader.js';
import { validateOwnership } from './semantic-checks/ownership-validator.js';
import { detectPrecedesCycles } from './semantic-checks/cycle-detector.js';
import { validateMetadata } from './semantic-checks/metadata-validator.js';

export interface ArchitectureIssue { code: string; message: string; element?: string }
export interface ArchitectureValidationResult {
  success: boolean;
  errors: ArchitectureIssue[];
  warnings: ArchitectureIssue[];
}

export async function validateArchitecture(projectRoot: string, architecture: LikeC4Architecture): Promise<ArchitectureValidationResult> {
  const errors = [...validateOwnership(architecture), ...detectPrecedesCycles(architecture)];
  const warnings = await validateMetadata(projectRoot, architecture);
  return { success: errors.length === 0, errors, warnings };
}
