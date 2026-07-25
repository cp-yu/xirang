import { describe, it, expect } from 'vitest';
import {
  renderWorkflowInvocation,
  transformToHyphenCommands,
  transformWorkflowReferences,
} from '../../src/utils/command-references.js';

describe('transformToHyphenCommands (opencode command surface)', () => {
  describe('basic transformations', () => {
    it('should transform single command reference to opencode command syntax', () => {
      expect(transformToHyphenCommands('/xirang:apply')).toBe('/xirang-apply');
    });

    it('should transform multiple command references', () => {
      const input = '/xirang:propose and /xirang:apply';
      const expected = '/xirang-propose and /xirang-apply';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should transform command reference in context', () => {
      const input = 'Use /xirang:apply to implement tasks';
      const expected = 'Use /xirang-apply to implement tasks';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should handle backtick-quoted commands', () => {
      const input = 'Run `/xirang:explore` to proceed';
      const expected = 'Run `/xirang-explore` to proceed';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should return unchanged text with no command references', () => {
      const input = 'This is plain text without commands';
      expect(transformToHyphenCommands(input)).toBe(input);
    });

    it('should return empty string unchanged', () => {
      expect(transformToHyphenCommands('')).toBe('');
    });

    it('should not transform similar but non-matching patterns', () => {
      const input = '/ops:new xirang: /other:command';
      expect(transformToHyphenCommands(input)).toBe(input);
    });
  });
});

describe('renderWorkflowInvocation', () => {
  it('renders precise codex skill names from the manifest', () => {
    expect(renderWorkflowInvocation('codex', 'propose')).toBe('$xirang-propose');
    expect(renderWorkflowInvocation('codex', 'explore')).toBe('$xirang-explore');
    expect(renderWorkflowInvocation('codex', 'apply')).toBe('$xirang-apply-change');
    expect(renderWorkflowInvocation('codex', 'archive')).toBe('$xirang-archive-change');
  });

  it('renders precise tool invocations from the manifest', () => {
    expect(renderWorkflowInvocation('claude', 'apply')).toBe('/xirang-apply-change');
    expect(renderWorkflowInvocation('pi', 'apply')).toBe('/skill:xirang-apply-change');
    expect(renderWorkflowInvocation('opencode', 'apply')).toBe('/xirang-apply');
  });

  it('uses neutral skill invocation for tools without precise metadata', () => {
    expect(renderWorkflowInvocation('cursor', 'explore')).toBe('invoke the xirang-explore skill');
  });

  it('SHALL NOT fall back to command syntax for tools without precise metadata', () => {
    expect(renderWorkflowInvocation('cursor', 'apply')).not.toContain('/xirang:');
    expect(renderWorkflowInvocation('cursor', 'apply')).not.toContain('/opsx-');
  });
});

describe('transformWorkflowReferences', () => {
  it('rewrites only registered workflow references for codex', () => {
    const input = 'Use /xirang:propose, /xirang:explore, and /xirang:apply. Leave /xirang:unknown alone.';
    expect(transformWorkflowReferences(input, 'codex')).toBe(
      'Use $xirang-propose, $xirang-explore, and $xirang-apply-change. Leave /xirang:unknown alone.'
    );
  });

  it('rewrites registered workflow references to precise invocation for claude', () => {
    const input = 'Use /xirang:propose, /xirang:explore, and /xirang:apply.';
    expect(transformWorkflowReferences(input, 'claude')).toBe(
      'Use /xirang-propose, /xirang-explore, and /xirang-apply-change.'
    );
  });

  it('rewrites registered workflow references to precise invocation for pi', () => {
    const input = 'Use /xirang:apply and /xirang:archive.';
    expect(transformWorkflowReferences(input, 'pi')).toBe(
      'Use /skill:xirang-apply-change and /skill:xirang-archive-change.'
    );
  });

  it('rewrites registered workflow references to opencode command syntax', () => {
    const input = 'Use /xirang:apply and /xirang:archive.';
    expect(transformWorkflowReferences(input, 'opencode')).toBe(
      'Use /xirang-apply and /xirang-archive.'
    );
  });

  it('rewrites registered workflow references to neutral skill invocation for unknown tools', () => {
    const input = 'Use /xirang:propose, /xirang:explore, and /xirang:apply. Leave /xirang:unknown alone.';
    expect(transformWorkflowReferences(input, 'cursor')).toBe(
      'Use invoke the xirang-propose skill, invoke the xirang-explore skill, and invoke the xirang-apply-change skill. Leave /xirang:unknown alone.'
    );
  });
});
