import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getOptimizerSubagentTemplate } from '../../src/core/templates/workflows/optimizer.js';

const projectRoot = process.cwd();

function readSkill(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf-8');
}

function readReference(name: string): string {
  const template = getOptimizerSubagentTemplate();
  const reference = template.referenceFiles?.find((file) => file.path === name);
  expect(reference).toBeDefined();
  return reference!.content;
}

function normalizeSelfRead(content: string): string {
  const start = content.indexOf('# Optimizer Self-Read Protocol');
  const end = content.indexOf('## Dependency Expansion (One Hop)');
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return content
    .slice(start, end)
    .replace(/^---[\s\S]*?---\n/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('openspec optimizer skill content', () => {
  it('uses immutable baseline plus uncommitted name-only scope and avoids diff hunk evidence', () => {
    const instructions = readReference('references/self-read-protocol.md');

    expect(instructions).toContain('git diff <baseCommit>...HEAD --name-only');
    expect(instructions).toContain('git status --short');
    expect(instructions).toContain('base scope');
    expect(instructions).toContain('changeDir/.apply-isolation.json');
    expect(instructions).toContain('immutable evidence baseline');
    expect(instructions).not.toContain('git diff <originalBranch>...HEAD');
  });

  it('documents one-hop dependency expansion through imports callers and OPSX relations', () => {
    const instructions = readReference('references/self-read-protocol.md');

    expect(instructions).toContain('## Dependency Expansion (One Hop)');
    expect(instructions).toContain('imports');
    expect(instructions).toContain('callers');
    expect(instructions).toContain('OPSX semantic relations');
    expect(instructions).toContain('Registry meaning');
    expect(instructions).not.toMatch(/\bdepends_on\b|\brelates_to\b/);
    expect(instructions).toContain('one hop');
  });

  it('limits actionable findings to base scope files', () => {
    const instructions = readReference('references/self-read-protocol.md');

    expect(instructions).toContain('Expansion candidates MUST NOT be actionable finding targets');
    expect(instructions).toContain('base scope files only');
    expect(instructions).toContain('scope-outside opportunities as deferred');
  });

  it('documents expansion filtering and relations fallback', () => {
    const instructions = readReference('references/self-read-protocol.md');

    expect(instructions).toContain('path.relative');
    expect(instructions).toContain('gitignore');
    expect(instructions).toContain('node_modules');
    expect(instructions).toContain('dist');
    expect(instructions).toContain('build');
    expect(instructions).toContain('.git');
    expect(instructions).toContain('project.opsx.relations.yaml');
    expect(instructions).toContain('If relations are missing');
  });

  it('keeps codex and claude optimizer skill self-read sections equivalent', () => {
    const codex = readSkill('openspec/references/openspec-self-read-protocol.md');
    const claude = readSkill('openspec/references/openspec-self-read-protocol.md');

    expect(normalizeSelfRead(codex)).toBe(normalizeSelfRead(claude));
    expect(normalizeSelfRead(codex)).toBe(normalizeSelfRead(readReference('references/self-read-protocol.md')));
  });

  it('documents open optimization signals and strict finding output', () => {
    const instructions = [
      readReference('references/decision-rules.md'),
      readReference('references/output-protocol.md'),
    ].join('\n');

    expect(instructions).toContain('non-exhaustive signals');
    expect(instructions).toContain('duplication');
    expect(instructions).toContain('algorithmic complexity');
    expect(instructions).toContain('data structures');
    expect(instructions).toContain('repeated I/O');
    expect(instructions).toContain('allocations and resource use');
    expect(instructions).toContain('actual benefit');
    expect(instructions).toContain('static evidence');
    expect(instructions).toContain('behavior preservation');
    expect(instructions).toContain('"blockingObservations"');
    expect(instructions).toContain('"actions"');
    expect(instructions).toContain('"findings"');
    expect(instructions).toContain('"keyDesign"');
    expect(instructions).toContain('"preservationConstraints"');
    expect(instructions).toContain('"priorityReason"');
    expect(instructions).toContain('actionIndex');
    expect(instructions).not.toContain('Search/Replace');
    expect(instructions).not.toContain('Code Smell:');
    expect(instructions).not.toContain('delete/stdlib/native/yagni/shrink');
  });
});
