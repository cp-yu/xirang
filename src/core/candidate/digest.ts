import { createHash } from 'node:crypto';
import { compareUtf8Bytes, normalizeDigestPath } from './canonical.js';

export interface CandidateDigestEntry {
  path: string;
  bytes: Uint8Array;
}

function encodeLength(length: number): Buffer {
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new Error(`Invalid digest entry length: ${length}`);
  }
  const encoded = Buffer.alloc(8);
  encoded.writeBigUInt64BE(BigInt(length));
  return encoded;
}

export function computeCandidateDigest(entries: readonly CandidateDigestEntry[]): string {
  const normalized = entries.map((entry) => ({
    path: normalizeDigestPath(entry.path),
    bytes: Buffer.from(entry.bytes),
  })).sort((left, right) => compareUtf8Bytes(left.path, right.path));

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1].path === normalized[index].path) {
      throw new Error(`Duplicate Candidate digest path: ${normalized[index].path}`);
    }
  }

  const hash = createHash('sha256');
  for (const entry of normalized) {
    const pathBytes = Buffer.from(entry.path, 'utf8');
    hash.update(encodeLength(pathBytes.length));
    hash.update(pathBytes);
    hash.update(encodeLength(entry.bytes.length));
    hash.update(entry.bytes);
  }
  return hash.digest('hex');
}
