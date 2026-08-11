import { describe, expect, it } from 'vitest';

import {
  STRUCTURAL_DECOMPOSITION_GUIDANCE,
  XIRANG_SHARED_CONTEXT,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getApplyChangeSkillTemplate } from '../../../src/core/templates/workflows/apply-change.js';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/workflows/archive-change.js';
import { getBuildSkillTemplate } from '../../../src/core/templates/workflows/build.js';
import { getExploreSkillTemplate } from '../../../src/core/templates/workflows/explore.js';
import { getOptimizerSubagentTemplate } from '../../../src/core/templates/workflows/optimizer.js';
import { getXirangProposeSkillTemplate } from '../../../src/core/templates/workflows/propose.js';
import { getReviewerSubagentTemplate } from '../../../src/core/templates/workflows/reviewer.js';
import { getSnackSkillTemplate } from '../../../src/core/templates/workflows/snack.js';

function activeGuidance(): string[] {
  const templates = [
    getExploreSkillTemplate(),
    getXirangProposeSkillTemplate(),
    getApplyChangeSkillTemplate(),
    getSnackSkillTemplate(),
    getReviewerSubagentTemplate(),
    getOptimizerSubagentTemplate(),
  ];

  return templates.map((template) => [
    'instructions' in template ? template.instructions : template.prompt,
    ...(template.referenceFiles?.map((reference) => reference.content) ?? []),
  ].join('\n'));
}

describe('generated Xirang Semantic Model guidance', () => {
  it('reuses one shared context across relevant workflow surfaces', () => {
    for (const guidance of activeGuidance()) {
      expect(guidance).toContain(XIRANG_SHARED_CONTEXT);
    }
  });

  it('includes structural decomposition guidance only in hierarchy-forming workflows', () => {
    const structural = [
      getBuildSkillTemplate().instructions,
      getExploreSkillTemplate().instructions,
      getXirangProposeSkillTemplate().instructions,
      getSnackSkillTemplate().instructions,
    ];
    const nonStructural = [
      getApplyChangeSkillTemplate().instructions,
      getArchiveChangeSkillTemplate().instructions,
      getReviewerSubagentTemplate().prompt,
      getOptimizerSubagentTemplate().prompt,
    ];

    for (const guidance of structural) {
      expect(guidance).toContain(STRUCTURAL_DECOMPOSITION_GUIDANCE);
    }
    for (const guidance of nonStructural) {
      expect(guidance).not.toContain(STRUCTURAL_DECOMPOSITION_GUIDANCE);
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
      'Xirang YAML',
      'opsx-delta',
    ]) {
      expect(combined).not.toContain(token);
    }
  });
});
