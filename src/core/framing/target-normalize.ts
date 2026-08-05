import type { DeltaEntry } from '../model/delta.js';

/** Canonicalizes set-semantic array fields before equality comparison. */
export function normalizedCoverageTarget(entity: DeltaEntry['entity'], target: unknown): unknown {
  if (!target || typeof target !== 'object') return target;
  const value = target as Record<string, unknown>;
  if (entity === 'element-kind') {
    return {
      ...value,
      ...(Array.isArray(value.parents) ? { parents: [...value.parents].sort() } : {}),
      ...(Array.isArray(value.children) ? { children: [...value.children].sort() } : {}),
    };
  }
  if (entity === 'relationship-kind') {
    return {
      ...value,
      ...(Array.isArray(value.sourceKinds) ? { sourceKinds: [...value.sourceKinds].sort() } : {}),
      ...(Array.isArray(value.targetKinds) ? { targetKinds: [...value.targetKinds].sort() } : {}),
    };
  }
  return target;
}
