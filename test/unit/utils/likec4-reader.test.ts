import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readLikeC4Architecture } from '../../../src/utils/likec4-reader.js';
import { parseOpsxProfile } from '../../../src/utils/likec4-parser.js';
import { readArchitecture } from '../../../src/utils/architecture-reader.js';

const domain = `model {
  core = domain 'Core' {
    description 'Core domain'
    run = capability 'Run' {
      description 'Run things'
      metadata {
        capabilityId 'cap.core.run'
        specs ['.opsx/specs/run/spec.md']
      }
    }
    stop = capability 'Stop' {
      metadata { capabilityId 'cap.core.stop' }
    }
  }
  core.run -[invokes]-> core.stop {
    description 'Runs stop'
  }
}`;

const semanticModel = `opsx {
  languageVersion '1'
}
specification {
  element project { opsx { root true contract required } }
  element product { opsx { contract optional } }
  element workflow { opsx { contract required parents [product] } }
  relationship invokes
  relationship produces { opsx { sourceKinds [workflow] targetKinds [product] } }
}
model {
  projectRoot = project 'Root' 'Project intent' {
    metadata { elementId 'project.root' }
    product = product 'Product' 'Product intent' {
      metadata { elementId 'product.main' }
      flow = workflow 'Flow' 'Workflow intent' {
        metadata { elementId 'workflow.main' }
      }
    }
  }
}`;

describe('LikeC4 architecture reader', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-likec4-reader-'));
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.mkdir(path.join(architecture, 'domains'), { recursive: true });
    await fs.writeFile(path.join(architecture, 'specification.c4'), 'specification { element domain element capability relationship invokes }');
    await fs.writeFile(path.join(architecture, 'domains', 'core.c4'), domain);
    await fs.writeFile(path.join(architecture, 'views.c4'), 'views { view index { include * } }');
  });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should read multi-file LikeC4 model', async () => {
    const result = await readLikeC4Architecture(root);
    expect(result.source).toBe('likec4');
    expect(result.files).toHaveLength(3);
  });

  it('should parse element definitions', async () => {
    const result = await readLikeC4Architecture(root);
    expect(result.domains[0]).toMatchObject({ id: 'core', title: 'Core' });
    expect(result.capabilities[0]).toMatchObject({ id: 'core.run', capabilityId: 'cap.core.run', specs: ['.opsx/specs/run/spec.md'] });
  });

  it('should parse relationships from domain and standalone relation files', async () => {
    await fs.writeFile(path.join(root, '.opsx', 'architecture', 'relations.c4'), `model { core.stop -[invokes]-> core.run }`);
    const result = await readLikeC4Architecture(root);
    expect(result.files).toHaveLength(4);
    expect(result.relations).toEqual(expect.arrayContaining([
      { source: 'core.run', target: 'core.stop', kind: 'invokes', description: 'Runs stop' },
      { source: 'core.stop', target: 'core.run', kind: 'invokes' },
    ]));
  });

  it('rejects active architecture navigation when LikeC4 is absent', async () => {
    await fs.rm(path.join(root, '.opsx', 'architecture'), { recursive: true });
    await fs.writeFile(path.join(root, '.opsx', 'project.opsx.yaml'), `schema_version: 2\nproject: { id: test, name: Test }\ndomains: [{ id: dom.core, type: domain }]\ncapabilities: [{ id: cap.core.run, type: capability }]\n`);
    await fs.writeFile(path.join(root, '.opsx', 'project.opsx.relations.yaml'), `schema_version: 2\nrelations: [{ from: cap.core.run, type: belongs_to, to: dom.core }]\n`);
    await expect(readArchitecture(root)).rejects.toThrow(/opsx migrate opsx-to-likec4|semantic migration/);
  });

  it('reads a versioned arbitrary-depth semantic model through generic elements', async () => {
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(path.join(architecture, 'model.c4'), semanticModel);

    const result = await readLikeC4Architecture(root);

    expect(result.profile).toBe('v1');
    expect(result.languageVersion).toBe('1');
    expect(result.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'project.root', fqn: 'projectRoot', kind: 'project', parent: null, children: ['product.main'] }),
      expect.objectContaining({ id: 'product.main', fqn: 'projectRoot.product', kind: 'product', parent: 'project.root', children: ['workflow.main'] }),
      expect.objectContaining({ id: 'workflow.main', fqn: 'projectRoot.product.flow', kind: 'workflow', parent: 'product.main', summary: 'Workflow intent' }),
    ]));
    expect(result.metamodel.elements.workflow).toEqual(expect.objectContaining({ contractPolicy: 'required', parents: ['product'] }));
    expect(result.metamodel.relationships.produces).toEqual({ sourceKinds: ['workflow'], targetKinds: ['product'] });
  });

  it('does not synthesize an optional policy when a parser input omits the declaration', () => {
    const versioned = parseOpsxProfile("opsx { languageVersion '1' } specification { element worker }");
    const legacy = parseOpsxProfile('specification { element worker }');

    expect(versioned.declaredElementContractPolicies.worker).toBeNull();
    expect(versioned.metamodel.elements.worker).not.toHaveProperty('contractPolicy');
    expect(legacy.languageVersion).toBeNull();
    expect(legacy.metamodel.elements).toHaveProperty('worker');
  });

  it('rejects a v1 element kind without an explicit contract policy', async () => {
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    await fs.writeFile(
      path.join(architecture, 'model.c4'),
      semanticModel.replace('element product { opsx { contract optional } }', 'element product')
    );

    await expect(readLikeC4Architecture(root)).rejects.toThrow(/product.*contract policy/i);
  });

  it('keeps stable element identity when the containment path changes', async () => {
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.rm(architecture, { recursive: true });
    await fs.mkdir(architecture, { recursive: true });
    const modelPath = path.join(architecture, 'model.c4');
    await fs.writeFile(modelPath, semanticModel);
    const before = await readLikeC4Architecture(root);

    await fs.writeFile(modelPath, semanticModel.replace('product = product', 'container = product'));
    const after = await readLikeC4Architecture(root);

    expect(before.elements.find(element => element.id === 'workflow.main')?.fqn).toBe('projectRoot.product.flow');
    expect(after.elements.find(element => element.id === 'workflow.main')).toMatchObject({
      id: 'workflow.main',
      fqn: 'projectRoot.container.flow',
      parent: 'product.main',
    });
  });

  it('keeps unversioned LikeC4 sources on the legacy read path without rewriting them', async () => {
    const sourcePath = path.join(root, '.opsx', 'architecture', 'domains', 'core.c4');
    const before = await fs.readFile(sourcePath, 'utf8');
    const result = await readLikeC4Architecture(root);
    expect(result.profile).toBe('legacy');
    expect(result.elements).toEqual([]);
    expect(result.capabilities[0]).toMatchObject({ capabilityId: 'cap.core.run' });
    expect(await fs.readFile(sourcePath, 'utf8')).toBe(before);
  });

  it('rejects unsupported OPSX language versions', async () => {
    const architecture = path.join(root, '.opsx', 'architecture');
    await fs.writeFile(path.join(architecture, 'version.c4'), "opsx { languageVersion '2' }");
    await expect(readLikeC4Architecture(root)).rejects.toThrow('Unsupported OPSX language version: 2');
  });
});
