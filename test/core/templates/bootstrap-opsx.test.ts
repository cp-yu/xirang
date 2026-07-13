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
    expect(skill).toContain('unmatched specs');
    expect(skill).toContain('spawn a subagent');
    expect(skill).toContain('spec content and OPSX capability intents');
    expect(skill).toContain('write the returned frontmatter mappings');
    expect(skill).toContain('report any specs that still have no match');
  });

  it('keeps refresh guidance on complete rebuilding and explicit review gaps', () => {
    const skill = getBootstrapOpsxSkillTemplate().instructions;

    expect(skill).toContain('derive every entry from the complete current scan');
    expect(skill).toContain('review the complete candidate and its diff against the old formal model');
    expect(skill).toContain('record a `review_gaps` entry instead');
    expect(skill).not.toMatch(/map incrementally|instead of re-approving the whole model|fabricate code references/i);
  });

  it('lists backfill-specs in the skill instructions', () => {
    const skill = getBootstrapOpsxSkillTemplate().instructions;

    expect(skill).toContain('openspec bootstrap backfill-specs --json');
    expect(skill).toContain('also runs the programmatic spec frontmatter backfill');
  });
});
