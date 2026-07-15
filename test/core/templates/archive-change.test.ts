import { describe, expect, it } from 'vitest';

import { OPENSPEC_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/workflows/archive-change.js';

describe('archive change workflow template', () => {
  it('includes the OpenSpec philosophy in the skill surface', () => {
    expect(getArchiveChangeSkillTemplate().instructions).toContain(OPENSPEC_PHILOSOPHY);
  });

  it('keeps definition-first discipline for workflow-managed writes', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    expect(instructions).toContain('resolved file definition');
    expect(instructions).toContain('MUST NOT copy definitions');
  });

  it('routes archive verification only from freshness.status', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;

    expect(instructions).toContain('Treat `freshness.status` as the sole signal for rerunning full verify');
    expect(instructions).toContain('MUST NOT infer staleness from `checks`, `details`, or `information`');
    expect(instructions).toContain('A `FRESH` result after seal MUST reuse Phase 1 even when Git HEAD information differs');
  });

  it('delegates verify work to internal agents', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;

    expect(instructions).toContain('delegate to clean-context generated `openspec-reviewer` subagent');
    expect(instructions).toContain('delegate to clean-context generated `openspec-optimizer` subagent');
    expect(instructions).toContain('MUST NOT inline a current-agent review skeleton');
    expect(instructions).not.toContain('invoke the `openspec-reviewer` skill');
    expect(instructions).not.toContain('invoke `openspec-optimizer`');
    expect(instructions).not.toContain('/skills/openspec-reviewer/SKILL.md');
  });
});
