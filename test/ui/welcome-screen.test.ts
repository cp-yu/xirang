import { describe, expect, it } from 'vitest';
import { getWelcomeText } from '../../src/ui/welcome-screen.js';

describe('welcome screen', () => {
  it('advertises only current CLI and skills-only surfaces', () => {
    const text = getWelcomeText().join('\n');

    expect(text).toContain('Agent Skills');
    expect(text).toContain('opsx view');
    expect(text).not.toContain('/opsx:');
    expect(text).not.toContain('slash commands');
  });
});
