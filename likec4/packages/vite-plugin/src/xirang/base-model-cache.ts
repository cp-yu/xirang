export class BaseModelCache<T extends { dispose?: () => void | Promise<void> }> {
  private readonly entries = new Map<string, Promise<T>>();

  constructor(private readonly factory: (sources: Record<string, string>) => Promise<T>) {}

  get(fingerprint: string, sources: Record<string, string>): Promise<T> {
    const existing = this.entries.get(fingerprint);
    if (existing) return existing;
    const created = this.factory(sources);
    this.entries.set(fingerprint, created);
    created.catch(() => {
      if (this.entries.get(fingerprint) === created) this.entries.delete(fingerprint);
    });
    return created;
  }

  async retainFingerprints(fingerprints: ReadonlySet<string>): Promise<void> {
    const stale = [...this.entries].filter(([fingerprint]) => !fingerprints.has(fingerprint));
    for (const [fingerprint, value] of stale) {
      this.entries.delete(fingerprint);
      await value.then(model => model.dispose?.()).catch(() => undefined);
    }
  }

  async dispose(): Promise<void> {
    const values = [...this.entries.values()];
    this.entries.clear();
    await Promise.all(values.map(value => value.then(model => model.dispose?.()).catch(() => undefined)));
  }
}
