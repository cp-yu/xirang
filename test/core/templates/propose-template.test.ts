import { describe, expect, it } from 'vitest';

import { OPENSPEC_PHILOSOPHY } from '../../../src/core/templates/fragments/opsx-fragments.js';
import {
  getOpsxProposeSkillTemplate,
} from '../../../src/core/templates/workflows/propose.js';

function getProposeBodies(): string[] {
  return [
    getOpsxProposeSkillTemplate().instructions,
  ];
}

describe('propose template post-validation flow', () => {
  it('includes the OpenSpec philosophy in the skill surface', () => {
    expect(getOpsxProposeSkillTemplate().instructions).toContain(OPENSPEC_PHILOSOPHY);
  });

  it('fails closed when the requested change name already exists', () => {
    const instructions = getOpsxProposeSkillTemplate().instructions;
    expect(instructions).toContain('openspec list --json');
    expect(instructions).toContain('ask whether to continue it or use a new name');
    expect(instructions).toContain('in non-interactive mode, fail and request an explicit choice');
  });

  it('loads the complete formal OPSX bundle before authoring', () => {
    const instructions = getOpsxProposeSkillTemplate().instructions;
    expect(instructions).toContain('openspec/project.opsx.yaml');
    expect(instructions).toContain('openspec/project.opsx.relations.yaml');
    expect(instructions).toContain('formal OPSX two-file bundle');
  });

  it('consumes artifact definitions before instructions and templates', () => {
    const instructions = getOpsxProposeSkillTemplate().instructions;
    expect(instructions).toContain('resolved `definition`');
    expect(instructions).toContain('`content.includes`');
    expect(instructions).toContain('`content.excludes`');
    expect(instructions).toContain('obey `writePolicy`');
    expect(instructions).toContain('follow `instruction`');
    expect(instructions).toContain('canonical structure from `template`');
    expect(instructions).toContain('Do not copy definition');
  });

  it('keeps post-propose validation warning-only with a single repair pass', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('This validation is warning-only.');
      expect(body).toContain('Do NOT turn `/opsx:propose` into a blocking gate.');
      expect(body).toContain('do exactly one repair pass');
      expect(body).toContain('re-check once');
      expect(body).toContain('remaining warnings');
    }
  });

  it('guides agents to run check-delta before writing change-local specs', () => {
    const template = getOpsxProposeSkillTemplate();
    expect(template.instructions.indexOf('openspec check-delta')).toBeGreaterThan(-1);
    expect(template.instructions.indexOf('openspec check-delta')).toBeLessThan(template.instructions.indexOf('When creating `specs`'));
    expect(template.instructions).toContain('--added');
    expect(template.instructions).toContain('--modified');
    expect(template.instructions).toContain('--removed');
    expect(template.instructions).toContain('--renamed-from');
    expect(template.instructions).toContain('Missing and Conflict results are blocking before writing specs');
    expect(template).not.toHaveProperty('referenceFiles');
  });

  it('aligns generated spec validation with the existing change delta validation contract', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('openspec validate --change "<name>" --artifacts specs --json');
      expect(body).toContain('Validator.validateChangeDeltaSpecs()');
      expect(body).toContain('SHALL/MUST requirement text');
      expect(body).toContain('required `#### Scenario:` blocks');
    }
  });

  it('aligns OPSX validation with downstream programmatic validation and graceful skip behavior', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('openspec instructions opsx-delta --change "<name>" --json');
      expect(body).toContain('schema_version: 2');
      expect(body).not.toContain('schema_version: 1');
      expect(body).toContain('ADDED:');
      expect(body).toContain('MODIFIED:');
      expect(body).toContain('REMOVED:');
      expect(body).toContain('openspec validate --change "<name>" --artifacts opsx-delta --json');
      expect(body).toContain('Validator.validateOpsxDelta()');
      expect(body).toContain('applyOpsxDelta()');
      expect(body).toContain('Do NOT run `openspec sync`');
      expect(body).toContain('referential integrity');
      expect(body).toContain('relation semantic validation');
      expect(body).not.toContain('code-map integrity');
      expect(body).not.toContain('project.opsx.code-map.yaml');
      expect(body).toContain('skips this check');
    }
  });

  it('keeps full validation available as warning-only post-propose validation', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('openspec validate --change "<name>" --json');
      expect(body).toContain('This validation is warning-only.');
      expect(body).toContain('Do NOT run `openspec sync`');
    }
  });

  it('uses current schema templates for lightweight proposal/design/tasks checks', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('openspec instructions proposal --change "<name>" --json');
      expect(body).toContain('openspec instructions design --change "<name>" --json');
      expect(body).toContain('openspec instructions tasks --change "<name>" --json');
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

  it('documents smart explore routing decisions', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('inspect the current conversation for an explore-generated `Design Summary`');
      expect(body).toContain('propose.smartRouting: false');
      expect(body).toContain('propose.requireExplore: false');
      expect(body).toContain("score the user's input across 5 dimensions");
      expect(body).toContain('Detect multi-subsystem scope');
      expect(body).toContain('Design Summary found: proceed and show that Design Summary is being used');
      expect(body).toContain('Input is sufficiently detailed. Skipping explore; generating artifacts directly.');
      expect(body).toContain('This request spans multiple independent subsystems. Consider running `/opsx:explore` to decompose it first.');
      expect(body).toContain('Show input length, detail score, multi-subsystem result, and final decision');
    }
  });

  it('keeps Spec IDs separate from associated OPSX capability IDs', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('openspec list --specs --json');
      expect(body).toContain('Spec ID');
      expect(body).toContain('`capabilities` string array');
      expect(body).toContain('canonical OPSX capability ID');
      expect(body).toContain('does not by itself require a New Spec');
      expect(body).toContain('genuinely new observable behavior');
      expect(body).not.toContain('openspec spec list');
    }
  });

  it('determines Behavior Source and Architecture Source independently', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    for (const token of [
      'Behavior Source',
      'Architecture Source',
      'New Specs',
      'Modified Specs',
      'Spec IDs',
      'OPSX node IDs',
      'Use `None` only when that source truly does not change',
    ]) {
      expect(body).toContain(token);
    }
  });

  it('uses proposal Behavior Source as the delta Spec input', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body).toContain('create or modify only the Spec IDs declared under proposal `Behavior Source`');
    expect(body).toContain('openspec check-delta');
    expect(body).toContain('Missing and Conflict results block spec authoring');
  });

  it('reconciles Architecture Source after Specs and Design', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    const designIndex = body.indexOf('After Specs and Design are complete');
    const deltaIndex = body.indexOf('openspec instructions opsx-delta --change "<name>" --json');
    expect(designIndex).toBeGreaterThanOrEqual(0);
    expect(deltaIndex).toBeGreaterThan(designIndex);
    expect(body).toContain('update only proposal `Architecture Source`');
    expect(body).toContain('only `opsx-delta.yaml` defines exact target-state node operations');
    expect(body).toContain('do not invent OPSX operations from behavior changes alone');
  });

  it('uses the resolved specs definition to route content', () => {
    const body = getOpsxProposeSkillTemplate().instructions;
    expect(body).toContain('`content.includes`');
    expect(body).toContain('`content.excludes`');
    expect(body).toContain('route non-behavior content to design/tasks/proposal/opsx-delta');
  });

  it('delegates scenario operation labels to the CLI', () => {
    for (const body of getProposeBodies()) {
      const validationIndex = body.indexOf('Run warning-only post-propose validation');
      const scenarioLabelsIndex = body.indexOf('openspec scenario-labels "<name>" --write');
      expect(validationIndex).toBeGreaterThanOrEqual(0);
      expect(scenarioLabelsIndex).toBeGreaterThan(validationIndex);
      expect(body).toContain('does not require a second validate pass');
      expect(body).toContain('Labels remain change-local review metadata');
      expect(body).toContain('sync/archive consume and clean existing labels but do not generate them');
      expect(body).not.toContain(
        ['automatically handled by the OpenSpec CLI', 'after validation'].join(' ')
      );
      expect(body).not.toContain('#### Scenario: [ADDED] <title>');
      expect(body).not.toContain('#### Scenario: [MODIFIED] <title>');
      expect(body).not.toContain('#### Scenario: [REMOVED] <title>');
    }
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
