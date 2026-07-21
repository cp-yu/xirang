import { describe, expect, it } from 'vitest';

import {
  ARCHITECTURE_GENERATE_DELTA,
  OPSX_PHILOSOPHY,
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

describe('LikeC4 delta generation fragment', () => {
  it('defers definition-first ordering to the artifact instruction projection', () => {
    expect(ARCHITECTURE_GENERATE_DELTA).toContain('follow the authoring order in the returned `instruction`');
    expect(ARCHITECTURE_GENERATE_DELTA).toContain('`definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs');
    expect(ARCHITECTURE_GENERATE_DELTA).not.toContain('content.includes');
    expect(ARCHITECTURE_GENERATE_DELTA).not.toContain('content.excludes');
  });

  it('separates proposal scope, target behavior, architecture decisions, and evidence', () => {
    for (const token of [
      '`Source Impact`',
      '`Architecture Source` as declared scope',
      '`Behavior Source` to locate related change-local Specs',
      'Spec IDs are not LikeC4 element IDs',
      'completed change-local Specs as target behavior context',
      '`design.md` for architecture decisions',
      'formal LikeC4 model as current architecture state',
      'current code only as implementation evidence',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).toContain(token);
    }
  });

  it('keeps exact target-state LikeC4 elements owned by architecture delta', () => {
    for (const token of [
      'do not invent architecture changes from behavior changes alone',
      'scope declarations, not authoritative LikeC4 records',
      'derive exact target-state elements and typed relations',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).toContain(token);
    }
    expect(ARCHITECTURE_GENERATE_DELTA).not.toContain('extract the capability list');
  });
});

describe('OPSX philosophy fragment', () => {
  it('defines the durable source and scaffolding boundary', () => {
    for (const token of [
      'human-intent programming layer',
      'Specs and LikeC4 jointly form the durable semantic source',
      'observable behavior',
      'project intent, capabilities, ownership, boundaries, and semantic relations',
      'target steady state',
      'compilation scaffolding',
      'not competing sources of truth',
    ]) {
      expect(OPSX_PHILOSOPHY).toContain(token);
    }
  });

  it('defines source completeness and faithful compilation', () => {
    for (const token of [
      'without guessing decisions that affect behavior or architecture',
      'The Agent acts as a compiler',
      'translate declared intent faithfully',
      'Existing code is compiled output and current implementation evidence',
      'MUST NOT silently override the declared semantic source',
    ]) {
      expect(OPSX_PHILOSOPHY).toContain(token);
    }
  });

  it('does not mix operational workflow rules into the philosophy', () => {
    for (const token of [
      'Definition-first authoring',
      'Syntax is contract',
      'Not compiled until gates pass',
      'static analysis',
      'linking and release',
      'decompilation',
    ]) {
      expect(OPSX_PHILOSOPHY).not.toContain(token);
    }
  });
});
