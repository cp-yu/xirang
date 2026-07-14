import { describe, expect, it } from 'vitest';

import { OPSX_COMPILATION_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getSnackSkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('snack template code-change evidence collection', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('includes the OPSX compilation philosophy', () => {
    expect(instructions).toContain(OPSX_COMPILATION_PHILOSOPHY);
  });

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

  it('uses resolved definitions before reconciling artifacts', () => {
    expect(instructions).toContain('resolved `definition`');
    expect(instructions).toContain('content boundary and write policy');
    expect(instructions).toContain('MUST NOT copy definition');
  });

  it('does not read an OPSX code-map', () => {
    expect(instructions).not.toContain('project.opsx.code-map.yaml');
    expect(instructions).toContain('CodeGraph');
    expect(instructions).toContain('ACE');
    expect(instructions).toContain('`rg`');
    expect(instructions).toContain('`read`');
  });

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

describe('snack template scenario operation labels', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('delegates scenario labels to the CLI', () => {
    const validationIndex = instructions.indexOf('12. Run `openspec validate "<name>" --type change --json`');
    const scenarioLabelsIndex = instructions.indexOf('Run `openspec scenario-labels "<name>" --write` after validate to add deterministic change-local scenario operation labels.');
    expect(validationIndex).toBeGreaterThanOrEqual(0);
    expect(scenarioLabelsIndex).toBeGreaterThan(validationIndex);
    expect(instructions).toContain('SHALL NOT run validate again only because scenario labels were added');
    expect(instructions).not.toContain(
      ['automatically handled by the OpenSpec CLI', 'after validation'].join(' ')
    );
    expect(instructions).not.toContain('#### Scenario: [ADDED] <title>');
    expect(instructions).not.toContain('#### Scenario: [MODIFIED] <title>');
    expect(instructions).not.toContain('#### Scenario: [REMOVED] <title>');
  });
});

describe('snack template output hints', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('offers quick-sync, quick-archive, sync-and-archive, and continue-development paths after snack', () => {
    expect(instructions).toContain('1. **Quick sync**: `openspec sync "<change-name>" --no-verify`');
    expect(instructions).toContain('2. **Quick archive**: `openspec archive "<change-name>" --no-verify`');
    expect(instructions).toContain(
      '3. **Sync and archive**: `openspec sync "<change-name>" --no-verify && openspec archive "<change-name>" --no-verify`'
    );
    expect(instructions).toContain('4. **Continue development**');
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
