import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import * as nodeFs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import { AuthoringHelpCommand, registerHelpCommand } from '../../src/commands/help.js';
import { minimalModel, writeProjectModel } from '../helpers/model-fixture.js';
import { getSchemaDir, resolveSchema } from '../../src/core/artifact-graph/resolver.js';
import { getCommonSkillTemplate } from '../../src/core/templates/workflows/common.js';

vi.mock('node:fs', { spy: true });

const captureLogs = async (run: () => Promise<void>): Promise<string> => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  try {
    await run();
    return spy.mock.calls.flat().join('\n');
  } finally {
    spy.mockRestore();
  }
};

describe('AuthoringHelpCommand', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-help-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('lists only the active semantic Delta authoring topic', async () => {
    const output = await captureLogs(() => new AuthoringHelpCommand(root).execute(undefined, {}));
    expect(output).toContain('semantic-delta');
    expect(output).not.toContain('architecture-delta.c4');
    expect(output).not.toContain('project.xirang.yaml');
    expect(output).not.toContain('project.xirang.relations.yaml');
  });

  it('renders Relationship and Relationship Kind creation without preset relationships', async () => {
    await writeProjectModel(root, minimalModel({
      relationshipKinds: [
        { identity: 'bridges', sourceKinds: ['capability'], targetKinds: ['project', 'capability'] },
        { identity: 'governs', body: 'A governor constrains its governed Element.\n\nThis meaning comes from the Metamodel.' },
        { identity: 'prohibits', sourceKinds: [], targetKinds: [] },
      ],
    }));

    const output = await captureLogs(() => new AuthoringHelpCommand(root).execute('semantic-delta', {}));

    expect(output).toContain('## Add a Relationship');
    expect(output).toContain('source: <source-element-identity>');
    expect(output).toContain('kind: <relationship-kind-identity>');
    expect(output).toContain('target: <target-element-identity>');
    expect(output).toContain('## Add a Relationship Kind');
    expect(output).toContain('entity: relationship-kind');
    expect(output).toContain('A Relationship in the same Semantic Delta MAY reference the newly added Kind.');
    expect(output).toContain('Relationship Delta supports only `ADDED` and `REMOVED`.');
    expect(output).toContain('| `bridges` | `capability` | `project`, `capability` |');
    expect(output).toContain('| `governs` | `*` | `*` |');
    expect(output).toContain('| `prohibits` | `∅` | `∅` |');
    expect(output).toContain('### `governs`\n\nA governor constrains its governed Element.\n\nThis meaning comes from the Metamodel.');
    expect(output).not.toContain('element.cli.sync');
    expect(output).not.toContain('主动触发执行使用');
    expect(output).not.toContain('invokes');
    expect(output).toContain('xirang validate --change <name> --json');
    expect(output).toContain('xirang arch validate --change <name> --json');
  });

  it('delivers the same schema template through JSON, text and the shared reference', async () => {
    await writeProjectModel(root, minimalModel());
    const artifact = resolveSchema('semantic-model').artifacts.find(item => item.id === 'semantic-delta')!;
    const expected = await fs.readFile(path.join(getSchemaDir('semantic-model')!, 'templates', artifact.template), 'utf8');
    const json = JSON.parse(await captureLogs(() => new AuthoringHelpCommand(root).execute('semantic-delta', { json: true })));
    expect(json.template).toBe(expected);
    const text = await captureLogs(() => new AuthoringHelpCommand(root).execute('semantic-delta', {}));
    expect(text).toContain(expected);
    const reference = getCommonSkillTemplate().referenceFiles!.find(file => file.path === 'references/artifact-semantic-delta.md')!;
    expect(reference.content).toContain(expected);
  });

  it('retains the template path and I/O cause when the template cannot be read', async () => {
    await writeProjectModel(root, minimalModel());
    const artifact = resolveSchema('semantic-model').artifacts.find(item => item.id === 'semantic-delta')!;
    const templatePath = path.join(getSchemaDir('semantic-model')!, 'templates', artifact.template);
    const { readFileSync: original } = await vi.importActual<typeof import('node:fs')>('node:fs');
    const read = vi.mocked(nodeFs.readFileSync).mockImplementation(((file: any, ...args: any[]) => {
      if (String(file) === templatePath) throw new Error(`EACCES: ${templatePath}`);
      return (original as any)(file, ...args);
    }) as typeof original);
    try {
      await expect(new AuthoringHelpCommand(root).execute('semantic-delta', { json: true })).rejects.toThrow(`EACCES: ${templatePath}`);
    } finally { read.mockRestore(); }
  });

  it('reports an unavailable Semantic Model when the model root is absent or empty', async () => {
    await expect(new AuthoringHelpCommand(root).execute('semantic-delta', {}))
      .rejects.toThrow('Semantic Model unavailable');

    await fs.mkdir(path.join(root, '.xirang', 'model'), { recursive: true });
    await expect(new AuthoringHelpCommand(root).execute('semantic-delta', {}))
      .rejects.toThrow('Semantic Model unavailable');
  });

  it('rejects a semantically invalid current model', async () => {
    await writeProjectModel(root, minimalModel({
      relationshipKinds: [{ identity: 'bridges', sourceKinds: ['missing-kind'] }],
    }));

    await expect(new AuthoringHelpCommand(root).execute('semantic-delta', {}))
      .rejects.toThrow('UNRESOLVED_KIND_REFERENCE');
  });

  it('does not fall back to preset kinds when the current Metamodel declares none', async () => {
    await writeProjectModel(root, minimalModel());

    const output = await captureLogs(() => new AuthoringHelpCommand(root).execute('semantic-delta', {}));

    expect(output).toContain('No Relationship Kinds are declared by the current Metamodel.');
    for (const kind of ['invokes', 'produces', 'consumes', 'precedes', 'constrains', 'validates']) {
      expect(output).not.toContain(`\`${kind}\``);
    }
  });

  it('returns model declarations instead of invented Relationship entries as JSON', async () => {
    await writeProjectModel(root, minimalModel({
      relationshipKinds: [
        { identity: 'bridges', sourceKinds: ['capability'], targetKinds: ['project'], body: 'Shared semantics.' },
      ],
    }));

    const output = await captureLogs(() => new AuthoringHelpCommand(root).execute('semantic-delta', { json: true }));
    const parsed = JSON.parse(output);

    expect(parsed).toMatchObject({
      file: 'semantic-delta',
      definition: {
        purpose: expect.any(String),
        compilationRole: expect.any(String),
        content: { includes: expect.any(Array), excludes: expect.any(Array) },
        writePolicy: 'agent-authored',
        validation: expect.any(Array),
      },
      relationshipDelta: {
        operations: ['ADDED', 'REMOVED'],
        identityFields: ['source', 'kind', 'target'],
      },
      relationshipKinds: [{
        identity: 'bridges',
        sourceKinds: ['capability'],
        targetKinds: ['project'],
        body: 'Shared semantics.',
      }],
    });
    expect(parsed).not.toHaveProperty('relations');
  });

  it('rejects unknown and legacy Xirang topics', async () => {
    const command = new AuthoringHelpCommand(root);
    await expect(command.execute('unknown.yaml', {})).rejects.toThrow('semantic-delta');
    await expect(command.execute('architecture-delta.c4', {})).rejects.toThrow('未知 authoring topic');
    await expect(command.execute('project.xirang.yaml', {})).rejects.toThrow('未知 authoring topic');
    await expect(command.execute('project.xirang.relations.yaml', {})).rejects.toThrow('未知 authoring topic');
  });

  it('requires an exact canonical topic', async () => {
    await expect(
      new AuthoringHelpCommand(root).execute('C:\\repo\\semantic-delta', {})
    ).rejects.toThrow('未知 authoring topic');
  });
});

describe('registerHelpCommand', () => {
  it('delegates non-authoring command paths to Commander help', async () => {
    const program = new Command().name('xirang').exitOverride();
    program.command('validate').description('Validate artifacts');
    registerHelpCommand(program);
    const output = await captureLogs(async () => {
      await program.parseAsync(['node', 'xirang', 'help', 'validate']);
    });
    expect(output).toContain('Usage: xirang validate');
  });
});
