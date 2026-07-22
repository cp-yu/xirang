import { describe, expect, it } from 'vitest';

import {
  OPSX_PHILOSOPHY,
} from '../../../src/core/templates/fragments/opsx-fragments.js';
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
    expect(references).toHaveLength(9);
    for (const reference of references) {
      expect(reference.content.length).toBeGreaterThan(0);
    }
  });

  it('queries LikeC4 architecture and explains element IDs before implementation', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    expect(instructions).toContain('opsx arch query');
    expect(instructions).toContain('stable `elementId`');
    expect(instructions).toContain('FQN');
  });

  it('keeps the OPSX philosophy in the skill surface', () => {
    expect(getApplyChangeSkillTemplate().instructions).toContain(OPSX_PHILOSOPHY);
  });

  it('uses definition-first authoring without code-map navigation', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');
    expect(instructions).toContain('resolved file definition');
    expect(instructions).toContain('MUST NOT copy definitions');
    expect(preparation).toContain('opsx arch query');
    expect(preparation).toContain('.opsx/architecture/');
    expect(preparation).toContain('OPSX Semantic Model');
    expect(preparation).toContain('CodeGraph');
    expect(preparation).toContain('ACE');
    expect(preparation).not.toContain('project.opsx.code-map.yaml');
  });

  it('keeps one reference file per apply workflow step and one per isolation method', () => {
    const template = getApplyChangeSkillTemplate();

    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/apply-step-1-preparation.md',
      'references/apply-step-2-preflight-scan.md',
      'references/apply-step-3-branch-isolation.md',
      'references/apply-step-3-worktree-isolation.md',
      'references/apply-step-3-current-branch.md',
      'references/apply-step-4-phase1-verification.md',
      'references/apply-step-5-phase2-optimization.md',
      'references/apply-step-6-phase3-seal.md',
      'references/apply-step-7-output.md',
    ]);

    for (const reference of template.referenceFiles?.filter((file) => !file.path.includes('apply-step-3-')) ?? []) {
      const sharedPath = `.opsx/references/opsx-${reference.path.replace('references/', '')}`;
      expect(template.instructions).toContain(sharedPath);
    }
  });

  it('routes isolation without loading mutually exclusive method references', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');

    expect(instructions).toContain('Step 3: Isolation router');
    expect(instructions).not.toContain('opsx-apply-step-3-branch-isolation.md');
    expect(instructions).not.toContain('opsx-apply-step-3-worktree-isolation.md');
    expect(instructions).not.toContain('opsx-apply-step-3-current-branch.md');
    expect(preparation).toContain('At Step 3, read exactly one');
    expect(preparation).toContain('opsx-apply-step-3-branch-isolation.md');
    expect(preparation).toContain('opsx-apply-step-3-worktree-isolation.md');
    expect(preparation).toContain('opsx-apply-step-3-current-branch.md');
    expect(preparation).toContain('MUST NOT read the other two');
    expect(preparation).toContain('Do not read the selected reference during Preparation');
  });

  it('keeps flow details in step references instead of the skill outline', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');

    expect(instructions).toContain('## Flow Outline');
    expect(instructions).toContain('Step 1: Preparation');
    expect(instructions).not.toContain('opsx list --specs --json');
    expect(instructions).not.toContain('capabilities: []');
    expect(preparation).toContain('opsx list --specs --json');
    expect(preparation).toContain('Element Contract registry');
  });

  it('does not carry obsolete generated subagent artifact warnings', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).not.toContain('## Skill Delegation Protocol');
    expect(instructions).not.toContain('**Internal Subagents**');
    expect(instructions).not.toContain('generated `opsx-impact-sweeper`');
    expect(instructions).not.toContain('generated `opsx-reviewer`');
    expect(instructions).not.toContain('generated `opsx-optimizer`');
    expect(instructions).not.toContain('.claude/skills/opsx-reviewer/SKILL.md');
    expect(instructions).not.toContain('/skills/opsx-optimizer/SKILL.md');
  });

  it('keeps Phase 0 execution discipline directly in the apply skill', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const discipline = instructions
      .split('## Implementation Discipline\n\n')[1]
      .split('\n\nWhen Phase 3 seal passes')[0];
    const rules = discipline.split('\n').filter((line) => line.startsWith('- '));

    expect(rules).toHaveLength(9);
    expect(instructions).toContain('Phase 0 implementation — Master executes pending tasks serially');
    expect(discipline).toContain('unfinished `## Remediation` `[code_fix]` and `[artifact_fix]` items before pending tasks');
    expect(discipline).toContain('Finish every Check in the current task before starting the next; never execute tasks in parallel');
    expect(discipline).toContain('Assess interface testability before writing tests');
    expect(discipline).toContain('Exercise public behavior; mock only injected system boundaries, never internal collaborators');
    expect(discipline).toContain('confirm the expected RED');
    expect(discipline).toContain('rerun the same check for GREEN');
    expect(discipline).toContain('Non-runtime text/artifact Checks do not require an artificial RED');
    expect(discipline).toContain('Update Check and remediation checkboxes only after their evidence passes');
    expect(discipline).toContain('two consecutive identical normalized errors');
    expect(discipline).toContain('three failed fixes in one task');
    expect(discipline).toContain('deletion, standard library, native platform support, installed dependencies, direct expressions');
    expect(instructions).not.toContain('Ponytail');
    expect(instructions).not.toContain('Superpowers');
    expect(instructions).not.toContain('Pocock');
  });

  it('keeps apply Phase 2 checkpoint commands in the Phase 2 reference', () => {
    const reference = applyReference('references/apply-step-5-phase2-optimization.md');

    expect(reference).toContain('git commit -m "wip: opt-checkpoint-r0 (baseline)"');
    expect(reference).toContain('git commit -m "wip: opt-r${N} (${findingId}: ${description})"');
    expect(reference).toContain('git reset --hard HEAD');
    expect(reference).toContain('git clean -fd');
    expect(reference).toContain('re-run optimizer reconciliation against current code');
    expect(reference).not.toContain('If another retry remains, save the new successful state');
    expect(reference).not.toContain('git stash push');
    expect(reference).not.toContain('git stash apply');
    expect(reference).not.toContain('git tag apply-opt-checkpoint');
    expect(reference).not.toContain('--allow-empty');
  });

  it('defines native git isolation and keeps dirty-state routing out of method references', () => {
    const preparation = applyReference('references/apply-step-1-preparation.md');
    const branch = applyReference('references/apply-step-3-branch-isolation.md');
    const worktree = applyReference('references/apply-step-3-worktree-isolation.md');
    const current = applyReference('references/apply-step-3-current-branch.md');

    expect(preparation).toContain('switch to worktree isolation');
    expect(preparation).toContain('include the existing dirty state in the baseline');
    expect(preparation).toContain('stop Apply');
    expect(preparation).toContain('Finalize the isolation method only after this gate');

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
    expect(worktree).toContain('unfinished Remediation paths');
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
      applyReference('references/apply-step-3-branch-isolation.md'),
      applyReference('references/apply-step-3-worktree-isolation.md'),
      applyReference('references/apply-step-3-current-branch.md'),
    ].join('\n');

    expect(isolationReferences).toContain('originalBranch');
    expect(isolationReferences).toContain('baseCommit');
    expect(isolationReferences).toContain('immutable evidence baseline');
    expect(isolationReferences).toContain('git status --short');
  });

  it('waits for pre-flight finding decisions and matches label-free scenario titles', () => {
    const reference = applyReference('references/apply-step-2-preflight-scan.md');

    expect(reference).toContain('remove the scenario operation label');
    expect(reference).toContain('modify `tasks.md`');
    expect(reference).toContain('explicitly confirm that the findings are ignored');
    expect(reference).toContain('proceed silently when the scan is clean');
  });

  it('applies critical Phase 1 writeback before recording the reviewer payload', () => {
    const reference = applyReference('references/apply-step-4-phase1-verification.md');
    const validationIndex = reference.indexOf('Validate the reviewer payload');
    const writebackIndex = reference.indexOf('Apply only CRITICAL `writeBackPlan` entries');
    const recordIndex = reference.indexOf('opsx verify phase1 "<change-name>"');

    expect(validationIndex).toBeGreaterThan(-1);
    expect(writebackIndex).toBeGreaterThan(validationIndex);
    expect(recordIndex).toBeGreaterThan(writebackIndex);
    expect(reference).toContain('tasksFileHash');
  });

  it('preserves persistent failed-direction state across speculative rollback', () => {
    const reference = applyReference('references/apply-step-5-phase2-optimization.md');
    const verificationIndex = reference.indexOf('--type=verification');
    const snapshotIndex = reference.indexOf('repository-external temporary file');
    const rollbackIndex = reference.indexOf('git reset --hard HEAD');
    const restoreIndex = reference.indexOf('atomically restore `.verify-result.json`');

    expect(snapshotIndex).toBeGreaterThan(verificationIndex);
    expect(rollbackIndex).toBeGreaterThan(snapshotIndex);
    expect(restoreIndex).toBeGreaterThan(rollbackIndex);
    expect(reference).toContain('SHA-256');
    expect(reference).toContain('failedDirections');
    expect(reference).toContain('`.apply-isolation.json`');
    expect(reference).toContain('both persistent state files');
    expect(reference).toContain('Stop if restoration or hash verification fails');
  });

  it('orders finding reconciliation, freshness gate, master implementation, and reviewer verification', () => {
    const content = applyReference('references/apply-step-5-phase2-optimization.md');

    const reconciliationIndex = content.indexOf('optimizer reconciliation envelope');
    const freshnessIndex = content.indexOf('mode":"begin-implementation');
    const implementationIndex = content.indexOf('Master implements only the selected finding with TDD');
    const verificationIndex = content.indexOf('opsx verify phase2 "<change-name>" --type=verification');
    const nextReconciliationIndex = content.indexOf('re-run optimizer reconciliation against current code');

    expect(reconciliationIndex).toBeGreaterThan(-1);
    expect(freshnessIndex).toBeGreaterThan(reconciliationIndex);
    expect(implementationIndex).toBeGreaterThan(freshnessIndex);
    expect(verificationIndex).toBeGreaterThan(implementationIndex);
    expect(nextReconciliationIndex).toBeGreaterThan(verificationIndex);
    expect(content).toContain('Successful findings do not consume optRetries');
    expect(content).toContain('masterChallenge');
    expect(content).toContain('preservationConstraints');
    expect(content).not.toContain('Search/Replace');
    expect(content).not.toContain('delete/stdlib/native/yagni/shrink');
  });

  it('documents the Phase 0-3 apply + verify workflow through outline and step references', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain('Phase 1 verification');
    expect(instructions).toContain('Phase 2 optimization');
    expect(instructions).toContain('Phase 3 seal');
    expect(instructions).toContain('delegate to the clean-context `opsx-reviewer` agent');
    expect(instructions).toContain('delegate to the clean-context `opsx-optimizer` agent');
    expect(instructions).not.toContain('invoke the `opsx-reviewer` skill');
    expect(instructions).not.toContain('invoke the `opsx-optimizer` skill');

    expect(applyReference('references/apply-step-4-phase1-verification.md')).toContain('opsx verify phase1 "<change-name>"');
    expect(applyReference('references/apply-step-5-phase2-optimization.md')).toContain('opsx verify phase2');
    expect(applyReference('references/apply-step-6-phase3-seal.md')).toContain('opsx verify seal "<change-name>"');
  });

  it('routes seal failure into remediation and recovery in the seal reference', () => {
    const reference = applyReference('references/apply-step-6-phase3-seal.md');

    expect(reference).toContain('If seal fails, preserve diagnostics, convert them into remediation context');
    expect(reference).toContain('map the remediation to the affected task');
    expect(reference).toContain('return to Phase 0 recovery');
    expect(reference).toContain('Do not pause on the first seal failure');
  });

  it('uses canonical archive source reference for archive-ready handoff', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain('Archive ready. Run /opsx:archive <change-name> to complete the workflow.');
    expect(instructions).not.toContain('Archive ready. Run /opsx-archive');
  });

  it('leaves branch and worktree cleanup to archive in the active apply workspace', () => {
    const output = applyReference('references/apply-step-7-output.md');

    expect(output).toContain('same Apply workspace');
    expect(output).toContain('MUST NOT switch branches');
    expect(output).toContain('MUST NOT remove the worktree');
    expect(output).toContain('Archive workflow');
  });

  it('allows archive-ready handoff to be adapted per tool', () => {
    const source = 'Archive ready. Run /opsx:archive <change-name> to complete the workflow.';

    expect(runTransforms(source, { toolId: 'codex', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run $opsx-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'claude', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /opsx-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'pi', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /skill:opsx-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'opencode', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /opsx-archive <change-name> to complete the workflow.'
    );
  });
});
