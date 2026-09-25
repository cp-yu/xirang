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
  getArchiveChangeSkillTemplate: 'c4e58e869503a8890b15c1bcb61889bd9b748ebfb180541d1e3a2a9ed2645555',
  getFeedbackSkillTemplate: 'a75ff723b3b24ba2c61aee4243d2db6cfc5ee71e3adc2309ab30e7ce1503fbca',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'xirang-archive-change': '274357df3d4ac4c75d9420dc7daf335ebdba6f5760aa92bf5a91d704f626499d',
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
  it('preserves untouched template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getArchiveChangeSkillTemplate,
      getFeedbackSkillTemplate,
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
      ['xirang-archive-change', getArchiveChangeSkillTemplate],
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
    expect(rendered).toContain('Implementation loop');
    expect(rendered).toContain('Step 3: Review');
    expect(rendered).toContain('Step 4: Optimization');
    expect(rendered).toContain('Step 5: Seal');
    expect(rendered).toContain('.xirang/references/xirang-apply-step-1-preparation.md');
    expect(rendered).toContain('.xirang/references/xirang-apply-step-3-review.md');
    expect(template.referenceFiles).toHaveLength(8);
    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/apply-step-1-preparation.md',
      'references/apply-step-2-branch-isolation.md',
      'references/apply-step-2-worktree-isolation.md',
      'references/apply-step-2-current-branch.md',
      'references/apply-step-3-review.md',
      'references/apply-step-4-optimization.md',
      'references/apply-step-5-seal.md',
      'references/apply-step-6-output.md',
    ]);
  });

  it.each([
    ['build', 'xirang-build', getBuildSkillTemplate],
    ['explore', 'xirang-explore', getExploreSkillTemplate],
    ['propose', 'xirang-propose', getXirangProposeSkillTemplate],
    ['snack', 'xirang-snack', getSnackSkillTemplate],
  ] as const)('keeps the tracked Pi %s skill equal to the transformed source', (workflowId, dirName, template) => {
    const version = JSON.parse(readFileSync(path.resolve('package.json'), 'utf-8')).version as string;
    const rendered = generateSkillContent(template(), version, (instructions) =>
      runTransforms(instructions, { toolId: 'pi', workflowId, artifactType: 'skill' })
    );
    expect(readFileSync(path.resolve('.pi/skills', dirName, 'SKILL.md'), 'utf-8')).toBe(rendered);
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
