import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatArchitectureQueryText, queryArchitecture } from '../../src/commands/arch/query.js';
import { validateArchitectureCommand } from '../../src/commands/arch/validate.js';
import { previewArchitecture } from '../../src/commands/arch/preview.js';
import { exportArchitecture } from '../../src/commands/arch/export.js';

const domain = `model { core = domain 'Core' { run = capability 'Run' { description 'Runs work' metadata { capabilityId 'cap.core.run' specs ['openspec/specs/run/spec.md'] } } stop = capability 'Stop' { metadata { capabilityId 'cap.core.stop' } } finish = capability 'Finish' { metadata { capabilityId 'cap.core.finish' } } } core.run -[invokes]-> core.stop { description 'Runs stop' } core.stop -[precedes]-> core.finish }`;

describe('arch commands', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-arch-command-'));
    const architecture = path.join(root, 'openspec', 'architecture');
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'specification.c4'), 'specification { element domain element capability relationship invokes }');
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), domain);
    await fs.writeFile(path.join(architecture, 'views.c4'), 'views { view index { include * } }');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should query element by ID', async () => {
    const result = await queryArchitecture(root, 'cap.core.run');
    expect(result.element).toMatchObject({ id: 'core.run', capabilityId: 'cap.core.run' });
  });

  it('should query element with canonical relation details', async () => {
    const result = await queryArchitecture(root, 'cap.core.run', { relations: true });
    expect(result.relations).toEqual([expect.objectContaining({ source: 'core.run', kind: 'invokes', target: 'core.stop', description: 'Runs stop', depth: 1 })]);
    const output = await formatArchitectureQueryText(root, result);
    expect(output).toContain('Description: Runs work');
    expect(output).toContain('openspec/specs/run/spec.md');
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
    expect(runner).toHaveBeenCalledWith(['validate', path.join(root, 'openspec', 'architecture')]);
    expect(result.success).toBe(true);
  });

  it('should validate an architecture delta with the formal model', async () => {
    const delta = path.join(root, 'architecture-delta.c4');
    await fs.writeFile(delta, `model { extend core { next = capability 'Next' } }`);
    const runner = vi.fn().mockResolvedValue(undefined);
    const result = await validateArchitectureCommand(root, { deltaPath: delta, runLikeC4: runner });
    expect(runner).toHaveBeenCalledWith(['validate', expect.stringContaining('openspec-likec4-delta-')]);
    expect(result.success).toBe(true);
  });

  it('should perform semantic validation', async () => {
    await fs.writeFile(path.join(root, 'openspec', 'architecture', 'domains', 'core.c4'), `model { orphan = capability 'Orphan' }`);
    const result = await validateArchitectureCommand(root, { runLikeC4: vi.fn().mockResolvedValue(undefined) });
    expect(result.success).toBe(false);
  });

  it('should start preview server', async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    await previewArchitecture(root, { port: 8080, runLikeC4: runner });
    expect(runner).toHaveBeenCalledWith(['start', path.join(root, 'openspec', 'architecture'), '--port', '8080']);
  });

  it('should export diagrams', async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    const output = path.join(root, 'docs', 'architecture');
    await exportArchitecture(root, { format: 'png', output, runLikeC4: runner });
    expect(runner).toHaveBeenCalledWith(['export', 'png', '-o', output, path.join(root, 'openspec', 'architecture')]);
    await expect(fs.stat(output)).resolves.toMatchObject({});
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
