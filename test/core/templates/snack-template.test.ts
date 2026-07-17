import { describe, expect, it } from 'vitest';

import {
  OPENSPEC_PHILOSOPHY,
  OPSX_GENERATE_DELTA,
} from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getSnackSkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('snack template code-change evidence collection', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('includes the OpenSpec philosophy', () => {
    expect(instructions).toContain(OPENSPEC_PHILOSOPHY);
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

  it('defers definition-first ordering to each artifact instruction projection', () => {
    expect(instructions).toContain('follow the authoring order in the returned `instruction`');
    expect(instructions).toContain('Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs');
    expect(instructions).not.toContain('use `content.includes` and `content.excludes` to decide');
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

  it('determines Behavior Source and Architecture Source independently', () => {
    for (const token of [
      'Determine Behavior Source impact',
      'Determine Architecture Source impact',
      'Modified Specs',
      'New Spec',
      'durable capability responsibility',
      'domain boundary',
      'ownership',
      'semantic relation',
    ]) {
      expect(instructions).toContain(token);
    }
  });

  it('stops before writing artifacts when architecture impact is unresolved', () => {
    expect(instructions).toContain('stop and ask one focused question');
    expect(instructions).toContain('do not write `opsx-delta.yaml` or claim reconciliation complete');
    expect(instructions).toContain('only after Architecture Source is resolved');
  });

  it('does not turn missing capability coverage into a New Spec', () => {
    expect(instructions).toContain("absent from every Spec's `capabilities` array does not by itself require a New Spec");
    expect(instructions).toContain('[REVIEW NEEDED]');
    expect(instructions).not.toContain('If no existing spec covers it → mark as **New Capability**');
  });

  it('uses Spec IDs for delta Spec paths', () => {
    expect(instructions).toContain('specs/<spec-id>/spec.md');
    expect(instructions).toContain('Spec IDs');
    expect(instructions).toContain('OPSX capability ID');
    expect(instructions).toContain('Do not derive the directory name directly from an OPSX capability ID');
    expect(instructions).not.toContain('specs/<capability>/spec.md');
    expect(instructions).not.toContain('proposal capability name');
  });

  it('does not promote mechanical code evidence to OPSX changes', () => {
    expect(instructions).toContain('implementation evidence, not as proof that OPSX must change');
    expect(instructions).toContain('Implementation-only movement, symbol renaming, helper extraction');
    expect(instructions).toContain('mechanical call/import changes do not by themselves change OPSX');
  });

  it('reconciles proposal Source Impact from separate decisions', () => {
    expect(instructions).toContain('`## Source Impact`');
    expect(instructions).toContain('Behavior Source');
    expect(instructions).toContain('Architecture Source');
    expect(instructions).toContain('Reuse the confirmed Behavior Source list as the delta Spec input');
    expect(instructions).toContain('`## Why`');
    expect(instructions).toContain('`## What Changes`');
    expect(instructions).toContain('`## Impact`');
    expect(instructions).not.toContain('`## Capabilities`');
  });
});

describe('snack OPSX delta input boundary', () => {
  it('uses proposal scope, completed Specs, Design, and formal OPSX for reconciliation', () => {
    for (const token of [
      '`Source Impact`',
      '`Architecture Source`',
      '`Behavior Source`',
      'completed change-local Specs',
      '`design.md` when present',
      'formal OPSX two-file bundle',
      'scope declarations, not authoritative OPSX records',
    ]) {
      expect(OPSX_GENERATE_DELTA).toContain(token);
    }
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
    const validationIndex = instructions.indexOf('Run `openspec validate "<name>" --type change --json`');
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
