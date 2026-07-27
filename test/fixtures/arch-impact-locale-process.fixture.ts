import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { impactArchitecture } from '../../src/commands/arch/impact.js';
import { writeProjectModel } from '../helpers/model-fixture.js';

const outputPath = process.env.XIRANG_LOCALE_OUTPUT;

describe.runIf(Boolean(outputPath))('arch impact locale process fixture', () => {
  it('writes the complete canonical impact projection', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-impact-locale-'));
    try {
      await writeProjectModel(root, {
        elementKinds: [
          { identity: 'project', root: true, children: ['capability'] },
          { identity: 'capability', parents: ['project'] },
        ],
        relationshipKinds: [{ identity: 'invokes' }],
        elements: [
          { identity: 'project.root', kind: 'project', parent: null, title: 'Project', summary: 'Project intent' },
          { identity: 'cap.focus', parent: 'project.root', title: 'Focus', summary: 'Impact focus' },
          { identity: 'cap.I', parent: 'project.root', title: 'Upper', summary: 'Upper branch' },
          { identity: 'cap.i', parent: 'project.root', title: 'Lower', summary: 'Lower branch' },
          { identity: 'cap.target', parent: 'project.root', title: 'Target', summary: 'Shared target' },
        ],
        relationships: [
          { source: 'cap.focus', kind: 'invokes', target: 'cap.I' },
          { source: 'cap.focus', kind: 'invokes', target: 'cap.i' },
          { source: 'cap.I', kind: 'invokes', target: 'cap.target' },
          { source: 'cap.i', kind: 'invokes', target: 'cap.target' },
        ],
      });

      const result = await impactArchitecture(root, ['cap.focus']);
      await fs.writeFile(outputPath!, JSON.stringify(result));
      expect(result.elements.map(element => element.identity)).toEqual([
        'cap.I', 'cap.focus', 'cap.i', 'cap.target', 'project.root',
      ]);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
