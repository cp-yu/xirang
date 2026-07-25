import { describe, expect, it } from 'vitest';
import { getBuildSkillTemplate } from '../../../src/core/templates/workflows/build.js';

describe('xirang-build workflow', () => {
  it('keeps scope and starting-point decisions with the user', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.name).toBe('xirang-build');
    expect(skill.instructions).toContain('exploration scope');
    expect(skill.instructions).toContain('xirang candidate init');
    expect(skill.instructions).toContain('source of truth');
    expect(skill.instructions).toContain('ask the user');
    expect(skill.instructions).not.toContain('evidence.yaml');
    expect(skill.instructions).not.toContain('domain-map');
    expect(skill.instructions).not.toContain('scan → map');
  });

  it('authors and reviews one Architecture plus Specs Candidate', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.instructions).toContain('.xirang/candidate/architecture/');
    expect(skill.instructions).toContain('.xirang/candidate/specs/');
    expect(skill.instructions).toContain('xirang candidate validate');
    expect(skill.instructions).toContain('reviewDigest');
    expect(skill.instructions).toContain('xirang candidate promote --digest');
    expect(skill.instructions).toContain('MAY use subagents');
    expect(skill.instructions).not.toContain('mandatory reviewer');
  });
});
