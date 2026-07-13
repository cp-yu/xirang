import { describe, expect, it } from 'vitest';

import { getImpactSweeperSubagentTemplate } from '../../../src/core/templates/workflows/impact-sweeper.js';

describe('impact sweeper template', () => {
  const template = getImpactSweeperSubagentTemplate();
  const instructions = template.prompt;

  function readReference(path: string): string {
    const reference = template.referenceFiles?.find((file) => file.path === path);
    expect(reference).toBeDefined();
    return reference!.content;
  }

  it('excludes the OPSX compilation philosophy (read-only reporter role)', () => {
    expect(instructions).not.toContain('OPSX Compilation Philosophy');
  });

  it('describes fast-model usage for the lightweight sweep', () => {
    expect(template.description).toContain('Prefer a fast model for this lightweight OPSX-grounded impact sweep.');
  });

  it('defines the report input and output contract', () => {
    expect(getImpactSweeperSubagentTemplate().name).toBe('openspec-impact-sweeper');
    expect(instructions).toContain('projectRoot');
    expect(instructions).toContain('concept');
    expect(instructions).toContain('optionalChangeName');
    expect(instructions).toContain('knownUserTerms');
    expect(instructions).toContain('focus');
    expect(instructions).toContain('openspec/sweeper/impact-sweep-<english-project-term-slug>.json');
    expect(instructions).toContain('return only the report path');
    expect(instructions).toContain('Do not emit a separate summary');
  });

  it('includes canonical JSON report fields', () => {
    const schema = readReference('references/report-schema.md');

    for (const field of [
      '"concept"',
      '"projectRoot"',
      '"terminologyObservations"',
      '"userInput"',
      '"foundInSpecs"',
      '"term"',
      '"specs"',
      '"count"',
      '"termMappings"',
      '"userTerm"',
      '"projectTerms"',
      '"evidence"',
      '"opsx"',
      '"nodes"',
      '"relationsExpanded"',
      '"mustChange"',
      '"mustVerify"',
      '"contextual"',
      '"unknown"',
      '"architectureDrift"',
      '"relationPath"',
      '"questions"',
    ]) {
      expect(schema).toContain(field);
    }
  });

  it('documents terminology awareness extraction', () => {
    const terminology = readReference('references/terminology-awareness.md');

    expect(terminology).toContain('# Impact Sweeper Terminology Awareness');
    expect(terminology).toContain("Identify terms semantically related to user's `concept` input");
    expect(terminology).toContain("if concept is 'workflow', extract 'process', 'pipeline', 'flow' etc.");
    expect(terminology).toContain('Record in `terminologyObservations` field');
    expect(terminology).toContain('Report facts only, no judgment or recommendations');
    expect(terminology).toContain('If terminology extraction fails, omit `terminologyObservations` and keep the report usable');
  });

  it('requires CLI-backed OPSX evidence and bounded reverse search', () => {
    const evidence = readReference('references/evidence-protocol.md');

    expect(evidence).toContain('openspec opsx query <node-id...> --json');
    expect(evidence).toContain('use `--depth 2` when');
    expect(evidence).toContain("Preserve each relation's canonical from/type/to direction");
    expect(evidence).toContain('`belongs_to` supplies domain context only');
    expect(evidence).toContain('openspec list --specs --json');
    expect(evidence).toContain('CodeGraph is available');
    expect(evidence).toContain('never read `.codegraph/codegraph.db`');
    expect(evidence).toContain('ACE, `rg`, `read`, and `git ls-files`');
    expect(evidence).toContain('architectureDrift');
    expect(evidence).not.toContain('codeMap');
  });

  it('scopes optional change artifact reads', () => {
    const evidence = readReference('references/evidence-protocol.md');

    expect(evidence).toContain('When optionalChangeName is provided');
    expect(evidence).toContain("inspect only that change's artifacts");
    expect(evidence).toContain('exclude archive history');
  });

  it('forbids unsafe execution evidence', () => {
    expect(instructions).toContain('Do not run tests, builds, installs, git diff, git status, or git log');
    expect(instructions).toContain('You MAY use git ls-files, file reads, and text search');
  });

  it('limits writes to the ignored sweeper report directory', () => {
    expect(instructions).toContain('create openspec/sweeper/');
    expect(instructions).toContain('create openspec/sweeper/.gitignore if missing');
    expect(instructions).toContain('write or overwrite openspec/sweeper/impact-sweep-<english-project-term-slug>.json');
    expect(instructions).toContain('MAY 仅写 `openspec/sweeper/` reports and MUST NOT modify any other file');
    expect(instructions).toContain('If openspec/sweeper/.gitignore already exists, do not modify it');
    expect(instructions).toContain('*\n!.gitignore');
    expect(instructions).toContain('Do not modify source files, tests, specs, change artifacts, OPSX files, config files, package files, generated workflow files');
    expect(template.disallowedTools).toEqual(expect.arrayContaining(['write', 'edit']));
  });
});
