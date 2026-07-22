import { describe, expect, it } from 'vitest';

import { OPSX_SHARED_CONTEXT } from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getApplyChangeSkillTemplate } from '../../../src/core/templates/workflows/apply-change.js';
import { getExploreSkillTemplate } from '../../../src/core/templates/workflows/explore.js';
import { getImpactSweeperSubagentTemplate } from '../../../src/core/templates/workflows/impact-sweeper.js';
import { getOptimizerSubagentTemplate } from '../../../src/core/templates/workflows/optimizer.js';
import { getOpsxProposeSkillTemplate } from '../../../src/core/templates/workflows/propose.js';
import { getReviewerSubagentTemplate } from '../../../src/core/templates/workflows/reviewer.js';
import { getSnackSkillTemplate } from '../../../src/core/templates/workflows/snack.js';

function activeGuidance(): string[] {
  const templates = [
    getExploreSkillTemplate(),
    getOpsxProposeSkillTemplate(),
    getApplyChangeSkillTemplate(),
    getSnackSkillTemplate(),
    getReviewerSubagentTemplate(),
    getOptimizerSubagentTemplate(),
    getImpactSweeperSubagentTemplate(),
  ];

  return templates.map((template) => [
    'instructions' in template ? template.instructions : template.prompt,
    ...(template.referenceFiles?.map((reference) => reference.content) ?? []),
  ].join('\n'));
}

describe('generated OPSX Semantic Model guidance', () => {
  it('reuses one shared context across relevant workflow surfaces', () => {
    for (const guidance of activeGuidance()) {
      expect(guidance).toContain(OPSX_SHARED_CONTEXT);
    }
  });

  it('contains no active legacy identity, binding, ownership, or graph guidance', () => {
    const combined = activeGuidance().join('\n');

    for (const token of [
      'capabilityId',
      'metadata.specs',
      'capabilities: []',
      '`capabilities` string array',
      'canonical capability ID',
      'domain_name.capability_name',
      'ownership by nesting',
      'OPSX YAML',
      'opsx-delta',
    ]) {
      expect(combined).not.toContain(token);
    }
  });
});
