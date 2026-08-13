/** Shared architecture instruction fragments for workflow templates. */

/**
 * Fragment: Xirang philosophy
 * Used in: propose, explore, apply-change, archive-change, build, snack, reviewer, optimizer
 * Excluded by decision: feedback (writes no artifacts)
 */
export const XIRANG_PHILOSOPHY = `
**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions \`metamodel/\`, \`elements/\`, \`relationships/\`, and \`views/\`; a Semantic Delta uses the same four partitions and adds \`operation\`.
3. A change reconciles a Semantic Delta toward the target steady state. \`proposal.md\`, \`design.md\`, and \`tasks.md\` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.
`.trim();

/**
 * Fragment: Structural decomposition selection
 * Used in: build, explore, propose, snack
 */
export const STRUCTURAL_DECOMPOSITION_GUIDANCE = `
**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run \`xirang config project --json\` and read the normalized \`decomposition\` selection from its JSON output. Do not inspect or reinterpret the raw config.
- For \`method\`, treat its value as an opaque method name and use only method knowledge you clearly possess. If its meaning or application is ambiguous, stop hierarchy formation and ask the user once; never substitute another method.
- For \`skill\`, invoke its value as a logical skill name. If the skill is unavailable, fails, or returns insufficient guidance, stop hierarchy formation and ask the user once; never infer a tool-specific path or fall back to another method.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.
`.trim();

/**
 * Fragment: Element Definition semantics
 * Used in: build, explore, propose, snack
 */
export const ELEMENT_DEFINITION_SEMANTICS = `
**Element Definition Semantics**

- Definition SHALL 完整说明 Element 是什么、为何作为独立 Element 建模、包含什么、不包含什么，以及必要时如何区别于 parent、children 与 siblings。
- Definition 不得只是 title 的改写或一句“用于……”摘要；它表达概念身份与范围边界，不表达实现文件、符号、调用关系或当前方案。
- 职责、保证、约束、行为、Requirement、Scenario 与验收条件属于 Element Contract；方案与理由属于 \`design.md\`；变更动机与迁移历史属于 \`proposal.md\`。
`.trim();

/**
 * Fragment: Element Contract semantics
 * Used in: build, propose, snack
 */
export const ELEMENT_CONTRACT_SEMANTICS = `
**Element Contract Semantics**

- Element Contract SHALL 完整表达宿主 Element 在自身抽象层级承担的职责、保证、约束与行为；children 可以进一步精化或共同实现这些承诺，父子 Elements 可以在各自层级表达相互覆盖的完整语义。
- Requirement SHALL 以稳定 identity 表达一项可独立演进的规范承诺。以该承诺能否独立新增、修改或移除判断边界，不得按句子、分句、\`SHALL\` 数量或目标条数机械拆分。只复述 Declaration definition 或 sibling Requirements 语义并集且不增加规范承诺的内容不形成 Requirement；独立的不变量、顺序、原子性、一致性或完成条件应保留。
- Scenario SHALL 是具有规范约束力的 Requirement 组成，只具体化宿主 Requirement 在特定条件下的行为，不得引入可独立演进的承诺。Scenarios 不默认穷尽 Requirement 的全部适用情况，Scenario 不作为独立 Semantic Delta Entry，其变化由宿主 Requirement 的完整目标内容表达。
`.trim();

/**
 * Fragment: Semantic Model unit notation
 * Used in: build
 *
 * Project Build authors `.xirang/candidate/` directly and has no Change artifact
 * projection to read notation from, so the notation must travel with the prompt.
 */
export const SEMANTIC_MODEL_UNIT_NOTATION = `
**Semantic Model Unit Notation**

Every Markdown unit declares its own \`entity\` in frontmatter. The partition does not determine the type.

| entity | frontmatter fields |
|---|---|
| \`element-declaration\` | \`identity\`, \`kind\`, \`parent\`, \`title\`, \`definition\` |
| \`element-kind\` | \`identity\`, \`contract\`; optional \`root\`, \`parents\`, \`children\` |
| \`relationship-kind\` | \`identity\`; optional \`sourceKinds\`, \`targetKinds\` |
| \`authored-view\` | \`identity\`, \`include\`; optional \`exclude\`, \`of\`, \`title\`, \`autoLayout\` |

- \`parent: null\` marks the single Project Root. \`include\` is \`'*'\` or a list of element identities; \`exclude\` is a list of element identities whose whole descendant subtree is pruned, taking precedence over \`include\`; \`of\` is one element identity.
- A \`relationships/\` file is a container of \`{source, kind, target}\` entries. A Relationship's identity is its entire content and it carries no other field.
- An \`elements/\` unit body is exactly the \`## Requirements\` section: \`### Requirement: <name>\` with \`#### Scenario: <name>\` beneath it. Concept identity and scope prose belongs to the Declaration's \`definition\` and MUST NOT be repeated in the Contract. Any other body content is a validation error.
- A \`views/\` unit has no body.
- \`identity\` uses \`[A-Za-z0-9._-]+\` and contains no path separator. Element Kind and Relationship Kind identities are globally unique within the Metamodel. Do not encode a parent path or hierarchy position into an identity: position changes over time while identity does not.
- Default file naming, non-normative: \`elements/<identity>.md\`, \`metamodel/<kind identity>.md\`, \`views/<view identity>.md\`, \`relationships/<relationship kind identity>.yaml\` grouped by Relationship Kind.
`.trim();

/**
 * Fragment: Shared Xirang Semantic Model context
 * Used in: explore, propose, apply-change, snack, reviewer, optimizer
 */
export const XIRANG_SHARED_CONTEXT = `
**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the Semantic Model from \`.xirang/model/{metamodel,elements,relationships,views}/\` and locate the unique Project Root Element, whose \`parent\` is null.
- Use \`identity\` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as \`## Requirements\`, and whether a Contract is required comes from the \`contract\` field of its Element Kind.
- Run \`xirang arch outline --format json\` for the complete Element hierarchy, all Relationships, and complete Metamodel Kinds. \`architecture.outline.elementDefinitionDepth\` controls only which Element Definitions are loaded; it never hides Elements or loads Contracts.
- Use \`xirang arch impact <identity> --depth <n> --json\` to discover identity-only refinement context, directed Relationships, and canonical paths. Impact does not return Element Definitions or Contracts.
- Use one batch \`xirang arch query <identities...> --contract --json\` to read the complete Declarations and owned Contracts for only the explicit identities needed for the current decision.
- If overall Semantic Model understanding is unclear after context compression, a long session, or a context switch, re-run \`xirang arch outline --format json\`.
- If a specific Element Definition or Contract is unclear or may have been forgotten, re-run \`xirang arch query <identity> --json\`, adding \`--contract\` when needed. Reload multiple known Elements with one batch \`arch query\`; do not automatically query every identity returned by impact.
- The Agent MUST NOT guess missing Definition or Contract semantics from identity, title, an old summary, residual conversation context, or implementation evidence.
- Default unit naming is \`elements/<identity>.md\`, \`metamodel/<kind identity>.md\`, \`views/<view identity>.md\`, and \`relationships/<relationship kind identity>.yaml\` grouped by Relationship Kind; a change reuses these names under \`.xirang/changes/<name>/\`. Directory and file names carry no model semantics: every entry declares its own \`entity\` and \`identity\`, and loading locates entries by those, never by path.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/\`rg\`/\`read\` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report \`Semantic Model unavailable\`. If it is incomplete or unsupported, identify the root, identity, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.
`.trim();

/**
 * Fragment: Write the four-partition Semantic Delta
 * Used in: snack
 */
export const ARCHITECTURE_GENERATE_DELTA = `
**Write the Semantic Delta**:

Every Markdown unit declares its own \`entity\` in frontmatter. The partition does not determine the type.

| entity | frontmatter fields |
|---|---|
| \`element-declaration\` | \`identity\`, \`kind\`, \`parent\`, \`title\`, \`definition\` |
| \`element-kind\` | \`identity\`, \`contract\`; optional \`root\`, \`parents\`, \`children\` |
| \`relationship-kind\` | \`identity\`; optional \`sourceKinds\`, \`targetKinds\` |
| \`authored-view\` | \`identity\`, \`include\`; optional \`exclude\`, \`of\`, \`title\`, \`autoLayout\` |

- \`identity\` uses \`[A-Za-z0-9._-]+\`, contains no path separator, and does not encode parent hierarchy
- Before writing, follow the authoring order in the returned \`instruction\`; keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs
- Read proposal \`Source Impact\` as compatible scaffolding for one Semantic Delta; use it to locate affected elements, refinement, Element Contracts, and relationships
- Read \`design.md\` for architecture decisions and the formal Xirang Semantic Model as current semantic state
- Treat proposal entries as scope declarations, not authoritative Semantic Delta records; derive exact target-state Declarations, Requirements, Relationships, Kinds, and Views
- Write Delta units under \`.xirang/changes/<name>/{metamodel,elements,relationships,views}/\` using the same field structure as the model plus an \`operation\` of \`ADDED\`, \`MODIFIED\`, or \`REMOVED\`; each Entry carries its complete target state, and \`REMOVED\` carries identity only
- In an \`elements/\` unit, the frontmatter is the Element Declaration Entry and the body carries zero or more Requirement Entries under \`## ADDED Requirements\`, \`## MODIFIED Requirements\`, or \`## REMOVED Requirements\`; when only the Contract changes, the frontmatter declares no \`operation\` and only locates the host Element
- A \`relationships/\` entry is \`{operation, source, kind, target}\` and nothing else: it has no \`MODIFIED\` and no description, because its identity is its whole content
- Reference every semantic object by \`identity\`; a Delta unit carries no path, position, or derived-name reference
- Leave a partition empty when it does not change; do not invent Declaration, Relationship, Kind, or View changes from Contract changes alone
- Run \`xirang arch validate --change "<name>" --json\`
- Use current code only as implementation evidence; it MUST NOT override the Xirang Semantic Model
`.trim();



/**
 * Fragment: Verify state machine diagram
 * Used in: apply-change
 */
export const VERIFY_STATE_MACHINE_DIAGRAM = `
**Verify State Machine**:
\`\`\`
Phase 1 PASS / PASS_WITH_WARNINGS
  |
  v
fresh optimizer reconciliation
  |-- blockingObservations --> Phase 1 Required Corrections
  |-- no actionable finding --> NOT_NEEDED or IMPROVED
  |-- selected finding ------> freshness gate -> implemented
                                      |
                                      v
                              fresh reviewer verification
                                |-- PASS --> verified -> checkpoint -> reconcile
                                |-- FAIL --> rollback -> failed/rejected -> reconcile
  |-- unchanged reconciliation twice --> STALLED -> terminal
  |-- skipped / disabled ------------> SKIPPED

Archive accepts: SKIPPED | NOT_NEEDED | IMPROVED | DEGRADED
Archive rejects: PENDING_VERIFICATION | ABORTED_UNSAFE
\`\`\`
`.trim();

/**
 * Fragment: Verify CLI JSON schema reference
 * Used in: apply-change
 */
export const VERIFY_CLI_JSON_SCHEMA_REFERENCE = `
**Verify CLI JSON Schema Reference**:

| CLI call | \`--input\` JSON |
| --- | --- |
| Phase 1 | \`{"result":"PASS","issues":[],"evidenceFiles":["..."]}\` |
| Phase 2 reconcile | \`{"status":"OPTIMIZATION_PROPOSED","envelope":{"blockingObservations":[],"actions":[],"findings":[]}}\` |
| Begin implementation | \`{"status":"OPTIMIZATION_PROPOSED","mode":"begin-implementation","findingId":"OPT-<timestamp>-01"}\` |
| Skip | \`{"status":"SKIPPED"}\` |
| Finding verification | \`{"result":"PASS","findingId":"OPT-<timestamp>-01","issues":[]}\` |
`.trim();

/**
 * Fragment: Verify error recovery guide
 * Used in: apply-change
 */
export const VERIFY_ERROR_RECOVERY_GUIDE = `
**Verify CLI Error Recovery Guide**:
- Invalid JSON or envelope errors: fix the strict JSON structure and retry without editing persisted history
- OPTIMIZER_REQUIRED: delegate to fresh optimizer and submit its reconciliation envelope
- STALE_FINDING: do not edit; re-run optimizer reconciliation against current code
- SELECTED_FINDING_REQUIRED: use the current selected finding ID
- PENDING_VERIFICATION: complete reviewer verification or rollback before reconciliation
`.trim();

/**
 * Fragment: Fast path for simple changes
 * Used in: apply-change
 */
export const VERIFY_SIMPLE_CHANGE_FAST_PATH = `
**Simple Change Fast Path**:
- Spawn fresh optimizer at least once unless optimization is skipped or disabled
- Only a valid reconciliation envelope with no actionable findings may produce NOT_NEEDED
- Master MUST NOT self-determine NOT_NEEDED, skip selected findings, or reject them without masterChallenge
`.trim();

/**
 * Fragment: Apply proseLanguage only to natural-language prose
 * Used in: propose, snack, apply-change
 */
export const ARTIFACT_DOC_LANGUAGE_CONTRACT = `
**Document Language Contract**:
- Treat \`.xirang/config.yaml\` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes \`proseLanguage\`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow \`proseLanguage\`
- If no \`proseLanguage\` projection is present, keep the default writing behavior for prose
`.trim();
