import type { LikeC4Model } from '../converters/types.js';
import { quoteLikeC4 } from './formatting-utils.js';

export function generateProjectFile(model: LikeC4Model): string {
  const description = model.project.intent ? `\n    description ${quoteLikeC4(model.project.intent)}` : '';
  return `model {\n  project_context = project ${quoteLikeC4(model.project.name)} {${description}\n    metadata {\n      projectId ${quoteLikeC4(model.project.id)}\n    }\n  }\n}\n`;
}
