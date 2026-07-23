import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UpdateCommand, scanInstalledWorkflows } from '../../src/core/update.js';
import { getCommandSlug } from '../../src/core/shared/index.js';
import { SetupCommand } from '../../src/core/setup.js';
import { FileSystemUtils } from '../../src/utils/file-system.js';
import { OPSX_MARKERS } from '../../src/core/config.js';
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
    testDir = path.join(os.tmpdir(), `opsx-test-${randomUUID()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    process.env.CODEX_HOME = path.join(testDir, 'codex-home');

    // Create opsx directory
    const opsxDir = path.join(testDir, '.opsx');
    await fs.mkdir(opsxDir, { recursive: true });

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
    it('should throw error if opsx directory does not exist', async () => {
      // Remove opsx directory
      await fs.rm(path.join(testDir, '.opsx'), {
        recursive: true,
        force: true,
      });

      await expect(updateCommand.execute(testDir)).rejects.toThrow(
        "未找到 OPSX 项目。运行 'opsx setup' 进行设置。"
      );
    });

    it('should report no configured tools when none exist', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No configured tools found')
      );

      const configPath = path.join(testDir, '.opsx', 'config.yaml');
      const config = parseYaml(await fs.readFile(configPath, 'utf-8'));
      expect(config.optimization.enabled).toBe(true);
      expect(config.optimization.optRetries).toBe(2);
      expect(config.apply.defaultIsolation).toBe('ask');
      expect(config.git.merge.strategy).toBe('no-ff');
      expect(config.git.branch.deleteAfterArchive).toBe(false);
      expect(config.git).not.toHaveProperty('autoCommit');
      expect(config.git).not.toHaveProperty('archive');
      expect(config.git.merge).not.toHaveProperty('commitMessage');

      consoleSpy.mockRestore();
    });

    it('should preserve existing config fields while adding missing defaults', async () => {
      const configPath = path.join(testDir, '.opsx', 'config.yaml');
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
      expect(config.optimization.enabled).toBe(true);
      expect(config.optimization.optRetries).toBe(2);
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
      const configPath = path.join(testDir, '.opsx', 'config.yaml');
      await fs.writeFile(
        configPath,
        `schema: custom-schema
optimization:
  enabled: false
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
      expect(config.optimization.enabled).toBe(false);
      expect(config.optimization.optRetries).toBe(2);
      expect(config.apply.defaultIsolation).toBe('worktree');
      expect(config.git.commitMessage.archive).toBe('docs/archive.md');
      expect(config.git.merge.strategy).toBe('squash');
      expect(config.git.branch.deleteAfterArchive).toBe(false);
      expect(config.git).not.toHaveProperty('autoCommit');
      expect(config.git).not.toHaveProperty('archive');
      expect(config.git.merge).not.toHaveProperty('commitMessage');
    });

    it('should remove obsolete git fields while adding new defaults', async () => {
      const configPath = path.join(testDir, '.opsx', 'config.yaml');
      await fs.writeFile(
        configPath,
        `schema: custom-schema
git:
  autoCommit: manual
  archive:
    commitMessage:
      convention: opsx-archive
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
      const configPath = path.join(testDir, '.opsx', 'config.yaml');
      const originalConfig = 'schema: [unclosed';
      await fs.writeFile(configPath, originalConfig);

      const skillsDir = path.join(testDir, '.claude', 'skills', 'opsx-explore');
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

  describe('retired workspace handling', () => {
    it('requires confirmation, then archives the workspace and installs Project Build', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills', 'opsx-explore');
      await fs.mkdir(skillsDir, { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'SKILL.md'), 'existing explore skill');
      await fs.mkdir(path.join(testDir, '.opsx', 'bootstrap'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.opsx', 'bootstrap', 'state.yaml'), 'state\n');

      setMockConfig({ featureFlags: {} });

      await expect(updateCommand.execute(testDir)).rejects.toThrow(/cleanup confirmation/);
      await new UpdateCommand({ force: true }).execute(testDir);

      const buildSkill = path.join(testDir, '.claude', 'skills', 'opsx-build', 'SKILL.md');
      expect(await FileSystemUtils.fileExists(buildSkill)).toBe(true);
      expect(await FileSystemUtils.directoryExists(path.join(testDir, '.opsx', 'bootstrap'))).toBe(false);
      const historyEntries = await fs.readdir(path.join(testDir, '.opsx', 'history'));
      expect(historyEntries).toHaveLength(1);
    });
  });

  describe('skill updates', () => {
    it('should update skill files for configured Claude tool', async () => {
      // Set up a configured Claude tool by creating skill directories
      const skillsDir = path.join(testDir, '.claude', 'skills');
      const exploreSkillDir = path.join(skillsDir, 'opsx-explore');
      await fs.mkdir(exploreSkillDir, { recursive: true });

      // Create an existing skill file
      const oldSkillContent = `---
name: opsx-explore (old)
description: Old description
license: MIT
compatibility: Requires opsx CLI.
metadata:
  author: opsx
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
        name: 'opsx-explore',
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      // Verify core profile skill files were created/updated (propose, explore, apply, archive)
      const coreSkillNames = [
        'opsx-explore',
        'opsx-apply-change',
        'opsx-archive-change',
        'opsx-propose',
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
        'opsx-verify-change',
      ];

      for (const skillName of nonCoreSkillNames) {
        const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
        const exists = await FileSystemUtils.fileExists(skillFile);
        expect(exists).toBe(false);
      }
    });
  });

  describe('command updates (skills-only surface)', () => {
    it('should NOT generate opsx commands for configured Claude tool', async () => {
      // Set up a configured Claude tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      // Skills-only: no command files are generated
      const commandsDir = path.join(testDir, '.claude', 'commands', 'opsx');
      const exploreCmd = path.join(commandsDir, 'explore.md');
      const exists = await FileSystemUtils.fileExists(exploreCmd);
      expect(exists).toBe(false);

      // Skills should be refreshed
      const skillContent = await fs.readFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(skillContent).not.toBe('old content');
    });

    it('should NOT generate any opsx commands even with all workflows installed', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old content'
      );

      await updateCommand.execute(testDir);

      const allCommandIds = ['explore', 'apply', 'archive', 'propose', 'bootstrap', 'new', 'continue', 'ff', 'sync', 'bulk-archive', 'verify'];
      const commandsDir = path.join(testDir, '.claude', 'commands', 'opsx');
      for (const cmdId of allCommandIds) {
        const cmdFile = path.join(commandsDir, `${cmdId}.md`);
        expect(await FileSystemUtils.fileExists(cmdFile)).toBe(false);
      }
    });

    it('should require cleanup approval before touching an existing legacy command', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old content');

      const legacyCommand = path.join(testDir, '.claude', 'commands', 'opsx', getCommandSlug('build') + '.md');
      await fs.mkdir(path.dirname(legacyCommand), { recursive: true });
      const legacyContent = 'legacy bootstrap command';
      await fs.writeFile(legacyCommand, legacyContent);

      await expect(updateCommand.execute(testDir)).rejects.toThrow(/cleanup confirmation/);
      expect(await fs.readFile(legacyCommand, 'utf-8')).toBe(legacyContent);
    });

  });

  describe('multi-tool support', () => {
    it('should update multiple configured tools', async () => {
      // Set up Claude
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      // Set up Cursor
      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(cursorSkillsDir, 'opsx-explore', 'SKILL.md'),
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
        path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(claudeSkill)).toMatchObject({ name: 'opsx-explore' });

      // Verify Cursor skills updated
      const cursorSkill = await fs.readFile(
        path.join(cursorSkillsDir, 'opsx-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(cursorSkill)).toMatchObject({ name: 'opsx-explore' });

      consoleSpy.mockRestore();
    });

    it('should update Qwen tool with skills-only format (no TOML commands)', async () => {
      // Set up Qwen
      const qwenSkillsDir = path.join(testDir, '.qwen', 'skills');
      await fs.mkdir(path.join(qwenSkillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(qwenSkillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      // Skills-only: no TOML command files are generated
      const qwenCmd = path.join(
        testDir,
        '.qwen',
        'commands',
        'opsx-explore.toml'
      );
      const exists = await FileSystemUtils.fileExists(qwenCmd);
      expect(exists).toBe(false);

      // Skills should be refreshed
      const skillContent = await fs.readFile(
        path.join(qwenSkillsDir, 'opsx-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(skillContent)).toMatchObject({ name: 'opsx-explore' });
    });

    it('should update Windsurf tool with skills-only format (no workflow commands)', async () => {
      // Set up Windsurf
      const windsurfSkillsDir = path.join(testDir, '.windsurf', 'skills');
      await fs.mkdir(path.join(windsurfSkillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(windsurfSkillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      // Skills-only: no workflow command files are generated
      const windsurfCmd = path.join(
        testDir,
        '.windsurf',
        'workflows',
        'opsx-explore.md'
      );
      const exists = await FileSystemUtils.fileExists(windsurfCmd);
      expect(exists).toBe(false);

      // Skills should be refreshed
      const skillContent = await fs.readFile(
        path.join(windsurfSkillsDir, 'opsx-explore', 'SKILL.md'),
        'utf-8'
      );
      expect(readSkillFrontmatter(skillContent)).toMatchObject({ name: 'opsx-explore' });
    });
  });

  describe('error handling', () => {
    it('should handle tool update failures gracefully', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(cursorSkillsDir, 'opsx-explore', 'SKILL.md'),
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
        'opsx-archive-change'
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      await fs.mkdir(path.join(skillsDir, 'opsx-apply-change'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-apply-change', 'SKILL.md'),
        'old'
      );

      await updateCommand.execute(testDir);

      const skillContent = await fs.readFile(
        path.join(skillsDir, 'opsx-apply-change', 'SKILL.md'),
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        `---
name: opsx-explore
metadata:
  author: opsx
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
      // Set up a configured tool with old version
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        `---
name: opsx-explore
metadata:
  generatedBy: "0.1.0"
---

Old version content
`
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should show version transition
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('0.1.0')
      );

      consoleSpy.mockRestore();
    });

    it('should embed generatedBy in updated skill files', async () => {
      // Set up a configured tool without generatedBy
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old content without version'
      );

      await updateCommand.execute(testDir);

      const updatedContent = await fs.readFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });

      const { version } = await import('../../package.json');
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'opsx-explore');
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
      const cursorSkillDir = path.join(testDir, '.cursor', 'skills', 'opsx-explore');
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
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
      const claudeSkillFile = path.join(testDir, '.claude', 'skills', 'opsx-propose', 'SKILL.md');
      const claudeContent = await fs.readFile(claudeSkillFile, 'utf-8');
      await fs.writeFile(
        claudeSkillFile,
        claudeContent.replace(/generatedBy:\s*["'][^"']+["']/, 'generatedBy: "0.1.0"')
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

  describe('legacy cleanup', () => {
    it('should detect and auto-cleanup legacy files with --force flag', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      // Create legacy CLAUDE.md with OPSX markers
      const legacyContent = `${OPSX_MARKERS.start}
# OPSX Instructions

These instructions are for AI assistants.
${OPSX_MARKERS.end}
`;
      await fs.writeFile(path.join(testDir, 'CLAUDE.md'), legacyContent);

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show v1 upgrade message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Upgrading to the new OPSX')
      );

      // Should show marker removal message (config files are never deleted, only have markers removed)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed OPSX markers from CLAUDE.md')
      );

      // Config file should still exist (never deleted)
      const legacyExists = await FileSystemUtils.fileExists(
        path.join(testDir, 'CLAUDE.md')
      );
      expect(legacyExists).toBe(true);

      // File should have markers removed
      const content = await fs.readFile(path.join(testDir, 'CLAUDE.md'), 'utf-8');
      expect(content).not.toContain(OPSX_MARKERS.start);
      expect(content).not.toContain(OPSX_MARKERS.end);

      consoleSpy.mockRestore();
    });

    it('should stop before writes when legacy cleanup cannot be confirmed', async () => {
      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      await fs.mkdir(path.dirname(skillFile), { recursive: true });
      await fs.writeFile(skillFile, 'old skill');

      const configPath = path.join(testDir, '.opsx', 'config.yaml');
      const configContent = 'schema: spec-driven\n';
      await fs.writeFile(configPath, configContent);

      const removedWorkflow = path.join(testDir, '.claude', 'skills', 'opsx-new-change', 'SKILL.md');
      await fs.mkdir(path.dirname(removedWorkflow), { recursive: true });
      await fs.writeFile(removedWorkflow, 'retired skill');

      const legacyContent = `${OPSX_MARKERS.start}
# OPSX Instructions
${OPSX_MARKERS.end}
`;
      const legacyFile = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(legacyFile, legacyContent);

      await expect(updateCommand.execute(testDir)).rejects.toThrow(/cleanup confirmation/);

      expect(await fs.readFile(legacyFile, 'utf8')).toBe(legacyContent);
      expect(await fs.readFile(skillFile, 'utf8')).toBe('old skill');
      expect(await fs.readFile(removedWorkflow, 'utf8')).toBe('retired skill');
      expect(await fs.readFile(configPath, 'utf8')).toBe(configContent);
    });

    it('should cleanup legacy slash command directories with --force', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      // Create legacy slash command directory
      const legacyCommandDir = path.join(testDir, '.claude', 'commands', 'opsx');
      await fs.mkdir(legacyCommandDir, { recursive: true });
      await fs.writeFile(
        path.join(legacyCommandDir, 'old-command.md'),
        'old command'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show cleanup message for directory
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed .claude/commands/opsx/')
      );

      // Legacy directory should be deleted
      const legacyDirExists = await FileSystemUtils.directoryExists(legacyCommandDir);
      expect(legacyDirExists).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should cleanup legacy .opsx/AGENTS.md with --force', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      // Create legacy .opsx/AGENTS.md
      await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.opsx', 'AGENTS.md'),
        '# Old AGENTS.md content'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show cleanup message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed .opsx/AGENTS.md')
      );

      // Legacy file should be deleted
      const legacyExists = await FileSystemUtils.fileExists(
        path.join(testDir, '.opsx', 'AGENTS.md')
      );
      expect(legacyExists).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should not show legacy cleanup messages when no legacy files exist', async () => {
      // Set up a configured tool with no legacy files
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should not show v1 upgrade message (no legacy files)
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasLegacyMessage = calls.some(call =>
        call.includes('Upgrading to the new OPSX')
      );
      expect(hasLegacyMessage).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should remove OPSX marker block from mixed content files', async () => {
      // Set up a configured tool
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old'
      );

      // Create CLAUDE.md with mixed content (user content + OPSX markers)
      const mixedContent = `# My Project

Some user-defined instructions here.

${OPSX_MARKERS.start}
# OPSX Instructions

These instructions are for AI assistants.
${OPSX_MARKERS.end}

More user content after markers.
`;
      await fs.writeFile(path.join(testDir, 'CLAUDE.md'), mixedContent);

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show marker removal message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed OPSX markers from CLAUDE.md')
      );

      // File should still exist
      const fileExists = await FileSystemUtils.fileExists(
        path.join(testDir, 'CLAUDE.md')
      );
      expect(fileExists).toBe(true);

      // File should have markers removed but preserve user content
      const updatedContent = await fs.readFile(
        path.join(testDir, 'CLAUDE.md'),
        'utf-8'
      );
      expect(updatedContent).toContain('# My Project');
      expect(updatedContent).toContain('Some user-defined instructions here');
      expect(updatedContent).toContain('More user content after markers');
      expect(updatedContent).not.toContain(OPSX_MARKERS.start);
      expect(updatedContent).not.toContain(OPSX_MARKERS.end);

      consoleSpy.mockRestore();
    });
  });

  describe('legacy tool upgrade', () => {
    it('should upgrade legacy tools to new skills with --force', async () => {
      // Create legacy slash command directory (no skills exist yet)
      const legacyCommandDir = path.join(testDir, '.claude', 'commands', 'opsx');
      await fs.mkdir(legacyCommandDir, { recursive: true });
      await fs.writeFile(
        path.join(legacyCommandDir, 'proposal.md'),
        'old command content'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should show detected tools message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tools detected from legacy artifacts')
      );

      // Should show Claude Code being set up
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Claude Code')
      );

      // Should show getting started message for newly configured tools
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Getting started')
      );
      // Claude has precise skill invocation metadata.
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('/opsx-propose')
      );

      // Skills should be created
      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const skillExists = await FileSystemUtils.fileExists(skillFile);
      expect(skillExists).toBe(true);

      // Legacy directory should be deleted
      const legacyDirExists = await FileSystemUtils.directoryExists(legacyCommandDir);
      expect(legacyDirExists).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should upgrade multiple legacy tools with --force', async () => {
      // Create legacy command directories for Claude and Cursor
      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'),
        'content'
      );

      await fs.mkdir(path.join(testDir, '.cursor', 'commands'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.cursor', 'commands', 'opsx-proposal.md'),
        'content'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should detect both tools
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tools detected from legacy artifacts')
      );

      // Both tools should have skills created
      const claudeSkillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const cursorSkillFile = path.join(testDir, '.cursor', 'skills', 'opsx-explore', 'SKILL.md');

      expect(await FileSystemUtils.fileExists(claudeSkillFile)).toBe(true);
      expect(await FileSystemUtils.fileExists(cursorSkillFile)).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should not upgrade legacy tools already configured', async () => {
      // Set up a configured Claude tool with skills
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'existing skill'
      );

      // Also create legacy directory (simulating partial upgrade)
      const legacyCommandDir = path.join(testDir, '.claude', 'commands', 'opsx');
      await fs.mkdir(legacyCommandDir, { recursive: true });
      await fs.writeFile(
        path.join(legacyCommandDir, 'proposal.md'),
        'old command'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Legacy cleanup should happen
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed .claude/commands/opsx/')
      );

      // Should NOT show "Tools detected from legacy artifacts" because claude is already configured
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasDetectedMessage = calls.some(call =>
        call.includes('Tools detected from legacy artifacts')
      );
      expect(hasDetectedMessage).toBe(false);

      // Should update existing skills (not "Getting started" for newly configured)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated: Claude Code')
      );

      consoleSpy.mockRestore();
    });

    it('should upgrade only unconfigured legacy tools when mixed', async () => {
      // Set up configured Claude tool with skills
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(
        path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'),
        'existing skill'
      );

      // Create legacy commands for both Claude (configured) and Cursor (not configured)
      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'),
        'content'
      );

      await fs.mkdir(path.join(testDir, '.cursor', 'commands'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.cursor', 'commands', 'opsx-proposal.md'),
        'content'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Should detect Cursor as a legacy tool to upgrade (but not Claude)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tools detected from legacy artifacts')
      );

      // Cursor skills should be created
      const cursorSkillFile = path.join(testDir, '.cursor', 'skills', 'opsx-explore', 'SKILL.md');
      expect(await FileSystemUtils.fileExists(cursorSkillFile)).toBe(true);

      // Should show "Getting started" for newly configured Cursor
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Getting started')
      );

      consoleSpy.mockRestore();
    });

    it('should not show getting started message when no new tools configured', async () => {
      // Set up a configured tool (no legacy artifacts)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md'),
        'old skill'
      );

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should NOT show "Getting started" message
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasGettingStarted = calls.some(call =>
        call.includes('Getting started')
      );
      expect(hasGettingStarted).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should create only effective profile skills when upgrading legacy tools', async () => {
      // Create legacy command directory
      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'),
        'content'
      );

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Default profile is core, so only core workflows should be generated.
      const skillNames = [
        'opsx-propose',
        'opsx-explore',
        'opsx-apply-change',
        'opsx-archive-change',
      ];

      const skillsDir = path.join(testDir, '.claude', 'skills');
      for (const skillName of skillNames) {
        const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
        const exists = await FileSystemUtils.fileExists(skillFile);
        expect(exists).toBe(true);
      }

      const nonCoreSkill = path.join(skillsDir, 'opsx-new-change', 'SKILL.md');
      expect(await FileSystemUtils.fileExists(nonCoreSkill)).toBe(false);
    });

    it('should NOT create commands when upgrading legacy tools (skills-only)', async () => {
      // Create legacy command directory
      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'),
        'content'
      );

      // Create update command with force option
      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // Skills-only: no new opsx commands are created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'opsx');
      const exploreCmd = path.join(commandsDir, 'explore.md');
      expect(await FileSystemUtils.fileExists(exploreCmd)).toBe(false);

      // Skills should be created
      const skillsDir = path.join(testDir, '.claude', 'skills');
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md')
      )).toBe(true);
    });

    it('should install all 6 registry workflows when upgrading legacy tools (skills-only)', async () => {
      setMockConfig({
        featureFlags: {},
      });

      await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.claude', 'commands', 'opsx', 'proposal.md'),
        'content'
      );

      const forceUpdateCommand = new UpdateCommand({ force: true });
      await forceUpdateCommand.execute(testDir);

      // All 6 registry workflows should be installed as skills (snack is skill-only)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      const expectedSkills = [
        'opsx-explore', 'opsx-propose', 'opsx-apply-change',
        'opsx-archive-change', 'opsx-build', 'opsx-snack',
      ];
      for (const skill of expectedSkills) {
        expect(await FileSystemUtils.fileExists(
          path.join(skillsDir, skill, 'SKILL.md')
        )).toBe(true);
      }

      // Skills-only: no command files are generated
      const commandsDir = path.join(testDir, '.claude', 'commands', 'opsx');
      for (const cmd of ['explore.md', 'propose.md', 'apply.md', 'archive.md', 'bootstrap.md']) {
        expect(await FileSystemUtils.fileExists(
          path.join(commandsDir, cmd)
        )).toBe(false);
      }
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // All 6 registry workflows should be created (snack is skill-only)
      const expectedSkills = [
        'opsx-explore', 'opsx-propose', 'opsx-apply-change',
        'opsx-archive-change', 'opsx-build', 'opsx-snack',
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // Skills should be created
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md')
      )).toBe(true);

      // Commands should NOT be created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'opsx');
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');

      await updateCommand.execute(testDir);

      // Skills-only surface ignores stale delivery=commands
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md')
      )).toBe(true);

      // Commands should NOT be created
      const commandsDir = path.join(testDir, '.claude', 'commands', 'opsx');
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');

      await expect(updateCommand.execute(testDir)).resolves.toBeUndefined();

      // Skills remain — skills-only surface does not strip skills
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-explore', 'SKILL.md')
      )).toBe(true);
    });

    it('should apply config sync when templates are up to date (skills-only)', async () => {
      setMockConfig({
        featureFlags: {},
      });

      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      await fs.mkdir(path.dirname(skillFile), { recursive: true });
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8')) as { version: string };
      await fs.writeFile(
        skillFile,
        `---
name: opsx-explore
metadata:
  generatedBy: "${packageJson.version}"
---
content
`
      );

      await updateCommand.execute(testDir);

      expect(await FileSystemUtils.fileExists(skillFile)).toBe(true);
    });

    it('should require cleanup approval for a commands-only legacy install', async () => {
      const commandFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
      await fs.mkdir(path.dirname(commandFile), { recursive: true });
      await fs.writeFile(commandFile, 'existing command');

      await expect(updateCommand.execute(testDir)).rejects.toThrow(/cleanup confirmation/);
      expect(await fs.readFile(commandFile, 'utf-8')).toBe('existing command');
    });

    it('should remove workflows not in registry during update sync (skills-only)', async () => {
      setMockConfig({
        featureFlags: {},
      });

      // Set up tool with extra workflows not in registry
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');

      // Add a removed workflow skill
      await fs.mkdir(path.join(skillsDir, 'opsx-new-change'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-new-change', 'SKILL.md'), 'old');
      // Pre-existing command file for one of the 7 explicitly-removed workflows
      // (new, continue, ff, sync, bulk-archive, verify, onboard) IS cleaned up
      // by cleanupExpandedWorkflowRemnants.
      const extraCommandFile = path.join(testDir, '.claude', 'commands', 'opsx', 'new.md');
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');
      const legacyCommand = await writeLegacyCodexCommand('explore');
      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-propose', 'SKILL.md')
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
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');
      const legacyCommand = await writeLegacyCodexCommand('explore');

      await updateCommand.execute(testDir);

      // Skills-only ignores stale delivery=commands
      expect(await FileSystemUtils.fileExists(
        path.join(skillsDir, 'opsx-apply-change', 'SKILL.md')
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
        path.join(testDir, '.codex', 'skills', 'opsx-explore', 'SKILL.md')
      )).toBe(false);
      expect(await FileSystemUtils.fileExists(legacyCommand)).toBe(true);
    });

    it('should show codex getting-started guidance with precise managed skill names', async () => {
      setMockConfig({
        featureFlags: {},
      });

      const consoleSpy = vi.spyOn(console, 'log');
      const forceUpdateCommand = new UpdateCommand({ force: true });
      vi.spyOn(forceUpdateCommand as any, 'handleLegacyCleanup').mockResolvedValue(['codex']);

      await forceUpdateCommand.execute(testDir);

      const calls = consoleSpy.mock.calls.map((call) => call.map((arg) => String(arg)).join(' '));
      expect(calls.some((call) => call.includes('$opsx-propose'))).toBe(true);
      expect(calls.some((call) => call.includes('$opsx-explore'))).toBe(true);
      expect(calls.some((call) => call.includes('$opsx-apply-change'))).toBe(true);
      expect(calls.some((call) => call.includes('/opsx:new'))).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('new tool detection', () => {
    it('should detect new tool directories not currently configured', async () => {
      // Set up a configured Claude tool
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'), 'old');

      // Create a Cursor directory (not configured — no skills)
      await fs.mkdir(path.join(testDir, '.cursor'), { recursive: true });

      const consoleSpy = vi.spyOn(console, 'log');

      await updateCommand.execute(testDir);

      // Should detect Cursor as a new tool
      const calls = consoleSpy.mock.calls.map(call =>
        call.map(arg => String(arg)).join(' ')
      );
      const hasNewToolMessage = calls.some(call =>
        call.includes("Detected new tool: Cursor. Run 'opsx setup' to add it.")
      );
      expect(hasNewToolMessage).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should consolidate multiple new tools into one message', async () => {
      // Set up a configured Claude tool
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'), 'old');

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
      expect(consolidatedCalls[0]).toContain("Run 'opsx setup' to add them.");

      const repeatedSingularCalls = calls.filter(call =>
        call.includes('Detected new tool:')
      );
      expect(repeatedSingularCalls).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should not show new tool message when no new tools detected', async () => {
      // Set up a configured tool (only Claude, no other tool directories)
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');

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
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'), 'content');
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-apply-change'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'opsx-apply-change', 'SKILL.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).toContain('explore');
      expect(workflows).toContain('apply');
      expect(workflows).not.toContain('propose');
    });

    it('should return union of workflows across multiple tools', async () => {
      // Claude has explore
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(claudeSkillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(claudeSkillsDir, 'opsx-explore', 'SKILL.md'), 'content');

      // Cursor has apply
      const cursorSkillsDir = path.join(testDir, '.cursor', 'skills');
      await fs.mkdir(path.join(cursorSkillsDir, 'opsx-apply-change'), { recursive: true });
      await fs.writeFile(path.join(cursorSkillsDir, 'opsx-apply-change', 'SKILL.md'), 'content');

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
      const commandsDir = path.join(testDir, '.claude', 'commands', 'opsx');
      await fs.mkdir(commandsDir, { recursive: true });
      await fs.writeFile(path.join(commandsDir, 'explore.md'), 'content');

      const workflows = scanInstalledWorkflows(testDir, ['claude']);
      expect(workflows).not.toContain('explore');
    });
  });

  describe('tools output', () => {
    it('should list affected tools in output', async () => {
      const skillsDir = path.join(testDir, '.claude', 'skills');
      await fs.mkdir(path.join(skillsDir, 'opsx-explore'), { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'opsx-explore', 'SKILL.md'), 'old');

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
