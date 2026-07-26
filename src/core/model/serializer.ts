import { compareUtf8Bytes } from '../candidate/canonical.js';
import { renderFrontmatter, renderScalar } from './frontmatter.js';
import type {
  AuthoredView,
  ElementKind,
  ModelElement,
  Relationship,
  RelationshipKind,
  SemanticModel,
} from './types.js';

function unit(frontmatter: string, body: string): string {
  return body === '' ? frontmatter : `${frontmatter}\n${body}\n`;
}

export function serializeContract(element: ModelElement): string {
  if (element.requirements.length === 0) return '';
  const parts: string[] = ['## Requirements'];
  for (const requirement of element.requirements) {
    let block = `### Requirement: ${requirement.name}`;
    if (requirement.body !== '') block += `\n\n${requirement.body}`;
    for (const scenario of requirement.scenarios) {
      block += `\n\n#### Scenario: ${scenario.name}`;
      if (scenario.body !== '') block += `\n\n${scenario.body}`;
    }
    parts.push(block);
  }
  return parts.join('\n\n');
}

export function serializeElementUnit(element: ModelElement): string {
  return unit(
    renderFrontmatter('element-declaration', { ...element.declaration }),
    serializeContract(element),
  );
}

export function serializeElementKindUnit(kind: ElementKind): string {
  const { body, ...fields } = kind;
  return unit(renderFrontmatter('element-kind', fields), body);
}

export function serializeRelationshipKindUnit(kind: RelationshipKind): string {
  const { body, ...fields } = kind;
  return unit(renderFrontmatter('relationship-kind', fields), body);
}

export function serializeViewUnit(view: AuthoredView): string {
  return renderFrontmatter('authored-view', { ...view });
}

export function compareRelationships(left: Relationship, right: Relationship): number {
  return compareUtf8Bytes(left.source, right.source)
    || compareUtf8Bytes(left.kind, right.kind)
    || compareUtf8Bytes(left.target, right.target);
}

/** `kind` names the container file; entries carry their own identity, so grouping stays organizational. */
export function serializeRelationshipContainer(kind: string, items: Relationship[]): string {
  if (items.length === 0) return 'relationships: []\n';
  const entries = [...items].sort(compareRelationships).map(item =>
    `  - source: ${renderScalar(item.source)}\n`
    + `    kind: ${renderScalar(item.kind)}\n`
    + `    target: ${renderScalar(item.target)}\n`);
  return `relationships:\n${entries.join('')}`;
}

/** IR → four partitions. Deterministic: the same IR always produces the same bytes. */
export function serializeSemanticModel(model: SemanticModel): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  const add = (relativePath: string, content: string): void => {
    files.set(relativePath, Buffer.from(content, 'utf8'));
  };

  for (const element of model.elements) add(`elements/${element.declaration.identity}.md`, serializeElementUnit(element));
  for (const kind of model.elementKinds) add(`metamodel/${kind.identity}.md`, serializeElementKindUnit(kind));
  for (const kind of model.relationshipKinds) add(`metamodel/${kind.identity}.md`, serializeRelationshipKindUnit(kind));
  for (const view of model.views) add(`views/${view.identity}.md`, serializeViewUnit(view));

  const byKind = new Map<string, Relationship[]>();
  for (const kind of model.relationshipKinds) byKind.set(kind.identity, []);
  for (const relationship of model.relationships) {
    const items = byKind.get(relationship.kind) ?? [];
    items.push(relationship);
    byKind.set(relationship.kind, items);
  }
  for (const [kind, items] of byKind) add(`relationships/${kind}.yaml`, serializeRelationshipContainer(kind, items));

  return new Map([...files].sort(([left], [right]) => compareUtf8Bytes(left, right)));
}
