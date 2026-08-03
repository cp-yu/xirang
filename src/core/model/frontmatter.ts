import { parse as parseYaml } from 'yaml';
import type { EntityType } from './types.js';

export type FrontmatterResult =
  | { ok: true; data: Record<string, unknown>; body: string }
  | { ok: false; code: 'MALFORMED_FRONTMATTER'; message: string };

/** Key order per entity type; `operation` and `entity` are always emitted first. */
const KEY_ORDER: Record<EntityType, readonly string[]> = {
  'element-declaration': ['identity', 'kind', 'parent', 'title', 'definition'],
  'element-kind': ['identity', 'contract', 'root', 'parents', 'children', 'nodePresentation'],
  'relationship-kind': ['identity', 'sourceKinds', 'targetKinds'],
  'authored-view': ['identity', 'include', 'of', 'title', 'autoLayout'],
};

export function frontmatterKeys(entity: EntityType): readonly string[] {
  return KEY_ORDER[entity];
}

export function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n');
}

function malformed(message: string): FrontmatterResult {
  return { ok: false, code: 'MALFORMED_FRONTMATTER', message };
}

export function splitFrontmatter(content: string): FrontmatterResult {
  const normalized = normalizeLineEndings(content);
  if (!normalized.startsWith('---\n')) return malformed('Unit is missing its frontmatter opening delimiter');
  const end = normalized.indexOf('\n---', 3);
  if (end === -1) return malformed('Frontmatter is missing its closing delimiter');

  let data: unknown;
  try {
    data = parseYaml(normalized.slice(4, end + 1));
  } catch (error) {
    return malformed(error instanceof Error ? error.message : 'Invalid YAML frontmatter');
  }
  if (data === null || data === undefined) data = {};
  if (typeof data !== 'object' || Array.isArray(data)) return malformed('Frontmatter must be a YAML mapping');

  const rest = normalized.slice(end + 4);
  return { ok: true, data: data as Record<string, unknown>, body: rest.startsWith('\n') ? rest.slice(1) : rest };
}

function isPlainSafe(value: string): boolean {
  if (value === '' || value !== value.trim()) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(value)) return false;
  if (/:\s|\s#/.test(value) || value.endsWith(':')) return false;
  try {
    return parseYaml(value) === value;
  } catch {
    return false;
  }
}

export function renderScalar(value: unknown): string {
  return scalar(value);
}

function scalar(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  const text = String(value);
  return isPlainSafe(text) ? text : JSON.stringify(text);
}

function renderMapping(key: string, obj: Record<string, unknown>): string {
  const keys = Object.keys(obj);
  if (keys.length === 0) return `${key}: {}`;
  const lines = keys.map(k => `  ${k}: ${scalar(obj[k])}`);
  return `${key}:\n${lines.join('\n')}\n`;
}

function renderEntry(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []\n`;
    return `${key}:\n${value.map(item => `  - ${scalar(item)}\n`).join('')}`;
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return renderMapping(key, value as Record<string, unknown>);
  }
  return `${key}: ${scalar(value)}\n`;
}

export function renderFrontmatter(entity: EntityType, values: Record<string, unknown>): string {
  let body = '';
  if (values.operation !== undefined) body += renderEntry('operation', values.operation);
  body += renderEntry('entity', entity);
  for (const key of KEY_ORDER[entity]) {
    if (values[key] === undefined) continue;
    body += renderEntry(key, values[key]);
  }
  return `---\n${body}---\n`;
}
