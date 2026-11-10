import { describe, expect, it } from 'vitest';
import { resolveSchema } from '../../../../src/core/artifact-graph/resolver.js';
import { artifactReferences } from '../../../../src/core/templates/fragments/artifact-references.js';
import { PARTITIONS } from '../../../../src/core/model/types.js';
import {
  ARCHITECTURE_GENERATE_DELTA,
  SEMANTIC_MODEL_UNIT_NOTATION,
} from '../../../../src/core/templates/fragments/xirang-fragments.js';

const FIELD_ROWS = [
  'element-declaration: identity, kind, parent, title, definition',
  'element-kind: identity, contract; optional contractFormat, root, parents, children',
  'relationship-kind: identity; optional sourceKinds, targetKinds',
  'authored-view: identity, include; optional exclude, of, title, autoLayout',
];

const RETIRED_NOTATION = [
  'architecture-delta',
  '.xirang/specs',
  'specs/<spec-id>',
  'capabilityId',
  'domain_name.capability_name',
  'cap.<domain>',
  '--artifacts',
];

function fieldRows(surface: string): string[] {
  const plain = surface.replaceAll('`', '');
  return FIELD_ROWS.map((expected) => {
    const entity = expected.slice(0, expected.indexOf(':'));
    const match = plain.match(new RegExp(`${entity}\\s*(?:\\||:)\\s*([^|\\n]+)`));
    return `${entity}: ${match?.[1].trim() ?? ''}`;
  });
}

describe('Semantic Model notation consistency', () => {
  it('keeps shared entity fields, identity syntax, and retired notation aligned', () => {
    const reference = artifactReferences().find(item => item.path === 'references/artifact-specs.md')!;
    const surfaces = [
      SEMANTIC_MODEL_UNIT_NOTATION,
      ARCHITECTURE_GENERATE_DELTA,
      reference.content,
    ];

    for (const surface of surfaces) {
      expect(fieldRows(surface)).toEqual(FIELD_ROWS);
      expect(surface).toContain('[A-Za-z0-9._-]+');
      for (const retired of RETIRED_NOTATION) {
        expect(surface).not.toContain(retired);
      }
    }
  });

  it('keeps the specs output partitions aligned with the model compiler', () => {
    const outputPath = resolveSchema('semantic-model').artifacts.find(artifact => artifact.id === 'specs')!.generates;
    const projectedPartitions = outputPath.match(/^\{([^}]+)\}/)?.[1].split(',').sort();

    expect(projectedPartitions).toEqual([...PARTITIONS].sort());
  });
});
