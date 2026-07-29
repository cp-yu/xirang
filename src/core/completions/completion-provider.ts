import { getActiveChangeIds, getContractElementIds } from '../../utils/item-discovery.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Provides cached dynamic completion suggestions for Changes and Element Contracts. */
export class CompletionProvider {
  private readonly cacheTTL: number;
  private changeCache: CacheEntry<string[]> | null = null;
  private contractCache: CacheEntry<string[]> | null = null;

  constructor(
    private readonly cacheTTLMs: number = 2000,
    private readonly projectRoot: string = process.cwd()
  ) {
    this.cacheTTL = cacheTTLMs;
  }

  async getChangeIds(): Promise<string[]> {
    const now = Date.now();
    if (this.changeCache && now - this.changeCache.timestamp < this.cacheTTL) {
      return this.changeCache.data;
    }

    const changeIds = await getActiveChangeIds(this.projectRoot);
    this.changeCache = { data: changeIds, timestamp: now };
    return changeIds;
  }

  async getContractElementIds(): Promise<string[]> {
    const now = Date.now();
    if (this.contractCache && now - this.contractCache.timestamp < this.cacheTTL) {
      return this.contractCache.data;
    }

    const contractElementIds = await getContractElementIds(this.projectRoot);
    this.contractCache = { data: contractElementIds, timestamp: now };
    return contractElementIds;
  }

  async getAllIds(): Promise<{ changeIds: string[]; contractElementIds: string[] }> {
    const [changeIds, contractElementIds] = await Promise.all([
      this.getChangeIds(),
      this.getContractElementIds(),
    ]);
    return { changeIds, contractElementIds };
  }

  clearCache(): void {
    this.changeCache = null;
    this.contractCache = null;
  }

  getCacheStats(): {
    changeCache: { valid: boolean; age?: number };
    contractCache: { valid: boolean; age?: number };
  } {
    const now = Date.now();
    return {
      changeCache: {
        valid: this.changeCache !== null && now - this.changeCache.timestamp < this.cacheTTL,
        age: this.changeCache ? now - this.changeCache.timestamp : undefined,
      },
      contractCache: {
        valid: this.contractCache !== null && now - this.contractCache.timestamp < this.cacheTTL,
        age: this.contractCache ? now - this.contractCache.timestamp : undefined,
      },
    };
  }
}
