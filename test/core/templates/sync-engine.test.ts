import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import { ArtifactSyncEngine } from '../../../src/core/templates/sync-engine.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe('ArtifactSyncEngine subagent artifacts', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-sync-engine-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('writes workflow skills and internal subagent artifacts for native tools', async () => {
    const summary = await ArtifactSyncEngine.syncAll([
      { toolId: 'claude', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'pi', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'opencode', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
      { toolId: 'codex', projectPath: testDir, workflows: ['propose', 'explore'], version: 'test' },
    ]);

    expect(summary.failed).toEqual([]);

    for (const [toolDir, ext] of [
      ['.claude', 'md'],
      ['.pi', 'md'],
      ['.opencode', 'md'],
      ['.codex', 'toml'],
    ] as const) {
      await expect(
        fs.stat(path.join(testDir, toolDir, 'skills', 'openspec-propose', 'SKILL.md'))
      ).resolves.toBeDefined();
      await expect(
        fs.stat(path.join(testDir, toolDir, 'skills', 'openspec-explore', 'SKILL.md'))
      ).resolves.toBeDefined();

      for (const name of [
        'openspec-reviewer',
        'openspec-optimizer',
        'openspec-impact-sweeper',
      ]) {
        await expect(
          fs.stat(path.join(testDir, toolDir, 'agents', `${name}.${ext}`))
        ).resolves.toBeDefined();
        expect(await exists(path.join(testDir, toolDir, 'skills', name, 'SKILL.md'))).toBe(false);
      }
    }
  });

  it('uses path.join-compatible subagent paths and tool-specific extensions', async () => {
    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'codex',
      projectPath: testDir,
      workflows: ['apply'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    await expect(
      fs.stat(path.join(testDir, '.codex', 'agents', 'openspec-optimizer.toml'))
    ).resolves.toBeDefined();
    await expect(
      fs.stat(path.join(testDir, '.codex', 'agents', 'openspec-reviewer.toml'))
    ).resolves.toBeDefined();
    expect(await exists(path.join(testDir, '.codex/agents/openspec-optimizer.md'))).toBe(false);
  });

  it('cleans up old internal skill directories by explicit managed name', async () => {
    const skillsDir = path.join(testDir, '.claude', 'skills');
    for (const name of [
      'openspec-reviewer',
      'openspec-optimizer',
      'openspec-impact-sweeper',
      'openspec-implementer',
      'user-skill',
    ]) {
      await fs.mkdir(path.join(skillsDir, name), { recursive: true });
      await fs.writeFile(path.join(skillsDir, name, 'SKILL.md'), name);
    }

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'claude',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    for (const name of [
      'openspec-reviewer',
      'openspec-optimizer',
      'openspec-impact-sweeper',
      'openspec-implementer',
    ]) {
      expect(await exists(path.join(skillsDir, name))).toBe(false);
    }
    expect(await exists(path.join(skillsDir, 'openspec-explore', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(skillsDir, 'user-skill', 'SKILL.md'))).toBe(true);
  });

  it('preserves user-defined agents files while overwriting managed subagents', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(path.join(agentsDir, 'my-custom.md'), 'custom');
    await fs.writeFile(path.join(agentsDir, 'openspec-reviewer.md'), 'stale');

    const result = await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    expect(result.error).toBeUndefined();
    await expect(fs.readFile(path.join(agentsDir, 'my-custom.md'), 'utf-8')).resolves.toBe('custom');
    await expect(fs.readFile(path.join(agentsDir, 'openspec-reviewer.md'), 'utf-8')).resolves.toContain('name: openspec-reviewer');
  });

  it('preserves user-set model value on update', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create agent file with user-customized model
    await fs.writeFile(
      path.join(agentsDir, 'openspec-reviewer.md'),
      `---
name: openspec-reviewer
description: test
tools: read, grep
model: "anthropic/claude-sonnet-4"
---

User-changed prompt.`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'openspec-reviewer.md'), 'utf-8');
    expect(content).toContain('model: "anthropic/claude-sonnet-4"');
  });

  it('preserves user-set model value in toml agent on update', async () => {
    const agentsDir = path.join(testDir, '.codex', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create toml agent file with user-customized model
    await fs.writeFile(
      path.join(agentsDir, 'openspec-reviewer.toml'),
      `name = "openspec-reviewer"
description = "test"
model = "gpt-5"
sandbox_mode = "read-only"

developer_instructions = """
stale
"""
`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'codex',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'openspec-reviewer.toml'), 'utf-8');
    expect(content).toContain('model = "gpt-5"');
  });

  it('does not preserve model when set to inherit', async () => {
    const agentsDir = path.join(testDir, '.pi', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    // Pre-create agent file with model: 'inherit'
    await fs.writeFile(
      path.join(agentsDir, 'openspec-reviewer.md'),
      `---
name: openspec-reviewer
description: test
tools: read, grep
model: "inherit"
---

Stale prompt.`
    );

    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(path.join(agentsDir, 'openspec-reviewer.md'), 'utf-8');
    // model: "inherit" is a sentinel for 'no override' — should be stripped
    expect(content).not.toContain('model:');
  });

  it('generated content has no model field when template has no model', async () => {
    await ArtifactSyncEngine.syncOne({
      toolId: 'pi',
      projectPath: testDir,
      workflows: ['explore'],
      version: 'test',
    });

    const content = await fs.readFile(
      path.join(testDir, '.pi', 'agents', 'openspec-reviewer.md'),
      'utf-8'
    );
    // Fresh generation without override should not write model
    expect(content).not.toContain('model:');
  });
});
