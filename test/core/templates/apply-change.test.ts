import { describe, expect, it } from 'vitest';

import {
  QUALITY_CLI_JSON_SCHEMA_REFERENCE,
  QUALITY_ERROR_RECOVERY_GUIDE,
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
    expect(references).toHaveLength(11);
    for (const reference of references) {
      expect(reference.content.length).toBeGreaterThan(0);
    }
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
    const queryIndex = preparation.indexOf('xirang arch query <identity> --json');

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
      'references/quality-recovery.md',
      'references/quality-cli.md',
      'references/optimization-failure-diagnosis.md',
      'references/apply-step-3-review.md',
      'references/apply-step-4-optimization.md',
      'references/apply-step-5-seal.md',
      'references/apply-step-6-output.md',
    ]);

    for (const reference of template.referenceFiles?.filter((file) => !file.path.includes('apply-step-2-')) ?? []) {
      const sharedPath = `.xirang/references/xirang-${reference.path.replace('references/', '')}`;

      expect([template.instructions, ...template.referenceFiles!.map(file => file.content)].join('\n')).toContain(sharedPath);
    }
  });

  it('delegates Review dimensions and records one consolidated v4 opinion', () => {
    const review = applyReference('references/apply-step-3-review.md');

    expect(review).toContain('run the required tests, then commit the implementation');
    expect(review).toContain('non-conflicting quality dimensions');
    expect(review).toContain('Do not pass reviewId, scope, changeDir or a target commit');
    expect(review).toContain('Pi Reviewers run in the background');
    expect(review).toContain('consolidates all required dimension results into one opinion');
    expect(review).toContain('reviewKind: full-change');
    expect(review).toContain('incremental');
    expect(review).toContain('supplemental');
    expect(review).not.toContain('--begin');
    const recovery = applyReference('references/quality-recovery.md');
    expect(recovery).toContain('a new full-change Review');
    expect(recovery).toContain('no reviewId, scope or target commit is supplied');
    expect(recovery).toContain('Invalid delegation or HEAD movement is corrected and re-delegated');
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
    expect(instructions).toContain('credible evidence of unmet behavior');
    expect(instructions).not.toContain('公共方法数量少于 5');
    expect(instructions).not.toContain('每个方法参数少于 4');
  });

  it('carries no Pre-flight step in the apply workflow', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).not.toMatch(/Pre-flight|preflight/);
    expect(instructions).toContain('Step 1: Preparation');
    expect(instructions).toContain('Step 2: Isolation router');
    expect(instructions).toContain('Step 3: Review');
    expect(instructions).toContain('read `.xirang/references/xirang-apply-step-3-review.md`');
    expect(instructions).toContain('Step 4: Optimization');
    expect(instructions).toContain('Step 5: Seal');
    expect(instructions).toContain('Step 6: Output');
  });

  it('keeps Pi Reviewer scheduling in the Apply Review reference', () => {
    const review = applyReference('references/apply-step-3-review.md');

    expect(review).toContain('Pi Reviewers run in the background so environment extensions are available');
  });

  it('keeps flow details in step references instead of the skill outline', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');

    expect(instructions).toContain('## Flow Outline');
    expect(instructions).toContain('Step 1: Preparation');
    expect(instructions).not.toContain('capabilities: []');
    expect(preparation).toContain('xirang arch impact <identity> --depth <n> --json');
    expect(preparation).toContain('xirang arch query <identity> --json');
    expect(preparation).toContain('--contract');
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
    expect(instructions).toContain('Implementation loop — process all pending goals and Required Corrections');
    expect(discipline).toContain('unfinished `## Required Corrections` `[code_fix]` and `[artifact_fix]` items before pending goals');
    expect(discipline).toContain('A goal is complete only after implementation and credible evidence for its verification direction');
    expect(discipline).toContain('Assess interface testability before changing behavior');
    expect(discipline).toContain('For each pending goal, inspect existing tests and current behavior');
    expect(discipline).toContain('Do not manufacture RED');
    expect(discipline).toContain('verify the same observable behavior afterward');
    expect(discipline).toContain('Non-runtime artifact changes require final-state evidence');
    expect(discipline).toContain('Update goal and Required Corrections checkboxes');
    expect(discipline).toContain('two consecutive identical normalized errors');
    expect(discipline).toContain('three failed fixes in one goal');
    expect(discipline).toContain('deletion, standard library, native platform support, installed dependencies, direct expressions');
    expect(instructions).not.toContain('Ponytail');
    expect(instructions).not.toContain('Superpowers');
    expect(instructions).not.toContain('Pocock');
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
    expect(worktree).not.toContain('task `Files`');
    expect(worktree).toContain('actual Git diff/status scope');
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

  it('validates and reuses isolation metadata before selecting a first-run method', () => {
    const preparation = applyReference('references/apply-step-1-preparation.md');
    const resumeIndex = preparation.indexOf('If `changeDir/.apply-isolation.json` exists');
    const initializeIndex = preparation.indexOf('Only when isolation metadata is absent');

    expect(resumeIndex).toBeGreaterThan(-1);
    expect(initializeIndex).toBeGreaterThan(resumeIndex);
    expect(preparation).toContain('Git resolves `baseCommit` to a commit');
    expect(preparation).toContain('current branch matches `branchName`');
    expect(preparation).toContain('current repository root matches `worktreePath`');
    expect(preparation).toContain('Reuse the entire record unchanged');
    expect(preparation).toContain('`optimizationBaselineCommit`');
    expect(preparation).toContain('skip Step 2');
    expect(preparation).toContain('Stop on invalid metadata or workspace mismatch');
    expect(preparation).toContain('do not replace it from current HEAD, branch, config, or a newly requested isolation method');
    expect(getApplyChangeSkillTemplate().instructions).toContain('skip this step when Preparation validated existing isolation');
    for (const method of ['branch-isolation', 'worktree-isolation', 'current-branch']) {
      expect(applyReference(`references/apply-step-2-${method}.md`)).toContain('isolation metadata is absent');
    }
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

  it('renders the shared quality fragments only through the shared constants', () => {
    const reference = applyReference('references/quality-cli.md');

    expect(reference).toContain(QUALITY_CLI_JSON_SCHEMA_REFERENCE);
    expect(reference).toContain(QUALITY_ERROR_RECOVERY_GUIDE);
  });

  it('uses canonical archive source reference for archive-ready handoff', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain('Archive ready. Run /xirang:archive <change-name> to complete the workflow.');
    expect(instructions).not.toContain('Archive ready. Run /xirang-archive');
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
