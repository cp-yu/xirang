import { describe, expect, it } from 'vitest';

import { OPSX_COMPILATION_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/workflows/archive-change.js';

describe('archive change workflow template', () => {
  it('includes the OPSX compilation philosophy in the skill surface', () => {
    expect(getArchiveChangeSkillTemplate().instructions).toContain(OPSX_COMPILATION_PHILOSOPHY);
  });

  it('delegates verify work to generated internal subagents without reading artifacts', () => {
    const instructions = getArchiveChangeSkillTemplate().instructions;

    expect(instructions).toContain('delegate to clean-context generated `openspec-reviewer` subagent');
    expect(instructions).toContain('delegate to clean-context generated `openspec-optimizer` subagent');
    expect(instructions).toContain('MUST NOT read or inline generated subagent artifacts');
    expect(instructions).not.toContain('invoke the `openspec-reviewer` skill');
    expect(instructions).not.toContain('invoke `openspec-optimizer`');
    expect(instructions).not.toContain('/skills/openspec-reviewer/SKILL.md');
  });
});
