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
  getExploreSkillTemplate: 'c6265ca20cc3d6ea10e1f7bba827bf37a002340772386cbc4c19a36ffbe0b996',
  getApplyChangeSkillTemplate: '1cc197a017610c70a2bae8ecd6cdc68e438492ea5d64d91e12e25ea9e0185dad',
  getArchiveChangeSkillTemplate: '424b276444965bcb87ac78c6b7b6edb86f9b532c1193c12c26205017f5ba848f',
  getOpsxProposeSkillTemplate: 'aa9b29bc848426e8907a6d151ea68830aef67ad408ad01db50e8b474bc3baecf',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
  getBootstrapArchSkillTemplate: '07276d70301179208c6b6a137226d4f626a3174022a3dc57722df868fe2ce33e',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'e8ee04fffe31c0969ca2f70fe67aa7faa33cbdffc798c967913dd5507a21ce67',
  'openspec-apply-change': 'eaf137e7d2a9f27ffd97a311e331292df659a50c7e4d892e173a31861091d12d',
  'openspec-archive-change': '37525c258f7872186cfe673d9c8f183def81a1b1bdb4761778173ae0ea4b90ea',
  'openspec-propose': 'e5909bccfa23a182eb0a7b254b11928748994c46ae07129830302b6b8cf50a46',
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
      ['bootstrap-arch', 'openspec-bootstrap-arch', getBootstrapArchSkillTemplate],
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
