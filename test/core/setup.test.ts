import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { parse as parseYaml } from 'yaml';
import { SETUP_ARCHITECTURE_FILE_MANIFEST, SetupCommand } from '../../src/core/setup.js';
import { getCommandSlug } from '../../src/core/shared/index.js';
import { saveGlobalConfig, getGlobalConfig } from '../../src/core/global-config.js';

const { confirmMock, inputMock, showWelcomeScreenMock, searchableMultiSelectMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  inputMock: vi.fn(),
  showWelcomeScreenMock: vi.fn().mockResolvedValue(undefined),
  searchableMultiSelectMock: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
  input: inputMock,
}));

vi.mock('../../src/ui/welcome-screen.js', () => ({
  showWelcomeScreen: showWelcomeScreenMock,
}));

vi.mock('../../src/prompts/searchable-multi-select.js', () => ({
  searchableMultiSelect: searchableMultiSelectMock,
}));

describe('SetupCommand', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opsx-setup-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid reading real config
    configTempDir = path.join(os.tmpdir(), `opsx-config-setup-${Date.now()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;

    // Mock console.log to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => { });
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    inputMock.mockReset();
    inputMock.mockResolvedValue('');
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  async function writeLegacyCodexCommand(workflowSlug: string): Promise<string> {
    const codexHome = process.env.CODEX_HOME ?? path.join(testDir, 'codex-home');
    process.env.CODEX_HOME = codexHome;
    const promptFile = path.join(path.resolve(codexHome), 'prompts', `opsx-${workflowSlug}.md`);
    await fs.mkdir(path.dirname(promptFile), { recursive: true });
    await fs.writeFile(promptFile, '# legacy codex command', 'utf-8');
    return promptFile;
  }

  describe('execute with --tools flag', () => {
    it('should create OPSX directory structure', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const opsxPath = path.join(testDir, '.opsx');
      expect(await directoryExists(opsxPath)).toBe(true);
      expect(await directoryExists(path.join(opsxPath, 'specs'))).toBe(true);
      expect(await directoryExists(path.join(opsxPath, 'changes'))).toBe(true);
      expect(await directoryExists(path.join(opsxPath, 'changes', 'archive'))).toBe(true);
    });

    it('should create config.yaml in non-interactive mode without --force', async () => {
      const initCommand = new SetupCommand({ tools: 'claude' });
      vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(false);

      await initCommand.execute(testDir);

      expect(await fileExists(path.join(testDir, '.opsx', 'config.yaml'))).toBe(true);
    });

    it('should create config.yaml with functional defaults', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const configPath = path.join(testDir, '.opsx', 'config.yaml');
      expect(await fileExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = parseYaml(content);
      expect(content).toContain('schema: spec-driven');
      expect(content).toContain('optimization:');
      expect(content).toContain('  enabled: true');
      expect(content).toContain('  optRetries: 2');
      expect(content).toContain('apply:');
      expect(content).toContain('  defaultIsolation: ask  # ask / branch / worktree / none');
      expect(content).toContain('git:');
      expect(content).toContain('  merge:');
      expect(content).toContain('    strategy: no-ff');
      expect(content).toContain('  branch:');
      expect(content).toContain('    deleteAfterArchive: false');
      expect(content).not.toContain('autoCommit');
      expect(content).not.toContain('convention: opsx-archive');
      expect(content).not.toContain('convention: opsx-merge-summary');
      expect(content).not.toContain('messageFrom');
      expect(parsed.git).not.toHaveProperty('autoCommit');
      expect(parsed.git).not.toHaveProperty('archive');
      expect(parsed.git.merge).not.toHaveProperty('commitMessage');
      expect(parsed.git.merge.strategy).toBe('no-ff');
      expect(parsed.git.branch.deleteAfterArchive).toBe(false);
      expect(parsed).not.toHaveProperty('propose');
      expect(parsed.apply).toEqual({
        defaultIsolation: 'ask',
      });
      expect(parsed).not.toHaveProperty('rules');
      expect(parsed).not.toHaveProperty('context');
      expect(parsed).not.toHaveProperty('docLanguage');
    });

    it('should write proseLanguage to config.yaml during interactive init', async () => {
      const initCommand = new SetupCommand({ force: true });
      vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
      vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);
      inputMock.mockResolvedValue('zh-CN');

      await initCommand.execute(testDir);

      const configPath = path.join(testDir, '.opsx', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('schema: spec-driven');
      expect(content).toContain('proseLanguage: zh-CN');
    });

    it('should create all 6 registry skills for Claude Code by default', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // All 6 registry workflows: propose, explore, apply, archive, build, snack
      const expectedSkillNames = [
        'opsx-propose',
        'opsx-explore',
        'opsx-apply-change',
        'opsx-archive-change',
        'opsx-build',
        'opsx-snack',
      ];

      for (const skillName of expectedSkillNames) {
        const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(true);

        const content = await fs.readFile(skillFile, 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('name:');
        expect(content).toContain('description:');
      }

      // Removed workflow skills should NOT be created
      const removedSkillNames = [
        'opsx-new-change',
        'opsx-continue-change',
        'opsx-ff-change',
        'opsx-sync-specs',
        'opsx-bulk-archive-change',
        'opsx-verify-change',
      ];

      for (const skillName of removedSkillNames) {
        const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(false);
      }
    });

    it('should NOT create slash command templates for Claude Code (skills-only)', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Skills-only: no slash command files are generated
      const slashCommandNames = [
        'opsx/propose.md',
        'opsx/explore.md',
        'opsx/apply.md',
        'opsx/archive.md',
        '.opsx/bootstrap.md',
      ];

      for (const cmdName of slashCommandNames) {
        const cmdFile = path.join(testDir, '.claude', 'commands', cmdName);
        expect(await fileExists(cmdFile)).toBe(false);
      }
    });

    it('should create skills in Cursor skills directory', async () => {
      const initCommand = new SetupCommand({ tools: 'cursor', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.cursor', 'skills', 'opsx-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should create skills in Windsurf skills directory', async () => {
      const initCommand = new SetupCommand({ tools: 'windsurf', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.windsurf', 'skills', 'opsx-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should configure codex as skills-only by default', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const initCommand = new SetupCommand({ tools: 'codex', force: true });

      await initCommand.execute(testDir);

      expect(await fileExists(
        path.join(testDir, '.codex', 'skills', 'opsx-explore', 'SKILL.md')
      )).toBe(true);
      expect(await fileExists(
        path.join(path.resolve(process.env.CODEX_HOME ?? path.join(testDir, 'codex-home')), 'prompts', 'opsx-explore.md')
      )).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('$opsx-propose "your idea"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('refreshed skills to take effect')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('/opsx:propose')
      );
    });

    it('should keep skills-only init guidance for Claude Code', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const initCommand = new SetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Skills-only: guidance uses neutral skill invocation (no /opsx:*)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('refreshed skills to take effect')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('slash commands to take effect')
      );
    });

    it('should keep codex on skills and not remove legacy command files (skills-only surface)', async () => {
      saveGlobalConfig({
        featureFlags: {},
      });
      const legacyCommand = await writeLegacyCodexCommand('explore');
      const initCommand = new SetupCommand({ tools: 'codex', force: true });

      await initCommand.execute(testDir);

      expect(await fileExists(
        path.join(testDir, '.codex', 'skills', 'opsx-explore', 'SKILL.md')
      )).toBe(true);
      // Skills-only: legacy command files are not actively removed
      expect(await fileExists(legacyCommand)).toBe(true);
    });

    it('should create skills for multiple tools at once', async () => {
      const initCommand = new SetupCommand({ tools: 'claude,cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'opsx-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should select all tools with --tools all option', async () => {
      const initCommand = new SetupCommand({ tools: 'all', force: true });

      await initCommand.execute(testDir);

      // Check a few representative tools
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'opsx-explore', 'SKILL.md');
      const windsurfSkill = path.join(testDir, '.windsurf', 'skills', 'opsx-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
      expect(await fileExists(windsurfSkill)).toBe(true);
    });

    it('should skip tool configuration with --tools none option', async () => {
      const initCommand = new SetupCommand({ tools: 'none', force: true });

      await initCommand.execute(testDir);

      // Should create the durable core but no skills.
      const opsxPath = path.join(testDir, '.opsx');
      expect(await directoryExists(path.join(opsxPath, 'architecture'))).toBe(true);
      expect(await directoryExists(path.join(opsxPath, 'specs'))).toBe(true);
      expect(await directoryExists(path.join(opsxPath, 'changes'))).toBe(true);
      expect(await directoryExists(path.join(opsxPath, 'references'))).toBe(true);
      expect(await fileExists(path.join(opsxPath, 'config.yaml'))).toBe(true);
      expect(vi.mocked(console.log).mock.calls.flat().join('\n')).not.toContain('/opsx:');

      // No tool-specific directories should be created
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      expect(await directoryExists(claudeSkillsDir)).toBe(false);
    });

    it('should throw error for invalid tool names', async () => {
      const initCommand = new SetupCommand({ tools: 'invalid-tool', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/Invalid tool\(s\): invalid-tool/);
    });

    it('should handle comma-separated tool names with spaces', async () => {
      const initCommand = new SetupCommand({ tools: 'claude, cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'opsx-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should reject combining reserved keywords with explicit tool ids', async () => {
      const initCommand = new SetupCommand({ tools: 'all,claude', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(
        /Cannot combine reserved values "all" or "none" with specific tool IDs/
      );
    });

    it('should not create config.yaml if it already exists', async () => {
      // Pre-create config.yaml
      const opsxDir = path.join(testDir, '.opsx');
      await fs.mkdir(opsxDir, { recursive: true });
      const configPath = path.join(opsxDir, 'config.yaml');
      const existingContent = 'schema: custom-schema\n';
      await fs.writeFile(configPath, existingContent);

      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toBe(existingContent);
    });

    it('should handle non-existent target directory', async () => {
      const newDir = path.join(testDir, 'new-project');
      const initCommand = new SetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(newDir);

      const opsxPath = path.join(newDir, '.opsx');
      expect(await directoryExists(opsxPath)).toBe(true);
    });

    it('should work in extend mode (re-running init)', async () => {
      const initCommand1 = new SetupCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      // Run init again with a different tool
      const initCommand2 = new SetupCommand({ tools: 'cursor', force: true });
      await initCommand2.execute(testDir);

      // Both tools should have skills
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'opsx-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should update existing config.yaml with proseLanguage in extend mode', async () => {
      const opsxDir = path.join(testDir, '.opsx');
      await fs.mkdir(opsxDir, { recursive: true });
      await fs.writeFile(
        path.join(opsxDir, 'config.yaml'),
        `schema: spec-driven
context: |
  Existing project context
`
      );

      const initCommand = new SetupCommand({ force: true });
      vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
      vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);
      inputMock.mockResolvedValue('ja');

      await initCommand.execute(testDir);

      const content = await fs.readFile(path.join(opsxDir, 'config.yaml'), 'utf-8');
      expect(content).toContain('proseLanguage: ja');
      expect(content).toContain('Existing project context');
    });

    it('should refresh skills on re-run for the same tool', async () => {
      const initCommand1 = new SetupCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const originalContent = await fs.readFile(skillFile, 'utf-8');

      // Modify the file
      await fs.writeFile(skillFile, '# Modified content\n');

      // Run init again
      const initCommand2 = new SetupCommand({ tools: 'claude', force: true });
      await initCommand2.execute(testDir);

      const newContent = await fs.readFile(skillFile, 'utf-8');
      expect(newContent).toBe(originalContent);
    });
  });

  describe('skill content validation', () => {
    it('should generate valid SKILL.md with YAML frontmatter', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should have YAML frontmatter
      expect(content).toMatch(/^---\n/);
      expect(readSkillFrontmatter(content)).toMatchObject({ name: 'opsx-explore' });
      expect(content).toContain('description:');
      expect(content).toContain('license:');
      expect(content).toContain('compatibility:');
      expect(content).toContain('metadata:');
      expect(content).toMatch(/---\n\n/); // End of frontmatter
    });

    it('should include explore mode instructions', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('Enter explore mode');
      expect(content).toContain('thinking partner');
    });

    it('should include propose skill instructions', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-propose', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(readSkillFrontmatter(content)).toMatchObject({ name: 'opsx-propose' });
    });

    it('should include apply-change skill instructions', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-apply-change', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(readSkillFrontmatter(content)).toMatchObject({ name: 'opsx-apply-change' });
      expect(content).toMatch(/preserve.*canonical|template.*heading/i);
    });

    it('should embed generatedBy version in skill files', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should contain generatedBy field with a version string
      expect(content).toMatch(/generatedBy:\s*["']?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?["']?/);
    });
  });

  describe('command generation (skills-only)', () => {
    it('should NOT generate Claude Code slash commands (skills-only)', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate Cursor commands (skills-only)', async () => {
      const initCommand = new SetupCommand({ tools: 'cursor', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.cursor', 'commands', 'opsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate mapped bootstrap command path (skills-only)', async () => {
      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const bootstrapCmd = path.join(testDir, '.claude', 'commands', 'opsx', getCommandSlug('build') + '.md');
      const legacyBootstrapCmd = path.join(testDir, '.claude', 'commands', 'opsx', 'build.md');
      expect(await fileExists(bootstrapCmd)).toBe(false);
      expect(await fileExists(legacyBootstrapCmd)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error for insufficient permissions', async () => {
      // Mock the permission check to fail
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);

      const originalWriteFile = fs.writeFile;
      vi.spyOn(fs, 'writeFile').mockImplementation(
        async (filePath: any, ...args: any[]) => {
          if (
            typeof filePath === 'string' &&
            filePath.includes('.opsx-test-')
          ) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile.call(fs, filePath, ...args);
        }
      );

      const initCommand = new SetupCommand({ tools: 'claude', force: true });
      await expect(initCommand.execute(readOnlyDir)).rejects.toThrow(/Insufficient permissions/);
    });

    it('should require --tools in non-interactive mode even when tools are detected', async () => {
      await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
      const setupCommand = new SetupCommand({ interactive: false });

      await expect(setupCommand.execute(testDir)).rejects.toThrow(/Non-interactive setup requires --tools/);
    });
  });

  describe('tool-specific skills (skills-only, no adapters)', () => {
    it('should NOT generate Gemini CLI command TOML files', async () => {
      const initCommand = new SetupCommand({ tools: 'gemini', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.gemini', 'commands', 'opsx', 'explore.toml');
      expect(await fileExists(cmdFile)).toBe(false);

      // Skills still generated
      const skillFile = path.join(testDir, '.gemini', 'skills', 'opsx-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should NOT generate Windsurf command workflows', async () => {
      const initCommand = new SetupCommand({ tools: 'windsurf', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.windsurf', 'workflows', 'opsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate Continue prompt files', async () => {
      const initCommand = new SetupCommand({ tools: 'continue', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.continue', 'prompts', 'opsx-explore.prompt');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate Cline workflow files', async () => {
      const initCommand = new SetupCommand({ tools: 'cline', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.clinerules', 'workflows', 'opsx-explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate GitHub Copilot prompt files', async () => {
      const initCommand = new SetupCommand({ tools: 'github-copilot', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.github', 'prompts', 'opsx-explore.prompt.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });
  });
});

describe('OPSX skeleton generation', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opsx-opsx-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    configTempDir = path.join(os.tmpdir(), `opsx-config-opsx-${Date.now()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    inputMock.mockReset();
    inputMock.mockResolvedValue('');
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should generate the v1 Semantic Model from an explicit file manifest', async () => {
    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const architecture = path.join(testDir, '.opsx', 'architecture');
    expect(SETUP_ARCHITECTURE_FILE_MANIFEST.map((file) => file.relativePath)).toEqual([
      'specification.c4',
      'model.c4',
      'relations.c4',
      'views.c4',
    ]);
    for (const file of SETUP_ARCHITECTURE_FILE_MANIFEST) {
      expect(await fileExists(path.join(architecture, file.relativePath))).toBe(true);
      expect(typeof file.render).toBe('function');
    }
    expect(await directoryExists(path.join(testDir, '.opsx', 'specs'))).toBe(true);
    expect(await directoryExists(path.join(architecture, 'domains'))).toBe(false);

    const specification = await fs.readFile(path.join(architecture, 'specification.c4'), 'utf-8');
    expect(specification).toContain("opsx {\n  languageVersion '1'\n}");
    expect(specification).toMatch(/element project\s*\{[\s\S]*root true[\s\S]*contract required/);
    for (const relation of ['invokes', 'produces', 'consumes', 'precedes', 'constrains', 'validates']) {
      expect(specification).toContain(`relationship ${relation}`);
    }
    expect(specification).not.toContain('belongs_to');

    const model = await fs.readFile(path.join(architecture, 'model.c4'), 'utf-8');
    expect(model).toMatch(/projectRoot = project '[^']+' '[^']+'/);
    expect(model).toContain("elementId 'project.root'");
    expect(model).not.toMatch(/projectRoot\s*=.*\{[\s\S]*?\n\s{4}\w+\s*=/);

    const relations = await fs.readFile(path.join(architecture, 'relations.c4'), 'utf-8');
    expect(relations).toBe('model {\n}\n');

    const views = await fs.readFile(path.join(architecture, 'views.c4'), 'utf-8');
    expect(views).toContain('view index');
    expect(views).toContain('view refinement of projectRoot');
  });

  it('should not generate OPSX YAML files', async () => {
    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    expect(await fileExists(path.join(testDir, '.opsx', 'project.opsx.yaml'))).toBe(false);
    expect(await fileExists(path.join(testDir, '.opsx', 'project.opsx.relations.yaml'))).toBe(false);
  });

  it('should infer the architecture title from package.json', async () => {
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: '@scope/my-awesome-project' }));
    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const views = await fs.readFile(path.join(testDir, '.opsx', 'architecture', 'views.c4'), 'utf-8');
    expect(views).toContain("title '@scope/my-awesome-project Architecture'");
  });

  it('should not overwrite existing LikeC4 files in extend mode', async () => {
    const architecture = path.join(testDir, '.opsx', 'architecture');
    await fs.mkdir(architecture, { recursive: true });
    const existingContent = "specification { element existing }\n";
    await fs.writeFile(path.join(architecture, 'specification.c4'), existingContent);

    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    expect(await fs.readFile(path.join(architecture, 'specification.c4'), 'utf-8')).toBe(existingContent);
  });

  it('should preserve existing Architecture, Specs, config, and user files', async () => {
    const opsx = path.join(testDir, '.opsx');
    const architecture = path.join(opsx, 'architecture');
    const spec = path.join(opsx, 'specs', 'owned', 'spec.md');
    await fs.mkdir(architecture, { recursive: true });
    await fs.mkdir(path.dirname(spec), { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), 'custom model\n');
    await fs.writeFile(spec, 'custom spec\n');
    await fs.writeFile(path.join(opsx, 'config.yaml'), 'schema: spec-driven\ncontext: keep\n');
    await fs.writeFile(path.join(opsx, 'user.txt'), 'keep\n');

    const setupCommand = new SetupCommand({ tools: 'none', force: true });
    await setupCommand.execute(testDir);

    await expect(fs.readFile(path.join(architecture, 'model.c4'), 'utf8')).resolves.toBe('custom model\n');
    await expect(fs.readFile(spec, 'utf8')).resolves.toBe('custom spec\n');
    await expect(fs.readFile(path.join(opsx, 'config.yaml'), 'utf8')).resolves.toBe('schema: spec-driven\ncontext: keep\n');
    await expect(fs.readFile(path.join(opsx, 'user.txt'), 'utf8')).resolves.toBe('keep\n');
  });

  it('should show Project Build guidance when build is installed and non-extend mode', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    const consoleSpy = vi.spyOn(console, 'log');
    const setupCommand = new SetupCommand({ tools: 'claude', force: true });
    await setupCommand.execute(testDir);

    const logCalls = consoleSpy.mock.calls.flat().map(String);
    const buildLine = logCalls.find((line) =>
      line.includes('Next: run') && line.includes('opsx-build')
    );
    expect(buildLine).toBeDefined();
    expect(buildLine).toContain('/opsx-build');
    expect(buildLine).toContain('build your project OPSX');
  });

  it('should show Project Build guidance for the fixed workflow set', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    const consoleSpy = vi.spyOn(console, 'log');
    const setupCommand = new SetupCommand({ tools: 'claude', force: true });
    await setupCommand.execute(testDir);

    const logCalls = consoleSpy.mock.calls.flat().map(String);
    const buildLine = logCalls.find((line) =>
      line.includes('Next: run') && line.includes('opsx-build')
    );
    expect(buildLine).toBeDefined();
  });

  it('should not show bootstrap guidance in extend mode', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    // Pre-create opsx to make it extend mode
    await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });

    const consoleSpy = vi.spyOn(console, 'log');
    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const logCalls = consoleSpy.mock.calls.flat().map(String);
    const bootstrapLine = logCalls.find((line) =>
      line.includes('Next: run') && line.includes('bootstrap')
    );
    expect(bootstrapLine).toBeUndefined();
  });
});

describe('SetupCommand - profile and detection features', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opsx-init-profile-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid polluting real config
    configTempDir = path.join(os.tmpdir(), `opsx-config-test-${Date.now()}`);
    await fs.mkdir(configTempDir, { recursive: true });
    process.env.XDG_CONFIG_HOME = configTempDir;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
    inputMock.mockReset();
    inputMock.mockResolvedValue('');
    showWelcomeScreenMock.mockClear();
    searchableMultiSelectMock.mockReset();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(configTempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should install all 6 workflows regardless of obsolete profile config', async () => {
    // Set global config with obsolete profile/workflows fields
    saveGlobalConfig({
      featureFlags: {},
      delivery: 'both',
    } as any);

    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // All 6 registry workflows should be created
    const expectedSkillNames = [
      'opsx-propose',
      'opsx-explore',
      'opsx-apply-change',
      'opsx-archive-change',
      'opsx-build',
      'opsx-snack',
    ];

    for (const skillName of expectedSkillNames) {
      const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    }
  });

  it('should reject --profile flag with friendly error', async () => {
    // --profile is now rejected at CLI level, but test SetupCommand directly
    const initCommand = new SetupCommand({
      tools: 'claude',
      force: true,
    });

    // SetupCommand no longer accepts profile — just verify it installs all 5 workflows
    await initCommand.execute(testDir);

    const proposeSkill = path.join(testDir, '.claude', 'skills', 'opsx-propose', 'SKILL.md');
    expect(await fileExists(proposeSkill)).toBe(true);
  });

  it('should not use detected tools in non-interactive mode without --tools', async () => {
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });

    const setupCommand = new SetupCommand({ interactive: false, force: true });
    await expect(setupCommand.execute(testDir)).rejects.toThrow(/Non-interactive setup requires --tools/);
  });

  it('should require explicit approval before cleaning legacy artifacts in non-interactive mode', async () => {
    const legacyDir = path.join(testDir, '.opencode', 'command');
    const legacyFile = path.join(legacyDir, 'opsx-propose.md');
    await fs.mkdir(legacyDir, { recursive: true });
    await fs.writeFile(legacyFile, 'legacy content');

    const setupCommand = new SetupCommand({ tools: 'opencode' });
    await expect(setupCommand.execute(testDir)).rejects.toThrow(/cleanup confirmation/);

    expect(await fs.readFile(legacyFile, 'utf8')).toBe('legacy content');
    expect(await directoryExists(path.join(testDir, '.opsx'))).toBe(false);
    expect(await directoryExists(path.join(testDir, '.opencode', 'skills'))).toBe(false);
  });

  it('should preselect configured tools but not directory-detected tools in extend mode', async () => {
    // Simulate existing OPSX project (extend mode).
    await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });

    // Configured with OPSX
    const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'opsx-explore');
    await fs.mkdir(claudeSkillDir, { recursive: true });
    await fs.writeFile(path.join(claudeSkillDir, 'SKILL.md'), 'configured');

    // Directory detected only (not configured with OPSX)
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['claude']);

    const initCommand = new SetupCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean; detected?: boolean }> }];

    const claude = choices.find((choice) => choice.value === 'claude');
    const githubCopilot = choices.find((choice) => choice.value === 'github-copilot');

    expect(claude?.preSelected).toBe(true);
    expect(githubCopilot?.preSelected).toBe(false);
    expect(githubCopilot?.detected).toBe(true);
  });

  it('should preselect detected tools for first-time interactive setup', async () => {
    // First-time init: no opsx/ directory and no configured OPSX skills.
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['github-copilot']);

    const initCommand = new SetupCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);

    await initCommand.execute(testDir);

    expect(searchableMultiSelectMock).toHaveBeenCalledTimes(1);
    const [{ choices }] = searchableMultiSelectMock.mock.calls[0] as [{ choices: Array<{ value: string; preSelected?: boolean }> }];
    const githubCopilot = choices.find((choice) => choice.value === 'github-copilot');

    expect(githubCopilot?.preSelected).toBe(true);
  });

  it('should ignore obsolete profile/workflows/delivery fields and install all 6 workflows', async () => {
    // Obsolete fields are stored as raw JSON; type cast bypasses the typed API for the test.
    const obsoleteConfig = {
      featureFlags: {},
      profile: 'core',
      workflows: ['explore'],
      delivery: 'both',
    } as unknown as Parameters<typeof saveGlobalConfig>[0];
    saveGlobalConfig(obsoleteConfig);

    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // All 6 workflows should be installed
    const expectedSkills = [
      'opsx-propose',
      'opsx-explore',
      'opsx-apply-change',
      'opsx-archive-change',
      'opsx-build',
      'opsx-snack',
    ];

    for (const skillName of expectedSkills) {
      const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    }
  });

  it('should install all 6 workflows in extend mode and remove managed command remnants', async () => {
    await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'commands', 'opsx'), { recursive: true });
    const legacyExploreCmd = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    await fs.writeFile(legacyExploreCmd, '# explore\n');

    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const commandFiles = ['explore.md', 'propose.md', 'apply.md', 'archive.md', 'bootstrap.md'];
    for (const cmd of commandFiles) {
      expect(await fileExists(path.join(testDir, '.claude', 'commands', 'opsx', cmd))).toBe(false);
    }
    expect(await fileExists(legacyExploreCmd)).toBe(false);

    // All 6 skills should exist (includes skill-only snack)
    const expectedSkills = [
      'opsx-explore', 'opsx-propose', 'opsx-apply-change',
      'opsx-archive-change', 'opsx-build', 'opsx-snack',
    ];
    for (const skill of expectedSkills) {
      expect(await fileExists(path.join(testDir, '.claude', 'skills', skill, 'SKILL.md'))).toBe(true);
    }
  });

  it('should install all 6 workflows in interactive mode without profile prompts', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    const initCommand = new SetupCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
    vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);

    await initCommand.execute(testDir);

    expect(showWelcomeScreenMock).toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();

    // All 6 workflows should be installed
    const expectedSkills = [
      'opsx-explore', 'opsx-propose', 'opsx-apply-change',
      'opsx-archive-change', 'opsx-build', 'opsx-snack',
    ];
    for (const skill of expectedSkills) {
      expect(await fileExists(path.join(testDir, '.claude', 'skills', skill, 'SKILL.md'))).toBe(true);
    }

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat().map(String);
    expect(logCalls.some((entry) => entry.includes('Applying custom profile'))).toBe(false);
  });

  it('should always generate skills only (no commands) regardless of stale delivery setting', async () => {
    const obsoleteConfig = {
      featureFlags: {},
      delivery: 'skills',
    } as unknown as Parameters<typeof saveGlobalConfig>[0];
    saveGlobalConfig(obsoleteConfig);

    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should exist
    const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    // Commands should NOT exist (skills-only surface)
    const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);
  });

  it('should always generate skills only even when stale delivery=commands is present', async () => {
    const obsoleteConfig = {
      featureFlags: {},
      delivery: 'commands',
    } as unknown as Parameters<typeof saveGlobalConfig>[0];
    saveGlobalConfig(obsoleteConfig);

    const initCommand = new SetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should exist (skills-only ignores stale delivery=commands)
    const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    // Commands should NOT exist
    const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);
  });

  it('should remove managed command remnants on re-init', async () => {
    const initCommand1 = new SetupCommand({ tools: 'claude', force: true });
    await initCommand1.execute(testDir);

    // Manually drop a stale command file (simulating legacy state)
    const cmdFile = path.join(testDir, '.claude', 'commands', 'opsx', 'explore.md');
    await fs.mkdir(path.dirname(cmdFile), { recursive: true });
    await fs.writeFile(cmdFile, '# stale\n');

    const initCommand2 = new SetupCommand({ tools: 'claude', force: true });
    await initCommand2.execute(testDir);

    expect(await fileExists(cmdFile)).toBe(false);

    const skillFile = path.join(testDir, '.claude', 'skills', 'opsx-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function readSkillFrontmatter(skillContent: string): unknown {
  const match = skillContent.match(/^---\n([\s\S]*?)\n---\n/);
  return parseYaml(match?.[1] ?? '');
}
