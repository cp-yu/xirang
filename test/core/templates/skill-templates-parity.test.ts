import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getOpsxProposeSkillTemplate,
  getBootstrapOpsxSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '765a342ba4ebdacd1c065dc48f1d71fd16854cc1cb3f7b69cc06b4673e3f30e6',
  getApplyChangeSkillTemplate: 'e122271ec6c7a367e092cc149a3dc53697567a8ff8df2ba680878f0bd723f1b5',
  getArchiveChangeSkillTemplate: '70e60c1621dc39077eef13fe32cdb14ffbf09774b7905f94bfccda2c612b4827',
  getOpsxProposeSkillTemplate: 'd5d65f66540c2d4aa93cd8a01b2cad2932960bcc57a2812c5ac1e104ac0ad656',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapOpsxSkillTemplate: '209db1505c18ba28eec49430ad1bc18cca6b48fa819e5ac7e7900cb2c9c92f87',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '89c8be392f8aed7000611c55f1c1562748308d941122390b89db8d5c2e014026',
  'openspec-apply-change': 'b342f93bc239f995a9a6b292b567cd7b18c7b843b9d21c05dbaf41807d4e8ffe',
  'openspec-archive-change': '99034e96cd1e1036b8fe5b7f664e065f32a23e002341a0e3e9f3211f26a21005',
  'openspec-propose': '21ffb149d2e612a1dc6a225377392ed4c4e711c14a9785d276d6c58a3792adab',
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getApplyChangeSkillTemplate,
      getArchiveChangeSkillTemplate,
      getOpsxProposeSkillTemplate,
      getFeedbackSkillTemplate,
      getBootstrapOpsxSkillTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['openspec-explore', getExploreSkillTemplate],
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-propose', getOpsxProposeSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

});
