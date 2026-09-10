import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { parse as parseYaml } from 'yaml';
import { SETUP_MODEL_FILE_MANIFEST, SetupCommand } from '../../src/core/setup.js';
import { parseSemanticModel } from '../../src/core/model/parser.js';
import { modelRoot } from '../../src/core/model/paths.js';
import { validateSemanticModel } from '../../src/core/model/validator.js';
import { PARTITIONS } from '../../src/core/model/types.js';
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

const TEST_PROJECT_DEFINITION = 'Test project with an explicit identity and scope boundary.';
type TestSetupOptions = {
  tools?: string;
  force?: boolean;
  interactive?: boolean;
  projectDefinition?: string;
};

function createSetupCommand(options: TestSetupOptions = {}): SetupCommand {
  return new SetupCommand({ projectDefinition: TEST_PROJECT_DEFINITION, ...options });
}

describe('SetupCommand', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `xirang-setup-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid reading real config
    configTempDir = path.join(os.tmpdir(), `xirang-config-setup-${Date.now()}`);
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
    it('should create Xirang directory structure', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const xirangPath = path.join(testDir, '.xirang');
      expect(await directoryExists(xirangPath)).toBe(true);
      for (const partition of PARTITIONS) {
        expect(await directoryExists(path.join(xirangPath, 'model', partition))).toBe(true);
      }
      expect(await directoryExists(path.join(xirangPath, 'specs'))).toBe(false);
      expect(await directoryExists(path.join(xirangPath, 'changes'))).toBe(true);
      expect(await directoryExists(path.join(xirangPath, 'changes', 'archive'))).toBe(true);
    });

    it('should create config.yaml in non-interactive mode without --force', async () => {
      const initCommand = createSetupCommand({ tools: 'claude' });
      vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(false);

      await initCommand.execute(testDir);

      expect(await fileExists(path.join(testDir, '.xirang', 'config.yaml'))).toBe(true);
    });

    it('should create config.yaml with functional defaults', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      const configPath = path.join(testDir, '.xirang', 'config.yaml');
      expect(await fileExists(configPath)).toBe(true);

      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = parseYaml(content);
      expect(content).toContain('schema: semantic-model');
      expect(content).toContain('decomposition:');
      expect(content).toContain('  method: c4');
      expect(content).toContain('optimization:');
      expect(content).toContain('  enabled: true');
      expect(content).toContain('  directionLimit: 3');
      expect(content).toContain('  directionRetries: 2');
      expect(content).toContain('apply:');
      expect(content).toContain('  defaultIsolation: ask  # ask / branch / worktree / none');
      expect(content).toContain('git:');
      expect(content).toContain('  merge:');
      expect(content).toContain('    strategy: no-ff');
      expect(content).toContain('  branch:');
      expect(content).toContain('    deleteAfterArchive: false');
      expect(content).not.toContain('autoCommit');
      expect(content).not.toContain('convention: xirang-archive');
      expect(content).not.toContain('convention: opsx-merge-summary');
      expect(content).not.toContain('messageFrom');
      expect(parsed.git).not.toHaveProperty('autoCommit');
      expect(parsed.git).not.toHaveProperty('archive');
      expect(parsed.git.merge).not.toHaveProperty('commitMessage');
      expect(parsed.git.merge.strategy).toBe('no-ff');
      expect(parsed.git.branch.deleteAfterArchive).toBe(false);
      expect(parsed.decomposition).toEqual({ method: 'c4' });
      expect(parsed.decomposition).not.toHaveProperty('skill');
      expect(parsed).not.toHaveProperty('propose');
      expect(parsed.apply).toEqual({
        defaultIsolation: 'ask',
      });
      expect(parsed).not.toHaveProperty('rules');
      expect(parsed).not.toHaveProperty('context');
      expect(parsed).not.toHaveProperty('docLanguage');
    });

    it('should write proseLanguage to config.yaml during interactive init', async () => {
      const initCommand = createSetupCommand({ force: true });
      vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
      vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);
      inputMock.mockResolvedValue('zh-CN');

      await initCommand.execute(testDir);

      const configPath = path.join(testDir, '.xirang', 'config.yaml');
      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('schema: semantic-model');
      expect(content).toContain('proseLanguage: zh-CN');
    });

    it('should create all 6 registry skills for Claude Code by default', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // All 6 registry workflows: propose, explore, apply, archive, build, snack
      const expectedSkillNames = [
        'xirang-propose',
        'xirang-explore',
        'xirang-apply-change',
        'xirang-archive-change',
        'xirang-build',
        'xirang-snack',
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
        'xirang-verify-change',
      ];

      for (const skillName of removedSkillNames) {
        const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
        expect(await fileExists(skillFile)).toBe(false);
      }
    });

    it('should NOT create slash command templates for Claude Code (skills-only)', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Skills-only: no slash command files are generated
      const slashCommandNames = [
        'xirang/propose.md',
        'xirang/explore.md',
        'xirang/apply.md',
        'xirang/archive.md',
        '.xirang/bootstrap.md',
      ];

      for (const cmdName of slashCommandNames) {
        const cmdFile = path.join(testDir, '.claude', 'commands', cmdName);
        expect(await fileExists(cmdFile)).toBe(false);
      }
    });

    it('should create skills in Cursor skills directory', async () => {
      const initCommand = createSetupCommand({ tools: 'cursor', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.cursor', 'skills', 'xirang-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should create skills in Windsurf skills directory', async () => {
      const initCommand = createSetupCommand({ tools: 'windsurf', force: true });

      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.windsurf', 'skills', 'xirang-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should configure codex as skills-only by default', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const initCommand = createSetupCommand({ tools: 'codex', force: true });

      await initCommand.execute(testDir);

      expect(await fileExists(
        path.join(testDir, '.codex', 'skills', 'xirang-explore', 'SKILL.md')
      )).toBe(true);
      expect(await fileExists(
        path.join(path.resolve(process.env.CODEX_HOME ?? path.join(testDir, 'codex-home')), 'prompts', 'xirang-explore.md')
      )).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('$xirang-propose "your idea"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('refreshed skills to take effect')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('/xirang:propose')
      );
    });

    it('should keep skills-only init guidance for Claude Code', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const initCommand = createSetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(testDir);

      // Skills-only: guidance uses neutral skill invocation (no /xirang:*)
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
      const initCommand = createSetupCommand({ tools: 'codex', force: true });

      await initCommand.execute(testDir);

      expect(await fileExists(
        path.join(testDir, '.codex', 'skills', 'xirang-explore', 'SKILL.md')
      )).toBe(true);
      // Skills-only: legacy command files are not actively removed
      expect(await fileExists(legacyCommand)).toBe(true);
    });

    it('should create skills for multiple tools at once', async () => {
      const initCommand = createSetupCommand({ tools: 'claude,cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'xirang-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should select all tools with --tools all option', async () => {
      const initCommand = createSetupCommand({ tools: 'all', force: true });

      await initCommand.execute(testDir);

      // Check a few representative tools
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'xirang-explore', 'SKILL.md');
      const windsurfSkill = path.join(testDir, '.windsurf', 'skills', 'xirang-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
      expect(await fileExists(windsurfSkill)).toBe(true);
    });

    it('should skip tool configuration with --tools none option', async () => {
      const initCommand = createSetupCommand({ tools: 'none', force: true });

      await initCommand.execute(testDir);

      // Should create the durable core but no skills.
      const xirangPath = path.join(testDir, '.xirang');
      expect(await directoryExists(path.join(xirangPath, 'model', 'elements'))).toBe(true);
      expect(await directoryExists(path.join(xirangPath, 'changes'))).toBe(true);
      expect(await directoryExists(path.join(xirangPath, 'references'))).toBe(true);
      expect(await fileExists(path.join(xirangPath, 'config.yaml'))).toBe(true);
      expect(vi.mocked(console.log).mock.calls.flat().join('\n')).not.toContain('/xirang:');

      // No tool-specific directories should be created
      const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
      expect(await directoryExists(claudeSkillsDir)).toBe(false);
    });

    it('should throw error for invalid tool names', async () => {
      const initCommand = createSetupCommand({ tools: 'invalid-tool', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(/Invalid tool\(s\): invalid-tool/);
    });

    it('should handle comma-separated tool names with spaces', async () => {
      const initCommand = createSetupCommand({ tools: 'claude, cursor', force: true });

      await initCommand.execute(testDir);

      const claudeSkill = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'xirang-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should reject combining reserved keywords with explicit tool ids', async () => {
      const initCommand = createSetupCommand({ tools: 'all,claude', force: true });

      await expect(initCommand.execute(testDir)).rejects.toThrow(
        /Cannot combine reserved values "all" or "none" with specific tool IDs/
      );
    });

    it('should preserve an existing decomposition skill without adding a method', async () => {
      const xirangDir = path.join(testDir, '.xirang');
      await fs.mkdir(xirangDir, { recursive: true });
      const configPath = path.join(xirangDir, 'config.yaml');
      const existingContent = `schema: semantic-model
decomposition:
  skill: project-modeling
`;
      await fs.writeFile(configPath, existingContent);

      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toBe(existingContent);
      expect(parseYaml(content).decomposition).toEqual({ skill: 'project-modeling' });
    });

    it('should handle non-existent target directory', async () => {
      const newDir = path.join(testDir, 'new-project');
      const initCommand = createSetupCommand({ tools: 'claude', force: true });

      await initCommand.execute(newDir);

      const xirangPath = path.join(newDir, '.xirang');
      expect(await directoryExists(xirangPath)).toBe(true);
    });

    it('should work in extend mode (re-running init)', async () => {
      const initCommand1 = createSetupCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      // Run init again with a different tool
      const initCommand2 = createSetupCommand({ tools: 'cursor', force: true });
      await initCommand2.execute(testDir);

      // Both tools should have skills
      const claudeSkill = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const cursorSkill = path.join(testDir, '.cursor', 'skills', 'xirang-explore', 'SKILL.md');

      expect(await fileExists(claudeSkill)).toBe(true);
      expect(await fileExists(cursorSkill)).toBe(true);
    });

    it('should update existing config.yaml with proseLanguage in extend mode', async () => {
      const xirangDir = path.join(testDir, '.xirang');
      await fs.mkdir(xirangDir, { recursive: true });
      await fs.writeFile(
        path.join(xirangDir, 'config.yaml'),
        `schema: semantic-model
context: |
  Existing project context
`
      );

      const initCommand = createSetupCommand({ force: true });
      vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
      vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);
      inputMock.mockResolvedValue('ja');

      await initCommand.execute(testDir);

      const content = await fs.readFile(path.join(xirangDir, 'config.yaml'), 'utf-8');
      expect(content).toContain('proseLanguage: ja');
      expect(content).toContain('Existing project context');
    });

    it('should refresh skills on re-run for the same tool', async () => {
      const initCommand1 = createSetupCommand({ tools: 'claude', force: true });
      await initCommand1.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const originalContent = await fs.readFile(skillFile, 'utf-8');

      // Modify the file
      await fs.writeFile(skillFile, '# Modified content\n');

      // Run init again
      const initCommand2 = createSetupCommand({ tools: 'claude', force: true });
      await initCommand2.execute(testDir);

      const newContent = await fs.readFile(skillFile, 'utf-8');
      expect(newContent).toBe(originalContent);
    });
  });

  describe('skill content validation', () => {
    it('should generate valid SKILL.md with YAML frontmatter', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should have YAML frontmatter
      expect(content).toMatch(/^---\n/);
      expect(readSkillFrontmatter(content)).toMatchObject({ name: 'xirang-explore' });
      expect(content).toContain('description:');
      expect(content).toContain('license:');
      expect(content).toContain('compatibility:');
      expect(content).toContain('metadata:');
      expect(content).toMatch(/---\n\n/); // End of frontmatter
    });

    it('should include explore mode instructions', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(content).toContain('Enter explore mode');
      expect(content).toContain('thinking partner');
    });

    it('should include propose skill instructions', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-propose', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(readSkillFrontmatter(content)).toMatchObject({ name: 'xirang-propose' });
    });

    it('should include apply-change skill instructions', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-apply-change', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      expect(readSkillFrontmatter(content)).toMatchObject({ name: 'xirang-apply-change' });
      expect(content).toMatch(/preserve.*canonical|template.*heading/i);
    });

    it('should embed generatedBy version in skill files', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Should contain generatedBy field with a version string
      expect(content).toMatch(/generatedBy:\s*["']?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?["']?/);
    });
  });

  describe('command generation (skills-only)', () => {
    it('should NOT generate Claude Code slash commands (skills-only)', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.claude', 'commands', 'xirang', 'explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate Cursor commands (skills-only)', async () => {
      const initCommand = createSetupCommand({ tools: 'cursor', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.cursor', 'commands', 'xirang-explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate mapped bootstrap command path (skills-only)', async () => {
      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await initCommand.execute(testDir);

      const bootstrapCmd = path.join(testDir, '.claude', 'commands', 'xirang', getCommandSlug('build') + '.md');
      const legacyBootstrapCmd = path.join(testDir, '.claude', 'commands', 'xirang', 'build.md');
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
            filePath.includes('.xirang-test-')
          ) {
            throw new Error('EACCES: permission denied');
          }
          return originalWriteFile.call(fs, filePath, ...args);
        }
      );

      const initCommand = createSetupCommand({ tools: 'claude', force: true });
      await expect(initCommand.execute(readOnlyDir)).rejects.toThrow(/Insufficient permissions/);
    });

    it('should require --tools in non-interactive mode even when tools are detected', async () => {
      await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
      const setupCommand = createSetupCommand({ interactive: false });

      await expect(setupCommand.execute(testDir)).rejects.toThrow(/Non-interactive setup requires --tools/);
    });
  });

  describe('tool-specific skills (skills-only, no adapters)', () => {
    it('should NOT generate Gemini CLI command TOML files', async () => {
      const initCommand = createSetupCommand({ tools: 'gemini', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.gemini', 'commands', 'xirang', 'explore.toml');
      expect(await fileExists(cmdFile)).toBe(false);

      // Skills still generated
      const skillFile = path.join(testDir, '.gemini', 'skills', 'xirang-explore', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });

    it('should NOT generate Windsurf command workflows', async () => {
      const initCommand = createSetupCommand({ tools: 'windsurf', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.windsurf', 'workflows', 'xirang-explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate Continue prompt files', async () => {
      const initCommand = createSetupCommand({ tools: 'continue', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.continue', 'prompts', 'xirang-explore.prompt');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate Cline workflow files', async () => {
      const initCommand = createSetupCommand({ tools: 'cline', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.clinerules', 'workflows', 'xirang-explore.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });

    it('should NOT generate GitHub Copilot prompt files', async () => {
      const initCommand = createSetupCommand({ tools: 'github-copilot', force: true });
      await initCommand.execute(testDir);

      const cmdFile = path.join(testDir, '.github', 'prompts', 'xirang-explore.prompt.md');
      expect(await fileExists(cmdFile)).toBe(false);
    });
  });
});

describe('Xirang skeleton generation', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `xirang-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    configTempDir = path.join(os.tmpdir(), `xirang-config-xirang-${Date.now()}`);
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

  it('seeds the four partitions with a metamodel root that validates', async () => {
    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    expect(SETUP_MODEL_FILE_MANIFEST.map((file) => file.relativePath)).toEqual([
      'metamodel/project.md',
      'elements/project.root.md',
    ]);
    for (const partition of PARTITIONS) {
      expect(await directoryExists(path.join(testDir, '.xirang', 'model', partition))).toBe(true);
    }
    for (const file of SETUP_MODEL_FILE_MANIFEST) {
      expect(await fileExists(path.join(testDir, '.xirang', 'model', ...file.relativePath.split('/')))).toBe(true);
      expect(typeof file.render).toBe('function');
    }
    expect(await directoryExists(path.join(testDir, '.xirang', 'architecture'))).toBe(false);
    expect(await directoryExists(path.join(testDir, '.xirang', 'specs'))).toBe(false);

    const parsed = await parseSemanticModel(modelRoot(testDir));
    expect(parsed.diagnostics).toEqual([]);
    expect(validateSemanticModel(parsed.model)).toEqual([]);
    expect(parsed.model.elementKinds).toEqual([
      { identity: 'project', contract: 'optional', root: true, body: 'The single Project Root of the Semantic Model.' },
    ]);
    expect(parsed.model.elements[0].declaration).toMatchObject({
      identity: 'project.root',
      kind: 'project',
      parent: null,
      definition: TEST_PROJECT_DEFINITION,
    });
    const rootUnit = await fs.readFile(path.join(testDir, '.xirang', 'model', 'elements', 'project.root.md'), 'utf8');
    expect(rootUnit).toContain('\ndefinition:');
    expect(rootUnit).not.toContain('\nsummary:');
  });

  it('persists the explicitly authorized Project Definition in non-interactive setup', async () => {
    const projectDefinition = 'A complete Project Definition with explicit identity and scope boundaries.';
    const initCommand = createSetupCommand({
      tools: 'none',
      force: true,
      projectDefinition,
    });

    await initCommand.execute(testDir);

    const parsed = await parseSemanticModel(modelRoot(testDir));
    expect(parsed.model.elements[0].declaration.definition).toBe(projectDefinition);
  });

  it('collects the Project Definition during interactive setup', async () => {
    const projectDefinition = '交互授权的完整 Project Definition，包含项目身份与范围边界。';
    const initCommand = new SetupCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
    vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);
    inputMock
      .mockResolvedValueOnce('zh-CN')
      .mockResolvedValueOnce(projectDefinition);

    await initCommand.execute(testDir);

    const parsed = await parseSemanticModel(modelRoot(testDir));
    expect(parsed.model.elements[0].declaration.definition).toBe(projectDefinition);
    expect(inputMock).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Project Definition'),
    }));
  });

  it('fails closed before creating a workspace when non-interactive Project Definition input is absent', async () => {
    const initCommand = new SetupCommand({ tools: 'none', force: true });

    await expect(initCommand.execute(testDir)).rejects.toThrow('Non-interactive setup requires --project-definition');
    expect(await directoryExists(path.join(testDir, '.xirang'))).toBe(false);
  });

  it('should not generate Xirang YAML files', async () => {
    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    expect(await fileExists(path.join(testDir, '.xirang', 'project.xirang.yaml'))).toBe(false);
    expect(await fileExists(path.join(testDir, '.xirang', 'project.xirang.relations.yaml'))).toBe(false);
  });

  it('should infer the Project Root title from package.json', async () => {
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: '@scope/my-awesome-project' }));
    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    const unit = await fs.readFile(path.join(testDir, '.xirang', 'model', 'elements', 'project.root.md'), 'utf-8');
    expect(unit).toContain('title: "@scope/my-awesome-project"');
  });

  it('should not overwrite existing Semantic Model units in extend mode', async () => {
    const elements = path.join(testDir, '.xirang', 'model', 'elements');
    await fs.mkdir(elements, { recursive: true });
    const existingContent = "---\nentity: element-declaration\nidentity: project.root\n---\n";
    await fs.writeFile(path.join(elements, 'project.root.md'), existingContent);

    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    expect(await fs.readFile(path.join(elements, 'project.root.md'), 'utf-8')).toBe(existingContent);
  });

  it('does not inject non-root Element Kinds in extend mode', async () => {
    const model = path.join(testDir, '.xirang', 'model');
    const metamodel = path.join(model, 'metamodel');
    const elements = path.join(model, 'elements');
    await fs.mkdir(metamodel, { recursive: true });
    await fs.mkdir(elements, { recursive: true });
    await fs.writeFile(path.join(metamodel, 'project.md'), '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n');
    await fs.writeFile(path.join(elements, 'project.root.md'), '---\nentity: element-declaration\nidentity: project.root\nkind: project\nparent: null\ntitle: Project\ndefinition: Existing project.\n---\n');

    const setupCommand = createSetupCommand({ tools: 'none', force: true });
    await setupCommand.execute(testDir);

    await expect(fs.readdir(metamodel)).resolves.toEqual(['project.md']);
    const parsed = await parseSemanticModel(model);
    expect(parsed.diagnostics).toEqual([]);
    expect(validateSemanticModel(parsed.model)).toEqual([]);
  });

  it('should preserve existing Semantic Model, config, and user files', async () => {
    const xirang = path.join(testDir, '.xirang');
    const elements = path.join(xirang, 'model', 'elements');
    await fs.mkdir(elements, { recursive: true });
    await fs.writeFile(path.join(elements, 'custom.md'), 'custom unit\n');
    await fs.writeFile(path.join(xirang, 'config.yaml'), 'schema: semantic-model\ncontext: keep\n');
    await fs.writeFile(path.join(xirang, 'user.txt'), 'keep\n');

    const setupCommand = createSetupCommand({ tools: 'none', force: true });
    await setupCommand.execute(testDir);

    await expect(fs.readFile(path.join(elements, 'custom.md'), 'utf8')).resolves.toBe('custom unit\n');
    await expect(fs.readFile(path.join(xirang, 'config.yaml'), 'utf8')).resolves.toBe('schema: semantic-model\ncontext: keep\n');
    await expect(fs.readFile(path.join(xirang, 'user.txt'), 'utf8')).resolves.toBe('keep\n');
  });

  it('should show Project Build guidance when build is installed and non-extend mode', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    const consoleSpy = vi.spyOn(console, 'log');
    const setupCommand = createSetupCommand({ tools: 'claude', force: true });
    await setupCommand.execute(testDir);

    const logCalls = consoleSpy.mock.calls.flat().map(String);
    const buildLine = logCalls.find((line) =>
      line.includes('Next: run') && line.includes('xirang-build')
    );
    expect(buildLine).toBeDefined();
    expect(buildLine).toContain('/xirang-build');
    expect(buildLine).toContain('build your project Xirang');
  });

  it('should show Project Build guidance for the fixed workflow set', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    const consoleSpy = vi.spyOn(console, 'log');
    const setupCommand = createSetupCommand({ tools: 'claude', force: true });
    await setupCommand.execute(testDir);

    const logCalls = consoleSpy.mock.calls.flat().map(String);
    const buildLine = logCalls.find((line) =>
      line.includes('Next: run') && line.includes('xirang-build')
    );
    expect(buildLine).toBeDefined();
  });

  it('should not show bootstrap guidance in extend mode', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    // Pre-create xirang to make it extend mode
    await fs.mkdir(path.join(testDir, '.xirang'), { recursive: true });

    const consoleSpy = vi.spyOn(console, 'log');
    const initCommand = createSetupCommand({ tools: 'claude', force: true });
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
    testDir = path.join(os.tmpdir(), `xirang-init-profile-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    // Use a temp dir for global config to avoid polluting real config
    configTempDir = path.join(os.tmpdir(), `xirang-config-test-${Date.now()}`);
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

    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // All 6 registry workflows should be created
    const expectedSkillNames = [
      'xirang-propose',
      'xirang-explore',
      'xirang-apply-change',
      'xirang-archive-change',
      'xirang-build',
      'xirang-snack',
    ];

    for (const skillName of expectedSkillNames) {
      const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    }
  });

  it('should reject --profile flag with friendly error', async () => {
    // --profile is now rejected at CLI level, but test SetupCommand directly
    const initCommand = createSetupCommand({
      tools: 'claude',
      force: true,
    });

    // SetupCommand no longer accepts profile — just verify it installs all 5 workflows
    await initCommand.execute(testDir);

    const proposeSkill = path.join(testDir, '.claude', 'skills', 'xirang-propose', 'SKILL.md');
    expect(await fileExists(proposeSkill)).toBe(true);
  });

  it('should not use detected tools in non-interactive mode without --tools', async () => {
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });

    const setupCommand = createSetupCommand({ interactive: false, force: true });
    await expect(setupCommand.execute(testDir)).rejects.toThrow(/Non-interactive setup requires --tools/);
  });

  it('should preselect configured tools but not directory-detected tools in extend mode', async () => {
    // Simulate existing Xirang project (extend mode).
    await fs.mkdir(path.join(testDir, '.xirang'), { recursive: true });

    // Configured with Xirang
    const claudeSkillDir = path.join(testDir, '.claude', 'skills', 'xirang-explore');
    await fs.mkdir(claudeSkillDir, { recursive: true });
    await fs.writeFile(path.join(claudeSkillDir, 'SKILL.md'), 'configured');

    // Directory detected only (not configured with Xirang)
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['claude']);

    const initCommand = createSetupCommand({ force: true });
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
    // First-time init: no xirang/ directory and no configured Xirang skills.
    await fs.mkdir(path.join(testDir, '.github'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.github', 'copilot-instructions.md'), '');

    searchableMultiSelectMock.mockResolvedValue(['github-copilot']);

    const initCommand = createSetupCommand({ force: true });
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

    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // All 6 workflows should be installed
    const expectedSkills = [
      'xirang-propose',
      'xirang-explore',
      'xirang-apply-change',
      'xirang-archive-change',
      'xirang-build',
      'xirang-snack',
    ];

    for (const skillName of expectedSkills) {
      const skillFile = path.join(testDir, '.claude', 'skills', skillName, 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    }
  });

  it('should install all 6 workflows in interactive mode without profile prompts', async () => {
    saveGlobalConfig({
      featureFlags: {},
    });

    const initCommand = createSetupCommand({ force: true });
    vi.spyOn(initCommand as any, 'canPromptInteractively').mockReturnValue(true);
    vi.spyOn(initCommand as any, 'getSelectedTools').mockResolvedValue(['claude']);

    await initCommand.execute(testDir);

    expect(showWelcomeScreenMock).toHaveBeenCalled();
    expect(confirmMock).not.toHaveBeenCalled();

    // All 6 workflows should be installed
    const expectedSkills = [
      'xirang-explore', 'xirang-propose', 'xirang-apply-change',
      'xirang-archive-change', 'xirang-build', 'xirang-snack',
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

    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should exist
    const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    // Commands should NOT exist (skills-only surface)
    const cmdFile = path.join(testDir, '.claude', 'commands', 'xirang', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);
  });

  it('should always generate skills only even when stale delivery=commands is present', async () => {
    const obsoleteConfig = {
      featureFlags: {},
      delivery: 'commands',
    } as unknown as Parameters<typeof saveGlobalConfig>[0];
    saveGlobalConfig(obsoleteConfig);

    const initCommand = createSetupCommand({ tools: 'claude', force: true });
    await initCommand.execute(testDir);

    // Skills should exist (skills-only ignores stale delivery=commands)
    const skillFile = path.join(testDir, '.claude', 'skills', 'xirang-explore', 'SKILL.md');
    expect(await fileExists(skillFile)).toBe(true);

    // Commands should NOT exist
    const cmdFile = path.join(testDir, '.claude', 'commands', 'xirang', 'explore.md');
    expect(await fileExists(cmdFile)).toBe(false);
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
