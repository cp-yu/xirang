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

  it('assesses sync from the four change partitions and reports Sync guarantees', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;

    expect(instructions).toContain('If any of `.xirang/changes/<name>/{metamodel,elements,relationships,views}/` is non-empty, assess whether sync is required');
    expect(instructions).toContain('Synced into `.xirang/model/`, rewriting only the units the Semantic Delta affects, all-or-nothing');
    expect(instructions).not.toContain('architecture-delta');
    expect(instructions).not.toContain('main specs');
    expect(instructions).not.toContain('formal LikeC4');
  });

  it('routes archive verification only from the recorded quality state', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;

    expect(instructions).toContain('Treat `state` as the sole signal for rerunning the quality flow');
    expect(instructions).toContain('MUST NOT infer the code state from `changedFiles`, `information`, or the recorded review alone');
    expect(instructions).toContain('A `clean` state after seal MUST reuse the recorded review even when Git HEAD information differs');
  });

  it('offers a concrete recovery path while the optimization loop is open', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;

    expect(instructions).toContain('continue the optimization loop instead of stopping');
    expect(instructions).toContain('"stopReason":"NO_ACTIONABLE"');
    expect(instructions).toContain('hard-stop for manual recovery and offer no automatic path');
    expect(instructions).toContain('xirang quality status');
    expect(instructions).not.toContain('PENDING_VERIFICATION');
  });

  it('delegates quality work to internal agents', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;

    expect(instructions).toContain('delegate to the clean-context generated `xirang-reviewer` subagent');
    expect(instructions).toContain('delegate to the clean-context generated `xirang-optimizer` subagent');
    expect(instructions).toContain('MUST NOT inline a current-agent review skeleton');
    expect(instructions).toContain('archive MUST NOT silently downgrade to a review-only run');
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
