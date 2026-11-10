import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertContainedPath,
  managedRecordPath,
  projectRelativePosix,
  validateExplorationId,
  validateRecordSlug,
  validateRecordFilename,
} from '../../../src/core/record/paths.js';

describe('record paths', () => {
  it('accepts contained portable filenames and rejects escapes and Windows reserved names on every platform', () => {
    for (const name of ['design.md', 'design_2-accepted.md']) expect(validateRecordFilename(name)).toBe(name);
    for (const name of ['../design.md', 'folder/design.md', 'folder\\design.md', 'C:design.md', 'CON.md', 'nul.md', 'COM1.md', '.hidden.md']) expect(() => validateRecordFilename(name)).toThrow('filename');
  });
  it('constructs a direct-child managed path', () => {
    // Resolve the fixture root so Windows maps '/' to the current drive the
    // same way the implementation does.
    const repo = path.resolve('/repo');
    expect(managedRecordPath(repo, 'definition-first', '20260729T120000Z-a1b2c3d4')).toBe(
      path.join(repo, '.xirang', 'records', 'definition-first-20260729T120000Z-a1b2c3d4.md'),
    );
  });

  it('rejects invalid slugs and exploration identities', () => {
    for (const slug of ['', 'Upper', '../escape', 'two words', '-leading']) {
      expect(() => validateRecordSlug(slug)).toThrow();
    }
    for (const id of ['', '../x', '2026-aabb', '20260729T120000Z-ABCDEF12']) {
      expect(() => validateExplorationId(id)).toThrow();
    }
  });

  it('checks containment and presents POSIX paths with Windows semantics', () => {
    const root = 'C:\\repo';
    const target = 'C:\\repo\\.xirang\\records\\a-20260729T120000Z-a1b2c3d4.md';
    expect(assertContainedPath(root, target, path.win32)).toBe(target);
    expect(projectRelativePosix(root, target, path.win32)).toBe(
      '.xirang/records/a-20260729T120000Z-a1b2c3d4.md',
    );
    expect(() => assertContainedPath(root, 'C:\\outside\\file.md', path.win32)).toThrow(/outside/i);
    expect(() => assertContainedPath(root, 'D:\\repo\\file.md', path.win32)).toThrow(/outside/i);
  });
});
