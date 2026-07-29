import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAvailableChanges } from '../../src/commands/workflow/shared.js';
import { selectActiveChange } from '../../src/core/change-utils.js';
import { ListCommand } from '../../src/core/list.js';
import { getActiveChangeIds } from '../../src/utils/item-discovery.js';

const select = vi.fn(async ({ choices }: { choices: Array<{ value: string }> }) => choices[0]?.value ?? null);
vi.mock('@inquirer/prompts', () => ({ select }));

const roots: string[] = [];
afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

describe('framing discovery isolation', () => {
  it('keeps hidden framing files out of ordinary Change discovery', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-discovery-'));
    roots.push(root);
    const changes = path.join(root, '.xirang', 'changes');
    await fs.mkdir(path.join(changes, 'real-change'), { recursive: true });
    await fs.mkdir(path.join(changes, '.hidden-change'), { recursive: true });
    await fs.writeFile(path.join(changes, 'real-change', 'proposal.md'), '## Why\n\nReason.\n', 'utf8');
    await fs.writeFile(path.join(changes, '.hidden-change', 'tasks.md'), '- [ ] hidden\n', 'utf8');
    await fs.writeFile(
      path.join(changes, '.explore-sample-20260729T120000Z-a1b2c3d4.md'),
      'not a Change',
      'utf8',
    );

    expect(await getActiveChangeIds(root)).toEqual(['real-change']);
    expect(await getAvailableChanges(root)).toEqual(['real-change']);

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await new ListCommand().execute(root, { json: true });
    expect(JSON.parse(String(log.mock.calls.at(-1)?.[0])).changes).toEqual([
      expect.objectContaining({ name: 'real-change' }),
    ]);
    log.mockRestore();

    expect(await selectActiveChange(changes)).toBe('real-change');
    expect(select).toHaveBeenCalledWith(expect.objectContaining({
      choices: [expect.objectContaining({ value: 'real-change' })],
    }));
  });
});
