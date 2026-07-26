import { describe, expect, it, vi } from 'vitest';
import { AuthoringHelpCommand, registerHelpCommand } from '../../src/commands/help.js';
import { Command } from 'commander';

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
  it('lists only the active semantic Delta authoring topic', async () => {
    const output = await captureLogs(() => new AuthoringHelpCommand().execute(undefined, {}));
    expect(output).toContain('semantic-delta');
    expect(output).not.toContain('architecture-delta.c4');
    expect(output).not.toContain('project.xirang.yaml');
    expect(output).not.toContain('project.xirang.relations.yaml');
  });

  it('renders canonical Semantic Delta relationship help', async () => {
    const output = await captureLogs(() => new AuthoringHelpCommand().execute('semantic-delta', {}));
    for (const type of ['invokes', 'produces', 'consumes', 'precedes', 'constrains', 'validates']) {
      expect(output).toContain(type);
    }
    expect(output).not.toContain('belongs_to');
    expect(output).toContain('选择规则');
    expect(output).toContain('operation: ADDED');
    expect(output).toContain('source: element.cli.sync');
    expect(output).toContain('kind: invokes');
    expect(output).toContain('target: element.xirang.merge');
    expect(output).not.toMatch(/^\s*(from|type|to|note|description):/m);
    expect(output).toContain('xirang validate --change <name> --json');
    expect(output).toContain('xirang arch validate --change <name> --json');
  });

  it('returns Schema-backed definitions and canonical relationship entries', async () => {
    const output = await captureLogs(() => new AuthoringHelpCommand().execute('semantic-delta', { json: true }));
    const parsed = JSON.parse(output);
    expect(parsed).toMatchObject({
      file: 'semantic-delta',
      definition: {
        purpose: expect.any(String),
        compilationRole: expect.any(String),
        content: {
          includes: expect.any(Array),
          excludes: expect.any(Array),
        },
        writePolicy: 'agent-authored',
        validation: expect.any(Array),
      },
    });
    expect(parsed.relations).toEqual([
      { operation: 'ADDED', source: 'element.cli.sync', kind: 'invokes', target: 'element.xirang.merge' },
      { operation: 'ADDED', source: 'element.change.apply', kind: 'produces', target: 'element.architecture.delta' },
      { operation: 'ADDED', source: 'element.cli.help', kind: 'consumes', target: 'element.architecture.model' },
      { operation: 'ADDED', source: 'element.change.verify', kind: 'precedes', target: 'element.change.archive' },
      { operation: 'ADDED', source: 'element.config.schema', kind: 'constrains', target: 'element.config.load' },
      { operation: 'ADDED', source: 'element.validation.xirang', kind: 'validates', target: 'element.xirang.merge' },
    ]);
    for (const relation of parsed.relations) {
      expect(Object.keys(relation)).toEqual(['operation', 'source', 'kind', 'target']);
      expect(relation.operation).not.toBe('MODIFIED');
      for (const legacyKey of ['from', 'type', 'to', 'note', 'description']) {
        expect(relation).not.toHaveProperty(legacyKey);
      }
    }
  });

  it('rejects unknown and legacy Xirang topics', async () => {
    await expect(new AuthoringHelpCommand().execute('unknown.yaml', {})).rejects.toThrow('semantic-delta');
    await expect(new AuthoringHelpCommand().execute('architecture-delta.c4', {})).rejects.toThrow('未知 authoring topic');
    await expect(new AuthoringHelpCommand().execute('project.xirang.yaml', {})).rejects.toThrow('未知 authoring topic');
    await expect(new AuthoringHelpCommand().execute('project.xirang.relations.yaml', {})).rejects.toThrow('未知 authoring topic');
  });

  it('requires an exact canonical topic', async () => {
    await expect(
      new AuthoringHelpCommand().execute('C:\\repo\\semantic-delta', {})
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
