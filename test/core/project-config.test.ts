import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parse as parseYaml } from 'yaml';
import {
  materializeProjectConfigDefaults,
  migrateProjectConfigDefaults,
  readProjectConfig,
  validateConfigRules,
  type ProjectConfig,
} from '../../src/core/project-config.js';
import {
  buildConfigProjectionBundle,
  normalizeProjectConfig,
  projectConfigForPrompt,
  projectConfigForRuntime,
} from '../../src/core/config-projection.js';

function gitConfig({
  strategy = 'no-ff',
  deleteAfterArchive = false,
  commitMessage,
}: {
  strategy?: 'no-ff' | 'ff-only' | 'squash';
  deleteAfterArchive?: boolean;
  commitMessage?: {
    boundary?: string;
    archive?: string;
    merge?: string;
  };
} = {}) {
  return {
    ...(commitMessage ? { commitMessage } : {}),
    merge: {
      strategy,
    },
    branch: {
      deleteAfterArchive,
    },
  };
}

describe('project-config', () => {
  let tempDir: string;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-test-config-'));
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleWarnSpy.mockRestore();
  });

  describe('materializeProjectConfigDefaults', () => {
    it('should include only functional disk defaults', () => {
      const defaults = materializeProjectConfigDefaults({ schema: 'semantic-model' });

      expect(defaults).toEqual({
        schema: 'semantic-model',
        decomposition: {
          method: 'c4',
        },
        architecture: {
          outline: {
            elementDefinitionDepth: 2,
          },
        },
        optimization: {
          enabled: true,
          optRetries: 2,
        },
        apply: {
          defaultIsolation: 'ask',
        },
        git: gitConfig(),
      });
      expect(defaults).not.toHaveProperty('proseLanguage');
      expect(defaults).not.toHaveProperty('context');
      expect(defaults).not.toHaveProperty('rules');
      expect(defaults).not.toHaveProperty('propose');
    });

    it('should preserve explicit proseLanguage without adding other optional fields', () => {
      const defaults = materializeProjectConfigDefaults({
        schema: 'semantic-model',
        proseLanguage: 'zh-CN',
      });

      expect(defaults.proseLanguage).toBe('zh-CN');
      expect(defaults).not.toHaveProperty('context');
      expect(defaults).not.toHaveProperty('rules');
      expect(defaults).not.toHaveProperty('propose');
      expect(defaults.apply).toEqual({
        defaultIsolation: 'ask',
      });
    });
  });

  describe('migrateProjectConfigDefaults', () => {
    it('should create config.yaml with functional defaults when config is missing', () => {
      fs.mkdirSync(path.join(tempDir, '.xirang'), { recursive: true });

      const result = migrateProjectConfigDefaults(tempDir);
      const configPath = path.join(tempDir, '.xirang', 'config.yaml');
      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = parseYaml(content);

      expect(result).toEqual({
        status: 'created',
        path: configPath,
      });
      expect(parsed).toEqual({
        schema: 'semantic-model',
        decomposition: {
          method: 'c4',
        },
        architecture: {
          outline: {
            elementDefinitionDepth: 2,
          },
        },
        optimization: {
          enabled: true,
          optRetries: 2,
        },
        apply: {
          defaultIsolation: 'ask',
        },
        git: gitConfig(),
      });
    });

    it('should add nested missing defaults without overwriting existing values', () => {
      const configDir = path.join(tempDir, '.xirang');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.yaml');
      fs.writeFileSync(
        configPath,
        `schema: custom-schema
optimization:
  enabled: false
git:
  merge:
    strategy: squash
context: keep me
`
      );

      const result = migrateProjectConfigDefaults(tempDir);
      const parsed = parseYaml(fs.readFileSync(configPath, 'utf-8'));

      expect(result).toEqual({
        status: 'updated',
        path: configPath,
      });
      expect(parsed.schema).toBe('custom-schema');
      expect(parsed.context).toBe('keep me');
      expect(parsed.optimization.enabled).toBe(false);
      expect(parsed.optimization.optRetries).toBe(2);
      expect(parsed.git.merge.strategy).toBe('squash');
      expect(parsed.git.branch.deleteAfterArchive).toBe(false);
      expect(parsed.git).not.toHaveProperty('autoCommit');
      expect(parsed.git).not.toHaveProperty('archive');
      expect(parsed.git.merge).not.toHaveProperty('commitMessage');
      expect(parsed).not.toHaveProperty('propose');
      expect(parsed.apply.defaultIsolation).toBe('ask');
    });

    it('should add defaults through missing nested parents', () => {
      const configDir = path.join(tempDir, '.xirang');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.yaml');
      fs.writeFileSync(
        configPath,
        `schema: semantic-model
git:
  merge:
    strategy: ff-only
`
      );

      const result = migrateProjectConfigDefaults(tempDir);
      const parsed = parseYaml(fs.readFileSync(configPath, 'utf-8'));

      expect(result).toEqual({
        status: 'updated',
        path: configPath,
      });
      expect(parsed.optimization).toEqual({
        enabled: true,
        optRetries: 2,
      });
      expect(parsed.apply).toEqual({
        defaultIsolation: 'ask',
      });
      expect(parsed.git).toEqual(gitConfig({ strategy: 'ff-only' }));
    });

    it('should not overwrite non-map parents during nested default migration', () => {
      const configDir = path.join(tempDir, '.xirang');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.yaml');
      fs.writeFileSync(
        configPath,
        `schema: semantic-model
optimization:
git: disabled
`
      );

      const result = migrateProjectConfigDefaults(tempDir);
      const parsed = parseYaml(fs.readFileSync(configPath, 'utf-8'));

      expect(result).toEqual({
        status: 'updated',
        path: configPath,
      });
      expect(parsed.optimization).toBeNull();
      expect(parsed.git).toBe('disabled');
      expect(parsed.apply).toEqual({
        defaultIsolation: 'ask',
      });
    });

    it('should mutate config.yml when config.yaml is missing', () => {
      const configDir = path.join(tempDir, '.xirang');
      fs.mkdirSync(configDir, { recursive: true });
      const ymlPath = path.join(configDir, 'config.yml');
      fs.writeFileSync(ymlPath, `schema: semantic-model
architecture:
  outline:
    elementDefinitionDepth: 4
`);

      const result = migrateProjectConfigDefaults(tempDir);

      expect(result).toEqual({
        status: 'updated',
        path: ymlPath,
      });
      expect(fs.existsSync(path.join(configDir, 'config.yaml'))).toBe(false);
      const parsed = parseYaml(fs.readFileSync(ymlPath, 'utf-8'));
      expect(parsed.architecture.outline.elementDefinitionDepth).toBe(4);
      expect(parsed.decomposition).toEqual({ method: 'c4' });
      expect(parsed.git.merge.strategy).toBe('no-ff');
    });

    it('should preserve an existing decomposition skill during missing-only migration', () => {
      const configDir = path.join(tempDir, '.xirang');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.yaml');
      fs.writeFileSync(
        configPath,
        `schema: semantic-model
decomposition:
  skill: project-modeling
`
      );

      migrateProjectConfigDefaults(tempDir);
      const parsed = parseYaml(fs.readFileSync(configPath, 'utf-8'));

      expect(parsed.decomposition).toEqual({ skill: 'project-modeling' });
      expect(parsed.decomposition).not.toHaveProperty('method');
    });

    it('should leave invalid yaml unchanged and report skipped migration', () => {
      const configDir = path.join(tempDir, '.xirang');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.yaml');
      const original = 'schema: [unclosed';
      fs.writeFileSync(configPath, original);

      const result = migrateProjectConfigDefaults(tempDir);

      expect(result).toEqual({
        status: 'skipped',
        path: configPath,
        reason: 'invalid-yaml',
      });
      expect(fs.readFileSync(configPath, 'utf-8')).toBe(original);
    });

    it('should leave non-object yaml unchanged and report skipped migration', () => {
      const configDir = path.join(tempDir, '.xirang');
      fs.mkdirSync(configDir, { recursive: true });
      const configPath = path.join(configDir, 'config.yaml');
      const original = '"just a string"\n';
      fs.writeFileSync(configPath, original);

      const result = migrateProjectConfigDefaults(tempDir);

      expect(result).toEqual({
        status: 'skipped',
        path: configPath,
        reason: 'non-object',
      });
      expect(fs.readFileSync(configPath, 'utf-8')).toBe(original);
    });

    it('should preserve runtime defaults after disk materialization round trip', () => {
      fs.mkdirSync(path.join(tempDir, '.xirang'), { recursive: true });

      migrateProjectConfigDefaults(tempDir);
      const config = readProjectConfig(tempDir);
      const runtime = projectConfigForRuntime(config, { consumer: 'archive' });

      expect(config?.optimization).toEqual({
        enabled: true,
        optRetries: 2,
      });
      expect(runtime.git).toEqual(gitConfig());
      expect(config).not.toHaveProperty('propose');
      expect(config?.apply).toEqual({
        defaultIsolation: 'ask',
      });
    });
  });

  describe('readProjectConfig', () => {
    describe('decomposition', () => {
      it.each([
        ['method', 'c4', { method: 'c4' }],
        ['skill', 'xirang-project-decomposition', { skill: 'xirang-project-decomposition' }],
      ] as const)('loads an opaque %s selection', (key, value, expected) => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model\ndecomposition:\n  ${key}: ${value}\n`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.decomposition).toEqual(expected);
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('uses c4 when the field is missing', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'config.yaml'), 'schema: semantic-model\n');

        expect(readProjectConfig(tempDir)?.decomposition).toEqual({ method: 'c4' });
      });

      it.each([
        ['both branches', '  method: c4\n  skill: custom'],
        ['no branch', '{}'],
        ['empty method', '  method: "  "'],
        ['unknown key', '  method: c4\n  extra: true'],
        ['raw string', 'c4'],
      ])('warns and omits an invalid tagged union: %s', (_label, value) => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model\ndecomposition: ${value.startsWith('  ') ? `\n${value}` : value}\ncontext: keep me\n`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.decomposition).toBeUndefined();
        expect(config?.context).toBe('keep me');
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid 'decomposition' field"));
      });
    });

    describe('resilient parsing', () => {
      it.each([
        ['negative', '  outline:\n    elementDefinitionDepth: -1'],
        ['non-integer', '  outline:\n    elementDefinitionDepth: 1.5'],
        ['invalid outline shape', '  outline: invalid'],
      ])('should fall back for %s architecture outline config', (_label, architectureValue) => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
context: keep me
architecture:
${architectureValue}
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.architecture).toEqual({
          outline: {
            elementDefinitionDepth: 2,
          },
        });
        expect(config?.context).toBe('keep me');
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid 'architecture.outline.elementDefinitionDepth'")
        );
      });

      it('should preserve a legal architecture outline depth from config.yml', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yml'),
          `schema: semantic-model
architecture:
  outline:
    elementDefinitionDepth: 4
`
        );

        expect(readProjectConfig(tempDir)?.architecture).toEqual({
          outline: {
            elementDefinitionDepth: 4,
          },
        });
      });

      it('should parse complete valid config', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
proseLanguage: zh-CN
context: |
  Tech stack: TypeScript, React
  API style: RESTful
rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          proseLanguage: 'zh-CN',
          context: 'Tech stack: TypeScript, React\nAPI style: RESTful\n',
          git: gitConfig(),
          rules: {
            proposal: ['Include rollback plan', 'Identify affected teams'],
            specs: ['Use Given/When/Then format'],
          },
        });
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should migrate legacy docLanguage when proseLanguage is absent', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
docLanguage: zh-CN
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.proseLanguage).toBe('zh-CN');
        expect(config).not.toHaveProperty('docLanguage');
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should prefer proseLanguage over legacy docLanguage', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
proseLanguage: 中文
docLanguage: zh-CN
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.proseLanguage).toBe('中文');
        expect(config).not.toHaveProperty('docLanguage');
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should parse minimal config with schema only', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'config.yaml'), 'schema: semantic-model\n');

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig(),
        });
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should parse optimization policy when present', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
optimization:
  enabled: false
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          optimization: {
            enabled: false,
            optRetries: 2,
          },
          git: gitConfig(),
        });
      });

      it('should silently ignore retired propose policy without rewriting the file', () => {
        const configDir = path.join(tempDir, '.xirang');
        const configPath = path.join(configDir, 'config.yaml');
        fs.mkdirSync(configDir, { recursive: true });
        const source = `schema: semantic-model
propose:
  smartRouting: false
  requireExplore: false
apply:
  defaultIsolation: worktree
`;
        fs.writeFileSync(configPath, source);

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          apply: {
            defaultIsolation: 'worktree',
          },
          git: gitConfig(),
        });
        expect(consoleWarnSpy).not.toHaveBeenCalled();
        expect(fs.readFileSync(configPath, 'utf-8')).toBe(source);
      });

      it('should parse complete git archive policy when present', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
git:
  commitMessage:
    boundary: docs/boundary.md
    archive: docs/archive.md
    merge: docs/merge.md
  merge:
    strategy: squash
  branch:
    deleteAfterArchive: true
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig({
            strategy: 'squash',
            deleteAfterArchive: true,
            commitMessage: {
              boundary: 'docs/boundary.md',
              archive: 'docs/archive.md',
              merge: 'docs/merge.md',
            },
          }),
        });
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should fill default git archive policy when git node is missing', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'config.yaml'), 'schema: semantic-model\n');

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig(),
        });
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should preserve valid git fields while defaulting missing nested fields', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
git:
  merge:
    strategy: ff-only
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.git).toEqual(gitConfig({ strategy: 'ff-only' }));
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should warn per invalid git field and keep valid siblings', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
git:
  autoCommit: manual
  commitMessage:
    boundary: /absolute.md
    archive: ../archive.md
    merge: docs\\merge.md
  archive:
    commitMessage:
      convention: xirang-archive
  merge:
    strategy: rebase
    commitMessage:
      convention: opsx-merge-summary
  branch:
    deleteAfterArchive: "true"
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.git).toEqual(gitConfig());
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.autoCommit is deprecated and ignored; archive handoff is always handled by the agent'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.archive.commitMessage.convention is deprecated and ignored; use git.commitMessage.archive for path overrides'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.merge.commitMessage.convention is deprecated and ignored; use git.commitMessage.merge for path overrides'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.commitMessage.boundary must be a POSIX relative path without ..'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.commitMessage.archive must be a POSIX relative path without ..'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.commitMessage.merge must be a POSIX relative path without ..'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.merge.strategy must be one of: no-ff, ff-only, squash'
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'git.branch.deleteAfterArchive must be boolean'
        );
      });

      it('should warn and return null when schema is invalid', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: custom-schema
context: Valid context here
`
        );

        expect(readProjectConfig(tempDir)).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Unsupported schema 'custom-schema' in .xirang/config.yaml. Available: semantic-model"
        );
      });

      it('should return partial config when context is invalid', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
context: 123
rules:
  proposal:
    - Valid rule
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig(),
          rules: {
            proposal: ['Valid rule'],
          },
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid 'context' field")
        );
      });

      it('should return partial config when proseLanguage is invalid', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
proseLanguage: 123
context: Valid context
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          context: 'Valid context',
          git: gitConfig(),
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid 'proseLanguage' field")
        );
      });

      it('should return partial config when rules is not an object', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
context: Valid context
rules: ["not", "an", "object"]
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          context: 'Valid context',
          git: gitConfig(),
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid 'rules' field")
        );
      });

      it('should return partial config when optimization is invalid', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
optimization: "bad"
context: Valid context
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          context: 'Valid context',
          git: gitConfig(),
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid 'optimization' field")
        );
      });

      it('should handle rules: null without aborting config parsing', () => {
        // YAML `rules:` with no value parses to null
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
context: Valid context
rules:
`
        );

        const config = readProjectConfig(tempDir);

        // Should still parse schema and context despite null rules
        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          context: 'Valid context',
          git: gitConfig(),
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid 'rules' field")
        );
      });

      it('should filter out invalid rules for specific artifact', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
rules:
  proposal:
    - Valid rule
  specs: "not an array"
  design:
    - Another valid rule
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig(),
          rules: {
            proposal: ['Valid rule'],
            design: ['Another valid rule'],
          },
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Rules for 'specs' must be an array of strings")
        );
      });

      it('should filter out empty string rules', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
rules:
  proposal:
    - Valid rule
    - ""
    - Another valid rule
    - ""
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig(),
          rules: {
            proposal: ['Valid rule', 'Another valid rule'],
          },
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Some rules for 'proposal' are empty strings")
        );
      });

      it('should skip artifact if all rules are empty strings', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
rules:
  proposal:
    - ""
    - ""
  specs:
    - Valid rule
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig(),
          rules: {
            specs: ['Valid rule'],
          },
        });
      });

      it('should handle completely invalid YAML gracefully', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'config.yaml'), 'schema: [unclosed');

        const config = readProjectConfig(tempDir);

        expect(config).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to parse .xirang/config.yaml'),
          expect.anything()
        );
      });

      it('should warn when config is not a YAML object', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'config.yaml'), '"just a string"');

        const config = readProjectConfig(tempDir);

        expect(config).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('not a valid YAML object')
        );
      });

      it('should handle empty config file', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'config.yaml'), '');

        const config = readProjectConfig(tempDir);

        expect(config).toBeNull();
      });
    });

    describe('context size limit enforcement', () => {
      it('should accept context under 50KB limit', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        const smallContext = 'a'.repeat(1000); // 1KB
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model\ncontext: "${smallContext}"\n`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.context).toBe(smallContext);
        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Context too large')
        );
      });

      it('should reject context over 50KB limit', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        const largeContext = 'a'.repeat(51 * 1024); // 51KB
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model\ncontext: "${largeContext}"\n`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          git: gitConfig(),
        });
        expect(config?.context).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Context too large (51.0KB, limit: 50KB)')
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Ignoring context field')
        );
      });

      it('should handle context exactly at 50KB limit', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        const exactContext = 'a'.repeat(50 * 1024); // Exactly 50KB
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model\ncontext: "${exactContext}"\n`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.context).toBe(exactContext);
        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Context too large')
        );
      });

      it('should handle multi-byte UTF-8 characters in size calculation', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        // Unicode snowman is 3 bytes in UTF-8
        const contextWithUnicode = '☃'.repeat(18000); // ~54KB in UTF-8 (18000 * 3 bytes)
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
context: |
  ${contextWithUnicode}
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.context).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Context too large')
        );
      });
    });

    describe('.yml/.yaml precedence', () => {
      it('should prefer .yaml when both exist', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          'schema: semantic-model\ncontext: from yaml\n'
        );
        fs.writeFileSync(
          path.join(configDir, 'config.yml'),
          'schema: custom-schema\ncontext: from yml\n'
        );

        const config = readProjectConfig(tempDir);

        expect(config?.schema).toBe('semantic-model');
        expect(config?.context).toBe('from yaml');
      });

      it('should reject the retired bootstrap schema in .yml', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yml'),
          'schema: bootstrap\ncontext: from yml\n'
        );

        expect(readProjectConfig(tempDir)).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Unsupported schema 'bootstrap' in .xirang/config.yaml. Available: semantic-model"
        );
      });

      it('should return null when neither .yaml nor .yml exist', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });

        const config = readProjectConfig(tempDir);

        expect(config).toBeNull();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should return null when xirang directory does not exist', () => {
        const config = readProjectConfig(tempDir);

        expect(config).toBeNull();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });

    describe('multi-line and special characters', () => {
      it('should preserve multi-line context', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
context: |
  Line 1: Tech stack
  Line 2: API conventions
  Line 3: Testing approach
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.context).toBe(
          'Line 1: Tech stack\nLine 2: API conventions\nLine 3: Testing approach\n'
        );
      });

      it('should preserve special YAML characters in context', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
context: |
  Special chars: : @ # $ % & * [ ] { }
  Quotes: "double" 'single'
  Symbols: < > | \\ /
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.context).toContain('Special chars: : @ # $ % & * [ ] { }');
        expect(config?.context).toContain('"double"');
        expect(config?.context).toContain("'single'");
        expect(config?.context).toContain('Symbols: < > | \\ /');
      });

      it('should preserve special characters in rule strings', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model
rules:
  proposal:
    - "Use <template> tags in docs"
    - "Reference @mentions and #channels"
    - "Follow {variable} naming"
`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.rules?.proposal).toEqual([
          'Use <template> tags in docs',
          'Reference @mentions and #channels',
          'Follow {variable} naming',
        ]);
      });
    });
  });

  describe('validateConfigRules', () => {
    it('should return no warnings for valid artifact IDs', () => {
      const rules = {
        proposal: ['Rule 1'],
        specs: ['Rule 2'],
        design: ['Rule 3'],
      };
      const validIds = new Set(['proposal', 'specs', 'design', 'tasks']);

      const warnings = validateConfigRules(rules, validIds, 'semantic-model');

      expect(warnings).toEqual([]);
    });

    it('should warn about unknown artifact IDs', () => {
      const rules = {
        proposal: ['Rule 1'],
        testplan: ['Rule 2'], // Invalid
        documentation: ['Rule 3'], // Invalid
      };
      const validIds = new Set(['proposal', 'specs', 'design', 'tasks']);

      const warnings = validateConfigRules(rules, validIds, 'semantic-model');

      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain('Unknown artifact ID in rules: "testplan"');
      expect(warnings[0]).toContain('Valid IDs for schema "semantic-model": design, proposal, specs, tasks');
      expect(warnings[1]).toContain('Unknown artifact ID in rules: "documentation"');
    });

    it('should return warnings for all unknown artifact IDs', () => {
      const rules = {
        invalid1: ['Rule 1'],
        invalid2: ['Rule 2'],
        invalid3: ['Rule 3'],
      };
      const validIds = new Set(['proposal', 'specs']);

      const warnings = validateConfigRules(rules, validIds, 'semantic-model');

      expect(warnings).toHaveLength(3);
    });

    it('should handle empty rules object', () => {
      const rules = {};
      const validIds = new Set(['proposal', 'specs']);

      const warnings = validateConfigRules(rules, validIds, 'semantic-model');

      expect(warnings).toEqual([]);
    });
  });

  describe('config projection', () => {
    it('uses the effective outline depth for a legal partial architecture config', () => {
      const config = {
        schema: 'semantic-model',
        architecture: {},
      } as ProjectConfig;

      expect(normalizeProjectConfig(config).architecture).toEqual({
        outline: {
          elementDefinitionDepth: 2,
        },
      });
    });

    it('projects the effective architecture outline depth for agents', () => {
      const defaultBundle = buildConfigProjectionBundle(
        {
          schema: 'semantic-model',
          rules: {},
        },
        { surface: 'apply' }
      );
      const configuredBundle = buildConfigProjectionBundle(
        {
          schema: 'semantic-model',
          architecture: {
            outline: {
              elementDefinitionDepth: 4,
            },
          },
          rules: {},
        },
        { surface: 'apply' }
      );

      expect(defaultBundle.normalized.architecture).toEqual({
        outline: {
          elementDefinitionDepth: 2,
        },
      });
      expect(defaultBundle.prompt.fragments).toContainEqual({
        key: 'architecture',
        scope: 'global',
        lines: ['architecture.outline.elementDefinitionDepth: 2'],
      });
      expect(configuredBundle.normalized.architecture.outline.elementDefinitionDepth).toBe(4);
      expect(configuredBundle.prompt.compiledLines).toContain(
        'architecture.outline.elementDefinitionDepth: 4'
      );
    });

    it('normalizes whitespace while preserving whitelist fields', () => {
      const normalized = normalizeProjectConfig({
        schema: ' semantic-model ',
        proseLanguage: ' 中文 ',
        context: '  Team context  ',
        optimization: {
          enabled: false,
          optRetries: 2,
        },
        propose: {
          smartRouting: false,
          requireExplore: false,
        },
        apply: {
          defaultIsolation: 'worktree',
        },
        git: {
          ...gitConfig({
            strategy: 'squash',
            deleteAfterArchive: true,
            commitMessage: {
              archive: 'docs/archive.md',
              merge: 'docs/merge.md',
            },
          }),
        },
        rules: {
          proposal: ['  Rule 1  ', ' ', 'Rule 2'],
          '  ': ['ignored'],
        },
      } as any);

      expect(normalized).toEqual({
        schema: 'semantic-model',
        proseLanguage: '中文',
        context: 'Team context',
        architecture: {
          outline: {
            elementDefinitionDepth: 2,
          },
        },
        optimization: {
          enabled: false,
          optRetries: 2,
        },
        apply: {
          defaultIsolation: 'worktree',
        },
        git: {
          ...gitConfig({
            strategy: 'squash',
            deleteAfterArchive: true,
            commitMessage: {
              archive: 'docs/archive.md',
              merge: 'docs/merge.md',
            },
          }),
        },
        rules: {
          proposal: ['Rule 1', 'Rule 2'],
        },
      });
    });

    it('builds a prompt projection bundle without leaking raw config structure', () => {
      const bundle = buildConfigProjectionBundle(
        {
          schema: 'semantic-model',
          proseLanguage: '中文',
          context: 'Tech stack: TypeScript',
          rules: {
            proposal: ['Include rollback plan'],
            specs: ['Use Given/When/Then'],
          },
        },
        { surface: 'artifact-instructions', artifactId: 'proposal' }
      );

      expect(bundle.normalized.rules).toEqual({
        proposal: ['Include rollback plan'],
        specs: ['Use Given/When/Then'],
      });
      expect(bundle.prompt.fragments).toEqual([
        expect.objectContaining({ key: 'proseLanguage', scope: 'global' }),
        expect.objectContaining({ key: 'context', scope: 'global' }),
        expect.objectContaining({ key: 'rules', scope: 'artifact', lines: ['Include rollback plan'] }),
        expect.objectContaining({ key: 'architecture', scope: 'global' }),
      ]);
      expect(bundle.prompt.compiledLines.join('\n')).toContain('Use 中文 for natural-language prose');
      expect(bundle.prompt.compiledLines.join('\n')).toContain('task titles, check names, Requirement titles, Scenario titles');
      expect(bundle.prompt.compiledLines.join('\n')).toContain('Expect/Evidence descriptions');
      expect(bundle.prompt.compiledLines.join('\n')).toContain('exact existing Requirement titles required for MODIFIED matching');
      expect(bundle.prompt.compiledLines.join('\n')).toContain('English project terminology may remain embedded');
      expect(bundle.prompt.compiledLines.join('\n')).toContain('CRITICAL: All natural-language prose');
      expect(bundle.prompt.compiledLines.join('\n')).toContain('Tech stack: TypeScript');
      expect(bundle.prompt.compiledLines.join('\n')).toContain('Include rollback plan');
      expect(bundle.prompt.compiledLines.join('\n')).not.toContain('Use Given/When/Then');
    });

    it('normalizes config only once when building a projection bundle', () => {
      const trimRule = vi.fn(() => 'Keep duplicates');
      const trimEmptyRule = vi.fn(() => '');
      const config = {
        schema: 'semantic-model',
        decomposition: { skill: 'project-decomposition' },
        rules: {
          ' proposal ': [
            { trim: trimRule },
            { trim: trimRule },
            { trim: trimEmptyRule },
          ],
        },
      } as unknown as ProjectConfig;
      const scope = { surface: 'propose', artifactId: 'proposal' };

      const bundle = buildConfigProjectionBundle(config, scope);

      expect(trimRule).toHaveBeenCalledTimes(2);
      expect(trimEmptyRule).toHaveBeenCalledTimes(1);
      expect(bundle.normalized.rules).toEqual({
        proposal: ['Keep duplicates', 'Keep duplicates'],
      });
      expect(bundle.prompt).toEqual(projectConfigForPrompt(config, scope));
    });

    it('projects git settings for archive prompt consumers', () => {
      const bundle = buildConfigProjectionBundle(
        {
          schema: 'semantic-model',
        git: {
          ...gitConfig(),
        },
          rules: {},
        },
        { surface: 'archive' }
      );

      expect(bundle.normalized.git).toEqual({
        ...gitConfig(),
      });
      expect(bundle.prompt.fragments).toEqual([
        expect.objectContaining({
          key: 'git',
          scope: 'global',
          lines: [
            'git.merge.strategy: no-ff',
            'git.branch.deleteAfterArchive: false',
          ],
        }),
        expect.objectContaining({
          key: 'architecture',
          scope: 'global',
          lines: ['architecture.outline.elementDefinitionDepth: 2'],
        }),
      ]);
    });

    it('keeps archive git projection lines available to archive skill prompts', () => {
      const projection = projectConfigForPrompt(
        {
          schema: 'semantic-model',
        git: {
          ...gitConfig({
            strategy: 'squash',
            deleteAfterArchive: true,
            commitMessage: {
              archive: 'docs/archive.md',
              merge: 'docs/merge.md',
            },
          }),
        },
          rules: {},
        },
        { surface: 'archive' }
      );

      expect(projection.fragments).toEqual([
        expect.objectContaining({
          key: 'git',
          scope: 'global',
          lines: [
            'git.commitMessage.archive: docs/archive.md',
            'git.commitMessage.merge: docs/merge.md',
            'git.merge.strategy: squash',
            'git.branch.deleteAfterArchive: true',
          ],
        }),
        expect.objectContaining({
          key: 'architecture',
          scope: 'global',
          lines: ['architecture.outline.elementDefinitionDepth: 2'],
        }),
      ]);
    });

    it('exposes archive git settings through runtime projection', () => {
      const projection = projectConfigForRuntime(
        {
          schema: 'semantic-model',
        git: {
          ...gitConfig({
            strategy: 'squash',
            deleteAfterArchive: true,
            commitMessage: {
              boundary: 'docs/boundary.md',
              archive: 'docs/archive.md',
              merge: 'docs/merge.md',
            },
          }),
        },
          rules: {},
        },
        { consumer: 'archive' }
      );

      expect(projection.git).toEqual({
        ...gitConfig({
          strategy: 'squash',
          deleteAfterArchive: true,
          commitMessage: {
            boundary: 'docs/boundary.md',
            archive: 'docs/archive.md',
            merge: 'docs/merge.md',
          },
        }),
      });
      expect(projection.fragments).toEqual([
        expect.objectContaining({
          key: 'git',
          scope: 'global',
          lines: [
            'git.commitMessage.boundary: docs/boundary.md',
            'git.commitMessage.archive: docs/archive.md',
            'git.commitMessage.merge: docs/merge.md',
            'git.merge.strategy: squash',
            'git.branch.deleteAfterArchive: true',
          ],
        }),
      ]);
    });

    it('projects opaque decomposition selections only to structural workflows', () => {
      const methodProjection = projectConfigForPrompt(
        {
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          rules: {},
        },
        { surface: 'build' }
      );
      const skillProjection = projectConfigForPrompt(
        {
          schema: 'semantic-model',
          decomposition: { skill: 'xirang-project-decomposition' },
          rules: {},
        },
        { surface: 'explore' }
      );
      const applyProjection = projectConfigForPrompt(
        {
          schema: 'semantic-model',
          decomposition: { method: 'c4' },
          rules: {},
        },
        { surface: 'apply' }
      );

      expect(normalizeProjectConfig({
        schema: 'semantic-model',
        decomposition: { skill: 'xirang-project-decomposition' },
      }).decomposition).toEqual({ skill: 'xirang-project-decomposition' });
      expect(methodProjection.fragments).toContainEqual({
        key: 'decomposition',
        scope: 'global',
        lines: ['decomposition.method: c4'],
      });
      expect(skillProjection.fragments).toContainEqual({
        key: 'decomposition',
        scope: 'global',
        lines: ['decomposition.skill: xirang-project-decomposition'],
      });
      expect(applyProjection.fragments.some((fragment) => fragment.key === 'decomposition')).toBe(false);
      expect(methodProjection.compiledLines.join('\n')).not.toMatch(/container|component|\.pi\/skills/);
    });

    it('omits invalid or missing fields from runtime projection and marks proseLanguage as fingerprint-affecting', () => {
      const runtimeProjection = projectConfigForRuntime(
        {
          schema: 'semantic-model',
          proseLanguage: '中文',
          rules: {},
        },
        { consumer: 'bootstrap-review' }
      );

      expect(runtimeProjection.proseLanguage).toBe('中文');
      expect(runtimeProjection.affectsFingerprint).toBe(true);
      expect(runtimeProjection.forbidHardcodedEnglishBoilerplate).toBe(true);
      expect(runtimeProjection.fragments).toEqual([
        expect.objectContaining({ key: 'proseLanguage' }),
      ]);
      expect(runtimeProjection.fragments[0].lines.join('\n')).toContain('task titles, check names, Requirement titles, Scenario titles');
      expect(runtimeProjection.fragments[0].lines.join('\n')).toContain('ordinary English sentences');
      expect(runtimeProjection.fragments[0].lines.join('\n')).toContain('CRITICAL: All natural-language prose');
    });
  });
});
