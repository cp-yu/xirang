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

  it('authors and reviews one four-partition Candidate', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.instructions).toContain('.xirang/candidate/{metamodel,elements,relationships,views}/');
    expect(skill.instructions).toContain('one Element has at most one Contract');
    expect(skill.instructions).toContain('`contract` field of its Element Kind');
    expect(skill.instructions).toContain('a unit absent from the Candidate is not retained');
    expect(skill.instructions).toContain('xirang candidate validate');
    expect(skill.instructions).toContain('reviewDigest');
    expect(skill.instructions).toContain('xirang candidate promote --digest');
    expect(skill.instructions).toContain('MAY use subagents');
    expect(skill.instructions).not.toContain('mandatory reviewer');
    for (const retired of [
      'multiple Specs',
      'Spec ownership',
      '.xirang/architecture',
      '.xirang/specs',
      'LikeC4 tokens',
    ]) {
      expect(skill.instructions).not.toContain(retired);
    }
  });
});
