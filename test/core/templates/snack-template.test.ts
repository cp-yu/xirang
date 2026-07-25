import { describe, expect, it } from 'vitest';

import {
  ARCHITECTURE_GENERATE_DELTA,
  XIRANG_PHILOSOPHY,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import { getSnackSkillTemplate } from '../../../src/core/templates/skill-templates.js';

describe('snack template code-change evidence collection', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('includes the Xirang philosophy', () => {
    expect(instructions).toContain(XIRANG_PHILOSOPHY);
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

  it('does not read an Xirang code-map', () => {
    expect(instructions).not.toContain('project.xirang.code-map.yaml');
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
    expect(instructions).toContain('architecture-delta.c4');
  });

  it('preserves unrelated human-authored content during reconciliation', () => {
    expect(instructions).toMatch(/preserve|human-authored|unrelated/i);
  });

  it('keeps the no-tasks.md boundary', () => {
    expect(instructions).toMatch(/do not.*tasks\.md|tasks\.md.*not.*generat|not.*generate.*tasks\.md/i);
  });

  it('determines contract and graph scopes as one Semantic Delta', () => {
    for (const token of [
      'Determine Element Contract impact',
      'Determine graph impact',
      'Modified Specs',
      'New Spec',
      'elements',
      'refinement',
      'contracts',
      'relationships',
      'Semantic Delta',
    ]) {
      expect(instructions).toContain(token);
    }
  });

  it('stops before writing artifacts when architecture impact is unresolved', () => {
    expect(instructions).toContain('stop and ask one focused question');
    expect(instructions).toContain('do not write `architecture-delta.c4` or claim reconciliation complete');
    expect(instructions).toContain('only after graph impact is resolved');
  });

  it('does not turn missing optional contract coverage into a New Spec', () => {
    expect(instructions).toContain('An optional-contract element without a registered Spec does not by itself require a New Spec');
    expect(instructions).toContain('[REVIEW NEEDED]');
    expect(instructions).not.toContain('If no existing spec covers it → mark as **New Capability**');
  });

  it('uses Spec IDs for delta Spec paths', () => {
    expect(instructions).toContain('specs/<spec-id>/spec.md');
    expect(instructions).toContain('Spec IDs');
    expect(instructions).toContain('stable `elementId`');
    expect(instructions).toContain('Do not derive the directory name directly from an element FQN or `elementId`');
    expect(instructions).not.toContain('specs/<capability>/spec.md');
    expect(instructions).not.toContain('proposal capability name');
  });

  it('does not promote mechanical code evidence to LikeC4 changes', () => {
    expect(instructions).toContain('implementation evidence, not as proof that the Xirang Semantic Model must change');
    expect(instructions).toContain('Implementation-only movement, symbol renaming, helper extraction');
    expect(instructions).toContain('mechanical call/import changes do not by themselves change the graph modules');
  });

  it('reconciles proposal Source Impact from separate decisions', () => {
    expect(instructions).toContain('`## Source Impact`');
    expect(instructions).toContain('Behavior Source');
    expect(instructions).toContain('Architecture Source');
    expect(instructions).toContain('Reuse the confirmed contract module scope as the delta Spec input');
    expect(instructions).toContain('`## Why`');
    expect(instructions).toContain('`## What Changes`');
    expect(instructions).toContain('`## Impact`');
    expect(instructions).not.toContain('`## Capabilities`');
  });
});

describe('snack architecture delta input boundary', () => {
  it('uses proposal scope, completed Specs, Design, and formal LikeC4 for reconciliation', () => {
    for (const token of [
      '`Source Impact`',
      'Semantic Delta',
      'affected elements, refinement, Element Contracts, and relationships',
      'completed change-local Element Contracts',
      '`design.md` for architecture decisions',
      'formal Xirang Semantic Model as current semantic state',
      'scope declarations, not authoritative LikeC4 records',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).toContain(token);
    }
  });
});

describe('snack template evidence/artifact terminology', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('distinguishes delta Spec Markdown headings from LikeC4 delta syntax', () => {
    expect(instructions).toContain('## ADDED Requirements');
    expect(instructions).toContain('## MODIFIED Requirements');
    expect(instructions).toContain('LikeC4 model declarations and typed relations');
  });
});

describe('snack template semantic diff gate', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('writes the effective semantic diff only after validation passes', () => {
    const validationIndex = instructions.indexOf('Run `xirang validate --change "<name>" --json`');
    const diffIndex = instructions.indexOf('run `xirang diff --change "<name>" --write`');
    expect(validationIndex).toBeGreaterThanOrEqual(0);
    expect(diffIndex).toBeGreaterThan(validationIndex);
    expect(instructions).toContain('`.xirang/changes/<name>/effective-change.md`');
    expect(instructions).toContain('require its status to be Passed');
    expect(instructions).not.toContain('xirang scenario-labels');
    expect(instructions).not.toContain('#### Scenario: [ADDED] <title>');
    expect(instructions).not.toContain('#### Scenario: [MODIFIED] <title>');
    expect(instructions).not.toContain('#### Scenario: [REMOVED] <title>');
  });
});

describe('snack template output hints', () => {
  const template = getSnackSkillTemplate();
  const instructions = template.instructions;

  it('offers quick-sync, quick-archive, sync-and-archive, and continue-development paths after snack', () => {
    expect(instructions).toContain('1. **Quick sync**: `xirang sync "<change-name>" --no-verify`');
    expect(instructions).toContain('2. **Quick archive**: `xirang archive "<change-name>" --no-verify`');
    expect(instructions).toContain(
      '3. **Sync and archive**: `xirang sync "<change-name>" --no-verify && xirang archive "<change-name>" --no-verify`'
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
