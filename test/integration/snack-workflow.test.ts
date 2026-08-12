import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { parse as parseYaml } from 'yaml';

import { SetupCommand } from '../../src/core/setup.js';
import { UpdateCommand } from '../../src/core/update.js';
import { WorkflowManifestRegistry } from '../../src/core/templates/manifest/registry.js';
import { getSkillTemplates } from '../../src/core/shared/skill-generation.js';

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

describe('snack workflow integration', () => {
  let testDir: string;
  let configTempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `xirang-snack-it-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    originalEnv = { ...process.env };
    configTempDir = path.join(os.tmpdir(), `xirang-snack-cfg-${Date.now()}`);
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

  it('registry exposes snack as the 6th skill-only workflow', () => {
    const workflowIds = WorkflowManifestRegistry.getAllWorkflowIds();
    expect(workflowIds).toHaveLength(6);
    expect(workflowIds).toContain('snack');

    const snack = WorkflowManifestRegistry.get('snack');
    expect(snack?.modeMembership).toEqual(['flexible']);
    expect(snack?.getSkillTemplate).toBeDefined();
    // snack is skill-only: no command template
    expect(snack?.getSkillTemplate).toBeDefined();

    const skillTemplates = getSkillTemplates();
    const snackTemplate = skillTemplates.find((entry) => entry.workflowId === 'snack');
    expect(snackTemplate?.dirName).toBe('xirang-snack');
  });

  it('init installs 6 workflow skills including snack for Claude Code', async () => {
    const initCommand = new SetupCommand({
      tools: 'claude',
      force: true,
      projectDefinition: 'Snack workflow test project.',
    });
    await initCommand.execute(testDir);

    const skillsDir = path.join(testDir, '.claude', 'skills');
    const expectedSkills = [
      'xirang-propose',
      'xirang-explore',
      'xirang-apply-change',
      'xirang-archive-change',
      'xirang-build',
      'xirang-snack',
    ];

    for (const skill of expectedSkills) {
      const skillFile = path.join(skillsDir, skill, 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    }

    // snack is skill-only: no corresponding command file
    const snackCommand = path.join(testDir, '.claude', 'commands', 'xirang', 'snack.md');
    expect(await fileExists(snackCommand)).toBe(false);

    const snackSkill = await fs.readFile(
      path.join(skillsDir, 'xirang-snack', 'SKILL.md'),
      'utf-8'
    );
    expect(snackSkill).toContain('git diff');
    expect(snackSkill).toContain('CodeGraph');
    expect(snackSkill).toContain('ACE, `rg`, and `read`');
    expect(snackSkill).not.toContain('project.xirang.code-map.yaml');
    expect(snackSkill).toContain('xirang instructions proposal');
    expect(snackSkill).toContain('xirang instructions specs');
    expect(snackSkill).toContain('xirang instructions design');
    expect(snackSkill).toContain('xirang validate --change "<name>" --json');
    expect(snackSkill).not.toContain('xirang diff --change "<name>" --write');
    expect(snackSkill).not.toContain('.xirang/changes/<name>/effective-change.md');
    expect(snackSkill).not.toContain('xirang scenario-labels');
    expect(snackSkill).toContain('1. **Quick sync**: `xirang sync "<change-name>" --no-verify`');
    expect(snackSkill).toContain('2. **Quick archive**: `xirang archive "<change-name>" --no-verify`');
    expect(snackSkill).toContain(
      '3. **Sync and archive**: `xirang sync "<change-name>" --no-verify && xirang archive "<change-name>" --no-verify`'
    );
    expect(snackSkill).toContain('4. **Continue development**');
    expect(snackSkill).toContain('Default to creating a new change');
    expect(snackSkill).toContain('explicitly asks to update the current or an existing change');
    expect(snackSkill).toContain('Supplying an existing change ID does not by itself select update mode');
    expect(snackSkill).not.toContain('If omitted, run `xirang list --json` and reuse');
    expect(snackSkill).toMatch(/no architecture-level changes detected|Do NOT generate `tasks.md`/);
    // instructions portion (after YAML frontmatter) must stay <= 200 lines
    expect(instructionLineCount(snackSkill)).toBeLessThanOrEqual(200);

    // C4: installed/generated snack skill exposes artifact reconciliation guidance
    // (key behavior phrases, not full-file snapshots)
    expect(snackSkill).toMatch(/reconcil/i);
    expect(snackSkill).toContain('missing');
    expect(snackSkill).toContain('stale');
    expect(snackSkill).toContain('inconsistent');
    expect(snackSkill).toContain('current');
    expect(snackSkill).toContain('conversation context');
    expect(snackSkill).toContain('git diff --cached');
    expect(snackSkill).toContain('git diff HEAD');
    expect(snackSkill).toMatch(/commit[/-]?range|commit range/i);
    expect(snackSkill).toMatch(/natural language|natural-language/i);
    expect(snackSkill).toMatch(/do NOT generate `tasks.md`|not.*generate.*tasks\.md/i);
  });

  it('update refreshes the snack skill file in place', async () => {
    await fs.mkdir(path.join(testDir, '.xirang'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'skills', 'xirang-snack'), { recursive: true });
    const staleSkill = path.join(testDir, '.claude', 'skills', 'xirang-snack', 'SKILL.md');
    await fs.writeFile(staleSkill, 'STALE CONTENT');

    const updateCommand = new UpdateCommand({ force: true });
    await updateCommand.execute(testDir);

    const refreshed = await fs.readFile(staleSkill, 'utf-8');
    expect(refreshed).not.toBe('STALE CONTENT');
    expect(readSkillFrontmatter(refreshed)).toMatchObject({ name: 'xirang-snack' });
    expect(refreshed).toContain('git diff');
    expect(refreshed).toContain('xirang instructions proposal');
    expect(refreshed).toContain('xirang validate --change "<name>" --json');
    expect(refreshed).not.toContain('xirang diff --change "<name>" --write');
    expect(refreshed).not.toContain('xirang scenario-labels');
    // C4: refreshed skill still exposes broader evidence sources
    expect(refreshed).toContain('conversation context');
    expect(refreshed).toContain('git diff HEAD');
    expect(refreshed).toMatch(/commit[/-]?range|commit range/i);
    expect(refreshed).toMatch(/reconcil/i);
    expect(refreshed).toContain('Default to creating a new change');
    expect(refreshed).toContain('explicitly asks to update the current or an existing change');
    expect(refreshed).toContain('Supplying an existing change ID does not by itself select update mode');
    expect(refreshed).not.toContain('If omitted, run `xirang list --json` and reuse');
    expect(instructionLineCount(refreshed)).toBeLessThanOrEqual(200);
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

// Count lines of the instructions body, i.e. everything after the YAML frontmatter.
function instructionLineCount(skillContent: string): number {
  const match = skillContent.match(/^---\n[\s\S]*?\n---\n/);
  const body = match ? skillContent.slice(match[0].length) : skillContent;
  return body.split('\n').length;
}

function readSkillFrontmatter(skillContent: string): unknown {
  const match = skillContent.match(/^---\n([\s\S]*?)\n---\n/);
  return parseYaml(match?.[1] ?? '');
}
