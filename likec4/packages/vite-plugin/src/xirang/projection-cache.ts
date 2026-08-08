/**
 * Bounded in-memory store for layouted runtime projections.
 *
 * Runtime projections are derived output: they are never written to disk, because the number of
 * View/Change/Mode/focus/expanded combinations is unbounded. Entries carry the model fingerprint
 * they were built from, so a model refresh can drop every stale projection in one pass.
 */
export class ProjectionCache<T> {
  /** Map iteration order is insertion order, so the first key is the least recently used. */
  private readonly entries = new Map<string, { fingerprint: string; value: T }>();

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`ProjectionCache capacity must be a positive integer, received ${capacity}`);
    }
  }

  get size(): number {
    return this.entries.size;
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    // Re-insert to mark the entry as most recently used.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, fingerprint: string, value: T): void {
    this.entries.delete(key);
    this.entries.set(key, { fingerprint, value });
    while (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next();
      if (oldest.done === true) break;
      this.entries.delete(oldest.value);
    }
  }

  /** Drops every entry not built from one of the active fingerprints. */
  retainFingerprints(fingerprints: ReadonlySet<string>): number {
    let dropped = 0;
    for (const [key, entry] of [...this.entries]) {
      if (fingerprints.has(entry.fingerprint)) continue;
      this.entries.delete(key);
      dropped += 1;
    }
    return dropped;
  }

  /** Drops every entry not built from `fingerprint`; returns how many were dropped. */
  retainFingerprint(fingerprint: string): number {
    let dropped = 0;
    for (const [key, entry] of [...this.entries]) {
      if (entry.fingerprint === fingerprint) continue;
      this.entries.delete(key);
      dropped += 1;
    }
    return dropped;
  }
}
