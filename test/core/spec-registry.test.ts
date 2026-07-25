import { describe, expect, it } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { buildSpecRegistry } from '../../src/core/spec-registry.js';
import type { SemanticElement, SemanticMetamodel } from '../../src/utils/semantic-model.js';

async function withTempDir(run: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-spec-registry-'));
  try {
    await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function writeSpec(root: string, id: string, content: string) {
  const dir = path.join(root, '.xirang', 'specs', id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'spec.md'), content, 'utf8');
}

const specForElement = (element: string) => `---
element: ${element}
---
# Test Spec

## Requirements
`;

const metamodel: SemanticMetamodel = {
  elements: {
    project: { root: true, contractPolicy: 'required' },
    workflow: { contractPolicy: 'required' },
    note: { contractPolicy: 'optional' },
  },
  relationships: {},
};

function element(id: string, kind: string): SemanticElement {
  return { id, fqn: id, kind, title: id, summary: id, parent: null, children: [], metadata: { elementId: id } };
}

describe('buildSpecRegistry', () => {
  it('builds sorted one-to-many element/spec mappings', async () => {
    await withTempDir(async root => {
      await writeSpec(root, 'payment-errors', specForElement('payment.authorize'));
      await writeSpec(root, 'payment-auth', specForElement('payment.authorize'));
      await writeSpec(root, 'payment-refund', specForElement('payment.refund'));

      const registry = await buildSpecRegistry(root);

      expect(registry.elementToSpecs.get('payment.authorize')).toEqual(['payment-auth', 'payment-errors']);
      expect(registry.elementToSpecs.get('payment.refund')).toEqual(['payment-refund']);
      expect(registry.specToElement.get('payment-auth')).toBe('payment.authorize');
      expect(registry.getSpecsForElement('payment.authorize')).toEqual(['payment-auth', 'payment-errors']);
      expect(registry.getElementForSpec('payment-auth')).toBe('payment.authorize');
    });
  });

  it('keeps missing and invalid bindings orphaned with structured issues', async () => {
    await withTempDir(async root => {
      await writeSpec(root, 'mapped', specForElement('payment.authorize'));
      await writeSpec(root, 'unbound', '# Unbound\n\n## Requirements\n');
      await writeSpec(root, 'legacy-owner', '---\ncapabilities: [cap.payment.authorize]\n---\n# Legacy\n');
      await writeSpec(root, 'malformed', '---\nelement: [payment.authorize\n---\n# Malformed\n');

      const registry = await buildSpecRegistry(root);

      expect(registry.specToElement.has('unbound')).toBe(false);
      expect(registry.getOrphanedSpecs()).toEqual(['legacy-owner', 'malformed', 'unbound']);
      expect(registry.getIssuesForSpec('legacy-owner')).toContainEqual(expect.objectContaining({ code: 'LEGACY_SPEC_OWNERSHIP' }));
      expect(registry.getIssuesForSpec('malformed')).toContainEqual(expect.objectContaining({ code: 'MALFORMED_FRONTMATTER' }));
    });
  });

  it('returns deterministic unknown results and uncovered required elements only', async () => {
    await withTempDir(async root => {
      await writeSpec(root, 'root-contract', specForElement('project.root'));
      const registry = await buildSpecRegistry(root);
      const elements = [element('project.root', 'project'), element('workflow.run', 'workflow'), element('note.info', 'note')];

      expect(registry.getSpecsForElement('unknown')).toEqual([]);
      expect(registry.getElementForSpec('unknown')).toBeNull();
      expect(registry.getUncoveredRequiredElements(elements, metamodel)).toEqual(['workflow.run']);
    });
  });

  it('handles missing specs directory', async () => {
    await withTempDir(async root => {
      const registry = await buildSpecRegistry(root);

      expect(registry.elementToSpecs.size).toBe(0);
      expect(registry.specToElement.size).toBe(0);
      expect(registry.getOrphanedSpecs()).toEqual([]);
    });
  });

  it('projects identical spec ids from POSIX and Windows-shaped project roots', async () => {
    await withTempDir(async root => {
      const windowsShapedRoot = path.join(root, 'C:\\workspace\\demo');
      await writeSpec(root, 'payment-auth', specForElement('payment.authorize'));
      await writeSpec(windowsShapedRoot, 'payment-auth', specForElement('payment.authorize'));

      const posix = await buildSpecRegistry(root);
      const windowsShaped = await buildSpecRegistry(windowsShapedRoot);

      expect([...posix.specToElement]).toEqual([['payment-auth', 'payment.authorize']]);
      expect([...windowsShaped.specToElement]).toEqual([...posix.specToElement]);
    });
  });
});
