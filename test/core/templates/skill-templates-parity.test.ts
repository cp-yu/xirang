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
  getImpactSweeperSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '7694a02031c5d7403146d60faf717ba07baafc5966ae6b374666020b04f3d9c4',
  getApplyChangeSkillTemplate: 'b1811eeee81e689354c7de35e65dd994b7df359f49e7b21a4d3ce86a46bf2d22',
  getOpsxApplyCommandTemplate: 'f20ed3ff39b1e6bf9bc371b06ee7714a3bf460cb56b28e603023316bd45c8545',
  getArchiveChangeSkillTemplate: 'aa1d1386857766bec331976b3439bbba6c358344ba47f89a6f2fcea9d71862ea',
  getOpsxArchiveCommandTemplate: '837246afecdf10ebdc52f11f325f5eb598905e17e90e91883819c943c3a3cc53',
  getOpsxProposeSkillTemplate: 'bf2c742c3667fe183c0561a3457a8aae7963956ace078bb9ba1edfe9b69917d0',
  getOpsxProposeCommandTemplate: '54a5772d6f166edc895389c7602d97091cecd64009fd3ec453be2c519640d63e',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapOpsxSkillTemplate: 'e716b90f35332851874f4426319aacb9fdef04a7221bf68669a73bde2232f203',
  getOpsxBootstrapCommandTemplate: 'a249d04dd1706472b46b344b0fe3568c218e369eff33ed781007a473421206a1',
  getImpactSweeperSkillTemplate: '2806c1ff6aae0fe5563d90b35c3cbeb69b4aa8963a1ba2670513e9c5b31062e2',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'baddc0ab575da85175d3f789882cf27c43d5133c8ff3e01e3dd61d8683578dab',
  'openspec-apply-change': 'be84f00901cdc6a27a1a6d7146f2772ad1c77319d55ba7f623bd0e3db66a2a9e',
  'openspec-archive-change': '12f4f0b6d606d7ac009d297ad52cdf4cb2d3995c36b0d726997629c2fbccf1b4',
  'openspec-propose': 'bb1998f67fad9f212e4fb99d1a3784cbb7e6ebddba8f764bbd69f7590cd48eb0',
  'openspec-impact-sweeper': '67bf2a12f45ce7421a262e814487cdc38a01945a1c65f94ddd707d3eb2397253',
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
      getImpactSweeperSkillTemplate,
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
      ['openspec-impact-sweeper', getImpactSweeperSkillTemplate],
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
