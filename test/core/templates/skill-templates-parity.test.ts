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
  getBuildSkillTemplate,
  getSnackSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { runTransforms } from '../../../src/core/templates/transforms/index.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: 'eb0f0960c09b95ef358dd0aeabe733763f8c7b0c24555a11eccd695aa74ffc0e',
  getApplyChangeSkillTemplate: '73e58cf818e33b7a88f45d76139b5113e04778183ccd794bee1720b770df1fd1',
  getArchiveChangeSkillTemplate: '8371d42069bdc2f7544a0eb098f375ca336c95c314730b1f06815352efc5c6d6',
  getOpsxProposeSkillTemplate: 'c36d9d1d029cc5950da379c7ece44b6aec90e5f0c665b5eea90f2b64e98af995',
  getFeedbackSkillTemplate: 'b59e4e8f30b3671f5346445a7fbe9043cd559233c86fc78d086bbe94e084590b',
  getBuildSkillTemplate: '8ce8f367f84a71904d2f81ee4603874500e30b127e25f634796f3dcb4ea5aa10',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'xirang-explore': '3c3cc3dd0ea32c92de7fcc8ebb36b768c3b8ce98f950d7ad315686a312934ee1',
  'xirang-apply-change': 'dd13f615c3c856a455db928877dc7e3ffbea40b8820784d1202e438b91e9c69c',
  'xirang-archive-change': '23f1aa036bb01d9b6341260d9c1fb8fa90ede51f499dddf99713cc2598db19a2',
  'xirang-propose': 'e7bb39f81264f950c7ba0e9f0267d020048a48f6e27fd3b090a7d079154a10ee',
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
      getBuildSkillTemplate,
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
      ['xirang-explore', getExploreSkillTemplate],
      ['xirang-apply-change', getApplyChangeSkillTemplate],
      ['xirang-archive-change', getArchiveChangeSkillTemplate],
      ['xirang-propose', getOpsxProposeSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  it('renders every tracked workflow surface with canonical Semantic Model guidance', () => {
    const version = JSON.parse(readFileSync(path.resolve('package.json'), 'utf-8')).version as string;
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['propose', getOpsxProposeSkillTemplate],
      ['explore', getExploreSkillTemplate],
      ['apply', getApplyChangeSkillTemplate],
      ['archive', getArchiveChangeSkillTemplate],
      ['build', getBuildSkillTemplate],
      ['snack', getSnackSkillTemplate],
    ];

    for (const [workflowId, createTemplate] of skillFactories) {
      const rendered = generateSkillContent(createTemplate(), version, (instructions) =>
        runTransforms(instructions, { toolId: 'pi', workflowId, artifactType: 'skill' })
      );
      expect(rendered).toContain('Xirang Semantic Model');
      expect(rendered).not.toContain('capabilityId');
      expect(rendered).not.toContain('metadata.specs');
      expect(rendered).not.toContain('capabilities: []');
      expect(rendered).not.toContain('opsx-delta');
    }
  });

});
