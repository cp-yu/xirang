import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UpdateCommand, scanInstalledWorkflows } from '../../src/core/update.js';
import { getCommandSlug } from '../../src/core/shared/index.js';
import { SetupCommand } from '../../src/core/setup.js';
import { FileSystemUtils } from '../../src/utils/file-system.js';
import { XIRANG_MARKERS } from '../../src/core/config.js';
import type { GlobalConfig } from '../../src/core/global-config.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { randomUUID } from 'crypto';
import { parse as parseYaml } from 'yaml';

// Shared mutable mock config state
const mockState = {
  config: {
    featureFlags: {},
    delivery: 'both' as const,
  } as GlobalConfig,
};

// Mock global config module to isolate tests from the machine's actual config
vi.mock('../../src/core/global-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/global-config.js')>();

  return {
    ...actual,
    getGlobalConfig: () => ({ ...mockState.config }),
    saveGlobalConfig: vi.fn(),
  };
});

// Helper to set mock config for tests
function setMockConfig(config: GlobalConfig) {
  mockState.config = config;
}

function resetMockConfig() {
  mockState.config = { featureFlags: {}, delivery: 'both' };
}

function readSkillFrontmatter(skillContent: string): unknown {
  const match = skillContent.match(/^---\n([\s\S]*?)\n---\n/);
  return parseYaml(match?.[1] ?? '');
}

describe('UpdateCommand', () => {
  let testDir: string;
  let updateCommand: UpdateCommand;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `xirang-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    process.env.CODEX_HOME = path.join(testDir, 'codex-home');

    // Create xirang directory
    const xirangDir = path.join(testDir, '.xirang');
    await fs.mkdir(xirangDir, { recursive: true });

    updateCommand = new UpdateCommand();

    // Reset mock config to defaults
    resetMockConfig();

    // Clear all mocks before each test
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
    process.env = originalEnv;

    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function writeLegacyCodexCommand(workflowSlug: string): Promise<string> {
    const codexHome = process.env.CODEX_HOME;
    if (!codexHome) {
      throw new Error('CODEX_HOME must be set for Codex update tests');
    }

    const promptFile = path.join(path.resolve(codexHome), 'prompts', `opsx-${workflowSlug}.md`);
    await fs.mkdir(path.dirname(promptFile), { recursive: true });
    await fs.writeFile(promptFile, '# legacy codex command', 'utf-8');
    return promptFile;
  }

  describe('basic validation', () => {
    it('should throw error if xirang directory does not exist', async () => {
      // Remove xirang directory
      await fs.rm(path.join(testDir, '.xirang'), {
        recursive: true,
        force: true,
      });

      await expect(updateCommand.execute(testDir)).rejects.toThrow(
        "未找到 Xirang 项目。运行 'xirang setup' 进行设置。"
      );
    });

    it('should report no configured tools when none exist', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No configured tools found')
      );

      const configPath = path.join(testDir, '.xirang', 'config.yaml');
      const config = parseYaml(await fs.readFile(configPath, 'utf-8'));
      expect(config.decomposition).toEqual({ method: 'c4' });
      expect(config.optimization.enabled).toBe(true);
      expect(config.optimization.directionLimit).toBe(3);
      expect(config.optimization.directionRetries).toBe(2);
      expect(config.apply.defaultIsolation).toBe('ask');
      expect(config.git.merge.strategy).toBe('no-ff');
      expect(config.git.branch.deleteAfterArchive).toBe(false);
      expect(config.git).not.toHaveProperty('autoCommit');
      expect(config.git).not.toHaveProperty('archive');
      expect(config.git.merge).not.toHaveProperty('commitMessage');

      consoleSpy.mockRestore();
    });

    it('should preserve existing config fields while adding missing defaults', async () => {
      const configPath = path.join(testDir, '.xirang', 'config.yaml');
      await fs.writeFile(
        configPath,
        `schema: custom-schema
docLanguage: zh-CN
context: keep me
rules:
  proposal:
    - keep this rule
`
      );

      await updateCommand.execute(testDir);

      const config = parseYaml(await fs.readFile(configPath, 'utf-8'));
      expect(config.schema).toBe('custom-schema');
      expect(config.docLanguage).toBe('zh-CN');
      expect(config.context).toBe('keep me');
      expect(config.rules.proposal).toEqual(['keep this rule']);
      expect(config.decomposition).toEqual({ method: 'c4' });
      expect(config.optimization.enabled).toBe(true);
      expect(config.optimization.directionLimit).toBe(3);
      expect(config.optimization.directionRetries).toBe(2);
      expect(config.apply.defaultIsolation).toBe('ask');
      expect(config.git.merge.strategy).toBe('no-ff');
      expect(config.git.branch.deleteAfterArchive).toBe(false);
      expect(config.git).not.toHaveProperty('autoCommit');
      expect(config.git).not.toHaveProperty('archive');
      expect(config.git.merge).not.toHaveProperty('commitMessage');
      expect(config).not.toHaveProperty('propose');
      expect(config.apply).toEqual({
        defaultIsolation: 'ask',
      });
    });

    it('should preserve existing apply isolation while adding missing defaults', async () => {
      const configPath = path.join(testDir, '.xirang', 'config.yaml');
      await fs.writeFile(
        configPath,
        `schema: custom-schema
decomposition:
  skill: project-modeling
optimization:
  enabled: false
  directionRetries: 1
apply:
  defaultIsolation: worktree
git:
  commitMessage:
    archive: docs/archive.md
  merge:
    strategy: squash
`
      );

      await updateCommand.execute(testDir);

      const config = parseYaml(await fs.readFile(configPath, 'utf-8'));
      expect(config.schema).toBe('custom-schema');
      expect(config.decomposition).toEqual({ skill: 'project-modeling' });
      expect(config.decomposition).not.toHaveProperty('method');
      expect(config.optimization.enabled).toBe(false);
      expect(config.optimization.directionLimit).toBe(3);
      expect(config.optimization.directionRetries).toBe(1);
      expect(config.apply.defaultIsolation).toBe('worktree');
      expect(config.git.commitMessage.archive).toBe('docs/archive.md');
      expect(config.git.merge.strategy).toBe('squash');
      expect(config.git.branch.deleteAfterArchive).toBe(false);
      expect(config.git).not.toHaveProperty('autoCommit');
      expect(config.git).not.toHaveProperty('archive');
      expect(config.git.merge).not.toHaveProperty('commitMessage');
    });

    it('should remove obsolete git fields while adding new defaults', async () => {
      const configPath = path.join(testDir, '.xirang', 'config.yaml');
      await fs.writeFile(
        configPath,
        `schema: custom-schema
git:
  autoCommit: manual
  archive:
    commitMessage:
      convention: xirang-archive
  commitMessage:
    merge: docs/merge.md
  merge:
    strategy: squash
    messageFrom: manual
    commitMessage:
      convention: opsx-merge-summary
`
      );

      await updateCommand.execute(testDir);

      const config = parseYaml(await fs.readFile(configPath, 'utf-8'));
      expect(config.git).not.toHaveProperty('autoCommit');
      expect(config.git).not.toHaveProperty('archive');
      expect(config.git.merge.strategy).toBe('squash');
      expect(config.git.merge).not.toHaveProperty('messageFrom');
      expect(config.git.merge).not.toHaveProperty('commitMessage');
      expect(config.git.commitMessage.merge).toBe('docs/merge.md');
      expect(config.git.branch.deleteAfterArchive).toBe(false);
    });

    it('should warn and continue refreshing tools when project config migration is skipped', async () => {
      const configPath = path.join(testDir, '.xirang', 'config.yaml');
      const originalConfig = 'schema: [unclosed';
      await fs.writeFile(configPath, originalConfig);

      const skillsDir = path.join(testDir, '.claude', 'skills', 'xirang-explore');
      await fs.mkdir(skillsDir, { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'SKILL.md'), 'old content');

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(await fs.readFile(configPath, 'utf-8')).toBe(originalConfig);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Project config default migration skipped')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Claude Code')
      );

      warnSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('skill updates', () => {
    it('should update skill files for configured Claude tool', async () => {
      // Set up a configured Claude tool by creating skill directories
      const skillsDir = path.join(testDir, '.claude', 'skills');
      const exploreSkillDir = path.join(skillsDir, 'xirang-explore');
      await fs.mkdir(exploreSkillDir, { recursive: true });

      // Create an existing skill file
      const oldSkillContent = `---
name: xirang-explore (old)
description: Old description
license: MIT
compatibility: Requires xirang CLI.
metadata:
  author: xirang
  version: "0.9"
---

Old instructions content
`;
      await fs.writeFile(
        path.join(exploreSkillDir, 'SKILL.md'),
        oldSkillContent
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Check skill file was updated
      const updatedSkill = await fs.readFile(
        path.join(exploreSkillDir, 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(updatedSkill)).toMatchObject({
        name: 'xirang-explore',
        license: 'MIT',
      });
      expect(updatedSkill).not.toContain('Old instructions content');

      // Check console output
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 1 tool(s): claude')
      );

      consoleSpy.mockRestore();
    });

    it('should update core profile skill files when tool is configured', async () => {
      // Set up a configured tool with one skill directory
      const skillsDir = path.join(testDir, '.claude', 'skills');

      // Create at least one skill to mark tool as configured
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      // Verify core profile skill files were created/updated (propose, explore, apply, archive)
      const coreSkillNames = [
        'xirang-explore',
        'xirang-apply-change',
        'xirang-archive-change',
        'xirang-propose',
      ];

      for (const skillName of coreSkillNames) {
        const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
        const exists = await FileSystemUtils.fileExists(skillFile);
        expect(exists).toBe(true);

        const content = await fs.readFile(skillFile, 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('name:');
        expect(content).toContain('description:');
      }

      // Verify non-core skills are NOT created
      const nonCoreSkillNames = [
        'opsx-new-change',
        'opsx-continue-change',
        'opsx-ff-change',
        'opsx-sync-specs',
        'opsx-bulk-archive-change',
        'xirang-verify-change',
      ];

      for (const skillName of nonCoreSkillNames) {
        const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
        const exists = await FileSystemUtils.fileExists(skillFile);
        expect(exists).toBe(false);
      }
    });
  });

  describe('command updates (skills-only surface)', () => {
    it('should NOT generate xirang commands for configured Claude tool', async () => {
      // Set up a configured Claude tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      // Skills-only: no command files are generated
      const commandsDir = path.join(testDir, '.claude', 'commands', 'xirang');
      const exploreCmd = path.join(commandsDir, 'explore.md');
      const exists = await FileSystemUtils.fileExists(exploreCmd);
      expect(exists).toBe(false);

      // Skills should be refreshed
      const skillContent = await fs.readFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(skillContent).not.toBe('old content');
    });

    it('should NOT generate any xirang commands even with all workflows installed', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      const allCommandIds = ['explore', 'apply', 'archive', 'propose', 'bootstrap', 'new', 'continue', 'ff', 'sync', 'bulk-archive', 'verify'];
      const commandsDir = path.join(testDir, '.claude', 'commands', 'xirang');
      for (const cmdId of allCommandIds) {
        const cmdFile = path.join(commandsDir, `${cmdId}.md`);
        expect(await FileSystemUtils.fileExists(cmdFile)).toBe(false);
      }
    });

  });

  describe('multi-tool support', () => {
    it('should update multiple configured tools', async () => {
      // Set up Claude
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(claudeSkillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      // Set up Cursor
      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(cursorSkillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Both tools should be updated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 2 tool(s)')
      );

      // Verify Claude skills updated
      const claudeSkill = await fs.readFile(
        path.join(claudeSkillsDir, 'xirang-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(claudeSkill)).toMatchObject({ name: 'xirang-explore' });

      // Verify Cursor skills updated
      const cursorSkill = await fs.readFile(
        path.join(cursorSkillsDir, 'xirang-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(cursorSkill)).toMatchObject({ name: 'xirang-explore' });

      consoleSpy.mockRestore();
    });

    it('should update Qwen tool with skills-only format (no TOML commands)', async () => {
      // Set up Qwen
      const qwenSkillsDir = path.join(testDir, '.qwen', 'skills');
      await fs.mkdir(path.join(qwenSkillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(qwenSkillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      // Skills-only: no TOML command files are generated
      const qwenCmd = path.join(
        testDir,
        '.qwen',
        'commands',
        'xirang-explore.toml'
      );
      const exists = await FileSystemUtils.fileExists(qwenCmd);
      expect(exists).toBe(false);

      // Skills should be refreshed
      const skillContent = await fs.readFile(
        path.join(qwenSkillsDir, 'xirang-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(skillContent)).toMatchObject({ name: 'xirang-explore' });
    });

    it('should update Windsurf tool with skills-only format (no workflow commands)', async () => {
      // Set up Windsurf
      const windsurfSkillsDir = path.join(testDir, '.windsurf', 'skills');
      await fs.mkdir(path.join(windsurfSkillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(windsurfSkillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      // Skills-only: no workflow command files are generated
      const windsurfCmd = path.join(
        testDir,
        '.windsurf',
        'workflows',
        'xirang-explore.md'
      );
      const exists = await FileSystemUtils.fileExists(windsurfCmd);
      expect(exists).toBe(false);

      // Skills should be refreshed
      const skillContent = await fs.readFile(
        path.join(windsurfSkillsDir, 'xirang-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(skillContent)).toMatchObject({ name: 'xirang-explore' });
    });
  });

  describe('error handling', () => {
    it('should handle tool update failures gracefully', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      // Mock writeFile to fail for skills
      const originalWriteFile = FileSystemUtils.writeFile.bind(FileSystemUtils);
      const writeSpy = vi
        .spyOn(FileSystemUtils, 'writeFile')
        .mockImplementation(async (filePath, content) => {
          if (filePath.includes('SKILL.md')) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile(filePath, content);
        });

      const consoleSpy = vi.spyOn(console, 'log');

      // Should not throw
      await updateCommand.execute(testDir);

      // Should report failure
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed')
      );

      writeSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should continue updating other tools when one fails', async () => {
      // Set up Claude and Cursor
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(claudeSkillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(cursorSkillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      // Mock writeFile to fail only for Claude
      const originalWriteFile = FileSystemUtils.writeFile.bind(FileSystemUtils);
      const writeSpy = vi
        .spyOn(FileSystemUtils, 'writeFile')
        .mockImplementation(async (filePath, content) => {
          if (filePath.includes('.claude') && filePath.includes('SKILL.md')) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile(filePath, content);
        });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Cursor should still be updated - check the actual format from ora spinner
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Cursor')
      );

      // Claude should be reported as failed
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed')
      );

      writeSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('tool detection', () => {
    it('should detect tool as configured only when skill file exists', async () => {
      // Create skills directory but no skill files
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(skillsDir, { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should report no configured tools
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No configured tools found')
      );

      consoleSpy.mockRestore();
    });

    it('should detect tool when any single skill exists', async () => {
      // Create only one skill file
      const skillDir = path.join(
        testDir,
        '.claude',
        'skills',
        'xirang-archive-change'
      );
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should detect and update Claude
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 1 tool(s): claude')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('skill content validation', () => {
    it('should generate valid YAML frontmatter in skill files', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'utf-8'
      );

      // Validate frontmatter structure
      expect(skillContent).toMatch(/^---\n/);
      expect(skillContent).toContain('name:');
      expect(skillContent).toContain('description:');
      expect(skillContent).toContain('license:');
      expect(skillContent).toContain('compatibility:');
      expect(skillContent).toContain('metadata:');
      expect(skillContent).toContain('author:');
      expect(skillContent).toContain('version:');
      expect(skillContent).toMatch(/---\n\n/);
    });

    it('should include proper instructions in skill files', async () => {
      // Set up a configured tool with apply-change skill (which is in core profile)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-apply-change'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-apply-change', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(skillsDir, 'xirang-apply-change', 'SKILL.md'),
        'utf-8'
      );

      // Apply skill should contain implementation instructions
      expect(skillContent.toLowerCase()).toContain('task');
    });
  });

  describe('success output', () => {
    it('should display success message with tool name', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // The success output uses "✓ Updated: <name>"
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Claude Code')
      );

      consoleSpy.mockRestore();
    });

    it('should suggest IDE restart after update', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Restart your IDE')
      );

      consoleSpy.mockRestore();
    });

    it('should use skills-only restart guidance for codex-only updates', async () => {
      const skillsDir = path.join(testDir, '.codex', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('refreshed skills to take effect')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('slash commands to take effect')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('smart update detection', () => {
    it('should show "up to date" message when skills have current version', async () => {
      // Initialize full core profile output so there is no profile/delivery drift.
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('up to date')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('--force')
      );

      consoleSpy.mockRestore();
    });

    it('should detect update needed when generatedBy is missing', async () => {
      // Set up a configured tool without generatedBy
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        `---
name: xirang-explore
metadata:
  author: xirang
  version: "1.0"
---

Legacy content without generatedBy
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show "unknown → version" in the update message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown')
      );

      consoleSpy.mockRestore();
    });

    it('should detect update needed when version differs', async () => {
      // Set up a configured tool with a stamp that differs from the current version.
      // Derive the stale stamp from the real version so this test survives version bumps.
      const { version } = await import('../../package.json');
      const staleVersion = `${version}-stale`;
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        `---
name: xirang-explore
metadata:
  generatedBy: "${staleVersion}"
---

Old version content
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show version transition
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`(${staleVersion} → ${version})`)
      );

      consoleSpy.mockRestore();
    });

    it('should embed generatedBy in updated skill files', async () => {
      // Set up a configured tool without generatedBy
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old content without version'
      );

      await updateCommand.execute(testDir);

      const updatedContent = await fs.readFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'utf-8'
      );

      // Should contain generatedBy field
      expect(updatedContent).toMatch(/generatedBy:\s*["']\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?["']/);
    });
  });

  describe('--force flag', () => {
    it('should update when force is true even if up to date', async () => {
      // Set up a configured tool with current version
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });

      const { version } = await import('../../package.json');
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        `---
metadata:
  generatedBy: "${version}"
---
Content
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show "Force updating" message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force updating')
      );

      // Should show updated message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Claude Code')
      );

      consoleSpy.mockRestore();
    });

    it('should not show --force hint when force is used', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old content'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Get all console.log calls as strings
      const allCalls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );

      // Should not show "Use --force" since force was used
      const hasForceHint = allCalls.some(call => call.includes('Use --force'));
      expect(hasForceHint).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should update all tools when force is used with mixed versions', async () => {
      // Set up Claude with current version
      const { version } = await import('../../package.json');
      const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'xirang-explore');
      await fs.mkdir(claudeSkillDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeSkillDir, 'SKILL.md'),
        `---
metadata:
  generatedBy: "${version}"
---
`
      );

      // Set up Cursor with old version
      const cursorSkillDir = path.join(testDir, '.cursor', 'skills', 'xirang-explore');
      await fs.mkdir(cursorSkillDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorSkillDir, 'SKILL.md'),
        `---
metadata:
  generatedBy: "0.1.0"
---
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show both tools being force updated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Force updating 2 tool(s)')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('version tracking', () => {
    it('should show version in success message', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show version in success message
      const { version } = await import('../../package.json');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`(v${version})`)
      );

      consoleSpy.mockRestore();
    });

    it('should only update tools that need updating', async () => {
      // Initialize both tools so Cursor is fully synced with profile/delivery.
      const initCommand = new SetupCommand({ tools: 'claude,cursor', force: true });
      await initCommand.execute(testDir);

      // Make Claude stale to force a version update.
      // Derive the stale stamp from the real version so this test survives version bumps.
      const { version } = await import('../../package.json');
      const claudeSkillFile = path.join(testDir, '.claude', 'skills', 'xirang-propose', 'SKILL.md');
      const claudeContent = await fs.readFile(claudeSkillFile, 'utf-8');
      await fs.writeFile(
        claudeSkillFile,
        claudeContent.replace(/generatedBy:\s*["'][^"']+["']/, `generatedBy: "${version}-stale"`)
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show only Claude being updated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updating 1 tool(s)')
      );

      // Should mention Cursor is already up to date
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already up to date: cursor')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('profile-aware updates (skills-only)', () => {
    it('should install all 6 registry workflows regardless of stale config', async () => {
      // Obsolete profile/workflows/delivery in config are now ignored
      setMockConfig({
        featureFlags: {},
        delivery: 'both',
      });

      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // All 6 registry workflows should be created (snack is skill-only)
      const expectedSkills = [
        'xirang-explore', 'xirang-propose', 'xirang-apply-change',
        'xirang-archive-change', 'xirang-build', 'xirang-snack',
      ];
      for (const skill of expectedSkills) {
        expect(await FileSystemUtils.fileExists(
          path.join(skillsDir, skill, 'SKILL.md')
        )).toBe(true);
      }

      // Removed workflows should NOT be created
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-new-change', 'SKILL.md')
      )).toBe(false);
    });

    it('should always generate skills only (no commands) with stale delivery=skills', async () => {
      setMockConfig({
        featureFlags: {},
        delivery: 'skills',
      });

      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // Skills should be created
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md')
      )).toBe(true);

      // Commands should NOT be created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'xirang');
      expect(await FileSystemUtils.fileExists(
        path.join(commandsDir, 'explore.md')
      )).toBe(false);
    });

    it('should always generate skills only even with stale delivery=commands', async () => {
      setMockConfig({
        featureFlags: {},
        delivery: 'commands',
      });

      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // Skills-only surface ignores stale delivery=commands
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md')
      )).toBe(true);

      // Commands should NOT be created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'xirang');
      expect(await FileSystemUtils.fileExists(
        path.join(commandsDir, 'explore.md')
      )).toBe(false);
    });

    it('should not actively remove skills even when stale delivery=commands is set', async () => {
      setMockConfig({
        featureFlags: {},
        delivery: 'commands',
      });

      const { AI_TOOLS } = await import('../../src/core/config.js');
      const someTool = AI_TOOLS.find((tool) => tool.skillsDir && tool.value !== 'codex');
      expect(someTool).toBeDefined();
      if (!someTool?.skillsDir) {
        return;
      }

      const skillsDir = path.join(testDir, someTool.skillsDir, 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      await expect(updateCommand.execute(testDir)).resolves.toBeUndefined();

      // Skills remain — skills-only surface does not strip skills
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'xirang-explore', 'SKILL.md')
      )).toBe(true);
    });

    it('should apply config sync when templates are up to date (skills-only)', async () => {
      setMockConfig({
        featureFlags: {},
      });

      const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      await fs.mkdir(path.dirname(skillFile), { recursive: true });
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8')) as { version: string };
      await fs.writeFile(
        skillFile,
        `---
name: xirang-explore
metadata:
  generatedBy: "${packageJson.version}"
---
content
`
      );

      await updateCommand.execute(testDir);

      expect(await FileSystemUtils.fileExists(skillFile)).toBe(true);
    });

    it('should remove workflows not in registry during update sync (skills-only)', async () => {
      setMockConfig({
        featureFlags: {},
      });

      // Set up tool with extra workflows not in registry
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      // Add a removed workflow skill
      await fs.mkdir(path.join(skillsDir, 'opsx-new-change'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-new-change', 'SKILL.md'), 'old');
      // Pre-existing command file for one of the 7 explicitly-removed workflows
      // (new, continue, ff, sync, bulk-archive, verify, onboard) IS cleaned up
      // by cleanupExpandedWorkflowRemnants.
      const extraCommandFile = path.join(testDir, '.claude', 'commands', 'xirang', 'new.md');
      await fs.mkdir(path.dirname(extraCommandFile), { recursive: true });
      await fs.writeFile(extraCommandFile, 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await new UpdateCommand({ force: true }).execute(testDir);

      // Removed skill workflow is cleaned up
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-new-change', 'SKILL.md')
      )).toBe(false);
      // The 7 explicitly-removed workflow command files are still cleaned by
      // cleanupExpandedWorkflowRemnants (historical cleanup, not delivery-based).
      expect(await FileSystemUtils.fileExists(extraCommandFile)).toBe(false);

      // Should report cleaned up skill artifacts.
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasCleanupNote = calls.some(call =>
        call.includes('deprecated workflow remnant files') || (call.includes('Removed:') && call.includes('skill director'))
      );
      expect(hasCleanupNote).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should keep codex skills-only and NOT delete legacy command files (skills-only surface)', async () => {
      setMockConfig({
        featureFlags: {},
      });

      const skillsDir = path.join(testDir, '.codex', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');
      const legacyCommand = await writeLegacyCodexCommand('explore');
      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'xirang-propose', 'SKILL.md')
      )).toBe(true);
      // Skills-only: legacy command files are not actively removed
      expect(await FileSystemUtils.fileExists(legacyCommand)).toBe(true);

      const calls = consoleSpy.mock.calls.map((call) => call.map((arg) => String(arg)).join(' '));
      expect(calls.some((call) => call.includes('no adapter'))).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should keep codex skills even with stale delivery=commands (skills-only)', async () => {
      setMockConfig({
        featureFlags: {},
        delivery: 'commands',
      });

      const skillsDir = path.join(testDir, '.codex', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');
      const legacyCommand = await writeLegacyCodexCommand('explore');

      await updateCommand.execute(testDir);

      // Skills-only ignores stale delivery=commands
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'xirang-apply-change', 'SKILL.md')
      )).toBe(true);
      // Legacy command files are not actively removed
      expect(await FileSystemUtils.fileExists(legacyCommand)).toBe(true);
    });

    it('should NOT recover codex from legacy command-only installs (skills-only)', async () => {
      setMockConfig({
        featureFlags: {},
      });

      const legacyCommand = await writeLegacyCodexCommand('explore');

      await updateCommand.execute(testDir);

      // Skills-only: command-only tools are NOT detected as configured
      expect(await FileSystemUtils.fileExists(
        path.join(testDir, '.codex', 'skills', 'xirang-explore', 'SKILL.md')
      )).toBe(false);
      expect(await FileSystemUtils.fileExists(legacyCommand)).toBe(true);
    });
  });

  describe('new tool detection', () => {
    it('should detect new tool directories not currently configured', async () => {
      // Set up a configured Claude tool
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      // Create a Cursor directory (not configured — no skills)
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should detect Cursor as a new tool
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasNewToolMessage = calls.some(call =>
        call.includes("Detected new tool: Cursor. Run 'xirang setup' to add it.")
      );
      expect(hasNewToolMessage).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should consolidate multiple new tools into one message', async () => {
      // Set up a configured Claude tool
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      // Create two unconfigured tool directories
      await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');
      await fs.mkdir(path.join(testDir, '.windsurf'), { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );

      const consolidatedCalls = calls.filter(call =>
        call.includes('Detected new tools:')
      );
      expect(consolidatedCalls).toHaveLength(1);
      expect(consolidatedCalls[0]).toContain('GitHub Copilot');
      expect(consolidatedCalls[0]).toContain('Windsurf');
      expect(consolidatedCalls[0]).toContain("Run 'xirang setup' to add them.");

      const repeatedSingularCalls = calls.filter(call =>
        call.includes('Detected new tool:')
      );
      expect(repeatedSingularCalls).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should not show new tool message when no new tools detected', async () => {
      // Set up a configured tool (only Claude, no other tool directories)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasNewToolMessage = calls.some(call =>
        call.includes('Detected new tool')
      );
      expect(hasNewToolMessage).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('scanInstalledWorkflows', () => {
    it('should detect installed workflows across tools', async () => {
      // Create skills for Claude
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'xirang-explore', 'SKILL.md'), 'content');
      await fs.mkdir(path.join(claudeSkillsDir, 'xirang-apply-change'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'xirang-apply-change', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toContain('explore');
      expect(workflows).toContain('apply');
      expect(workflows).not.toContain('propose');
    });

    it('should return union of workflows across multiple tools', async () => {
      // Claude has explore
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'xirang-explore', 'SKILL.md'), 'content');

      // Cursor has apply
      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'xirang-apply-change'), { recursive: true });
      await fs.writeFile(path.join(cursorSkillsDir, 'xirang-apply-change', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude', 'cursor']);
      expect(workflows).toContain('explore');
      expect(workflows).toContain('apply');
    });

    it('should only match workflows in ALL_WORKFLOWS', async () => {
      // Create a custom skill directory that doesn't match any workflow
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'my-custom-skill'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'my-custom-skill', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toHaveLength(0);
    });

    it('should return empty array when no tools have skills', async () => {
      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toHaveLength(0);
    });

    it('should NOT detect installed workflows from managed command files (skills-only)', async () => {
      const commandsDir = path.join(testDir, '.claude', 'commands', 'xirang');
      await fs.mkdir(commandsDir, { recursive: true });
      await fs.writeFile(path.join(commandsDir, 'explore.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).not.toContain('explore');
    });
  });

  describe('tools output', () => {
    it('should list affected tools in output', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'xirang-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'xirang-explore', 'SKILL.md'), 'old');

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasToolsList = calls.some(call =>
        call.includes('Tools:') && call.includes('Claude Code')
      );
      expect(hasToolsList).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
