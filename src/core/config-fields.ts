import { z } from 'zod';
import { resolveSchema } from './artifact-graph/resolver.js';
import { ProjectConfigSchema, PROJECT_CONFIG_FUNCTIONAL_DEFAULTS } from './project-config.js';

export interface ProjectConfigField {
  path: string;
  description: string;
  scope: string;
  example?: unknown;
  reference?: boolean;
}

export const PROJECT_CONFIG_FIELDS: readonly ProjectConfigField[] = [
  { path: 'configVersion', description: 'Configuration migration version, managed by setup/update; independent of CLI and workflow schema versions.', scope: 'setup/update' },
  { path: 'schema', description: 'Built-in workflow schema.', scope: 'artifact workflow', example: 'semantic-model' },
  { path: 'proseLanguage', description: 'Language of authored prose; preserve canonical headings, IDs, keys, paths and code tokens.', scope: 'all applicable artifacts', example: 'zh-CN' },
  { path: 'docLanguage', description: 'Read alias used only when proseLanguage is absent.', scope: 'all applicable artifacts', example: 'zh-CN' },
  { path: 'decomposition', description: 'Project-root relative guidance path or a bare name under .xirang/references/.', scope: 'structural work', reference: true },
  { path: 'context', description: 'Project background, preserved verbatim; maximum 50KB.', scope: 'all applicable artifacts', example: 'Tech stack: TypeScript, Node.js' },
  { path: 'architecture.outline.definitionDepth', description: 'Non-negative Definition loading depth; does not crop the tree or control browser expansion. --definition-depth overrides one query.', scope: 'arch outline' },
  { path: 'apply.defaultIsolation', description: 'Implementation isolation.', scope: 'Apply' },
  { path: 'git.merge.strategy', description: 'Merge strategy.', scope: 'Archive' },
  { path: 'git.branch.deleteAfterArchive', description: 'Whether to delete the completed change branch.', scope: 'Archive' },
  { path: 'git.commitMessage.boundary', description: 'Project-root relative POSIX path to a boundary commit template.', scope: 'Git boundary commit', reference: true, example: 'docs/commit-boundary.md' },
  { path: 'git.commitMessage.archive', description: 'Project-root relative POSIX path to an archive commit template.', scope: 'Archive', reference: true, example: 'docs/archive-commit.md' },
  { path: 'git.commitMessage.merge', description: 'Project-root relative POSIX path to a merge commit template.', scope: 'Archive merge', reference: true, example: 'docs/merge-summary.md' },
  { path: 'rules', description: 'Additive per-artifact string arrays, keyed by current schema artifact IDs; semantic-delta covers all four partitions.', scope: 'matching artifact only', example: { 'semantic-delta': ['Preserve complete target content'], tasks: ['Include observable verification outcomes'] } },
];

export const IGNORED_PROJECT_CONFIG_PATHS = [
  'profile', 'workflows', 'delivery', 'propose', 'optimization',
  'git.autoCommit', 'git.archive', 'git.merge.messageFrom', 'git.merge.commitMessage',
] as const;

export function configValue(value: unknown, key: string): unknown {
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, part)) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

export function fieldDefault(key: string): unknown {
  return key === 'schema' ? 'semantic-model' : configValue(PROJECT_CONFIG_FUNCTIONAL_DEFAULTS, key);
}

export function allowedConfigValues(key: string): readonly unknown[] | undefined {
  if (key === 'rules') return resolveSchema('semantic-model').artifacts.map(artifact => artifact.id);
  let schema: z.ZodType = ProjectConfigSchema;
  for (const part of key.split('.')) {
    while (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) schema = schema.unwrap() as z.ZodType;
    if (!(schema instanceof z.ZodObject)) return undefined;
    schema = schema.shape[part];
  }
  while (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) schema = schema.unwrap() as z.ZodType;
  return schema instanceof z.ZodEnum ? schema.options : schema instanceof z.ZodBoolean ? [true, false] : undefined;
}

export function describeProjectConfig(): string {
  return [
    'Project configuration: .xirang/config.yaml (.yml fallback; .yaml takes precedence).',
    'xirang config: documentation; xirang config project: effective values; xirang config check: detailed read-only validation.',
    'Global tool settings: config path/list/get/set/unset/reset/edit (--scope global).',
    '',
    ...PROJECT_CONFIG_FIELDS.map(field => {
      const value = fieldDefault(field.path);
      const allowed = allowedConfigValues(field.path);
      return `${field.path} — ${field.description}${allowed ? ` Allowed: ${allowed.join(", ")}.` : ""}\n  Scope: ${field.scope}. ${value === undefined ? `Optional; example: ${JSON.stringify(field.example)}` : `Default: ${JSON.stringify(value)}`}`;
    }),
  ].join('\n');
}
