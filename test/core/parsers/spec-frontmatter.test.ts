import { describe, expect, it } from 'vitest';
import { parseSpecFrontmatter } from '../../../src/core/parsers/spec-frontmatter.js';

describe('parseSpecFrontmatter', () => {
  it('parses a singular element from leading frontmatter', () => {
    const content = `---
element: payment.authorize
---
# Payment

## Requirements
`;

    expect(parseSpecFrontmatter(content)).toEqual({ element: 'payment.authorize' });
  });

  it('returns null when frontmatter or a string element is absent', () => {
    expect(parseSpecFrontmatter('# Payment\n\n## Requirements\n')).toEqual({ element: null });
    expect(parseSpecFrontmatter('---\nelement: \n---\n# Payment')).toEqual({ element: null });
    expect(parseSpecFrontmatter('---\nelement: 42\n---\n# Payment')).toEqual({ element: null });
  });

  it('preserves structured issues for malformed YAML and multiple-owner syntax', () => {
    expect(parseSpecFrontmatter('---\nelement: [payment.authorize\n---\n# Payment')).toEqual({
      element: null,
      issues: [expect.objectContaining({ code: 'MALFORMED_FRONTMATTER' })],
    });
    expect(parseSpecFrontmatter('---\nelement: [payment.authorize, payment.refund]\n---\n# Payment')).toEqual({
      element: null,
      issues: [expect.objectContaining({ code: 'MULTIPLE_SPEC_OWNERS' })],
    });
    expect(parseSpecFrontmatter('---\ncapabilities: [cap.payment.authorize]\n---\n# Payment')).toEqual({
      element: null,
      issues: [expect.objectContaining({ code: 'LEGACY_SPEC_OWNERSHIP' })],
    });
  });

  it('only parses the leading frontmatter block', () => {
    const content = `---
element: payment.authorize
---
# Payment

## Requirements

---
element: payment.ignored
---
`;

    expect(parseSpecFrontmatter(content)).toEqual({ element: 'payment.authorize' });
  });

  it('accepts CRLF frontmatter without changing the markdown body', () => {
    const content = '---\r\nelement: payment.authorize\r\n---\r\n# Payment\r\n';
    expect(parseSpecFrontmatter(content)).toEqual({ element: 'payment.authorize' });
    expect(content).toContain('# Payment\r\n');
  });
});
