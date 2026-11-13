import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parseDocument } from 'yaml';
import { resolveSchema } from './artifact-graph/resolver.js';
import { CURRENT_CONFIG_VERSION, ProjectConfigSchema, readProjectConfig } from './project-config.js';
import { normalizeProjectConfig } from './config-projection.js';
import { configValue, fieldDefault, allowedConfigValues, PROJECT_CONFIG_FIELDS, IGNORED_PROJECT_CONFIG_PATHS } from './config-fields.js';

export interface ConfigIssue { severity: 'error' | 'warning'; code: string; field: string; message: string; suggestion: string }

export function projectConfigPath(projectRoot: string) {
  const yaml = path.join(projectRoot, '.xirang', 'config.yaml');
  const yml = path.join(projectRoot, '.xirang', 'config.yml');
  return { path: fs.existsSync(yaml) || !fs.existsSync(yml) ? yaml : yml, ignoredPaths: fs.existsSync(yaml) && fs.existsSync(yml) ? [yml] : [] };
}

export function inspectConfigValues(raw: unknown, targetVersion = CURRENT_CONFIG_VERSION): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const issue = (field: string, message: string, warning = false) => issues.push({ severity: warning ? 'warning' : 'error', code: warning ? 'IGNORED_CONFIG' : 'INVALID_CONFIG', field, message, suggestion: warning ? `Remove ${field}; it is ignored.` : `Check the spelling and supported value of ${field}; run xirang config.` });
  function visit(value: unknown, schema: z.ZodType, prefix: string) {
    while (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) schema = schema.unwrap() as z.ZodType;
    if (schema instanceof z.ZodObject && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) {
        const name = prefix ? `${prefix}.${key}` : key;
        if (IGNORED_PROJECT_CONFIG_PATHS.includes(name as typeof IGNORED_PROJECT_CONFIG_PATHS[number])) {
          const ignored = (entry: unknown, location: string) => {
            issue(location, `${location} is retired and ignored`, true);
            if (entry && typeof entry === 'object') for (const [childKey, childValue] of Object.entries(entry)) ignored(childValue, `${location}.${childKey}`);
          };
          ignored(child, name);
          continue;
        }
        if (!Object.hasOwn(schema.shape, key)) { issue(name, `Unknown field ${name}; possible spelling mistake`); continue; }
        visit(child, schema.shape[key], name);
      }
    } else {
      const result = schema.safeParse(value);
      if (!result.success) for (const error of result.error.issues) issue([prefix, ...error.path].filter(String).join('.'), error.message);
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { issue('', 'Configuration must be a YAML object'); return issues; }
  visit(raw, ProjectConfigSchema, '');
  const version = configValue(raw, 'configVersion');
  if (version === undefined) issue('configVersion', 'Missing migration version; do not guess or fill a version to bypass adaptation');
  else if (typeof version === 'number' && version > targetVersion) issue('configVersion', `Version ${version} requires a newer CLI (supported target ${targetVersion}); no downgrade is performed`);
  const context = configValue(raw, 'context');
  if (typeof context === 'string' && Buffer.byteLength(context, 'utf8') > 50 * 1024) issue('context', 'Context exceeds the 50KB limit; runtime ignores this field');
  const schemaName = configValue(raw, 'schema') ?? 'semantic-model';
  if (schemaName === 'semantic-model') {
    const ids = resolveSchema(schemaName).artifacts.map(item => item.id);
    const rules = configValue(raw, 'rules');
    if (rules && typeof rules === 'object' && !Array.isArray(rules)) for (const [id, values] of Object.entries(rules)) {
      if (!ids.includes(id)) issue(`rules.${id}`, `Unknown artifact rule; possible spelling mistake. Available: ${ids.join(', ')}`);
      if (Array.isArray(values)) values.forEach((value, index) => { if (typeof value === 'string' && !value.trim()) issue(`rules.${id}.${index}`, 'Rule must be a nonempty string; runtime ignores this item'); });
    }
  }
  return issues;
}

export function checkProjectConfig(projectRoot: string) {
  const selection = projectConfigPath(projectRoot);
  const issues: ConfigIssue[] = [];
  let raw: unknown;
  let parsed = false;
  try {
    const document = parseDocument(fs.readFileSync(selection.path, 'utf8'));
    if (document.errors.length) throw new Error(document.errors.map(error => error.message).join('; '));
    raw = document.toJS();
    parsed = !!raw && typeof raw === 'object' && !Array.isArray(raw);
    issues.push(...inspectConfigValues(raw));
  } catch (error) {
    issues.push({ severity: 'error', code: 'CONFIG_UNREADABLE', field: '', message: `${selection.path}: ${error instanceof Error ? error.message : String(error)}`, suggestion: 'Use setup for a new workspace; otherwise restore or repair the config yourself or ask an Agent. check does not write files.' });
  }
  const runtimeWarnings: string[] = [];
  const effective = parsed ? normalizeProjectConfig(readProjectConfig(projectRoot, message => runtimeWarnings.push(message))) : undefined;
  const fields = PROJECT_CONFIG_FIELDS.filter(field => field.path !== 'docLanguage').map(field => {
    const value = effective ? configValue(effective, field.path) ?? (configValue(raw, field.path) === undefined && field.path !== 'configVersion' ? fieldDefault(field.path) : undefined) : undefined;
    let source = configValue(raw, field.path) !== undefined ? 'explicit' : fieldDefault(field.path) !== undefined ? 'default' : 'absent';
    if (field.path === 'proseLanguage' && configValue(raw, 'proseLanguage') === undefined && configValue(raw, 'docLanguage') !== undefined) source = 'docLanguage';
    if (issues.some(issue => issue.severity === 'error' && (issue.field === field.path || issue.field.startsWith(`${field.path}.`) || field.path.startsWith(`${issue.field}.`)))) source = value === undefined ? 'ignored' : 'fallback';
    return { ...field, allowedValues: allowedConfigValues(field.path), value, source, checkable: parsed };
  });
  if (effective) for (const field of PROJECT_CONFIG_FIELDS.filter(field => field.reference)) {
    const value = configValue(effective, field.path);
    if (typeof value !== 'string') continue;
    const target = path.resolve(projectRoot, ...value.split('/'));
    try {
      fs.accessSync(target, fs.constants.R_OK);
      if (!fs.statSync(target).isFile()) throw new Error('not a readable file');
    } catch (error) {
      issues.push({ severity: 'error', code: 'CONFIG_REFERENCE_UNREADABLE', field: field.path, message: `${target}: ${error instanceof Error ? error.message : String(error)}`, suggestion: 'Correct the reference or provide the readable guidance/template file.' });
    }
  }
  return { ...selection, version: { current: configValue(raw, 'configVersion'), target: CURRENT_CONFIG_VERSION, retainedOperations: 10, minimumSupportedStart: CURRENT_CONFIG_VERSION }, effective, fields, runtimeWarnings, checkable: parsed, valid: !issues.some(issue => issue.severity === 'error'), issues };
}
