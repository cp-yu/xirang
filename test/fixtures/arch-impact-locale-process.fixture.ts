import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { impactArchitecture } from '../../src/commands/arch/impact.js';

const outputPath = process.env.XIRANG_LOCALE_OUTPUT;

const specification = `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract required children [capability] } }
  element capability { xirang { contract optional parents [project] } }
  relationship invokes
}`;

const model = `model {
  project_root = project 'Project' 'Project intent' {
    metadata { elementId 'project.root' }
    focus = capability 'Focus' 'Impact focus' { metadata { elementId 'cap.focus' } }
    upper = capability 'Upper' 'Upper branch' { metadata { elementId 'cap.I' } }
    lower = capability 'Lower' 'Lower branch' { metadata { elementId 'cap.i' } }
    target = capability 'Target' 'Shared target' { metadata { elementId 'cap.target' } }
  }
  project_root.focus -[invokes]-> project_root.upper
  project_root.focus -[invokes]-> project_root.lower
  project_root.upper -[invokes]-> project_root.target
  project_root.lower -[invokes]-> project_root.target
}`;

const contract = `---
element: project.root
---

# Project

## Purpose
Project contract.
`;

describe.runIf(Boolean(outputPath))('arch impact locale process fixture', () => {
  it('writes the complete canonical impact projection', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-impact-locale-'));
    try {
      const architectureDir = path.join(root, '.xirang', 'architecture');
      const specDir = path.join(root, '.xirang', 'specs', 'project-contract');
      await fs.mkdir(architectureDir, { recursive: true });
      await fs.mkdir(specDir, { recursive: true });
      await fs.writeFile(path.join(architectureDir, 'specification.c4'), specification);
      await fs.writeFile(path.join(architectureDir, 'model.c4'), model);
      await fs.writeFile(path.join(specDir, 'spec.md'), contract);

      const result = await impactArchitecture(root, ['cap.focus']);
      await fs.writeFile(outputPath!, JSON.stringify(result));
      expect(result.elements.map(element => element.id)).toEqual([
        'cap.I', 'cap.focus', 'cap.i', 'cap.target', 'project.root',
      ]);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
