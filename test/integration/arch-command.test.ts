import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatArchitectureQueryText, queryArchitecture } from '../../src/commands/arch/query.js';
import { validateArchitectureCommand } from '../../src/commands/arch/validate.js';
import { exportArchitecture } from '../../src/commands/arch/export.js';
import { runCLI } from '../helpers/run-cli.js';

const domain = `model { core = domain 'Core' { run = capability 'Run' { description 'Runs work' metadata { capabilityId 'cap.core.run' specs ['.xirang/specs/run/spec.md'] } } stop = capability 'Stop' { metadata { capabilityId 'cap.core.stop' } } finish = capability 'Finish' { metadata { capabilityId 'cap.core.finish' } } } core.run -[invokes]-> core.stop { description 'Runs stop' } core.stop -[precedes]-> core.finish }`;

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
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-arch-command-'));
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'specification.c4'), 'specification { element domain element capability relationship invokes relationship precedes }');
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), domain);
    await fs.writeFile(path.join(architecture, 'views.c4'), 'views { view index { include * } }');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  async function writeSemanticFixture(): Promise<void> {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.writeFile(path.join(architecture, 'specification.c4'), `
      xirang { languageVersion '1' }
      specification {
        element semanticProject { xirang { root true contract required children [operation] } }
        element operation { xirang { contract optional parents [semanticProject] } }
        relationship invokes
      }
    `);
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), `
      model {
        projectRoot = semanticProject 'Project' {
          summary 'Project intent'
          metadata { elementId 'project.root' }
          authorize = operation 'Authorize' {
            summary 'Authorize payment'
            metadata { elementId 'payment.authorize' }
          }
          audit = operation 'Audit' {
            summary 'Audit payment'
            metadata { elementId 'payment.audit' }
          }
        }
        projectRoot.authorize -[invokes]-> projectRoot.audit
      }
    `);
    const specDir = path.join(root, '.xirang', 'specs', 'project-contract');
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(path.join(specDir, 'spec.md'), `---\nelement: project.root\n---\n\n# Project\n\n## Purpose\nProject contract.\n\n## Requirements\n\n### Requirement: Project behavior\nThe project SHALL behave.\n\n#### Scenario: Existing\n- **WHEN** used\n- **THEN** it works\n`);
  }

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
    await writeSemanticFixture();

    const search = await runCLI(['arch', 'search', 'Authorize', '--limit', '1', '--json'], { cwd: root });
    expect(search.exitCode).toBe(0);
    expect(JSON.parse(search.stdout)).toMatchObject({
      query: 'Authorize',
      totalMatches: 1,
      matches: [{ element: { id: 'payment.authorize' } }],
    });

    const impact = await runCLI(['arch', 'impact', 'payment.authorize', '--json'], { cwd: root });
    expect(impact.exitCode).toBe(0);
    expect(JSON.parse(impact.stdout)).toMatchObject({
      focusElements: [{ id: 'payment.authorize' }],
      relations: [{ source: 'payment.authorize', kind: 'invokes', target: 'payment.audit' }],
    });

    const invalid = await runCLI(['arch', 'impact', 'payment.authorize', '--change', 'active'], { cwd: root });
    expect(invalid.exitCode).toBe(1);
    expect(invalid.stderr).toContain("unknown option '--change'");
  });

  it('keeps first-run telemetry notices out of JSON stdout in a TTY', async () => {
    await writeSemanticFixture();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    try {
      await withInteractiveTTY(async () => {
        const baseEnv = {
          CI: undefined,
          DO_NOT_TRACK: undefined,
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
        expect(JSON.parse(search.stdout)).toMatchObject({ matches: [{ element: { id: 'payment.authorize' } }] });
        expect(JSON.parse(impact.stdout)).toMatchObject({ focusElements: [{ id: 'payment.authorize' }] });
        expect(search.stderr).toContain('Xirang collects anonymous usage stats');
        expect(impact.stderr).toContain('Xirang collects anonymous usage stats');
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('should query element by ID', async () => {
    const result = await queryArchitecture(root, 'cap.core.run');
    expect(result.element).toMatchObject({ id: 'core.run', capabilityId: 'cap.core.run' });
  });

  it('queries v1 elements by stable ID or FQN with canonical refinement output', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.writeFile(path.join(architecture, 'specification.c4'), `
      xirang { languageVersion '1' }
      specification {
        element semanticProject { xirang { root true contract required } }
        element area { xirang { contract optional } }
        element operation { xirang { contract required } }
        relationship invokes
      }
    `);
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), `
      model {
        projectRoot = semanticProject 'Project' {
          summary 'Project intent'
          metadata { elementId 'project.root' }
          payments = area 'Payments' {
            summary 'Payment refinement'
            metadata { elementId 'payments' }
            authorize = operation 'Authorize' {
              summary 'Authorize payment'
              metadata { elementId 'payment.authorize' }
            }
          }
        }
      }
    `);
    await fs.mkdir(path.join(root, '.xirang', 'specs', 'authorize'), { recursive: true });
    await fs.writeFile(path.join(root, '.xirang', 'specs', 'authorize', 'spec.md'), '---\nelement: payment.authorize\n---\n# Authorize');

    const byId = await queryArchitecture(root, 'payment.authorize');
    const byFqn = await queryArchitecture(root, 'projectRoot.payments.authorize');

    expect(byId).toEqual(byFqn);
    expect(byId.element).toMatchObject({
      id: 'payment.authorize',
      fqn: 'projectRoot.payments.authorize',
      kind: 'operation',
      summary: 'Authorize payment',
      parent: 'payments',
      children: [],
      contractPolicy: 'required',
      specs: ['.xirang/specs/authorize/spec.md'],
    });
  });

  it('expands v1 containment and canonical semantic relation endpoints', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.writeFile(path.join(architecture, 'specification.c4'), `
      xirang { languageVersion '1' }
      specification {
        element semanticProject { xirang { root true contract optional } }
        element area { xirang { contract optional } }
        element operation { xirang { contract optional } }
        relationship invokes
      }
    `);
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), `
      model {
        projectRoot = semanticProject 'Project' {
          summary 'Project intent'
          metadata { elementId 'project.root' }
          payments = area 'Payments' {
            summary 'Payment refinement'
            metadata { elementId 'payments' }
            authorize = operation 'Authorize' {
              summary 'Authorize payment'
              metadata { elementId 'payment.authorize' }
            }
            audit = operation 'Audit' {
              summary 'Audit payment'
              metadata { elementId 'payment.audit' }
            }
          }
        }
        projectRoot.payments.authorize -[invokes]-> projectRoot.payments.audit
      }
    `);

    const result = await queryArchitecture(root, 'project.root', { depth: 2, relations: true });

    expect(result.refinement).toEqual([
      expect.objectContaining({ id: 'payments', parent: 'project.root', depth: 1 }),
      expect.objectContaining({ id: 'payment.audit', parent: 'payments', depth: 2 }),
      expect.objectContaining({ id: 'payment.authorize', parent: 'payments', depth: 2 }),
    ]);
    expect(result.relations).toEqual([
      expect.objectContaining({ source: 'payment.authorize', target: 'payment.audit', kind: 'invokes', depth: 2 }),
    ]);
    expect(await formatArchitectureQueryText(root, result)).toContain('[depth 2] Element: payment.authorize');
  });

  it('should query element with canonical relation details', async () => {
    const result = await queryArchitecture(root, 'cap.core.run', { relations: true });
    expect(result.relations).toEqual([expect.objectContaining({ source: 'core.run', kind: 'invokes', target: 'core.stop', description: 'Runs stop', depth: 1 })]);
    const output = await formatArchitectureQueryText(root, result);
    expect(output).toContain('Description: Runs work');
    expect(output).toContain('.xirang/specs/run/spec.md');
    expect(output).toContain('Relations:');
    expect(output).toContain('cap.core.run --invokes--> cap.core.stop - Runs stop');
  });

  it('should query relations recursively to bounded depth', async () => {
    const result = await queryArchitecture(root, 'cap.core.run', { relations: true, depth: 2 });
    expect(result.relatedElements).toEqual(expect.arrayContaining([
      expect.objectContaining({ element: expect.objectContaining({ capabilityId: 'cap.core.stop' }), depth: 1 }),
      expect.objectContaining({ element: expect.objectContaining({ capabilityId: 'cap.core.finish' }), depth: 2 }),
    ]));
    expect(result.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'precedes', depth: 2 }),
    ]));
  });

  it('should return a JSON-serializable result and reject missing elements', async () => {
    const result = await queryArchitecture(root, 'cap.core.run', { relations: true });
    expect(JSON.parse(JSON.stringify(result))).toMatchObject({ element: { capabilityId: 'cap.core.run' }, relations: expect.any(Array) });
    await expect(queryArchitecture(root, 'cap.missing')).rejects.toThrow('Element not found: cap.missing');
  });

  it('should validate architecture', async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    const result = await validateArchitectureCommand(root, { runLikeC4: runner });
    expect(runner).toHaveBeenCalledWith(['validate', path.join(root, '.xirang', 'architecture')]);
    expect(result.success).toBe(true);
  });

  it('should validate an architecture delta against an immutable formal model', async () => {
    const architecture = path.join(root, '.xirang', 'architecture');
    await fs.writeFile(path.join(architecture, 'specification.c4'), `xirang { languageVersion '1' }
specification {
  element project { xirang { root true contract optional children [capability] } }
  element capability { xirang { contract optional parents [project] } }
}`);
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), `model {
  projectRoot = project 'Root' 'Root summary' {
    metadata { elementId 'project.root' }
  }
}`);
    const delta = path.join(root, 'architecture-delta.c4');
    await fs.writeFile(delta, `architectureDelta { ADDED {
      element 'cap.core.next' {
        kind 'capability'
        parent 'project.root'
        title 'Next'
        summary 'Runs next work'
        metadata { elementId 'cap.core.next' }
      }
    } }`);
    const formalBefore = await fs.readFile(path.join(root, '.xirang', 'architecture', 'domains', 'core.c4'), 'utf8');
    const runner = vi.fn();
    const result = await validateArchitectureCommand(root, { deltaPath: delta, runLikeC4: runner });
    expect(runner).not.toHaveBeenCalled();
    expect(result.success, JSON.stringify(result)).toBe(true);
    expect(await fs.readFile(path.join(root, '.xirang', 'architecture', 'domains', 'core.c4'), 'utf8')).toBe(formalBefore);
  });

  it('should perform semantic validation', async () => {
    await fs.writeFile(path.join(root, '.xirang', 'architecture', 'domains', 'core.c4'), `model { orphan = capability 'Orphan' }`);
    const result = await validateArchitectureCommand(root, { runLikeC4: vi.fn().mockResolvedValue(undefined) });
    expect(result.success).toBe(false);
  });

  it('should export diagrams', async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    const output = path.join(root, 'docs', 'architecture');
    await exportArchitecture(root, { format: 'png', output, runLikeC4: runner });
    expect(runner).toHaveBeenCalledWith(['export', 'png', '-o', output, path.join(root, '.xirang', 'architecture')]);
    await expect(fs.stat(output)).resolves.toMatchObject({});
  });

  it('should format query results without rereading the architecture', async () => {
    const read = vi.fn().mockResolvedValue({
      source: 'likec4',
      files: [],
      domains: [{ id: 'core', title: 'Core' }],
      capabilities: [{
        id: 'core.root',
        title: 'Root',
        domain: 'core',
        description: 'Runs root',
        specs: ['.xirang/specs/root/spec.md'],
        capabilityId: 'cap.core.root',
      }],
      relations: [{
        source: 'core.root',
        kind: 'invokes',
        target: 'core',
        description: 'Calls domain',
      }],
    });
    vi.resetModules();
    vi.doMock('../../src/utils/likec4-reader.js', () => ({ readLikeC4Architecture: read }));

    try {
      const query = await import('../../src/commands/arch/query.js');
      const result = await query.queryArchitecture('/project', 'cap.core.root', { relations: true });
      const output = await query.formatArchitectureQueryText('/project', result);

      expect(read).toHaveBeenCalledTimes(1);
      expect(output).toBe(`Element: cap.core.root
Type: capability
Description: Runs root
Specs:
  .xirang/specs/root/spec.md
Relations:
  [depth 1] cap.core.root --invokes--> core - Calls domain
  [depth 1] Element: core`);
    } finally {
      vi.doUnmock('../../src/utils/likec4-reader.js');
      vi.resetModules();
    }
  });

  it('should index relations once while preserving traversal semantics', async () => {
    const capability = (id: string) => ({
      id: `core.${id}`,
      title: id,
      domain: 'core',
      specs: [],
      capabilityId: `cap.core.${id}`,
    });
    const relations = [
      { source: 'core.a', kind: 'invokes', target: 'core.root' },
      { source: 'core.a', kind: 'precedes', target: 'core.b' },
      { source: 'core.a', kind: 'precedes', target: 'core.b' },
      { source: 'core.unrelated', kind: 'invokes', target: 'core.other' },
    ];
    let iterations = 0;
    const observedRelations = new Proxy(relations, {
      get(target, property, receiver) {
        if (property === Symbol.iterator) iterations += 1;
        return Reflect.get(target, property, receiver);
      },
    });
    vi.resetModules();
    vi.doMock('../../src/utils/likec4-reader.js', () => ({
      readLikeC4Architecture: vi.fn().mockResolvedValue({
        source: 'likec4',
        files: [],
        domains: [],
        capabilities: [capability('root'), capability('a'), capability('b'), capability('unrelated'), capability('other')],
        relations: observedRelations,
      }),
    }));

    try {
      const { queryArchitecture: queryWithObservedRelations } = await import('../../src/commands/arch/query.js');
      const result = await queryWithObservedRelations('/project', 'cap.core.root', { relations: true, depth: 2 });

      expect(iterations).toBe(1);
      expect(result.relatedElements).toEqual([
        expect.objectContaining({ element: expect.objectContaining({ id: 'core.a' }), depth: 1 }),
        expect.objectContaining({ element: expect.objectContaining({ id: 'core.b' }), depth: 2 }),
      ]);
      expect(result.relations).toHaveLength(3);
      expect(result.relations?.filter(relation => relation.kind === 'precedes')).toHaveLength(2);
    } finally {
      vi.doUnmock('../../src/utils/likec4-reader.js');
      vi.resetModules();
    }
  });
});
