import { createHash } from 'node:crypto';
import { compareUtf8Bytes } from '../candidate/canonical.js';
import type { AuthoredView, ModelElement, SemanticModel } from '../model/types.js';
import { generateLikeC4 } from './generator.js';

export type ViewSelection =
  | { type: 'model' }
  | { type: 'authored'; view: AuthoredView };

export type PresentationMode = 'complete' | 'complete-with-diff' | 'diff-only';

/** `target` is the Expected Semantic Model of the selected Change. */
export interface ChangeSelection {
  changeId: string;
  target: SemanticModel;
}

export interface ProjectionDescriptor {
  model: SemanticModel;
  viewSelection: ViewSelection;
  changeSelection: ChangeSelection | null;
  presentationMode: PresentationMode;
  focus: string | null;
  expanded: string[];
}

export interface RuntimeProjection {
  /** Native LikeC4 sources keyed by file name, ready for the official parser. */
  files: Map<string, string>;
  /** Selected Element identities in byte order. */
  selection: string[];
  /** Multiple mutually independent top-level selections need a non-semantic projection root. */
  virtualRoot: boolean;
}

export interface ProjectionKeyParams {
  modelFingerprint: string;
  viewSelection: ViewSelection;
  changeSelection: { changeId: string } | null;
  presentationMode: PresentationMode;
  focus: string | null;
  expanded: readonly string[];
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

/** `exclude` takes precedence and prunes the whole descendants subtree of each match. */
function computeSelection(viewSelection: ViewSelection, model: SemanticModel): Set<string> {
  const known = new Set(model.elements.map(element => element.declaration.identity));
  if (viewSelection.type === 'model') return known;

  const children = childrenByParent(model);
  const selected = new Set<string>();
  const included = viewSelection.view.include === '*'
    ? [...known]
    : viewSelection.view.include;
  for (const identity of included) {
    if (known.has(identity)) collectSubtree(identity, children, selected);
  }
  for (const identity of viewSelection.view.exclude ?? []) {
    if (!known.has(identity)) continue;
    const pruned = new Set<string>();
    collectSubtree(identity, children, pruned);
    for (const item of pruned) selected.delete(item);
  }
  return selected;
}

function isAncestor(ancestor: string, descendant: string, parents: Map<string, string | null>): boolean {
  let parent = parents.get(descendant) ?? null;
  while (parent !== null) {
    if (parent === ancestor) return true;
    parent = parents.get(parent) ?? null;
  }
  return false;
}

/** Roots are selected Elements whose parent is absent from the selection. */
function selectionRoots(selection: Set<string>, parents: Map<string, string | null>): string[] {
  const roots: string[] = [];
  for (const identity of selection) {
    const parent = parents.get(identity) ?? null;
    if (parent === null || !selection.has(parent)) roots.push(identity);
  }
  return roots.sort(compareUtf8Bytes);
}

/**
 * Prunes the target model to the selection and reparents severed Elements, so the result is a
 * self-contained Semantic Model that the shared `generateLikeC4()` lowering can render.
 */
function projectSemanticModel(
  target: SemanticModel,
  selection: Set<string>,
  viewSelection: ViewSelection,
): SemanticModel {
  const parents = new Map(target.elements.map(element =>
    [element.declaration.identity, element.declaration.parent] as const));

  const elements: ModelElement[] = target.elements
    .filter(element => selection.has(element.declaration.identity))
    .map(element => {
      const parent = element.declaration.parent;
      const reachable = parent !== null && selection.has(parent);
      return reachable ? element : { ...element, declaration: { ...element.declaration, parent: null } };
    });

  // LikeC4 cannot express self or ancestor-chain endpoints; Xirang keeps them in its own source.
  const relationships = target.relationships.filter(relationship =>
    selection.has(relationship.source)
    && selection.has(relationship.target)
    && relationship.source !== relationship.target
    && !isAncestor(relationship.source, relationship.target, parents)
    && !isAncestor(relationship.target, relationship.source, parents));

  // `exclude` is already applied, so the projected view carries the resolved selection only.
  const views: AuthoredView[] = [];
  if (viewSelection.type === 'authored') {
    const { identity, of, title, autoLayout } = viewSelection.view;
    views.push({
      identity,
      include: [...selection].sort(compareUtf8Bytes),
      ...(of !== undefined && selection.has(of) ? { of } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(autoLayout !== undefined ? { autoLayout } : {}),
    });
  }

  return {
    elementKinds: target.elementKinds,
    relationshipKinds: target.relationshipKinds,
    elements,
    relationships,
    views,
  };
}

/**
 * Lowers one visible semantic projection to native LikeC4 sources. Model, Authored, Change and
 * Candidate selections all pass through this single lowering; the official LikeC4 parser,
 * validator, compute-view and Graphviz layout run on the returned files in the view server.
 */
export function createRuntimeProjection(descriptor: ProjectionDescriptor): RuntimeProjection {
  const target = descriptor.changeSelection?.target ?? descriptor.model;
  const selection = computeSelection(descriptor.viewSelection, target);
  const parents = new Map(target.elements.map(element =>
    [element.declaration.identity, element.declaration.parent] as const));
  const projected = projectSemanticModel(target, selection, descriptor.viewSelection);

  return {
    files: generateLikeC4(projected),
    selection: [...selection].sort(compareUtf8Bytes),
    virtualRoot: descriptor.viewSelection.type === 'authored'
      && selectionRoots(selection, parents).length > 1,
  };
}

/** Same descriptor always yields the same key; `expanded` is order-insensitive. */
export function computeProjectionKey(params: ProjectionKeyParams): string {
  const view = params.viewSelection.type === 'model'
    ? 'model'
    : `authored:${params.viewSelection.view.identity}`;
  const payload = JSON.stringify({
    fingerprint: params.modelFingerprint,
    view,
    change: params.changeSelection?.changeId ?? null,
    mode: params.presentationMode,
    focus: params.focus ?? null,
    expanded: [...params.expanded].sort(compareUtf8Bytes),
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 32);
}
