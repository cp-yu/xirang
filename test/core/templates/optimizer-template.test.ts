import { describe, expect, it } from 'vitest';

import { XIRANG_PHILOSOPHY } from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getOptimizerSubagentTemplate } from '../../../src/core/templates/workflows/optimizer.js';

describe('optimizer subagent template', () => {
  it('includes Xirang philosophy and finding-first optimization discipline', () => {
    const template = getOptimizerSubagentTemplate();
    const prompt = template.prompt;

    expect(prompt).toContain(XIRANG_PHILOSOPHY);
    expect(prompt).toContain('one Element has at most one Contract');
    expect(prompt).toContain('xirang arch outline --format json');
    expect(prompt).toContain('xirang arch impact <identity> --depth <n> --json');
    expect(prompt).toContain('xirang arch query <identities...> --contract --json');
    expect(prompt).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
    expect(prompt).toContain('Preserve observable behavior, Element Contracts');
    expect(prompt).toContain('finding-first');
    expect(prompt).toContain('strict JSON envelope');
    expect(prompt).toContain('keyDesign');
    expect(prompt).toContain('preservationConstraints');
    expect(prompt).not.toContain('Search/Replace');
    expect(prompt).not.toContain('delete/stdlib/native/yagni/shrink');
    expect(template).not.toHaveProperty('model');
  });

  it('preserves read-only self-read and reconciliation protocol', () => {
    const template = getOptimizerSubagentTemplate();

    expect(template.name).toBe('xirang-optimizer');
    expect(template).not.toHaveProperty('instructions');
    expect(template.prompt).toContain('MUST NOT modify files');
    expect(template.prompt).toContain('failedDirections');
    expect(template.prompt).toContain('reconcile every non-terminal finding');
    expect(template.referenceFiles?.map((file) => file.path)).toEqual([
      'references/self-read-protocol.md',
      'references/decision-rules.md',
      'references/output-protocol.md',
    ]);
    expect(template.disallowedTools).toEqual(expect.arrayContaining(['write', 'edit']));
  });

  it('uses the immutable apply baseline plus uncommitted files for base scope', () => {
    const selfRead = getOptimizerSubagentTemplate().referenceFiles?.find(
      (file) => file.path === 'references/self-read-protocol.md'
    )?.content ?? '';

    expect(selfRead).toContain('baseCommit');
    expect(selfRead).toContain('git diff <baseCommit>...HEAD --name-only');
    expect(selfRead).toContain('git status --short');
    expect(selfRead).toContain('every Semantic Delta unit under changeDir/{metamodel,elements,relationships,views}/');
    expect(selfRead).toContain('xirang arch impact <identity> --depth 1 --json');
    expect(selfRead).toContain('xirang arch query <selected-identities...> --contract --json');
    expect(selfRead).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
    expect(selfRead).not.toContain('git diff <originalBranch>...HEAD');
    expect(selfRead).not.toContain('specs/*/spec.md');
  });
});
