import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatArchitectureQueryText, queryArchitecture } from '../../src/commands/arch/query.js';
import { writeProjectModel } from '../helpers/model-fixture.js';
import { runCLI } from '../helpers/run-cli.js';

const DEFINITION = `First paragraph ${'界'.repeat(130)}.\n\nSecond paragraph remains complete.`;
const CONTRACT = '## Requirements\n\n### Requirement: Stable behavior\nThe system SHALL behave.\n\n#### Scenario: Existing behavior\n- **WHEN** invoked\n- **THEN** behavior is preserved';

describe('architecture query', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-query-'));
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'project', contract: 'required', root: true, children: ['capability'] },
        { identity: 'capability', parents: ['project'], children: ['capability'] },
      ],
      relationshipKinds: [{ identity: 'invokes' }],
      elements: [
        {
          identity: 'project.root',
          kind: 'project',
          parent: null,
          title: 'Project',
          definition: 'Project definition',
          requirements: CONTRACT,
        },
        {
          identity: 'cap.long',
          parent: 'project.root',
          title: 'Long Definition',
          definition: DEFINITION,
          requirements: CONTRACT,
        },
        {
          identity: 'cap.related',
          parent: 'cap.long',
          title: 'Related',
          definition: 'Related definition',
          requirements: CONTRACT,
        },
      ],
      relationships: [
        { source: 'cap.long', kind: 'invokes', target: 'cap.related' },
      ],
    });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns complete Declarations for only the explicit stable identities', async () => {
    const result = await queryArchitecture(root, ['cap.long']);
    const element = result.elements['cap.long'];
    const text = formatArchitectureQueryText(result);

    expect(Object.keys(result.elements)).toEqual(['cap.long']);
    expect(element).toEqual({
      identity: 'cap.long',
      kind: 'capability',
      parent: 'project.root',
      title: 'Long Definition',
      definition: DEFINITION,
      contract: 'optional',
      hasContract: true,
    });
    expect(text).toContain(`Definition: ${DEFINITION}`);
    expect(text).not.toContain('Summary:');
    expect(JSON.stringify(result)).not.toMatch(/children|refinement|relatedElements|relations/);
  });

  it('deduplicates and stably sorts a batch without expanding Contracts', async () => {
    const result = await queryArchitecture(root, ['project.root', 'cap.long', 'project.root']);

    expect(Object.keys(result.elements)).toEqual(['cap.long', 'project.root']);
    expect(result.elements['cap.long'].requirements).toBeUndefined();
    expect(result.elements['project.root'].requirements).toBeUndefined();
    expect(result.elements['project.root'].hasContract).toBe(true);
  });

  it('attaches complete Contracts only to explicitly requested identities', async () => {
    const result = await queryArchitecture(root, ['cap.long'], { contract: true });

    expect(Object.keys(result.elements)).toEqual(['cap.long']);
    expect(result.elements['cap.long'].requirements).toEqual([{
      name: 'Stable behavior',
      body: 'The system SHALL behave.',
      scenarios: [{
        name: 'Existing behavior',
        body: '- **WHEN** invoked\n- **THEN** behavior is preserved',
      }],
    }]);
    expect(JSON.stringify(result)).not.toContain('cap.related');
  });

  it('fails the whole batch for unknown identities and derived FQNs', async () => {
    await expect(queryArchitecture(root, ['cap.long', 'missing.element']))
      .rejects.toThrow('Element not found: missing.element');
    await expect(queryArchitecture(root, ['root.long']))
      .rejects.toThrow('Element must use stable identity, not FQN');

    const cli = await runCLI(['arch', 'query', 'cap.long', 'missing.element', '--json'], { cwd: root });
    expect(cli.exitCode).not.toBe(0);
    expect(cli.stdout).toBe('');
    expect(cli.stderr).toContain('Element not found: missing.element');
  });

  it('rejects a legacy Declaration through every Agent-facing read command', async () => {
    const unitPath = path.join(root, '.xirang', 'model', 'elements', 'cap.long.md');
    const unit = await fs.readFile(unitPath, 'utf8');
    await fs.writeFile(unitPath, unit.replace('\ndefinition:', '\nsummary:'), 'utf8');

    for (const args of [
      ['arch', 'query', 'cap.long', '--json'],
      ['arch', 'search', 'Long', '--json'],
      ['arch', 'impact', 'cap.long', '--json'],
    ]) {
      const result = await runCLI(args, { cwd: root });
      expect(result.exitCode, args.join(' ')).toBe(1);
      expect(`${result.stdout}\n${result.stderr}`).toContain('LEGACY_ELEMENT_SUMMARY');
    }
  });
});
