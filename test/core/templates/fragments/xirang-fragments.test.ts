import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  getApplyChangeSkillTemplate,
  getArchiveChangeSkillTemplate,
  getBuildSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getSnackSkillTemplate,
  getXirangProposeSkillTemplate,
} from '../../../../src/core/templates/skill-templates.js';
import { INTERNAL_SUBAGENT_TEMPLATES } from '../../../../src/core/shared/subagent-generation.js';
import {
  ARCHITECTURE_GENERATE_DELTA,
  ELEMENT_CONTRACT_SEMANTICS,
  ELEMENT_DEFINITION_SEMANTICS,
  TEST_QUALITY_GUIDANCE,
  XIRANG_SHARED_CONTEXT,
  XIRANG_PHILOSOPHY,
  QUALITY_CHECKPOINT_STATE_MACHINE,
  QUALITY_CLI_JSON_SCHEMA_REFERENCE,
  QUALITY_ERROR_RECOVERY_GUIDE,
  QUALITY_SIMPLE_CHANGE_FAST_PATH,
  QUALITY_STATE_MACHINE_DIAGRAM,
} from '../../../../src/core/templates/fragments/xirang-fragments.js';
import {
  DIRECTION_LEVEL_VALUES,
  DIRECTION_STATUS_VALUES,
  STOP_REASON_VALUES,
} from '../../../../src/core/quality/validators.js';

const RETIRED_QUALITY_TOKENS = [
  'xirang verify',
  'verify phase1',
  'verify phase2',
  '--type=',
  'PENDING_VERIFICATION',
  'NO_OPTIMIZATION_NEEDED',
  'affectedFileHashes',
  'optRetries',
  'failedDirections',
  'masterChallenge',
];

describe('current CLI documentation', () => {
  it('documents the implemented validate JSON envelope', () => {
    const cli = readFileSync(path.join(process.cwd(), 'docs', 'cli.md'), 'utf8');
    const json = cli.match(/\*\*Output \(JSON\):\*\*\n\n```json\n([\s\S]*?)\n```/)?.[1];

    expect(json).toBeDefined();
    const payload = JSON.parse(json!);
    expect(payload.version).toBe('1.0');
    expect(payload.items).toEqual([expect.objectContaining({ id: 'add-dark-mode', type: 'change', valid: true })]);
    expect(payload.summary).toEqual({
      totals: { items: 1, passed: 1, failed: 0 },
      byType: { change: { items: 1, passed: 1, failed: 0 } },
    });
  });

  it('describes the quality gate with the current command surface', () => {
    const cli = readFileSync(path.join(process.cwd(), 'docs', 'cli.md'), 'utf8');

    for (const command of ['review', 'optimize', 'status', 'seal']) {
      expect(cli).toContain(`xirang quality ${command}`);
    }
    for (const token of RETIRED_QUALITY_TOKENS) {
      expect(cli, `docs/cli.md still references ${token}`).not.toContain(token);
    }
    expect(cli).not.toContain('two-phase');
  });

  it('pairs every documented finalize example with a summary', () => {
    const docs = readFileSync(path.join(process.cwd(), 'docs', 'cli.md'), 'utf8');
    const applyReference = readFileSync(
      path.join(process.cwd(), '.xirang', 'references', 'xirang-apply-step-4-optimization.md'),
      'utf8'
    );

    for (const surface of [docs, applyReference]) {
      for (const line of surface.split('\n')) {
        if (!line.includes('"stopReason":"')) {
          continue;
        }
        expect(line, `finalize example without summary: ${line}`).toContain('summary');
      }
    }
  });

  it('keeps every active surface free of retired quality tokens', () => {
    const activeSurfaces = {
      'docs/cli.md': readFileSync(path.join(process.cwd(), 'docs', 'cli.md'), 'utf8'),
      'docs/xirang.md': readFileSync(path.join(process.cwd(), 'docs', 'xirang.md'), 'utf8'),
      'docs/getting-started.md': readFileSync(
        path.join(process.cwd(), 'docs', 'getting-started.md'),
        'utf8'
      ),
      ...Object.fromEntries(
        [
          getApplyChangeSkillTemplate,
          getArchiveChangeSkillTemplate,
          getExploreSkillTemplate,
          getXirangProposeSkillTemplate,
          getBuildSkillTemplate,
          getSnackSkillTemplate,
          getFeedbackSkillTemplate,
        ].map((createTemplate) => {
          const template = createTemplate();
          return [
            `skill:${template.name}`,
            JSON.stringify(template),
          ];
        })
      ),
      ...Object.fromEntries(
        INTERNAL_SUBAGENT_TEMPLATES.map((template) => [
          `agent:${template.name}`,
          JSON.stringify(template),
        ])
      ),
    };

    for (const [surface, content] of Object.entries(activeSurfaces)) {
      for (const token of RETIRED_QUALITY_TOKENS) {
        expect(content, `${surface} still references ${token}`).not.toContain(token);
      }
    }
  });
});

describe('quality gate shared fragments', () => {
  it('exports non-empty strings', () => {
    for (const fragment of [
      QUALITY_STATE_MACHINE_DIAGRAM,
      QUALITY_CLI_JSON_SCHEMA_REFERENCE,
      QUALITY_ERROR_RECOVERY_GUIDE,
      QUALITY_CHECKPOINT_STATE_MACHINE,
      QUALITY_SIMPLE_CHANGE_FAST_PATH,
    ]) {
      expect(fragment).toBeTypeOf('string');
      expect(fragment.length).toBeGreaterThan(0);
    }
  });

  it('covers every quality CLI call input shape', () => {
    for (const token of [
      'Review',
      'Optimization round',
      'Finalize the loop',
      '"result":"PASS"',
      '"stopReason":"NO_ACTIONABLE"',
      'xirang quality status',
      'attempt',
      'dependencies',
      'priorityReason',
    ]) {
      expect(QUALITY_CLI_JSON_SCHEMA_REFERENCE).toContain(token);
    }
    for (const value of [...STOP_REASON_VALUES, ...DIRECTION_STATUS_VALUES, ...DIRECTION_LEVEL_VALUES]) {
      expect(
        QUALITY_CLI_JSON_SCHEMA_REFERENCE,
        `missing shared enum value ${value}`
      ).toContain(value);
    }
  });

  it('covers all terminal and archive gate states', () => {
    for (const token of [
      'SKIPPED',
      'NOT_NEEDED',
      'IMPROVED',
      'DEGRADED',
      'ABORTED_UNSAFE',
      'NOT_FINALIZED',
      'Archive accepts',
      'Archive rejects',
    ]) {
      expect(QUALITY_STATE_MACHINE_DIAGRAM).toContain(token);
    }
    expect(QUALITY_STATE_MACHINE_DIAGRAM).not.toContain('PENDING_VERIFICATION');
  });

  it('shows the full code-state transition path', () => {
    const diagram = QUALITY_STATE_MACHINE_DIAGRAM;
    const dirtyIndex = diagram.indexOf('dirty');
    const reviewIndex = diagram.indexOf('xirang quality review');
    const cleanIndex = diagram.indexOf('clean');
    const optimizeIndex = diagram.indexOf('xirang quality optimize');
    const sealIndex = diagram.indexOf('xirang quality seal');

    expect(dirtyIndex).toBeGreaterThanOrEqual(0);
    expect(reviewIndex).toBeGreaterThan(dirtyIndex);
    expect(cleanIndex).toBeGreaterThan(reviewIndex);
    expect(optimizeIndex).toBeGreaterThan(cleanIndex);
    expect(sealIndex).toBeGreaterThan(optimizeIndex);
  });

  it('documents recovery from code and exit status only', () => {
    for (const token of [
      'INVALID_INPUT',
      'diagnostics',
      'allowedNextOperations',
      'REVIEW_REQUIRED',
      'REVIEW_NOT_REQUIRED',
      'DIRECTION_LIMIT_REACHED',
      'OPTIMIZATION_FINALIZED',
      'ABORTED_UNSAFE',
      'SEAL_NOT_READY',
      'never infer the code state when no record exists',
      'Fail closed when isolation metadata',
    ]) {
      expect(QUALITY_ERROR_RECOVERY_GUIDE).toContain(token);
    }
  });

  it('documents the checkpoint table and its hard rules', () => {
    const fragment = QUALITY_CHECKPOINT_STATE_MACHINE;

    expect(fragment).toContain('[Mode: Checkpoint]');
    for (const state of ['CREATED', 'BASELINE_RESTORED_FOR_RETRY', 'TERMINAL_ACCEPTED', 'TERMINAL_RESTORED']) {
      expect(fragment).toContain(state);
    }
    expect(fragment.indexOf('| State | Trigger condition | Git operation |')).toBeLessThan(
      fragment.indexOf('**Hard rules**')
    );
  });

  it('keeps the mandatory optimizer delegation fast path', () => {
    expect(QUALITY_SIMPLE_CHANGE_FAST_PATH).toContain('Spawn a fresh optimizer for every round');
    expect(QUALITY_SIMPLE_CHANGE_FAST_PATH).toContain('MUST NOT generate, skip, or revoke a direction');
    expect(QUALITY_SIMPLE_CHANGE_FAST_PATH).toContain('NO_ACTIONABLE');
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

  it('requires Scenarios to describe observable behavior rather than generated layout', () => {
    expect(ELEMENT_CONTRACT_SEMANTICS).toContain('可观察行为');
    expect(ELEMENT_CONTRACT_SEMANTICS).toContain('文档排版');
    expect(ELEMENT_CONTRACT_SEMANTICS).not.toContain('## Workflow Stage');
  });
});

describe('test quality guidance fragment', () => {
  it('exports one shared 3+1 quality bar without project lock-word rules', () => {
    expect(TEST_QUALITY_GUIDANCE).toContain('Repeatable in isolation');
    expect(TEST_QUALITY_GUIDANCE).toContain('Coupled to behavior, decoupled from structure');
    expect(TEST_QUALITY_GUIDANCE).toContain('One clear failure reason');
    expect(TEST_QUALITY_GUIDANCE).toContain('Design for testability');
    expect(TEST_QUALITY_GUIDANCE).not.toContain('fail-closed');
    expect(TEST_QUALITY_GUIDANCE).not.toContain('capabilityId');
    expect(TEST_QUALITY_GUIDANCE).not.toContain('Markdown heading');
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
      'directed Relationships',
      'xirang arch outline --format json',
      'xirang arch impact <identity> --depth <n> --json',
      'xirang arch query <identities...> --contract --json',
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

  it('defines deterministic context reload rules and bounded projections', () => {
    expect(XIRANG_SHARED_CONTEXT).toContain('overall Semantic Model understanding is unclear');
    expect(XIRANG_SHARED_CONTEXT).toContain('xirang arch outline --format json');
    expect(XIRANG_SHARED_CONTEXT).toContain('specific Element Definition or Contract is unclear');
    expect(XIRANG_SHARED_CONTEXT).toContain('batch `arch query`');
    expect(XIRANG_SHARED_CONTEXT).toContain('MUST NOT guess');
    expect(XIRANG_SHARED_CONTEXT).toContain('architecture.outline.elementDefinitionDepth');
    expect(XIRANG_SHARED_CONTEXT).toContain('identity-only');
  });

  it('does not reintroduce retired public CLI or Browser forms', () => {
    const generatedSource = [XIRANG_SHARED_CONTEXT, ARCHITECTURE_GENERATE_DELTA].join('\n');
    for (const token of [
      'xirang change show',
      'xirang change list',
      'xirang change validate',
      '--specs',
      '--type spec',
      '/__xirang/spec',
    ]) {
      expect(generatedSource).not.toContain(token);
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
