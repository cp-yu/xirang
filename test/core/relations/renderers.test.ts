import { describe, expect, it } from 'vitest';
import { renderRelationAuthoringReference } from '../../../src/core/relations/renderers.js';
import { ACTIVE_RELATION_TYPES } from '../../../src/core/relations/active-registry.js';

describe('relation renderers', () => {
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
});
