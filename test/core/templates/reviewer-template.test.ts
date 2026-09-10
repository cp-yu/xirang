import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../../src/core/shared/subagent-generation.js';
import { TEST_QUALITY_GUIDANCE, XIRANG_PHILOSOPHY } from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getReviewerSubagentTemplate } from '../../../src/core/templates/workflows/reviewer.js';

describe('reviewer subagent template', () => {
  it('includes Xirang philosophy and concise quality discipline in the agent prompt', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain(XIRANG_PHILOSOPHY);
    expect(prompt).toContain('one Element has at most one Contract');
    expect(prompt).toContain('xirang arch outline --format json');
    expect(prompt).toContain('xirang arch impact <identity> --depth <n> --json');
    expect(prompt).toContain('xirang arch query <identities...> --contract --json');
    expect(prompt).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
    expect(prompt).toContain('Prefer direct evidence over inferred intent.');
    expect(prompt).toContain('Treat stale code, orphaned imports, half migrations, and unaccounted behavior changes as defects.');
    expect(prompt).toContain('Semantic Model relationship paths');
    expect(prompt).not.toContain('Xirang code-map refs');
    expect(prompt).not.toContain('Ponytail');
    expect(prompt).not.toContain('Superpowers');
    expect(prompt).toContain(TEST_QUALITY_GUIDANCE);
  });

  it('judges coverage by observable behavior evidence rather than one test per Scenario', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('observable behavior');
    expect(prompt).toContain('one-time evidence');
    expect(prompt).not.toContain('Scenario coverage gaps are not downgrade candidates');
    expect(prompt).toContain('weak assertion');
  });

  it('declares read-only permission intent in the source model and renderers', () => {
    const template = getReviewerSubagentTemplate();

    expect(template.name).toBe('xirang-reviewer');
    expect(template).not.toHaveProperty('instructions');
    expect(template.prompt).toContain('clean-context reviewer');
    expect(template.tools).toEqual(expect.arrayContaining(['read', 'grep', 'find', 'bash']));
    expect(template.disallowedTools).toEqual(expect.arrayContaining(['write', 'edit']));

    expect(generateSubagentContent(template, 'claude', 'TEST')).toContain('Bash');
    expect(generateSubagentContent(template, 'pi', 'TEST')).toContain('name: xirang-reviewer');
    expect(generateSubagentContent(template, 'opencode', 'TEST')).toContain('edit: deny');
    expect(generateSubagentContent(template, 'codex', 'TEST')).toContain('sandbox_mode = "read-only"');
  });

  it('requires all four Delta partitions before concluding there is no semantic change', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('every Semantic Delta unit under changeDir/{metamodel,elements,relationships,views}/');
    expect(prompt).toContain('Only when all four partitions are empty may you conclude that the change carries no semantic change');
    expect(prompt).toContain('a partition you did not read is never an empty partition');
    expect(prompt).toContain('Element Declaration Entries');
    expect(prompt).toContain('Requirement Entries');
    expect(prompt).toContain('Relationship entries');
    expect(prompt).toContain('xirangAlignment');
    expect(prompt).not.toContain('architecture-delta');
    expect(prompt).not.toContain('specs/*/spec.md');
    expect(prompt).not.toContain('contract bindings');
  });

  it('emits issue fields accepted by the Phase 1 verify CLI', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('"message": "one line"');
    expect(prompt).not.toContain('"summary": "one line"');
  });

  it('uses the immutable apply baseline plus uncommitted files for scope navigation', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('baseCommit');
    expect(prompt).toContain('git diff <baseCommit>...HEAD --name-only');
    expect(prompt).toContain('git status --short');
    expect(prompt).not.toContain('git diff <originalBranch>...HEAD');
  });
});
