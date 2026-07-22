import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  GENERATED_RELATION_FILES,
  renderBootstrapSchema,
  renderDomainMapTemplate,
  renderOpsxDeltaTemplate,
  renderRelationAuthoringReference,
  renderRelationWorkflowSummary,
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

  it('renders the canonical generic v1 bootstrap artifacts', () => {
    const domainMap = renderDomainMapTemplate();
    const bootstrapSchema = renderBootstrapSchema();
    const summary = renderRelationWorkflowSummary();
    for (const type of RELATION_TYPES) {
      expect(domainMap).toContain(type);
      expect(bootstrapSchema).toContain(type);
    }
    for (const type of ACTIVE_RELATION_TYPES) expect(summary).toContain(type);
    expect(domainMap).toContain('## Elements');
    expect(domainMap).toContain('contractPolicy: required | optional');
    expect(domainMap).toContain('## Parent Links');
    expect(domainMap).toContain('- parent: <stable-parent-id>\n  child: <stable-child-id>');
    expect(domainMap).toContain('spec:\n    folder: <single-path-segment>');
    expect(domainMap).not.toMatch(/## Domain|## Capabilities|cap\.<domain>/);
    expect(domainMap).not.toContain('Code References');
    expect(bootstrapSchema).toContain('- elements: elementId, kind, explicit contractPolicy');
    expect(bootstrapSchema).toContain('- parent_links: exactly one parent link per non-root element');
    expect(bootstrapSchema).toContain('arbitrary-depth element tree');
    expect(bootstrapSchema).toContain('Singular element-owned target-state requirements and scenarios.');
    expect(bootstrapSchema).not.toMatch(/code-map|merge the reviewed delta|OPSX v2 two-file bundle|per-capability Specs/i);
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
