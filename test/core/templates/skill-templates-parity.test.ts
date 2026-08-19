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
  getExploreSkillTemplate: 'b578164d19deb3ca232c6aa0c90382acc4e251ace6e6ce04e11774a11ef9c952',
  getArchiveChangeSkillTemplate: '0bf75c0d29d9dc74b98d2ce524351cf73e45836b17fe42d17e07e853c1495101',
  getXirangProposeSkillTemplate: '9532d409ced1d0b196fde587da73de4d04e01ff710655815c9948d7bb7824e1b',
  getFeedbackSkillTemplate: 'a75ff723b3b24ba2c61aee4243d2db6cfc5ee71e3adc2309ab30e7ce1503fbca',
  getBuildSkillTemplate: '3fd108167442e23998a7ee419cf73c8f79727dca9904cc6aca78ded3dee2565a',
  getSnackSkillTemplate: '6d7d153c0a2915147576f370ab91e97176fa0f20d2a3ea6c754d355a5619d1f5',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'xirang-explore': '7f761c6fcadbbc80e0181ce562f91049a85dfcb9e47e325d88fedd3ef23b2863',
  'xirang-archive-change': 'aa5499bc9fd059a6bb58668ad14052b870722a44905405851c24fac3399ee0c8',
  'xirang-propose': 'fca95eb4877e25ad03f123aef90c9ce0b0104080e07bbc5ae292bc63ab1f4bfd',
  'xirang-snack': 'a9c6e3975f2efcbbbe969a6a445e951a1025369d50aef6fd8f745e7802420b9d',
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

  it('projects apply workflow stages and references from the canonical template', () => {
    const template = getApplyChangeSkillTemplate();
    const rendered = generateSkillContent(template, 'PARITY-BASELINE');

    expect(rendered).toContain('name: "xirang-apply-change"');
    expect(rendered).toContain('## Flow Outline');
    expect(rendered).toContain('## Implementation Discipline');
    expect(rendered).toContain('Phase 0 implementation');
    expect(rendered).toContain('Phase 1 verification');
    expect(rendered).toContain('Phase 2 optimization');
    expect(rendered).toContain('Phase 3 seal');
    expect(rendered).toContain('.xirang/references/xirang-apply-step-1-preparation.md');
    expect(rendered).toContain('.xirang/references/xirang-apply-step-3-phase1-verification.md');
    expect(template.referenceFiles).toHaveLength(8);
    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/apply-step-1-preparation.md',
      'references/apply-step-2-branch-isolation.md',
      'references/apply-step-2-worktree-isolation.md',
      'references/apply-step-2-current-branch.md',
      'references/apply-step-3-phase1-verification.md',
      'references/apply-step-4-phase2-optimization.md',
      'references/apply-step-5-phase3-seal.md',
      'references/apply-step-6-output.md',
    ]);
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
