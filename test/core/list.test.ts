import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ListCommand } from '../../src/core/list.js';
import { createCompleteQualityFixture } from '../helpers/quality-fixture.js';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';

describe('ListCommand', () => {
  let tempDir: string;
  let originalLog: typeof console.log;
  let logOutput: string[] = [];

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `xirang-list-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Mock console.log to capture output
    originalLog = console.log;
    console.log = (...args: any[]) => {
      logOutput.push(args.join(' '));
    };
    logOutput = [];
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Restore console.log
    console.log = originalLog;

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeFreshQualityRecord(changeDir: string): Promise<void> {
    await createCompleteQualityFixture(tempDir, changeDir);
  }

  describe('execute', () => {
    it('should handle missing .xirang/changes directory', async () => {
      const listCommand = new ListCommand();
      
      await expect(listCommand.execute(tempDir)).rejects.toThrow(
        "No Xirang changes directory found. Run 'xirang setup' first."
      );
    });

    it('should handle empty changes directory', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');
      await fs.mkdir(changesDir, { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir);

      expect(logOutput).toEqual(['No active changes found.']);
    });

    it('should exclude archive directory', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');
      await fs.mkdir(path.join(changesDir, 'archive'), { recursive: true });
      await fs.mkdir(path.join(changesDir, 'my-change'), { recursive: true });
      
      // Create tasks.md with some tasks
      await fs.writeFile(
        path.join(changesDir, 'my-change', 'tasks.md'),
        '- [x] Task 1\n- [ ] Task 2\n'
      );

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir);

      expect(logOutput).toContain('Changes:');
      expect(logOutput.some(line => line.includes('my-change'))).toBe(true);
      expect(logOutput.some(line => line.includes('archive'))).toBe(false);
    });

    it('should count goals correctly', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');
      await fs.mkdir(path.join(changesDir, 'test-change'), { recursive: true });
      
      await fs.writeFile(
        path.join(changesDir, 'test-change', 'tasks.md'),
        `## Goals

- [x] G1: Completed first goal
  - Contract: \`feature\` / Section "Behavior"
  - Verify: First behavior is observable.
- [x] G2: Completed second goal
  - Contract: \`feature\` / Section "Behavior"
  - Verify: Second behavior is observable.
- [ ] G3: Pending first goal
  - Contract: \`feature\` / Section "Behavior"
  - Verify: Third behavior is observable.
- [ ] G4: Pending second goal
  - Contract: \`feature\` / Section "Behavior"
  - Verify: Fourth behavior is observable.
- [ ] G5: Pending third goal
  - Contract: \`feature\` / Section "Behavior"
  - Verify: Fifth behavior is observable.
Regular text that should be ignored
`
      );

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir);

      expect(logOutput.some(line => line.includes('2/5 goals'))).toBe(true);
    });

    it('should show complete status for fully completed changes', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');
      await fs.mkdir(path.join(changesDir, 'completed-change'), { recursive: true });
      
      await fs.writeFile(
        path.join(changesDir, 'completed-change', 'tasks.md'),
        '## Goals\n\n- [x] G1: First completed goal\n  - Contract: `feature` / Section "Behavior"\n  - Verify: Behavior is observable.\n- [x] G2: Second completed goal\n  - Contract: `feature` / Section "Behavior"\n  - Verify: Behavior is observable.\n- [x] G3: Third completed goal\n  - Contract: `feature` / Section "Behavior"\n  - Verify: Behavior is observable.\n'
      );

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir);

      expect(logOutput.some(line => line.includes('✓ Complete'))).toBe(true);
    });

    it('should handle changes without tasks.md', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');
      await fs.mkdir(path.join(changesDir, 'no-tasks'), { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir);

      expect(logOutput.some(line => line.includes('no-tasks') && line.includes('No goals'))).toBe(true);
    });

    it('should sort changes alphabetically when sort=name', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');
      await fs.mkdir(path.join(changesDir, 'zebra'), { recursive: true });
      await fs.mkdir(path.join(changesDir, 'alpha'), { recursive: true });
      await fs.mkdir(path.join(changesDir, 'middle'), { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, { sort: 'name' });

      const changeLines = logOutput.filter(line =>
        line.includes('alpha') || line.includes('middle') || line.includes('zebra')
      );

      expect(changeLines[0]).toContain('alpha');
      expect(changeLines[1]).toContain('middle');
      expect(changeLines[2]).toContain('zebra');
    });

    it('should handle multiple changes with various states', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');
      
      await fs.mkdir(path.join(changesDir, 'completed'), { recursive: true });
      await fs.writeFile(
        path.join(changesDir, 'completed', 'tasks.md'),
        '## Goals\n\n- [x] G1: Completed first goal\n- [x] G2: Completed second goal\n'
      );

      await fs.mkdir(path.join(changesDir, 'partial'), { recursive: true });
      await fs.writeFile(
        path.join(changesDir, 'partial', 'tasks.md'),
        '## Goals\n\n- [x] G1: Completed goal\n- [ ] G2: Pending first goal\n- [ ] G3: Pending second goal\n'
      );

      await fs.mkdir(path.join(changesDir, 'no-tasks'), { recursive: true });

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir);

      expect(logOutput).toContain('Changes:');
      expect(logOutput.some(line => line.includes('completed') && line.includes('✓ Complete'))).toBe(true);
      expect(logOutput.some(line => line.includes('partial') && line.includes('1/3 goals'))).toBe(true);
      expect(logOutput.some(line => line.includes('no-tasks') && line.includes('No goals'))).toBe(true);
    });

    it.each([false, true])('should include compiler-derived details and preserve warnings (warning=%s)', async warning => {
      await writeProjectModel(tempDir, minimalModel());
      if (warning) await fs.rename(path.join(tempDir, '.xirang/model/metamodel/project.md'), path.join(tempDir, '.xirang/model/views/project.md'));
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      const changeDir = await writeChangeDelta(tempDir, 'demo', {
        'elements/auth.md': [
          '---',
          'operation: ADDED',
          'entity: element-declaration',
          'identity: auth',
          'kind: capability',
          'parent: root',
          'title: Auth',
          'definition: Authentication capability.',
          '---',
          '',
        ].join('\n'),
      });
      await fs.writeFile(path.join(changeDir, 'proposal.md'), '## Why\nTest.\n\n## What Changes\nAdd auth.\n');
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '## Goals\n\n- [x] G1: Completed goal\n- [ ] G2: Pending goal\n');

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, { json: true });

      const output = JSON.parse(logOutput[0]);
      expect(output).toMatchObject({
        changes: [{
          name: 'demo',
          title: 'demo',
          deltaCount: 1,
          completedTasks: 1,
          totalTasks: 2,
        }],
      });

      const jsonDiagnostics = errors.mock.calls.map(call => JSON.parse(call[0]));
      if (warning) expect(jsonDiagnostics).toContainEqual({ code: 'ENTITY_PARTITION_MISMATCH', message: expect.stringMatching(/demo.*views\/project\.md/) });
      else expect(jsonDiagnostics).toEqual([]);
      errors.mockClear();
      logOutput = [];
      await listCommand.execute(tempDir, { long: true });
      expect(logOutput.some(line => line.includes('demo: demo'))).toBe(true);
      expect(logOutput.some(line => line.includes('[deltas 1]'))).toBe(true);
      expect(logOutput.some(line => line.includes('[goals 1/2]'))).toBe(true);
      if (warning) expect(errors.mock.calls.map(call => call[0]).join('\n')).toMatch(/demo.*views\/project\.md.*ENTITY_PARTITION_MISMATCH/);
      else expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
    });

    it('should include qualityStatus in JSON output', async () => {
      const changesDir = path.join(tempDir, '.xirang', 'changes');

      const staleDir = path.join(changesDir, 'stale-change');
      await fs.mkdir(staleDir, { recursive: true });
      await fs.writeFile(path.join(staleDir, 'proposal.md'), '## Why\nstale\n\n## What Changes\n- ok');
      await fs.writeFile(path.join(staleDir, 'tasks.md'), '## Goals\n\n- [x] G1: Completed goal\n');
      await writeFreshQualityRecord(staleDir);
      await fs.writeFile(path.join(staleDir, 'proposal.md'), '## Why\nstale modified\n\n## What Changes\n- ok');

      const missingDir = path.join(changesDir, 'missing-change');
      await fs.mkdir(missingDir, { recursive: true });
      await fs.writeFile(path.join(missingDir, 'proposal.md'), '## Why\nmissing\n\n## What Changes\n- ok');
      await fs.writeFile(path.join(missingDir, 'tasks.md'), '## Goals\n\n- [ ] G1: Pending goal\n');

      const freshDir = path.join(changesDir, 'fresh-change');
      await fs.mkdir(freshDir, { recursive: true });
      await fs.writeFile(path.join(freshDir, 'proposal.md'), '## Why\nfresh\n\n## What Changes\n- ok');
      await fs.writeFile(path.join(freshDir, 'tasks.md'), '## Goals\n\n- [x] G1: Completed goal\n');
      await writeFreshQualityRecord(freshDir);

      const listCommand = new ListCommand();
      await listCommand.execute(tempDir, { json: true });

      const output = JSON.parse(logOutput[0]);
      const changes = Object.fromEntries(output.changes.map((change: any) => [change.name, change]));
      expect(changes['fresh-change'].qualityStatus).toBe('clean');
      expect(changes['stale-change'].qualityStatus).toBe('clean');
      expect(changes['missing-change'].qualityStatus).toBe('MISSING');
      expect(changes['fresh-change'].status).toBe('complete');
      expect(changes['missing-change'].status).toBe('in-progress');
    });

  });
});
