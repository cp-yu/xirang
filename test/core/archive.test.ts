import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveCommand } from '../../src/core/archive.js';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';
import { createCompleteQualityFixture, createBaselineOnlyQualityFixture } from '../helpers/quality-fixture.js';

const execFileAsync = promisify(execFile);

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  confirm: vi.fn()
}));

describe('ArchiveCommand', () => {
  let tempDir: string;
  let archiveCommand: ArchiveCommand;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `xirang-archive-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Change to temp directory
    process.chdir(tempDir);
    
    // Create Xirang structure
    const xirangDir = path.join(tempDir, '.xirang');
    await fs.mkdir(path.join(xirangDir, 'changes'), { recursive: true });
    await fs.mkdir(path.join(xirangDir, 'changes', 'archive'), { recursive: true });
    await writeModelFixture();
    
    // Suppress console.log during tests
    console.log = vi.fn();
    console.error = vi.fn();
    
    archiveCommand = new ArchiveCommand();
  });

  async function writeModelFixture(): Promise<void> {
    await writeProjectModel(tempDir, minimalModel({
      elements: [{ identity: 'existing.id', parent: 'root', title: 'Existing', definition: 'Existing summary' }],
    }));
  }

  const MODIFY_EXISTING = '---\noperation: MODIFIED\nentity: element-declaration\nidentity: existing.id\n'
    + 'kind: capability\nparent: root\ntitle: Existing\ndefinition: Changed summary\n---\n';

  async function writeSemanticArchiveFixture(changeName: string): Promise<string> {
    const changeDir = await writeChangeDelta(tempDir, changeName, { 'elements/existing.id.md': MODIFY_EXISTING });
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] complete\n');
    return changeDir;
  }

  async function writeFreshQualityRecord(changeDir: string): Promise<void> {
    await createCompleteQualityFixture(tempDir, changeDir);
  }

  afterEach(async () => {
    // Restore console.log
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('execute', () => {
    it('should archive a change successfully', async () => {
      // Create a test change
      const changeName = 'test-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      // Create tasks.md with completed tasks
      const tasksContent = '- [x] Task 1\n- [x] Task 2';
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);

      // Execute archive with --yes flag
      await archiveCommand.execute(changeName, { yes: true, quick: true });

      // Check that change was moved to archive
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);

      expect(archives.length).toBe(1);
      expect(archives[0]).toMatch(new RegExp(`\\d{4}-\\d{2}-\\d{2}-${changeName}`));
      
      // Verify original change directory no longer exists
      await expect(fs.access(changeDir)).rejects.toThrow();
    });

    it('archives a semantic change without creating a presentation artifact', async () => {
      const changeName = 'semantic-without-report';
      await writeSemanticArchiveFixture(changeName);

      await archiveCommand.execute(changeName, { yes: true, quick: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archived = (await fs.readdir(archiveDir)).find(entry => entry.endsWith(`-${changeName}`));
      expect(archived).toBeDefined();
      const archivedDir = path.join(archiveDir, archived!);
      await expect(fs.access(path.join(archivedDir, 'effective-change.md'))).rejects.toThrow();
      await expect(fs.access(path.join(archivedDir, 'elements', 'existing.id.md'))).resolves.toBeUndefined();
    });

    it('moves an existing legacy presentation file without changing its bytes', async () => {
      const changeName = 'semantic-legacy-report';
      const changeDir = await writeSemanticArchiveFixture(changeName);
      const report = Buffer.from('# Legacy report\r\n\x00unchanged\n', 'utf8');
      await fs.writeFile(path.join(changeDir, 'effective-change.md'), report);

      await archiveCommand.execute(changeName, { yes: true, quick: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archived = (await fs.readdir(archiveDir)).find(entry => entry.endsWith(`-${changeName}`));
      expect(archived).toBeDefined();
      expect(await fs.readFile(path.join(archiveDir, archived!, 'effective-change.md'))).toEqual(report);
    });

    it('prints agent handoff reminder for legacy auto git mode without recommended commit message', async () => {
      const changeName = 'auto-handoff';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n', 'utf-8');
      await fs.writeFile(path.join(tempDir, '.xirang', 'config.yaml'), `schema: semantic-model
git:
  autoCommit: auto
`, 'utf-8');

      await archiveCommand.execute(changeName, { yes: true, quick: true });

      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Git handoff:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('archive'));
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining(`docs(${changeName}): Archive change artifacts`)
      );
    });

    it('prints agent handoff reminder for legacy manual git mode without recommended commit message', async () => {
      const changeName = 'manual-handoff';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n', 'utf-8');
      await fs.writeFile(path.join(tempDir, '.xirang', 'config.yaml'), `schema: semantic-model
git:
  autoCommit: manual
`, 'utf-8');

      await archiveCommand.execute(changeName, { yes: true, quick: true });

      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Git handoff:'));
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining(`docs(${changeName}): Archive change artifacts`)
      );
    });

    it('should block archive when the quality record is missing', async () => {
      const changeName = 'missing-quality';
      await fs.mkdir(path.join(tempDir, '.xirang', 'changes', changeName), { recursive: true });

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow('valid Seal commit');
    });

    it('blocks archive while v2 completion is incomplete', async () => {
      const changeName = 'incomplete-quality';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await createBaselineOnlyQualityFixture(tempDir, changeDir);

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow('valid Seal commit');
    });

    it('should archive when the quality record is clean and no sync is required', async () => {
      const changeName = 'fresh-quality';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await writeFreshQualityRecord(changeDir);

      await archiveCommand.execute(changeName, { yes: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.some((entry) => entry.includes(changeName))).toBe(true);
    });

    it('should archive after seal when only git HEAD changed', async () => {
      const changeName = 'fresh-after-seal';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await execFileAsync('git', ['init'], { cwd: tempDir });
      await execFileAsync('git', ['config', 'user.name', 'Xirang Test'], { cwd: tempDir });
      await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir });
      await writeFreshQualityRecord(changeDir);
      await execFileAsync('git', ['add', '.'], { cwd: tempDir });
      await execFileAsync('git', ['commit', '-m', 'verified'], { cwd: tempDir });

      await execFileAsync('git', ['commit', '--allow-empty', '-m', 'checkpoint'], { cwd: tempDir });

      await archiveCommand.execute(changeName, { yes: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.some((entry) => entry.includes(changeName))).toBe(true);
    });

    it('applies pending model writes before enclosing the Change in history', async () => {
      const changeName = 'pending-sync-gate';
      const changeDir = await writeChangeDelta(tempDir, changeName, { 'elements/existing.id.md': MODIFY_EXISTING });
      await writeFreshQualityRecord(changeDir);
      const quality = await fs.readFile(path.join(changeDir, '.quality.json'));

      await archiveCommand.execute(changeName, { yes: true });
      await expect(fs.readFile(path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md'), 'utf8')).resolves.toContain('Changed summary');
      await expect(fs.access(changeDir)).rejects.toMatchObject({ code: 'ENOENT' });
      const archive = path.join(path.dirname(changeDir), 'archive');
      const [archived] = await fs.readdir(archive);
      await expect(fs.readFile(path.join(archive, archived, '.quality.json'))).resolves.toEqual(quality);
    });

    it('keeps an invalid Change active when abandon is declined, then archives it with recorded progress under --yes', async () => {
      const name = 'change-a';
      const source = await writeChangeDelta(tempDir, name, { 'elements/broken.md': 'malformed' });
      const tasks = '## Goals\n- [x] G1: One\n- [x] G2: Two\n- [ ] G3: Three\n- [ ] G4: Four\n- [ ] G5: Five\n';
      await fs.writeFile(path.join(source, 'tasks.md'), tasks);
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const model = await fs.readFile(modelFile);
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockResolvedValueOnce(false);
      await archiveCommand.execute(name, { abandon: true });
      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ default: false }));
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('2/5'));
      await expect(fs.access(source)).resolves.toBeUndefined();

      await archiveCommand.execute(name, { abandon: true, yes: true });
      expect(confirm).toHaveBeenCalledTimes(1);
      const dir = path.join(path.dirname(source), 'archive', 'abandoned');
      const [archived] = await fs.readdir(dir);
      await expect(fs.readFile(path.join(dir, archived, 'tasks.md'), 'utf8')).resolves.toBe(tasks);
      await expect(fs.readFile(modelFile)).resolves.toEqual(model);
    });

    it('rejects a malformed Semantic Delta unit at the archive sync gate', async () => {
      const changeName = 'malformed-delta';
      const changeDir = await writeChangeDelta(tempDir, changeName, {
        'elements/broken.md': '---\nentity: element-declaration\n---\n',
      });
      await writeFreshQualityRecord(changeDir);

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow(/MISSING_IDENTITY/);
    });

    it('should allow archive when the Semantic Delta is already synced', async () => {
      const changeName = 'already-synced-gate';
      const changeDir = await writeChangeDelta(tempDir, changeName, { 'elements/existing.id.md': MODIFY_EXISTING });
      await writeFreshQualityRecord(changeDir);
      await writeProjectModel(tempDir, minimalModel({
        elements: [{ identity: 'existing.id', parent: 'root', title: 'Existing', definition: 'Changed summary' }],
      }));

      await archiveCommand.execute(changeName, { yes: true, quick: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archived = (await fs.readdir(archiveDir)).find((entry) => entry.includes(changeName));
      expect(archived).toBeDefined();
      await expect(fs.access(path.join(archiveDir, archived!, 'effective-change.md'))).rejects.toThrow();
    });

    it('should allow archive when an already-removed Element stays removed', async () => {
      const changeName = 'already-removed-element';
      const changeDir = await writeChangeDelta(tempDir, changeName, {
        'elements/ghost.md': '---\noperation: REMOVED\nentity: element-declaration\nidentity: ghost.id\n---\n',
      });
      await writeFreshQualityRecord(changeDir);

      await archiveCommand.execute(changeName, { yes: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      expect((await fs.readdir(archiveDir)).some((entry) => entry.includes(changeName))).toBe(true);
    });

    it('should warn about incomplete tasks', async () => {
      const changeName = 'incomplete-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      const tasksContent = [
        '## Goals',
        '',
        '- [x] G1: Completed goal',
        '  - Contract: `feature` / Section "Core behavior"',
        '  - Verify: The completed behavior is observable.',
        '- [ ] G2: Pending goal',
        '  - Contract: `feature` / Section "Core behavior"',
        '  - Verify: The pending behavior is observable.',
        '- [ ] G3: Another pending goal',
        '  - Contract: `feature` / Section "Core behavior"',
        '  - Verify: The second pending behavior is observable.',
      ].join('\n');
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);

      
      // Execute archive with --yes flag
      await archiveCommand.execute(changeName, { yes: true, quick: true });
      
      // Verify warning was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Warning: 2 incomplete goal(s) found')
      );
    });

    it('applies pending view changes before archiving', async () => {
      const changeName = 'pending-architecture';
      const changeDir = await writeChangeDelta(tempDir, changeName, {
        'views/index.md': '---\noperation: ADDED\nentity: authored-view\nidentity: index\ninclude: "*"\n---\n',
      });
      await writeFreshQualityRecord(changeDir);

      await archiveCommand.execute(changeName, { yes: true });
      await expect(fs.readFile(path.join(tempDir, '.xirang', 'model', 'views', 'index.md'), 'utf8')).resolves.toContain('identity: index');
    });

    it.each([false, true])('restores the preimage and keeps the active Change when the archive move fails (quick=%s)', async quick => {
      const name = 'move-fails';
      const source = await writeSemanticArchiveFixture(name);
      if (!quick) await writeFreshQualityRecord(source);
      const formal = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const preimage = await fs.readFile(formal);
      const bytes = await fs.readFile(path.join(source, 'elements', 'existing.id.md'));
      const command = new ArchiveCommand({
        rename: async () => {
          await expect(fs.readFile(formal, 'utf8')).resolves.toContain('Changed summary');
          throw Object.assign(new Error('cannot move'), { code: 'EACCES' });
        },
      });
      await expect(command.execute(name, { quick, yes: true })).rejects.toThrow('cannot move');
      await expect(fs.readFile(formal)).resolves.toEqual(preimage);
      await expect(fs.readFile(path.join(source, 'elements', 'existing.id.md'))).resolves.toEqual(bytes);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it('should throw error if change does not exist', async () => {
      await expect(
        archiveCommand.execute('non-existent-change', { yes: true, quick: true })
      ).rejects.toThrow("Change 'non-existent-change' not found.");
    });

    it('should throw error if archive already exists', async () => {
      const changeName = 'duplicate-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      const date = new Date().toISOString().split('T')[0];
      const archivePath = path.join(tempDir, '.xirang', 'changes', 'archive', `${date}-${changeName}`);
      await fs.mkdir(archivePath, { recursive: true });
      
      await expect(
        archiveCommand.execute(changeName, { yes: true, quick: true })
      ).rejects.toThrow(`Archive '${date}-${changeName}' already exists.`);
    });

    it('should handle changes without tasks.md', async () => {
      const changeName = 'no-tasks-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      await archiveCommand.execute(changeName, { yes: true, quick: true });
      
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('incomplete goal(s)')
      );
      
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.length).toBe(1);
    });

    it('should handle changes without specs', async () => {
      const changeName = 'no-specs-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      await archiveCommand.execute(changeName, { yes: true, quick: true });
      
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Specs to update')
      );
      
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.length).toBe(1);
    });

  });

  describe('error handling', () => {
    it('should throw error when xirang directory does not exist', async () => {
      // Remove xirang directory
      await fs.rm(path.join(tempDir, '.xirang'), { recursive: true });
      
      await expect(
        archiveCommand.execute('any-change', { yes: true, quick: true })
      ).rejects.toThrow("No Xirang changes directory found. Run 'xirang setup' first.");
    });
  });

  describe('interactive mode', () => {
    it('should use select prompt for change selection', async () => {
      const { select } = await import('@inquirer/prompts');
      const mockSelect = select as unknown as ReturnType<typeof vi.fn>;
      
      // Create test changes
      const change1 = 'feature-a';
      const change2 = 'feature-b';
      await fs.mkdir(path.join(tempDir, '.xirang', 'changes', change1), { recursive: true });
      await fs.mkdir(path.join(tempDir, '.xirang', 'changes', change2), { recursive: true });
      
      // Mock select to return first change
      mockSelect.mockResolvedValueOnce(change1);
      
      // Execute without change name
      await archiveCommand.execute(undefined, { yes: true, quick: true });
      
      // Verify select was called with correct options (values matter, names may include progress)
      expect(mockSelect).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select a change to archive',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: change1 }),
          expect.objectContaining({ value: change2 })
        ])
      }));
      
      // Verify the selected change was archived
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives[0]).toContain(change1);
    });

    it('should use confirm prompt for task warnings', async () => {
      const { confirm } = await import('@inquirer/prompts');
      const mockConfirm = confirm as unknown as ReturnType<typeof vi.fn>;
      
      const changeName = 'incomplete-interactive';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      const tasksContent = [
        '## Goals',
        '',
        '- [ ] G1: Pending goal',
        '  - Contract: `feature` / Section "Core behavior"',
        '  - Verify: The pending behavior is observable.',
      ].join('\n');
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);
      
      // Mock confirm to return true (proceed)
      mockConfirm.mockResolvedValueOnce(true);
      
      // Execute without --yes flag
      await archiveCommand.execute(changeName, { quick: true });
      
      // Verify confirm was called
      expect(mockConfirm).toHaveBeenCalledWith({
        message: 'Warning: 1 incomplete goal(s) found. Continue?',
        default: false
      });
    });

    it('should cancel when user declines task warning', async () => {
      const { confirm } = await import('@inquirer/prompts');
      const mockConfirm = confirm as unknown as ReturnType<typeof vi.fn>;
      
      const changeName = 'cancel-test';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      const tasksContent = '## Goals\n\n- [ ] G1: Pending goal\n  - Contract: `feature` / Section "Core behavior"\n  - Verify: The pending behavior is observable.';
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);
      
      mockConfirm.mockResolvedValueOnce(false);
      await archiveCommand.execute(changeName, { quick: true });
      expect(console.error).toHaveBeenCalledWith('Archive cancelled.');
      // Verify change was not archived
      await expect(fs.access(changeDir)).resolves.not.toThrow();
    });

    it('preserves apply isolation state for handoff under --yes', async () => {
      const changeName = 'isolated-yes';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n');
      await fs.writeFile(
        path.join(changeDir, '.apply-isolation.json'),
        JSON.stringify({
          method: 'worktree',
          branchName: changeName,
          worktreePath: path.join(tempDir, '.worktrees', changeName),
          originalBranch: 'main',
        })
      );

      await archiveCommand.execute(changeName, { yes: true, quick: true });

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Worktree cleanup')
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Branch switch')
      );
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Git handoff:'));
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const [archiveName] = (await fs.readdir(archiveDir)).filter((entry) => entry.includes(changeName));
      await expect(fs.access(path.join(archiveDir, archiveName, '.apply-isolation.json'))).resolves.not.toThrow();
    });

  });
});
