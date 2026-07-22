import { describe, expect, it } from 'vitest';

import { OPSX_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import {
  getOpsxProposeSkillTemplate,
} from '../../../src/core/templates/workflows/propose.js';

function getProposeBodies(): string[] {
  return [
    getOpsxProposeSkillTemplate().instructions,
  ];
}

describe('propose template post-validation flow', () => {
  it('authors and validates LikeC4 architecture deltas', () => {
    const instructions = getOpsxProposeSkillTemplate().instructions;
    expect(instructions).toContain('architecture-delta.c4');
    expect(instructions).toContain('affected elements, refinement, Element Contracts, and relationships');
    expect(instructions).toContain('-[invokes]->');
    expect(instructions).toContain('opsx arch validate --delta');
  });

  it('includes the OPSX philosophy in the skill surface', () => {
    expect(getOpsxProposeSkillTemplate().instructions).toContain(OPSX_PHILOSOPHY);
  });

  it('resolves new and existing change identity without rename semantics', () => {
    const instructions = getOpsxProposeSkillTemplate().instructions;
    expect(instructions).toContain('explicitly requests a new change');
    expect(instructions).toContain('ask for a different ID');
    expect(instructions).toContain('explicitly requests an existing change');
    expect(instructions).toContain('update that change in place');
    expect(instructions).toContain('ask whether to update the existing change or create an independent new change');
    expect(instructions).toContain('in non-interactive mode, fail and request an explicit choice');
    expect(instructions).not.toContain('use a new name');
    expect(instructions).not.toContain('rename');
  });

  it('navigates the formal LikeC4 model before authoring', () => {
    const instructions = getOpsxProposeSkillTemplate().instructions;
    expect(instructions).toContain('.opsx/architecture/');
    expect(instructions).toContain('opsx arch query <elementId> --relations --depth 2 --json');
    expect(instructions).not.toContain('.opsx/project.opsx.yaml');
  });

  it('defers definition-first ordering to the artifact instruction projection', () => {
    const instructions = getOpsxProposeSkillTemplate().instructions;
    expect(instructions).toContain('follow the authoring order in the returned `instruction`');
    expect(instructions).toContain('Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs');
    expect(instructions).not.toContain('Use `content.includes` and `content.excludes` to decide');
  });

  it('uses one blocking combined validation with a single repair pass', () => {
    for (const body of getProposeBodies()) {
      expect(body.match(/opsx validate --change "<name>" --json/g)).toHaveLength(1);
      expect(body).toContain('ERROR from either scaffolding checks or combined change validation blocks ready-for-apply');
      expect(body).toContain('WARNING does not block');
      expect(body).toContain('at most one repair pass');
      expect(body).toContain('re-check once');
      expect(body).toContain('Do NOT run `opsx sync`');
      expect(body).not.toContain('--artifacts specs');
      expect(body).not.toContain('--artifacts opsx-delta');
      expect(body).not.toContain('Validator.validateChangeDeltaSpecs()');
      expect(body).not.toContain('Validator.validateOpsxDelta()');
      expect(body).not.toContain('applyOpsxDelta()');
    }
  });

  it('authors delta specs from formal requirement titles without check-delta', () => {
    const template = getOpsxProposeSkillTemplate();
    expect(template.instructions).toMatch(/read the exact Requirement titles from the formal Spec/i);
    expect(template.instructions).toContain('combined change validation');
    expect(template.instructions).not.toContain('opsx check-delta');
    expect(template).not.toHaveProperty('referenceFiles');
  });

  it('uses current schema templates for lightweight proposal/design/tasks checks', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('opsx instructions proposal --change "<name>" --json');
      expect(body).toContain('opsx instructions design --change "<name>" --json');
      expect(body).toContain('opsx instructions tasks --change "<name>" --json');
      expect(body).toContain('validateTaskStructure');
      expect(body).toContain('Actions');
      expect(body).toContain('### Task N:');
      expect(body).toContain('Goal');
      expect(body).toContain('Files');
      expect(body).toContain('Requirements');
      expect(body).toContain('Checks');
      expect(body).toContain('Covers:');
      expect(body).toContain('Verifies:');
      expect(body).toContain('change-local `Verifies:` spec paths');
      expect(body).toContain('Requirement/Scenario references');
      expect(body).toContain('Command:');
      expect(body).toContain('Evidence:');
      expect(body).toContain('Expect:');
      expect(body).toContain('Do NOT invent semantic lint rules beyond the current templates');
      expect(body).toContain('Do NOT judge whether a check is semantically sufficient');
    }
  });

  it('uses Design Summary or semantic readiness without mechanical scoring', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('confirmed `Design Summary`');
      expect(body).toContain('architecture decisions to proposal Architecture Source, `design.md`, and `architecture-delta.c4`');
      expect(body).toContain('testing strategy to `design.md`');
      expect(body).toContain('concrete test work to `tasks.md`');
      expect(body).toContain('risk and trade-off decisions to `design.md`');
      expect(body).toContain('problem');
      expect(body).toContain('impact scope');
      expect(body).toContain('approach');
      expect(body).toContain('verification method');
      expect(body).toContain('unresolved Semantic Delta decisions across contract or graph module scope');
      expect(body).toContain('explicitly overrides the readiness recommendation');
      expect(body).toContain('does not authorize guessing source decisions');
      expect(body).toMatch(/ask one focused question at a time/i);
      expect(body).not.toContain('propose.smartRouting');
      expect(body).not.toContain('propose.requireExplore');
      expect(body).not.toContain('input length');
      expect(body).not.toContain('detail score');
      expect(body).not.toContain('score the user');
    }
  });

  it('checks readiness before creating a new change', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body.indexOf('Assess semantic readiness')).toBeGreaterThanOrEqual(0);
    expect(body.indexOf('opsx new change "<name>"')).toBeGreaterThan(body.indexOf('Assess semantic readiness'));
    expect(body).toContain('do not create a change directory or modify project files');
    expect(body).toContain('existing artifacts, current input, the confirmed Design Summary, formal source, and implementation evidence');
  });

  it('keeps readiness and override state out of artifacts', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body).toContain('Keep readiness, missing-item, and override state in the conversation only');
    expect(body).not.toContain('proposal HTML comment');
    expect(body).not.toContain('<!--');
  });

  it('uses the Element Contract registry and stable element identities', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('opsx list --specs --json');
      expect(body).toContain('Spec ID');
      expect(body).toContain('singular owner binding');
      expect(body).toContain('stable `elementId`');
      expect(body).toContain('does not by itself require a New Spec');
      expect(body).toContain('genuinely new observable behavior');
      expect(body).not.toContain('`capabilities` string array');
      expect(body).not.toContain('opsx spec list');
    }
  });

  it('determines contract and graph scopes as one Semantic Delta', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    for (const token of [
      'contract and graph module scopes of one Semantic Delta',
      'Behavior Source',
      'Architecture Source',
      'New Specs',
      'Modified Specs',
      'Spec ID',
      'stable `elementId`',
      'Use `None` only when that module scope truly does not change',
    ]) {
      expect(body).toContain(token);
    }
  });

  it('uses proposal Behavior Source as the delta Spec input', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body).toContain('create or modify only the Spec IDs declared under proposal `Behavior Source`');
    expect(body).toMatch(/read the exact Requirement titles from the formal Spec/i);
    expect(body).not.toContain('opsx check-delta');
  });

  it('reconciles Architecture Source after Specs and Design', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    const designIndex = body.indexOf('After Specs and Design are complete');
    const deltaIndex = body.indexOf('architecture-delta.c4', designIndex);
    expect(designIndex).toBeGreaterThanOrEqual(0);
    expect(deltaIndex).toBeGreaterThan(designIndex);
    expect(body).toContain('update only proposal `Architecture Source`');
    expect(body).toContain('formal OPSX Semantic Model');
    expect(body).toContain('do not invent graph changes from contract changes alone');
  });

  it('does not duplicate the resolved Specs content boundary', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body).toContain('Follow the returned Specs authoring contract');
    expect(body).not.toContain('route non-behavior content to design/tasks/proposal/opsx-delta');
  });

  it('previews and reviews scenario operations before writing labels', () => {
    for (const body of getProposeBodies()) {
      const validationIndex = body.indexOf('opsx validate --change "<name>" --json');
      const previewIndex = body.indexOf('opsx scenario-labels "<name>" --preview --json');
      const writeIndex = body.indexOf('opsx scenario-labels "<name>" --write');
      expect(validationIndex).toBeGreaterThanOrEqual(0);
      expect(previewIndex).toBeGreaterThan(validationIndex);
      expect(writeIndex).toBeGreaterThan(previewIndex);
      expect(body).toContain('Unexpected ADDED, MODIFIED, or REMOVED operations block label writing');
      expect(body).toContain('does not require a second validate pass');
      expect(body).toContain('sync/archive consume and clean existing labels but do not generate them');
      expect(body).not.toContain('#### Scenario: [ADDED] <title>');
      expect(body).not.toContain('#### Scenario: [MODIFIED] <title>');
      expect(body).not.toContain('#### Scenario: [REMOVED] <title>');
    }
  });

  it('limits workflow status output to readiness, blockers, and final summary', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body).toContain('Report status only at readiness, blocker, and final-summary points');
    expect(body).not.toContain('announce each artifact');
  });

  it('uses the shared document language contract for proseLanguage boundaries', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('Document Language Contract');
      expect(body).toContain('task titles, check names, Requirement titles, Scenario titles');
      expect(body).toContain('Expect/Evidence descriptions');
      expect(body).toContain('English project terminology may remain embedded');
      expect(body).toContain('ordinary English sentences');
    }
  });

  it('does not require per-artifact language self-checks', () => {
    for (const body of getProposeBodies()) {
      expect(body).not.toContain('non-canonical English prose scan');
      expect(body).not.toContain('ordinary English prose scan');
      expect(body).not.toContain('per-artifact self-check');
    }
  });

  it('routes Test Maintenance across design and tasks', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body).toContain('obsolete-test rationale from **Test Maintenance** to `design.md`');
    expect(body).toContain('concrete test updates/removals to `tasks.md`');
  });

  it('routes one-time verification items to evidence-only checks without test files', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('**One-time Verification**');
      expect(body).toContain('no persistent test file');
      expect(body).toContain('Verifies: <path> REMOVED Requirement');
    }
  });
});
