import type { Command } from 'commander';
import { describe, it, expect } from 'vitest';
import { program } from '../../../src/cli/index.js';
import { POSITIONAL_TYPE_MAP } from '../../../src/core/completions/positional-types.js';

function collectPositionalCommandPaths(command: Command, parentPath = ''): string[] {
  return command.commands.flatMap((child) => {
    if ((child as Command & { _hidden?: boolean })._hidden) return [];
    const path = parentPath ? `${parentPath}.${child.name()}` : child.name();
    return [
      ...(child.registeredArguments.length > 0 ? [path] : []),
      ...collectPositionalCommandPaths(child, path),
    ];
  });
}

describe('positional-types', () => {
  it('MAP 条目格式：每个条目的值为合法 PositionalType', () => {
    const validTypes = ['change-id', 'contract-id', 'change-or-contract-id', 'path', 'shell', 'schema-name', 'text', 'element-id'];

    for (const [key, value] of Object.entries(POSITIONAL_TYPE_MAP)) {
      expect(validTypes).toContain(value);
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('真实 CLI 的每个 positional command 都声明 completion type', () => {
    const missing = collectPositionalCommandPaths(program)
      .filter((commandPath) => !POSITIONAL_TYPE_MAP[commandPath]);

    expect(missing).toEqual([]);
  });
});
