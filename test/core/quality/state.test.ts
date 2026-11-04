import { describe, expect, it } from 'vitest';
import { formatQualityGateFailure } from '../../../src/core/quality/state.js';

describe('quality gate diagnostics', () => {
  it('preserves the shared sync failure guidance and includes diagnostics', () => {
    const message = formatQualityGateFailure(
      { changedFiles: ['src/app.ts'], details: ['CODE_CHANGED_AFTER_PLAN'] },
      undefined,
      { changeName: 'c1', command: 'sync' }
    );

    expect(message).toContain('Quality gate failed: CODE_CHANGED_AFTER_PLAN');
    expect(message).toContain('  - src/app.ts');
    expect(message).toContain('xirang quality status "c1" --json');
    expect(message).toContain('Retry xirang sync "c1" after the Seal commit exists.');
    expect(message).not.toContain('--no-verify');
  });

  it('includes archive compatibility diagnostics without inventing v1 commands', () => {
    const message = formatQualityGateFailure(
      { changedFiles: [], details: ['QUALITY_RECORD_UNSUPPORTED_OR_INVALID'] },
      { compatible: false, blockReason: 'QUALITY_RECORD_UNSUPPORTED_OR_INVALID' },
      { changeName: 'c1', command: 'archive' }
    );

    expect(message).toContain('Seal diagnostic: QUALITY_RECORD_UNSUPPORTED_OR_INVALID');
    expect(message).toContain('QUALITY_RECORD_UNSUPPORTED_OR_INVALID');
    expect(message).toContain('Retry xirang archive "c1" after the Seal commit exists.');
    expect(message).not.toContain('xirang quality review');
  });
});
