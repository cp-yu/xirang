import { describe, expect, it } from 'vitest';
import { ProjectionCache } from './projection-cache'

describe('ProjectionCache', () => {
  it('returns a stored projection by key', () => {
    const cache = new ProjectionCache<string>(4);
    cache.set('k1', 'fp-a', 'one');

    expect(cache.get('k1')).toBe('one');
    expect(cache.get('missing')).toBeUndefined();
    expect(cache.size).toBe(1);
  });

  it('never grows past its capacity', () => {
    const cache = new ProjectionCache<number>(3);
    for (const index of [1, 2, 3, 4, 5]) cache.set(`k${index}`, 'fp-a', index);

    expect(cache.size).toBe(3);
    expect(cache.capacity).toBe(3);
  });

  it('evicts the least recently used entry first', () => {
    const cache = new ProjectionCache<number>(2);
    cache.set('k1', 'fp-a', 1);
    cache.set('k2', 'fp-a', 2);
    cache.get('k1');
    cache.set('k3', 'fp-a', 3);

    expect(cache.get('k1')).toBe(1);
    expect(cache.get('k2')).toBeUndefined();
    expect(cache.get('k3')).toBe(3);
  });

  it('refreshes recency when an existing key is overwritten', () => {
    const cache = new ProjectionCache<number>(2);
    cache.set('k1', 'fp-a', 1);
    cache.set('k2', 'fp-a', 2);
    cache.set('k1', 'fp-a', 10);
    cache.set('k3', 'fp-a', 3);

    expect(cache.get('k1')).toBe(10);
    expect(cache.get('k2')).toBeUndefined();
  });

  it('drops entries whose fingerprint is no longer current', () => {
    const cache = new ProjectionCache<number>(8);
    cache.set('old-1', 'fp-a', 1);
    cache.set('old-2', 'fp-a', 2);
    cache.set('new-1', 'fp-b', 3);

    expect(cache.retainFingerprint('fp-b')).toBe(2);
    expect(cache.get('old-1')).toBeUndefined();
    expect(cache.get('old-2')).toBeUndefined();
    expect(cache.get('new-1')).toBe(3);
    expect(cache.size).toBe(1);
  });

  it('reports nothing dropped when every entry is already current', () => {
    const cache = new ProjectionCache<number>(4);
    cache.set('k1', 'fp-a', 1);

    expect(cache.retainFingerprint('fp-a')).toBe(0);
    expect(cache.get('k1')).toBe(1);
  });

  it('rejects a non-positive capacity instead of caching without a bound', () => {
    expect(() => new ProjectionCache<number>(0)).toThrow(/capacity/i);
    expect(() => new ProjectionCache<number>(-1)).toThrow(/capacity/i);
  });
});
