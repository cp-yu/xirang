import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateLikeC4Files, renderLikeC4Files } from '../../../src/migration/generators/likec4-file-generator.js';
import type { LikeC4Model } from '../../../src/migration/converters/types.js';

const model: LikeC4Model = {
  project: { id: 'test', name: 'Test', intent: 'Test project intent' },
  domains: [{
    id: 'dom.a', elementId: 'a', title: 'A', description: "A's domain",
    metadata: { boundary: 'Boundary', status: 'active' },
    capabilities: [{
      id: 'cap.a.feature', elementId: 'feature', qualifiedId: 'a.feature', title: 'Feature',
      description: 'Feature intent', metadata: { capabilityId: 'cap.a.feature', status: 'active' },
    }],
  }, {
    id: 'dom.b', elementId: 'b', title: 'B', metadata: {},
    capabilities: [{
      id: 'cap.b.other', elementId: 'other', qualifiedId: 'b.other', title: 'Other',
      metadata: { capabilityId: 'cap.b.other' },
    }],
  }],
  relations: [{ source: 'a.feature', target: 'b.other', kind: 'invokes', description: 'Calls other' }],
};

describe('LikeC4 file generator', () => {
  let root: string;

  beforeEach(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'opsx-likec4-generator-')); });
  afterEach(async () => fs.rm(root, { recursive: true, force: true }));

  it('should generate valid specification and project metadata', async () => {
    const files = await generateLikeC4Files(root, model);
    const content = await fs.readFile(files.specification, 'utf8');
    expect(content).toContain('element project');
    expect(content).toContain('element domain');
    expect(content).toContain('relationship validates');
    await expect(fs.readFile(files.project, 'utf8')).resolves.toContain("description 'Test project intent'");
  });

  it('should use kebab-case domain filenames with snake_case element IDs', () => {
    const rendered = renderLikeC4Files({
      ...model,
      domains: [{ ...model.domains[0], elementId: 'ai_integration' }],
    });
    expect(rendered).toEqual(expect.arrayContaining([
      expect.objectContaining({ relativePath: path.join('domains', 'ai-integration.c4'), content: expect.stringContaining("ai_integration = domain") }),
    ]));
  });

  it('should generate domain file with proper nesting', async () => {
    const files = await generateLikeC4Files(root, model);
    expect(files.domains).toHaveLength(2);
    const content = await fs.readFile(files.domains[0], 'utf8');
    expect(content).toContain("a = domain 'A'");
    expect(content).toContain("feature = capability 'Feature'");
    expect(content).not.toContain("a.feature -[invokes]-> b.other");
  });

  it('should generate relations in a standalone model file', async () => {
    const files = await generateLikeC4Files(root, model);
    const content = await fs.readFile(files.relations, 'utf8');
    expect(content).toContain("a.feature -[invokes]-> b.other");
  });

  it('should generate views with index view', async () => {
    const files = await generateLikeC4Files(root, model);
    const content = await fs.readFile(files.views, 'utf8');
    expect(content).toContain('view index');
    expect(content).toContain('autoLayout TopBottom');
  });

  it('should use path.join for all paths', async () => {
    const files = await generateLikeC4Files(root, model);
    const architecture = path.join(root, '.opsx', 'architecture');
    expect(files.specification).toBe(path.join(architecture, 'specification.c4'));
    expect(files.views).toBe(path.join(architecture, 'views.c4'));
    expect(files.project).toBe(path.join(architecture, 'project.c4'));
    expect(files.relations).toBe(path.join(architecture, 'relations.c4'));
    expect(files.domains).toEqual([
      path.join(architecture, 'domains', 'a.c4'),
      path.join(architecture, 'domains', 'b.c4'),
    ]);
  });
});
