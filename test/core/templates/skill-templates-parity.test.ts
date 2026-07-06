import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getBootstrapOpsxSkillTemplate,
  getOpsxBootstrapCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '765a342ba4ebdacd1c065dc48f1d71fd16854cc1cb3f7b69cc06b4673e3f30e6',
  getApplyChangeSkillTemplate: '7ad343ae5d95a2189f513a90437289c10b5b8038e5de90bbd84fbe1ed25607f8',
  getOpsxApplyCommandTemplate: '336191aae7087110cbd86261f5d2042eb9e61164a14ba1e59ac9cb5346dc0c92',
  getArchiveChangeSkillTemplate: '70e60c1621dc39077eef13fe32cdb14ffbf09774b7905f94bfccda2c612b4827',
  getOpsxArchiveCommandTemplate: '8446408d27f4e67f56c71b7e585acbf08e98b5e4a0a8b6e2087190c1f1e14e3f',
  getOpsxProposeSkillTemplate: '22a7037bdbe8b772a84f9221526c287ab6244e111f2e93b750e0881b93bc1542',
  getOpsxProposeCommandTemplate: '1d4d0e8e8de67f1823c348c9dccfcf7b62cecf96ddb2ea745aea2137ab448640',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapOpsxSkillTemplate: '209db1505c18ba28eec49430ad1bc18cca6b48fa819e5ac7e7900cb2c9c92f87',
  getOpsxBootstrapCommandTemplate: 'a249d04dd1706472b46b344b0fe3568c218e369eff33ed781007a473421206a1',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '89c8be392f8aed7000611c55f1c1562748308d941122390b89db8d5c2e014026',
  'openspec-apply-change': 'a2f93064936fd33c976e2721c7e466c307dc6b93b356fc2aac26affcc2199eb6',
  'openspec-archive-change': '99034e96cd1e1036b8fe5b7f664e065f32a23e002341a0e3e9f3211f26a21005',
  'openspec-propose': 'f5e179c8fd29089ddfd08a4aaf8d6e134f4ae557715a0623dee1994bb4feab85',
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
      getOpsxApplyCommandTemplate,
      getArchiveChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
      getFeedbackSkillTemplate,
      getBootstrapOpsxSkillTemplate,
      getOpsxBootstrapCommandTemplate,
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
