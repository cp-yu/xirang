import { RelationDefinitionRegistry } from './registry.js';

export function renderRelationWorkflowSummary(): string {
  return RelationDefinitionRegistry
    .map(({ type, direction, useWhen }) => `- \`${type}\` (${direction}): ${useWhen}`)
    .join('\n');
}

export function renderOpsxDeltaTemplate(): string {
  const relationHelp = RelationDefinitionRegistry
    .map(({ type, direction, useWhen, notePolicy }) => {
      const note = notePolicy.allowed ? `note 可选，最多 ${notePolicy.maxLength} 字符` : '禁止 note';
      return `# - ${type}: ${direction}；${useWhen}；${note}`;
    })
    .join('\n');

  return `schema_version: 2
# Relation 只能从以下 Registry 定义中选择；无法精确分类时不要创建 relation，并记录 review gap。
${relationHelp}
ADDED:
  capabilities:
    - id: cap.example.feature
      type: capability
      intent: 描述新增 capability
  relations:
    - from: cap.example.feature
      type: belongs_to
      to: dom.example
MODIFIED:
  capabilities:
    - id: cap.example.existing
      intent: 更新后的 intent
REMOVED:
  capabilities:
    - id: cap.example.legacy
`;
}

export function renderBootstrapSchema(): string {
  return `name: bootstrap
version: 1
description: Structured bootstrap workflow — discover and map existing architecture from code

files:
  - id: metadata
    path: ".bootstrap.yaml"
    definition:
      purpose: Store bootstrap phase, baseline, mode, fingerprints, and timestamps.
      compilationRole: Workflow metadata controlling the retained bootstrap run.
      content:
        includes:
          - CLI-owned lifecycle state.
        excludes:
          - Agent-authored evidence, architecture content, and review decisions.
      writePolicy: workflow-managed
      validation:
        - openspec bootstrap status --json
  - id: scope
    path: "scope.yaml"
    definition:
      purpose: Persist user-approved bootstrap scope, mode, paths, and granularity.
      compilationRole: User-decision source consumed by the bootstrap workflow.
      content:
        includes:
          - Approved mode, include/exclude paths, and granularity.
        excludes:
          - Repository evidence, architecture nodes, relations, and generated state.
      writePolicy: cli-generated
      validation:
        - openspec bootstrap status --json
  - id: evidence
    path: "evidence.yaml"
    definition:
      purpose: Record repository evidence and candidate domain boundaries.
      compilationRole: Agent-authored source for architecture discovery.
      content:
        includes:
          - Candidate domains, confidence, intents, and source evidence.
        excludes:
          - Final architecture claims, generated candidates, review approval, and implementation-location data.
      writePolicy: agent-authored
      validation:
        - openspec bootstrap validate
  - id: domain-map
    path: "domain-map/*.yaml"
    definition:
      purpose: Define reviewed domain, capability, relation, and review-gap source records.
      compilationRole: Agent-authored architecture source compiled into candidate OPSX.
      content:
        includes:
          - Domain and capability nodes, canonical relations, spec groups, and review gaps.
        excludes:
          - Mechanical import/call graphs, generated candidates, and unsupported inferred relations.
      writePolicy: agent-authored
      validation:
        - openspec bootstrap validate
  - id: candidate-project
    path: "candidate/project.opsx.yaml"
    definition:
      purpose: Materialize candidate project metadata and non-relation OPSX nodes.
      compilationRole: CLI-generated derived candidate architecture symbol table.
      content:
        includes:
          - Project metadata, domains, capabilities, and other legal non-relation nodes.
        excludes:
          - Relations, delta operations, code paths, and review state.
      writePolicy: cli-generated
      validation:
        - openspec bootstrap validate
  - id: candidate-relations
    path: "candidate/project.opsx.relations.yaml"
    definition:
      purpose: Materialize the complete candidate canonical semantic relation set.
      compilationRole: CLI-generated derived candidate architecture module graph.
      content:
        includes:
          - Registry-defined semantic relations for the candidate nodes.
        excludes:
          - Node definitions, delta operations, mechanical call/import edges, and guesses.
      writePolicy: cli-generated
      validation:
        - openspec bootstrap validate
  - id: candidate-specs
    path: "candidate/specs/**/*.md"
    definition:
      purpose: Materialize candidate durable behavior Specs when the selected mode requires them.
      compilationRole: CLI-generated derived behavior source awaiting promotion.
      content:
        includes:
          - Complete requirements and scenarios for mapped capabilities.
        excludes:
          - Architecture graph data, review state, and implementation notes.
      writePolicy: cli-generated
      validation:
        - openspec bootstrap validate
  - id: review
    path: "review.md"
    definition:
      purpose: Present regenerated candidate findings and explicit approval controls.
      compilationRole: Review-controlled gate over current generated candidates.
      content:
        includes:
          - Candidate summary, gaps, diffs, and approval checkboxes.
        excludes:
          - Agent edits outside approval checkboxes and stale copied candidate content.
      writePolicy: review-controlled
      validation:
        - openspec bootstrap validate
  - id: formal-project
    path: "openspec/project.opsx.yaml"
    definition:
      purpose: Define project intent and the durable non-relation architecture node set.
      compilationRole: Durable architecture source symbol table in the formal OPSX bundle.
      content:
        includes:
          - Project intent and scope, domains, capabilities, and other legal non-relation nodes.
        excludes:
          - Relations, delta operations, source paths, implementation-location data, and bootstrap review state.
      writePolicy: workflow-managed
      validation:
        - openspec validate --all
  - id: formal-relations
    path: "openspec/project.opsx.relations.yaml"
    definition:
      purpose: Define the complete durable canonical semantic relation set.
      compilationRole: Durable architecture source module graph in the formal OPSX bundle.
      content:
        includes:
          - All Registry-defined semantic relations between formal OPSX nodes.
        excludes:
          - Node definitions, delta operations, mechanical import/call graphs, and speculative relations.
      writePolicy: workflow-managed
      validation:
        - openspec validate --all
artifacts:
  - id: init
    generates: .bootstrap.yaml
    description: Initialize bootstrap workspace with scope configuration
    template: init.md
    files:
      - metadata
      - scope
    instruction: |
      Create the bootstrap workspace under openspec/bootstrap/.

      Run: openspec bootstrap init [--mode full|opsx-first|refresh] --granularity coarse|fine [--scope src/]

      **Granularity**: coarse produces fewer grouped specs via spec_groups; fine produces per-capability specs. The agent must confirm choice before initial init. A completed workspace restart inherits retained scope.yaml granularity when omitted; an explicit value overrides it.

      This creates:
      - .bootstrap.yaml — metadata (phase, baseline, mode, fingerprints, created_at)
      - scope.yaml — user configuration (mode, include/exclude paths, granularity)

      Supported upgrade paths:
      - specs-based -> full
      - raw -> full
      - raw -> opsx-first
      - formal-opsx -> refresh

      Use opsx-first only when the repository has no existing specs and you want the formal OPSX v2 two-file bundle plus a README-only specs starter first.
      In that path, add full behavior specs later through normal change workflows.
      Use refresh only when the repository already has both formal OPSX v2 files. Refresh rebuilds a complete candidate from current evidence; the old model is used only for review diff.

      Confirm the scope configuration with the user before proceeding.
      After init, run openspec bootstrap advance scan and verify status reports phase scan. Do not edit .bootstrap.yaml or call internal APIs.
    requires: []

  - id: scan
    generates: evidence.yaml
    description: Scan codebase for domains, entrypoints, and structural evidence
    template: evidence.md
    files:
      - metadata
      - scope
      - evidence
    instruction: |
      Scan the codebase to identify candidate domains from current source, specs, configuration, and package/build metadata.

      For each candidate domain, record:
      - id: domain ID following dom.<area> convention
      - confidence: high | medium | low
      - sources: list of evidence (spec:<path>, code:<path>, readme:<section>)
      - intent: one-sentence description of the domain boundary

      CodeGraph MAY accelerate symbol/call/import discovery when already available. Otherwise use ACE, rg, read, and tracked-file search. Do not install CodeGraph automatically.
      Use repository evidence only. Do not fabricate domains.
      Prefer fewer domains with solid evidence over exhaustive noise.

      Gates (scan → map):
      - All domain IDs follow dom.<name> convention
      - No duplicate domain IDs
    requires:
      - init

  - id: map
    generates: "domain-map/*.yaml"
    description: Map capabilities and semantic relations per domain
    template: domain-map.md
    files:
      - scope
      - evidence
      - domain-map
    instruction: |
      For each domain in evidence.yaml, create a domain-map/<domain-id>.yaml file.

      Each file contains:
      - domain: the domain node definition
      - capabilities: list of capabilities under this domain
      - relations: precise Registry relation facts
      - review_gaps: current evidence that cannot be promoted to a precise relation; each entry requires evidence and reason

${renderRelationWorkflowSummary().split('\n').map((line) => `      ${line}`).join('\n')}

      Imports and calls are candidate evidence only. Select a relation from the interaction mechanism; do not mechanically promote code edges.
      This phase can be done incrementally — map one domain at a time.
      Run openspec bootstrap status to see per-domain progress.

      Gates (map → review):
      - All domains in evidence.yaml have a corresponding domain-map/*.yaml
      - Capability IDs follow cap.<domain>.<action> convention
      - Relation endpoints, ownership, notes, duplicates, and cycles satisfy the Registry contract
    requires:
      - scan

  - id: review
    generates: review.md
    description: Human review and correction of mapped architecture
    template: review.md
    files:
      - evidence
      - domain-map
      - candidate-project
      - candidate-relations
      - candidate-specs
      - review
    instruction: |
      Assemble a complete candidate from current domain-map/*.yaml evidence and generate review.md.

      Run: openspec bootstrap validate

      Review domain boundaries, capability coverage, semantic relation type/direction, ownership gaps, unsupported interactions, and spec coverage. In refresh mode, compare the complete candidate with the old formal model, which is review evidence only and must not be copied into the candidate.

      Re-run validate after any evidence.yaml or domain-map edit because review.md is regenerated from current inputs.

      Gates (review → promote):
      - review.md matches the current candidate fingerprint
      - All review.md checkboxes are checked
      - Full Registry-driven relation semantic validation passes
      - Upstream scan/map completeness still passes
      - In refresh mode, the added/modified/removed summary matches the complete current candidate and old formal review baseline
    requires:
      - map

  - id: promote
    generates: .promoted
    description: Validate and write formal OPSX files
    template: promote.md
    files:
      - candidate-project
      - candidate-relations
      - candidate-specs
      - review
      - formal-project
      - formal-relations
    instruction: |
      Run: openspec bootstrap promote -y

      This command:
      1. Re-validates scan, map, review, and Registry semantic gates
      2. Assembles the complete candidate OPSX v2 bundle from domain-map files
      3. Atomically writes project.opsx.yaml and project.opsx.relations.yaml
      4. In raw + full with granularity coarse, writes grouped specs from spec_groups; with granularity fine, writes one spec per mapped capability
      5. In raw + opsx-first, writes only openspec/specs/README.md
      6. In specs-based + full, preserves existing specs and writes only missing capability specs
      7. In formal-opsx + refresh, atomically replaces the two formal OPSX v2 files with the reviewed complete candidate
      8. Runs deterministic spec frontmatter backfill automatically
      9. Retains openspec/bootstrap/ workspace for audit history

      After promote, run openspec bootstrap backfill-specs --json. For every unmatched spec, use semanticHandoff spec content plus candidate capability intents with a subagent. Apply only reviewed mappings with --mappings <mapping-file> and report the remaining unmatched list; never guess capability associations.
      Then run \`openspec validate --all\`. If validation fails, return to the relevant bootstrap source artifact for repair before claiming completion.

      Confirm before writing to formal OPSX files.
    requires:
      - review

apply:
  requires: [review]
  tracks: review.md
  instruction: |
    Review the mapped architecture in review.md.
    Check each domain checkbox after verifying its boundaries, capabilities, semantic relations, and evidence gaps.
    If evidence.yaml or domain-map files change, run openspec bootstrap validate to regenerate review.md and re-approve it.
    When all checkboxes are checked, run openspec bootstrap promote -y.
`;
}

export function renderDomainMapTemplate(): string {
  return `# Domain Map: {{ domain_id }}

## Domain

- id: {{ domain_id }}
- intent: {{ intent }}

## Capabilities

<!--
- id: cap.<domain>.<action>
  intent: 一句话描述 capability
-->

## Relations

<!-- 无法精确分类时不要创建 relation，并在 review 中记录 gap。
${renderRelationWorkflowSummary()}

- from: cap.example.feature
  type: belongs_to
  to: {{ domain_id }}
-->

## Review Gaps

<!-- 无法从当前证据精确选择 relation 时记录，不要创建通用 relation：
- evidence: import src/example.ts -> src/dependency.ts
  reason: 无法证明该交互是 invokes 还是 consumes
-->

## Spec Groups (coarse granularity only)

<!-- 每个 entry 生成一个包含完整 capabilities frontmatter 的 candidate spec：
- folder: <single_posix_segment>
  capabilities: [cap.x, cap.y]
  purpose: 一句话描述 spec 目的
  requirements:
    - title: Requirement 名称
      text: The system SHALL ...
      scenarios:
        - title: Scenario 名称
          steps:
            - keyword: WHEN
              text: ...
            - keyword: THEN
              text: ...
-->
`;
}

export function renderRelationAuthoringReference(): string {
  const definitions = RelationDefinitionRegistry.map((definition) => {
    const note = definition.notePolicy.allowed
      ? `可选，最多 ${definition.notePolicy.maxLength} 字符，只解释非显而易见的交互条件。`
      : '禁止。';
    const example = [
      `from: ${definition.example.from}`,
      `type: ${definition.example.type}`,
      `to: ${definition.example.to}`,
      ...('note' in definition.example ? [`note: ${definition.example.note}`] : []),
    ].map((line) => `  ${line}`).join('\n');
    return `## ${definition.type}

- Direction: ${definition.direction}
- Endpoints: ${definition.fromKinds.join(' | ')} → ${definition.toKinds.join(' | ')}
- Meaning: ${definition.meaning}
- Use when: ${definition.useWhen}
- Do not use when: ${definition.doNotUseWhen}
- Propagation: ${definition.propagationHint}
- Note: ${note}

\`\`\`yaml
${example}
\`\`\``;
  }).join('\n\n');

  return `# OPSX Relation Authoring

## 选择规则

1. capability 的架构归属使用 \`belongs_to\`。
2. 主动触发执行使用 \`invokes\`；只读取数据、配置、制品或合同使用 \`consumes\`。
3. 正确性要求先后顺序使用 \`precedes\`；规则限制目标行为使用 \`constrains\`；判定目标有效性使用 \`validates\`。
4. 无法精确分类时不创建 relation，记录 review gap。

## Note policy

\`belongs_to\` 禁止 \`note\`。其他 relation 的 \`note\` 可选且最多 200 字符，不得承载路径、symbol 清单或替代 relation type。

${definitions}

## 非法用法

- 不使用 compatibility alias 或模糊通用边。
- 不存储反向重复边。
- 不把 import/call 自动提升为架构 relation。
`;
}

export const GENERATED_RELATION_FILES = [
  {
    path: 'schemas/spec-driven/templates/opsx-delta.yaml',
    render: renderOpsxDeltaTemplate,
  },
  {
    path: 'schemas/bootstrap/schema.yaml',
    render: renderBootstrapSchema,
  },
  {
    path: 'schemas/bootstrap/templates/domain-map.md',
    render: renderDomainMapTemplate,
  },
  {
    path: 'openspec/references/openspec-relation-authoring.md',
    render: renderRelationAuthoringReference,
  },
] as const;
