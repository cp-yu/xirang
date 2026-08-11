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
  getXirangProposeSkillTemplate,
  getBuildSkillTemplate,
  getSnackSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { runTransforms } from '../../../src/core/templates/transforms/index.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '3fcb02d15545045a60a1ade107f0a1b7f6f978b742bdc7dada88ef32e8e91078',
  getApplyChangeSkillTemplate: 'b63b5cfde0b39f5d8ecea07b9c62407572ab1e8fd0aff85d6b9c9f213965d4f3',
  getArchiveChangeSkillTemplate: '0bf75c0d29d9dc74b98d2ce524351cf73e45836b17fe42d17e07e853c1495101',
  getXirangProposeSkillTemplate: '7128008299ef3cae00532cdbe34ded2945cc5e99da675d232b3fed3752435f94',
  getFeedbackSkillTemplate: 'a75ff723b3b24ba2c61aee4243d2db6cfc5ee71e3adc2309ab30e7ce1503fbca',
  getBuildSkillTemplate: 'ca5739a750f7837dfb81beb48db44271fb08e6fb55dd2a0832b5c2e65497e6ed',
  getSnackSkillTemplate: 'f4e8345c6359a513ab33f90e3d89c391e64c329584ce88512095759212e46dcc',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'xirang-explore': 'c7b9398d5c56d2c019a84afe86d6d8aace24806d535f2379c1e153fbfbb7596a',
  'xirang-apply-change': 'fa9d4233a8b75e1230004af212767ea86af2766c8a404d39d6d336e72e748b44',
  'xirang-archive-change': 'aa5499bc9fd059a6bb58668ad14052b870722a44905405851c24fac3399ee0c8',
  'xirang-propose': '2c2e5d72aea3769d862327ffdcd5134d49402f4c93269f0b3361774f916a13c6',
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
      getXirangProposeSkillTemplate,
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
      ['xirang-propose', getXirangProposeSkillTemplate],
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
      ['propose', getXirangProposeSkillTemplate],
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
      expect(rendered).not.toMatch(/element-declaration[^\n]*summary|Declaration summary/i);
    }
  });

});
