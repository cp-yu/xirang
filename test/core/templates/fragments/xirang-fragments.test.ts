import { describe, expect, it } from 'vitest';

import {
  ARCHITECTURE_GENERATE_DELTA,
  XIRANG_SHARED_CONTEXT,
  XIRANG_PHILOSOPHY,
  VERIFY_CLI_JSON_SCHEMA_REFERENCE,
  VERIFY_ERROR_RECOVERY_GUIDE,
  VERIFY_SIMPLE_CHANGE_FAST_PATH,
  VERIFY_STATE_MACHINE_DIAGRAM,
} from '../../../../src/core/templates/fragments/xirang-fragments.js';

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

  it('separates proposal scope, contracts, architecture decisions, and evidence', () => {
    for (const token of [
      '`Source Impact`',
      'Semantic Delta',
      'affected elements, refinement, Element Contracts, and relationships',
      'completed change-local Element Contracts',
      '`design.md` for architecture decisions',
      'formal Xirang Semantic Model as current semantic state',
      'current code only as implementation evidence',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).toContain(token);
    }
  });

  it('keeps exact target-state LikeC4 elements owned by architecture delta', () => {
    for (const token of [
      'do not invent graph changes from contract changes alone',
      'scope declarations, not authoritative LikeC4 records',
      'derive exact target-state elements, refinement, contract bindings, and typed relationships',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).toContain(token);
    }
    expect(ARCHITECTURE_GENERATE_DELTA).not.toContain('extract the capability list');
  });
});

describe('Xirang philosophy fragment', () => {
  it('is exactly the five canonical Semantic Model definitions', () => {
    expect(XIRANG_PHILOSOPHY).toBe(`**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model consists of LikeC4 graph modules and element-owned Markdown contract modules; they are source modules of the same model, not two parallel sources.
3. A change reconciles a Semantic Delta toward the target steady state. \`proposal.md\`, \`design.md\`, and \`tasks.md\` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.`);
  });

  it('does not mix excluded definitions or operational rules into the philosophy', () => {
    for (const token of [
      'Definition-first authoring',
      'Syntax is contract',
      'Not compiled until gates pass',
      'static analysis',
      'linking and release',
      'decompilation',
      'durable semantic source',
      'Behavior Source',
      'Architecture Source',
      'compiler process',
      'persistent IR',
    ]) {
      expect(XIRANG_PHILOSOPHY).not.toContain(token);
    }
  });
});

describe('Xirang shared context fragment', () => {
  it('defines canonical model loading, identity, registry, and degradation rules', () => {
    for (const token of [
      'Project Root',
      'stable `elementId`',
      'FQN',
      'parent',
      'children',
      'refinement',
      'Element Contract registry',
      'semantic relationships',
      'xirang arch query <elementId> --relations --depth <n> --json',
      'current implementation evidence',
      'Semantic Model unavailable',
      'read-only',
      'MUST stop',
    ]) {
      expect(XIRANG_SHARED_CONTEXT).toContain(token);
    }
  });

  it('does not prescribe legacy identity, bindings, hierarchy, or graph formats', () => {
    for (const token of [
      'capabilityId',
      'metadata.specs',
      'capabilities: []',
      'domain_name.capability_name',
      'Xirang YAML',
      'opsx-delta',
      'ownership by nesting',
    ]) {
      expect(XIRANG_SHARED_CONTEXT).not.toContain(token);
    }
  });
});
