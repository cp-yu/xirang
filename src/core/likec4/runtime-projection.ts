import { compareUtf8Bytes } from '../candidate/canonical.js';
import type { AuthoredView, SemanticModel } from '../model/types.js';

/**
 * The resolved View Selection boundary carried by the runtime manifest.
 *
 * Xirang owns the selection semantics (descendants closure, `exclude` precedence, root detection);
 * the view server only turns `selection` into LikeC4 include predicates, so the boundary rules are
 * never reimplemented against a second copy of the model.
 */
export interface ResolvedViewSelection {
  /** Selected Element identities in byte order. */
  selection: string[];
  /** Selected Elements whose parent is outside the selection, in byte order. */
  roots: string[];
  /** Multiple mutually independent roots need a non-semantic projection root. */
  virtualRoot: boolean;
}

function childrenByParent(model: SemanticModel): Map<string | null, string[]> {
  const children = new Map<string | null, string[]>();
  for (const element of model.elements) {
    const parent = element.declaration.parent;
    const siblings = children.get(parent) ?? [];
    siblings.push(element.declaration.identity);
    children.set(parent, siblings);
  }
  return children;
}

function collectSubtree(identity: string, children: Map<string | null, string[]>, into: Set<string>): void {
  into.add(identity);
  for (const child of children.get(identity) ?? []) collectSubtree(child, children, into);
}

/**
 * Resolves one View Selection boundary. `view` is `null` for the Model Selection, which selects the
 * whole model. An Authored Selection forms the descendants closure of `include`, then `exclude`
 * takes precedence and prunes the whole descendants subtree of each match.
 */
export function resolveViewSelection(view: AuthoredView | null, model: SemanticModel): ResolvedViewSelection {
  const known = new Set(model.elements.map(element => element.declaration.identity));
  const parents = new Map(model.elements.map(element =>
    [element.declaration.identity, element.declaration.parent] as const));

  let selected: Set<string>;
  if (view === null) {
    selected = known;
  } else {
    const children = childrenByParent(model);
    selected = new Set<string>();
    const included = view.include === '*' ? [...known] : view.include;
    for (const identity of included) {
      if (known.has(identity)) collectSubtree(identity, children, selected);
    }
    for (const identity of view.exclude ?? []) {
      if (!known.has(identity)) continue;
      const pruned = new Set<string>();
      collectSubtree(identity, children, pruned);
      for (const item of pruned) selected.delete(item);
    }
  }

  const roots: string[] = [];
  for (const identity of selected) {
    const parent = parents.get(identity) ?? null;
    if (parent === null || !selected.has(parent)) roots.push(identity);
  }
  roots.sort(compareUtf8Bytes);

  return {
    selection: [...selected].sort(compareUtf8Bytes),
    roots,
    // The Model Selection uses its real Project Root; only Authored Selections may need a virtual one.
    virtualRoot: view !== null && roots.length > 1,
  };
}
