import { modelRoot } from '../../core/model/paths.js';
import { parseSemanticModel } from '../../core/model/parser.js';
import type { SemanticModel } from '../../core/model/types.js';

export async function readValidArchitecture(projectRoot: string): Promise<SemanticModel> {
  const parsed = await parseSemanticModel(modelRoot(projectRoot));
  const errors = parsed.diagnostics.filter(diagnostic => diagnostic.level === 'ERROR');
  if (errors.length > 0) {
    throw new Error(errors
      .map(diagnostic => `${diagnostic.code} ${diagnostic.path}: ${diagnostic.message}`)
      .join('\n'));
  }
  return parsed.model;
}
