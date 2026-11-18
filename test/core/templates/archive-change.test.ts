import { describe, expect, it } from 'vitest';

import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/workflows/archive-change.js';

describe('archive change workflow template', () => {
  it('includes the Xirang philosophy in the skill surface', () => {
    expect(getArchiveChangeSkillTemplate().instructions).toContain('xirang-common');
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

  it('routes archive modes without recommending a retired command or Git handoff after abandon', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    for (const command of ['`xirang archive "<change-name>" --json`', '`xirang archive "<change-name>" --quick --json`', '`xirang archive "<change-name>" --abandon --json`']) {
      expect(instructions).toContain(command);
    }
    for (const retired of ['`xirang sync', '--no-sync', '--no-validate', '--no-verify']) expect(instructions).not.toContain(retired);
    expect(instructions).toContain('MUST NOT apply the Delta, modify implementation, or run post-delivery Git commits');
    expect(instructions).toContain('`alreadyArchived`');
  });

  it('uses Quality-independent CLI selection for unnamed abandonment', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    const abandon = instructions.slice(instructions.indexOf('1. **Select change and mode**'), instructions.indexOf('3. **Prepare delivery**'));
    expect(abandon).toContain('`xirang archive --abandon --json`');
    expect(abandon).toMatch(/do not run `xirang list --json`.*Quality/i);
  });

  it('routes unnamed quick, non-Git delivery and Seal failures without crossing their gates', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    expect(instructions).toMatch(/quick without a name.*do not run `xirang list --json`/i);
    expect(instructions).toMatch(/not a Git repository.*report the result and stop before Git handoff/i);
    expect(instructions).toContain('return to Apply');
    expect(instructions).toContain('`xirang quality status "<change-name>" --json`');
  });

  it('retains apply isolation metadata before CLI move and owns safe cleanup', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    const readIndex = instructions.indexOf('read `.apply-isolation.json` before running the archive CLI');
    const cliIndex = instructions.indexOf('Run `xirang archive "<change-name>" --json`');

    expect(readIndex).toBeGreaterThan(-1);
    expect(cliIndex).toBeGreaterThan(readIndex);
    expect(instructions).toContain('`git -C <sourceRoot>`');
    expect(instructions).toContain('verify that `sourceRoot` is on `originalBranch`');
    expect(instructions).toContain('git worktree remove <worktreePath>');
    expect(instructions).toContain('MUST NOT reset, clean, stash, or commit unrelated source-workspace changes');
  });
});
