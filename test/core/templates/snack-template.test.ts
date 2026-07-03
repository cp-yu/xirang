import { describe, expect, it } from 'vitest';

import { getSnackSkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('snack template code-change evidence collection', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('treats conversation context as a first-class evidence source', () => {
    expect(instructions).toContain('conversation context');
  });

  it('collects working-tree and staged diffs', () => {
    expect(instructions).toContain('git diff --cached');
    expect(instructions).toContain('git diff HEAD');
  });

  it('supports natural-language commit/range evidence selectors', () => {
    expect(instructions).toMatch(/commit[/-]?range|commit range|commit or range/i);
    expect(instructions).toMatch(/natural language|natural-language/i);
  });

  it('explicitly states git diff is not the only evidence source', () => {
    expect(instructions).toMatch(/MUST NOT be treated as the only|one evidence source among several|not the only/i);
  });
});

describe('snack template artifact reconciliation', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('frames snack as artifact reconciliation rather than unconditional generation', () => {
    expect(instructions).toMatch(/reconcil/i);
  });

  it('covers both the no-change and stale-change scenarios', () => {
    expect(instructions).toMatch(/no matching change|does not exist|no change/i);
    expect(instructions).toMatch(/stale|existing change|already exist/i);
  });

  it('describes the missing/stale/inconsistent/current conditional artifact states', () => {
    expect(instructions).toContain('missing');
    expect(instructions).toContain('stale');
    expect(instructions).toContain('inconsistent');
    expect(instructions).toContain('current');
  });

  it('lists the reconciled artifacts explicitly', () => {
    expect(instructions).toContain('proposal.md');
    expect(instructions).toContain('design.md');
    expect(instructions).toContain('specs/*/spec.md');
    expect(instructions).toContain('opsx-delta.yaml');
  });

  it('preserves unrelated human-authored content during reconciliation', () => {
    expect(instructions).toMatch(/preserve|human-authored|unrelated/i);
  });

  it('keeps the no-tasks.md boundary', () => {
    expect(instructions).toMatch(/do not.*tasks\.md|tasks\.md.*not.*generat|not.*generate.*tasks\.md/i);
  });
});

describe('snack template evidence/artifact terminology', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('distinguishes delta spec Markdown headings from OPSX delta YAML keys', () => {
    expect(instructions).toContain('## ADDED Requirements');
    expect(instructions).toContain('## MODIFIED Requirements');
    expect(instructions).toMatch(/YAML.*keys|ADDED.*MODIFIED.*REMOVED.*YAML/i);
  });
});

describe('snack template output hints', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('offers continue, sync-and-archive, and fast-archive paths after snack', () => {
    expect(instructions).toContain('Continue development: `openspec sync "<change-name>" --no-verify`');
    expect(instructions).toContain(
      'Sync and archive: `openspec sync "<change-name>" --no-verify && openspec archive "<change-name>" --no-verify`'
    );
    expect(instructions).toContain('Fast archive: `openspec archive "<change-name>" --no-verify`');
  });
});

describe('snack template length boundary', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('keeps generated instructions within the 200-line limit', () => {
    const lineCount = instructions.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(200);
  });
});
