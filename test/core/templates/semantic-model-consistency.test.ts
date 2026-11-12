import { getCommonSkillTemplate } from '../../../src/core/templates/workflows/common.js';
import { describe, expect, it } from 'vitest';

import { BUSINESS_SPECIFICATION_STANDARD_REFERENCE } from '../../../src/core/templates/fragments/business-specification-standard.js';
import {
  SEMANTIC_MODEL_EVOLUTION_GUIDANCE,
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
      expect(guidance).toContain('xirang-common');
      expect(guidance).toContain('xirang-model-context.md');
      expect(guidance).not.toContain(XIRANG_SHARED_CONTEXT);
      expect(getCommonSkillTemplate().referenceFiles?.find(file => file.path === 'references/model-context.md')?.content).toBe(XIRANG_SHARED_CONTEXT);
    }
  });

  it('routes hierarchy formation to the configured method and shares framework rules once', () => {
    const structural = [
      getBuildSkillTemplate(),
      getExploreSkillTemplate(),
      getXirangProposeSkillTemplate(),
      getSnackSkillTemplate(),
    ];
    const common = getCommonSkillTemplate();
    const authoring = common.referenceFiles?.find(file => file.path === 'references/semantic-authoring.md')?.content ?? '';
    const methods = common.referenceFiles?.find(file => file.path === 'references/semantic-refinement.md')?.content ?? '';
    const createGuide = common.referenceFiles?.find(file => file.path === 'references/decomposition-authoring.md')?.content ?? '';

    for (const template of structural) {
      expect(template.instructions).toContain('xirang config project --select decomposition --json');
      expect(template.instructions).not.toContain('xirang-decomposition-use.md');
      expect(template.instructions).not.toContain(methods);
    }
    expect(authoring).toContain(SEMANTIC_MODEL_EVOLUTION_GUIDANCE);
    expect(authoring).toContain('be MECE within the confirmed scope');
    expect(authoring).toContain('does not require user approval at each layer');
    expect(methods).not.toContain('breadth-first');
    expect(createGuide).toContain('Before creating or revising project decomposition guidance');
    expect(createGuide).toContain('.xirang/references/xirang-semantic-authoring.md');
  });

  it('loads business-specification authoring rules only in formation workflows', () => {
    const reference = '.xirang/references/xirang-business-specification-standard.md';
    for (const template of [getBuildSkillTemplate(), getExploreSkillTemplate(), getXirangProposeSkillTemplate(), getSnackSkillTemplate()]) {
      expect(template.instructions).toContain(reference);
      expect(template.instructions).toContain('contractFormat: business-specification');
      expect(template.instructions).not.toContain('**Four mandatory Sections**');
    }
    for (const guidance of [getApplyChangeSkillTemplate().instructions, getArchiveChangeSkillTemplate().instructions, getReviewerSubagentTemplate().prompt, getOptimizerSubagentTemplate().prompt]) {
      expect(guidance).not.toContain(reference);
      expect(guidance).not.toContain('Business Specification Standard (4+N)');
    }
  });

  it('uses goal-level verification guidance without task or Check traceability fields', () => {
    const guidance = BUSINESS_SPECIFICATION_STANDARD_REFERENCE;
    expect(guidance).toContain('Goal-level tasks reference the responsible Contract Section');
    expect(guidance).not.toContain('Tasks and Checks trace back');
    expect(guidance).not.toContain('change-local Element paths and Section anchors');
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
