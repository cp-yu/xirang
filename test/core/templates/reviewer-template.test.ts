import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../../src/core/shared/subagent-generation.js';
import { XIRANG_PHILOSOPHY, XIRANG_SHARED_CONTEXT } from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getReviewerSubagentTemplate } from '../../../src/core/templates/workflows/reviewer.js';

describe('reviewer subagent template', () => {
  it('includes Xirang philosophy and shared semantic navigation context', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain(XIRANG_PHILOSOPHY);
    expect(prompt).toContain(XIRANG_SHARED_CONTEXT);
    expect(prompt).toContain('xirang arch outline --format json');
    expect(prompt).toContain('xirang arch impact <identity> --depth <n> --json');
    expect(prompt).toContain('xirang arch query <identity> --json');
    expect(prompt).toContain('--contract');
    expect(prompt).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
    expect(prompt).toContain('semantic relationships');
  });

  it('judges coverage by observable behavior evidence, not one test per Acceptance Case', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('observable behavior');
    expect(prompt).toContain('One test may cover multiple cases');
    expect(prompt).toContain('weak test');
    expect(prompt).toContain('a WARNING in findings');
  });

  it('uses checkout-derived review kind and rejects stale delegation metadata', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('The main Agent supplies changeName, absolute projectRoot and reviewKind');
    expect(prompt).toContain('Derive changeDir from projectRoot and changeName');
    expect(prompt).toContain('full-change, incremental or supplemental');
    expect(prompt).toContain('Derive the target commit from checkout HEAD');
    expect(prompt).toContain('Capture HEAD before assessment and verify it is unchanged');
    expect(prompt).not.toContain('reviewId');
    expect(prompt).toContain('do not accept or infer a caller-supplied target commit');
    expect(prompt).not.toContain('defect-repair');
  });

  it('provides read-only responsibility without tool-level denial', () => {
    const template = getReviewerSubagentTemplate();
    expect(template.name).toBe('xirang-reviewer');
    expect(template.tools).toBeUndefined();
    expect(template.disallowedTools).toBeUndefined();
    expect(template.mode).toBe('workspace-write');
    expect(template.prompt).toContain('Do not modify project files');
    expect(generateSubagentContent(template, 'claude', 'TEST')).not.toContain('tools:');
    expect(generateSubagentContent(template, 'pi', 'TEST')).not.toContain('tools:');
    expect(generateSubagentContent(template, 'opencode', 'TEST')).toContain('edit: allow');
    expect(generateSubagentContent(template, 'codex', 'TEST')).toContain('sandbox_mode = "workspace-write"');
  });

  it('requires all Delta partitions before concluding there is no semantic change', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('every Semantic Delta unit under changeDir/{metamodel,elements,relationships,views}/');
    expect(prompt).toContain('Only when all four partitions are empty may you conclude the Change has no semantic Delta');
    expect(prompt).toContain('a partition you did not read is not empty');
    expect(prompt).not.toContain('xirangAlignment');
    expect(prompt).toContain('Do not repeat deterministic Propose/CLI structural validation such as hierarchy-cycle checks.');
  });

  it('uses the immutable apply baseline and committed HEAD as evidence', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('baseCommit');
    expect(prompt).toContain('git diff <baseCommit>...HEAD --name-only');
    expect(prompt).toContain('git status --short');
    expect(prompt).toContain('Do not read uncommitted worktree contents as implementation evidence');
    expect(prompt).not.toContain('git diff <originalBranch>...HEAD');
  });
});
