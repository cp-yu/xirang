import { compareUtf8Bytes } from '../candidate/canonical.js';
import type { ElementKind, ModelElement, SemanticModel } from '../model/types.js';
import { definitionExcerpt } from './definition.js';
import { createNamespace, deriveLocalNames, type LocalNames } from './local-names.js';
import { toLikeC4Style } from './presentation-adapter.js';

/** `defaultLandscapeView: false` keeps LikeC4 from injecting an `index` View next to the Model View. */
const LIKEC4_PROJECT_CONFIG =
  '{\n  "name": "xirang",\n  "implicitViews": false,\n  "defaultLandscapeView": false\n}\n';

function quote(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')}'`;
}

function block(header: string, lines: readonly string[]): string {
  return [`${header} {`, ...lines, '}', ''].join('\n');
}

/** One naming scope: identities are allocated in byte order so the mapping never depends on input order. */
function allocateNames(identities: readonly string[]): Map<string, string> {
  const namespace = createNamespace();
  const names = new Map<string, string>();
  for (const identity of [...identities].sort(compareUtf8Bytes)) names.set(identity, namespace(identity));
  return names;
}

function nameOf(names: Map<string, string>, identity: string): string {
  const name = names.get(identity);
  if (name === undefined) throw new Error(`Unknown identity: ${identity}`);
  return name;
}

/** Kind constraints live in the `metamodel/` frontmatter; LikeC4 only carries the names. */
function renderSpecification(model: SemanticModel, kinds: Map<string, string>): string {
  const declare = (keyword: string, items: readonly { identity: string }[]): string[] =>
    [...items]
      .sort((left, right) => compareUtf8Bytes(left.identity, right.identity))
      .map(item => {
        const name = nameOf(kinds, item.identity);
        const kind = model.elementKinds.find(k => k.identity === item.identity);
        const style = kind ? toLikeC4Style(kind.nodePresentation) : undefined;
        if (!style) return `  ${keyword} ${name}`;
        const styleLines = [`  ${keyword} ${name} {`, '    style {', ...Object.entries(style).map(([k, v]) => `      ${k} ${v}`), '    }', '  }'];
        return styleLines.join('\n');
      });
  return block('specification', [
    ...declare('element', model.elementKinds),
    ...declare('relationship', model.relationshipKinds),
  ]);
}

/** `metadata { elementId }` is the artifact-side identity anchor; the contract body has no LikeC4 notation. */
function renderElement(
  element: ModelElement,
  children: Map<string | null, ModelElement[]>,
  names: LocalNames,
  kinds: Map<string, string>,
  indent: string,
): string[] {
  const { identity, kind, title, definition } = element.declaration;
  const inner = `${indent}  `;
  return [
    `${indent}${names.nameOf(identity)} = ${nameOf(kinds, kind)} ${quote(title)} ${quote(definitionExcerpt(definition))} {`,
    `${inner}description ${quote(definition)}`,
    `${inner}metadata {`,
    `${inner}  elementId ${quote(identity)}`,
    `${inner}}`,
    ...(children.get(identity) ?? []).flatMap(child => renderElement(child, children, names, kinds, inner)),
    `${indent}}`,
  ];
}

function renderModel(model: SemanticModel, names: LocalNames, kinds: Map<string, string>): string {
  const children = new Map<string | null, ModelElement[]>();
  for (const element of model.elements) {
    const siblings = children.get(element.declaration.parent) ?? [];
    siblings.push(element);
    children.set(element.declaration.parent, siblings);
  }
  for (const siblings of children.values()) {
    siblings.sort((left, right) => compareUtf8Bytes(left.declaration.identity, right.declaration.identity));
  }
  return block('model', (children.get(null) ?? []).flatMap(root => renderElement(root, children, names, kinds, '  ')));
}

function renderRelations(model: SemanticModel, names: LocalNames, kinds: Map<string, string>): string {
  const parents = new Map(model.elements.map(element =>
    [element.declaration.identity, element.declaration.parent] as const));
  const isAncestor = (ancestor: string, descendant: string): boolean => {
    let parent = parents.get(descendant) ?? null;
    while (parent !== null) {
      if (parent === ancestor) return true;
      parent = parents.get(parent) ?? null;
    }
    return false;
  };
  // LikeC4 rejects ancestor-chain endpoints; Xirang keeps those relationships in its IR.
  const relationships = [...model.relationships]
    .filter(relationship => relationship.source !== relationship.target
      && !isAncestor(relationship.source, relationship.target)
      && !isAncestor(relationship.target, relationship.source))
    .sort((left, right) =>
      compareUtf8Bytes(left.source, right.source)
      || compareUtf8Bytes(left.kind, right.kind)
      || compareUtf8Bytes(left.target, right.target));
  return block('model', relationships.map(relationship =>
    `  ${names.pathOf(relationship.source)} -[${nameOf(kinds, relationship.kind)}]-> ${names.pathOf(relationship.target)} ${quote(relationship.kind)}`));
}

function renderViews(model: SemanticModel, names: LocalNames, views: Map<string, string>): string {
  const lines: string[] = ['  view model {'];
  for (const element of [...model.elements].sort((left, right) =>
    compareUtf8Bytes(left.declaration.identity, right.declaration.identity))) {
    lines.push(`    include ${names.pathOf(element.declaration.identity)}`);
  }
  lines.push('  }');
  for (const view of [...model.views].sort((left, right) => compareUtf8Bytes(left.identity, right.identity))) {
    const scope = view.of === undefined ? '' : ` of ${names.pathOf(view.of)}`;
    lines.push(`  view ${nameOf(views, view.identity)}${scope} {`);
    if (view.title !== undefined) lines.push(`    title ${quote(view.title)}`);
    if (view.include === '*') lines.push('    include *');
    else for (const identity of view.include) lines.push(`    include ${names.pathOf(identity)}`);
    if (view.autoLayout !== undefined) lines.push(`    autoLayout ${view.autoLayout}`);
    lines.push('  }');
  }
  return block('views', lines);
}

/**
 * IR → nested `.c4` artifacts, keyed by file name relative to `likec4CacheDir()`.
 * Pure by design: writing is the caller's concern, so generation cannot touch the persistent source.
 * Deterministic: the same IR always produces the same bytes.
 */
export function generateLikeC4(model: SemanticModel): Map<string, string> {
  const names = deriveLocalNames(model.elements);
  const kinds = allocateNames([...model.elementKinds, ...model.relationshipKinds].map(kind => kind.identity));
  const views = allocateNames(model.views.map(view => view.identity));
  return new Map([
    ['likec4.config.json', LIKEC4_PROJECT_CONFIG],
    ['specification.c4', renderSpecification(model, kinds)],
    ['model.c4', renderModel(model, names, kinds)],
    ['relations.c4', renderRelations(model, names, kinds)],
    ['views.c4', renderViews(model, names, views)],
  ]);
}
