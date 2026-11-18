import { promises as fs } from 'node:fs';
import path from 'node:path';
import { compareUtf8Bytes } from '../candidate/canonical.js';
import { equalSemanticEntity } from '../semantic-diff.js';
import { isMarkdownUnit, readModelTree, type ParsedModel } from './parser.js';
import {
  serializeElementKindUnit,
  serializeElementUnit,
  serializeRelationshipContainer,
  serializeRelationshipKindUnit,
  serializeViewUnit,
} from './serializer.js';
import type { EntityType, Relationship, SemanticModel } from './types.js';

/** Probe the common parent only on an ambiguous path, including case-sensitive directories on Windows. */
async function pathsAlias(root: string, left: string, right: string): Promise<boolean> {
  const parts = left.split('/');
  const other = right.split('/');
  let directory = path.join(root, ...parts.slice(0, parts.findIndex((part, index) => part !== other[index])));
  let probe: string;
  for (;;) {
    try {
      probe = await fs.mkdtemp(path.join(directory, '.xirang-case-'));
      break;
    } catch (error) {
      const parent = path.dirname(directory);
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || directory === root || parent === directory) throw error;
      directory = parent;
    }
  }
  try {
    await fs.lstat(path.join(directory, path.basename(probe).replace('.xirang-', '.XIRANG-')));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  } finally {
    await fs.rmdir(probe);
  }
}

function visibleFilename(identity: string): string {
  return identity.startsWith('.') ? `%${identity}` : identity;
}

function containerKind(relativePath: string): string {
  return relativePath.split('/').pop()!.replace(/\.[^.]*$/, '');
}

/**
 * Computes the complete target tree for `expected`, reusing the original bytes of every unit the
 * delta did not affect. Paths, comments and ordering of untouched units therefore stay identical.
 */
export async function writeMinimal(
  root: string,
  previous: ParsedModel,
  expected: SemanticModel,
  snapshot?: Map<string, Buffer>,
  deferPathCheck?: (check: () => Promise<void>) => void,
): Promise<Map<string, Buffer>> {
  const current = snapshot ?? await readModelTree(root);
  const files = new Map<string, Buffer>();
  // Two different units must never claim one target path; overwrite would silently drop one of them.
  const claimed = new Map<string, string>();
  const originalOwners = new Map<string, string>();
  const indexOriginals = <T>(declared: EntityType, items: readonly T[], identify: (item: T) => string): Map<string, T> =>
    new Map(items.map(item => {
      const identity = identify(item);
      const source = previous.index.moduleOf(declared, identity);
      if (source) originalOwners.set(source.path, `${declared} ${identity}`);
      return [identity, item];
    }));
  const claim = (path: string, owner: string): void => {
    const previousOwner = claimed.get(path);
    if (previousOwner !== undefined && previousOwner !== owner) {
      throw new Error(`Sync target path collision: ${previousOwner} and ${owner} both resolve to ${path}`);
    }
    claimed.set(path, owner);
  };

  const emit = <T>(declared: EntityType, identity: string, defaultPath: string, next: T, before: T | undefined, serialize: (value: T) => string): void => {
    const module = previous.index.moduleOf(declared, identity);
    const original = module ? current.get(module.path) : undefined;
    const target = module?.path ?? defaultPath;
    claim(target, `${declared} ${identity}`);
    if (original && equalSemanticEntity(declared, before, next)) files.set(target, original);
    else files.set(target, Buffer.from(serialize(next), 'utf8'));
  };

  const previousElements = indexOriginals('element-declaration', previous.model.elements, item => item.declaration.identity);
  for (const element of expected.elements) {
    const identity = element.declaration.identity;
    emit('element-declaration', identity, `elements/${visibleFilename(identity)}.md`, element, previousElements.get(identity), serializeElementUnit);
  }

  const previousElementKinds = indexOriginals('element-kind', previous.model.elementKinds, item => item.identity);
  for (const kind of expected.elementKinds) {
    emit('element-kind', kind.identity, `metamodel/${visibleFilename(kind.identity)}.md`, kind, previousElementKinds.get(kind.identity), serializeElementKindUnit);
  }

  const previousRelationshipKinds = indexOriginals('relationship-kind', previous.model.relationshipKinds, item => item.identity);
  for (const kind of expected.relationshipKinds) {
    emit('relationship-kind', kind.identity, `metamodel/${visibleFilename(kind.identity)}.md`, kind, previousRelationshipKinds.get(kind.identity), serializeRelationshipKindUnit);
  }

  const previousViews = indexOriginals('authored-view', previous.model.views, item => item.identity);
  for (const view of expected.views) {
    emit('authored-view', view.identity, `views/${visibleFilename(view.identity)}.md`, view, previousViews.get(view.identity), serializeViewUnit);
  }

  const containerOf = (relationship: Relationship): string =>
    previous.index.moduleOfRelationship(relationship)?.path ?? `relationships/${visibleFilename(relationship.kind)}.yaml`;
  const groups = new Map<string, Relationship[]>();
  for (const [file, bytes] of current) {
    if (!isMarkdownUnit(bytes.toString('utf8'))) groups.set(file, []);
  }
  for (const relationship of expected.relationships) {
    const file = containerOf(relationship);
    groups.set(file, [...(groups.get(file) ?? []), relationship]);
  }
  for (const [file, items] of groups) {
    const kind = containerKind(file);
    const before = previous.model.relationships.filter(item => containerOf(item) === file);
    const next = serializeRelationshipContainer(kind, items);
    const original = current.get(file);
    const owners = [...new Set([...before, ...items].map(({ source, kind, target }) => `${source} -[${kind}]-> ${target}`))].sort();
    claim(file, owners.length > 0 ? `relationships ${owners.join(', ')}` : 'empty relationship container');
    if (original && serializeRelationshipContainer(kind, before) === next) files.set(file, original);
    else files.set(file, Buffer.from(next, 'utf8'));
  }

  const checkPaths = async () => {
    const owners = new Map([...originalOwners, ...claimed]);
    const caseGroups = new Map<string, string[]>();
    for (const [target, owner] of owners) {
      const key = target.toLowerCase();
      const aliases = caseGroups.get(key) ?? [];
      for (const other of aliases) {
        if (await pathsAlias(root, other, target)) {
          throw new Error(`Sync target path collision: ${owners.get(other)} at ${other} and ${owner} at ${target}`);
        }
      }
      caseGroups.set(key, [...aliases, target]);
    }
  };
  if (deferPathCheck) deferPathCheck(checkPaths);
  else await checkPaths();

  return new Map([...files].sort(([left], [right]) => compareUtf8Bytes(left, right)));
}
