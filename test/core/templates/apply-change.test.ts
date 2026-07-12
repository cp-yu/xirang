import { describe, expect, it } from 'vitest';

import {
  OPSX_COMPILATION_PHILOSOPHY,
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
  it('keeps the OPSX compilation philosophy in the skill surface', () => {
    expect(getApplyChangeSkillTemplate().instructions).toContain(OPSX_COMPILATION_PHILOSOPHY);
  });

  it('keeps one reference file per apply workflow step', () => {
    const template = getApplyChangeSkillTemplate();

    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/apply-step-1-preparation.md',
      'references/apply-step-2-preflight-scan.md',
      'references/apply-step-3-branch-isolation.md',
      'references/apply-step-4-phase1-verification.md',
      'references/apply-step-5-phase2-optimization.md',
      'references/apply-step-6-phase3-seal.md',
      'references/apply-step-7-output.md',
    ]);

    for (const reference of template.referenceFiles ?? []) {
      const sharedPath = `openspec/references/openspec-${reference.path.replace('references/', '')}`;
      expect(template.instructions).toContain(sharedPath);
    }
  });

  it('keeps flow details in step references instead of the skill outline', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;
    const preparation = applyReference('references/apply-step-1-preparation.md');

    expect(instructions).toContain('## Flow Outline');
    expect(instructions).toContain('Step 1: Preparation');
    expect(instructions).not.toContain('openspec list --specs --json');
    expect(instructions).not.toContain('capabilities: []');
    expect(preparation).toContain('openspec list --specs --json');
    expect(preparation).toContain('capabilities: []');
  });

  it('does not carry obsolete generated subagent artifact warnings', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).not.toContain('## Skill Delegation Protocol');
    expect(instructions).not.toContain('**Internal Subagents**');
    expect(instructions).not.toContain('generated `openspec-impact-sweeper`');
    expect(instructions).not.toContain('generated `openspec-reviewer`');
    expect(instructions).not.toContain('generated `openspec-optimizer`');
    expect(instructions).not.toContain('.claude/skills/openspec-reviewer/SKILL.md');
    expect(instructions).not.toContain('/skills/openspec-optimizer/SKILL.md');
  });

  it('keeps concise implementation discipline directly in the apply skill without borrowed framework names', () => {
    const instructions = getApplyChangeSkillTemplate().instructions;

    expect(instructions).toContain('Write or update targeted tests before behavior/code changes.');
    expect(instructions).toContain('Verify the expected failure before implementation, then rerun the same check after the minimal fix.');
    expect(instructions).toContain('Prefer deletion, standard library, native platform support, installed dependencies, and direct expressions before adding new code.');
    expect(instructions).toContain('Exercise public behavior; mock only system boundaries injected through parameters.');
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
  });

  it('orders finding reconciliation, freshness gate, master implementation, and reviewer verification', () => {
    const content = applyReference('references/apply-step-5-phase2-optimization.md');

    const reconciliationIndex = content.indexOf('optimizer reconciliation envelope');
    const freshnessIndex = content.indexOf('mode":"begin-implementation');
    const implementationIndex = content.indexOf('Master implements only the selected finding with TDD');
    const verificationIndex = content.indexOf('openspec verify phase2 "<change-name>" --type=verification');
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
    expect(instructions).toContain('delegate to the clean-context `openspec-reviewer` agent');
    expect(instructions).toContain('delegate to the clean-context `openspec-optimizer` agent');
    expect(instructions).not.toContain('invoke the `openspec-reviewer` skill');
    expect(instructions).not.toContain('invoke the `openspec-optimizer` skill');

    expect(applyReference('references/apply-step-4-phase1-verification.md')).toContain('openspec verify phase1 "<change-name>"');
    expect(applyReference('references/apply-step-5-phase2-optimization.md')).toContain('openspec verify phase2');
    expect(applyReference('references/apply-step-6-phase3-seal.md')).toContain('openspec verify seal "<change-name>"');
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

  it('allows archive-ready handoff to be adapted per tool', () => {
    const source = 'Archive ready. Run /opsx:archive <change-name> to complete the workflow.';

    expect(runTransforms(source, { toolId: 'codex', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run $openspec-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'claude', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /openspec-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'pi', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /skill:openspec-archive-change <change-name> to complete the workflow.'
    );
    expect(runTransforms(source, { toolId: 'opencode', workflowId: 'apply', artifactType: 'skill' })).toBe(
      'Archive ready. Run /opsx-archive <change-name> to complete the workflow.'
    );
  });
});
