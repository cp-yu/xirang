import { existsSync } from 'node:fs';
import path from 'node:path';
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

  it('keeps the canonical generated reference set complete', () => {
    expect(template.referenceFiles?.map((reference) => reference.path)).toEqual([
      'references/evidence-protocol.md',
      'references/terminology-awareness.md',
      'references/report-schema.md',
    ]);
    for (const reference of template.referenceFiles ?? []) {
      expect(reference.content.length).toBeGreaterThan(0);
    }
  });

  it('excludes the Xirang philosophy (read-only reporter role)', () => {
    expect(instructions).not.toContain('Xirang Philosophy');
  });

  it('describes fast-model usage for the lightweight sweep', () => {
    expect(template.description).toContain('Prefer a fast model for this lightweight architecture impact sweep.');
  });

  it('defines the report input and output contract', () => {
    expect(getImpactSweeperSubagentTemplate().name).toBe('xirang-impact-sweeper');
    expect(instructions).toContain('projectRoot');
    expect(instructions).toContain('concept');
    expect(instructions).toContain('optionalChangeName');
    expect(instructions).toContain('knownUserTerms');
    expect(instructions).toContain('focus');
    expect(instructions).toContain('return exactly one JSON object');
    expect(instructions).toContain('Do not wrap the JSON in a Markdown code fence');
    expect(instructions).toContain('Do not emit a report path or separate summary');
    expect(instructions).not.toContain('xirang/sweeper/');
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
      '"xirang"',
      '"elements"',
      '"elementId"',
      '"fqn"',
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
    expect(terminology).toContain("Identify terms semantically related to user's `concept` input while reading affected specs");
    expect(terminology).toContain("if concept is 'workflow', extract 'process', 'pipeline', 'flow' etc.");
    expect(terminology).toContain('Record in `terminologyObservations` field');
    expect(terminology).toContain('Report facts only, no judgment or recommendations');
    expect(terminology).toContain('If terminology extraction fails, omit `terminologyObservations` and keep the report usable');
  });

  it('requires CLI-backed LikeC4 evidence and bounded reverse search', () => {
    const evidence = readReference('references/evidence-protocol.md');

    expect(evidence).toContain('xirang arch query <elementId> --relations --depth 2 --json');
    expect(evidence).toContain("Preserve each relationship's canonical source/kind/target direction");
    expect(evidence).toContain('parent and children as abstraction/refinement context');
    expect(evidence).toContain('canonical `elementId`');
    expect(evidence).toContain('current FQN');
    expect(evidence).toContain('xirang list --specs --json');
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

  it('is fully read-only and returns the report without writing files', () => {
    expect(instructions).toContain('Do not create, modify, delete, or overwrite any file');
    expect(instructions).toContain('Do not use Bash to bypass the read-only boundary');
    expect(instructions).not.toContain('## Write Boundary');
    expect(instructions).not.toContain('## Report Path');
    expect(template.tools).toEqual(['read', 'grep', 'find', 'bash']);
    expect(template.disallowedTools).toEqual(expect.arrayContaining(['write', 'edit']));
    expect(template.mode).toBe('read-only');
  });

  it('does not retain the legacy report persistence scaffold', () => {
    expect(existsSync(path.resolve('xirang/sweeper/.gitignore'))).toBe(false);
  });
});
