import { compareUtf8Bytes } from '../candidate/canonical.js';
import type { ModelElement } from '../model/types.js';

/**
 * LikeC4 keywords its `Id` rule rejects. Derived from the vendored grammar and guarded against
 * upstream drift by `test/core/likec4/reserved-names.test.ts`.
 */
export const LIKEC4_RESERVED_NAMES: ReadonlySet<string> = new Set(
  ('alt and autoLayout border BottomTop break catch color deploymentNode description dynamic '
    + 'dynamicPredicateGroup else exclude extend extends false finally from global head icon iconColor '
    + 'iconPosition icons iconSize if import include includeAncestors instanceOf kind LeftRight likec4lib '
    + 'line link loop metadata multiple navigateTo not notation notes of opacity opt or padding par '
    + 'parallel predicate predicateGroup rank rgb rgba RightLeft shape size specification style styleGroup '
    + 'summary tag tail technology textSize title TopBottom true try variant view views when where with')
    .split(' '),
);

/** Charset sanitizing then keyword avoidance; the result is a valid `Id` but not yet unique. */
function baseName(source: string): string {
  const cleaned = source.replaceAll(/[^A-Za-z0-9_]/g, '_');
  const prefixed = /^[A-Za-z_]/.test(cleaned) ? cleaned : `x_${cleaned}`;
  return LIKEC4_RESERVED_NAMES.has(prefixed) ? `_${prefixed}` : prefixed;
}

/**
 * One naming scope of the artifact. Collisions are resolved after keyword avoidance, so an avoided
 * name can never shadow a genuinely derived one. Feed sources in identity byte order to stay deterministic.
 */
export function createNamespace(): (source: string) => string {
  const taken = new Set<string>();
  return (source) => {
    const base = baseName(source);
    let name = base;
    for (let suffix = 2; taken.has(name); suffix += 1) name = `${base}_${suffix}`;
    taken.add(name);
    return name;
  };
}

export interface LocalNames {
  /** identity → local name within this generation */
  nameOf(identity: string): string;
  /** identity → dotted path from the root, for relationship and view references */
  pathOf(identity: string): string;
}

/** Derived names are valid for a single generation only; each parent is its own namespace. */
export function deriveLocalNames(elements: readonly ModelElement[]): LocalNames {
  const declarations = elements
    .map(element => element.declaration)
    .sort((left, right) => compareUtf8Bytes(left.identity, right.identity));

  const names = new Map<string, string>();
  const parents = new Map<string, string | null>();
  const namespaces = new Map<string, (source: string) => string>();

  for (const declaration of declarations) {
    const scope = declaration.parent ?? '';
    const allocate = namespaces.get(scope) ?? createNamespace();
    namespaces.set(scope, allocate);
    names.set(declaration.identity, allocate(declaration.identity.split('.').pop() ?? ''));
    parents.set(declaration.identity, declaration.parent);
  }

  const nameOf = (identity: string): string => {
    const name = names.get(identity);
    if (name === undefined) throw new Error(`Unknown element identity: ${identity}`);
    return name;
  };

  const paths = new Map<string, string>();
  const pathOf = (identity: string): string => {
    const cached = paths.get(identity);
    if (cached !== undefined) return cached;
    const name = nameOf(identity);
    const parent = parents.get(identity) ?? null;
    const value = parent === null ? name : `${pathOf(parent)}.${name}`;
    paths.set(identity, value);
    return value;
  };

  return { nameOf, pathOf };
}
