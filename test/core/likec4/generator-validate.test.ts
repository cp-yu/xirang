import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runLikeC4 } from '../../../src/commands/arch/runner.js';
import { generateLikeC4 } from '../../../src/core/likec4/generator.js';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import { modelRoot } from '../../../src/core/model/paths.js';
import type { ModelElement, SemanticModel } from '../../../src/core/model/types.js';

function element(identity: string, parent: string | null, kind: string): ModelElement {
  return {
    declaration: { identity, kind, parent, title: identity, definition: `${identity} intent` },
    requirements: [],
  };
}

/**
 * Covers deep nesting, cross-subtree relations and view scoping, plus the adversarial names:
 * LikeC4 keywords as element/kind/view names, dots and dashes in identities, a leading digit,
 * and a same-parent base-name collision.
 */
const model: SemanticModel = {
  elementKinds: [
    { identity: 'project', contract: 'required', root: true, body: '' },
    { identity: 'domain', contract: 'optional', body: '' },
    { identity: 'capability', contract: 'required', body: '' },
    { identity: 'views', contract: 'optional', body: '' },
  ],
  relationshipKinds: [{ identity: 'invokes', body: '' }, { identity: 'include', body: '' }],
  elements: [
    element('project.main', null, 'project'),
    element('domain.architecture', 'project.main', 'domain'),
    element('domain.cli', 'project.main', 'domain'),
    element('x.model', 'domain.architecture', 'capability'),
    element('y.views', 'domain.architecture', 'capability'),
    element('z.2fa', 'domain.architecture', 'capability'),
    element('cap.architecture.likec4-reader', 'x.model', 'capability'),
    element('a.reader', 'domain.cli', 'capability'),
    element('b.reader', 'domain.cli', 'capability'),
    element('legacy.preview', 'domain.cli', 'views'),
  ],
  relationships: [
    { source: 'cap.architecture.likec4-reader', kind: 'invokes', target: 'a.reader' },
    { source: 'y.views', kind: 'include', target: 'b.reader' },
  ],
  views: [
    { identity: 'index', include: '*', title: 'Xirang Architecture', autoLayout: 'TopBottom' },
    { identity: 'arch.detail', include: ['domain.architecture', 'x.model'], of: 'project.main' },
    { identity: 'title', include: '*' },
  ],
};

describe('generateLikeC4 artifacts', () => {
  it('are accepted by LikeC4 validate', { timeout: 180_000 }, async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-likec4-generate-'));
    try {
      for (const [file, content] of generateLikeC4(model)) await fs.writeFile(path.join(dir, file), content);
      await expect(runLikeC4(['validate', dir])).resolves.toBeUndefined();
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('exports only the default and authored views', { timeout: 180_000 }, async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-likec4-derived-'));
    const outfile = path.join(os.tmpdir(), `xirang-likec4-${path.basename(dir)}.json`);
    try {
      for (const [file, content] of generateLikeC4(model)) await fs.writeFile(path.join(dir, file), content);
      await runLikeC4(['export', 'json', '--skip-layout', '--project', 'xirang', '-o', outfile, dir]);
      const generated = JSON.parse(await fs.readFile(outfile, 'utf8')) as {
        projectId: string;
        views: Record<string, { viewOf?: string; nodes: Array<{ modelRef?: string; navigateTo?: string }> }>;
      };

      expect(generated.projectId).toBe('xirang');
      expect(Object.keys(generated.views)).toEqual(expect.arrayContaining(['model', 'index', 'arch_detail', '_title']));
      expect(Object.keys(generated.views).some(identity => identity.startsWith('__'))).toBe(false);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
      await fs.rm(outfile, { force: true });
    }
  });

  it('exports the Model View as the only entry view when no index is authored', { timeout: 180_000 }, async () => {
    const withoutAuthoredIndex: SemanticModel = { ...model, views: [] };
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-likec4-entry-'));
    const outfile = path.join(os.tmpdir(), `xirang-likec4-${path.basename(dir)}.json`);
    try {
      for (const [file, content] of generateLikeC4(withoutAuthoredIndex)) {
        await fs.writeFile(path.join(dir, file), content);
      }
      await runLikeC4(['export', 'json', '--skip-layout', '--project', 'xirang', '-o', outfile, dir]);
      const generated = JSON.parse(await fs.readFile(outfile, 'utf8')) as { views: Record<string, unknown> };

      // LikeC4 must not inject its own `index` Landscape view next to the Model View.
      expect(Object.keys(generated.views)).toEqual(['model']);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
      await fs.rm(outfile, { force: true });
    }
  });

  it('are produced without touching the file system', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-likec4-purity-'));
    const cwd = process.cwd();
    try {
      process.chdir(dir);
      generateLikeC4(model);
      expect(await fs.readdir(dir)).toEqual([]);
    } finally {
      process.chdir(cwd);
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

/**
 * Regression guard for the graphviz `unflatten` layout failure: long summary
 * excerpts (before the fix, up to 120 code points) widened LikeC4 node labels
 * until the `model` view failed to lay out ("layouted 0 of 1 views"). No reduced
 * synthetic fixture reproduces the failure — it only occurs at the full project
 * geometry, so this test lays out the project's own Semantic Model view.
 */
describe('project Semantic Model view layout', () => {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

  it('lays out successfully with every edge routed', { timeout: 180_000 }, async () => {
    const { model: projectModel } = await parseSemanticModel(modelRoot(projectRoot));
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-layout-regression-'));
    const outfile = path.join(os.tmpdir(), `xirang-layout-${path.basename(dir)}.json`);
    try {
      for (const [file, content] of generateLikeC4(projectModel)) {
        await fs.writeFile(path.join(dir, file), content);
      }
      await runLikeC4(['export', 'json', '--project', 'xirang', '-o', outfile, dir]);
      const generated = JSON.parse(await fs.readFile(outfile, 'utf8')) as {
        projectId: string;
        views: Record<string, {
          nodes: Array<{ id: string }>;
          edges: Array<{ id: string; points?: number[][] }>;
        }>;
      };
      expect(generated.projectId).toBe('xirang');
      const modelView = generated.views['model'];
      expect(modelView, 'project Semantic Model must have a model view').toBeDefined();
      expect(modelView.nodes.length).toBeGreaterThan(0);
      const unrouted = modelView.edges.filter(edge => !Array.isArray(edge.points) || edge.points.length < 2);
      expect(unrouted, 'unrouted edges — likely a summary-length layout regression; see EXCERPT_LIMIT in src/core/likec4/definition.ts').toEqual([]);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
      await fs.rm(outfile, { force: true });
    }
  });
});
