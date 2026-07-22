import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../../src/core/shared/subagent-generation.js';
import { OPSX_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getReviewerSubagentTemplate } from '../../../src/core/templates/workflows/reviewer.js';

describe('reviewer subagent template', () => {
  it('includes OPSX philosophy and concise quality discipline in the agent prompt', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain(OPSX_PHILOSOPHY);
    expect(prompt).toContain('Element Contract registry');
    expect(prompt).toContain('opsx arch query <elementId> --relations --depth <n> --json');
    expect(prompt).toContain('Prefer direct evidence over inferred intent.');
    expect(prompt).toContain('Treat stale code, orphaned imports, half migrations, and unaccounted behavior changes as defects.');
    expect(prompt).toContain('Semantic Model relationship paths');
    expect(prompt).not.toContain('OPSX code-map refs');
    expect(prompt).not.toContain('Ponytail');
    expect(prompt).not.toContain('Superpowers');
  });

  it('declares read-only permission intent in the source model and renderers', () => {
    const template = getReviewerSubagentTemplate();

    expect(template.name).toBe('opsx-reviewer');
    expect(template).not.toHaveProperty('instructions');
    expect(template.prompt).toContain('clean-context Phase 1 reviewer');
    expect(template.tools).toEqual(expect.arrayContaining(['read', 'grep', 'find', 'bash']));
    expect(template.disallowedTools).toEqual(expect.arrayContaining(['write', 'edit']));

    expect(generateSubagentContent(template, 'claude', 'TEST')).toContain('Bash');
    expect(generateSubagentContent(template, 'pi', 'TEST')).toContain('name: opsx-reviewer');
    expect(generateSubagentContent(template, 'opencode', 'TEST')).toContain('edit: deny');
    expect(generateSubagentContent(template, 'codex', 'TEST')).toContain('sandbox_mode = "read-only"');
  });

  it('uses the immutable apply baseline plus uncommitted files for scope navigation', () => {
    const prompt = getReviewerSubagentTemplate().prompt;

    expect(prompt).toContain('baseCommit');
    expect(prompt).toContain('git diff <baseCommit>...HEAD --name-only');
    expect(prompt).toContain('git status --short');
    expect(prompt).not.toContain('git diff <originalBranch>...HEAD');
  });
});
