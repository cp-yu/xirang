import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveCommand } from '../../src/core/archive.js';
import { pendingArchivePath } from '../../src/core/archive-paths.js';
import { execFile, spawnSync } from 'child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { elementKindUnit, elementUnit, minimalModel, writeChangeDelta, writeProjectModel } from '../helpers/model-fixture.js';
import { createCompleteQualityFixture, createBaselineOnlyQualityFixture } from '../helpers/quality-fixture.js';
import { readQualityRecord, recordQualityReview } from '../../src/core/quality/engine.js';

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
    // Fault injection compares paths passed by Archive, which roots them at process.cwd().
    tempDir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-archive-test-')));
    
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

  async function revokeSeal(changeDir: string): Promise<void> {
    const quality = await readQualityRecord(changeDir);
    await recordQualityReview({
      changeDir, projectRoot: tempDir, expectedRevision: quality.revision,
      reviewKind: 'full-change', commit: quality.seal!.commit, result: 'FAIL',
      summary: 'Independent review revoked the Seal.', findings: ['New evidence invalidates the Seal.'],
    });
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

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow(/valid Seal commit[\s\S]*Return to Apply/);
    });

    it('blocks archive while v2 completion is incomplete', async () => {
      const changeName = 'incomplete-quality';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await createBaselineOnlyQualityFixture(tempDir, changeDir);

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow(/valid Seal commit[\s\S]*Return to Apply/);
    });

    it('rejects a Seal whose commit object is missing and hands off to Apply without writes', async () => {
      const name = 'missing-seal-commit';
      const source = await writeSemanticArchiveFixture(name);
      await writeFreshQualityRecord(source);
      const quality = path.join(source, '.quality.json');
      const record = JSON.parse(await fs.readFile(quality, 'utf8'));
      const missing = 'f'.repeat(40);
      record.seal.commit = missing;
      const stored = JSON.stringify(record);
      await fs.writeFile(quality, stored);
      const model = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(model);

      await expect(archiveCommand.execute(name, { yes: true })).rejects.toThrow(
        new RegExp(`GIT_COMMIT_NOT_FOUND[^\\n]*${missing}[\\s\\S]*Return to Apply`),
      );
      await expect(fs.readFile(model)).resolves.toEqual(before);
      await expect(fs.readFile(quality, 'utf8')).resolves.toBe(stored);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
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
      expect(vi.mocked(console.error).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(confirm).mock.invocationCallOrder[0]);
      await expect(fs.access(source)).resolves.toBeUndefined();

      vi.mocked(console.error).mockClear();
      await archiveCommand.execute(name, { abandon: true, yes: true });
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('2/5'));
      expect(confirm).toHaveBeenCalledTimes(1);
      const dir = path.join(path.dirname(source), 'archive', 'abandoned');
      const [archived] = await fs.readdir(dir);
      await expect(fs.readFile(path.join(dir, archived, 'tasks.md'), 'utf8')).resolves.toBe(tasks);
      await expect(fs.readFile(modelFile)).resolves.toEqual(model);
    });

    it('can abandon after an interrupted local delivery without rolling Formal back', async () => {
      const name = 'interrupted-delivery';
      const source = await writeSemanticArchiveFixture(name);
      const changes = path.dirname(source);
      const host = createHash('sha256').update(os.hostname()).digest('hex').slice(0, 16);
      const stopped = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
      expect(stopped.status).toBe(0);
      await fs.mkdir(path.join(changes, `.archive-lock-${host}-${stopped.pid}-fixture`));
      await fs.mkdir(path.join(changes, 'archive', `${new Date().toISOString().slice(0, 10)}-${name}`));
      const model = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      await fs.writeFile(model, (await fs.readFile(model, 'utf8')).replace('Existing summary', 'Changed summary'));
      const afterInterruptedWrite = await fs.readFile(model);

      await archiveCommand.execute(name, { abandon: true, yes: true });
      await expect(fs.readFile(model)).resolves.toEqual(afterInterruptedWrite);
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
      const abandoned = path.join(changes, 'archive', 'abandoned');
      const [entry] = await fs.readdir(abandoned);
      await expect(fs.readFile(path.join(abandoned, entry, 'elements', 'existing.id.md'), 'utf8')).resolves.toBe(MODIFY_EXISTING);
    });

    it.skipIf(process.platform === 'win32').for([false, true])('archives names at the component limit (abandon=%s)', async (abandon, context) => {
      const name = 'n'.repeat(244);
      const source = await writeChangeDelta(tempDir, name, { 'proposal.md': 'Long name' });
      const parent = path.join(path.dirname(source), 'archive', ...(abandon ? ['abandoned'] : []));
      await fs.mkdir(parent, { recursive: true });
      const probe = path.join(parent, 'x'.repeat(255));
      try { await fs.mkdir(probe); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENAMETOOLONG') return context.skip('Filesystem component limit is below 255');
        throw error;
      }
      await fs.rmdir(probe);

      await archiveCommand.execute(name, { quick: !abandon, abandon, yes: true, json: true });

      const { archive } = JSON.parse(vi.mocked(console.log).mock.lastCall![0]);
      expect(path.basename(archive)).toMatch(new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${name}$`));
      await expect(fs.readFile(path.join(tempDir, archive, 'proposal.md'), 'utf8')).resolves.toBe('Long name');
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('ignores an old local claim when that PID now identifies another process', async () => {
      const name = 'reused-pid';
      const source = await writeChangeDelta(tempDir, name, { 'proposal.md': 'Original' });
      const host = createHash('sha256').update(os.hostname()).digest('hex').slice(0, 16);
      const marker = path.join(path.dirname(source), `.archive-lock-${host}-${process.pid}-0000000000000000-fixture`);
      await fs.mkdir(marker);

      await archiveCommand.execute(name, { abandon: true, yes: true });

      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.access(marker)).resolves.toBeUndefined();
    });

    it('rejects a malformed Semantic Delta unit at the archive sync gate', async () => {
      const changeName = 'malformed-delta';
      const changeDir = await writeChangeDelta(tempDir, changeName, {
        'elements/broken.md': '---\nentity: element-declaration\n---\n',
      });
      await writeFreshQualityRecord(changeDir);

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow(/MISSING_IDENTITY/);
    });

    it('keeps the Change active when an Element declaration omits its operation and has no Section operations', async () => {
      const name = 'missing-declaration-operation';
      const unit = 'elements/existing.id.md';
      const delta = MODIFY_EXISTING.replace('operation: MODIFIED\n', '');
      const source = await writeChangeDelta(tempDir, name, { [unit]: delta });
      const formal = path.join(tempDir, '.xirang', 'model', unit);
      const before = await fs.readFile(formal);

      await expect(archiveCommand.execute(name, { quick: true, yes: true })).rejects.toThrow(/existing\.id\.md: MISSING_OPERATION/);
      await expect(fs.readFile(formal)).resolves.toEqual(before);
      await expect(fs.readFile(path.join(source, unit), 'utf8')).resolves.toBe(delta);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it('archives an unchanged navigation declaration without applying a Delta', async () => {
      const name = 'navigation-declaration';
      const unit = 'elements/existing.id.md';
      const formal = path.join(tempDir, '.xirang', 'model', unit);
      const before = await fs.readFile(formal);
      const delta = elementUnit({ identity: 'existing.id', title: 'Existing', definition: 'Existing summary' });
      const source = await writeChangeDelta(tempDir, name, { [unit]: delta });

      await archiveCommand.execute(name, { quick: true, yes: true, json: true });

      const { archive } = JSON.parse(vi.mocked(console.log).mock.lastCall![0]);
      await expect(fs.readFile(formal)).resolves.toEqual(before);
      await expect(fs.readFile(path.join(tempDir, archive, unit), 'utf8')).resolves.toBe(delta);
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
    });

    it.each([
      ['## ADDED Sections\n- ### Section: Omitted\nLost behavior.\n\n### Section: Kept\nThe system SHALL retain this.\n', 'UNSCOPED_SECTION_CONTENT'],
      ['## MODIFIED Sections\nUnscoped content.\n\n### Section: Kept\nThe system SHALL retain this.\n', 'UNSCOPED_SECTION_CONTENT'],
      ['Unscoped content.\n\n## ADDED Sections\n### Section: Kept\nThe system SHALL retain this.\n', 'UNSCOPED_SECTION_CONTENT'],
      ['# The system SHALL not expose private notes.\n\n## ADDED Sections\n### Section: Kept\nThe system SHALL retain this.\n', 'UNSCOPED_SECTION_CONTENT'],
      ['## MODIFIED Sections\n', 'EMPTY_OPERATION_BLOCK'],
      ['## ADDED Sections\n\n## ADDED Sections\n\n### Section: New\nThe system SHALL add behavior.\n', 'DUPLICATE_OPERATION_BLOCK'],
      ['## ADDED Sections\n\n### Section: No text\n', 'missing Section text'],
      ['## ADDED Sections\n\n### Section: New\nThe system SHALL add behavior.\n\n## REMOVED Sections\n', 'EMPTY_OPERATION_BLOCK'],
      ['## ADDED Sections\n\n### Section: New\nThe system SHALL add behavior.\n\n## RENAMED Sections\n- Old to New\n', 'UNSUPPORTED_OPERATION'],
      ['## ADDED Sections\n### Section: New\nThe system SHALL add behavior.\n\n    ```md\n\n## RENAMED Sections\n### Section: Old\n', 'UNSUPPORTED_OPERATION'],
      ['## ADDED Sections\n\n### Section: New\nThe system SHALL add behavior.\n\n## DELETED Sections\n### Section: Old\n', 'DELETED Sections is unsupported'],
      ['### Section: Unscoped\nThe system SHALL preserve this requirement.\n\n## ADDED Sections\n\n### Section: Scoped\nThe system SHALL keep this requirement.\n', 'Unscoped'],
      ['## ADDED Sections\n\n### Section:  \nThe system SHALL not lose this text.\n\n### Section: Titled\nThe system SHALL preserve the titled Section.\n', 'Malformed Section header'],
      ['## ADDED Sections\n\n### Section: Valid\nThe system SHALL retain this Section.\n\n## REMOVED Sections\n- ### Section:   \n', 'Malformed Section header'],
      ['## ADDED Sections\n\n### Section: Valid\nThe system SHALL retain this Section.\n\n## REMOVED Sections\n- `### Section:   `\n', 'Malformed Section header'],
      ['## ADDED Sections\n### Section: New\nThe system SHALL add behavior.\n  ## DELETED Sections\n### Section: Old\n', 'DELETED Sections is unsupported'],
      ['## ADDED Sections\n### Section: New\nThe system SHALL add behavior.\n  ### Section:  \nThe system SHALL not silently omit this text.\n', 'Malformed Section header'],
      ['## REMOVED Sections\n### Section: Old\nREMOVED entries must not carry prose.\n', 'REMOVED Sections may only name'],
      ['## ADDED Sections\n### Section: ###\nThe system SHALL not install an unnamed Section.\n\n### Section: Valid\nThe system SHALL keep this requirement.\n', 'Malformed Section header'],
      ['## REMOVED Sections\n- `### Section: ###`\n### Section: Old\n', 'Malformed Section header'],
    ])('keeps model and Change intact when Section operations are invalid (%s)', async (body, errorCode) => {
      const source = await writeChangeDelta(tempDir, 'bad-sections', { 'elements/existing.id.md': MODIFY_EXISTING + body });
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(modelFile);

      await expect(archiveCommand.execute('bad-sections', { yes: true, quick: true })).rejects.toThrow(errorCode);
      await expect(fs.readFile(modelFile)).resolves.toEqual(before);
      await expect(fs.readFile(path.join(source, 'elements/existing.id.md'), 'utf8')).resolves.toBe(MODIFY_EXISTING + body);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it.each(['### Section: Legacy behavior ###', '- `### Section: Legacy behavior ###`'])('rejects an ambiguous removal instead of silently leaving the Section (%s)', async header => {
      const name = 'ambiguous-removal';
      const unit = 'elements/existing.id.md';
      const formal = path.join(tempDir, '.xirang', 'model', unit);
      const before = elementUnit({ identity: 'existing.id', title: 'Existing', definition: 'Existing summary',
        sections: '## Specification\n\n### Section: Legacy behavior\nThe system SHALL offer the legacy behavior.' });
      await fs.writeFile(formal, before);
      const delta = MODIFY_EXISTING + `## REMOVED Sections\n${header}\n`;
      const source = await writeChangeDelta(tempDir, name, { [unit]: delta });

      await expect(archiveCommand.execute(name, { quick: true, yes: true })).rejects.toThrow(/Malformed Section header/);
      await expect(fs.readFile(formal, 'utf8')).resolves.toBe(before);
      await expect(fs.readFile(path.join(source, unit), 'utf8')).resolves.toBe(delta);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it('rejects a compiled target that loses an untouched Section when read as Formal', async () => {
      const name = 'unreadable-section-target';
      const unit = 'elements/existing.id.md';
      const formal = path.join(tempDir, '.xirang', 'model', unit);
      const before = elementUnit({ identity: 'existing.id', title: 'Existing', definition: 'Existing summary',
        sections: '## Specification\n\n### Section: First\nThe system SHALL do the first thing.\n\n'
          + '### Section: Untouched\nThe system SHALL do the second thing.' });
      await fs.writeFile(formal, before);
      const delta = MODIFY_EXISTING + '## MODIFIED Sections\n\n### Section: First\nThe system SHALL change the first thing.\n\n```text\nexample\n';
      const source = await writeChangeDelta(tempDir, name, { [unit]: delta });
      const rename = vi.spyOn(fs, 'rename');
      try {
        await expect(archiveCommand.execute(name, { quick: true, yes: true })).rejects.toThrow(/Expected Semantic Model/);
        expect(rename).not.toHaveBeenCalled();
      } finally {
        rename.mockRestore();
      }
      await expect(fs.readFile(formal, 'utf8')).resolves.toBe(before);
      await expect(fs.readFile(path.join(source, unit), 'utf8')).resolves.toBe(delta);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it('delivers the getting-started Section Delta as written', async () => {
      const doc = await fs.readFile(new URL('../../docs/getting-started.md', import.meta.url), 'utf8');
      const delta = doc.match(/### The Format[\s\S]+?```markdown\r?\n([\s\S]+?)\r?\n```/)?.[1];
      expect(delta).toBeDefined();
      await writeProjectModel(tempDir, minimalModel({ elements: [{
        identity: 'auth', title: 'Authentication', definition: 'Authenticates users and manages their sessions.',
        sections: '## Specification\n\n### Section: Session Timeout\nThe system SHALL expire sessions after 60 minutes.\n\n'
          + '### Section: Remember Me\nThe system SHALL offer to remember the user.',
      }] }));
      await writeChangeDelta(tempDir, 'auth-example', { 'elements/auth.md': delta! });
      await archiveCommand.execute('auth-example', { quick: true, yes: true });
      const formal = await fs.readFile(path.join(tempDir, '.xirang', 'model', 'elements', 'auth.md'), 'utf8');
      expect(formal).toContain('after 30 minutes of inactivity');
      expect(formal).toContain('### Section: Two-Factor Authentication');
      expect(formal).not.toContain('### Section: Remember Me');
    });

    it('delivers the first-change tutorial using the documented Delta path and a valid Seal', async () => {
      const doc = await fs.readFile(new URL('../../docs/getting-started.md', import.meta.url), 'utf8');
      const tutorial = doc.split('## Example: Your First Change')[1];
      const [, unit, delta] = tutorial.match(/\*\*`([^`]+)`\*\* - Delta[^\n]*\r?\n\s*```markdown\r?\n([\s\S]+?)\r?\n```/) ?? [];
      expect(unit).toBeDefined();
      await writeProjectModel(tempDir, minimalModel({ elements: [{
        identity: 'ui', title: 'User Interface', definition: 'Presents settings and application controls.',
      }] }));
      const source = await writeChangeDelta(tempDir, 'add-dark-mode', { [unit]: delta });
      await writeFreshQualityRecord(source);

      await archiveCommand.execute('add-dark-mode', { yes: true, json: true });

      const { archive } = JSON.parse(vi.mocked(console.log).mock.lastCall![0]);
      const formal = path.join(tempDir, '.xirang', 'model', 'elements', 'ui.md');
      await expect(fs.readFile(formal, 'utf8')).resolves.toContain('### Section: Theme Selection');
      await expect(fs.readFile(path.join(tempDir, archive, unit), 'utf8')).resolves.toBe(delta);
    });

    it('rejects an empty Section on an Element declared in the views partition', async () => {
      const source = await writeChangeDelta(tempDir, 'misplaced-section', {
        'views/section.md': MODIFY_EXISTING + '## ADDED Sections\n\n### Section: No text\n',
      });
      const model = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(model);
      await expect(archiveCommand.execute('misplaced-section', { yes: true, quick: true })).rejects.toThrow(/views\/section.md: .*missing Section text/);
      await expect(fs.readFile(model)).resolves.toEqual(before);
      await expect(fs.access(source)).resolves.toBeUndefined();
    });

    it('installs ordinary readable Formal units for all dot-prefixed Delta identities', async () => {
      const added = (unit: string) => '---\noperation: ADDED\n' + unit.slice(4);
      await writeChangeDelta(tempDir, 'dot-identity', {
        'metamodel/.element-kind.md': added(elementKindUnit({ identity: '.element-kind' })),
        'metamodel/.relationship-kind.md': '---\noperation: ADDED\nentity: relationship-kind\nidentity: .relationship-kind\n---\n',
        'elements/.element.md': added(elementUnit({ identity: '.element', kind: '.element-kind' })),
        'relationships/.relationship-kind.yaml': 'relationships:\n  - operation: ADDED\n    source: .element\n    kind: .relationship-kind\n    target: root\n',
        'views/.view.md': '---\noperation: ADDED\nentity: authored-view\nidentity: .view\ninclude: "*"\n---\n',
        'elements/.ignored.md.save.tmp': 'not a Delta unit',
      });
      await archiveCommand.execute('dot-identity', { quick: true, yes: true });
      const { parseSemanticModel } = await import('../../src/core/model/parser.js');
      const { model, diagnostics } = await parseSemanticModel(path.join(tempDir, '.xirang', 'model'));
      expect(diagnostics.filter(item => item.level === 'ERROR')).toEqual([]);
      expect(model.elements.map(element => element.declaration.identity)).toContain('.element');
      expect(model.elementKinds.map(kind => kind.identity)).toContain('.element-kind');
      expect(model.relationshipKinds.map(kind => kind.identity)).toContain('.relationship-kind');
      expect(model.relationships).toContainEqual({ source: '.element', kind: '.relationship-kind', target: 'root' });
      expect(model.views.map(view => view.identity)).toContain('.view');
    });

    it('cannot bootstrap Formal from a valid added root and root Kind', async () => {
      const modelDir = path.join(tempDir, '.xirang', 'model');
      await fs.rm(modelDir, { recursive: true });
      const added = (unit: string) => '---\noperation: ADDED\n' + unit.slice(4);
      const source = await writeChangeDelta(tempDir, 'bootstrap', {
        'metamodel/project.md': added(elementKindUnit({ identity: 'project', root: true })),
        'elements/root.md': added(elementUnit({ identity: 'root', kind: 'project', parent: null })),
      });

      await expect(archiveCommand.execute('bootstrap', { yes: true, quick: true })).rejects.toThrow(/MISSING_FORMAL_MODEL/);
      await expect(fs.access(modelDir)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.access(source)).resolves.toBeUndefined();
    });

    it.each([false, true])('rejects actual destination aliases but preserves distinct paths (simulate case folding=%s)', async simulate => {
      const modelDir = path.join(tempDir, '.xirang', 'model', 'elements');
      const insensitive = await fs.access(path.join(modelDir, 'ROOT.md')).then(() => true, () => false);
      const added = (identity: string) => '---\noperation: ADDED\n' + elementUnit({ identity }).slice(4);
      const source = await writeChangeDelta(tempDir, 'case-paths', {
        'elements/one.md': added('Foo'),
        'elements/two.md': added('foo'),
      });
      const before = (await fs.readdir(modelDir)).sort();
      const lstat = fs.lstat;
      const folded = simulate ? vi.spyOn(fs, 'lstat').mockImplementation(async (file, options) => {
        if (path.dirname(String(file)) === modelDir) {
          const name = (await fs.readdir(modelDir)).find(entry => entry.toLowerCase() === path.basename(String(file)).toLowerCase());
          if (name !== undefined) return lstat(path.join(modelDir, name), options);
        }
        return lstat(file, options);
      }) : undefined;
      try {
        const deliver = archiveCommand.execute('case-paths', { yes: true, quick: true });
        if (insensitive || simulate) {
          await expect(deliver).rejects.toThrow(/collision.*Foo.*foo/i);
          expect((await fs.readdir(modelDir)).sort()).toEqual(before);
          await expect(fs.access(source)).resolves.toBeUndefined();
        } else {
          await deliver;
          await expect(fs.readFile(path.join(modelDir, 'Foo.md'), 'utf8')).resolves.toContain('identity: Foo');
          await expect(fs.readFile(path.join(modelDir, 'foo.md'), 'utf8')).resolves.toContain('identity: foo');
        }
      } finally { folded?.mockRestore(); }
    });

    it.each([false, true])('names both owners of an alias to an existing Formal unit (remove existing=%s)', async removeExisting => {
      const modelDir = path.join(tempDir, '.xirang', 'model', 'elements');
      const formal = path.join(modelDir, 'existing.id.md');
      const before = await fs.readFile(formal);
      const unit = 'elements/new.md';
      const delta = '---\noperation: ADDED\n' + elementUnit({ identity: 'EXISTING.ID' }).slice(4);
      const removed = '---\noperation: REMOVED\nentity: element-declaration\nidentity: existing.id\n---\n';
      const source = await writeChangeDelta(tempDir, 'existing-alias', {
        [unit]: delta, ...(removeExisting ? { 'elements/old.md': removed } : {}),
      });
      const lstat = fs.lstat;
      const folded = vi.spyOn(fs, 'lstat').mockImplementation(async (file, options) => {
        if (path.dirname(String(file)) === modelDir) {
          const name = (await fs.readdir(modelDir)).find(entry => entry.toLowerCase() === path.basename(String(file)).toLowerCase());
          if (name !== undefined) return lstat(path.join(modelDir, name), options);
        }
        return lstat(file, options);
      });
      const read = fs.readFile;
      const readAliased = vi.spyOn(fs, 'readFile').mockImplementation((file, options) =>
        read(String(file) === path.join(modelDir, 'EXISTING.ID.md') ? formal : file, options));
      try {
        await expect(archiveCommand.execute('existing-alias', { yes: true, quick: true })).rejects.toThrow(
          /collision: (?=.*element-declaration EXISTING\.ID at elements\/EXISTING\.ID\.md)(?=.*element-declaration existing\.id at elements\/existing\.id\.md)/,
        );
      } finally {
        readAliased.mockRestore();
        folded.mockRestore();
      }
      await expect(fs.readFile(formal)).resolves.toEqual(before);
      await expect(fs.readFile(path.join(source, unit), 'utf8')).resolves.toBe(delta);
      if (removeExisting) await expect(fs.readFile(path.join(source, 'elements/old.md'), 'utf8')).resolves.toBe(removed);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it('names both Relationship triples when container paths collide despite different owners', async () => {
      await writeProjectModel(tempDir, minimalModel({ elements: [{ identity: 'existing.id' }],
        relationshipKinds: [{ identity: 'first' }, { identity: 'OWNED' }],
      }));
      const directory = path.join(tempDir, '.xirang', 'model', 'relationships');
      const formal = path.join(directory, 'owned.yaml');
      const before = 'relationships:\n  - source: root\n    kind: first\n    target: existing.id\n';
      await fs.writeFile(formal, before);
      const delta = 'relationships:\n  - operation: ADDED\n    source: existing.id\n    kind: OWNED\n    target: root\n';
      const source = await writeChangeDelta(tempDir, 'relationship-alias', { 'relationships/new.yaml': delta });
      const lstat = fs.lstat;
      const folded = vi.spyOn(fs, 'lstat').mockImplementation(async (file, options) => {
        if (path.dirname(String(file)) === directory) {
          const name = (await fs.readdir(directory)).find(entry => entry.toLowerCase() === path.basename(String(file)).toLowerCase());
          if (name !== undefined) return lstat(path.join(directory, name), options);
        }
        return lstat(file, options);
      });
      try {
        await expect(archiveCommand.execute('relationship-alias', { quick: true, yes: true })).rejects.toThrow(
          /collision:(?=.*root -\[first\]-> existing\.id at relationships\/owned\.yaml)(?=.*existing\.id -\[OWNED\]-> root at relationships\/OWNED\.yaml)/,
        );
      } finally { folded.mockRestore(); }
      await expect(fs.readFile(formal, 'utf8')).resolves.toBe(before);
      await expect(fs.readFile(path.join(source, 'relationships/new.yaml'), 'utf8')).resolves.toBe(delta);
    });

    it.each(['ADDED', 'MODIFIED'])('does not rewrite equivalent unordered fields (%s)', async operation => {
      await writeProjectModel(tempDir, minimalModel({
        elements: [{ identity: 'existing.id', title: 'Existing', definition: 'Existing summary' }],
        elementKinds: [{ identity: 'family', parents: ['domain', 'capability'], children: ['domain', 'capability'] }],
        relationshipKinds: [{ identity: 'links', sourceKinds: ['domain', 'capability'], targetKinds: ['domain', 'capability'] }],
        views: [{ identity: 'ordered', include: '[root, existing.id]', exclude: '[root, existing.id]' }],
      }));
      const delta = {
        'metamodel/family.md': `---\noperation: ${operation}\nentity: element-kind\nidentity: family\ncontract: optional\nparents: [capability, domain]\nchildren: [capability, domain]\n---\n`,
        'metamodel/links.md': `---\noperation: ${operation}\nentity: relationship-kind\nidentity: links\nsourceKinds: [capability, domain]\ntargetKinds: [capability, domain]\n---\n`,
        'views/ordered.md': `---\noperation: ${operation}\nentity: authored-view\nidentity: ordered\ninclude: [existing.id, root]\nexclude: [existing.id, root]\n---\n`,
      };
      const formalFiles = Object.keys(delta).map(file => path.join(tempDir, '.xirang/model', file));
      const before = await Promise.all(formalFiles.map(file => fs.readFile(file)));
      const source = await writeChangeDelta(tempDir, 'unordered', delta);

      await archiveCommand.execute('unordered', { yes: true, quick: true });

      expect(await Promise.all(formalFiles.map(file => fs.readFile(file)))).toEqual(before);
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('keeps delivery committed even when publishing the receipt throws', async () => {
      const source = await writeSemanticArchiveFixture('lost-receipt');
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      vi.mocked(console.log).mockImplementationOnce(() => { throw new Error('receipt could not be written'); });

      await expect(archiveCommand.execute('lost-receipt', { yes: true, quick: true, json: true })).rejects.toThrow('receipt could not be written');
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.readFile(modelFile, 'utf8')).resolves.toContain('Changed summary');
      await archiveCommand.execute('lost-receipt', { json: true });
      const receipt = JSON.parse(vi.mocked(console.log).mock.lastCall![0]);
      expect(receipt.alreadyArchived).toBe(true);
      await expect(fs.readFile(path.join(tempDir, receipt.archive, 'elements', 'existing.id.md'), 'utf8')).resolves.toBe(MODIFY_EXISTING);
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

    it.skipIf(process.platform === 'win32').each(['REMOVED', 'MODIFIED'] as const)(
      'preserves restricted Formal permissions on delivery rollback and retry (%s)', async operation => {
        const name = 'restricted-model';
        const unit = 'elements/restricted/existing.id.md';
        const directory = path.join(tempDir, '.xirang', 'model', 'elements', 'restricted');
        const formal = path.join(directory, 'existing.id.md');
        await fs.mkdir(directory, { mode: 0o700 });
        await fs.rename(path.join(path.dirname(directory), 'existing.id.md'), formal);
        await fs.chmod(formal, 0o600);
        const before = await fs.readFile(formal);
        const original = await fs.stat(formal);
        const parent = await fs.stat(directory);
        const delta = operation === 'MODIFIED' ? MODIFY_EXISTING : '---\noperation: REMOVED\nentity: element-declaration\nidentity: existing.id\n---\n';
        const source = await writeChangeDelta(tempDir, name, { [unit]: delta });
        const failure = new Error('cannot capture Change');
        const command = new ArchiveCommand({ rename: async () => {
          if (operation === 'REMOVED') await expect(fs.access(formal)).rejects.toMatchObject({ code: 'ENOENT' });
          else await expect(fs.readFile(formal, 'utf8')).resolves.toContain('Changed summary');
          throw failure;
        } });

        await expect(command.execute(name, { quick: true, yes: true })).rejects.toBe(failure);
        await expect(fs.readFile(formal)).resolves.toEqual(before);
        expect(await fs.stat(formal)).toMatchObject({ mode: original.mode, ino: original.ino });
        expect((await fs.stat(directory)).mode).toBe(parent.mode);
        await expect(fs.readFile(path.join(source, unit), 'utf8')).resolves.toBe(delta);
        await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);

        await archiveCommand.execute(name, { quick: true, yes: true });
        expect((await fs.stat(directory)).mode).toBe(parent.mode);
        if (operation === 'REMOVED') await expect(fs.access(formal)).rejects.toMatchObject({ code: 'ENOENT' });
        else {
          expect((await fs.stat(formal)).mode).toBe(original.mode);
          await expect(fs.readFile(formal, 'utf8')).resolves.toContain('Changed summary');
        }
      },
    );

    it('removes a newly created Formal partition when movement fails', async () => {
      const views = path.join(tempDir, '.xirang', 'model', 'views');
      await fs.rmdir(views);
      const name = 'new-partition-failure';
      const source = await writeChangeDelta(tempDir, name, {
        'views/new.md': '---\noperation: ADDED\nentity: authored-view\nidentity: new\ninclude: "*"\n---\n',
      });
      const command = new ArchiveCommand({ rename: async () => {
        await expect(fs.readFile(path.join(views, 'new.md'), 'utf8')).resolves.toContain('identity: new');
        throw new Error('move failed after writing new partition');
      } });
      await expect(command.execute(name, { quick: true, yes: true })).rejects.toThrow('move failed after writing new partition');
      await expect(fs.access(views)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.access(source)).resolves.toBeUndefined();
    });

    it('preserves unrelated hidden staging files when archive movement fails', async () => {
      await writeSemanticArchiveFixture('staging-collision');
      const modelDir = path.join(tempDir, '.xirang', 'model', 'elements');
      const formal = path.join(modelDir, 'existing.id.md');
      const unrelated = path.join(modelDir, '.existing.id.md.xirang-sync-0.tmp');
      const bytes = Buffer.from([0, 1, 255]);
      await fs.writeFile(unrelated, bytes);
      const before = await fs.readFile(formal);
      const command = new ArchiveCommand({ rename: () => Promise.reject(Object.assign(new Error('move denied'), { code: 'EACCES' })) });

      await expect(command.execute('staging-collision', { quick: true, yes: true })).rejects.toThrow('move denied');
      await expect(fs.readFile(formal)).resolves.toEqual(before);
      await expect(fs.readFile(unrelated)).resolves.toEqual(bytes);
      expect((await fs.readdir(modelDir)).filter(name => name.startsWith('.'))).toEqual([path.basename(unrelated)]);
    });

    it('instructs inspection when the active Change was restored but its partial archive remains', async () => {
      const name = 'restored-active';
      const source = await writeSemanticArchiveFixture(name);
      const dest = path.join(path.dirname(source), 'archive', `${new Date().toISOString().slice(0, 10)}-${name}`);
      const formal = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(formal);
      const command = new ArchiveCommand({
        copyFile: async (from, to, mode) => {
          await fs.copyFile(from, to, mode);
          throw new Error('archive copy failed');
        },
        rm: async (target, options) => {
          if (target === dest) throw new Error('partial destination could not be removed');
          await fs.rm(target, options);
        },
      });
      await expect(command.execute(name, { quick: true, yes: true })).rejects.toThrow(/rollback was incomplete/);
      await expect(fs.readFile(formal)).resolves.toEqual(before);
      await expect(fs.readFile(path.join(source, 'elements/existing.id.md'), 'utf8')).resolves.toBe(MODIFY_EXISTING);
      await expect(fs.access(pendingArchivePath(dest))).resolves.toBeUndefined();

      await expect(archiveCommand.execute(name)).rejects.toThrow(/Archive is incomplete.*inspect the workspace/);
    });

    it('does not treat a partial archive as complete when both compensations fail', async () => {
      const name = 'partial-archive';
      const source = await writeSemanticArchiveFixture(name);
      const dest = path.join(path.dirname(source), 'archive', `${new Date().toISOString().slice(0, 10)}-${name}`);
      const formal = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(formal);
      const command = new ArchiveCommand({
        copyFile: async (from, to, mode) => {
          await fs.copyFile(from, to, mode);
          if (to === path.join(dest, 'tasks.md')) throw new Error('cannot finish installing tasks');
        },
        rename: async (from, to) => {
          if (to === source) throw new Error('cannot restore active directory');
          await fs.rename(from, to);
        },
        rm: async (target, options) => {
          if (target === dest) throw new Error('cannot remove partial archive files');
          await fs.rm(target, options);
        },
      });
      await expect(command.execute(name, { quick: true, yes: true })).rejects.toMatchObject({
        errors: expect.arrayContaining([
          expect.objectContaining({ message: 'cannot finish installing tasks' }),
          expect.objectContaining({ message: 'cannot restore active directory' }),
          expect.objectContaining({ message: 'cannot remove partial archive files' }),
        ]),
      });
      await expect(fs.readFile(formal)).resolves.toEqual(before);
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.readFile(path.join(dest, 'tasks.md'), 'utf8')).resolves.toBe('- [x] complete\n');
      await expect(archiveCommand.execute(name, { quick: true, yes: true })).rejects.toThrow(/Archive is incomplete/);
      expect(console.log).not.toHaveBeenCalled();
    });

    it.each([false, true])('keeps the committed result if private source cleanup fails (abandon=%s)', async abandon => {
      const name = 'cleanup-after-commit';
      const source = await writeSemanticArchiveFixture(name);
      if (!abandon) await writeFreshQualityRecord(source);
      const unit = 'elements/existing.id.md';
      const formal = path.join(tempDir, '.xirang', 'model', unit);
      let retained: string | undefined;
      const command = new ArchiveCommand({ rm: async (target, options) => {
        if (path.basename(String(target)).startsWith('.archive-source-')) {
          retained = String(target);
          throw new Error('source cleanup denied');
        }
        await fs.rm(target, options);
      } });

      await command.execute(name, { abandon, yes: true, json: true });
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ARCHIVE_STAGING_CLEANUP'));
      const { archive } = JSON.parse(vi.mocked(console.log).mock.lastCall![0]);
      await expect(fs.readFile(path.join(tempDir, archive, unit), 'utf8')).resolves.toBe(MODIFY_EXISTING);
      await expect(fs.readFile(path.join(retained!, name, unit), 'utf8')).resolves.toBe(MODIFY_EXISTING);
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.readFile(formal, 'utf8')).resolves.toContain(abandon ? 'Existing summary' : 'Changed summary');
      await archiveCommand.execute(name, { abandon, json: true });
      expect(JSON.parse(vi.mocked(console.log).mock.lastCall![0])).toEqual({ archive, alreadyArchived: true });
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

    it('keeps the winner when a destination appears after the initial existence check', async () => {
      const name = 'occupied-at-install';
      const source = await writeSemanticArchiveFixture(name);
      const archiveDir = path.join(path.dirname(source), 'archive');
      const winner = path.join(archiveDir, `${new Date().toISOString().slice(0, 10)}-${name}`);
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(modelFile);
      const command = new ArchiveCommand({ mkdir: (async directory => {
        expect(directory).toBe(winner);
        await expect(fs.readFile(modelFile)).resolves.toEqual(before);
        await fs.mkdir(winner);
        return fs.mkdir(directory);
      }) as typeof fs.mkdir });

      await expect(command.execute(name, { quick: true, yes: true })).rejects.toThrow(/already exists/);
      await expect(fs.readdir(winner)).resolves.toEqual([]);
      await expect(fs.readFile(modelFile)).resolves.toEqual(before);
      await expect(fs.access(source)).resolves.toBeUndefined();
    });

    it('releases the pending marker and permits same-day retry when destination creation fails', async () => {
      const name = 'reservation-error';
      const source = await writeSemanticArchiveFixture(name);
      const archive = path.join(path.dirname(source), 'archive');
      const formal = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const failure = new Error('destination mkdir denied');
      const command = new ArchiveCommand({ mkdir: async () => { throw failure; } });

      await expect(command.execute(name, { quick: true, yes: true })).rejects.toBe(failure);
      await expect(fs.readdir(archive)).resolves.toEqual([]);
      await expect(fs.readFile(path.join(source, 'elements', 'existing.id.md'), 'utf8')).resolves.toBe(MODIFY_EXISTING);
      await expect(fs.readFile(formal, 'utf8')).resolves.toContain('Existing summary');
      await archiveCommand.execute(name, { quick: true, yes: true });
      await expect(fs.readdir(archive)).resolves.toEqual([`${new Date().toISOString().slice(0, 10)}-${name}`]);
    });

    it.each(['same', 'different', 'abandon'] as const)('isolates the commit window against a concurrent %s archive', async conflict => {
      if (conflict === 'different') await writeSemanticArchiveFixture('other-change');
      const source = await writeSemanticArchiveFixture('contended');
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const rename = fs.rename;
      let releaseWinner!: () => void;
      let reachedWrite!: () => void;
      const barrier = new Promise<void>(resolve => { releaseWinner = resolve; });
      const winnerWriting = new Promise<void>(resolve => { reachedWrite = resolve; });
      let first = true;
      const hook = vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
        if (first && to === modelFile) {
          first = false;
          reachedWrite();
          await barrier;
        }
        return rename(from, to);
      });
      const start = () => new ArchiveCommand().execute('contended', { quick: true, yes: true }).then(() => null, error => error);
      const winner = start();
      try {
        await Promise.race([winnerWriting, winner.then(error => { throw error ?? new Error('expected a pending model write'); })]);
        const result = new ArchiveCommand().execute(conflict === 'different' ? 'other-change' : 'contended',
          conflict === 'abandon' ? { abandon: true, yes: true } : { quick: true, yes: true });
        await expect(result).rejects.toThrow(/already exists|archive is in progress/i);
      } finally {
        releaseWinner();
        await winner;
        hook.mockRestore();
      }
      expect(await winner).toBeNull();
      await expect(fs.readFile(modelFile, 'utf8')).resolves.toContain('Changed summary');
      await expect(fs.access(source)).rejects.toMatchObject({ code: 'ENOENT' });
      const archive = path.join(path.dirname(source), 'archive');
      const [archived] = await fs.readdir(archive);
      await expect(fs.readFile(path.join(archive, archived, 'elements', 'existing.id.md'), 'utf8')).resolves.toBe(MODIFY_EXISTING);
    });

    it('rejects a second claim even if both calls passed the early archive check', async () => {
      const losing = await writeSemanticArchiveFixture('second-claim');
      const winning = await writeSemanticArchiveFixture('first-claim');
      const unit = 'elements/existing.id.md';
      const modelFile = path.join(tempDir, '.xirang', 'model', unit);
      await fs.writeFile(path.join(losing, unit), MODIFY_EXISTING.replace('Changed summary', 'Losing summary'));
      const mkdtemp = fs.mkdtemp;
      const rename = fs.rename;
      let releaseContender!: () => void;
      let reachClaim!: () => void;
      let releaseWinner!: () => void;
      let reachWrite!: () => void;
      const claimPaused = new Promise<void>(resolve => { reachClaim = resolve; });
      const claimBarrier = new Promise<void>(resolve => { releaseContender = resolve; });
      const writePaused = new Promise<void>(resolve => { reachWrite = resolve; });
      const writeBarrier = new Promise<void>(resolve => { releaseWinner = resolve; });
      let holdFirstClaim = true;
      const claims = vi.spyOn(fs, 'mkdtemp').mockImplementation(async (prefix, ...args) => {
        if (holdFirstClaim && path.basename(String(prefix)).startsWith('.archive-lock-')) {
          holdFirstClaim = false;
          reachClaim();
          await claimBarrier;
        }
        return mkdtemp(prefix, ...args);
      });
      const writes = vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
        if (to === modelFile) {
          reachWrite();
          await writeBarrier;
        }
        return rename(from, to);
      });
      const start = (name: string) => new ArchiveCommand().execute(name, { quick: true, yes: true })
        .then(() => null, (error: Error) => error);
      const loser = start('second-claim');
      let winner: ReturnType<typeof start> | undefined;
      try {
        await Promise.race([claimPaused, loser.then(error => { throw error ?? new Error('expected a pending claim'); })]);
        winner = start('first-claim');
        await Promise.race([writePaused, winner.then(error => { throw error ?? new Error('expected a pending write'); })]);
        releaseContender();
        expect(await loser).toMatchObject({ message: expect.stringContaining('An archive is in progress') });
      } finally {
        releaseContender();
        releaseWinner();
        await Promise.all([loser, winner]);
        writes.mockRestore();
        claims.mockRestore();
      }
      expect(await winner).toBeNull();
      await expect(fs.readFile(modelFile, 'utf8')).resolves.toContain('Changed summary');
      await expect(fs.readFile(path.join(losing, unit), 'utf8')).resolves.toContain('Losing summary');
      await expect(fs.access(winning)).rejects.toMatchObject({ code: 'ENOENT' });
      const archive = path.join(path.dirname(winning), 'archive');
      expect(await fs.readdir(archive)).toEqual([`${new Date().toISOString().slice(0, 10)}-first-claim`]);
    });

    it.skipIf(process.platform === 'win32')('does not use a symlink as an Element missing from Formal', async () => {
      const model = path.join(tempDir, '.xirang', 'model', 'elements');
      const outside = path.join(tempDir, 'not-formal.md');
      await fs.writeFile(outside, elementUnit({ identity: 'link-parent' }));
      const alias = path.join(model, 'link-parent.md');
      await fs.symlink(outside, alias);
      const source = await writeChangeDelta(tempDir, 'link-model', {
        'elements/child.md': '---\noperation: ADDED\n' + elementUnit({ identity: 'child', parent: 'link-parent' }).slice(4),
      });
      await expect(archiveCommand.execute('link-model', { quick: true, yes: true })).rejects.toThrow(/link-parent/);
      await expect(fs.access(path.join(model, 'child.md'))).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.readlink(alias)).resolves.toBe(outside);
      await expect(fs.access(source)).resolves.toBeUndefined();
    });

    it.skipIf(process.platform === 'win32')('does not replace a dangling link at an added model pathname', async () => {
      const outside = path.join(tempDir, 'missing.md');
      const alias = path.join(tempDir, '.xirang', 'model', 'elements', 'child.md');
      await fs.symlink(outside, alias);
      const source = await writeChangeDelta(tempDir, 'link-destination', {
        'elements/child.md': '---\noperation: ADDED\n' + elementUnit({ identity: 'child' }).slice(4),
      });
      await expect(archiveCommand.execute('link-destination', { quick: true, yes: true })).rejects.toThrow(/target path collision.*child.md/i);
      await expect(fs.readlink(alias)).resolves.toBe(outside);
      await expect(fs.access(source)).resolves.toBeUndefined();
    });

    it('archives without a warning or confirmation when tasks.md is missing', async () => {
      const changeName = 'no-tasks-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await writeFreshQualityRecord(changeDir);
      const { confirm } = await import('@inquirer/prompts');

      await archiveCommand.execute(changeName);
      expect(confirm).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('incomplete goal(s)'));
      await expect(fs.access(changeDir)).rejects.toMatchObject({ code: 'ENOENT' });
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      expect(await fs.readdir(archiveDir)).toHaveLength(1);
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
      const changeDir = await writeSemanticArchiveFixture(changeName);
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(modelFile);
      
      const tasksContent = '## Goals\n\n- [ ] G1: Pending goal\n  - Contract: `feature` / Section "Core behavior"\n  - Verify: The pending behavior is observable.';
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);
      
      mockConfirm.mockImplementationOnce(async () => {
        await expect(fs.readFile(modelFile)).resolves.toEqual(before);
        return false;
      });
      await archiveCommand.execute(changeName, { quick: true });
      await expect(fs.readFile(modelFile)).resolves.toEqual(before);
      expect(console.error).toHaveBeenCalledWith('Archive cancelled.');
      // Verify change was not archived
      await expect(fs.access(changeDir)).resolves.not.toThrow();
    });

    it('does not probe Formal case sensitivity before confirmation', async () => {
      const name = 'no-probe-before-confirmation';
      const source = await writeChangeDelta(tempDir, name, {
        'elements/one.md': '---\noperation: ADDED\n' + elementUnit({ identity: 'Foo' }).slice(4),
        'elements/two.md': '---\noperation: ADDED\n' + elementUnit({ identity: 'foo' }).slice(4),
      });
      await fs.writeFile(path.join(source, 'tasks.md'), '## Goals\n- [ ] G1: Pending\n');
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockResolvedValueOnce(false);
      const createTemporary = vi.spyOn(fs, 'mkdtemp');
      try {
        await archiveCommand.execute(name, { quick: true });
        expect(confirm).toHaveBeenCalledOnce();
        expect(createTemporary).not.toHaveBeenCalled();
      } finally { createTemporary.mockRestore(); }
      await expect(fs.access(source)).resolves.toBeUndefined();
    });

    it('keeps the model and active Change when confirmation changes the Delta', async () => {
      const source = await writeSemanticArchiveFixture('confirmation-drift');
      const deltaFile = path.join(source, 'elements', 'existing.id.md');
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(modelFile);
      const duringPrompt = MODIFY_EXISTING.replace('Changed summary', 'New intent');
      await fs.writeFile(path.join(source, 'tasks.md'), '## Goals\n- [ ] G1: Pending\n');
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockImplementationOnce(() => Object.assign(fs.writeFile(deltaFile, duringPrompt).then(() => true), { cancel: () => {} }));

      await expect(archiveCommand.execute('confirmation-drift', { quick: true })).rejects.toThrow(/Semantic Delta changed/);
      await expect(fs.readFile(modelFile)).resolves.toEqual(before);
      await expect(fs.readFile(deltaFile, 'utf8')).resolves.toBe(duringPrompt);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it('rejects a rewritten Delta whose bytes would hide the loss of a file boundary', async () => {
      const name = 'delta-file-boundary';
      const first = 'elements/first.md';
      const second = 'elements/second.md';
      const added = '---\noperation: ADDED\n' + elementUnit({ identity: 'added' }).slice(4);
      const source = await writeChangeDelta(tempDir, name, { [first]: MODIFY_EXISTING, [second]: added });
      await fs.writeFile(path.join(source, 'tasks.md'), '## Goals\n- [ ] G1: Pending\n');
      const existing = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(existing);
      const substituted = Buffer.from(`${MODIFY_EXISTING}\0${second}\0${added}`);
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockImplementationOnce(() => Object.assign((async () => {
        await fs.writeFile(path.join(source, first), substituted);
        await fs.unlink(path.join(source, second));
        return true;
      })(), { cancel: () => {} }));

      await expect(archiveCommand.execute(name, { quick: true })).rejects.toThrow(/Semantic Delta changed/);
      await expect(fs.readFile(existing)).resolves.toEqual(before);
      await expect(fs.readFile(path.join(source, first))).resolves.toEqual(substituted);
      await expect(fs.access(path.join(source, second))).rejects.toMatchObject({ code: 'ENOENT' });
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
    });

    it('rejects a Seal revoked during task confirmation before writing Formal', async () => {
      const name = 'revoked-seal';
      const source = await writeSemanticArchiveFixture(name);
      await fs.writeFile(path.join(source, 'tasks.md'), '## Goals\n- [ ] G1: Pending\n');
      await writeFreshQualityRecord(source);
      const modelFile = path.join(tempDir, '.xirang', 'model', 'elements', 'existing.id.md');
      const before = await fs.readFile(modelFile);
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockImplementationOnce(() => Object.assign(revokeSeal(source).then(() => true), { cancel: () => {} }));
      const formalWrite = vi.spyOn(fs, 'rename');
      try {
        await expect(archiveCommand.execute(name)).rejects.toThrow(/valid Seal[\s\S]*Return to Apply/);
        expect(formalWrite.mock.calls.some(([, destination]) => destination === modelFile)).toBe(false);
      } finally { formalWrite.mockRestore(); }
      await expect(fs.readFile(modelFile)).resolves.toEqual(before);
      await expect(fs.readdir(path.join(path.dirname(source), 'archive'))).resolves.toEqual([]);
      expect((await readQualityRecord(source)).seal).toBeNull();
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
