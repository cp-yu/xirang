import { describe, expect, it } from 'vitest';

import { XIRANG_PHILOSOPHY } from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/workflows/archive-change.js';
import { getApplyChangeSkillTemplate } from '../../../src/core/templates/workflows/apply-change.js';

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
    expect(instructions).toContain('the shared protocol handles eligibility, limits, and finalization');
    expect(instructions).toContain('hard-stop for manual recovery and offer no automatic path');
    expect(instructions).toContain('xirang quality status');
    expect(instructions).not.toContain('PENDING_VERIFICATION');
  });

  it('reuses the complete Apply quality references rather than a shortened protocol', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    const references = getApplyChangeSkillTemplate().referenceFiles ?? [];

    for (const step of ['3-review', '4-optimization', '5-seal']) {
      const reference = references.find((file) => file.path === `references/apply-step-${step}.md`);
      expect(reference).toBeDefined();
      expect(instructions).toContain(`.xirang/references/xirang-apply-step-${step}.md`);
    }
    expect(instructions).toContain('Read and execute the complete shared references');
    expect(instructions).toContain('reuse the recorded Review and enter at Optimization');
    expect(instructions).toContain('Do not reinitialize isolation or overwrite its evidence baseline');
    expect(instructions).toContain('Return corrections to the Apply implementation loop');
    expect(instructions).toContain('archive MUST NOT silently downgrade to a review-only run');
    expect(instructions).toContain('MUST NOT inline a current-agent review skeleton');
    expect(instructions).not.toContain('Let the master implement only the direction');

    const review = references.find((file) => file.path === 'references/apply-step-3-review.md')!.content;
    const optimization = references.find((file) => file.path === 'references/apply-step-4-optimization.md')!.content;
    expect(review).toContain('passing only the three locating strings');
    expect(review).toContain('Apply only CRITICAL `writeBackPlan` entries');
    expect(optimization).toContain('optimizationBaselineCommit');
    expect(optimization).toContain('Report the verdict before rolling back');
    expect(optimization).toContain('restore all three files');
    expect(optimization).toContain('SHA-256');
  });

  it('checks unsafe terminals before routing dirty states to Review', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;
    const unsafeIndex = instructions.indexOf('`ABORTED_UNSAFE`');
    const dirtyIndex = instructions.indexOf('only `dirty` enters Step 2.5');

    expect(unsafeIndex).toBeGreaterThan(-1);
    expect(dirtyIndex).toBeGreaterThan(unsafeIndex);
    expect(instructions).toContain('even when `state` is `dirty`');
    expect(instructions).toContain('If a `clean` state has an unfinished Optimization');
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
