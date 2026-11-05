import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../src/core/shared/subagent-generation.js';
import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

function normalizeSelfRead(content: string): string {
  const start = content.indexOf('## Self-Read Protocol');
  const end = content.indexOf('## Verification Protocol');
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return content
    .slice(start, end)
    .replace(/^---[\s\S]*?---\n/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('xirang reviewer skill content', () => {
  it('contains absence-check protocol for REMOVED anchors', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('REMOVED Section');
    expect(instructions).toContain('multi-angle');
    expect(instructions).toContain('symbol');
    expect(instructions).toContain('import');
    expect(instructions).toContain('residue');
    expect(instructions).toContain('absence');
  });

  it('judges behavior preservation from goal direction and evidence', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('behavior-preservation goal');
    expect(instructions).toContain('goal\'s verification direction');
    expect(instructions).toContain('old and new implementations coexist contrary to the goal');
  });

  it('treats goal checkboxes as progress and verifies removals against Git and final state', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Goal checkboxes are progress markers, not deletion declarations');
    expect(instructions).toContain('Confirm requested removals against actual Git changes and final repository contents');
    expect(instructions).not.toContain('task `Files`');
    expect(instructions).not.toContain('Check `Command:`');
  });

  it('uses immutable baseline and uncommitted name-only scope instead of diff content', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('git diff <baseCommit>...HEAD --name-only');
    expect(instructions).toContain('git status --short');
    expect(instructions).toContain('name-only scope');
    expect(instructions).toContain('final file contents');
    expect(instructions).not.toContain('git diff <originalBranch>...HEAD');
    expect(instructions).not.toContain('git log -5 --oneline');
  });

  it('fails closed when the immutable baseline is missing or invalid', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('changeDir/.apply-isolation.json');
    expect(instructions).toContain('baseCommit');
    expect(instructions).toContain('immutable evidence baseline is absent or invalid');
    expect(instructions).toContain('CRITICAL');
    expect(instructions).not.toContain('git symbolic-ref refs/remotes/origin/HEAD --short');
  });

  it('keeps codex and claude reviewer subagent self-read sections equivalent', () => {
    const template = getReviewerSubagentTemplate();
    const codex = generateSubagentContent(template, 'codex', 'test');
    const claude = generateSubagentContent(template, 'claude', 'test');

    expect(normalizeSelfRead(codex)).toBe(normalizeSelfRead(claude));
    expect(normalizeSelfRead(codex)).toBe(normalizeSelfRead(template.prompt));
  });
});
