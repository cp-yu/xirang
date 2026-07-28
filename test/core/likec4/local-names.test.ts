import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNamespace, deriveLocalNames, LIKEC4_RESERVED_NAMES } from '../../../src/core/likec4/local-names.js';
import { LIKEC4_CACHE_DIR_NAME, likec4CacheDir } from '../../../src/core/likec4/paths.js';
import type { ModelElement } from '../../../src/core/model/types.js';

function element(identity: string, parent: string | null): ModelElement {
  return {
    declaration: { identity, kind: 'capability', parent, title: identity, definition: '' },
    requirements: [],
  };
}

describe('likec4CacheDir', () => {
  it('resolves under .xirang', () => {
    expect(LIKEC4_CACHE_DIR_NAME).toBe('.cache-likec4');
    expect(likec4CacheDir('/tmp/project')).toBe(path.join('/tmp/project', '.xirang', '.cache-likec4'));
  });
});

describe('deriveLocalNames', () => {
  it('takes the last identity segment and sanitizes illegal characters', () => {
    const names = deriveLocalNames([element('cap.architecture.likec4-reader', null)]);
    expect(names.nameOf('cap.architecture.likec4-reader')).toBe('likec4_reader');
  });

  it('prefixes names that do not start with a letter or underscore', () => {
    const names = deriveLocalNames([element('domain.2fa', null), element('_ok', null)]);
    expect(names.nameOf('domain.2fa')).toBe('_2fa');
    expect(names.nameOf('_ok')).toBe('_ok');
  });

  it('resolves same-parent collisions by identity byte order', () => {
    const names = deriveLocalNames([
      element('domain.architecture', null),
      element('b.reader', 'domain.architecture'),
      element('a.reader', 'domain.architecture'),
    ]);
    expect(names.nameOf('a.reader')).toBe('reader');
    expect(names.nameOf('b.reader')).toBe('reader_2');
  });

  it('keeps identical base names under different parents', () => {
    const names = deriveLocalNames([
      element('domain.a', null),
      element('domain.b', null),
      element('x.reader', 'domain.a'),
      element('y.reader', 'domain.b'),
    ]);
    expect(names.nameOf('x.reader')).toBe('reader');
    expect(names.nameOf('y.reader')).toBe('reader');
  });

  it('joins the parent chain with dots in pathOf', () => {
    const names = deriveLocalNames([
      element('project.root', null),
      element('domain.architecture', 'project.root'),
      element('cap.reader', 'domain.architecture'),
    ]);
    expect(names.pathOf('cap.reader')).toBe('root.architecture.reader');
  });

  it('is independent of input array order', () => {
    const elements = [
      element('project.root', null),
      element('a.reader', 'project.root'),
      element('b.reader', 'project.root'),
      element('c.reader', 'a.reader'),
    ];
    const forward = deriveLocalNames(elements);
    const reversed = deriveLocalNames([...elements].reverse());
    for (const item of elements) {
      const { identity } = item.declaration;
      expect(reversed.nameOf(identity)).toBe(forward.nameOf(identity));
      expect(reversed.pathOf(identity)).toBe(forward.pathOf(identity));
    }
  });

  it('throws for unknown identities', () => {
    const names = deriveLocalNames([element('project.root', null)]);
    expect(() => names.nameOf('missing')).toThrow(/missing/);
  });
});

describe('createNamespace', () => {
  it('sanitizes the whole source, not just the last segment', () => {
    expect(createNamespace()('arch.overview-1')).toBe('arch_overview_1');
  });

  it('prefixes LikeC4 reserved names', () => {
    const allocate = createNamespace();
    expect(LIKEC4_RESERVED_NAMES.has('views')).toBe(true);
    expect(LIKEC4_RESERVED_NAMES.has('root')).toBe(false);
    expect(allocate('views')).toBe('_views');
    expect(allocate('root')).toBe('root');
  });

  it('resolves collisions after keyword avoidance', () => {
    const allocate = createNamespace();
    expect(allocate('views')).toBe('_views');
    expect(allocate('_views')).toBe('_views_2');
  });

  it('avoids keywords in derived element names too', () => {
    const names = deriveLocalNames([element('project.root', null), element('y.views', 'project.root')]);
    expect(names.pathOf('y.views')).toBe('root._views');
  });
});
