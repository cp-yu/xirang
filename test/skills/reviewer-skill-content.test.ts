import { describe, expect, it } from 'vitest';

import { generateSubagentContent } from '../../src/core/shared/subagent-generation.js';
import { getReviewerSubagentTemplate } from '../../src/core/templates/workflows/reviewer.js';

function normalizePrompt(content: string): string {
  return content.slice(content.indexOf('## Role')).replace(/\n"""\s*$/, '').replace(/\s+/g, ' ').trim();
}

describe('xirang reviewer skill content', () => {
  it('validates the delegation and binds the opinion to an unchanged checkout HEAD', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Validate changeName, absolute projectRoot, the derived changeDir, reviewKind and the required isolation metadata');
    expect(instructions).toContain('Read baseCommit from changeDir/.apply-isolation.json and verify it resolves');
    expect(instructions).toContain('Derive the target commit from checkout HEAD');
    expect(instructions).toContain('Capture HEAD before assessment and verify it is unchanged before returning');
    expect(instructions).toContain('delegation error');
    expect(instructions).toContain('return no Review opinion');
  });

  it('uses diffs for navigation and committed HEAD contents as evidence', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('git diff <baseCommit>...HEAD --name-only');
    expect(instructions).toContain('git status --short');
    expect(instructions).toContain('Do not read uncommitted worktree contents as implementation evidence');
    expect(instructions).toContain('final committed file paths and line ranges');
    expect(instructions).not.toContain('git diff <originalBranch>...HEAD');
    expect(instructions).not.toContain('git log -5 --oneline');
  });

  it('distinguishes all review kinds and limits judgments to assigned dimensions', () => {
    const instructions = getReviewerSubagentTemplate().prompt;

    expect(instructions).toContain('Full-change Review assesses the entire Change');
    expect(instructions).toContain('Incremental Review assesses the assigned cumulative post-Opt changes');
    expect(instructions).toContain('Supplemental Review assesses the repair of a pre-existing Change defect');
    expect(instructions).toContain('Review only the assigned quality dimensions');
    expect(instructions).toContain('do not claim unassigned dimensions were reviewed');
  });

  it('uses the strict v4 opinion schema and does not persist delegation errors as FAIL', () => {
    const instructions = getReviewerSubagentTemplate().prompt;
    const schema = instructions.match(/```json\n([^]*?)\n```/)?.[1];

    expect(schema).toBeDefined();
    const parsedSchema = JSON.parse(schema!);
    expect(parsedSchema.required).toEqual(['reviewKind', 'commit', 'result', 'summary', 'findings']);
    expect(parsedSchema.properties.reviewKind.enum).toEqual(['full-change', 'incremental', 'supplemental']);
    expect(parsedSchema.properties).not.toHaveProperty('reviewId');
    expect(parsedSchema.properties).not.toHaveProperty('scope');
    expect(instructions).toContain('must not be persisted as FAIL');
  });

  it('keeps generated Codex and Claude Reviewer prompt bodies equivalent', () => {
    const template = getReviewerSubagentTemplate();
    const codex = generateSubagentContent(template, 'codex', 'test');
    const claude = generateSubagentContent(template, 'claude', 'test');

    expect(normalizePrompt(codex)).toBe(normalizePrompt(claude));
    expect(normalizePrompt(codex)).toBe(normalizePrompt(template.prompt));
  });
});
