import { XIRANG_DIR_NAME } from '../../core/config.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compileArchitectureChange, readFormalSemanticModel } from '../../core/change-compiler.js';
import { readLikeC4Architecture } from '../../utils/likec4-reader.js';
import { validateArchitecture } from '../../utils/architecture-validator.js';
import { runLikeC4, type LikeC4Runner } from './runner.js';

export interface ValidateArchitectureOptions {
  deltaPath?: string;
  runLikeC4?: LikeC4Runner;
}

export async function validateArchitectureCommand(projectRoot: string, options: ValidateArchitectureOptions = {}) {
  const architectureDir = path.join(projectRoot, XIRANG_DIR_NAME, 'architecture');
  const runner = options.runLikeC4 ?? runLikeC4;
  if (!options.deltaPath) {
    await runner(['validate', architectureDir]);
    return validateArchitecture(projectRoot, await readLikeC4Architecture(projectRoot));
  }

  const source = await fs.readFile(options.deltaPath, 'utf8');
  const formal = await readFormalSemanticModel(projectRoot);
  const compiled = compileArchitectureChange(formal, source, { validateContracts: false });
  return {
    success: compiled.valid,
    errors: compiled.diagnostics
      .filter(item => item.level === 'ERROR')
      .map(item => ({ code: item.code, message: item.message })),
    warnings: compiled.diagnostics
      .filter(item => item.level === 'WARNING')
      .map(item => ({ code: item.code, message: item.message })),
  };
}
