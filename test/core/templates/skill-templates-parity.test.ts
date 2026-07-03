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
  getExploreSkillTemplate: 'cce044ce0a8b2077d96623572707627595ff2c92ee0a278154c906aebfe1af01',
  getApplyChangeSkillTemplate: 'dbcb1e9b1ee23d3037e574bcee0248f7ad0f299922fa78c49a0fa442f94d7573',
  getOpsxApplyCommandTemplate: '02c467f76fe6aa9c3e54b838a3c895b69541368096749c39f75a262e5af69410',
  getArchiveChangeSkillTemplate: '42adc5acf29d55bd165ff6183b98bba5e5a74faf2bb9a4439d0ea15f540a19d5',
  getOpsxArchiveCommandTemplate: '47171ac1cd690fc6ccc6a7108eec3de07d3cd3f53d92e963c58bd47fab937c14',
  getOpsxProposeSkillTemplate: 'bf2c742c3667fe183c0561a3457a8aae7963956ace078bb9ba1edfe9b69917d0',
  getOpsxProposeCommandTemplate: '54a5772d6f166edc895389c7602d97091cecd64009fd3ec453be2c519640d63e',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapOpsxSkillTemplate: 'e716b90f35332851874f4426319aacb9fdef04a7221bf68669a73bde2232f203',
  getOpsxBootstrapCommandTemplate: 'a249d04dd1706472b46b344b0fe3568c218e369eff33ed781007a473421206a1',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '1e850c8e9a4497af2c5c0e037cd4c20f71ff4f4452ce5c19854a91acdaadb0a7',
  'openspec-apply-change': '25f7949c3bdad7939307d4244eed0b11248cf765b80a66317cbf58285aeb2fae',
  'openspec-archive-change': '276961a512bb0de884eddbdfc82071eba92d06a00e9c360b8fe69b270b35cded',
  'openspec-propose': 'bb1998f67fad9f212e4fb99d1a3784cbb7e6ebddba8f764bbd69f7590cd48eb0',
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
