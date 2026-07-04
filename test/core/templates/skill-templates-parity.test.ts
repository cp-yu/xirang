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
  getExploreSkillTemplate: 'e4148ba0b1734df1f8303be15acd52a4624cd52626f2101a10614cf8ab312866',
  getApplyChangeSkillTemplate: '7ad343ae5d95a2189f513a90437289c10b5b8038e5de90bbd84fbe1ed25607f8',
  getOpsxApplyCommandTemplate: '336191aae7087110cbd86261f5d2042eb9e61164a14ba1e59ac9cb5346dc0c92',
  getArchiveChangeSkillTemplate: '70e60c1621dc39077eef13fe32cdb14ffbf09774b7905f94bfccda2c612b4827',
  getOpsxArchiveCommandTemplate: '8446408d27f4e67f56c71b7e585acbf08e98b5e4a0a8b6e2087190c1f1e14e3f',
  getOpsxProposeSkillTemplate: 'e51e8f1e86593db91e1a698d6e20c7ead615ab488595348b38e25c47ede21149',
  getOpsxProposeCommandTemplate: '4323f9949ed2f8c4f9f977d339be1d743de4a665886c24bb755cd3c3c25b396f',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapOpsxSkillTemplate: 'fb607150ef631c2810e6a0706f5da013bec93098b8ca25efc7b88ac21f563313',
  getOpsxBootstrapCommandTemplate: 'a249d04dd1706472b46b344b0fe3568c218e369eff33ed781007a473421206a1',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '8f3cb8bbc3ec0677b48c5384f48d3942be0af4cf3e7412e9d980ab633771c1f7',
  'openspec-apply-change': 'a2f93064936fd33c976e2721c7e466c307dc6b93b356fc2aac26affcc2199eb6',
  'openspec-archive-change': '99034e96cd1e1036b8fe5b7f664e065f32a23e002341a0e3e9f3211f26a21005',
  'openspec-propose': '594fe11325b4b8c174ba9aac5c5f0c8161f91ae6ef9c0cd6deda36715dd7599a',
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
