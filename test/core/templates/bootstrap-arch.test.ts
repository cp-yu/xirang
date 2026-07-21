import { describe, expect, it } from 'vitest';
import { getBootstrapArchSkillTemplate } from '../../../src/core/templates/workflows/bootstrap-arch.js';

describe('bootstrap architecture template', () => {
  it('generates LikeC4 candidates with nested ownership', () => {
    const template = getBootstrapArchSkillTemplate();
    expect(template.name).toBe('opsx-bootstrap-arch');
    expect(template.instructions).toContain('.opsx/architecture/candidates/');
    expect(template.instructions).toContain('.c4');
    expect(template.instructions).toContain('MUST NOT generate YAML architecture candidates');
    expect(template.instructions).toContain('do not emit a `belongs_to` relationship');
  });
});
