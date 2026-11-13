import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { atomicWriteConfig } from '../../src/core/config-migration.js';
import {
  materializeProjectConfigDefaults,
  migrateProjectConfigDefaults,
  readProjectConfig,
  validateConfigRules,
  type ProjectConfig,
} from '../../src/core/project-config.js';
import {
  normalizeProjectConfig,
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
    consoleWarnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    consoleWarnSpy.mockRestore();
  });

  describe('materializeProjectConfigDefaults', () => {
    it('should include only functional disk defaults', () => {
      const defaults = materializeProjectConfigDefaults({ schema: 'semantic-model' });

      expect(defaults).toEqual({
        configVersion: 1,
        schema: 'semantic-model',
        decomposition: 'xirang-semantic-refinement.md',
        architecture: {
          outline: {
            definitionDepth: 2,
          },
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
    const steps = Array.from({ length: 10 }, (_, index) => ({
      fromVersion: index + 5, toVersion: index + 6,
      migrate: (content: string) => content.replace('# managed old', '# managed current'),
      changes: ['Refresh managed description'],
    }));
    function write(source: string, name = 'config.yaml') {
      fs.mkdirSync(path.join(tempDir, '.xirang'), { recursive: true });
      const file = path.join(tempDir, '.xirang', name);
      fs.writeFileSync(file, source);
      return file;
    }
    it('does not restore missing project configuration', () => {
      fs.mkdirSync(path.join(tempDir, '.xirang'));
      expect(migrateProjectConfigDefaults(tempDir).status).toBe('skipped');
      expect(fs.existsSync(path.join(tempDir, '.xirang', 'config.yaml'))).toBe(false);
    });
    it('executes ten migrations atomically in the selected yml while preserving user bytes', () => {
      const source = '# my comment\r\nconfigVersion: 5 # version\r\nschema: semantic-model\r\ncontext: |\r\n  Keep this background\r\napply: { defaultIsolation: worktree }\r\n# managed old\r\n';
      const file = write(source, 'config.yml');
      expect(migrateProjectConfigDefaults(tempDir, { targetVersion: 15, migrations: steps })).toMatchObject({ status: 'updated', path: file });
      const expected = source.replace('configVersion: 5', 'configVersion: 15').replace('# managed old', '# managed current');
      expect(fs.readFileSync(file, 'utf8')).toBe(expected);
      expect(fs.existsSync(path.join(tempDir, '.xirang', 'config.yaml'))).toBe(false);
      expect(migrateProjectConfigDefaults(tempDir, { targetVersion: 15, migrations: steps }).status).toBe('unchanged');
      expect(fs.readFileSync(file, 'utf8')).toBe(expected);
    });
    it('cleans the exclusive temporary file when an atomic rename fails', () => {
      const destination = path.join(tempDir, 'destination');
      fs.mkdirSync(destination);
      fs.writeFileSync(path.join(destination, 'user.txt'), 'keep');
      expect(() => atomicWriteConfig(destination, 'new content')).toThrow();
      expect(fs.readdirSync(tempDir)).toEqual(['destination']);
      expect(fs.readFileSync(path.join(destination, 'user.txt'), 'utf8')).toBe('keep');
    });
    it.each([
      ['outside window', 'configVersion: 3\nschema: semantic-model\n', steps, undefined, /current 3, target 15, minimum supported start 5/],
      ['missing step', 'configVersion: 5\nschema: semantic-model\n', steps.filter(step => step.fromVersion !== 7), undefined, /unsupported-chain/],
      ['missing version', 'schema: semantic-model\n', steps, undefined, /invalid-version/],
      ['string version', 'configVersion: "5"\n', steps, undefined, /invalid-version/],
      ['zero version', 'configVersion: 0\n', steps, undefined, /invalid-version/],
      ['newer version', 'configVersion: 16\n', steps, undefined, /newer-version/],
      ['invalid yaml', 'configVersion: [', steps, undefined, /invalid-yaml/],
      ['second step failure', 'configVersion: 5\n', steps.map(step => step.fromVersion === 6 ? { ...step, migrate: () => { throw new Error('step failure'); } } : step), undefined, /step failure/],
      ['invalid final value', 'configVersion: 5\n', steps.map(step => ({ ...step, migrate: (text: string) => text + 'unknown: true\n' })), undefined, /invalid/],
      ['write failure', 'configVersion: 5\n', steps, () => { throw new Error('write failure'); }, /write failure/],
    ])('keeps original bytes on %s', (_name, source, migrations, writeBoundary, reason) => {
      const file = write(source as string);
      const result = migrateProjectConfigDefaults(tempDir, { targetVersion: 15, migrations: migrations as typeof steps, write: writeBoundary as undefined });
      expect(result).toMatchObject({ status: 'skipped', reason: expect.stringMatching(reason as RegExp) });
      expect(fs.readFileSync(file, 'utf8')).toBe(source);
    });
  });

  describe('readProjectConfig', () => {
    describe('decomposition', () => {
      it.each([
        'c4',
        'xirang-semantic-refinement.md',
        'xirang-project-decomposition',
        '.pi/skills/foo/SKILL.md',
      ])('loads a bare-name or path selection: %s', (value) => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: semantic-model\ndecomposition: ${value}\n`
        );

        const config = readProjectConfig(tempDir);

        expect(config?.decomposition).toBe(value);
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('uses semantic refinement when the field is missing', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'config.yaml'), 'schema: semantic-model\n');

        expect(readProjectConfig(tempDir)?.decomposition).toBe('xirang-semantic-refinement.md');
      });

      it.each([
        ['non-string map', '  method: c4'],
        ['empty string', '""'],
        ['absolute path', '/abs/c4.md'],
        ['parent traversal', '../escape.md'],
        ['invalid bare name', 'bad name!'],
      ])('warns and omits an invalid value: %s', (_label, value) => {
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
        ['negative', '  outline:\n    definitionDepth: -1'],
        ['non-integer', '  outline:\n    definitionDepth: 1.5'],
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
            definitionDepth: 2,
          },
        });
        expect(config?.context).toBe('keep me');
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid 'architecture.outline.definitionDepth'")
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
    definitionDepth: 4
`
        );

        expect(readProjectConfig(tempDir)?.architecture).toEqual({
          outline: {
            definitionDepth: 4,
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
  semantic-delta:
    - Use Given/When/Then format
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: 'xirang-semantic-refinement.md',
          proseLanguage: 'zh-CN',
          context: 'Tech stack: TypeScript, React\nAPI style: RESTful\n',
          git: gitConfig(),
          rules: {
            proposal: ['Include rollback plan', 'Identify affected teams'],
            'semantic-delta': ['Use Given/When/Then format'],
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
          git: gitConfig(),
        });
      });

      it('warns about retired optimization fields without rewriting the project file', () => {
        const configDir = path.join(tempDir, '.xirang');
        const configPath = path.join(configDir, 'config.yaml');
        const source = `schema: semantic-model
optimization:
  enabled: false
  directionLimit: 3
  directionRetries: 2
  minImpactLevel: low
`;
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(configPath, source);

        const config = readProjectConfig(tempDir);

        expect(config).not.toHaveProperty('optimization');
        expect(consoleWarnSpy.mock.calls.flat().join('\\n')).toContain('optimization is retired and ignored');
        expect(consoleWarnSpy.mock.calls.flat().join('\\n')).toContain('optimization is retired and ignored');
        expect(fs.readFileSync(configPath, 'utf-8')).toBe(source);
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
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

      it('rejects an invalid schema independently of valid context', () => {
        const configDir = path.join(tempDir, '.xirang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(
          path.join(configDir, 'config.yaml'),
          `schema: custom-schema
context: Valid context here
`
        );

        expect(readProjectConfig(tempDir)).toMatchObject({ context: 'Valid context here' });
        expect(readProjectConfig(tempDir)).not.toHaveProperty('schema');
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
          context: 'Valid context',
          git: gitConfig(),
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("optimization is retired and ignored")
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
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
          decomposition: 'xirang-semantic-refinement.md',
          git: gitConfig(),
          rules: {
            proposal: ['Valid rule', 'Another valid rule'],
          },
        });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Rules for 'proposal' contain invalid or empty strings")
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
  semantic-delta:
    - Valid rule
`
        );

        const config = readProjectConfig(tempDir);

        expect(config).toEqual({
          schema: 'semantic-model',
          decomposition: 'xirang-semantic-refinement.md',
          git: gitConfig(),
          rules: {
            'semantic-delta': ['Valid rule'],
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
          expect.stringContaining('Failed to parse .xirang/config.yaml')
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
          decomposition: 'xirang-semantic-refinement.md',
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

        expect(readProjectConfig(tempDir)).toMatchObject({ context: 'from yml' });
        expect(readProjectConfig(tempDir)).not.toHaveProperty('schema');
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
          definitionDepth: 2,
        },
      });
    });

    it('normalizes whitespace while preserving supported fields', () => {
      const normalized = normalizeProjectConfig({
        schema: ' semantic-model ',
        proseLanguage: ' 中文 ',
        context: '  Team context  ',
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
        context: '  Team context  ',
        architecture: {
          outline: {
            definitionDepth: 2,
          },
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
          proposal: ['  Rule 1  ', 'Rule 2'],
        },
      });
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

    it('normalizes decomposition names and preserves explicit paths', () => {
      expect(normalizeProjectConfig({
        schema: 'semantic-model',
        decomposition: 'c4',
      }).decomposition).toBe('.xirang/references/c4.md');
      expect(normalizeProjectConfig({
        schema: 'semantic-model',
        decomposition: '.pi/skills/foo/SKILL.md',
      }).decomposition).toBe('.pi/skills/foo/SKILL.md');
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
      expect(runtimeProjection.fragments[0].lines.join('\n')).toContain('task titles, check names, Section titles, Acceptance Case titles');
      expect(runtimeProjection.fragments[0].lines.join('\n')).toContain('ordinary English sentences');
      expect(runtimeProjection.fragments[0].lines.join('\n')).toContain('CRITICAL: All natural-language prose');
    });
  });
});
