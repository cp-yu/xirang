import { describe, expect, it } from 'vitest';

import {
  OPSX_COMPILATION_PHILOSOPHY,
  VERIFY_CLI_JSON_SCHEMA_REFERENCE,
  VERIFY_ERROR_RECOVERY_GUIDE,
  VERIFY_SIMPLE_CHANGE_FAST_PATH,
  VERIFY_STATE_MACHINE_DIAGRAM,
} from '../../../../src/core/templates/fragments/opsx-fragments.js';

describe('verify gate shared fragments', () => {
  it('exports non-empty strings', () => {
    for (const fragment of [
      VERIFY_STATE_MACHINE_DIAGRAM,
      VERIFY_CLI_JSON_SCHEMA_REFERENCE,
      VERIFY_ERROR_RECOVERY_GUIDE,
      VERIFY_SIMPLE_CHANGE_FAST_PATH,
    ]) {
      expect(fragment).toBeTypeOf('string');
      expect(fragment.length).toBeGreaterThan(0);
    }
  });

  it('covers every verify CLI call input shape', () => {
    for (const token of [
      'Phase 1',
      'OPTIMIZATION_PROPOSED',
      'envelope',
      'begin-implementation',
      'findingId',
      'SKIPPED',
      '"result":"PASS"',
    ]) {
      expect(VERIFY_CLI_JSON_SCHEMA_REFERENCE).toContain(token);
    }
  });

  it('covers all terminal and archive gate states', () => {
    for (const token of [
      'SKIPPED',
      'NOT_NEEDED',
      'IMPROVED',
      'DEGRADED',
      'PENDING_VERIFICATION',
      'ABORTED_UNSAFE',
      'Archive accepts',
      'Archive rejects',
    ]) {
      expect(VERIFY_STATE_MACHINE_DIAGRAM).toContain(token);
    }
  });
});

describe('OPSX compilation philosophy fragment', () => {
  it('distinguishes durable source, scaffolding, and reconciliation', () => {
    for (const token of [
      'compilation pipeline',
      'Specs + OPSX',
      'durable semantic source',
      'compilation scaffolding',
      'change-local specs',
      'opsx-delta',
      'target steady state',
      'the agent is the compiler',
      'static analysis',
      'semantic-check pass',
      'optimization pass',
      'linking and release',
      'symbol table and module graph',
      'decompilation',
    ]) {
      expect(OPSX_COMPILATION_PHILOSOPHY).toContain(token);
    }
    expect(OPSX_COMPILATION_PHILOSOPHY).toContain('MUST NOT override Specs or OPSX');
  });

  it('states all six derived rules and the iteration clause', () => {
    for (const token of [
      'MUST be elegant',
      'state each fact exactly once',
      'key undefined decisions',
      'Never guess silently',
      'MUST NOT invent instructions',
      'return to the relevant Specs or OPSX',
      'Syntax is contract',
      'No dead-code output',
      'Not compiled until gates pass',
      'iterates freely',
    ]) {
      expect(OPSX_COMPILATION_PHILOSOPHY).toContain(token);
    }
  });
});
