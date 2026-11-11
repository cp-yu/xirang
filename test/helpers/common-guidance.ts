import type { SkillTemplate } from '../../src/core/templates/types.js';
import { getCommonSkillTemplate } from '../../src/core/templates/workflows/common.js';

/** Resolve the common dependency when inspecting a stage's applicable guidance. */
export function withCommonGuidance(template: SkillTemplate): SkillTemplate {
  const common = getCommonSkillTemplate();
  return {
    ...template,
    instructions: [template.instructions, common.instructions, ...(common.referenceFiles ?? []).filter(file => !file.path.startsWith('references/artifact-') && file.path !== 'references/design-record.md').map(file => file.content)].join('\n'),
    referenceFiles: [...(template.referenceFiles ?? []), ...(common.referenceFiles ?? [])],
  };
}
