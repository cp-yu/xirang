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
  getExploreSkillTemplate: 'b35f3b44d5613dbb28e7e52a8407633e9b0873db3f1db40e919e22b0582a436c',
  getApplyChangeSkillTemplate: 'a3e060b441aade22bbd5a82cd3218ce864ae733e4df57ea9cc1802aa2ac87e6c',
  getArchiveChangeSkillTemplate: '53545abdd6b41eec03b04c72e9184ef2a8ed21ac7cbbf24cabce83f8b8cbfe20',
  getOpsxProposeSkillTemplate: '845f43ab0b89a5a6caa40c94538edb11a5fcc22a6231e292fe9030cf87be7e50',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapOpsxSkillTemplate: 'fc81199c17932e363f777f8fecf8e47890ab82d61756b5ceb2004142da26e4f8',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '589d868cc15d2d934bcc5e2dae1dbbb23643bb173d15165f3b8d0a4df8708743',
  'openspec-apply-change': 'bbe2363e995932a7e2e928413142dfba11400442254d447b8805bdec7834e339',
  'openspec-archive-change': '983a0328765df00490cd3d8c4a3f9da730e1f60a6658e7cef0fae8dd030be9ba',
  'openspec-propose': 'd42545a7c5c4e2bd4235bc44b8c936ce518a3b31d2c8925fc7a781f5d66ddeff',
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
