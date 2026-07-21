import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stringify as stringifyYaml } from 'yaml';
import { convertOpsxToLikeC4 } from '../../../src/migration/converters/opsx-to-likec4.js';

const project = {
  schema_version: 2,
  project: { id: 'test', name: 'Test', intent: 'Project intent' },
  domains: [
    { id: 'dom.a', type: 'domain', intent: 'Domain A', boundary: 'A boundary', status: 'active' },
    { id: 'dom.b', type: 'domain', intent: 'Domain B', status: 'active' },
  ],
  capabilities: [
    { id: 'cap.a.feature-one', type: 'capability', intent: 'Feature one', status: 'active' },
    { id: 'cap.b.feature-two', type: 'capability', intent: 'Feature two', status: 'active' },
  ],
};

const relations = {
  schema_version: 2,
  relations: [
    { from: 'cap.a.feature-one', type: 'belongs_to', to: 'dom.a' },
    { from: 'cap.b.feature-two', type: 'belongs_to', to: 'dom.b' },
    { from: 'cap.a.feature-one', type: 'invokes', to: 'cap.b.feature-two', note: 'Calls feature two' },
  ],
};

describe('OPSX to LikeC4 converter', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-likec4-converter-'));
    const opsx = path.join(root, '.opsx');
    await fs.mkdir(opsx, { recursive: true });
    await fs.writeFile(path.join(opsx, 'project.opsx.yaml'), stringifyYaml(project));
    await fs.writeFile(path.join(opsx, 'project.opsx.relations.yaml'), stringifyYaml(relations));
  });

  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should read complete OPSX model', async () => {
    const result = await convertOpsxToLikeC4(root);
    expect(result.project).toMatchObject({ id: 'test', intent: 'Project intent' });
    expect(result.domains).toHaveLength(2);
    expect(result.relations).toHaveLength(1);
  });

  it('should convert domain with intent and boundary', async () => {
    const result = await convertOpsxToLikeC4(root);
    expect(result.domains[0]).toMatchObject({
      id: 'dom.a', elementId: 'a', description: 'Domain A',
      metadata: { boundary: 'A boundary', status: 'active' },
    });
  });

  it('should nest capabilities in domain', async () => {
    const result = await convertOpsxToLikeC4(root);
    expect(result.domains[0].capabilities).toEqual([
      expect.objectContaining({ id: 'cap.a.feature-one', elementId: 'feature_one', qualifiedId: 'a.feature_one' }),
    ]);
  });

  it('should skip belongs_to relation', async () => {
    const result = await convertOpsxToLikeC4(root);
    expect(result.relations).toHaveLength(1);
    expect(result.relations.some(relation => relation.kind === 'belongs_to')).toBe(false);
  });

  it('should convert invokes relation', async () => {
    const result = await convertOpsxToLikeC4(root);
    expect(result.relations[0]).toMatchObject({ kind: 'invokes', description: 'Calls feature two' });
  });

  it('should use qualified names for cross-domain relations', async () => {
    const result = await convertOpsxToLikeC4(root);
    expect(result.relations[0]).toMatchObject({ source: 'a.feature_one', target: 'b.feature_two' });
  });
});
