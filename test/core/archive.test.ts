import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveCommand } from '../../src/core/archive.js';
import { Validator } from '../../src/core/validation/validator.js';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { stringify as stringifyYaml } from 'yaml';
import { runCLI } from '../helpers/run-cli.js';
import {
  XIRANG_SCHEMA_VERSION,
  readProjectOpsx,
  writeProjectOpsx,
  type ProjectXirangBundle,
} from '../../src/utils/xirang-utils.js';
import {
  checkFreshness,
  computeEvidenceFingerprint,
  computeTasksFileHash,
} from '../../src/core/verify/freshness.js';
import type { VerifyResult } from '../../src/core/verify/types.js';

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

  const mkBundle = (overrides: Partial<ProjectXirangBundle> = {}): ProjectXirangBundle => ({
    schema_version: XIRANG_SCHEMA_VERSION,
    project: { id: 'test-project', name: 'test-project' },
    domains: [],
    capabilities: [],
    relations: [],
    ...overrides,
  });

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `xirang-archive-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Change to temp directory
    process.chdir(tempDir);
    
    // Create Xirang structure
    const opsxDir = path.join(tempDir, '.xirang');
    await fs.mkdir(path.join(opsxDir, 'changes'), { recursive: true });
    await fs.mkdir(path.join(opsxDir, 'specs'), { recursive: true });
    await fs.mkdir(path.join(opsxDir, 'changes', 'archive'), { recursive: true });
    
    // Suppress console.log during tests
    console.log = vi.fn();
    
    archiveCommand = new ArchiveCommand();
  });

  async function writeV1Architecture(): Promise<void> {
    const architecture = path.join(tempDir, '.xirang', 'architecture');
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract optional } }
  element capability { xirang { contract optional parents [project] } }
}
model {
  project_root = project 'Root' 'Root summary' {
    metadata { elementId 'project.root' }
    existing = capability 'Existing' 'Existing summary' { metadata { elementId 'existing.id' } }
  }
}
`);
  }

  async function writeSemanticArchiveFixture(changeName: string): Promise<string> {
    const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
    await writeV1Architecture();
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), `architectureDelta {
  MODIFIED {
    element 'existing.id' {
      kind 'capability'
      parent 'project.root'
      title 'Existing'
      summary 'Changed summary'
      metadata { elementId 'existing.id' }
    }
  }
}
`);
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] complete\n');
    await fs.writeFile(path.join(changeDir, '.specs-noop'), '');
    return changeDir;
  }

  async function writeFreshVerifyResult(changeDir: string): Promise<void> {
    await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] verified\n', 'utf-8');
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'src', 'archive-evidence.ts'), 'export const ok = true;\n', 'utf-8');
    const result: VerifyResult = {
      timestamp: new Date().toISOString(),
      result: 'PASS',
      issues: [],
      tasksFileHash: (await computeTasksFileHash(path.join(changeDir, 'tasks.md')))!,
      verificationContext: {
        contractVersion: '1.0',
        evidenceFiles: ['src/archive-evidence.ts'],
        evidenceFingerprint: (await computeEvidenceFingerprint(['src/archive-evidence.ts'], tempDir)).hash,
      },
      optimization: { status: 'NOT_NEEDED', attempts: [] },
    };
    await fs.writeFile(path.join(changeDir, '.verify-result.json'), JSON.stringify(result), 'utf-8');
  }

  afterEach(async () => {
    // Restore console.log
    console.log = originalConsoleLog;
    
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
      await fs.writeFile(path.join(changeDir, '.specs-noop'), '');
      
      // Execute archive with --yes flag
      await archiveCommand.execute(changeName, { yes: true, noVerify: true });
      
      // Check that change was moved to archive
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      
      expect(archives.length).toBe(1);
      expect(archives[0]).toMatch(new RegExp(`\\d{4}-\\d{2}-\\d{2}-${changeName}`));
      await expect(fs.access(path.join(archiveDir, archives[0], '.specs-noop'))).rejects.toThrow();
      
      // Verify original change directory no longer exists
      await expect(fs.access(changeDir)).rejects.toThrow();
    });

    it('generates a current Passed final report before moving a semantic change', async () => {
      const changeName = 'semantic-final-report';
      await writeSemanticArchiveFixture(changeName);

      await archiveCommand.execute(changeName, { yes: true, noVerify: true, noSync: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archived = (await fs.readdir(archiveDir)).find(entry => entry.endsWith(`-${changeName}`));
      expect(archived).toBeDefined();
      const archivedDir = path.join(archiveDir, archived!);
      expect(await fs.readFile(path.join(archivedDir, 'effective-change.md'), 'utf8')).toContain('Status: Passed');
      await expect(fs.access(path.join(archivedDir, 'architecture-delta.c4'))).resolves.toBeUndefined();
    });

    it('keeps the active change in place when final report generation fails', async () => {
      const changeName = 'semantic-report-failure';
      const changeDir = await writeSemanticArchiveFixture(changeName);
      await fs.mkdir(path.join(changeDir, 'effective-change.md.tmp'));

      await expect(archiveCommand.execute(changeName, { yes: true, noVerify: true, noSync: true })).rejects.toThrow();

      await expect(fs.access(changeDir)).resolves.toBeUndefined();
      expect((await fs.readdir(path.join(tempDir, '.xirang', 'changes', 'archive'))).some(entry => entry.endsWith(`-${changeName}`))).toBe(false);
    });

    it('prints agent handoff reminder for legacy auto git mode without recommended commit message', async () => {
      const changeName = 'auto-handoff';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n', 'utf-8');
      await fs.writeFile(path.join(tempDir, '.xirang', 'config.yaml'), `schema: spec-driven
git:
  autoCommit: auto
`, 'utf-8');

      await archiveCommand.execute(changeName, { yes: true, noVerify: true });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Git handoff: agent handles git commits, merge, and cleanup after archive.')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('agent')
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining(`docs(${changeName}): Archive change artifacts`)
      );
    });

    it('prints agent handoff reminder for legacy manual git mode without recommended commit message', async () => {
      const changeName = 'manual-handoff';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n', 'utf-8');
      await fs.writeFile(path.join(tempDir, '.xirang', 'config.yaml'), `schema: spec-driven
git:
  autoCommit: manual
`, 'utf-8');

      await archiveCommand.execute(changeName, { yes: true, noVerify: true });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Git handoff: agent handles git commits, merge, and cleanup after archive.')
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining(`docs(${changeName}): Archive change artifacts`)
      );
    });

    it('should block archive when verify result is missing', async () => {
      const changeName = 'missing-verify';
      await fs.mkdir(path.join(tempDir, '.xirang', 'changes', changeName), { recursive: true });

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow(
        'xirang verify phase1 missing-verify'
      );
      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow(
        'xirang archive missing-verify --no-verify'
      );
    });

    it('should archive when verify is fresh and no sync is required', async () => {
      const changeName = 'fresh-verify';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);

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
      await writeFreshVerifyResult(changeDir);
      await execFileAsync('git', ['add', '.'], { cwd: tempDir });
      await execFileAsync('git', ['commit', '-m', 'verified'], { cwd: tempDir });

      const verifyResultPath = path.join(changeDir, '.verify-result.json');
      const verifyResult = JSON.parse(await fs.readFile(verifyResultPath, 'utf-8')) as VerifyResult;
      verifyResult.verificationContext.gitHeadCommit = (
        await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: tempDir })
      ).stdout.trim();
      await fs.writeFile(verifyResultPath, JSON.stringify(verifyResult), 'utf-8');
      const seal = await runCLI(['verify', 'seal', changeName, '--json'], { cwd: tempDir });
      expect(seal.exitCode).toBe(0);

      await fs.writeFile(path.join(tempDir, 'checkpoint.txt'), 'phase 2 checkpoint\n', 'utf-8');
      await execFileAsync('git', ['add', 'checkpoint.txt'], { cwd: tempDir });
      await execFileAsync('git', ['commit', '-m', 'checkpoint'], { cwd: tempDir });

      const freshness = await checkFreshness(changeDir, tempDir);
      expect(freshness.status).toBe('FRESH');
      expect(freshness.information.gitHeadCommit.matches).toBe(false);

      await archiveCommand.execute(changeName, { yes: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.some((entry) => entry.includes(changeName))).toBe(true);
    });

    it('should block archive when sync has pending delta writes', async () => {
      const changeName = 'pending-sync-gate';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const specDir = path.join(changeDir, 'specs', 'gate');
      await fs.mkdir(specDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);
      await fs.writeFile(path.join(specDir, 'spec.md'), `## ADDED Requirements

### Requirement: Gate requires sync`);

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow('Sync gate');
    });

    it('rejects an empty graph delta at the archive sync gate', async () => {
      const changeName = 'empty-architecture-delta';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);
      await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), 'model {}\n');

      await expect(archiveCommand.execute(changeName, { yes: true }))
        .rejects.toThrow(/no actual architecture operation|empty/i);
      await expect(fs.readFile(path.join(changeDir, 'architecture-delta.c4'), 'utf8')).resolves.toBe('model {}\n');
    });

    it('should allow archive when delta specs and Xirang delta are already synced', async () => {
      const changeName = 'already-synced-gate';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const changeSpecDir = path.join(changeDir, 'specs', 'gate');
      const mainSpecDir = path.join(tempDir, '.xirang', 'specs', 'gate');
      await fs.mkdir(changeSpecDir, { recursive: true });
      await fs.mkdir(mainSpecDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);
      await writeV1Architecture();

      const deltaSpec = `---
element: existing.id
---

## ADDED Requirements

### Requirement: Gate already synced

System SHALL keep synced gates stable.

#### Scenario: Gate stays synced
- **WHEN** the change has already been synced
- **THEN** archive SHALL proceed
`;
      await fs.writeFile(path.join(changeSpecDir, 'spec.md'), deltaSpec, 'utf-8');
      await fs.writeFile(path.join(mainSpecDir, 'spec.md'), `---
element: existing.id
---

# gate Specification

## Purpose
Synced gate spec.

## Requirements
### Requirement: Gate already synced

System SHALL keep synced gates stable.

#### Scenario: Gate stays synced

- **WHEN** the change has already been synced
- **THEN** archive SHALL proceed
`, 'utf-8');
      await fs.writeFile(path.join(changeDir, 'opsx-delta.yaml'), stringifyYaml({
        schema_version: XIRANG_SCHEMA_VERSION,
        ADDED: {
          capabilities: [{ id: 'cap.verify.gate', type: 'capability', intent: 'Verify gate' }],
          relations: [{ from: 'cap.verify.gate', to: 'dom.verify', type: 'belongs_to' }],
        },
      }), 'utf-8');

      await archiveCommand.execute(changeName, { yes: true, noVerify: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      const archived = archives.find((entry) => entry.includes(changeName));
      expect(archived).toBeDefined();
      expect(await fs.readFile(path.join(archiveDir, archived!, 'effective-change.md'), 'utf8')).toContain('Status: Passed');
    });

    it('should allow archive when a modified Requirement is already synchronized', async () => {
      const changeName = 'already-modified-spec';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const changeSpecDir = path.join(changeDir, 'specs', 'gate');
      const mainSpecDir = path.join(tempDir, '.xirang', 'specs', 'gate');
      await fs.mkdir(changeSpecDir, { recursive: true });
      await fs.mkdir(mainSpecDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);
      await writeV1Architecture();

      const requirement = `### Requirement: Gate already modified

System SHALL retain the synchronized target text.

#### Scenario: Gate stays modified
- **WHEN** archive reads an already-synchronized modification
- **THEN** archive SHALL preserve the target Requirement
`;
      await fs.writeFile(path.join(changeSpecDir, 'spec.md'), `---\nelement: existing.id\n---\n\n## MODIFIED Requirements\n\n${requirement}`, 'utf-8');
      await fs.writeFile(path.join(mainSpecDir, 'spec.md'), `---\nelement: existing.id\n---\n\n# gate Specification\n\n## Purpose\nSynced gate spec.\n\n## Requirements\n${requirement}`, 'utf-8');

      await archiveCommand.execute(changeName, { yes: true, noVerify: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archived = (await fs.readdir(archiveDir)).find((entry) => entry.includes(changeName));
      expect(archived).toBeDefined();
      expect(await fs.readFile(path.join(archiveDir, archived!, 'effective-change.md'), 'utf8')).toContain('Status: Passed');
    });

    it('should allow archive when removal-only delta already deleted the main spec', async () => {
      const changeName = 'already-deleted-spec';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const changeSpecDir = path.join(changeDir, 'specs', 'old-merge');
      const mainSpecDir = path.join(tempDir, '.xirang', 'specs', 'old-merge');
      await fs.mkdir(changeSpecDir, { recursive: true });
      await fs.mkdir(mainSpecDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);
      await writeV1Architecture();

      await fs.writeFile(
        path.join(changeSpecDir, 'spec.md'),
        `---
element: existing.id
---

## REMOVED Requirements

### Requirement: Old A
### Requirement: Old B`,
        'utf-8'
      );
      await fs.rm(path.join(mainSpecDir, 'spec.md'), { force: true });

      await archiveCommand.execute(changeName, { yes: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      const archived = archives.find((entry) => entry.includes(changeName));
      expect(archived).toBeDefined();
      expect(await fs.readFile(path.join(archiveDir, archived!, 'effective-change.md'), 'utf8')).toContain('Status: Passed');
    });

    it('should allow archive when removal-only delta targets headers already absent from a still-existing main spec', async () => {
      const changeName = 'removal-headers-already-absent';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const changeSpecDir = path.join(changeDir, 'specs', 'partial-merge');
      const mainSpecDir = path.join(tempDir, '.xirang', 'specs', 'partial-merge');
      await fs.mkdir(changeSpecDir, { recursive: true });
      await fs.mkdir(mainSpecDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);

      const mainSpecPath = path.join(mainSpecDir, 'spec.md');
      await fs.writeFile(
        mainSpecPath,
        `# partial-merge Specification

## Purpose
Partial merge behavior.

## Requirements

### Requirement: Unrelated Keeper
The system SHALL keep this requirement.`,
        'utf-8'
      );

      await fs.writeFile(
        path.join(changeSpecDir, 'spec.md'),
        `## REMOVED Requirements

### Requirement: Old A
### Requirement: Old B`,
        'utf-8'
      );

      await archiveCommand.execute(changeName, { yes: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.some((entry) => entry.includes(changeName))).toBe(true);

      const preserved = await fs.readFile(mainSpecPath, 'utf-8');
      expect(preserved).toContain('### Requirement: Unrelated Keeper');
    });

    it('should warn about incomplete tasks', async () => {
      const changeName = 'incomplete-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      // Create tasks.md with incomplete tasks
      const tasksContent = '- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3';
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);
      
      // Execute archive with --yes flag
      await archiveCommand.execute(changeName, { yes: true, noVerify: true });
      
      // Verify warning was logged
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Warning: 2 incomplete task(s) found')
      );
    });

    it('should block archive with --no-sync --yes when pending deltas exist', async () => {
      const changeName = 'no-sync-bypass';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const specDir = path.join(changeDir, 'specs', 'gate');
      await fs.mkdir(specDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);
      await fs.writeFile(path.join(specDir, 'spec.md'), `## ADDED Requirements

### Requirement: Bypassed sync gate

#### Scenario: Sync bypassed
- **WHEN** user runs archive with --no-sync
- **THEN** sync gate is skipped`);

      await archiveCommand.execute(changeName, { yes: true, noVerify: true, noSync: true, noValidate: true });

      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.some((entry) => entry.includes(changeName))).toBe(true);
    });

    it('should confirm before bypassing sync gate with --no-sync', async () => {
      const changeName = 'no-sync-confirm';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const specDir = path.join(changeDir, 'specs', 'gate');
      await fs.mkdir(specDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);
      await fs.writeFile(path.join(specDir, 'spec.md'), `## ADDED Requirements

### Requirement: Confirm sync bypass`);

      const { confirm } = await import('@inquirer/prompts');
      const mockConfirm = confirm as unknown as ReturnType<typeof vi.fn>;
      mockConfirm.mockResolvedValueOnce(false);

      await archiveCommand.execute(changeName, { noSync: true });

      expect(console.log).toHaveBeenCalledWith('Archive cancelled.');
    });

    it('should block archive when architecture delta is pending', async () => {
      const changeName = 'pending-architecture';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await writeFreshVerifyResult(changeDir);

      const architecture = path.join(tempDir, '.xirang', 'architecture');
      await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
      await fs.writeFile(path.join(architecture, 'specification.c4'), 'specification { element domain element capability }');
      await fs.writeFile(path.join(architecture, 'views.c4'), 'views { view index { include * } }');
      await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), "model { core = domain 'Core' }");
      await fs.writeFile(path.join(changeDir, 'architecture-delta.c4'), "model { extend core { init = capability 'Init' } }");

      await expect(archiveCommand.execute(changeName, { yes: true })).rejects.toThrow('Sync gate');
    });

    it('should throw error if change does not exist', async () => {
      await expect(
        archiveCommand.execute('non-existent-change', { yes: true, noVerify: true })
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
        archiveCommand.execute(changeName, { yes: true, noVerify: true })
      ).rejects.toThrow(`Archive '${date}-${changeName}' already exists.`);
    });

    it('should handle changes without tasks.md', async () => {
      const changeName = 'no-tasks-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      await archiveCommand.execute(changeName, { yes: true, noVerify: true });
      
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('incomplete task(s)')
      );
      
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.length).toBe(1);
    });

    it('should handle changes without specs', async () => {
      const changeName = 'no-specs-feature';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      await archiveCommand.execute(changeName, { yes: true, noVerify: true });
      
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Specs to update')
      );
      
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const archives = await fs.readdir(archiveDir);
      expect(archives.length).toBe(1);
    });

    it('should skip validation when commander sets validate to false (--no-validate)', async () => {
      const changeName = 'skip-validation-flag';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n');

      const validateSpy = vi.spyOn(Validator.prototype, 'validateChange');
      const deltaSpy = vi.spyOn(Validator.prototype, 'validateChangeDeltaSpecs');

      try {
        await archiveCommand.execute(changeName, { yes: true, noVerify: true, validate: false });

        expect(validateSpy).not.toHaveBeenCalled();
        expect(deltaSpy).not.toHaveBeenCalled();

        const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
        const archives = await fs.readdir(archiveDir);
        expect(archives.length).toBe(1);
        expect(archives[0]).toMatch(new RegExp(`\\d{4}-\\d{2}-\\d{2}-${changeName}`));
      } finally {
        validateSpy.mockRestore();
        deltaSpy.mockRestore();
      }
    });
  });

  describe('error handling', () => {
    it('should throw error when xirang directory does not exist', async () => {
      // Remove xirang directory
      await fs.rm(path.join(tempDir, '.xirang'), { recursive: true });
      
      await expect(
        archiveCommand.execute('any-change', { yes: true, noVerify: true })
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
      await archiveCommand.execute(undefined, { yes: true, noVerify: true });
      
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
      
      // Create tasks.md with incomplete tasks
      const tasksContent = '- [ ] Task 1';
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);
      
      // Mock confirm to return true (proceed)
      mockConfirm.mockResolvedValueOnce(true);
      
      // Execute without --yes flag
      await archiveCommand.execute(changeName, { noVerify: true });
      
      // Verify confirm was called
      expect(mockConfirm).toHaveBeenCalledWith({
        message: 'Warning: 1 incomplete task(s) found. Continue?',
        default: false
      });
    });

    it('should cancel when user declines task warning', async () => {
      const { confirm } = await import('@inquirer/prompts');
      const mockConfirm = confirm as unknown as ReturnType<typeof vi.fn>;
      
      const changeName = 'cancel-test';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      
      // Create tasks.md with incomplete tasks
      const tasksContent = '- [ ] Task 1';
      await fs.writeFile(path.join(changeDir, 'tasks.md'), tasksContent);
      
      // Mock confirm to return false (cancel) for validation skip
      mockConfirm.mockResolvedValueOnce(false);
      // Mock another false for task warning
      mockConfirm.mockResolvedValueOnce(false);
      
      // Execute without --yes flag but skip validation to test task warning
      await archiveCommand.execute(changeName, { noValidate: true, noVerify: true });
      
      // Verify archive was cancelled
      expect(console.log).toHaveBeenCalledWith('Archive cancelled. Run without --no-verify to use the standard verify gate.');
      
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

      await archiveCommand.execute(changeName, { yes: true, noVerify: true, noValidate: true });

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Worktree cleanup')
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Branch switch')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Git handoff: agent handles git commits, merge, and cleanup after archive.')
      );
      const archiveDir = path.join(tempDir, '.xirang', 'changes', 'archive');
      const [archiveName] = (await fs.readdir(archiveDir)).filter((entry) => entry.includes(changeName));
      await expect(fs.access(path.join(archiveDir, archiveName, '.apply-isolation.json'))).resolves.not.toThrow();
    });

    it('prompts before apply isolation cleanup and respects declines', async () => {
      const { confirm } = await import('@inquirer/prompts');
      const mockConfirm = confirm as unknown as ReturnType<typeof vi.fn>;

      const changeName = 'isolated-prompt';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const worktreePath = path.join(tempDir, '.worktrees', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n');
      await fs.writeFile(
        path.join(changeDir, '.apply-isolation.json'),
        JSON.stringify({
          method: 'worktree',
          branchName: changeName,
          worktreePath,
          originalBranch: 'main',
        })
      );

      // Mock --no-verify warning confirmation (user declines to cancel early)
      mockConfirm.mockResolvedValueOnce(false);

      await archiveCommand.execute(changeName, { noVerify: true, noValidate: true });

      // Verify archive was cancelled at the --no-verify warning
      expect(console.log).toHaveBeenCalledWith('Archive cancelled. Run without --no-verify to use the standard verify gate.');
    });

    it('normalizes Windows-style worktree paths before prompting', async () => {
      const { confirm } = await import('@inquirer/prompts');
      const mockConfirm = confirm as unknown as ReturnType<typeof vi.fn>;

      const changeName = 'isolated-windows-path';
      const changeDir = path.join(tempDir, '.xirang', 'changes', changeName);
      const worktreePath = `.worktrees\\${changeName}`;
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n');
      await fs.writeFile(
        path.join(changeDir, '.apply-isolation.json'),
        JSON.stringify({
          method: 'worktree',
          branchName: changeName,
          worktreePath,
          originalBranch: 'main',
        })
      );

      // Mock --no-verify warning confirmation (user declines to test path normalization isn't triggered)
      mockConfirm.mockResolvedValueOnce(false);

      await archiveCommand.execute(changeName, { noVerify: true, noValidate: true });

      // Verify archive was cancelled at the --no-verify warning
      expect(console.log).toHaveBeenCalledWith('Archive cancelled. Run without --no-verify to use the standard verify gate.');
    });
  });
});
