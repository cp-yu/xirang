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
  getApplyChangeSkillTemplate: '3e33f0619244e904f0396d24fbcb40a338de09d39c3355bb5ea56abb79bc76fe',
  getArchiveChangeSkillTemplate: '0bf75c0d29d9dc74b98d2ce524351cf73e45836b17fe42d17e07e853c1495101',
  getXirangProposeSkillTemplate: '88b0a97a6a1dded0f9d50ddad6778e06479f26e7fd77719372340d8bd7e81770',
  getFeedbackSkillTemplate: 'a75ff723b3b24ba2c61aee4243d2db6cfc5ee71e3adc2309ab30e7ce1503fbca',
  getBuildSkillTemplate: '132ee6486c1919a51c2913333d0ca6c95481fe8e723f79d6cd46c5994bb9e9e2',
  getSnackSkillTemplate: 'ed914df6502b02eb4556aadfa49e4aa4b4a4bf255883378d125fe3bf781f8ab6',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'xirang-explore': 'c7b9398d5c56d2c019a84afe86d6d8aace24806d535f2379c1e153fbfbb7596a',
  'xirang-apply-change': '0ee8d0f719c9b91eb7accf660b180e7cb8054f2bbfcb540a5c7895dd3f8e4d53',
  'xirang-archive-change': 'aa5499bc9fd059a6bb58668ad14052b870722a44905405851c24fac3399ee0c8',
  'xirang-propose': '28f983222750c03dff01a128044ff0addf5624abe65b19ef3684279dab165088',
  'xirang-snack': 'f46f3ff0a7b5318108ffd1aa1e16192f5bb457c280908f7f503d0256d165fbec',
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
      ['xirang-snack', getSnackSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });

  it('keeps the tracked Pi snack skill equal to the transformed canonical template', () => {
    const version = JSON.parse(readFileSync(path.resolve('package.json'), 'utf-8')).version as string;
    const rendered = generateSkillContent(getSnackSkillTemplate(), version, (instructions) =>
      runTransforms(instructions, { toolId: 'pi', workflowId: 'snack', artifactType: 'skill' })
    );

    expect(readFileSync(path.resolve('.pi/skills/xirang-snack/SKILL.md'), 'utf-8')).toBe(rendered);
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
