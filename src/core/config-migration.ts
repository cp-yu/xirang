import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { isMap, isScalar, parseDocument } from 'yaml';
import { CURRENT_CONFIG_VERSION } from './project-config.js';
import { inspectConfigValues, projectConfigPath } from './config-check.js';

export interface ConfigMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (content: string) => string;
  changes: readonly string[];
}

// Add only real configuration changes; baseline 1 has no unversioned migration.
export const CONFIG_MIGRATIONS: readonly ConfigMigration[] = [];

export function atomicWriteConfig(file: string, content: string): void {
  const temporary = path.join(path.dirname(file), `.config-${process.pid}-${randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx', mode: fs.statSync(file).mode });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function versionDocument(content: string) {
  const document = parseDocument(content);
  if (document.errors.length || !isMap(document.contents)) throw new Error('invalid-yaml: configuration must be a parseable YAML object');
  return document;
}

export function migrateProjectConfigDefaults(projectRoot: string, options: {
  targetVersion?: number;
  migrations?: readonly ConfigMigration[];
  write?: (file: string, content: string) => void;
} = {}): { status: 'updated' | 'unchanged' | 'skipped'; path: string; reason?: string; changes?: string[] } {
  const { path: file } = projectConfigPath(projectRoot);
  const target = options.targetVersion ?? CURRENT_CONFIG_VERSION;
  const migrations = options.migrations ?? CONFIG_MIGRATIONS;
  try {
    const original = fs.readFileSync(file, 'utf8');
    const document = versionDocument(original);
    const current = document.get('configVersion');
    if (typeof current !== 'number' || !Number.isInteger(current) || current < 1) throw new Error('invalid-version: configVersion must be an integer >= 1; no unversioned adaptation is performed');
    if (current > target) throw new Error(`newer-version: configVersion ${current} exceeds target ${target}; use a newer CLI, no downgrade`);
    if (migrations.length > 10) throw new Error('migration registry exceeds the 10-operation limit');
    const minimum = migrations.length ? Math.min(...migrations.map(step => step.fromVersion)) : target;
    const chain: ConfigMigration[] = [];
    for (let version = current; version < target;) {
      const found = migrations.filter(step => step.fromVersion === version && step.toVersion === version + 1);
      if (found.length !== 1 || found[0].toVersion > target) throw new Error(`unsupported-chain: current ${current}, target ${target}, minimum supported start ${minimum}; use an older CLI for the earlier migrations, then update with the latest CLI`);
      chain.push(found[0]);
      version = found[0].toVersion;
    }
    if (!chain.length) return { status: 'unchanged', path: file };
    let content = original;
    for (const step of chain) {
      content = step.migrate(content);
      const next = versionDocument(content);
      const node = next.get('configVersion', true);
      if (!isScalar(node) || !node.range) throw new Error('migration removed configVersion');
      content = content.slice(0, node.range[0]) + step.toVersion + content.slice(node.range[1]);
    }
    const final = versionDocument(content).toJS();
    const errors = inspectConfigValues(final, target).filter(issue => issue.severity === 'error');
    if (errors.length) throw new Error(`invalid-result: ${errors.map(issue => `${issue.field}: ${issue.message}`).join('; ')}`);
    (options.write ?? atomicWriteConfig)(file, content);
    return { status: 'updated', path: file, changes: chain.flatMap(step => [...step.changes]) };
  } catch (error) {
    return { status: 'skipped', path: file, reason: error instanceof Error ? error.message : String(error) };
  }
}
