import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readLikeC4Architecture } from '../../utils/likec4-reader.js';
import { validateArchitecture } from '../../utils/architecture-validator.js';
import { validateArchitectureDelta } from '../../validation/architecture-delta-validator.js';
import { runLikeC4, type LikeC4Runner } from './runner.js';

export interface ValidateArchitectureOptions {
  deltaPath?: string;
  runLikeC4?: LikeC4Runner;
}

export async function validateArchitectureCommand(projectRoot: string, options: ValidateArchitectureOptions = {}) {
  const architectureDir = path.join(projectRoot, 'openspec', 'architecture');
  const runner = options.runLikeC4 ?? runLikeC4;
  if (!options.deltaPath) {
    await runner(['validate', architectureDir]);
    return validateArchitecture(projectRoot, await readLikeC4Architecture(projectRoot));
  }

  const delta = await validateArchitectureDelta(projectRoot, options.deltaPath);
  if (!delta.valid) {
    return {
      success: false,
      errors: delta.issues.map(issue => ({ code: 'architecture-delta', message: issue.message })),
      warnings: [],
    };
  }

  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-likec4-delta-'));
  try {
    await fs.cp(architectureDir, workspace, { recursive: true });
    await fs.copyFile(options.deltaPath, path.join(workspace, 'architecture-delta.c4'));
    await runner(['validate', workspace]);
    return { success: true, errors: [], warnings: [] };
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}
