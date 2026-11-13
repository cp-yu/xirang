import { diagnostic } from '../utils/output.js';
import { XIRANG_DIR_NAME } from './config.js';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { resolveSchema } from './artifact-graph/resolver.js';
import { BuiltInSchemaIdSchema } from './artifact-graph/types.js';

export const CURRENT_CONFIG_VERSION = 1;

export const PROJECT_CONFIG_FUNCTIONAL_DEFAULTS = {
  configVersion: CURRENT_CONFIG_VERSION,
  decomposition: 'xirang-semantic-refinement.md' as const,
  architecture: {
    outline: {
      definitionDepth: 2,
    },
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

const decompositionBareNameField = z.string().regex(/^[A-Za-z0-9._-]+$/);
const decompositionField = z.string().min(1).superRefine((value, ctx) => {
  if (value.includes('/')) {
    const normalized = path.posix.normalize(value);
    if (
      path.posix.isAbsolute(value) ||
      path.win32.isAbsolute(value) ||
      value.includes('\\') ||
      normalized === '..' ||
      normalized.startsWith('../')
    ) {
      ctx.addIssue({ code: 'custom', message: 'decomposition path must be project-root relative' });
    }
    return;
  }
  if (!decompositionBareNameField.safeParse(value).success) {
    ctx.addIssue({ code: 'custom', message: 'decomposition bare name must match [A-Za-z0-9._-]+' });
  }
});

export function resolveDecompositionPath(value: string): string {
  if (value.includes('/')) return value;
  return `.xirang/references/${value.endsWith('.md') ? value : `${value}.md`}`;
}
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
 * - Helps understand Xirang's data interfaces at a glance
 * - Single source of truth for type and validation
 * - Consistent with other Xirang schemas
 */
export const ProjectConfigSchema = z.object({
  configVersion: z.number().int().min(1).optional(),
  // Required: which built-in workflow schema to use
  schema: BuiltInSchemaIdSchema.describe('The built-in workflow schema to use'),

  // Optional: natural-language prose language for Xirang artifacts
  proseLanguage: z
    .string()
    .min(1)
    .optional()
    .describe('Language for natural-language prose in Xirang artifacts'),
  docLanguage: z
    .string()
    .min(1)
    .optional()
    .describe('Deprecated alias for proseLanguage'),

  // Optional: hierarchy decomposition selection
  decomposition: decompositionField
    .optional()
    .describe('Decomposition guidance file: a project-root relative path, or a bare name resolved under .xirang/references/'),

  // Optional: project context (injected into all artifact instructions)
  // Max size: 50KB (enforced during parsing)
  context: z
    .string()
    .optional()
    .describe('Project context injected into all artifact instructions'),

  // Optional: Agent semantic-model outline projection
  architecture: z
    .object({
      outline: z
        .object({
          definitionDepth: z.number().int().min(0).optional().default(
            PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.architecture.outline.definitionDepth
          ),
        })
        .optional()
        .default({ ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.architecture.outline }),
    })
    .optional()
    .describe('Agent semantic-model outline projection settings'),

  // Optional: apply-stage implementation policy
  apply: z
    .object({
      defaultIsolation: z.enum(['ask', 'branch', 'worktree', 'none']).optional().default(
        PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.apply.defaultIsolation
      ),
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
          strategy: z.enum(['no-ff', 'ff-only', 'squash']).optional().default(
            PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git.merge.strategy
          ),
        })
        .optional()
        .default({ ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git.merge }),
      branch: z
        .object({
          deleteAfterArchive: z.boolean().optional().default(
            PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git.branch.deleteAfterArchive
          ),
        })
        .optional()
        .default({ ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git.branch }),
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

const emittedRuleWarnings = new Set<string>();

const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB hard limit

type MaterializedProjectConfigDefaults = Pick<ProjectConfig, 'schema'> & { configVersion: number } &
  Partial<Pick<ProjectConfig, 'proseLanguage'>> & {
    decomposition: typeof PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.decomposition;
    architecture: typeof PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.architecture;
    apply: typeof PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.apply;
    git: typeof PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.git;
  };

function cloneFunctionalDefaults() {
  return {
    configVersion: CURRENT_CONFIG_VERSION,
    decomposition: PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.decomposition,
    architecture: {
      outline: {
        ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.architecture.outline,
      },
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export { migrateProjectConfigDefaults } from './config-migration.js';

/**
 * Read and parse .xirang/config.yaml from project root.
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
 * @param projectRoot - The root directory of the project (where `.xirang/` lives)
 * @returns Parsed config or null if file doesn't exist
 */
export function readProjectConfig(projectRoot: string, warn: (message: string) => void = (message) => diagnostic(message, 'CONFIG_WARNING')): ProjectConfig | null {
  // Try both .yaml and .yml, prefer .yaml
  let configPath = path.join(projectRoot, XIRANG_DIR_NAME, 'config.yaml');
  if (!existsSync(configPath)) {
    configPath = path.join(projectRoot, XIRANG_DIR_NAME, 'config.yml');
    if (!existsSync(configPath)) {
      return null; // No config is OK
    }
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const raw = parseYaml(content);

    if (!raw || typeof raw !== 'object') {
      warn(`.xirang/config.yaml is not a valid YAML object`);
      return null;
    }

    const config: Partial<ProjectConfig> = {};
    const version = ProjectConfigSchema.shape.configVersion.safeParse(raw.configVersion);
    if (version.success && version.data !== undefined) config.configVersion = version.data;
    else if (raw.configVersion !== undefined) warn('Invalid configVersion: expected an integer >= 1');

    const schemaResult = BuiltInSchemaIdSchema.safeParse(raw.schema);
    if (schemaResult.success) {
      config.schema = schemaResult.data;
    } else if (raw.schema !== undefined) {
      warn(
        `Unsupported schema '${String(raw.schema)}' in .xirang/config.yaml. Available: semantic-model`
      );
    }

    // Parse proseLanguage field using Zod, with docLanguage as a legacy fallback.
    if (raw.proseLanguage !== undefined) {
      const proseLanguageField = z.string().min(1);
      const proseLanguageResult = proseLanguageField.safeParse(raw.proseLanguage);

      if (proseLanguageResult.success) {
        config.proseLanguage = proseLanguageResult.data;
      } else {
        warn(`Invalid 'proseLanguage' field in config (must be non-empty string)`);
      }
    } else if (raw.docLanguage !== undefined) {
      const proseLanguageField = z.string().min(1);
      const proseLanguageResult = proseLanguageField.safeParse(raw.docLanguage);

      if (proseLanguageResult.success) {
        config.proseLanguage = proseLanguageResult.data;
      } else {
        warn(`Invalid 'docLanguage' field in config (must be non-empty string)`);
      }
    }

    // Parse decomposition as a single string. Invalid explicit values fail closed.
    if (raw.decomposition === undefined) {
      config.decomposition = PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.decomposition;
    } else {
      const decompositionResult = decompositionField.safeParse(raw.decomposition);
      if (decompositionResult.success) {
        config.decomposition = decompositionResult.data;
      } else {
        warn(
          `Invalid 'decomposition' field in config (must be a project-root relative path or a bare name matching [A-Za-z0-9._-]+)`
        );
      }
    }

    // Parse context field with size limit
    if (raw.context !== undefined) {
      const contextField = z.string();
      const contextResult = contextField.safeParse(raw.context);

      if (contextResult.success) {
        const contextSize = Buffer.byteLength(contextResult.data, 'utf-8');
        if (contextSize > MAX_CONTEXT_SIZE) {
          warn(
            `Context too large (${(contextSize / 1024).toFixed(1)}KB, limit: ${MAX_CONTEXT_SIZE / 1024}KB)`
          );
          warn(`Ignoring context field`);
        } else {
          config.context = contextResult.data;
        }
      } else {
        warn(`Invalid 'context' field in config (must be string)`);
      }
    }

    // Parse architecture outline projection settings using Zod
    if (raw.architecture !== undefined) {
      const architectureField = z.object({
        outline: z
          .object({
            definitionDepth: z
              .number()
              .int()
              .min(0)
              .optional()
              .default(PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.architecture.outline.definitionDepth),
          })
          .optional()
          .default({ ...PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.architecture.outline }),
      });
      const architectureResult = architectureField.safeParse(raw.architecture);

      if (architectureResult.success) {
        config.architecture = architectureResult.data;
      } else {
        config.architecture = cloneFunctionalDefaults().architecture;
        warn(
          `Invalid 'architecture.outline.definitionDepth' field in config (must be a non-negative integer)`
        );
      }
    }

    for (const key of ['profile', 'workflows', 'delivery', 'optimization']) {
      if (raw[key] !== undefined) warn(`${key} is retired and ignored; remove it from project configuration`);
    }

    // Parse apply field using Zod
    if (raw.apply !== undefined) {
      const applyField = z.object({
        defaultIsolation: z.enum(['ask', 'branch', 'worktree', 'none']).optional().default(
          PROJECT_CONFIG_FUNCTIONAL_DEFAULTS.apply.defaultIsolation
        ),
      });
      const applyResult = applyField.safeParse(raw.apply);

      if (applyResult.success) {
        config.apply = applyResult.data;
      } else {
        warn(`Invalid 'apply' field in config (must be an object with defaultIsolation: ask | branch | worktree | none)`);
      }
    }

    config.git = cloneFunctionalDefaults().git;
    const gitConfig = config.git!;
    if (raw.git !== undefined) {
      if (!isPlainRecord(raw.git)) {
        warn(`Invalid 'git' field in config (must be an object)`);
      } else {
        const rawGit = raw.git;

        if (rawGit.autoCommit !== undefined) {
          warn(
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
                warn(`git.commitMessage.${key} must be a POSIX relative path without ..`);
              }
            }

            if (Object.keys(commitMessage).length > 0) {
              gitConfig.commitMessage = commitMessage;
            }
          } else {
            warn(`Invalid 'git.commitMessage' field in config (must be an object)`);
          }
        }

        if (rawGit.archive !== undefined) {
          if (isPlainRecord(rawGit.archive)) {
            const rawArchive = rawGit.archive;
            const rawCommitMessage = rawArchive.commitMessage;
            if (isPlainRecord(rawCommitMessage) && rawCommitMessage.convention !== undefined) {
              warn(
                'git.archive.commitMessage.convention is deprecated and ignored; use git.commitMessage.archive for path overrides'
              );
            }
          } else {
            warn(`Invalid 'git.archive' field in config (must be an object)`);
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
                warn('git.merge.strategy must be one of: no-ff, ff-only, squash');
              }
            }

            const rawCommitMessage = rawMerge.commitMessage;
            if (isPlainRecord(rawCommitMessage) && rawCommitMessage.convention !== undefined) {
              warn(
                'git.merge.commitMessage.convention is deprecated and ignored; use git.commitMessage.merge for path overrides'
              );
            }
          } else {
            warn(`Invalid 'git.merge' field in config (must be an object)`);
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
                warn('git.branch.deleteAfterArchive must be boolean');
              }
            }
          } else {
            warn(`Invalid 'git.branch' field in config (must be an object)`);
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
          if (Array.isArray(rules)) {
            const validRules = rules.filter((rule): rule is string => typeof rule === 'string' && rule.trim().length > 0);
            if (validRules.length) { parsedRules[artifactId] = validRules; hasValidRules = true; }
            if (validRules.length !== rules.length) warn(`Rules for '${artifactId}' contain invalid or empty strings, ignoring those entries`);
          } else {
            warn(`Rules for '${artifactId}' must be an array of strings, ignoring this artifact's rules`);
          }
        }

        if (hasValidRules) {
          config.rules = parsedRules;
        }
      } else {
        warn(`Invalid 'rules' field in config (must be object)`);
      }
    }

    if (config.rules) {
      const ids = new Set(resolveSchema(config.schema ?? 'semantic-model').artifacts.map(artifact => artifact.id));
      for (const warning of validateConfigRules(config.rules, ids, config.schema ?? 'semantic-model')) {
        if (!emittedRuleWarnings.has(warning)) { emittedRuleWarnings.add(warning); warn(warning); }
      }
    }

    // Return partial config even if some fields failed
    return Object.keys(config).length > 0 ? (config as ProjectConfig) : null;
  } catch (error) {
    warn(`Failed to parse .xirang/config.yaml: ${error instanceof Error ? error.message : String(error)}`);
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
