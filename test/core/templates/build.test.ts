import { describe, expect, it } from 'vitest';
import { ELEMENT_CONTRACT_SEMANTICS } from '../../../src/core/templates/fragments/xirang-fragments.js';
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
    expect(skill.instructions).toContain('xirang candidate validate --json');
    expect(skill.instructions).toContain('reviewDigest');
    expect(skill.instructions).toContain('xirang candidate promote --digest');
    expect(skill.instructions).toContain(ELEMENT_CONTRACT_SEMANTICS);
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

  it('initializes the selected baseline before writing build provenance', () => {
    const instructions = getBuildSkillTemplate().instructions;
    const initIndex = instructions.indexOf('xirang candidate init');
    const buildIndex = instructions.indexOf('write `.xirang/candidate/build.md`');

    expect(instructions).toContain('xirang candidate status --json');
    expect(initIndex).toBeGreaterThanOrEqual(0);
    expect(buildIndex).toBeGreaterThan(initIndex);
  });

  it('requires an explicit decision for an active Candidate', () => {
    const instructions = getBuildSkillTemplate().instructions;

    expect(instructions).toContain('baseline, inventory, and status');
    expect(instructions).toContain('continue the active Candidate');
    expect(instructions).toContain('authorize discarding it and initialize a replacement');
    expect(instructions).toContain('If the user chooses to continue, preserve the active Candidate and skip Candidate initialization');
    expect(instructions).toContain('Only initialize when no Candidate is active or the user explicitly authorizes replacement');
    expect(instructions).toContain('MUST NOT silently continue, discard, or replace');
  });

  it('runs the conditional Modeling Decision Gate before Candidate authoring', () => {
    const instructions = getBuildSkillTemplate().instructions;
    const exploreIndex = instructions.indexOf('Explore the authorized scope');
    const gateIndex = instructions.indexOf('Modeling Decision Gate');
    const authorIndex = instructions.indexOf('Author the Candidate breadth-first');

    expect(exploreIndex).toBeGreaterThanOrEqual(0);
    expect(gateIndex).toBeGreaterThan(exploreIndex);
    expect(authorIndex).toBeGreaterThan(gateIndex);
    expect(instructions).toContain('authority conflicts → Element identity and boundaries → hierarchy → Metamodel → Contracts → Relationships → Authored Views');
    expect(instructions).toContain('one decision at a time');
    expect(instructions).toContain('exception provenance');
    expect(instructions).toContain('decision, evidence, and affected scope');
    expect(instructions).toContain('do not create a Requirement provenance matrix');
  });

  it('authors the Candidate in breadth-first semantic layers', () => {
    const instructions = getBuildSkillTemplate().instructions;

    expect(instructions).toContain('Metamodel → Element Declarations and hierarchy → Element Contracts → Relationships → Authored Views');
    expect(instructions).toContain('Do not require full `candidate validate` for an intentionally incomplete intermediate layer');
    expect(instructions).toContain('recheck every dependent later layer');
  });

  it('requires a fresh clean-context semantic review after deterministic validation', () => {
    const instructions = getBuildSkillTemplate().instructions;
    const validateIndex = instructions.indexOf('xirang candidate validate --json');
    const reviewIndex = instructions.indexOf('generic read-only subagent with a clean context');
    const presentIndex = instructions.indexOf('Present the Project Root');

    expect(reviewIndex).toBeGreaterThan(validateIndex);
    expect(presentIndex).toBeGreaterThan(reviewIndex);
    expect(instructions).toContain('build.md, all four Candidate partitions');
    expect(instructions).toContain('Main-Agent completion claims are not evidence');
    expect(instructions).toContain('Only `BLOCKER` and `HIGH` findings fail');
    for (const field of [
      '"result": "PASS | FAIL"',
      '"findings": [',
      '"severity": "BLOCKER | HIGH"',
      '"identity": "element-or-entry-identity"',
      '"issue": "problem"',
      '"authorityEvidence": ["path:line"]',
      '"correction": "required correction"',
      '"coverage": {',
      '"metamodel": true',
      '"elements": true',
      '"relationships": true',
      '"views": true',
      '"build": true',
      '"authority": true',
    ]) {
      expect(instructions).toContain(field);
    }
    expect(instructions).toContain('Any Candidate modification invalidates the review');
    expect(instructions).toContain('another new clean-context subagent');
    expect(instructions).toContain('fail closed');
    expect(instructions).toContain('Do not substitute author self-review or use `xirang-reviewer`');
  });

  it('checks all post-promotion conditions without retrying promotion', () => {
    const instructions = getBuildSkillTemplate().instructions;
    const promoteIndex = instructions.indexOf('xirang candidate promote --digest');
    const inactiveIndex = instructions.indexOf('`active === false`', promoteIndex);
    const partitionsIndex = instructions.indexOf('real directories', inactiveIndex);
    const validateIndex = instructions.indexOf('xirang arch validate --json', partitionsIndex);

    expect(inactiveIndex).toBeGreaterThan(promoteIndex);
    expect(partitionsIndex).toBeGreaterThan(inactiveIndex);
    expect(validateIndex).toBeGreaterThan(partitionsIndex);
    expect(instructions).toContain('Report warnings without failing');
    expect(instructions).toContain('MUST NOT retry promotion automatically');
    expect(instructions).not.toContain('preserve Git status');
  });
});
