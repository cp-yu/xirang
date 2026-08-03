import { describe, expect, it } from 'vitest';
import {
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
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

  it('authors and independently reviews complete Definitions before Contracts', () => {
    const instructions = getBuildSkillTemplate().instructions;
    const definitionIndex = instructions.indexOf('Element Definitions');
    const contractIndex = instructions.indexOf('Element Contracts', definitionIndex);

    expect(instructions).toContain(ELEMENT_DEFINITION_SEMANTICS);
    expect(definitionIndex).toBeGreaterThanOrEqual(0);
    expect(contractIndex).toBeGreaterThan(definitionIndex);
    expect(instructions).toContain('review each Definition independently before authoring its Contract');
    expect(instructions).toContain('concept boundary conflicts with its parent, children, or siblings');
  });

  it('authors the Candidate in breadth-first semantic layers', () => {
    const instructions = getBuildSkillTemplate().instructions;

    expect(instructions).toContain('Metamodel → Element Declarations, hierarchy, and Element Definitions → Element Contracts → Relationships → Authored Views');
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

describe('xirang-build 2026-08-03 rebuild lessons', () => {
  it('treats Element Kind as a semantic label, not a hierarchy constraint, without encoding a fixed Kind policy', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.instructions).toContain('Element Kind is a semantic label, not a hierarchy constraint');
    expect(skill.instructions).toContain('any Kind may appear at any depth');
    expect(skill.instructions).toContain('abstraction→refinement only');
    expect(skill.instructions).not.toContain('Which Kinds a project uses');
    expect(skill.instructions).not.toContain('not a framework rule');
    expect(skill.instructions).not.toContain('do not encode a fixed Kind set');
  });

  it('does not put project-specific perspective decomposition into the shared fragment', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.instructions).not.toContain('semantic-objects');
    expect(skill.instructions).not.toContain('realization-process');
    expect(skill.instructions).not.toContain('collaboration-structure');
    expect(skill.instructions).not.toContain('decomposition viewpoint');
  });

  it('detects subagent availability and asks which model to use in the initial question round', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.instructions).toContain('Detect whether subagents are available');
    expect(skill.instructions).toContain('which model the subagent should use');
    expect(skill.instructions).toContain('semantic choices that need agent support, not mechanical copying');
  });

  it('requires agent-selected placement and subagent editing for non-verbatim recovery', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.instructions).toContain('which Element, which hierarchy level, which Contract Requirement or Scenario');
    expect(skill.instructions).toContain('semantic choice that requires model understanding');
    expect(skill.instructions).toContain('Copying content verbatim MAY be done directly');
    expect(skill.instructions).toContain('MUST go through a subagent');
    expect(skill.instructions).toContain('never resurrect retired behavior');
  });

  it('requires review to check recovered content against recorded exclusions', () => {
    const skill = getBuildSkillTemplate();

    expect(skill.instructions).toContain('recovered legacy/formal content matches current behavior');
    expect(skill.instructions).toContain('does not resurrect retired vocabulary or recorded exclusions');
  });

  it('treats a user-modified digest as approval but an Agent-modified digest as review-invalidating', () => {
    const skill = getBuildSkillTemplate();
    const promoteIndex = skill.instructions.indexOf('xirang candidate promote --digest');

    expect(promoteIndex).toBeGreaterThanOrEqual(0);
    expect(skill.instructions).toContain('a change made by the user is user approval of the current content and MAY be promoted directly');
    expect(skill.instructions).toContain('a change made by the Agent invalidates the review');
    expect(skill.instructions).toContain('multiple review rounds and re-validation as the expected flow');
  });
});
