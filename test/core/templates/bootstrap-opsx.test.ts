import { describe, expect, it } from 'vitest';
import { OPSX_COMPILATION_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import {
  getBootstrapOpsxSkillTemplate,
} from '../../../src/core/templates/workflows/bootstrap-opsx.js';

describe('bootstrap OPSX templates', () => {
  it('includes the OPSX compilation philosophy in the skill surface', () => {
    expect(getBootstrapOpsxSkillTemplate().instructions).toContain(OPSX_COMPILATION_PHILOSOPHY);
  });

  it('documents backfill-specs and subagent semantic matching after promote', () => {
    const skill = getBootstrapOpsxSkillTemplate().instructions;

    expect(skill).toContain('openspec bootstrap backfill-specs --json');
    expect(skill).toContain('each unmatched spec');
    expect(skill).toContain('Give that context to a subagent');
    expect(skill).toContain('semanticHandoff');
    expect(skill).toContain('candidate capability IDs and intents');
    expect(skill).toContain('--mappings <mapping-file>');
    expect(skill).toContain('Report the returned `unmatched` list explicitly');
    expect(skill).toContain('never guess or silently associate capabilities');
  });

  it('keeps refresh guidance on complete rebuilding and explicit review gaps', () => {
    const skill = getBootstrapOpsxSkillTemplate().instructions;

    expect(skill).toContain('derive every entry from the complete current scan');
    expect(skill).toContain('review the complete candidate and its diff against the old formal model');
    expect(skill).toContain('record a `review_gaps` entry instead');
    expect(skill).not.toMatch(/map incrementally|instead of re-approving the whole model|fabricate code references/i);
  });

  it('keeps refresh restart granularity aligned with the CLI contract', () => {
    const skill = getBootstrapOpsxSkillTemplate().instructions;

    expect(skill).toContain('restart inherits retained granularity');
    expect(skill).toContain('Pass `--granularity coarse|fine` only to override');
  });

  it('uses the public init to scan transition', () => {
    const skill = getBootstrapOpsxSkillTemplate().instructions;

    expect(skill).toContain('openspec bootstrap advance scan');
    expect(skill).toContain('Do not edit `.bootstrap.yaml` or call an internal API');
  });

  it('lists backfill-specs in the skill instructions', () => {
    const skill = getBootstrapOpsxSkillTemplate().instructions;

    expect(skill).toContain('openspec bootstrap backfill-specs --json');
    expect(skill).toContain('also runs the programmatic spec frontmatter backfill');
  });
});
