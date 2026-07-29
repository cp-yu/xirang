import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertContainedPath,
  managedFramingPath,
  projectRelativePosix,
  validateExplorationId,
  validateFramingSlug,
} from '../../../src/core/framing/paths.js';

describe('framing paths', () => {
  it('constructs a direct-child managed path', () => {
    expect(managedFramingPath('/repo', 'definition-first', '20260729T120000Z-a1b2c3d4')).toBe(
      path.join('/repo', '.xirang', 'changes', '.explore-definition-first-20260729T120000Z-a1b2c3d4.md'),
    );
  });

  it('rejects invalid slugs and exploration identities', () => {
    for (const slug of ['', 'Upper', '../escape', 'two words', '-leading']) {
      expect(() => validateFramingSlug(slug)).toThrow();
    }
    for (const id of ['', '../x', '2026-aabb', '20260729T120000Z-ABCDEF12']) {
      expect(() => validateExplorationId(id)).toThrow();
    }
  });

  it('checks containment and presents POSIX paths with Windows semantics', () => {
    const root = 'C:\\repo';
    const target = 'C:\\repo\\.xirang\\changes\\.explore-a-20260729T120000Z-a1b2c3d4.md';
    expect(assertContainedPath(root, target, path.win32)).toBe(target);
    expect(projectRelativePosix(root, target, path.win32)).toBe(
      '.xirang/changes/.explore-a-20260729T120000Z-a1b2c3d4.md',
    );
    expect(() => assertContainedPath(root, 'C:\\outside\\file.md', path.win32)).toThrow(/outside/i);
    expect(() => assertContainedPath(root, 'D:\\repo\\file.md', path.win32)).toThrow(/outside/i);
  });
});
