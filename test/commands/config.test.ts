import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCLI } from '../helpers/run-cli.js';
import { Command } from 'commander';
import { parse, stringify } from 'yaml';

describe('config command integration', () => {
  // These tests use real file system operations with XDG_CONFIG_HOME override
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create unique temp directory for each test
    tempDir = path.join(os.tmpdir(), `xirang-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Save original env and set XDG_CONFIG_HOME
    originalEnv = { ...process.env };
    process.env.XDG_CONFIG_HOME = tempDir;

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Restore spies
    consoleErrorSpy.mockRestore();

    // Reset module cache to pick up new XDG_CONFIG_HOME
    vi.resetModules();
  });

  it.each([
    ['retired optimization', JSON.stringify({ optimization: { enabled: false, directionLimit: 4 } }), 'optimization is retired'],
    ['obsolete fields', JSON.stringify({ profile: 'expanded', workflows: [], delivery: 'skills' }), 'obsolete config fields'],
    ['malformed JSON', '{ invalid }', 'Invalid JSON'],
  ])('keeps requested config data separate from JSON diagnostics for %s', async (_name, source, warning) => {
    fs.mkdirSync(path.join(tempDir, 'xirang'), { recursive: true });
    const file = path.join(tempDir, 'xirang', 'config.json');
    fs.writeFileSync(file, source);
    const result = await runCLI(['config', 'list', '--json']);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveProperty('featureFlags');
    const diagnostics = result.stderr.trim().split('\n').map(line => JSON.parse(line));
    expect(diagnostics).toContainEqual(expect.objectContaining({ message: expect.stringContaining(warning) }));
    expect(fs.readFileSync(file, 'utf8')).toBe(source);
  });

  it('documents project configuration without creating a workspace', async () => {
    const result = await runCLI(['config'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('configVersion');
    expect(result.stdout).toContain('architecture.outline.definitionDepth');
    expect(result.stdout).toContain('config check');
    expect(fs.existsSync(path.join(tempDir, '.xirang'))).toBe(false);
  });

  it('aggregates strict project errors without changing either config file', async () => {
    const dir = path.join(tempDir, '.xirang');
    fs.mkdirSync(dir);
    const source = 'configVersion: 1\nschema: semantic-model\napply:\n  defaultIsolaton: branch\nrules:\n  unknown: [Rule]\n';
    fs.writeFileSync(path.join(dir, 'config.yaml'), source);
    fs.writeFileSync(path.join(dir, 'config.yml'), 'ignored: true\n');
    const result = await runCLI(['config', 'check', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.path).toBe(path.join(dir, 'config.yaml'));
    expect(report.ignoredPaths).toEqual([path.join(dir, 'config.yml')]);
    const errors = result.stderr.split('\n').filter(Boolean).map(line => JSON.parse(line));
    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'apply.defaultIsolaton', severity: 'error' }),
      expect.objectContaining({ field: 'rules.unknown', severity: 'error' }),
    ]));
    expect(fs.readFileSync(path.join(dir, 'config.yaml'), 'utf8')).toBe(source);
    expect(fs.readFileSync(path.join(dir, 'config.yml'), 'utf8')).toBe('ignored: true\n');
  });

  it('reports ignored inputs as warnings and keeps effective rule contents and sources', async () => {
    const dir = path.join(tempDir, '.xirang');
    fs.mkdirSync(path.join(dir, 'references'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'references', 'xirang-semantic-refinement.md'), 'Guidance');
    const source = stringify({ configVersion: 1, schema: 'semantic-model', context: 'URL <x> & "quoted"\nline', optimization: { enabled: false }, rules: { 'semantic-delta': ['A < B\nsecond line'], proposal: ['Other'] } });
    const file = path.join(dir, 'config.yaml');
    fs.writeFileSync(file, source);
    const result = await runCLI(['config', 'check', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.effective).not.toHaveProperty('optimization');
    expect(report.effective.context).toBe('URL <x> & "quoted"\nline');
    expect(report.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'context', source: 'explicit' }),
      expect.objectContaining({ path: 'apply.defaultIsolation', source: 'default', value: 'ask' }),
    ]));
    expect(result.stderr.split('\n').filter(Boolean).map(line => JSON.parse(line))).toContainEqual(expect.objectContaining({ field: 'optimization.enabled', severity: 'warning' }));
    const selected = await runCLI(['config', 'project', '--artifact', 'semantic-delta', '--select', 'rules', '--json'], { cwd: tempDir });
    expect(JSON.parse(selected.stdout)).toEqual({ rules: { 'semantic-delta': ['A < B\nsecond line'] } });
    expect(fs.readFileSync(file, 'utf8')).toBe(source);
  });

  it.each([
    ['missing', undefined, 'CONFIG_UNREADABLE'],
    ['malformed', 'configVersion: [', 'CONFIG_UNREADABLE'],
    ['non-object', '[]', 'INVALID_CONFIG'],
    ['missing version', 'schema: semantic-model\n', 'INVALID_CONFIG'],
    ['newer version', 'configVersion: 2\n', 'INVALID_CONFIG'],
    ['bad values and reference', 'configVersion: 1\narchitecture: { outline: { definitionDepth: -1 } }\ndecomposition: missing.md\n', 'INVALID_CONFIG'],
  ])('reports %s configuration without creating or repairing files', async (_name, source, code) => {
    const dir = path.join(tempDir, '.xirang');
    fs.mkdirSync(dir);
    const file = path.join(dir, 'config.yaml');
    if (source !== undefined) fs.writeFileSync(file, source);
    const result = await runCLI(['config', 'check', '--json'], { cwd: tempDir });
    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.valid).toBe(false);
    const errors = result.stderr.split('\n').filter(Boolean).map(line => JSON.parse(line));
    expect(errors).toContainEqual(expect.objectContaining({ code, severity: 'error' }));
    if (source === undefined) expect(fs.existsSync(file)).toBe(false);
    else expect(fs.readFileSync(file, 'utf8')).toBe(source);
    if (_name === 'bad values and reference') {
      expect(errors).toContainEqual(expect.objectContaining({ field: 'decomposition', code: 'CONFIG_REFERENCE_UNREADABLE' }));
      expect(report.fields).toContainEqual(expect.objectContaining({ path: 'architecture.outline.definitionDepth', source: 'fallback', value: 2 }));
    }
  });

  it('should use XDG_CONFIG_HOME for config path', async () => {
    const { getGlobalConfigPath } = await import('../../src/core/global-config.js');
    const configPath = getGlobalConfigPath();
    expect(configPath).toBe(path.join(tempDir, 'xirang', 'config.json'));
  });

  it('should save and load config correctly', async () => {
    const { getGlobalConfig, saveGlobalConfig } = await import('../../src/core/global-config.js');

    saveGlobalConfig({ featureFlags: { test: true } });
    const config = getGlobalConfig();
    expect(config.featureFlags).toEqual({ test: true });
  });

  it('should return defaults when config file does not exist', async () => {
    const { getGlobalConfig, getGlobalConfigPath } = await import('../../src/core/global-config.js');

    const configPath = getGlobalConfigPath();
    // Make sure config doesn't exist
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    const config = getGlobalConfig();
    expect(config.featureFlags).toEqual({});
  });

  it('should preserve unknown fields', async () => {
    const { getGlobalConfig, getGlobalConfigDir } = await import('../../src/core/global-config.js');

    const configDir = getGlobalConfigDir();
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify({
      featureFlags: {},
      customField: 'preserved',
    }));

    const config = getGlobalConfig();
    expect((config as Record<string, unknown>).customField).toBe('preserved');
  });

  it('should handle invalid JSON gracefully', async () => {
    const { getGlobalConfig, getGlobalConfigDir } = await import('../../src/core/global-config.js');

    const configDir = getGlobalConfigDir();
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config.json'), '{ invalid json }');

    const config = getGlobalConfig();
    // Should return defaults
    expect(config.featureFlags).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'));
  });

  it('should reject retired propose paths even with --allow-unknown', async () => {
    const { registerConfigCommand } = await import('../../src/commands/config.js');
    const { getGlobalConfigPath } = await import('../../src/core/global-config.js');
    const program = new Command();
    registerConfigCommand(program);

    process.exitCode = undefined;
    await program.parseAsync([
      'node',
      'xirang',
      'config',
      'set',
      'propose.smartRouting',
      'false',
      '--allow-unknown',
    ]);

    expect(process.exitCode).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('retired'));
    expect(fs.existsSync(getGlobalConfigPath())).toBe(false);
    process.exitCode = undefined;
  });
});

// NOTE: Shell completion registry tests moved to introspect-regression.test.ts

describe('config project command', () => {
  let tempDir: string;
  let originalCwd: string;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `xirang-project-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tempDir, { recursive: true });
    originalCwd = process.cwd();
    process.chdir(tempDir);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleLogSpy.mockRestore();
    vi.resetModules();
  });

  async function runProjectCommand(args: string[]): Promise<void> {
    const { registerConfigCommand } = await import('../../src/commands/config.js');
    const program = new Command();
    registerConfigCommand(program);
    await program.parseAsync(['node', 'xirang', 'config', 'project', ...args]);
  }

  it('selects current config fields and only matching artifact rules', async () => {
    const configDir = path.join(tempDir, '.xirang');
    fs.mkdirSync(configDir);
    const configPath = path.join(configDir, 'config.yaml');
    fs.writeFileSync(configPath, 'schema: semantic-model\nproseLanguage: 中文\nrules:\n  proposal: [Keep scope]\n  specs: [Keep behavior]\n');
    const args = ['--json', '--select', 'proseLanguage', '--select', 'rules', '--artifact', 'proposal'];
    await runProjectCommand(args);
    expect(JSON.parse(consoleLogSpy.mock.calls.at(-1)![0])).toEqual({ proseLanguage: '中文', rules: { proposal: ['Keep scope'] } });
    fs.writeFileSync(configPath, 'schema: semantic-model\nproseLanguage: English\nrules: {}\n');
    await runProjectCommand(args);
    expect(JSON.parse(consoleLogSpy.mock.calls.at(-1)![0])).toEqual({ proseLanguage: 'English', rules: {} });
  });

  it.each([
    ...['', '\n', '\n\n', '\r\n'].map(ending => {
      const newline = ending === '\r\n' ? '\r\n' : '\n';
      return {
        context: `first line${newline}rules: context content only${ending}`,
        rules: { proposal: [`first rule${newline}- still the same rule${ending}`] },
      };
    }),
    { context: 'Use # Root as a heading', rules: { proposal: ['- Required rollback plan', 'Include: rollback plan', '# Keep this heading'] } },
    { context: 'true', rules: { proposal: ['false', 'null', '123', '[]', '{key: value}', ' yes '] } },
    { context: '', rules: { proposal: ['Keep the empty context'] } },
  ])('preserves scalar contents and boundaries in text and JSON (%j)', async selected => {
    const source = { schema: 'semantic-model', ...selected, rules: { ...selected.rules, specs: ['Other artifact'] } };
    fs.mkdirSync(path.join(tempDir, '.xirang'), { recursive: true });
    const configPath = path.join(tempDir, '.xirang', 'config.yaml');
    const bytes = stringify(source);
    fs.writeFileSync(configPath, bytes);
    const args = ['--select', 'context', '--select', 'rules', '--artifact', 'proposal'];
    await runProjectCommand([...args, '--json']);
    expect(JSON.parse(String(consoleLogSpy.mock.calls.at(-1)![0]))).toEqual(selected);
    await runProjectCommand(args);
    expect(parse(`${consoleLogSpy.mock.calls.at(-1)![0]}\n`)).toEqual(selected);
    expect(fs.readFileSync(configPath, 'utf8')).toBe(bytes);
  });

  it('distinguishes absent optional fields from invalid selections', async () => {
    await runProjectCommand(['--json', '--select', 'git.commitMessage.archive']);
    expect(JSON.parse(consoleLogSpy.mock.calls.at(-1)![0])).toEqual({});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      consoleLogSpy.mockClear();
      await runProjectCommand(['--json', '--select', 'git.commitMessage.typo']);
      expect(process.exitCode).toBe(1);
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(JSON.parse(error.mock.calls.at(-1)![0])).toMatchObject({ code: 'INVALID_CONFIG_SELECTION' });
    } finally {
      process.exitCode = undefined;
      error.mockRestore();
    }
  });

  it('prints normalized project config as JSON', async () => {
    fs.mkdirSync(path.join(tempDir, '.xirang'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, '.xirang', 'config.yaml'),
      `schema: semantic-model
proseLanguage: 中文
context: Project context
decomposition: xirang-project-decomposition
optimization:
  enabled: false
  directionLimit: 2
  directionRetries: 1
propose:
  smartRouting: false
apply:
  defaultIsolation: branch
git:
  commitMessage:
    archive: docs/archive.md
    merge: docs/merge.md
  merge:
    strategy: squash
  branch:
    deleteAfterArchive: true
rules:
  proposal:
    - Keep it short
`,
      'utf-8'
    );

    await runProjectCommand(['--json']);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toEqual({
      schema: 'semantic-model',
      proseLanguage: '中文',
      context: 'Project context',
      decomposition: '.xirang/references/xirang-project-decomposition.md',
      architecture: {
        outline: {
          definitionDepth: 2,
        },
      },
      apply: {
        defaultIsolation: 'branch',
      },
      git: {
        commitMessage: {
          archive: 'docs/archive.md',
          merge: 'docs/merge.md',
        },
        merge: {
          strategy: 'squash',
        },
        branch: {
          deleteAfterArchive: true,
        },
      },
      rules: {
        proposal: ['Keep it short'],
      },
    });
  });

  it.each([undefined, { schema: 'semantic-model' }, { schema: 'semantic-model', context: '' }, { schema: 'semantic-model', proseLanguage: '中文', rules: {} }])('keeps complete text and JSON config equivalent without absent optional fields (%j)', async configured => {
    if (configured) {
      fs.mkdirSync(path.join(tempDir, '.xirang'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, '.xirang', 'config.yaml'), stringify(configured));
    }
    await runProjectCommand(['--json']);
    const json = JSON.parse(String(consoleLogSpy.mock.calls.at(-1)![0]));
    expect(json).toEqual({
      ...configured,
      ...(configured ? {
        decomposition: '.xirang/references/xirang-semantic-refinement.md',
        git: { merge: { strategy: 'no-ff' }, branch: { deleteAfterArchive: false } },
      } : {}),
      architecture: { outline: { definitionDepth: 2 } },
      rules: {},
    });
    await runProjectCommand([]);
    expect(parse(`${consoleLogSpy.mock.calls.at(-1)![0]}\n`)).toEqual(json);
  });
});

describe('config key validation', () => {
  it('rejects unknown top-level keys', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('unknownKey').valid).toBe(false);
  });

  it('allows feature flag keys', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('featureFlags.someFlag').valid).toBe(true);
  });

  it('rejects deeply nested feature flag keys', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('featureFlags.someFlag.extra').valid).toBe(false);
  });

  it('rejects delivery key (removed field)', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('delivery').valid).toBe(false);
  });

  it('rejects workflows key (removed field)', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('workflows').valid).toBe(false);
  });

  it('rejects profile key (removed field)', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('profile').valid).toBe(false);
  });

  it('rejects retired propose routing keys', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('propose')).toMatchObject({ valid: false, retired: true });
    expect(validateConfigKeyPath('propose.smartRouting')).toMatchObject({ valid: false, retired: true });
    expect(validateConfigKeyPath('propose.requireExplore')).toMatchObject({ valid: false, retired: true });
  });

  it('rejects retired optimization.enabled key', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('optimization.enabled')).toMatchObject({ valid: false, retired: true });
  });

  it('rejects retired optimization direction limit keys', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('optimization.directionLimit')).toMatchObject({ valid: false, retired: true });
    expect(validateConfigKeyPath('optimization.directionRetries')).toMatchObject({ valid: false, retired: true });
  });

  it('rejects unsupported optimization nesting', async () => {
    const { validateConfigKeyPath } = await import('../../src/core/config-schema.js');
    expect(validateConfigKeyPath('optimization.enabled.extra').valid).toBe(false);
  });
});

describe('config schema validation', () => {
  it('config schema should accept config without delivery', async () => {
    const { validateConfig } = await import('../../src/core/config-schema.js');

    const result = validateConfig({ featureFlags: {} });
    expect(result.success).toBe(true);
  });
});
