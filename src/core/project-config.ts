import { OPSX_DIR_NAME } from './config.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  isMap,
  parse as parseYaml,
  parseDocument,
  stringify as stringifyYaml,
  type Document,
  type Node,
} from 'yaml';
import { z } from 'zod';
import { BuiltInSchemaIdSchema } from './artifact-graph/types.js';

export const PROJECT_CONFIG_FUNCTIONAL_DEFAULTS = {
  optimization: {
    enabled: true,
    optRetries: 2,
  },
  apply: {
    defaultIsolation: 'ask' as const,
  },
  git: {
    merge: {
      strategy: 'no-ff' as const,
    },
    branch: {
      deleteAfterArchive: false,
    },
  },
};

const DEFAULT_PROJECT_SCHEMA = 'spec-driven';

export type ProjectConfigDefaultsMigrationResult =
  | { status: 'created'; path: string }
  | { status: 'updated'; path: string }
  | { status: 'unchanged'; path: string }
  | { status: 'skipped'; path: string; reason: 'invalid-yaml' | 'non-object' };

const gitMergeStrategyField = z.enum(['no-ff', 'ff-only', 'squash']);
const gitDeleteAfterArchiveField = z.boolean();
const gitCommitMessagePathField = z
  .string()
  .min(1)
  .refine((value) => {
    const normalized = path.posix.normalize(value);
    return (
      !path.posix.isAbsolute(value) &&
      !path.win32.isAbsolute(value) &&
      !value.includes('\\') &&
      normalized !== '..' &&
      !normalized.startsWith('../')
    );
  });

/**
 * Zod schema for project configuration.
 *
 * Purpose:
 * 1. Documentation - clearly defines the config file structure
 * 2. Type safety - TypeScript infers ProjectConfig type from schema
 * 3. Runtime validation - uses safeParse() for resilient field-by-field validation
 *
 * Why Zod over manual validation:
 * - Helps understand OPSX's data interfaces at a glance
 * - Single source of truth for type and validation
 * - Consistent with other OPSX schemas
 */
export const ProjectConfigSchema = z.object({
  // Required: which built-in workflow schema to use
  schema: BuiltInSchemaIdSchema.describe('The built-in workflow schema to use'),

  // Optional: natural-language prose language for OPSX artifacts
  proseLanguage: z
    .string()
    .min(1)
    .optional()
    .describe('Language for natural-language prose in OPSX artifacts'),
  docLanguage: z
    .string()
    .min(1)
    .optional()
    .describe('Deprecated alias for proseLanguage'),

  // Optional: project context (injected into all artifact instructions)
  // Max size: 50KB (enforced during parsing)
  context: z
    .string()
    .optional()
    .describe('Project context injected into all artifact instructions'),

  // Optional: verify Phase 2 optimization policy
  optimization: z
    .object({
      enabled: z.boolean().optional().default(true),
      optRetries: z.number().int().min(0).max(10).optional().default(2),
    })
    .optional()
    .describe('Project-level Phase 2 optimization policy for verify workflows'),

  // Optional: apply-stage implementation policy
  apply: z
    .object({
      defaultIsolation: z.enum(['ask', 'branch', 'worktree', 'none']).optional().default('ask'),
    })
    .optional()
    .describe('Apply-stage branch/worktree isolation policy'),

  // Optional: git archive/merge policy
  git: z
    .object({
      commitMessage: z
        .object({
          boundary: gitCommitMessagePathField.optional(),
          archive: gitCommitMessagePathField.optional(),
          merge: gitCommitMessagePathField.optional(),
        })
        .optional(),
      merge: z
        .object({
          strategy: z.enum(['no-ff', 'ff-only', 'squash']).optional().default('no-ff'),
        })
        .optional()
        .default({ strategy: 'no-ff' }),
      branch: z
        .object({
          deleteAfterArchive: z.boolean().optional().default(false),
        })
        .optional()
        .default({ deleteAfterArchive: false }),
    })
    .optional()
    .describe('Git archive and merge policy'),

  // Optional: per-artifact rules (additive to schema's built-in guidance)
  rules: z
    .record(
      z.string(), // artifact ID
      z.array(z.string()) // list of rules
    )
    .optional()
    .describe('Per-artifact rules, keyed by artifact ID'),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB hard limit

type MaterializedProjectConfigDefaults = Pick<ProjectConfig, 'schema'> &
  Partial<Pick<ProjectConfig, 'proseLanguage'>> & {
    optimization: typeof PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.optimization;
    apply: typeof PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.apply;
    git: typeof PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git;
  };

function cloneFunctionalDefaults() {
  return {
    optimization: {
      ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.optimization,
    },
    apply: {
      ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.apply,
    },
    git: {
      merge: {
        ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git.merge,
      },
      branch: {
        ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git.branch,
      },
    },
  };
}

export function materializeProjectConfigDefaults(
  config: Pick<ProjectConfig, 'schema'> & Partial<Pick<ProjectConfig, 'proseLanguage'>>
): MaterializedProjectConfigDefaults {
  const defaults = cloneFunctionalDefaults();
  return config.proseLanguage
    ? { schema: config.schema, proseLanguage: config.proseLanguage, ...defaults }
    : { schema: config.schema, ...defaults };
}

function findProjectConfigPath(projectRoot: string): { path: string; exists: boolean } {
  const yamlPath = path.join(projectRoot, OPSX_DIR_NAME, 'config.yaml');
  if (existsSync(yamlPath)) {
    return { path: yamlPath, exists: true };
  }

  const ymlPath = path.join(projectRoot, OPSX_DIR_NAME, 'config.yml');
  if (existsSync(ymlPath)) {
    return { path: ymlPath, exists: true };
  }

  return { path: yamlPath, exists: false };
}

function setMissingPath(document: Document, keys: readonly string[], value: unknown): boolean {
  let current: Node | null | undefined = document.contents;
  for (const key of keys.slice(0, -1)) {
    if (!current || !isMap(current)) {
      return false;
    }
    if (!current.has(key)) {
      current.set(key, document.createNode({}));
    }
    current = current.get(key, true);
  }

  if (!current || !isMap(current)) {
    return false;
  }

  const leaf = keys[keys.length - 1];
  if (current.has(leaf)) {
    return false;
  }

  current.set(leaf, value);
  return true;
}

function deletePath(document: Document, keys: readonly string[]): boolean {
  let current: Node | null | undefined = document.contents;
  for (const key of keys.slice(0, -1)) {
    if (!current || !isMap(current)) {
      return false;
    }
    current = current.get(key, true);
  }

  if (!current || !isMap(current)) {
    return false;
  }

  const leaf = keys[keys.length - 1];
  if (!current.has(leaf)) {
    return false;
  }

  current.delete(leaf);
  return true;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateProjectConfigDefaults(projectRoot: string): ProjectConfigDefaultsMigrationResult {
  const configPath = findProjectConfigPath(projectRoot);
  if (!configPath.exists) {
    const defaults = materializeProjectConfigDefaults({ schema: DEFAULT_PROJECT_SCHEMA });
    writeFileSync(configPath.path, stringifyYaml(defaults), 'utf-8');
    return { status: 'created', path: configPath.path };
  }

  const content = readFileSync(configPath.path, 'utf-8');
  const document = parseDocument(content);
  if (document.errors.length > 0) {
    return { status: 'skipped', path: configPath.path, reason: 'invalid-yaml' };
  }
  if (!document.contents || !isMap(document.contents)) {
    return { status: 'skipped', path: configPath.path, reason: 'non-object' };
  }

  const defaults = materializeProjectConfigDefaults({ schema: DEFAULT_PROJECT_SCHEMA });
  let changed = false;
  changed = setMissingPath(document, ['schema'], defaults.schema) || changed;
  changed = setMissingPath(document, ['optimization', 'enabled'], defaults.optimization.enabled) || changed;
  changed = setMissingPath(document, ['optimization', 'optRetries'], defaults.optimization.optRetries) || changed;
  changed = setMissingPath(document, ['apply', 'defaultIsolation'], defaults.apply.defaultIsolation) || changed;
  changed = deletePath(document, ['git', 'autoCommit']) || changed;
  changed = deletePath(document, ['git', 'archive', 'commitMessage', 'convention']) || changed;
  changed = deletePath(document, ['git', 'archive', 'commitMessage']) || changed;
  changed = deletePath(document, ['git', 'archive']) || changed;
  changed = setMissingPath(document, ['git', 'merge', 'strategy'], defaults.git.merge.strategy) || changed;
  changed = deletePath(document, ['git', 'merge', 'messageFrom']) || changed;
  changed = deletePath(document, ['git', 'merge', 'commitMessage', 'convention']) || changed;
  changed = deletePath(document, ['git', 'merge', 'commitMessage']) || changed;
  changed = setMissingPath(document, ['git', 'branch', 'deleteAfterArchive'], defaults.git.branch.deleteAfterArchive) || changed;

  if (!changed) {
    return { status: 'unchanged', path: configPath.path };
  }

  writeFileSync(configPath.path, String(document), 'utf-8');
  return { status: 'updated', path: configPath.path };
}

/**
 * Read and parse .opsx/config.yaml from project root.
 * Uses resilient parsing - validates each field independently using Zod safeParse.
 * Returns null if file doesn't exist.
 * Returns partial config if some fields are invalid (with warnings).
 *
 * Performance note (Jan 2025):
 * Benchmarks showed direct file reads are fast enough without caching:
 * - Typical config (1KB): ~0.5ms per read
 * - Large config (50KB): ~1.6ms per read
 * - Missing config: ~0.01ms per read
 * Config is read 1-2 times per command (schema resolution + instruction loading),
 * adding ~1-3ms total overhead. Caching would add complexity (mtime checks,
 * invalidation logic) for negligible benefit. Direct reads also ensure config
 * changes are reflected immediately without stale cache issues.
 *
 * @param projectRoot - The root directory of the project (where `.opsx/` lives)
 * @returns Parsed config or null if file doesn't exist
 */
export function readProjectConfig(projectRoot: string): ProjectConfig | null {
  // Try both .yaml and .yml, prefer .yaml
  let configPath = path.join(projectRoot, OPSX_DIR_NAME, 'config.yaml');
  if (!existsSync(configPath)) {
    configPath = path.join(projectRoot, OPSX_DIR_NAME, 'config.yml');
    if (!existsSync(configPath)) {
      return null; // No config is OK
    }
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const raw = parseYaml(content);

    if (!raw || typeof raw !== 'object') {
      console.warn(`.opsx/config.yaml is not a valid YAML object`);
      return null;
    }

    const config: Partial<ProjectConfig> = {};

    const schemaResult = BuiltInSchemaIdSchema.safeParse(raw.schema);
    if (schemaResult.success) {
      config.schema = schemaResult.data;
    } else if (raw.schema !== undefined) {
      console.warn(
        `Unsupported schema '${String(raw.schema)}' in .opsx/config.yaml. Available: spec-driven`
      );
      return null;
    }

    // Parse proseLanguage field using Zod, with docLanguage as a legacy fallback.
    if (raw.proseLanguage !== undefined) {
      const proseLanguageField = z.string().min(1);
      const proseLanguageResult = proseLanguageField.safeParse(raw.proseLanguage);

      if (proseLanguageResult.success) {
        config.proseLanguage = proseLanguageResult.data;
      } else {
        console.warn(`Invalid 'proseLanguage' field in config (must be non-empty string)`);
      }
    } else if (raw.docLanguage !== undefined) {
      const proseLanguageField = z.string().min(1);
      const proseLanguageResult = proseLanguageField.safeParse(raw.docLanguage);

      if (proseLanguageResult.success) {
        config.proseLanguage = proseLanguageResult.data;
      } else {
        console.warn(`Invalid 'docLanguage' field in config (must be non-empty string)`);
      }
    }

    // Parse context field with size limit
    if (raw.context !== undefined) {
      const contextField = z.string();
      const contextResult = contextField.safeParse(raw.context);

      if (contextResult.success) {
        const contextSize = Buffer.byteLength(contextResult.data, 'utf-8');
        if (contextSize > MAX_CONTEXT_SIZE) {
          console.warn(
            `Context too large (${(contextSize / 1024).toFixed(1)}KB, limit: ${MAX_CONTEXT_SIZE / 1024}KB)`
          );
          console.warn(`Ignoring context field`);
        } else {
          config.context = contextResult.data;
        }
      } else {
        console.warn(`Invalid 'context' field in config (must be string)`);
      }
    }

    // Parse optimization field using Zod
    if (raw.optimization !== undefined) {
      const optimizationField = z.object({
        enabled: z.boolean().optional().default(true),
        optRetries: z.number().int().min(0).max(10).optional().default(2),
      });
      const optimizationResult = optimizationField.safeParse(raw.optimization);

      if (optimizationResult.success) {
        config.optimization = optimizationResult.data;
      } else {
        console.warn(`Invalid 'optimization' field in config (must be an object with boolean 'enabled' and optional integer 'optRetries')`);
      }
    }

    // Parse apply field using Zod
    if (raw.apply !== undefined) {
      const applyField = z.object({
        defaultIsolation: z.enum(['ask', 'branch', 'worktree', 'none']).optional().default('ask'),
      });
      const applyResult = applyField.safeParse(raw.apply);

      if (applyResult.success) {
        config.apply = applyResult.data;
      } else {
        console.warn(`Invalid 'apply' field in config (must be an object with defaultIsolation: ask | branch | worktree | none)`);
      }
    }

    config.git = cloneFunctionalDefaults().git;
    const gitConfig = config.git!;
    if (raw.git !== undefined) {
      if (!isPlainRecord(raw.git)) {
        console.warn(`Invalid 'git' field in config (must be an object)`);
      } else {
        const rawGit = raw.git;

        if (rawGit.autoCommit !== undefined) {
          console.warn(
            'git.autoCommit is deprecated and ignored; archive handoff is always handled by the agent'
          );
        }

        if (rawGit.commitMessage !== undefined) {
          if (isPlainRecord(rawGit.commitMessage)) {
            const commitMessage: NonNullable<ProjectConfig['git']>['commitMessage'] = {};
            for (const key of ['boundary', 'archive', 'merge'] as const) {
              const value = rawGit.commitMessage[key];
              if (value === undefined) {
                continue;
              }

              const result = gitCommitMessagePathField.safeParse(value);
              if (result.success) {
                commitMessage[key] = result.data;
              } else {
                console.warn(`git.commitMessage.${key} must be a POSIX relative path without ..`);
              }
            }

            if (Object.keys(commitMessage).length > 0) {
              gitConfig.commitMessage = commitMessage;
            }
          } else {
            console.warn(`Invalid 'git.commitMessage' field in config (must be an object)`);
          }
        }

        if (rawGit.archive !== undefined) {
          if (isPlainRecord(rawGit.archive)) {
            const rawArchive = rawGit.archive;
            const rawCommitMessage = rawArchive.commitMessage;
            if (isPlainRecord(rawCommitMessage) && rawCommitMessage.convention !== undefined) {
              console.warn(
                'git.archive.commitMessage.convention is deprecated and ignored; use git.commitMessage.archive for path overrides'
              );
            }
          } else {
            console.warn(`Invalid 'git.archive' field in config (must be an object)`);
          }
        }

        if (rawGit.merge !== undefined) {
          if (isPlainRecord(rawGit.merge)) {
            const rawMerge = rawGit.merge;

            if (rawMerge.strategy !== undefined) {
              const strategyResult = gitMergeStrategyField.safeParse(rawMerge.strategy);
              if (strategyResult.success) {
                gitConfig.merge.strategy = strategyResult.data;
              } else {
                console.warn('git.merge.strategy must be one of: no-ff, ff-only, squash');
              }
            }

            const rawCommitMessage = rawMerge.commitMessage;
            if (isPlainRecord(rawCommitMessage) && rawCommitMessage.convention !== undefined) {
              console.warn(
                'git.merge.commitMessage.convention is deprecated and ignored; use git.commitMessage.merge for path overrides'
              );
            }
          } else {
            console.warn(`Invalid 'git.merge' field in config (must be an object)`);
          }
        }

        if (rawGit.branch !== undefined) {
          if (isPlainRecord(rawGit.branch)) {
            const rawBranch = rawGit.branch;

            if (rawBranch.deleteAfterArchive !== undefined) {
              const deleteAfterArchiveResult = gitDeleteAfterArchiveField.safeParse(rawBranch.deleteAfterArchive);
              if (deleteAfterArchiveResult.success) {
                gitConfig.branch.deleteAfterArchive = deleteAfterArchiveResult.data;
              } else {
                console.warn('git.branch.deleteAfterArchive must be boolean');
              }
            }
          } else {
            console.warn(`Invalid 'git.branch' field in config (must be an object)`);
          }
        }
      }
    }

    // Parse rules field using Zod
    if (raw.rules !== undefined) {
      // First check if it's an object structure (guard against null since typeof null === 'object')
      if (isPlainRecord(raw.rules)) {
        const parsedRules: Record<string, string[]> = {};
        let hasValidRules = false;

        for (const [artifactId, rules] of Object.entries(raw.rules)) {
          const rulesArrayResult = z.array(z.string()).safeParse(rules);

          if (rulesArrayResult.success) {
            // Filter out empty strings
            const validRules = rulesArrayResult.data.filter((r) => r.length > 0);
            if (validRules.length > 0) {
              parsedRules[artifactId] = validRules;
              hasValidRules = true;
            }
            if (validRules.length < rulesArrayResult.data.length) {
              console.warn(
                `Some rules for '${artifactId}' are empty strings, ignoring them`
              );
            }
          } else {
            console.warn(
              `Rules for '${artifactId}' must be an array of strings, ignoring this artifact's rules`
            );
          }
        }

        if (hasValidRules) {
          config.rules = parsedRules;
        }
      } else {
        console.warn(`Invalid 'rules' field in config (must be object)`);
      }
    }

    // Return partial config even if some fields failed
    return Object.keys(config).length > 0 ? (config as ProjectConfig) : null;
  } catch (error) {
    console.warn(`Failed to parse .opsx/config.yaml:`, error);
    return null;
  }
}

/**
 * Validate artifact IDs in rules against a schema's artifacts.
 * Called during instruction loading (when schema is known).
 * Returns warnings for unknown artifact IDs.
 *
 * @param rules - The rules object from config
 * @param validArtifactIds - Set of valid artifact IDs from the schema
 * @param schemaName - Name of the schema for error messages
 * @returns Array of warning messages for unknown artifact IDs
 */
export function validateConfigRules(
  rules: Record<string, string[]>,
  validArtifactIds: Set<string>,
  schemaName: string
): string[] {
  const warnings: string[] = [];

  for (const artifactId of Object.keys(rules)) {
    if (!validArtifactIds.has(artifactId)) {
      const validIds = Array.from(validArtifactIds).sort().join(', ');
      warnings.push(
        `Unknown artifact ID in rules: "${artifactId}". ` +
          `Valid IDs for schema "${schemaName}": ${validIds}`
      );
    }
  }

  return warnings;
}
