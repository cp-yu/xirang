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
  getBootstrapArchSkillTemplate,
  getSnackSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { runTransforms } from '../../../src/core/templates/transforms/index.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '37224d9e180a7e294aa03e4cb708142cd1737b7138a0faa92411485c729c7bd5',
  getApplyChangeSkillTemplate: '8c97f157cae8fe5216fe428f5b28c27566b9a9310ab131a90bc6837987aad411',
  getArchiveChangeSkillTemplate: '8e5049da04ee2209fe8d3dc0a76845ff0507886100f9024537b506626cecd2ea',
  getOpsxProposeSkillTemplate: '031bca9a447ed68712b60a99f61aa86a90a7ab13d1761262ec8951c55ba6578b',
  getFeedbackSkillTemplate: '99756a104f264b86ab4b13ad5ca778dae8357fed3f79f70b5f01684abff2891e',
  getBootstrapArchSkillTemplate: '175d2a1b57242d92f81ef8c89bf14b7ae8601af162977c6cd950393759ef6a08',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'opsx-explore': '41ee441872cd4489ddca3c91c7a2a7adb9fd86a8bbc4453f815c707033988c2a',
  'opsx-apply-change': '03ab54dda5df120cc03abaeb0abc76dfe1fef12e9c42d47beee3c33e33578aac',
  'opsx-archive-change': '1c2da7ba0be2ce53f51daae9c220e4d38ed11905d1b30c6998032f7900aca86d',
  'opsx-propose': '34a6c407d100ef6da016c90a1c823d3a3d0a3a205db183250707e911630fc973',
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
      getBootstrapArchSkillTemplate,
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
      ['opsx-explore', getExploreSkillTemplate],
      ['opsx-apply-change', getApplyChangeSkillTemplate],
      ['opsx-archive-change', getArchiveChangeSkillTemplate],
      ['opsx-propose', getOpsxProposeSkillTemplate],
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
      ['propose', 'opsx-propose', getOpsxProposeSkillTemplate],
      ['explore', 'opsx-explore', getExploreSkillTemplate],
      ['apply', 'opsx-apply-change', getApplyChangeSkillTemplate],
      ['archive', 'opsx-archive-change', getArchiveChangeSkillTemplate],
      ['bootstrap-arch', 'opsx-bootstrap-arch', getBootstrapArchSkillTemplate],
      ['snack', 'opsx-snack', getSnackSkillTemplate],
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
