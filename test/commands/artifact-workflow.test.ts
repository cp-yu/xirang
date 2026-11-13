import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runCLI } from '../helpers/run-cli.js';
import { createBaselineOnlyQualityFixture, createCompleteQualityFixture } from '../helpers/quality-fixture.js';

describe('artifact-workflow CLI commands', () => {
  let tempDir: string;
  let changesDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-artifact-workflow-'));
    changesDir = path.join(tempDir, '.xirang', 'changes');
    await fs.mkdir(changesDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Gets combined output from CLI result (ora outputs to stdout).
   */
  function getOutput(result: { stdout: string; stderr: string }): string {
    return result.stdout + result.stderr;
  }

  /**
   * Creates a test change with the specified artifacts completed.
   * Note: An "active" change requires at least a proposal.md file to be detected.
   * If no artifacts are specified, we create an empty proposal to make it detectable.
   */
  async function createTestChange(
    changeName: string,
    artifacts: ('proposal' | 'design' | 'semantic-delta' | 'tasks')[] = []
  ): Promise<string> {
    const changeDir = path.join(changesDir, changeName);
    await fs.mkdir(changeDir, { recursive: true });

    // Always create proposal.md for the change to be detected as active
    // Content varies based on whether 'proposal' is in artifacts list
    const proposalContent = artifacts.includes('proposal')
      ? '## Why\nTest proposal content that is long enough.\n\n## What Changes\n- **test:** Something'
      : '## Why\nMinimal proposal.\n\n## What Changes\n- **test:** Placeholder';
    await fs.writeFile(path.join(changeDir, 'proposal.md'), proposalContent);

    if (artifacts.includes('design')) {
      await fs.writeFile(path.join(changeDir, 'design.md'), '# Design\n\nTechnical design.');
    }

    if (artifacts.includes('semantic-delta')) {
      const elementsDir = path.join(changeDir, 'elements');
      await fs.mkdir(elementsDir, { recursive: true });
      await fs.writeFile(path.join(elementsDir, 'test-element.md'), `## ADDED Sections

### Section: Propose smart routing

#### Acceptance Case: 复用 Design Summary

### Section: Master agent 必须拆解粗粒度任务为 TDD 步骤

#### Acceptance Case: 读取粗粒度任务

### Section: Apply Phase 0 pending Checks

#### Acceptance Case: 拆解为可执行工作
`);
    }

    if (artifacts.includes('tasks')) {
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '## Goals\n\n- [ ] G1: Complete the implementation goal\n  - Contract: `test-element` / Section "Implementation goal"\n  - Verify: Expected behavior is observable.');
    }


    return changeDir;
  }


  describe('status command', () => {
it('outputs needs_optimize state in JSON when the optimization loop is not finalized', async () => {
      const changeDir = await createTestChange('needs-seal-apply', [
        'proposal',
        'design',
        'semantic-delta',
        'tasks',
      ]);
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '## Goals\n\n- [x] G1: Completed target\n  - Contract: `test-element` / Section "Target"\n  - Verify: Observable behavior is complete.');
      await createBaselineOnlyQualityFixture(tempDir, changeDir);

      const result = await runCLI(
        ['status', '--change', 'needs-seal-apply', '--json'],
        { cwd: tempDir }
      );
      expect(result.exitCode).toBe(0);

      const json = JSON.parse(result.stdout);
      expect(json.state).toBe('needs_optimize');
    });

it('reports needs_review after rotation even when history holds a matching pass', async () => {
      const changeDir = await createTestChange('rotated-apply', [
        'proposal',
        'design',
        'semantic-delta',
        'tasks',
      ]);
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '## Goals\n\n- [x] G1: First completed goal\n  - Contract: `test-element` / Section "First goal"\n  - Verify: Behavior is complete.\n- [x] G2: Second completed goal\n  - Contract: `test-element` / Section "Second goal"\n  - Verify: Behavior is complete.');
      await createCompleteQualityFixture(tempDir, changeDir);

      const historyDir = path.join(changeDir, '.quality-history', '20260101T000000000Z-rotation');
      await fs.mkdir(historyDir, { recursive: true });
      for (const file of ['.quality.json']) {
        await fs.rename(path.join(changeDir, file), path.join(historyDir, file));
      }

      const result = await runCLI(['status', '--change', 'rotated-apply', '--json'], {
        cwd: tempDir,
      });
      expect(result.exitCode).toBe(0);

      const json = JSON.parse(result.stdout);
      expect(json.state).toBe('needs_review');
    });

it('outputs all_done state in JSON when the quality record is clean and archive-compatible', async () => {
      const changeDir = await createTestChange('all-done-apply', [
        'proposal',
        'design',
        'semantic-delta',
        'tasks',
      ]);
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '## Goals\n\n- [x] G1: First completed goal\n  - Contract: `test-element` / Section "First goal"\n  - Verify: Behavior is complete.\n- [x] G2: Second completed goal\n  - Contract: `test-element` / Section "Second goal"\n  - Verify: Behavior is complete.');
      await createCompleteQualityFixture(tempDir, changeDir);

      const result = await runCLI(
        ['status', '--change', 'all-done-apply', '--json'],
        { cwd: tempDir }
      );
      expect(result.exitCode).toBe(0);

      const json = JSON.parse(result.stdout);
      expect(json.state).toBe('all_done');
    });
    it('reports goal counts and Quality state without echoing goals', async () => {
      const dir = await createTestChange('goal-state', ['proposal', 'design', 'semantic-delta', 'tasks']);
      let result = await runCLI(['status', '--change', 'goal-state', '--json'], { cwd: tempDir });
      let data = JSON.parse(result.stdout);
      expect(data).toMatchObject({ state: 'ready', goals: { total: 1, completed: 0, remaining: 1 } });
      expect(result.stdout).not.toContain('Complete the implementation goal');
      const tasks = path.join(dir, 'tasks.md');
      await fs.writeFile(tasks, (await fs.readFile(tasks, 'utf8')).replace('[ ]', '[x]'));
      result = await runCLI(['status', '--change', 'goal-state', '--json'], { cwd: tempDir });
      data = JSON.parse(result.stdout);
      expect(data).toMatchObject({ state: 'needs_review', goals: { total: 1, completed: 1, remaining: 0 } });
      await fs.writeFile(tasks, '## Goals\n\n- [x] G1: Missing verification');
      result = await runCLI(['status', '--change', 'goal-state', '--json'], { cwd: tempDir });
      expect(JSON.parse(result.stdout).state).toBe('blocked');
    });
    it('shows status for scaffolded change without proposal.md', async () => {
      // Create empty change directory (no proposal.md)
      const changeDir = path.join(changesDir, 'scaffolded-change');
      await fs.mkdir(changeDir, { recursive: true });

      const result = await runCLI(['status', '--change', 'scaffolded-change'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('scaffolded-change');
      expect(result.stdout).toContain('0/4 artifacts complete');
      expect(result.stdout).toContain('[ ] proposal: proposal.md');
      expect(result.stdout).toContain('[-] design: design.md');
      expect(result.stdout).toContain('requires: proposal');
    });

    it('shows status for a change with proposal only', async () => {
      // createTestChange always creates proposal.md, so this has 1 artifact complete
      await createTestChange('minimal-change');

      const result = await runCLI(['status', '--change', 'minimal-change'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('minimal-change');
      expect(result.stdout).toContain('semantic-model');
      expect(result.stdout).toContain('1/4 artifacts complete');
    });

    it('shows status for a change with proposal and design', async () => {
      await createTestChange('partial-change', ['proposal', 'design']);

      const result = await runCLI(['status', '--change', 'partial-change'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('2/4 artifacts complete');
      expect(result.stdout).toContain('[x]');
    });

    it('outputs JSON when --json flag is used', async () => {
      await createTestChange('json-change', ['proposal', 'design']);

      const result = await runCLI(['status', '--change', 'json-change', '--json'], {
        cwd: tempDir,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');

      const json = JSON.parse(result.stdout);
      expect(json.changeName).toBe('json-change');
      expect(json.schemaName).toBe('semantic-model');
      expect(json.isComplete).toBe(false);
      expect(Array.isArray(json.artifacts)).toBe(true);
      expect(json.artifacts).toHaveLength(4);
      expect(json.artifacts.some((artifact: any) => artifact.id === 'architecture-delta')).toBe(false);

      const proposalArtifact = json.artifacts.find((a: any) => a.id === 'proposal');
      expect(proposalArtifact.status).toBe('done');
    });

    it('shows complete status when all artifacts are done', async () => {
      await createTestChange('complete-change', ['proposal', 'design', 'semantic-delta', 'tasks']);

      const result = await runCLI(['status', '--change', 'complete-change'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('4/4 artifacts complete');
      expect(result.stdout).toContain('ready');
      expect(result.stderr).toBe('');
      const json = JSON.parse((await runCLI(['status', '--change', 'complete-change', '--json'], { cwd: tempDir })).stdout);
      for (const artifact of json.artifacts) {
        expect(result.stdout).toContain(`${artifact.id}: ${artifact.outputPath}`);
        for (const output of artifact.outputs) expect(result.stdout).toContain(output);
        if (artifact.completionMarker) expect(result.stdout).toContain(artifact.completionMarker.path);
      }
    });

    it('exits gracefully when no changes exist', async () => {
      const result = await runCLI(['status'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No active changes');

    });

    it('exits gracefully with JSON when no changes exist', async () => {
      const result = await runCLI(['status', '--json'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);

      const json = JSON.parse(result.stdout);
      expect(json.changes).toEqual([]);
      expect(json).toEqual({ changes: [] });
    });

    it('errors when --change is missing and lists available changes', async () => {
      await createTestChange('some-change');

      const result = await runCLI(['status'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain('Missing required option --change');
      expect(output).toContain('some-change');
    });

    it('errors for unknown change name and lists available changes', async () => {
      await createTestChange('existing-change');

      const result = await runCLI(['status', '--change', 'nonexistent'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain("Change 'nonexistent' not found");
      expect(output).toContain('existing-change');
    });

    it('supports --schema option', async () => {
      await createTestChange('schema-change');

      const result = await runCLI(['status', '--change', 'schema-change', '--schema', 'semantic-model'], {
        cwd: tempDir,
      });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('semantic-model');
    });

    it('errors for unknown schema', async () => {
      await createTestChange('test-change');

      const result = await runCLI(['status', '--change', 'test-change', '--schema', 'unknown'], {
        cwd: tempDir,
      });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain("Schema 'unknown' not found");
    });

    it('rejects path traversal in change name', async () => {
      const result = await runCLI(['status', '--change', '../foo'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain('Invalid change name');
    });

    it('rejects absolute path in change name', async () => {
      const result = await runCLI(['status', '--change', '/etc/passwd'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain('Invalid change name');
    });

    it('rejects slashes in change name', async () => {
      const result = await runCLI(['status', '--change', 'foo/bar'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain('Invalid change name');
    });
  });

  describe('templates command', () => {
    it('shows template paths for default schema', async () => {
      const result = await runCLI(['templates'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Schema: semantic-model');
      expect(result.stdout).toContain('proposal:');
      expect(result.stdout).toContain('design:');
      expect(result.stdout).toContain('semantic-delta:');
      expect(result.stdout).toContain('tasks:');
    });

    it('shows template paths for specified schema', async () => {
      const result = await runCLI(['templates', '--schema', 'semantic-model'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Schema: semantic-model');
      expect(result.stdout).toContain('proposal:');
      expect(result.stdout).toContain('design:');
    });

    it('outputs JSON mapping of templates', async () => {
      const result = await runCLI(['templates', '--json'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');

      const json = JSON.parse(result.stdout);
      expect(json.proposal).toBeDefined();
      expect(json.proposal.path).toContain('proposal.md');
      expect(json.proposal.source).toBe('package');
    });

    it('errors for unknown schema', async () => {
      const result = await runCLI(['templates', '--schema', 'nonexistent'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain("Schema 'nonexistent' not found");
    });
  });

  describe('new change command', () => {
    it('creates a new change directory', async () => {
      const result = await runCLI(['new', 'change', 'my-new-feature'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
      const output = getOutput(result);
      expect(output).toBe('');

      const changeDir = path.join(changesDir, 'my-new-feature');
      const stat = await fs.stat(changeDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('creates README.md when --description is provided', async () => {
      const result = await runCLI(
        ['new', 'change', 'described-feature', '--description', 'This is a test feature'],
        { cwd: tempDir }
      );
      expect(result.exitCode).toBe(0);

      const readmePath = path.join(changesDir, 'described-feature', 'README.md');
      const content = await fs.readFile(readmePath, 'utf-8');
      expect(content).toContain('described-feature');
      expect(content).toContain('This is a test feature');
    });

    it('errors for invalid change name with spaces', async () => {
      const result = await runCLI(['new', 'change', 'invalid name'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain('cannot contain spaces');
    });

    it('errors for duplicate change name', async () => {
      await createTestChange('existing-change');

      const result = await runCLI(['new', 'change', 'existing-change'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      const output = getOutput(result);
      expect(output).toContain('exists');
    });

    it('errors when name argument is missing', async () => {
      const result = await runCLI(['new', 'change'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
    });
  });

  describe('help text', () => {
    it('status command help shows description', async () => {
      const result = await runCLI(['status', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Display artifact completion status');
    });

    it('templates command help shows description', async () => {
      const result = await runCLI(['templates', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Show resolved template paths');
    });

    it('new command help shows description', async () => {
      const result = await runCLI(['new', '--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Create new items');
    });
  });

  describe('retired setup aliases', () => {
    it('does not register experimental', async () => {
      const result = await runCLI(['experimental'], { cwd: tempDir });
      expect(result.exitCode).toBe(1);
      expect(getOutput(result)).toContain("unknown command 'experimental'");
    });
  });
});
