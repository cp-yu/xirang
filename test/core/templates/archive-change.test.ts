import { describe, expect, it } from 'vitest';

import { OPSX_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/workflows/archive-change.js';

describe('archive change workflow template', () => {
  it('includes the OPSX philosophy in the skill surface', () => {
    expect(getArchiveChangeSkillTemplate().instructions).toContain(OPSX_PHILOSOPHY);
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

    expect(instructions).toContain('delegate to clean-context generated `opsx-reviewer` subagent');
    expect(instructions).toContain('delegate to clean-context generated `opsx-optimizer` subagent');
    expect(instructions).toContain('MUST NOT inline a current-agent review skeleton');
    expect(instructions).not.toContain('invoke the `opsx-reviewer` skill');
    expect(instructions).not.toContain('invoke `opsx-optimizer`');
    expect(instructions).not.toContain('/skills/opsx-reviewer/SKILL.md');
  });

  it('retains apply isolation metadata before CLI move and owns safe cleanup', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    const readIndex = instructions.indexOf('Read `.apply-isolation.json` before running the archive CLI');
    const cliIndex = instructions.indexOf('Run `opsx archive "<change-name>"`');

    expect(readIndex).toBeGreaterThan(-1);
    expect(cliIndex).toBeGreaterThan(readIndex);
    expect(instructions).toContain('`git -C <sourceRoot>`');
    expect(instructions).toContain('verify that `sourceRoot` is on `originalBranch`');
    expect(instructions).toContain('git worktree remove <worktreePath>');
    expect(instructions).toContain('MUST NOT reset, clean, stash, or commit unrelated source-workspace changes');
  });
});
