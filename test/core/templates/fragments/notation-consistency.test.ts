import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { generateInstructions, loadChangeContext } from '../../../../src/core/artifact-graph/instruction-loader.js';
import { PARTITIONS } from '../../../../src/core/model/types.js';
import {
  ARCHITECTURE_GENERATE_DELTA,
  SEMANTIC_MODEL_UNIT_NOTATION,
} from '../../../../src/core/templates/fragments/xirang-fragments.js';

const FIELD_ROWS = [
  'element-declaration: identity, kind, parent, title, summary',
  'element-kind: identity, contract; optional root, parents, children',
  'relationship-kind: identity; optional sourceKinds, targetKinds',
  'authored-view: identity, include; optional of, title, autoLayout',
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
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xirang-notation-'));
    fs.mkdirSync(path.join(projectRoot, '.xirang', 'changes', 'notation-test'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('keeps shared entity fields, identity syntax, and retired notation aligned', () => {
    const projected = generateInstructions(loadChangeContext(projectRoot, 'notation-test'), 'specs');
    const surfaces = [
      SEMANTIC_MODEL_UNIT_NOTATION,
      ARCHITECTURE_GENERATE_DELTA,
      projected.instruction,
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
    const outputPath = generateInstructions(
      loadChangeContext(projectRoot, 'notation-test'),
      'specs'
    ).outputPath;
    const projectedPartitions = outputPath.match(/^\{([^}]+)\}/)?.[1].split(',').sort();

    expect(projectedPartitions).toEqual([...PARTITIONS].sort());
  });
});
