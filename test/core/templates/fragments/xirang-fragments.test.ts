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
  QUALITY_CLI_JSON_SCHEMA_REFERENCE,
  QUALITY_ERROR_RECOVERY_GUIDE,
} from '../../../../src/core/templates/fragments/xirang-fragments.js';


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
      QUALITY_CLI_JSON_SCHEMA_REFERENCE,
      QUALITY_ERROR_RECOVERY_GUIDE,
    ]) {
      expect(fragment).toBeTypeOf('string');
      expect(fragment.length).toBeGreaterThan(0);
    }
  });
});

describe('Semantic Delta authoring fragment', () => {
  it('defers definition-first ordering to the artifact instruction projection', () => {
    expect(ARCHITECTURE_GENERATE_DELTA).toContain('Guidance');
    expect(ARCHITECTURE_GENERATE_DELTA).toContain('query status and selected configuration only when needed');
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
      '## MODIFIED Sections',
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
      'what the Element is',
      'why it is modeled as an independent Element',
      'what it includes, what it excludes',
      'parent, children, and siblings',
      'MUST NOT be a rewrite of the title',
      'Responsibilities, guarantees, constraints, behavior, Sections, and acceptance cases',
      'proposal.md',
      'design.md',
    ]) {
      expect(ELEMENT_DEFINITION_SEMANTICS).toContain(token);
    }
  });
});

describe('Element Contract semantics fragment', () => {
  it('defines the shared Contract, Section, and Acceptance Case boundaries', () => {
    for (const token of [
      'at its own abstraction level',
      'added, modified, or removed on its own',
      'do not split mechanically by sentence, clause, `SHALL` count, or target Section count',
      'Acceptance Case',
      '`### Section:` headers are the only structural unit inside `## Specification`',
      '`#### Acceptance Case:` is used only inside the key-acceptance-cases Section',
    ]) {
      expect(ELEMENT_CONTRACT_SEMANTICS).toContain(token);
    }
  });

  it('stays separate from storage notation', () => {
    expect(ELEMENT_CONTRACT_SEMANTICS).not.toContain('frontmatter fields');
    expect(ELEMENT_CONTRACT_SEMANTICS).not.toContain('Default file naming');
  });

  it('keeps Acceptance Cases as key-case-only notation rather than a general structural requirement', () => {
    expect(ELEMENT_CONTRACT_SEMANTICS).toContain('It is not a general structural requirement');
    expect(ELEMENT_CONTRACT_SEMANTICS).toContain('do not demand Acceptance Cases from other Sections');
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
      'relationships',
      'xirang arch outline --format json',
      'xirang arch impact <identity> --depth <n> --json',
      'xirang arch query <identity> --json',
      '`--contract` only when that Element Contract is needed',
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
    expect(XIRANG_SHARED_CONTEXT).toContain('xirang arch snapshot --format json');
    expect(XIRANG_SHARED_CONTEXT).toContain('xirang arch query <identity> --json');
    expect(XIRANG_SHARED_CONTEXT).toContain('`--contract`');
    expect(XIRANG_SHARED_CONTEXT).toContain('`--paths`');
    expect(XIRANG_SHARED_CONTEXT).toContain('MUST NOT guess');
  });

  it('preserves bounded-reading safeguards across prose edits', () => {
    const rules = XIRANG_SHARED_CONTEXT.split(/\n(?=- )/).map(rule => rule.replace(/\s+/g, ' '));
    const hasPositiveRule = (pattern: RegExp, rejected: RegExp) => rules.some(rule => pattern.test(rule) && !rejected.test(rule));

    const questionGate = (text: string) => {
      const normalized = text.replace(/\s+/g, ' ');
      return /(?:(?:before|prior to|first)[\s\S]*(?:expand|broaden|batch|additional read)[\s\S]*(?:question|uncertainty|issue to answer)|(?:question|uncertainty)[\s\S]*(?:before|prior to)[\s\S]*(?:expand|broaden|batch|additional read))/i.test(normalized)
        && !/(?:do not|don't|never|must not|shall not)[\s\S]*(?:state|identify|ask)/i.test(normalized);
    };
    expect(rules.some(questionGate)).toBe(true);
    expect(questionGate('State the question before expanding the read.')).toBe(true);
    expect(questionGate('Ask what uncertainty the query resolves before broadening the read.')).toBe(true);
    expect(questionGate('Before expanding a read or issuing a batch,\nstate the concrete question it must answer.')).toBe(true);
    expect(questionGate('Do not state a question before expanding a read.')).toBe(false);
    expect(hasPositiveRule(/(LSP|symbols?|definitions?)[\s\S]*(before|first|then)[\s\S]*(smallest|minimal|relevant range)/i, /(do not|don't|never|must not|shall not)[\s\S]{0,50}(locate symbols|use LSP)/i)).toBe(true);
    expect(hasPositiveRule(/test[\s\S]*(owns|responsible for)[\s\S]*behavior/i, /(do not|don't|never|must not|shall not)[\s\S]*(locate|identify|find)/i)).toBe(true);
    expect(hasPositiveRule(/bounded[\s\S]*independent reads/i, /(unbounded|unlimited|all reads)/i)).toBe(true);
    expect(rules.some(rule => /nested JSON/i.test(rule) && /(do not|avoid|never|must not|shall not)[\s\S]*raw nested JSON/i.test(rule))).toBe(true);
    expect(hasPositiveRule(/truncat[\s\S]*(incomplete|missing)[\s\S]*(narrow|split|retrieve|fetch|verify)/i, /(trust|rely on)[\s\S]*truncated/i)).toBe(true);
  });

  it('includes bounded search and safe expansion protocol tokens', () => {
    expect(XIRANG_SHARED_CONTEXT).toContain('arch search <query> --limit <n>');
    expect(XIRANG_SHARED_CONTEXT).toContain('MUST NOT guess');
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


describe('默认语义精化路由', () => {
  it('结构形成入口指向统一默认指导', () => {
    for (const template of [getBuildSkillTemplate(), getExploreSkillTemplate(), getXirangProposeSkillTemplate(), getSnackSkillTemplate()]) {
      expect(template.instructions).toContain('xirang config project --select decomposition --json');
      expect(template.instructions).toContain('Read the guidance file at that resolved path in full');
      expect(template.instructions).not.toContain('opaque method name');
    }
  });
});
