import { describe, expect, it } from 'vitest';
import { getBootstrapArchSkillTemplate } from '../../../src/core/templates/workflows/bootstrap-arch.js';

describe('bootstrap architecture template', () => {
  it('describes the canonical v1 candidate and promotion contract', () => {
    const template = getBootstrapArchSkillTemplate();
    expect(template.name).toBe('opsx-bootstrap-arch');
    expect(template.instructions).toContain('.opsx/bootstrap/candidate/architecture/**/*.c4');
    expect(template.instructions).toContain('.opsx/bootstrap/candidate/specs/<spec-id>/spec.md');
    expect(template.instructions).toContain("opsx { languageVersion '1' }");
    expect(template.instructions).toContain('arbitrary-depth refinement');
    expect(template.instructions).toContain('singular `element: <stable-id>`');
    expect(template.instructions).toContain('MUST NOT generate YAML architecture candidates');
    expect(template.instructions).toContain('MUST NOT emit `belongs_to`, `refines`, or `abstracts` relationships');
    expect(template.instructions).toContain('.opsx/architecture/');
    expect(template.instructions).not.toContain('.opsx/architecture/candidates/');
    expect(template.instructions).not.toContain('capabilityId');
    expect(template.instructions).not.toContain('metadata.specs');
  });
});
