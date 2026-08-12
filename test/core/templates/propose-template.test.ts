import { describe, expect, it } from 'vitest';

import {
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
  STRUCTURAL_DECOMPOSITION_GUIDANCE,
  XIRANG_PHILOSOPHY,
} from '../../../src/core/templates/fragments/xirang-fragments.js';
import {
  getXirangProposeSkillTemplate,
} from '../../../src/core/templates/workflows/propose.js';

function getProposeBodies(): string[] {
  return [
    getXirangProposeSkillTemplate().instructions,
  ];
}

describe('propose template post-validation flow', () => {
  it('authors and validates four-partition Semantic Delta units', () => {
    const instructions = getXirangProposeSkillTemplate().instructions;
    expect(instructions).toContain('.xirang/changes/<name>/elements/<identity>.md');
    expect(instructions).toContain('relationships/<relationship kind identity>.yaml');
    expect(instructions).toContain('metamodel/<kind identity>.md');
    expect(instructions).toContain('views/<view identity>.md');
    expect(instructions).toContain('`relationships/` has no `MODIFIED`');
    expect(instructions).toContain('xirang arch validate --change "<name>" --json');
    for (const retired of [
      'architecture-delta',
      '-[invokes]->',
      'arch validate --delta',
      '.xirang/specs',
      'spec-id',
      'elementId',
      'list --specs',
    ]) {
      expect(instructions).not.toContain(retired);
    }
  });

  it('includes the Xirang philosophy and shared Contract semantics in the skill surface', () => {
    const instructions = getXirangProposeSkillTemplate().instructions;
    expect(instructions).toContain(XIRANG_PHILOSOPHY);
    expect(instructions).toContain(ELEMENT_CONTRACT_SEMANTICS);
  });

  it('writes complete target Definitions and stops when their boundaries remain unresolved', () => {
    const instructions = getXirangProposeSkillTemplate().instructions;
    expect(instructions).toContain(ELEMENT_DEFINITION_SEMANTICS);
    expect(instructions).toContain('complete target Definition');
    expect(instructions).toContain('not a summary of what changed');
    expect(instructions).toContain('stop and ask one focused question instead of guessing the Definition');
  });

  it('resolves new and existing change identity without rename semantics', () => {
    const instructions = getXirangProposeSkillTemplate().instructions;
    expect(instructions).toContain('explicitly requests a new change');
    expect(instructions).toContain('ask for a different ID');
    expect(instructions).toContain('explicitly requests an existing change');
    expect(instructions).toContain('update that change in place');
    expect(instructions).toContain('ask whether to update the existing change or create an independent new change');
    expect(instructions).toContain('in non-interactive mode, fail and request an explicit choice');
    expect(instructions).not.toContain('use a new name');
    expect(instructions).not.toContain('xirang rename');
  });

  it('navigates the formal Semantic Model before authoring', () => {
    const instructions = getXirangProposeSkillTemplate().instructions;
    expect(instructions).toContain('.xirang/model/{metamodel,elements,relationships,views}/');
    expect(instructions).toContain('xirang arch search <query> --json');
    expect(instructions).toContain('xirang arch impact <identities...> --depth 2 --json');
    expect(instructions).toContain('xirang arch query <selected-identities...> --contract --json');
    expect(instructions).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
    expect(instructions).not.toContain('.xirang/architecture/');
    expect(instructions).not.toContain('.xirang/project.xirang.yaml');
  });

  it('defers definition-first ordering to the artifact instruction projection', () => {
    const instructions = getXirangProposeSkillTemplate().instructions;
    expect(instructions).toContain('follow the authoring order in the returned `instruction`');
    expect(instructions).toContain('Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs');
    expect(instructions).not.toContain('Use `content.includes` and `content.excludes` to decide');
  });

  it('uses one blocking combined validation with a single repair pass', () => {
    for (const body of getProposeBodies()) {
      expect(body.match(/xirang validate --change "<name>" --json/g)).toHaveLength(1);
      expect(body).toContain('ERROR from either scaffolding checks or combined change validation blocks ready-for-apply');
      expect(body).toContain('WARNING does not block');
      expect(body).toContain('at most one repair pass');
      expect(body).toContain('re-check once');
      expect(body).toContain('Do NOT run `xirang sync`');
      expect(body).not.toContain('--artifacts specs');
      expect(body).not.toContain('--artifacts opsx-delta');
      expect(body).not.toContain('Validator.validateChangeDeltaSpecs()');
      expect(body).not.toContain('Validator.validateXirangDelta()');
      expect(body).not.toContain('applyXirangDelta()');
    }
  });

  it('authors Contract deltas from formal requirement titles without check-delta', () => {
    const template = getXirangProposeSkillTemplate();
    expect(template.instructions).toMatch(/read the exact Requirement titles from the formal Element Contract/i);
    expect(template.instructions).toContain('combined change validation');
    expect(template.instructions).not.toContain('xirang check-delta');
    expect(template).not.toHaveProperty('referenceFiles');
  });

  it('uses current schema templates for lightweight proposal/design/tasks checks', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('xirang instructions proposal --change "<name>" --json');
      expect(body).toContain('xirang instructions design --change "<name>" --json');
      expect(body).toContain('xirang instructions tasks --change "<name>" --json');
      expect(body).toContain('validateTaskStructure');
      expect(body).toContain('Actions');
      expect(body).toContain('### Task N:');
      expect(body).toContain('Goal');
      expect(body).toContain('Files');
      expect(body).toContain('Requirements');
      expect(body).toContain('Checks');
      expect(body).toContain('Covers:');
      expect(body).toContain('Verifies:');
      expect(body).toContain('change-local `Verifies:` Element unit paths');
      expect(body).toContain('Requirement/Scenario references');
      expect(body).toContain('Command:');
      expect(body).toContain('Evidence:');
      expect(body).toContain('Expect:');
      expect(body).toContain('Do NOT invent semantic lint rules beyond the current templates');
      expect(body).toContain('Do NOT judge whether a check is semantically sufficient');
    }
  });

  it('forms tasks around independently implementable and verifiable TDD loops', () => {
    const body = getXirangProposeSkillTemplate().instructions;

    expect(body).toContain('independently implementable and verifiable end-to-end loop');
    expect(body).toContain('Production code, configuration, generated surfaces, and tests');
    expect(body).toContain('MUST remain in one task');
    expect(body).toContain('each task reaches its own GREEN independently');
    expect(body).toContain('depends only on an earlier task that is already GREEN');
    expect(body).toMatch(/a task's RED\/GREEN cycle MUST NOT depend on a later task/i);
    expect(body).toContain('Do not split tasks by component, module, directory, file type, or Requirement count');
    expect(body).toContain('reconcile task boundaries before declaring the Change ready for Apply');
  });

  it('uses Design Summary or semantic readiness without mechanical scoring', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('confirmed `Design Summary`');
      expect(body).toContain('architecture decisions to proposal Architecture Source, `design.md`, and the Declaration, Relationship, Metamodel, and View Delta units');
      expect(body).toContain('testing strategy to `design.md`');
      expect(body).toContain('concrete test work to `tasks.md`');
      expect(body).toContain('risk and trade-off decisions to `design.md`');
      expect(body).toContain('problem');
      expect(body).toContain('impact scope');
      expect(body).toContain('approach');
      expect(body).toContain('verification method');
      expect(body).toContain('unresolved Semantic Delta decisions across Definition, Contract, or structural scope');
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
    const body = getXirangProposeSkillTemplate().instructions;
    expect(body.indexOf('Assess semantic readiness')).toBeGreaterThanOrEqual(0);
    expect(body.indexOf('xirang new change "<name>"')).toBeGreaterThan(body.indexOf('Assess semantic readiness'));
    expect(body).toContain('do not create a change directory or modify project files');
    expect(body).toContain('existing artifacts, current input, the confirmed Design Summary, formal source, and implementation evidence');
  });

  it('keeps readiness and override state out of artifacts', () => {
    const body = getXirangProposeSkillTemplate().instructions;
    expect(body).toContain('Keep readiness, missing-item, and override state in the conversation only');
    expect(body).not.toContain('proposal HTML comment');
    expect(body).not.toContain('<!--');
  });

  it('treats an Element Contract as the body of one Element unit', () => {
    for (const body of getProposeBodies()) {
      expect(body).toContain('one Element has at most one Contract');
      expect(body).toContain('xirang arch query <selected-identities...> --contract --json');
      expect(body).not.toMatch(/arch query[^\n]*(--relations|--depth)/);
      expect(body).toContain('An optional-contract Element without a Contract does not by itself require a new one');
      expect(body).toContain('genuinely new observable behavior');
      expect(body).not.toContain('`capabilities` string array');
      expect(body).not.toContain('xirang spec list');
      expect(body).not.toContain('singular owner binding');
    }
  });

  it('determines Contract and structural scopes as one Semantic Delta', () => {
    const body = getXirangProposeSkillTemplate().instructions;
    for (const token of [
      'Contract and structural scopes of one Semantic Delta',
      'Behavior Source',
      'Architecture Source',
      'New Specs',
      'Modified Specs',
      'Both sections address the same identity space',
      'Use `None` only when that scope truly does not change',
    ]) {
      expect(body).toContain(token);
    }
  });

  it('uses proposal Behavior Source as the Element Contract delta input', () => {
    const body = getXirangProposeSkillTemplate().instructions;
    expect(body).toContain('for exactly the identities declared under proposal `Behavior Source`');
    expect(body).toMatch(/read the exact Requirement titles from the formal Element Contract/i);
    expect(body).not.toContain('xirang check-delta');
  });

  it('reconciles Architecture Source after Specs and Design', () => {
    const body = getXirangProposeSkillTemplate().instructions;
    const designIndex = body.indexOf('After Specs and Design are complete');
    const deltaIndex = body.indexOf('relationships/<relationship kind identity>.yaml', designIndex);
    expect(designIndex).toBeGreaterThanOrEqual(0);
    expect(deltaIndex).toBeGreaterThan(designIndex);
    expect(body).toContain('update only proposal `Architecture Source`');
    expect(body).toContain('formal Xirang Semantic Model');
    expect(body).toContain('do not invent structural changes from Contract changes alone');
  });

  it('does not duplicate the resolved Specs content boundary', () => {
    const body = getXirangProposeSkillTemplate().instructions;
    expect(body).toContain('Follow the returned Specs authoring contract');
    expect(body).not.toContain('route non-behavior content to design/tasks/proposal/opsx-delta');
  });

  it('uses decomposition only when Propose must form an unconfirmed hierarchy', () => {
    const instructions = getXirangProposeSkillTemplate().instructions;

    expect(instructions).toContain(STRUCTURAL_DECOMPOSITION_GUIDANCE);
    expect(instructions).toContain('xirang config project --json');
    expect(instructions).toContain('no confirmed Change Structural Definition exists');
    expect(instructions).toContain('new or reorganized hierarchy');
    expect(instructions).toContain('compile that payload without invoking decomposition guidance again');
    expect(instructions).toContain('Architecture Source is `None`');
    expect(instructions).toContain('do not invoke decomposition guidance');
    expect(instructions).toContain('stop Formation and ask one focused question');
    expect(instructions).toContain('do not fall back to another method');
  });

  it('conditionally consumes a confirmed structural definition after all gates pass', () => {
    const body = getXirangProposeSkillTemplate().instructions;
    expect(body).toContain('xirang framing list --json');
    expect(body).toContain('only when a Change Structural Definition exists');
    expect(body).toContain('xirang framing show <explorationId> --json');
    expect(body).toContain('complete current payload');
    expect(body).toContain('xirang framing status <explorationId> --json');
    expect(body).toContain('xirang framing validate <explorationId> --json');
    expect(body).toContain('relevant drift, downstream impacts, and structural coverage');
    expect(body).toContain('xirang framing consume <explorationId> --change "<name>" --json');
    expect(body).toContain('change-structural-definition.md');
    expect(body).toContain('When no Change Structural Definition exists, preserve the ordinary Propose path');
    expect(body.indexOf('xirang framing consume')).toBeGreaterThan(body.indexOf('xirang validate --change "<name>" --json'));
  });

  it('reports readiness after validation without writing a presentation artifact', () => {
    for (const body of getProposeBodies()) {
      const validationIndex = body.indexOf('xirang validate --change "<name>" --json');
      const finishIndex = body.indexOf('Finish with `xirang status --change "<name>"`');
      expect(validationIndex).toBeGreaterThanOrEqual(0);
      expect(finishIndex).toBeGreaterThan(validationIndex);
      expect(body).not.toContain('xirang diff --change "<name>" --write');
      expect(body).not.toContain('.xirang/changes/<name>/effective-change.md');
      expect(body).not.toContain('effective-change report');
      expect(body).not.toContain('xirang scenario-labels');
      expect(body).not.toContain('#### Scenario: [ADDED] <title>');
      expect(body).not.toContain('#### Scenario: [MODIFIED] <title>');
      expect(body).not.toContain('#### Scenario: [REMOVED] <title>');
    }
  });

  it('limits workflow status output to readiness, blockers, and final summary', () => {
    const body = getXirangProposeSkillTemplate().instructions;
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
    const body = getXirangProposeSkillTemplate().instructions;
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
