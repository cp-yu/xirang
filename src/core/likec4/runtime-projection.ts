import { createHash } from 'node:crypto';
import { compareUtf8Bytes } from '../candidate/canonical.js';
import type { SemanticModel } from '../model/types.js';

export type ViewSelection =
  | { type: 'model' }
  | {
      type: 'authored';
      view: {
        identity: string;
        include: '*' | string[];
        exclude?: string[];
        title?: string;
      };
    };

export interface ChangeSelection {
  changeId: string;
  delta: SemanticModel; // Expected model after applying change
}

export type PresentationMode = 'complete' | 'complete-with-diff' | 'diff-only';

export interface ProjectionDescriptor {
  model: SemanticModel;
  viewSelection: ViewSelection;
  changeSelection: ChangeSelection | null;
  presentationMode: PresentationMode;
  focus: string | null;
  expanded: string[];
}

export interface RuntimeProjection {
  likec4Model: {
    elements: string[];
    relationships: Array<{ source: string; kind: string; target: string }>;
  };
  likec4View: {
    identity: string;
    include: string[];
    exclude?: string[];
    of?: string;
  };
  virtualRoot: boolean;
}

export interface ProjectionKeyParams {
  modelFingerprint: string;
  viewSelection: ViewSelection;
  changeSelection: { changeId: string } | null;
  presentationMode: PresentationMode;
  focus: string | null;
  expanded: string[];
}

/**
 * Compute descendants closure for a given element identity.
 */
function computeDescendants(identity: string, model: SemanticModel): Set<string> {
  const descendants = new Set<string>();
  const childrenMap = new Map<string | null, string[]>();
  
  for (const element of model.elements) {
    const parent = element.declaration.parent;
    if (!childrenMap.has(parent)) childrenMap.set(parent, []);
    childrenMap.get(parent)!.push(element.declaration.identity);
  }

  const visit = (id: string) => {
    descendants.add(id);
    for (const child of childrenMap.get(id) ?? []) {
      visit(child);
    }
  };

  visit(identity);
  return descendants;
}

/**
 * Compute the selection set for a view, applying include and exclude.
 */
function computeSelection(viewSelection: ViewSelection, model: SemanticModel): Set<string> {
  if (viewSelection.type === 'model') {
    return new Set(model.elements.map(e => e.declaration.identity));
  }

  if (viewSelection.type !== 'authored') {
    throw new Error('Unexpected view selection type');
  }

  const { view } = viewSelection;
  const selected = new Set<string>();

  // Step 1: Apply include with descendants closure
  const includeList = view.include === '*' 
    ? model.elements.map(e => e.declaration.identity)
    : view.include;

  for (const identity of includeList) {
    const descendants = computeDescendants(identity, model);
    for (const desc of descendants) {
      selected.add(desc);
    }
  }

  // Step 2: Apply exclude to prune entire subtrees
  if (view.exclude && view.exclude.length > 0) {
    for (const identity of view.exclude) {
      const descendants = computeDescendants(identity, model);
      for (const desc of descendants) {
        selected.delete(desc);
      }
    }
  }

  return selected;
}

/**
 * Check if an Authored View has multiple top-level roots.
 */
function needsVirtualRoot(selection: Set<string>, model: SemanticModel): boolean {
  const parentMap = new Map(
    model.elements.map(e => [e.declaration.identity, e.declaration.parent])
  );

  const roots: string[] = [];
  for (const identity of selection) {
    const parent = parentMap.get(identity);
    if (parent === null || parent === undefined || !selection.has(parent)) {
      roots.push(identity);
    }
  }

  return roots.length > 1;
}

/**
 * Create a runtime projection from semantic model and view parameters.
 * This generates the native LikeC4 model and view that will be passed to
 * the official LikeC4 parser → validator → compute-view → Graphviz pipeline.
 */
export function createRuntimeProjection(descriptor: ProjectionDescriptor): RuntimeProjection {
  const { model, viewSelection, changeSelection } = descriptor;
  
  // For now, we only implement 'complete' mode without change overlay
  // TODO: Implement change-derived projections in later tasks
  const effectiveModel = changeSelection?.delta ?? model;
  
  const selection = computeSelection(viewSelection, effectiveModel);
  const virtualRoot = viewSelection.type === 'authored' 
    && needsVirtualRoot(selection, effectiveModel);

  // Filter elements to selected ones
  const selectedElements = [...selection].sort(compareUtf8Bytes);

  // Filter relationships: both endpoints must be in selection
  const selectedRelationships = effectiveModel.relationships
    .filter(rel => selection.has(rel.source) && selection.has(rel.target))
    .filter(rel => {
      // Exclude self-relationships and ancestor-chain relationships
      // LikeC4 cannot express these
      if (rel.source === rel.target) return false;
      
      const parentMap = new Map(
        effectiveModel.elements.map(e => [e.declaration.identity, e.declaration.parent])
      );
      
      const isAncestor = (ancestor: string, descendant: string): boolean => {
        let current = parentMap.get(descendant) ?? null;
        while (current !== null) {
          if (current === ancestor) return true;
          current = parentMap.get(current) ?? null;
        }
        return false;
      };

      return !isAncestor(rel.source, rel.target) && !isAncestor(rel.target, rel.source);
    });

  let viewIdentity: string;
  if (viewSelection.type === 'model') {
    viewIdentity = 'model';
  } else if (viewSelection.type === 'authored') {
    viewIdentity = viewSelection.view.identity;
  } else {
    throw new Error('Unexpected view selection type');
  }

  return {
    likec4Model: {
      elements: selectedElements,
      relationships: selectedRelationships.map(r => ({
        source: r.source,
        kind: r.kind,
        target: r.target,
      })),
    },
    likec4View: {
      identity: viewIdentity,
      include: selectedElements,
    },
    virtualRoot,
  };
}

/**
 * Compute a deterministic projection key from parameters.
 * Same inputs always produce the same key.
 */
export function computeProjectionKey(params: ProjectionKeyParams): string {
  const {
    modelFingerprint,
    viewSelection,
    changeSelection,
    presentationMode,
    focus,
    expanded,
  } = params;

  // Sort expanded for deterministic key
  const sortedExpanded = [...expanded].sort(compareUtf8Bytes);

  const keyData = {
    fingerprint: modelFingerprint,
    view: viewSelection,
    change: changeSelection?.changeId ?? null,
    mode: presentationMode,
    focus: focus ?? null,
    expanded: sortedExpanded,
  };

  const hash = createHash('sha256');
  hash.update(JSON.stringify(keyData));
  return hash.digest('hex').slice(0, 16);
}
