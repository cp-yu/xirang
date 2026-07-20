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
  it('lists the three canonical topics', async () => {
    const output = await captureLogs(() => new AuthoringHelpCommand().execute(undefined, {}));
    expect(output).toContain('project.opsx.yaml');
    expect(output).toContain('project.opsx.relations.yaml');
    expect(output).toContain('architecture-delta.c4');
  });

  it('renders complete relation help from the Registry', async () => {
    const output = await captureLogs(() => new AuthoringHelpCommand().execute('project.opsx.relations.yaml', {}));
    for (const type of ['belongs_to', 'invokes', 'consumes', 'precedes', 'constrains', 'validates']) {
      expect(output).toContain(type);
    }
    expect(output).toContain('选择规则');
    expect(output).toContain('openspec validate --all');
  });

  it('returns Schema-backed definitions and Registry relation details', async () => {
    const output = await captureLogs(() => new AuthoringHelpCommand().execute('architecture-delta.c4', { json: true }));
    const parsed = JSON.parse(output);
    expect(parsed).toMatchObject({
      file: 'architecture-delta.c4',
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
    expect(parsed.relations).toHaveLength(6);
    expect(parsed.relations[0]).toEqual(expect.objectContaining({
      type: expect.any(String),
      fromKinds: expect.any(Array),
      toKinds: expect.any(Array),
      direction: expect.any(String),
      meaning: expect.any(String),
      useWhen: expect.any(String),
      doNotUseWhen: expect.any(String),
      propagationHint: expect.any(String),
      notePolicy: expect.any(Object),
      example: expect.any(Object),
    }));
  });

  it('rejects unknown topics and lists valid choices', async () => {
    await expect(new AuthoringHelpCommand().execute('unknown.yaml', {})).rejects.toThrow('project.opsx.yaml');
  });

  it('requires an exact canonical topic', async () => {
    await expect(
      new AuthoringHelpCommand().execute('C:\\repo\\openspec\\project.opsx.relations.yaml', {})
    ).rejects.toThrow('未知 authoring topic');
  });
});

describe('registerHelpCommand', () => {
  it('delegates non-authoring command paths to Commander help', async () => {
    const program = new Command().name('openspec').exitOverride();
    program.command('validate').description('Validate artifacts');
    registerHelpCommand(program);
    const output = await captureLogs(async () => {
      await program.parseAsync(['node', 'openspec', 'help', 'validate']);
    });
    expect(output).toContain('Usage: openspec validate');
  });
});
