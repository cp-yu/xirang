import { describe, expect, it } from 'vitest';

import { XIRANG_PHILOSOPHY } from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/workflows/archive-change.js';

describe('archive change workflow template', () => {
  it('includes the Xirang philosophy in the skill surface', () => {
    expect(getArchiveChangeSkillTemplate().instructions).toContain(XIRANG_PHILOSOPHY);
  });

  it('uses current Xirang workflow branding', () => {
    const template = getArchiveChangeSkillTemplate();
    expect(template.description).toContain('Xirang change workflow');
    expect(template.instructions).toContain('Xirang change workflow');
    expect(template.description).not.toContain('experimental workflow');
    expect(template.instructions).not.toContain('experimental workflow');
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

    expect(instructions).toContain('delegate to clean-context generated `xirang-reviewer` subagent');
    expect(instructions).toContain('delegate to clean-context generated `xirang-optimizer` subagent');
    expect(instructions).toContain('MUST NOT inline a current-agent review skeleton');
    expect(instructions).not.toContain('invoke the `xirang-reviewer` skill');
    expect(instructions).not.toContain('invoke `xirang-optimizer`');
    expect(instructions).not.toContain('/skills/xirang-reviewer/SKILL.md');
  });

  it('retains apply isolation metadata before CLI move and owns safe cleanup', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    const readIndex = instructions.indexOf('Read `.apply-isolation.json` before running the archive CLI');
    const cliIndex = instructions.indexOf('Run `xirang archive "<change-name>"`');

    expect(readIndex).toBeGreaterThan(-1);
    expect(cliIndex).toBeGreaterThan(readIndex);
    expect(instructions).toContain('`git -C <sourceRoot>`');
    expect(instructions).toContain('verify that `sourceRoot` is on `originalBranch`');
    expect(instructions).toContain('git worktree remove <worktreePath>');
    expect(instructions).toContain('MUST NOT reset, clean, stash, or commit unrelated source-workspace changes');
  });
});
