import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { applySemanticDelta, parseSemanticDelta, type DeltaEntry, type SemanticDelta } from './model/delta.js';
import type { ModelIndex } from './model/index-map.js';
import { changeRoot, modelRoot } from './model/paths.js';
import { parseSemanticModel, type ParsedModel } from './model/parser.js';
import {
  DEFAULT_PARTITION,
  relationshipIdentity,
  type ModelDiagnostic,
  type SemanticModel,
} from './model/types.js';
import { validateSemanticModel } from './model/validator.js';
import {
  canonicalJson,
  createSemanticDiff,
  semanticModelFingerprint,
  type ChangeDiagnostic,
  type ChangeDiff,
  type DiffOperation,
} from './semantic-diff.js';

export interface CompileChangeOptions {
  /** Pre-parsed Semantic Model; avoids re-reading the four partitions. */
  base?: ParsedModel;
  allowAlreadyApplied?: boolean;
}

export interface CompiledChange {
  title: string;
  formalFingerprint: string;
  changeFingerprint: string;
  target: SemanticModel | null;
  diff: ChangeDiff;
  diagnostics: ChangeDiagnostic[];
  valid: boolean;
}

function fingerprint(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

async function readChangeTitle(projectRoot: string, changeName: string): Promise<string> {
  const proposal = await fs.readFile(path.join(changeRoot(projectRoot, changeName), 'proposal.md'), 'utf8').catch(() => '');
  const heading = proposal.match(/^#\s+(?:Change:\s+)?(.+)$/im);
  return heading?.[1].trim() || changeName;
}

export async function readFormalSemanticModel(projectRoot: string): Promise<ParsedModel> {
  return parseSemanticModel(modelRoot(projectRoot));
}

/** Entity identities are storage-addressable; requirement entries resolve to their host Element. */
function hostIdentity(entry: DeltaEntry): string {
  return entry.entity === 'requirement' ? entry.identity.split('#')[0] : entry.identity;
}

function unitPath(entry: DeltaEntry): string {
  if (entry.entity === 'relationship') return 'relationships';
  const partition = entry.entity === 'requirement' ? 'elements' : DEFAULT_PARTITION[entry.entity];
  return `${partition}/${hostIdentity(entry)}.md`;
}

/** Diagnostics carry identities; their storage location comes from the index, never a fixed prefix. */
function locate(index: ModelIndex, diagnostic: ModelDiagnostic, entries: DeltaEntry[]): string {
  if (diagnostic.path !== '') return diagnostic.path;
  if (!diagnostic.identity) return '';
  const identity = diagnostic.identity.includes('#') ? diagnostic.identity.split('#')[0] : diagnostic.identity;
  const module = index.moduleOf(identity);
  if (module) return module.path;
  const entry = entries.find(item => hostIdentity(item) === identity);
  return entry ? unitPath(entry) : '';
}

function toChangeDiagnostic(index: ModelIndex, entries: DeltaEntry[], diagnostic: ModelDiagnostic): ChangeDiagnostic {
  return {
    level: diagnostic.level,
    code: diagnostic.code,
    path: locate(index, diagnostic, entries),
    message: diagnostic.message,
    ...(diagnostic.identity ? { identity: diagnostic.identity } : {}),
  };
}

function currentValue(base: SemanticModel, entry: DeltaEntry): unknown {
  switch (entry.entity) {
    case 'element-declaration':
      return base.elements.find(item => item.declaration.identity === entry.identity)?.declaration;
    case 'element-kind':
      return base.elementKinds.find(item => item.identity === entry.identity);
    case 'relationship-kind':
      return base.relationshipKinds.find(item => item.identity === entry.identity);
    case 'authored-view':
      return base.views.find(item => item.identity === entry.identity);
    case 'relationship':
      return base.relationships.find(item => relationshipIdentity(item) === entry.identity);
    default: {
      const [host, ...rest] = entry.identity.split('#');
      return base.elements.find(item => item.declaration.identity === host)
        ?.requirements.find(item => item.name === rest.join('#'));
    }
  }
}

/** A delta entry is already applied when the Formal model already carries its declared target state. */
function alreadyApplied(base: SemanticModel, entry: DeltaEntry): boolean {
  const current = currentValue(base, entry);
  if (entry.operation === 'REMOVED') return current === undefined;
  return current !== undefined && canonicalJson(current) === canonicalJson(entry.target);
}

function suppressApplied(base: SemanticModel, delta: SemanticDelta, diagnostics: ModelDiagnostic[]): ModelDiagnostic[] {
  const applied = new Set(delta.entries.filter(entry => alreadyApplied(base, entry)).map(entry => `${entry.entity}\u0000${entry.identity}`));
  if (applied.size === 0) return diagnostics;
  return diagnostics.filter(item => {
    if (!/^(ADDED_IDENTITY_EXISTS|MODIFIED_IDENTITY_MISSING|REMOVED_IDENTITY_MISSING)$/.test(item.code)) return true;
    return ![...applied].some(key => key.endsWith(`\u0000${item.identity ?? ''}`));
  });
}

function declaredOperations(delta: SemanticDelta): Array<{ entity: string; identity: string; operation: DiffOperation }> {
  return delta.entries.map(entry => ({ entity: entry.entity, identity: entry.identity, operation: entry.operation }));
}

export interface CompiledDelta {
  base: ParsedModel;
  delta: SemanticDelta;
  compiled: CompiledChange;
}

/** Compiles the four-partition Semantic Delta of one change into its Expected Semantic Model. */
export async function compileChangeDelta(
  projectRoot: string,
  changeName: string,
  options: CompileChangeOptions = {},
): Promise<CompiledDelta> {
  const base = options.base ?? await readFormalSemanticModel(projectRoot);
  const parsed = await parseSemanticDelta(changeRoot(projectRoot, changeName));
  const applied = applySemanticDelta(base.model, parsed.delta);
  const raw = [
    ...base.diagnostics,
    ...parsed.diagnostics,
    ...(options.allowAlreadyApplied
      ? suppressApplied(base.model, parsed.delta, applied.diagnostics)
      : applied.diagnostics),
    ...validateSemanticModel(applied.expected),
  ];
  const diagnostics = raw.map(item => toChangeDiagnostic(base.index, parsed.delta.entries, item));
  const valid = diagnostics.every(item => item.level !== 'ERROR');
  const formalFingerprint = semanticModelFingerprint(base.model);
  const changeFingerprint = fingerprint(parsed.delta.entries);
  const diff = createSemanticDiff(base.model, applied.expected, {
    change: changeName,
    valid,
    formalFingerprint,
    changeFingerprint,
    diagnostics,
    declaredOperations: declaredOperations(parsed.delta),
  });

  return {
    base,
    delta: parsed.delta,
    compiled: {
      title: await readChangeTitle(projectRoot, changeName),
      formalFingerprint,
      changeFingerprint,
      target: parsed.diagnostics.some(item => item.level === 'ERROR') ? null : applied.expected,
      diff,
      diagnostics,
      valid,
    },
  };
}

export async function compileChange(
  projectRoot: string,
  changeName: string,
  options: CompileChangeOptions = {},
): Promise<CompiledChange> {
  return (await compileChangeDelta(projectRoot, changeName, options)).compiled;
}
