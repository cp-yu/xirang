import { compareUtf8Bytes } from '../candidate/canonical.js';
import { isMarkdownUnit, readModelTree, type ParsedModel } from './parser.js';
import {
  serializeElementKindUnit,
  serializeElementUnit,
  serializeRelationshipContainer,
  serializeRelationshipKindUnit,
  serializeViewUnit,
} from './serializer.js';
import type { Relationship, SemanticModel } from './types.js';

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
): Promise<Map<string, Buffer>> {
  const current = await readModelTree(root);
  const files = new Map<string, Buffer>();

  const emit = (identity: string, defaultPath: string, next: string, before: string | undefined): void => {
    const module = previous.index.moduleOf(identity);
    const original = module ? current.get(module.path) : undefined;
    if (module && original && before === next) files.set(module.path, original);
    else files.set(module?.path ?? defaultPath, Buffer.from(next, 'utf8'));
  };

  const previousElements = new Map(previous.model.elements.map(item => [item.declaration.identity, item]));
  for (const element of expected.elements) {
    const identity = element.declaration.identity;
    const before = previousElements.get(identity);
    emit(identity, `elements/${identity}.md`, serializeElementUnit(element), before && serializeElementUnit(before));
  }

  const previousElementKinds = new Map(previous.model.elementKinds.map(item => [item.identity, item]));
  for (const kind of expected.elementKinds) {
    const before = previousElementKinds.get(kind.identity);
    emit(kind.identity, `metamodel/${kind.identity}.md`, serializeElementKindUnit(kind), before && serializeElementKindUnit(before));
  }

  const previousRelationshipKinds = new Map(previous.model.relationshipKinds.map(item => [item.identity, item]));
  for (const kind of expected.relationshipKinds) {
    const before = previousRelationshipKinds.get(kind.identity);
    emit(kind.identity, `metamodel/${kind.identity}.md`, serializeRelationshipKindUnit(kind), before && serializeRelationshipKindUnit(before));
  }

  const previousViews = new Map(previous.model.views.map(item => [item.identity, item]));
  for (const view of expected.views) {
    const before = previousViews.get(view.identity);
    emit(view.identity, `views/${view.identity}.md`, serializeViewUnit(view), before && serializeViewUnit(before));
  }

  const containerOf = (relationship: Relationship): string =>
    previous.index.moduleOfRelationship(relationship)?.path ?? `relationships/${relationship.kind}.yaml`;
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
    if (original && serializeRelationshipContainer(kind, before) === next) files.set(file, original);
    else files.set(file, Buffer.from(next, 'utf8'));
  }

  return new Map([...files].sort(([left], [right]) => compareUtf8Bytes(left, right)));
}
