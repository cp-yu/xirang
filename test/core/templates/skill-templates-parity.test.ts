import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getOpsxProposeSkillTemplate,
  getBootstrapOpsxSkillTemplate,
  getSnackSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { runTransforms } from '../../../src/core/templates/transforms/index.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: 'f47a2e601d6dbf6116852f2997940ec195b39b1858bffd55a29f98a845910299',
  getApplyChangeSkillTemplate: '1ad796c083e7d627d554fc52ac22e1f47280e67b016d15fda33866156464d57f',
  getArchiveChangeSkillTemplate: '25b3dfafc5d2a617139024e789e255ad1dcd8bb8a130529bbbc2e14bb175d4b1',
  getOpsxProposeSkillTemplate: '216a7bec1550f860acb7b41ae6d93912f0bced81f919e4df1652bdd3f39f050b',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapOpsxSkillTemplate: '4034689c02ed6fcd61c3f83386f51c8b510709a99f9edf3c360edbe7bdceb168',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '38425d9b575d5352c8690d12b51bbc75680fdba7c2d3a1f754f9c45d2709b50f',
  'openspec-apply-change': 'eee3482ad9696cb0c5f0692be01fe15e7837c5f16786ca1f65b5d9d1ace7117d',
  'openspec-archive-change': '58b6588cd32a52dda6f6e7fb48e7060187c5ec718afb7b2a6708cebd0247130a',
  'openspec-propose': '0db5264ed99e282d49b0a8ae50e251750b0d1b9d4557464ed3c636ea8d94450d',
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

  it('keeps tracked Pi skills byte-identical to generated templates', () => {
    const version = JSON.parse(readFileSync(path.resolve('package.json'), 'utf-8')).version as string;
    const skillFactories: Array<[string, string, () => SkillTemplate]> = [
      ['propose', 'openspec-propose', getOpsxProposeSkillTemplate],
      ['explore', 'openspec-explore', getExploreSkillTemplate],
      ['apply', 'openspec-apply-change', getApplyChangeSkillTemplate],
      ['archive', 'openspec-archive-change', getArchiveChangeSkillTemplate],
      ['bootstrap-opsx', 'openspec-bootstrap-opsx', getBootstrapOpsxSkillTemplate],
      ['snack', 'openspec-snack', getSnackSkillTemplate],
    ];

    for (const [workflowId, dirName, createTemplate] of skillFactories) {
      const expected = generateSkillContent(createTemplate(), version, (instructions) =>
        runTransforms(instructions, { toolId: 'pi', workflowId, artifactType: 'skill' })
      );
      const actual = readFileSync(path.join('.pi', 'skills', dirName, 'SKILL.md'), 'utf-8');
      expect(actual, dirName).toBe(expected);
    }
  });

});
