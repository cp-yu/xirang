import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../src/core/shared/subagent-generation.js';
import { XIRANG_SHARED_CONTEXT } from '../../src/core/templates/fragments/xirang-fragments.js';
import { getOptimizerSubagentTemplate } from '../../src/core/templates/workflows/optimizer.js';
import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('generated internal agent semantic context', () => {
  it('preserves the shared Xirang Semantic Model context in generated artifacts', () => {
    for (const template of [
      getReviewerSubagentTemplate(),
      getOptimizerSubagentTemplate(),
    ]) {
      expect(generateSubagentContent(template, 'claude', 'TEST')).toContain(XIRANG_SHARED_CONTEXT);
    }
  });

  it('loads normalized decomposition in checked-in structural workflow skills', () => {
    for (const file of [
      '.pi/skills/xirang-build/SKILL.md',
      '.pi/skills/xirang-explore/SKILL.md',
      '.pi/skills/xirang-propose/SKILL.md',
      '.pi/skills/xirang-snack/SKILL.md',
    ]) {
      const content = readFileSync(path.resolve(file), 'utf8');
      const configRead = content.indexOf('xirang config project --json');
      const methodGuidance = content.indexOf('For `method`');

      expect(configRead, file).toBeGreaterThanOrEqual(0);
      expect(methodGuidance, file).toBeGreaterThan(configRead);
    }
  });

  it('keeps checked-in Pi skills and agents on the canonical vocabulary', () => {
    const generatedFiles = [
      '.pi/skills/xirang-apply-change/SKILL.md',
      '.pi/skills/xirang-archive-change/SKILL.md',
      '.pi/skills/xirang-build/SKILL.md',
      '.pi/skills/xirang-explore/SKILL.md',
      '.pi/skills/xirang-propose/SKILL.md',
      '.pi/skills/xirang-snack/SKILL.md',
      '.pi/agents/xirang-optimizer.md',
      '.pi/agents/xirang-reviewer.md',
    ];
    const combined = generatedFiles
      .map((file) => readFileSync(path.resolve(file), 'utf8'))
      .join('\\n');

    expect(combined).toContain('Xirang Philosophy');
    for (const retired of [
      'capabilityId',
      'metadata.specs',
      '`capabilities` string array',
      'canonical capability ID',
      'domain_name.capability_name',
      'change-local specs metadata',
      'Declaration summary',
      '`element-declaration` | `identity`, `kind`, `parent`, `title`, `summary`',
    ]) {
      expect(combined).not.toContain(retired);
    }
  });
});
