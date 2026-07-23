import { describe, expect, it } from 'vitest';
import {
  compareUtf8Bytes,
  inspectCanonicalText,
  normalizeDigestPath,
} from '../../src/core/candidate/canonical.js';
import { computeCandidateDigest } from '../../src/core/candidate/digest.js';

describe('Candidate canonical utilities', () => {
  it('orders strings by UTF-8 bytes rather than locale', () => {
    const values = ['z', 'é', 'a'];
    expect(values.sort(compareUtf8Bytes)).toEqual(['a', 'z', 'é']);
  });

  it('reports canonical text violations without rewriting bytes', () => {
    const bytes = Buffer.from('\ufeffCafe\u0301  \r\n');
    expect(inspectCanonicalText(bytes)).toEqual(expect.arrayContaining([
      'utf8-bom',
      'unicode-nfc',
      'line-ending-lf',
      'trailing-whitespace',
    ]));
    expect(bytes.equals(Buffer.from('\ufeffCafe\u0301  \r\n'))).toBe(true);
  });

  it('requires exactly one final newline', () => {
    expect(inspectCanonicalText(Buffer.from('ok\n'))).toEqual([]);
    expect(inspectCanonicalText(Buffer.from('missing'))).toContain('final-newline');
    expect(inspectCanonicalText(Buffer.from('extra\n\n'))).toContain('final-newline');
  });

  it('normalizes relative digest paths and rejects unsafe paths', () => {
    expect(normalizeDigestPath('specs\\auth\\spec.md')).toBe('specs/auth/spec.md');
    expect(() => normalizeDigestPath('../secret')).toThrow(/relative path/);
    expect(() => normalizeDigestPath('/absolute')).toThrow(/relative path/);
  });
});

describe('Candidate digest', () => {
  it('is byte-stable independent of input order', () => {
    const first = computeCandidateDigest([
      { path: 'build.md', bytes: Buffer.from('scope\n') },
      { path: 'architecture/model.c4', bytes: Buffer.from('model {}\n') },
    ]);
    const second = computeCandidateDigest([
      { path: 'architecture/model.c4', bytes: Buffer.from('model {}\n') },
      { path: 'build.md', bytes: Buffer.from('scope\n') },
    ]);
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('frames paths and contents to prevent concatenation ambiguity', () => {
    const first = computeCandidateDigest([
      { path: 'a', bytes: Buffer.from('bc') },
    ]);
    const second = computeCandidateDigest([
      { path: 'ab', bytes: Buffer.from('c') },
    ]);
    expect(first).not.toBe(second);
  });

  it('rejects duplicate normalized paths', () => {
    expect(() => computeCandidateDigest([
      { path: 'specs\\a', bytes: Buffer.from('1') },
      { path: 'specs/a', bytes: Buffer.from('2') },
    ])).toThrow(/duplicate/i);
  });
});
