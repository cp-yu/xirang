import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  GENERATED_RELATION_FILES,
  renderOpsxDeltaTemplate,
  renderRelationAuthoringReference,
} from '../../../src/core/relations/renderers.js';
import { ACTIVE_RELATION_TYPES } from '../../../src/core/relations/active-registry.js';
import { RELATION_TYPES } from '../../../src/core/relations/registry.js';
import { OpsxDeltaSchema } from '../../../src/utils/opsx-utils.js';

const projectRoot = path.resolve(import.meta.dirname, '..', '..', '..');

describe('relation renderers', () => {
  it('renders a parseable strict real-delta template with canonical relations', () => {
    const rendered = renderOpsxDeltaTemplate();
    const parsed = parseYaml(rendered);
    expect(OpsxDeltaSchema.safeParse(parsed).success).toBe(true);
    expect(parsed).toMatchObject({ schema_version: 2 });
    expect(rendered).toContain('Canonical no-op');
    expect(rendered).toContain('ADDED: {}');
    expect(rendered).toContain('relations: []');
    expect(rendered).toContain('不要求所有 section 同时存在');
    expect(parsed.ADDED.capabilities.length).toBeGreaterThan(0);
    expect(parsed.ADDED.relations.length).toBeGreaterThan(0);
    expect(parsed.MODIFIED.capabilities.length).toBeGreaterThan(0);
    expect(parsed.REMOVED.capabilities.length).toBeGreaterThan(0);
    for (const type of RELATION_TYPES) expect(rendered).toContain(type);
  });

  it('renders the complete canonical reference', () => {
    const reference = renderRelationAuthoringReference();
    expect(reference).toContain('## 选择规则');
    expect(reference).toContain('## Note policy');
    for (const type of ACTIVE_RELATION_TYPES) expect(reference).toContain(`## ${type}`);
    expect(reference).toContain('produces');
    expect(reference).not.toContain('belongs_to');
    expect(reference).not.toContain('refines');
    expect(reference).not.toContain('abstracts');
    expect(reference).toMatch(/Endpoints: (generic|element)(?: \| (generic|element))* → (generic|element)(?: \| (generic|element))*/g);
  });

  it.each(GENERATED_RELATION_FILES)('keeps $path byte-identical to its renderer', async ({ path: relativePath, render }) => {
    const tracked = await readFile(path.join(projectRoot, relativePath), 'utf8');
    expect(tracked).toBe(render());
  });
});
