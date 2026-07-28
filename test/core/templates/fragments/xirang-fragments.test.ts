import { describe, expect, it } from 'vitest';

import {
  ARCHITECTURE_GENERATE_DELTA,
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
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

describe('Semantic Delta authoring fragment', () => {
  it('defers definition-first ordering to the artifact instruction projection', () => {
    expect(ARCHITECTURE_GENERATE_DELTA).toContain('follow the authoring order in the returned `instruction`');
    expect(ARCHITECTURE_GENERATE_DELTA).toContain('`definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs');
    expect(ARCHITECTURE_GENERATE_DELTA).not.toContain('content.includes');
    expect(ARCHITECTURE_GENERATE_DELTA).not.toContain('content.excludes');
  });

  it('separates proposal scope, architecture decisions, and evidence', () => {
    for (const token of [
      '`Source Impact`',
      'Semantic Delta',
      'affected elements, refinement, Element Contracts, and relationships',
      '`design.md` for architecture decisions',
      'formal Xirang Semantic Model as current semantic state',
      'current code only as implementation evidence',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).toContain(token);
    }
  });

  it('writes four-partition Delta units with per-entry complete target state', () => {
    for (const token of [
      '.xirang/changes/<name>/{metamodel,elements,relationships,views}/',
      '`operation`',
      '`REMOVED` carries identity only',
      'frontmatter is the Element Declaration Entry',
      '## MODIFIED Requirements',
      'the frontmatter declares no `operation` and only locates the host Element',
      '`{operation, source, kind, target}`',
      'no `MODIFIED` and no description',
      'Reference every semantic object by `identity`',
      'do not invent Declaration, Relationship, Kind, or View changes from Contract changes alone',
      'scope declarations, not authoritative Semantic Delta records',
      'xirang arch validate --change "<name>" --json',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).toContain(token);
    }
  });

  it('carries no retired delta carrier, path reference, or ownership notation', () => {
    for (const token of [
      'architecture-delta',
      'likec4-authoring',
      'arch validate --delta',
      'elementId',
      '-[invokes]->',
      'extract the capability list',
    ]) {
      expect(ARCHITECTURE_GENERATE_DELTA).not.toContain(token);
    }
  });
});

describe('Element Definition semantics fragment', () => {
  it('defines concept identity, independent modeling reason, scope, hierarchy, and Contract boundaries', () => {
    for (const token of [
      '是什么',
      '为何作为独立 Element 建模',
      '包含什么、不包含什么',
      'parent、children 与 siblings',
      '不得只是 title 的改写',
      '职责、保证、约束、行为、Requirement、Scenario',
      'proposal.md',
      'design.md',
    ]) {
      expect(ELEMENT_DEFINITION_SEMANTICS).toContain(token);
    }
  });
});

describe('Element Contract semantics fragment', () => {
  it('defines the shared Contract, Requirement, and Scenario boundaries', () => {
    for (const token of [
      '在自身抽象层级',
      '独立新增、修改或移除',
      '不得按句子、分句、`SHALL` 数量或目标条数机械拆分',
      'Scenario',
      '只具体化宿主 Requirement',
      '不默认穷尽',
      '不作为独立 Semantic Delta Entry',
    ]) {
      expect(ELEMENT_CONTRACT_SEMANTICS).toContain(token);
    }
  });

  it('stays separate from storage notation', () => {
    expect(ELEMENT_CONTRACT_SEMANTICS).not.toContain('frontmatter fields');
    expect(ELEMENT_CONTRACT_SEMANTICS).not.toContain('Default file naming');
  });
});

describe('Xirang philosophy fragment', () => {
  it('is exactly the five canonical Semantic Model definitions', () => {
    expect(XIRANG_PHILOSOPHY).toBe(`**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions \`metamodel/\`, \`elements/\`, \`relationships/\`, and \`views/\`; a Semantic Delta uses the same four partitions and adds \`operation\`.
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
  it('defines canonical model loading, identity, contract, and degradation rules', () => {
    for (const token of [
      'Project Root',
      '.xirang/model/{metamodel,elements,relationships,views}/',
      'Use `identity` as the only way to reference a semantic object',
      'parent',
      'children',
      'refinement',
      'one Element has at most one Contract',
      '`contract` field of its Element Kind',
      'semantic relationships',
      'xirang arch query <identity> --relations --depth <n> --json',
      '--contract',
      'elements/<identity>.md',
      'metamodel/<kind identity>.md',
      'views/<view identity>.md',
      'relationships/<relationship kind identity>.yaml',
      'grouped by Relationship Kind',
      'every entry declares its own `entity` and `identity`',
      'current implementation evidence',
      'Semantic Model unavailable',
      'read-only',
      'MUST stop',
    ]) {
      expect(XIRANG_SHARED_CONTEXT).toContain(token);
    }
  });

  it('does not prescribe legacy identity, bindings, hierarchy, or storage layout', () => {
    for (const token of [
      'capabilityId',
      'elementId',
      'metadata.specs',
      'capabilities: []',
      'domain_name.capability_name',
      'Xirang YAML',
      'opsx-delta',
      'ownership by nesting',
      '.xirang/architecture/',
      '.xirang/specs',
      'list --specs',
      'Element Contract registry',
    ]) {
      expect(XIRANG_SHARED_CONTEXT).not.toContain(token);
    }
  });
});
