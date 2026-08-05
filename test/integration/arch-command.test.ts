import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatArchitectureQueryText, queryArchitecture } from '../../src/commands/arch/query.js';
import { validateArchitectureCommand } from '../../src/commands/arch/validate.js';
import { exportArchitecture } from '../../src/commands/arch/export.js';
import { likec4CacheDir } from '../../src/core/likec4/paths.js';
import { readModelTree } from '../../src/core/model/parser.js';
import { modelRoot } from '../../src/core/model/paths.js';
import { runCLI } from '../helpers/run-cli.js';
import { writeProjectModel } from '../helpers/model-fixture.js';

const CONTRACT = '## Requirements\n\n### Requirement: Project behavior\nThe project SHALL behave.\n\n#### Scenario: Existing\n- **WHEN** used\n- **THEN** it works';

async function withInteractiveTTY(callback: () => Promise<void>): Promise<void> {
  const originalIsTTY = process.stdin.isTTY;
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
  try {
    await callback();
  } finally {
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: originalIsTTY });
  }
}

describe('arch commands', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-command-'));
    await writeProjectModel(root, {
      elementKinds: [
        { identity: 'semanticProject', contract: 'required', root: true, children: ['area', 'operation'] },
        { identity: 'project' },
        { identity: 'domain' },
        { identity: 'capability' },
        { identity: 'area', parents: ['semanticProject'], children: ['operation'] },
        { identity: 'operation', parents: ['semanticProject', 'area'] },
      ],
      relationshipKinds: [{ identity: 'invokes' }, { identity: 'precedes' }],
      elements: [
        { identity: 'project.root', kind: 'semanticProject', parent: null, title: 'Project', definition: 'Project intent', requirements: CONTRACT },
        { identity: 'payments', kind: 'area', parent: 'project.root', title: 'Payments', definition: 'Payment refinement' },
        { identity: 'payment.authorize', kind: 'operation', parent: 'payments', title: 'Authorize', definition: 'Authorize payment', requirements: CONTRACT },
        { identity: 'payment.audit', kind: 'operation', parent: 'payments', title: 'Audit', definition: 'Audit payment' },
      ],
      relationships: [{ source: 'payment.authorize', kind: 'invokes', target: 'payment.audit' }],
      views: [{ identity: 'index' }],
    });
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('registers search and impact help without Change or code options', async () => {
    const searchHelp = await runCLI(['arch', 'search', '--help'], { cwd: root });
    const impactHelp = await runCLI(['arch', 'impact', '--help'], { cwd: root });

    expect(searchHelp.exitCode).toBe(0);
    expect(searchHelp.stdout).toContain('arch search');
    expect(searchHelp.stdout).toContain('--limit <n>');
    expect(searchHelp.stdout).toContain('--json');
    expect(impactHelp.exitCode).toBe(0);
    expect(impactHelp.stdout).toContain('arch impact');
    expect(impactHelp.stdout).toContain('--depth <n>');
    expect(impactHelp.stdout).toContain('--json');
    expect(`${searchHelp.stdout}\n${impactHelp.stdout}`).not.toMatch(/--change|--code/);
  });

  it('runs search and impact through one canonical JSON projection', async () => {
    const search = await runCLI(['arch', 'search', 'Authorize', '--limit', '1', '--json'], { cwd: root });
    expect(search.exitCode).toBe(0);
    expect(JSON.parse(search.stdout)).toMatchObject({
      query: 'Authorize',
      totalMatches: 1,
      matches: [{ element: { identity: 'payment.authorize' } }],
    });

    const impact = await runCLI(['arch', 'impact', 'payment.authorize', '--json'], { cwd: root });
    expect(impact.exitCode).toBe(0);
    expect(JSON.parse(impact.stdout)).toMatchObject({
      focusElements: [{ identity: 'payment.authorize' }],
      relations: [{ source: 'payment.authorize', kind: 'invokes', target: 'payment.audit' }],
    });

    const invalid = await runCLI(['arch', 'impact', 'payment.authorize', '--change', 'active'], { cwd: root });
    expect(invalid.exitCode).toBe(1);
    expect(invalid.stderr).toContain("unknown option '--change'");
  });

  it('keeps first-run telemetry notices out of JSON stdout in a TTY', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    try {
      await withInteractiveTTY(async () => {
        const isolatedHome = path.join(root, 'telemetry-home');
        const baseEnv = {
          CI: undefined,
          DO_NOT_TRACK: undefined,
          HOME: isolatedHome,
          USERPROFILE: isolatedHome,
          XIRANG_INTERACTIVE: undefined,
          XIRANG_TELEMETRY: undefined,
        };
        const search = await runCLI(['arch', 'search', 'Authorize', '--json'], {
          cwd: root,
          env: { ...baseEnv, XDG_CONFIG_HOME: path.join(root, 'search-config') },
        });
        const impact = await runCLI(['arch', 'impact', 'payment.authorize', '--json'], {
          cwd: root,
          env: { ...baseEnv, XDG_CONFIG_HOME: path.join(root, 'impact-config') },
        });

        expect(search.exitCode).toBe(0);
        expect(impact.exitCode).toBe(0);
        expect(JSON.parse(search.stdout)).toMatchObject({ matches: [{ element: { identity: 'payment.authorize' } }] });
        expect(JSON.parse(impact.stdout)).toMatchObject({ focusElements: [{ identity: 'payment.authorize' }] });
        expect(search.stderr).toContain('Xirang collects anonymous usage stats');
        expect(impact.stderr).toContain('Xirang collects anonymous usage stats');
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('queries by stable identity and rejects a derived FQN', async () => {
    const result = await queryArchitecture(root, 'payment.authorize');

    expect(result.element).toEqual({
      identity: 'payment.authorize',
      kind: 'operation',
      parent: 'payments',
      title: 'Authorize',
      definition: 'Authorize payment',
      contract: 'optional',
      hasContract: true,
      children: [],
    });
    expect(result.element).not.toHaveProperty('fqn');
    expect(result.element).not.toHaveProperty('specs');
    expect(result.element).not.toHaveProperty('contractPolicy');
    expect(result.element).not.toHaveProperty('requirements');

    await expect(queryArchitecture(root, 'root.payments.authorize'))
      .rejects.toThrow('Element must use stable identity, not FQN');
    await expect(queryArchitecture(root, 'cap.missing')).rejects.toThrow('Element not found: cap.missing');
  });

  it('inlines the complete Contract only when --contract is requested', async () => {
    const withoutContract = await queryArchitecture(root, 'project.root');
    expect(withoutContract.element.hasContract).toBe(true);
    expect(withoutContract.element.requirements).toBeUndefined();

    const withContract = await queryArchitecture(root, 'project.root', { contract: true });
    expect(withContract.element.requirements).toEqual([{
      name: 'Project behavior',
      body: 'The project SHALL behave.',
      scenarios: [{ name: 'Existing', body: '- **WHEN** used\n- **THEN** it works' }],
    }]);

    const empty = await queryArchitecture(root, 'payment.audit', { contract: true });
    expect(empty.element.hasContract).toBe(false);
    expect(empty.element.requirements).toEqual([]);

    const cli = await runCLI(['arch', 'query', 'project.root', '--contract', '--json'], { cwd: root });
    expect(JSON.parse(cli.stdout).element.requirements[0].name).toBe('Project behavior');
  });

  it('expands containment and relation endpoints by identity', async () => {
    const result = await queryArchitecture(root, 'project.root', { depth: 2, relations: true });

    expect(result.refinement).toEqual([
      expect.objectContaining({ identity: 'payments', parent: 'project.root', depth: 1 }),
      expect.objectContaining({ identity: 'payment.audit', parent: 'payments', depth: 2 }),
      expect.objectContaining({ identity: 'payment.authorize', parent: 'payments', depth: 2 }),
    ]);
    expect(result.relations).toEqual([
      { source: 'payment.authorize', kind: 'invokes', target: 'payment.audit', depth: 2 },
    ]);
    expect(result.relations?.[0]).not.toHaveProperty('description');
    expect(formatArchitectureQueryText(result)).toContain('[depth 2] Element: payment.authorize');
  });

  it('returns a JSON-serializable result with related elements at bounded depth', async () => {
    const result = await queryArchitecture(root, 'payment.authorize', { relations: true, depth: 2 });
    expect(result.relatedElements).toEqual([
      expect.objectContaining({ element: expect.objectContaining({ identity: 'payment.audit' }), depth: 1 }),
    ]);
    expect(JSON.parse(JSON.stringify(result))).toMatchObject({ element: { identity: 'payment.authorize' } });
  });

  it('validates .xirang/model without invoking LikeC4', async () => {
    const result = await validateArchitectureCommand(root);
    expect(result).toEqual({ success: true, errors: [], warnings: [] });

    await fs.writeFile(path.join(modelRoot(root), 'elements', 'orphan.md'),
      '---\nentity: element-declaration\nidentity: orphan\nkind: operation\nparent: ghost\ntitle: Orphan\ndefinition: S\n---\n');
    const broken = await validateArchitectureCommand(root);
    expect(broken.success).toBe(false);
    expect(broken.errors.map(item => item.code)).toContain('MISSING_PARENT');
  });

  it('validates Authored View references against declared Elements', async () => {
    await fs.writeFile(path.join(modelRoot(root), 'views', 'broken.md'),
      '---\nentity: authored-view\nidentity: broken\nof: ghost\ninclude:\n  - payment.authorize\n  - absent\n---\n');

    const result = await validateArchitectureCommand(root);

    expect(result.success).toBe(false);
    expect(result.errors.filter(item => item.code === 'UNRESOLVED_VIEW_REFERENCE')).toHaveLength(2);
  });

  it('reports a misplaced entity as a non-blocking Formal warning', async () => {
    await fs.rename(
      path.join(modelRoot(root), 'metamodel', 'invokes.md'),
      path.join(modelRoot(root), 'views', 'invokes.md'),
    );

    const result = await validateArchitectureCommand(root);

    expect(result.success).toBe(true);
    expect(result.warnings).toContainEqual(expect.objectContaining({
      code: 'ENTITY_PARTITION_MISMATCH',
      element: 'invokes',
    }));
  });

  it('preserves Formal partition warnings in Expected Model validation', async () => {
    await fs.rename(
      path.join(modelRoot(root), 'metamodel', 'invokes.md'),
      path.join(modelRoot(root), 'views', 'invokes.md'),
    );
    const changeDir = path.join(root, '.xirang', 'changes', 'add-next', 'elements');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'payment.next.md'),
      '---\noperation: ADDED\nentity: element-declaration\nidentity: payment.next\nkind: operation\nparent: payments\ntitle: Next\ndefinition: Runs next work\n---\n');

    const result = await validateArchitectureCommand(root, { change: 'add-next' });

    expect(result.success).toBe(true);
    expect(result.warnings).toContainEqual(expect.objectContaining({
      code: 'ENTITY_PARTITION_MISMATCH',
      element: 'invokes',
    }));
  });

  it('validates the Expected Semantic Model of a change without touching the persistent source', async () => {
    const changeDir = path.join(root, '.xirang', 'changes', 'add-next', 'elements');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(path.join(changeDir, 'payment.next.md'),
      '---\noperation: ADDED\nentity: element-declaration\nidentity: payment.next\nkind: operation\nparent: payments\ntitle: Next\ndefinition: Runs next work\n---\n');
    const before = await readModelTree(modelRoot(root));

    const result = await validateArchitectureCommand(root, { change: 'add-next' });

    expect(result.success, JSON.stringify(result)).toBe(true);
    expect(await readModelTree(modelRoot(root))).toEqual(before);
  });

  it('exports diagrams from generated artifacts without writing the persistent source', async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    const output = path.join(root, 'docs', 'architecture');
    const before = await readModelTree(modelRoot(root));

    await exportArchitecture(root, { format: 'png', output, runLikeC4: runner });

    const cache = likec4CacheDir(root);
    expect(runner).toHaveBeenCalledWith(['export', 'png', '-o', output, cache]);
    expect((await fs.readdir(cache)).sort())
      .toEqual(['likec4.config.json', 'model.c4', 'relations.c4', 'specification.c4', 'views.c4']);
    expect(await readModelTree(modelRoot(root))).toEqual(before);
    await expect(fs.stat(output)).resolves.toMatchObject({});
  });

  it('runs arch snapshot with default text, markdown, and json formats', async () => {
    const text = await runCLI(['arch', 'snapshot'], { cwd: root });
    expect(text.exitCode).toBe(0);
    expect(text.stdout).toContain('project.root (semanticProject) | Project intent');
    expect(text.stdout).toContain('payment.authorize (operation) | Authorize payment');
    expect(text.stdout).toMatch(/└── |├── /);
    expect(text.stdout).toContain('[relationships]');
    expect(text.stdout).toContain('invokes: payment.authorize --> payment.audit');
    expect(text.stdout).toContain('[metamodel]');

    const markdown = await runCLI(['arch', 'snapshot', '--format', 'markdown'], { cwd: root });
    expect(markdown.exitCode).toBe(0);
    expect(markdown.stdout).toContain('- project.root (semanticProject) | Project intent');
    expect(markdown.stdout).toContain('  - payments (area) | Payment refinement');

    const json = await runCLI(['arch', 'snapshot', '--format', 'json'], { cwd: root });
    expect(json.exitCode).toBe(0);
    const parsed = JSON.parse(json.stdout);
    expect(parsed.elements.map((element: { identity: string }) => element.identity).sort()).toEqual([
      'payment.audit', 'payment.authorize', 'payments', 'project.root',
    ]);
    expect(parsed.relations).toEqual([
      { source: 'payment.authorize', kind: 'invokes', target: 'payment.audit' },
    ]);
    expect(parsed.metamodel.elementKinds.length).toBeGreaterThan(0);
    expect(json.stdout).not.toContain('Project behavior');
    expect(json.stdout).not.toContain('## Requirements');
  });

  it('fails arch snapshot with non-zero exit when the model is missing and creates no files', async () => {
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-arch-snapshot-missing-'));
    try {
      const result = await runCLI(['arch', 'snapshot'], { cwd: empty });
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toMatch(/unavailable|Semantic Model/i);
      const files = await fs.readdir(empty, { recursive: true });
      expect(files).toEqual([]);
    } finally {
      await fs.rm(empty, { recursive: true, force: true });
    }
  });

  it('reads the model exactly once per query', async () => {
    const readFileSpy = vi.spyOn(fs, 'readFile');
    try {
      const result = await queryArchitecture(root, 'payment.authorize', { relations: true });
      const counts = new Map<string, number>();
      for (const [file] of readFileSpy.mock.calls) {
        const key = String(file);
        if (key.includes(`${path.sep}model${path.sep}`)) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      expect([...counts.values()].every(count => count === 1)).toBe(true);
      expect(formatArchitectureQueryText(result)).toContain('Element: payment.authorize');
    } finally {
      readFileSpy.mockRestore();
    }
  });
});
