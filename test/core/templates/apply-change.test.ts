import { describe, expect, it } from 'vitest';

import {
  QUALITY_CHECKPOINT_STATE_MACHINE,
  QUALITY_CLI_JSON_SCHEMA_REFERENCE,
  QUALITY_ERROR_RECOVERY_GUIDE,
  QUALITY_SIMPLE_CHANGE_FAST_PATH,
  QUALITY_STATE_MACHINE_DIAGRAM,
  TEST_QUALITY_GUIDANCE,
  XIRANG_PHILOSOPHY,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import {
  getApplyChangeSkillTemplate,
} from '../../../src/core/templates/workflows/apply-change.js';
import { runTransforms } from '../../../src/core/templates/transforms/index.js';

const applyReference = (path: string) => {
  const reference = getApplyChangeSkillTemplate().referenceFiles?.find((file) => file.path === path);
  expect(reference).toBeDefined();
  return reference?.content ?? '';
};

describe('apply change workflow template', () => {
  it('keeps the generated apply reference set complete', () => {
    const references = getApplyChangeSkillTemplate().referenceFiles ?? [];
    expect(references).toHaveLength(8);
    for (const reference of references) {
      expect(reference.content.length).toBeGreaterThan(0);
    }
  });

  it('declares the coordinator role and delegates judgment to the subagents', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const coordinator = instructions
      .split('## Quality Coordinator\n\n')[1]
      .split('\n\n## Implementation Discipline')[0];

    expect(coordinator).toContain('You are the apply coordinator, not a judge');
    for (const role of ['Coordinator (you)', '`xirang-reviewer` subagent', '`xirang-optimizer` subagent', 'CLI (`xirang quality`)']) {
      expect(coordinator).toContain(role);
    }
    expect(coordinator).toContain(
      'MUST NOT substitute your own completeness, correctness, or coherence judgments for the reviewer\'s'
    );
    expect(coordinator).toContain('only determine');
    expect(coordinator).toContain('the subagents read candidate files, git evidence, and change artifacts themselves');
    expect(coordinator).toContain('Wait for a complete subagent payload');
    expect(coordinator).toContain('A subagent that is slow is not a failed subagent');
  });

  it('labels stage switches with mode labels and states the delegation waiting rules', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const review = applyReference('references/apply-step-3-review.md');
    const optimization = applyReference('references/apply-step-4-optimization.md');

    expect(instructions).toContain('[Mode: Delegate Review] Step 3: Review');
    expect(instructions).toContain('[Mode: Checkpoint] Step 4: Optimization');
    expect(review).toContain('[Mode: Delegate Review]');
    expect(optimization).toContain('[Mode: Checkpoint]');
    for (const reference of [review, optimization]) {
      expect(reference).toMatch(/wait for the complete/i);
      expect(reference).toContain('A slow subagent is not a failed subagent');
      expect(reference).toContain('ask the user before terminating it');
    }
    expect(review).toContain('passing only the three locating strings');
    expect(review).not.toContain('findings');
  });

  it('queries the Semantic Model by identity before implementation', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    expect(instructions).toContain('xirang arch impact <identity> --depth 2 --json');
    expect(instructions).toContain('xirang arch query <selected-identities...> --contract --json');
    expect(instructions).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
    expect(instructions).not.toContain('elementId');
    expect(instructions).not.toContain('owned Specs');
  });

  it('routes recovery through impact discovery before batch semantic reads', () => {
    const preparation = applyReference('references/apply-step-1-preparation.md');
    const impactIndex = preparation.indexOf('xirang arch impact <identity> --depth <n> --json');
    const queryIndex = preparation.indexOf('xirang arch query <identities...> --contract --json');

    expect(impactIndex).toBeGreaterThan(-1);
    expect(queryIndex).toBeGreaterThan(impactIndex);
  });

  it('keeps the Xirang philosophy in the skill surface', () => {
    expect(getApplyChangeSkillTemplate().instructions).toContain(XIRANG_PHILOSOPHY);
  });

  it('uses definition-first authoring without code-map navigation', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');
    expect(instructions).toContain('resolved file definition');
    expect(instructions).toContain('MUST NOT copy definitions');
    expect(preparation).toContain('xirang arch query');
    expect(preparation).toContain('.xirang/model/{metamodel,elements,relationships,views}/');
    expect(preparation).toContain('Xirang Semantic Model');
    expect(preparation).toContain('CodeGraph');
    expect(preparation).toContain('ACE');
    expect(preparation).not.toContain('project.xirang.code-map.yaml');
  });

  it('keeps one reference file per apply workflow step and one per isolation method', () => {
    const template = getApplyChangeSkillTemplate();

    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/apply-step-1-preparation.md',
      'references/apply-step-2-branch-isolation.md',
      'references/apply-step-2-worktree-isolation.md',
      'references/apply-step-2-current-branch.md',
      'references/apply-step-3-review.md',
      'references/apply-step-4-optimization.md',
      'references/apply-step-5-seal.md',
      'references/apply-step-6-output.md',
    ]);

    for (const reference of template.referenceFiles?.filter((file) => !file.path.includes('apply-step-2-')) ?? []) {
      const sharedPath = `.xirang/references/xirang-${reference.path.replace('references/', '')}`;

      expect(template.instructions).toContain(sharedPath);
    }
  });

  it('routes isolation without loading mutually exclusive method references', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');

    expect(instructions).toContain('Step 2: Isolation router');
    expect(instructions).not.toContain('xirang-apply-step-2-branch-isolation.md');
    expect(instructions).not.toContain('xirang-apply-step-2-worktree-isolation.md');
    expect(instructions).not.toContain('xirang-apply-step-2-current-branch.md');
    expect(preparation).toContain('At Step 2, read exactly one');
    expect(preparation).toContain('xirang-apply-step-2-branch-isolation.md');
    expect(preparation).toContain('xirang-apply-step-2-worktree-isolation.md');
    expect(preparation).toContain('xirang-apply-step-2-current-branch.md');
    expect(preparation).toContain('MUST NOT read the other two');
    expect(preparation).toContain('Do not read the selected reference during Preparation');
  });

  it('applies shared test quality before writing or splitting tests', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain(TEST_QUALITY_GUIDANCE);
    expect(instructions).toContain('inspect existing tests');
    expect(instructions).toContain('target behavior is missing');
    expect(instructions).not.toContain('公共方法数量少于 5');
    expect(instructions).not.toContain('每个方法参数少于 4');
  });

  it('carries no Pre-flight step in the apply workflow', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).not.toMatch(/Pre-flight|preflight/);
    expect(instructions).toContain('Step 1: Preparation');
    expect(instructions).toContain('Step 2: Isolation router');
    expect(instructions).toContain('Step 3: Review');
    expect(instructions).toContain('Step 4: Optimization');
    expect(instructions).toContain('Step 5: Seal');
    expect(instructions).toContain('Step 6: Output');
  });

  it('keeps flow details in step references instead of the skill outline', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');

    expect(instructions).toContain('## Flow Outline');
    expect(instructions).toContain('Step 1: Preparation');
    expect(instructions).not.toContain('capabilities: []');
    expect(preparation).toContain('xirang arch impact <identity> --depth <n> --json');
    expect(preparation).toContain('xirang arch query <identities...> --contract --json');
    expect(preparation).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
    expect(preparation).toContain('one Element has at most one Contract');
  });

  it('does not carry obsolete generated subagent artifact warnings', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).not.toContain('## Skill Delegation Protocol');
    expect(instructions).not.toContain('**Internal Subagents**');
    expect(instructions).not.toContain('generated `xirang-impact-sweeper`');
    expect(instructions).not.toContain('generated `xirang-reviewer`');
    expect(instructions).not.toContain('generated `xirang-optimizer`');
    expect(instructions).not.toContain('.claude/skills/xirang-reviewer/SKILL.md');
    expect(instructions).not.toContain('/skills/xirang-optimizer/SKILL.md');
  });

  it('keeps implementation discipline directly in the apply skill', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const discipline = instructions
      .split('## Implementation Discipline\n\n')[1]
      .split('\n\nWhen the seal passes')[0];

    expect(instructions).toContain('## Implementation Discipline');
    expect(instructions).toContain('Implementation loop — process all pending tasks and Required Corrections as task-level TDD loops');
    expect(discipline).toContain('unfinished `## Required Corrections` `[code_fix]` and `[artifact_fix]` items before pending tasks');
    expect(discipline).toContain('Each task is one TDD loop');
    expect(discipline).toContain('Assess interface testability before writing tests');
    expect(discipline).toContain('Exercise public behavior; mock only injected system boundaries, never internal collaborators');
    expect(discipline).toContain('honor the declared Test action');
    expect(discipline).toContain('Do not manufacture RED');
    expect(discipline).toContain('rerun the same Check and confirm GREEN');
    expect(discipline).toContain('Non-runtime text or artifact Checks do not require an artificial RED');
    expect(discipline).toContain('Update Check and Required Corrections checkboxes only after their declared evidence passes');
    expect(discipline).toContain('two consecutive identical normalized errors');
    expect(discipline).toContain('three failed fixes in one task');
    expect(discipline).toContain('deletion, standard library, native platform support, installed dependencies, direct expressions');
    expect(instructions).not.toContain('Ponytail');
    expect(instructions).not.toContain('Superpowers');
    expect(instructions).not.toContain('Pocock');
  });

  it('runs task-level TDD before one change-level Review', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain('Each task is one TDD loop');
    expect(instructions).toContain('completing one task does not leave the loop');
    expect(instructions).toContain('Completing one ordinary task MUST NOT trigger a change-level Review');
    expect(instructions).toContain('Only after every pending task and Required Correction is complete');
    expect(instructions).toContain('one change-level review of that completed state');
    expect(instructions).toContain('require another change-level Review after recovery completes');
  });

  it('keeps apply optimization checkpoint commands in the optimization reference', () => {
    const reference = applyReference('references/apply-step-4-optimization.md');

    expect(reference).toContain('git commit -m "wip: opt-checkpoint-r0 (baseline)"');
    expect(reference).toContain('git commit -m "wip: opt-r${N} (${directionId}: ${description})"');
    expect(reference).toContain('git reset --hard HEAD');
    expect(reference).toContain('git clean -fd');
    expect(reference).toContain('judge the remaining directions');
    expect(reference).toContain('xirang quality optimize');
    expect(reference).toContain('xirang quality seal');
    expect(reference).not.toContain('git stash push');
    expect(reference).not.toContain('git stash apply');
    expect(reference).not.toContain('git tag apply-opt-checkpoint');
    expect(reference).not.toContain('verify phase1');
    expect(reference).not.toContain('--type=');
  });

  it('defines native git isolation and keeps dirty-state routing out of method references', () => {
    const preparation = applyReference('references/apply-step-1-preparation.md');
    const branch = applyReference('references/apply-step-2-branch-isolation.md');
    const worktree = applyReference('references/apply-step-2-worktree-isolation.md');
    const current = applyReference('references/apply-step-2-current-branch.md');

    expect(preparation).toContain('worktree isolation');
    expect(preparation).toContain('include in baseline');
    expect(preparation).toContain('or stop.');

    const branchCaptureIndex = branch.indexOf('Record the current branch as `originalBranch` and resolve the current `HEAD` SHA as `baseCommit` before switching');
    const branchDetectionIndex = branch.indexOf('git show-ref --verify --quiet');

    expect(branchCaptureIndex).toBeGreaterThan(-1);
    expect(branchDetectionIndex).toBeGreaterThan(branchCaptureIndex);
    expect(branch).toContain('explicit confirmation before `git switch <change-name>`');
    expect(branch).toContain('git switch -c');
    expect(branch).toContain('verify `git branch --show-current` equals `branchName`');
    expect(branch).toContain('dirty-state gate is resolved');
    expect(branch).not.toContain('worktree isolation');
    expect(branch).not.toContain('git worktree add');

    expect(worktree).toContain('git worktree add');
    expect(worktree).toContain('current `HEAD`');
    expect(worktree).toContain('changed file set');
    expect(worktree).toContain('task `Files`');
    expect(worktree).toContain('Check-referenced paths');
    expect(worktree).toContain('unfinished Required Corrections paths');
    expect(worktree).toContain('user-confirmed paths');
    expect(worktree).toContain('SHA-256');
    expect(worktree).toContain('`sourceState: "deleted"` and `sourceHash: null`');
    expect(worktree).toContain('tracked modifications and deletions');
    expect(worktree).toContain('untracked files only when their hash still matches');
    expect(worktree).toContain('entire file');
    expect(worktree).toContain('split it manually');
    expect(worktree).not.toContain('using-git-worktrees');
    expect(worktree).not.toContain('git stash');

    expect(current).toContain('dirty-state gate is resolved');
    expect(current).not.toContain('worktree isolation');
    expect(current).not.toContain('git switch -c');
    expect(current).not.toContain('git worktree add');
  });

  it('persists separate navigation and immutable evidence baselines', () => {
    const isolationReferences = [
      applyReference('references/apply-step-2-branch-isolation.md'),
      applyReference('references/apply-step-2-worktree-isolation.md'),
      applyReference('references/apply-step-2-current-branch.md'),
    ].join('\n');

    expect(isolationReferences).toContain('originalBranch');
    expect(isolationReferences).toContain('baseCommit');
    expect(isolationReferences).toContain('immutable evidence baseline');
    expect(isolationReferences).toContain('git status --short');
  });

  it('applies critical review writeback before recording the reviewer payload', () => {
    const reference = applyReference('references/apply-step-3-review.md');
    const validationIndex = reference.indexOf('Validate the reviewer payload');
    const writebackIndex = reference.indexOf('Apply only CRITICAL `writeBackPlan` entries');
    const recordIndex = reference.indexOf('xirang quality review "<change-name>"');

    expect(validationIndex).toBeGreaterThan(-1);
    expect(writebackIndex).toBeGreaterThan(validationIndex);
    expect(recordIndex).toBeGreaterThan(writebackIndex);
    expect(reference).toContain('tasksFileHash');
  });

  it('preserves persistent failed-direction state across speculative rollback', () => {
    const reference = applyReference('references/apply-step-4-optimization.md');
    const verificationIndex = reference.indexOf('"status":"verified"');
    const snapshotIndex = reference.indexOf('repository-external temporary file');
    const rollbackIndex = reference.indexOf('git reset --hard HEAD');
    const restoreIndex = reference.indexOf('restore all three files');

    expect(verificationIndex).toBeGreaterThan(-1);
    expect(snapshotIndex).toBeGreaterThan(verificationIndex);
    expect(rollbackIndex).toBeGreaterThan(snapshotIndex);
    expect(restoreIndex).toBeGreaterThan(rollbackIndex);
    expect(reference).toContain('SHA-256');
    expect(reference).toContain('failed directions');
    expect(reference).toContain('`.apply-isolation.json`');
    expect(reference).toContain('.quality-state.json');
    expect(reference).toContain('.quality-log.jsonl');
    expect(reference).toContain('Stop if restoration or hash verification fails');
  });

  it('orders the optimizer round, CLI selection, implementation, and round review', () => {
    const content = applyReference('references/apply-step-4-optimization.md');

    const delegateIndex = content.indexOf('Delegate to a fresh `xirang-optimizer`');
    const submitIndex = content.indexOf('xirang quality optimize "<change-name>"');
    const implementationIndex = content.indexOf('Implement the selected direction with TDD');
    const verificationIndex = content.indexOf('Delegate to a fresh `xirang-reviewer`');
    const outcomeIndex = content.indexOf('Report the round outcome on the next optimization call');

    expect(delegateIndex).toBeGreaterThan(-1);
    expect(submitIndex).toBeGreaterThan(delegateIndex);
    expect(implementationIndex).toBeGreaterThan(submitIndex);
    expect(verificationIndex).toBeGreaterThan(implementationIndex);
    expect(outcomeIndex).toBeGreaterThan(verificationIndex);
    expect(content.indexOf('judge the remaining directions', outcomeIndex)).toBeGreaterThan(outcomeIndex);
    expect(content).toContain('optimization.directionLimit');
    expect(content).toContain('optimization.directionRetries');
    expect(content).toContain('a successful round never consumes the failure budget');
    expect(content).toContain('preservationConstraints');
    expect(content).not.toContain('Search/Replace');
    expect(content).not.toContain('delete/stdlib/native/yagni/shrink');
  });

  it('documents the apply quality workflow through outline and step references', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain('Step 3: Review');
    expect(instructions).toContain('Step 4: Optimization');
    expect(instructions).toContain('Step 5: Seal');
    expect(instructions).toContain('delegate to the clean-context `xirang-reviewer` agent');
    expect(instructions).toContain('delegate to the clean-context `xirang-optimizer` agent');
    expect(instructions).not.toContain('invoke the `xirang-reviewer` skill');
    expect(instructions).not.toContain('invoke the `xirang-optimizer` skill');

    expect(applyReference('references/apply-step-3-review.md')).toContain('xirang quality review "<change-name>"');
    expect(applyReference('references/apply-step-4-optimization.md')).toContain('xirang quality optimize');
    expect(applyReference('references/apply-step-5-seal.md')).toContain('xirang quality seal "<change-name>"');
  });

  it('renders the shared quality fragments only through the shared constants', () => {
    const reference = applyReference('references/apply-step-4-optimization.md');

    expect(reference).toContain(QUALITY_STATE_MACHINE_DIAGRAM);
    expect(reference).toContain(QUALITY_CHECKPOINT_STATE_MACHINE);
    expect(reference).toContain(QUALITY_CLI_JSON_SCHEMA_REFERENCE);
    expect(reference).toContain(QUALITY_ERROR_RECOVERY_GUIDE);
    expect(reference).toContain(QUALITY_SIMPLE_CHANGE_FAST_PATH);
  });

  it('places the state diagram before the checkpoint table and the hard rules after it', () => {
    const reference = applyReference('references/apply-step-4-optimization.md');

    expect(reference.indexOf(QUALITY_STATE_MACHINE_DIAGRAM)).toBeLessThan(
      reference.indexOf('| State | Trigger condition | Git operation |')
    );
    expect(reference.indexOf('| State | Trigger condition | Git operation |')).toBeLessThan(
      reference.indexOf('**Hard rules**')
    );
  });

  it('routes seal failure into Required Corrections and recovery in the seal reference', () => {
    const reference = applyReference('references/apply-step-5-seal.md');

    expect(reference).toContain('If seal fails, preserve');
    expect(reference).toContain('convert them into Required Corrections context');
    expect(reference).toContain('map the corrections to the affected task');
    expect(reference).toContain('return to the implementation loop');
    expect(reference).toContain('Do not pause on the first seal failure');
  });

  it('uses canonical archive source reference for archive-ready handoff', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain('Archive ready. Run /xirang:archive <change-name> to complete the workflow.');
    expect(instructions).not.toContain('Archive ready. Run /xirang-archive');
  });

  it('leaves branch and worktree cleanup to archive in the active apply workspace', () => {
    const output = applyReference('references/apply-step-6-output.md');

    expect(output).toContain('same Apply workspace');
    expect(output).toContain('MUST NOT switch branches');
    expect(output).toContain('MUST NOT remove the worktree');
    expect(output).toContain('Archive workflow');
  });

  it('allows archive-ready handoff to be adapted per tool', () => {
    const source = 'Archive ready. Run /xirang:archive <change-name> to complete the workflow.';

    expect(runTransforms(source, { toolId: 'codex', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run $xirang-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'claude', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /xirang-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'pi', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /skill:xirang-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'opencode', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /xirang-archive <change-name> to complete the workflow.'
    );
  });
});
