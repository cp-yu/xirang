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
  getExploreSkillTemplate: 'f55e9610cdb6369968babd67cb4a9376e44f374c6cba9391cd3b7ed348295fa0',
  getApplyChangeSkillTemplate: 'ae395cf144982db332599e6883be4df68e045a9effedac2f603f21a0105fa3e6',
  getArchiveChangeSkillTemplate: '0bf75c0d29d9dc74b98d2ce524351cf73e45836b17fe42d17e07e853c1495101',
  getOpsxProposeSkillTemplate: '05e2c1d98187c105792440c220654f647ebc7ac9628a298c21d895af42dca606',
  getFeedbackSkillTemplate: 'b59e4e8f30b3671f5346445a7fbe9043cd559233c86fc78d086bbe94e084590b',
  getBuildSkillTemplate: '322af37f41fcd8b835ef4f51a268d09825e8a05917fc33a462f05f5204d05ae8',
  getSnackSkillTemplate: 'cda5a371e901e9d6cc0ae74a45d52c915fb28ec5ec1bec891859680b0075eabc',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'xirang-explore': 'd5007ed402c5b1b6a2bce9b8c8139206389e16c5a84dfbeb4c7e246443100c79',
  'xirang-apply-change': '7a80a673bd043ccae0320d0e737faaceefbd215a63cef5aabf5799fed255939a',
  'xirang-archive-change': 'aa5499bc9fd059a6bb58668ad14052b870722a44905405851c24fac3399ee0c8',
  'xirang-propose': '8a6a1ba0b3c365e6e5332c309be53f8929b1231c619ac884c40a141bd7c3d742',
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
      getSnackSkillTemplate,
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
