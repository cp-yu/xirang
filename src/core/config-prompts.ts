import { stringify } from 'yaml';
import { materializeProjectConfigDefaults, type ProjectConfig } from './project-config.js';
import { PROJECT_CONFIG_FIELDS, configValue, fieldDefault, allowedConfigValues } from './config-fields.js';

export function serializeConfig(config: Partial<ProjectConfig>): string {
  const materialized = config.schema ? { ...materializeProjectConfigDefaults(config as ProjectConfig), ...config } : config;
  return PROJECT_CONFIG_FIELDS.flatMap(field => {
    const value = configValue(materialized, field.path);
    const defaultValue = fieldDefault(field.path);
    const allowed = allowedConfigValues(field.path);
    const lines = [`# ${field.path}: ${field.description}${allowed ? ` Allowed: ${allowed.join(", ")}.` : ""}`, `# Scope: ${field.scope}. ${defaultValue === undefined ? 'Optional; no additional requirement when absent.' : `Default: ${JSON.stringify(defaultValue)}.`}`];
    if (field.path === 'docLanguage') return [];
    const object: Record<string, unknown> = {};
    let node = object;
    const parts = field.path.split('.');
    for (const part of parts.slice(0, -1)) { const child = {}; node[part] = child; node = child; }
    node[parts.at(-1)!] = value ?? field.example;
    // Nested fields are emitted together below to avoid duplicate YAML keys.
    if (parts.length === 1 || value === undefined) {
      const yaml = stringify(object).trimEnd();
      lines.push(value === undefined ? yaml.split('\n').map(line => `# ${line}`).join('\n') : yaml);
    }
    return [...lines, ''];
  }).join('\n') + ['architecture', 'apply', 'git'].flatMap(key => {
    const value = configValue(materialized, key);
    return value === undefined ? [] : [stringify({ [key]: value }).trimEnd(), ''];
  }).join('\n') + '\n';
}
