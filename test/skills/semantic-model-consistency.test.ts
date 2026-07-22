import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../src/core/shared/subagent-generation.js';
import { OPSX_SHARED_CONTEXT } from '../../src/core/templates/fragments/opsx-fragments.js';
import { getImpactSweeperSubagentTemplate } from '../../src/core/templates/workflows/impact-sweeper.js';
import { getOptimizerSubagentTemplate } from '../../src/core/templates/workflows/optimizer.js';
import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

describe('generated internal agent semantic context', () => {
  it('preserves the shared OPSX Semantic Model context in generated artifacts', () => {
    for (const template of [
      getReviewerSubagentTemplate(),
      getOptimizerSubagentTemplate(),
      getImpactSweeperSubagentTemplate(),
    ]) {
      expect(generateSubagentContent(template, 'claude', 'TEST')).toContain(OPSX_SHARED_CONTEXT);
    }
  });

  it('keeps checked-in Pi skills and agents on the canonical vocabulary', () => {
    const generatedFiles = [
      '.pi/skills/opsx-apply-change/SKILL.md',
      '.pi/skills/opsx-archive-change/SKILL.md',
      '.pi/skills/opsx-bootstrap-arch/SKILL.md',
      '.pi/skills/opsx-explore/SKILL.md',
      '.pi/skills/opsx-propose/SKILL.md',
      '.pi/skills/opsx-snack/SKILL.md',
      '.pi/agents/opsx-impact-sweeper.md',
      '.pi/agents/opsx-optimizer.md',
      '.pi/agents/opsx-reviewer.md',
    ];
    const combined = generatedFiles
      .map((file) => readFileSync(path.resolve(file), 'utf8'))
      .join('\\n');

    expect(combined).toContain('OPSX Semantic Model');
    for (const retired of [
      'capabilityId',
      'metadata.specs',
      'capabilities: []',
      '`capabilities` string array',
      'canonical capability ID',
      'domain_name.capability_name',
      'change-local specs metadata',
    ]) {
      expect(combined).not.toContain(retired);
    }
  });
});
