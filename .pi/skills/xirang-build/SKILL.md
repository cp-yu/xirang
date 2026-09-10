---
name: "xirang-build"
description: "Build or rebuild the project Xirang Semantic Model as one reviewed Candidate."
license: "MIT"
compatibility: "Requires xirang CLI with candidate commands."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.1.0"
---

Build the project Xirang Semantic Model from user-authorized intent and evidence.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Element Definition Semantics**

- Definition SHALL 完整说明 Element 是什么、为何作为独立 Element 建模、包含什么、不包含什么，以及必要时如何区别于 parent、children 与 siblings。
- Definition 不得只是 title 的改写或一句“用于……”摘要；它表达概念身份与范围边界，不表达实现文件、符号、调用关系或当前方案。
- 职责、保证、约束、行为、Requirement、Scenario 与验收条件属于 Element Contract；方案与理由属于 `design.md`；变更动机与迁移历史属于 `proposal.md`。

**Element Contract Semantics**

- Element Contract SHALL 完整表达宿主 Element 在自身抽象层级承担的职责、保证、约束与行为；children 可以进一步精化或共同实现这些承诺，父子 Elements 可以在各自层级表达相互覆盖的完整语义。
- Requirement SHALL 以稳定 identity 表达一项可独立演进的规范承诺。以该承诺能否独立新增、修改或移除判断边界，不得按句子、分句、`SHALL` 数量或目标条数机械拆分。只复述 Declaration definition 或 sibling Requirements 语义并集且不增加规范承诺的内容不形成 Requirement；独立的不变量、顺序、原子性、一致性或完成条件应保留。
- Scenario SHALL 是具有规范约束力的 Requirement 组成，只具体化宿主 Requirement 在特定条件下的可观察行为，不得引入可独立演进的承诺。Scenarios 不默认穷尽 Requirement 的全部适用情况，Scenario 不作为独立 Semantic Delta Entry，其变化由宿主 Requirement 的完整目标内容表达。
- Scenario SHALL NOT 规定实现结构、文档排版、说明性措辞、标题顺序或测试拆分，除非该精确表示本身就是可观察契约。Scenario 数量不决定持久化测试数量。

**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run `xirang config project --json` and read the normalized `decomposition` selection from its JSON output. Do not inspect or reinterpret the raw config.
- For `method`, treat its value as an opaque method name and use only method knowledge you clearly possess. If its meaning or application is ambiguous, stop hierarchy formation and ask the user once; never substitute another method.
- For `skill`, invoke its value as a logical skill name. If the skill is unavailable, fails, or returns insufficient guidance, stop hierarchy formation and ask the user once; never infer a tool-specific path or fall back to another method.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

**Semantic Model Unit Notation**

Every Markdown unit declares its own `entity` in frontmatter. The partition does not determine the type.

| entity | frontmatter fields |
|---|---|
| `element-declaration` | `identity`, `kind`, `parent`, `title`, `definition` |
| `element-kind` | `identity`, `contract`; optional `root`, `parents`, `children` |
| `relationship-kind` | `identity`; optional `sourceKinds`, `targetKinds` |
| `authored-view` | `identity`, `include`; optional `exclude`, `of`, `title`, `autoLayout` |

- `parent: null` marks the single Project Root. `include` is `'*'` or a list of element identities; `exclude` is a list of element identities whose whole descendant subtree is pruned, taking precedence over `include`; `of` is one element identity.
- A `relationships/` file is a container of `{source, kind, target}` entries. A Relationship's identity is its entire content and it carries no other field.
- An `elements/` unit body is exactly the `## Requirements` section: `### Requirement: <name>` with `#### Scenario: <name>` beneath it. Concept identity and scope prose belongs to the Declaration's `definition` and MUST NOT be repeated in the Contract. Any other body content is a validation error.
- A `views/` unit has no body.
- `identity` uses `[A-Za-z0-9._-]+` and contains no path separator. Element Kind and Relationship Kind identities are globally unique within the Metamodel. Do not encode a parent path or hierarchy position into an identity: position changes over time while identity does not.
- Default file naming, non-normative: `elements/<identity>.md`, `metamodel/<kind identity>.md`, `views/<view identity>.md`, `relationships/<relationship kind identity>.yaml` grouped by Relationship Kind.

## Workflow

1. Confirm that the project has been prepared with `xirang setup`, then run `xirang candidate status --json`.
2. If a Candidate is active, present its baseline, inventory, and status. Ask the user to choose either to continue the active Candidate or explicitly authorize discarding it and initialize a replacement. If the user chooses to continue, preserve the active Candidate and skip Candidate initialization. Build MUST NOT silently continue, discard, or replace an active Candidate.
3. Ask the user to choose the exploration scope: whole project, code and tests, documentation and current Xirang, or custom paths and rules.
4. Detect whether subagents are available in the current environment. If they are, ask the user which model the subagent should use for the work ahead; content placement and rewriting are semantic choices that need agent support, not mechanical copying.
5. Only initialize when no Candidate is active or the user explicitly authorizes replacement. Resolve the Candidate baseline before authoring any Build file, summarize the Semantic Model when it exists, ask the user to choose the starting point, then run exactly one applicable command:
   - `xirang candidate init --from current`
   - `xirang candidate init --from clean`
   - `xirang candidate init --from-path <path>`
6. After initialization succeeds or active-Candidate continuation is confirmed, write `.xirang/candidate/build.md` with the authorized scope, authority order, current requirements, and explicit exclusions. Current user requirements have highest priority.
7. Explore the authorized scope in any useful order. Code, tests, documents, configuration, Git history, and current Xirang are evidence only unless the user explicitly designates them as source of truth. Subagents MAY accelerate read-only exploration.
8. Run the conditional Modeling Decision Gate after exploration and before the first Candidate hierarchy write. Apply the Structural Decomposition Guidance before choosing or confirming a hierarchy dimension.
   - Ask only when multiple reasonable choices would change identity, hierarchy, Contract, Kind, Relationship, or Authored View semantics. Do not block on implementation details or wording preferences that cannot change the target Semantic Model.
   - Resolve decisions in dependency order: authority conflicts → Element identity and boundaries → hierarchy → Metamodel → Contracts → Relationships → Authored Views.
   - Present bounded options with trade-offs and ask one decision at a time. If no semantic choice remains, continue without asking.
   - Append only exception provenance to `build.md`: user rulings, authority-conflict resolutions, non-obvious evidence choices, and explicit exclusions. Record each decision, evidence, and affected scope; do not create a Requirement provenance matrix.
9. Author the Candidate breadth-first across the whole model: Metamodel → Element Declarations, hierarchy, and Element Definitions → Element Contracts → Relationships → Authored Views.
   - Write `.xirang/candidate/{metamodel,elements,relationships,views}/` in the unit notation above. Complete and review each Definition independently before authoring its Contract; reject a Definition when its concept boundary conflicts with its parent, children, or siblings. An Element Contract is the body of its Element unit, so one Element has at most one Contract; whether a Contract is required comes from the `contract` field of its Element Kind.
   - Element Kind is a project-defined semantic label, not a hierarchy constraint: prefer the most specific existing Kind that accurately expresses the Element; when none does, add or refine a Kind through the Metamodel instead of weakening the Element's meaning. Do not default to a generic Kind merely because it validates. Any Kind may appear at any depth, and a parent's Kind does not restrict its children's Kinds. Hierarchy expresses abstraction→refinement only.
   - Check each completed layer with focused Agent inspection. Do not require full `candidate validate` for an intentionally incomplete intermediate layer.
   - If a later layer exposes an earlier defect, correct the affected layer and recheck every dependent later layer without rewriting unrelated layers.
10. When legacy documents or the formal model contain still-current behavior missing from the Candidate, recover it as authored semantic content. Deciding where each piece belongs (which Element, which hierarchy level, which Contract Requirement or Scenario) is a semantic choice that requires model understanding: an Agent selects the placement, it is not derived by file name, heading match, or programmatic mapping. Copying content verbatim MAY be done directly; any rewriting or migration (including vocabulary migration: `spec` → `contract`, `architecture-delta.c4` → four-partition Semantic Delta, `.opsx` → `.xirang`) MUST go through a subagent when one is available, using the model the user selected when subagents were confirmed. Keep already-covered content, never resurrect retired behavior (for example: architecture-delta.c4 persistence, Spec store/registry/frontmatter, `xirang change/spec/diff` command groups, archive-time sync or `--no-sync`, impact-sweeper, scenario operation-label acceptance), and record which sources were covered, added, and retired in `build.md`.
11. Run `xirang candidate validate --json` after all five layers exist. Fix every ERROR in Candidate source and repeat deterministic validation until it succeeds. The CLI is read-only and must not author or normalize semantics.
12. After deterministic validation succeeds, delegate one complete semantic review to a generic read-only subagent with a clean context.
    - Provide the absolute project root, Candidate root, `build.md`, current `reviewDigest`, authorized scope, authority order, recorded user rulings, validation result, review checklist, and output contract.
    - Require the subagent to independently read build.md, all four Candidate partitions, authority sources, and necessary project evidence. Main-Agent completion claims are not evidence.
    - Review authorization coverage, unauthorized durable semantics, hierarchy, Kinds, Definitions, Definition boundaries against parent/children/siblings, Contracts, Requirement boundaries, Scenario confinement, Relationships, Authored Views, cross-level overlap, and exception provenance. Check that the selected decomposition guidance is applied consistently and that the same sibling set does not mix responsibility, lifecycle, deployment, or implementation dimensions. Check that recovered legacy/formal content matches current behavior and does not resurrect retired vocabulary or recorded exclusions. Any Candidate modification invalidates the review.
    - Require one structured result with this exact contract:

```json
{
  "result": "PASS | FAIL",
  "findings": [
    {
      "severity": "BLOCKER | HIGH",
      "identity": "element-or-entry-identity",
      "issue": "problem",
      "authorityEvidence": ["path:line"],
      "correction": "required correction"
    }
  ],
  "coverage": {
    "metamodel": true,
    "elements": true,
    "relationships": true,
    "views": true,
    "build": true,
    "authority": true
  }
}
```

    - Only `BLOCKER` and `HIGH` findings fail the gate. Correct a finding or return to the Modeling Decision Gate as appropriate.
    - Any Candidate modification invalidates the review. Rerun `xirang candidate validate --json` and delegate another new clean-context subagent; never resume or reuse the previous review context.
    - If a clean-context subagent is unavailable, fail closed. Do not substitute author self-review or use `xirang-reviewer`.
13. Present the Project Root, Metamodel, hierarchy, Element Definitions, Element Contracts, Relationships, Authored Views, important confirmed decisions, Formal comparison, semantic-review result, and returned `reviewDigest` directly to the user.
14. Before promotion, re-run `xirang candidate validate --json` and present the fresh digest. Only after the user confirms that exact version, run `xirang candidate promote --digest <reviewDigest>`. Promotion replaces `.xirang/model/` with the Candidate as a whole; a unit absent from the Candidate is not retained. If the digest changed since the last review: a change made by the user is user approval of the current content and MAY be promoted directly after re-validation; a change made by the Agent invalidates the review, so re-run validation and delegate a new clean-context review before asking again. User involvement during the build normally means rework: treat multiple review rounds and re-validation as the expected flow, not a failure.
15. After promotion succeeds, verify these postconditions in order:
    - Run `xirang candidate status --json` and require `active === false`.
    - Verify `.xirang/model/metamodel`, `.xirang/model/elements`, `.xirang/model/relationships`, and `.xirang/model/views` are real directories, even when a partition is empty.
    - Run `xirang arch validate --json` and require success. Report warnings without failing the postcondition.
    - Report Build complete only after all checks pass. On failure, report whether promotion succeeded, the failed condition, and current Formal/Candidate state; MUST NOT retry promotion automatically.

## Guardrails

- The Candidate is one complete Semantic Model, authored and reviewed as a whole.
- `build.md` is temporary compilation scaffolding, not durable semantic source.
- The breadth-first authoring order does not impose a fixed evidence scan order.
- Do not infer hierarchy, behavior, or relationships from paths, imports, calls, passing tests, or implementation existence alone.
- Do not modify formal `.xirang/model/` before digest-confirmed promotion.
- Build and promotion provide no guarantee that Git status or index remain unchanged.
- Preserve canonical identities, paths, commands, and schema keys.
