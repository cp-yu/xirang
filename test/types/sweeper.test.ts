import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { ImpactSweepReport } from '../../src/types/sweeper.js';

describe('ImpactSweepReport', () => {
  it('accepts optional terminology observations', () => {
    const report: ImpactSweepReport = {
      concept: '流程',
      projectRoot: '/project',
      termMappings: [],
      xirang: {
        nodes: [],
        relationsExpanded: [],
      },
      mustChange: [],
      mustVerify: [],
      contextual: [],
      unknown: [],
      architectureDrift: [],
      questions: [],
      terminologyObservations: {
        userInput: '流程',
        foundInSpecs: [
          {
            term: '工作流',
            specs: ['apply-change-workflow'],
            count: 3,
          },
        ],
      },
    };

    expect(report.terminologyObservations?.foundInSpecs[0]?.term).toBe('工作流');
  });

  it('documents terminology observations with JSDoc', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'types', 'sweeper.ts'), 'utf8');

    expect(source).toContain('Terminology observation results, used to detect consistency between user input and spec terminology.');
    expect(source).toContain('"terminologyObservations"');
    expect(source).toContain('"foundInSpecs"');
  });
});
