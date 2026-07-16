import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

const projectRoot = process.cwd();

function readSkill(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf-8');
}

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

describe('openspec reviewer skill content', () => {
  it('contains absence-check protocol for REMOVED anchors', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('REMOVED Requirement');
    expect(instructions).toContain('multi-angle');
    expect(instructions).toContain('symbol');
    expect(instructions).toContain('import');
    expect(instructions).toContain('residue');
    expect(instructions).toContain('absence');
  });

  it('contains dual-branch equivalence check for Preserves anchors', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Preserves');
    expect(instructions).toContain('old form');
    expect(instructions).toContain('half migration');
    expect(instructions).toContain('coexist');
  });

  it('contains Delete declaration vs git diff cross-check in Completeness', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Delete:');
    expect(instructions).toContain('git diff <baseCommit>...HEAD');
    expect(instructions).toContain('git status --short');
    expect(instructions).toContain('still exists');
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
    const codex = readSkill('.codex/agents/openspec-reviewer.toml');
    const claude = readSkill('.claude/agents/openspec-reviewer.md');

    expect(normalizeSelfRead(codex)).toBe(normalizeSelfRead(claude));
    expect(normalizeSelfRead(codex)).toBe(normalizeSelfRead(getReviewerSubagentTemplate().prompt));
  });
});
