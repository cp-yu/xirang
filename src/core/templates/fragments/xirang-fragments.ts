/** Shared architecture instruction fragments for workflow templates. */

import {
  renderQualityCliReference,
  renderQualityErrorRecovery,
} from '../../quality/protocol.js';

/**
 * Fragment: Xirang philosophy
 * Used in: common (stage skills and internal agents load it on demand)
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

- Before forming or reorganizing an Element hierarchy, run \`xirang config project --select decomposition --json\` and read the normalized \`decomposition\` value from its JSON output. Do not inspect or reinterpret the raw config, and do not substitute another method.
- Read the guidance file at that resolved path in full. When it is missing or unreadable, stop hierarchy formation and ask the user once.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.
`.trim();

export const SEMANTIC_REFINEMENT_REFERENCE = `
# Semantic Refinement

## Inputs and boundaries

This is the framework's default general-purpose semantic refinement method. It applies when the normalized \`decomposition\` value resolves to this file and a hierarchy must be formed or reorganized; a project-specific guidance file configured through \`decomposition\` takes precedence, and a Contract-only change never triggers structural decomposition.

Take authorized user intent and semantic authority as input. Implementation files, deployment diagrams, and the technology stack are evidence only and do not become hierarchy on their own. This guidance cannot override formal semantics, confirmed design, Element Contracts, Relationships, or the current workflow's permissions; ask the user to rule when they conflict.

## Layer-by-layer formation

1. Identify the current abstraction from domain concepts, capabilities, or user goals. For each Element, state what it is, why it stands alone, what it includes and excludes, and its boundary with its parent, children, and siblings. Ask one question at a time for each unresolved semantic choice.
2. Choose exactly one dimension for the complete sibling set under one parent, then check mutual exclusivity and completeness (MECE) within the confirmed scope. Do not mix responsibility, lifecycle, deployment, and implementation coordinates; when several independent semantic views are needed, state each boundary explicitly.
3. Express semantic category through \`project\`, \`element\`, and \`perspective\` rather than prescribing levels. A Perspective must have a real semantic boundary that needs child refinement; when grouping merely presents the same set of concepts, use a View instead of duplicating Elements or Contracts.
4. Keep exactly one stable identity per concept. Express cross-view collaboration, dependency, or constraint as typed Relationships instead of solving a presentation problem with duplicated modeling. Extend the Metamodel only when genuinely shared semantics cannot be expressed accurately by an existing Kind.
5. Work breadth-first: present all siblings of the current layer with their dimension, boundaries, and coverage, and descend only after the user confirms. C4's fixed technical levels and any fixed number of levels are not required; refine to the point where the model can be understood and decided on.
6. Complete Declaration and Contract separately. Even when no further children are split, conditions, numbers, exceptions, timing, responsibilities, and guarantees still belong in the host Element Contract; do not mistake stopping structural refinement for omitting behavior. Implementation planning belongs to the Plan.

## Stop and hand off

Stop writing the affected structure and ask the user when guidance is insufficient, concept identities overlap, the dimension is unclear, or authorities conflict. Do not default to an implementation directory or a similar method. Confirming a method grants no file-write or record-persistence permission.

Hand the confirmed identities, Kinds, complete Definitions, hierarchy, Contract detail, and Relationships back to the current workflow. Explore maintains intermediate design through the Design Record protocol and delegates feasibility experiments; its Design Summary remains conversation-only and complete Change authoring belongs to Propose. Build authors the authorized Candidate, and Propose compiles the Delta. Persistence follows each workflow's own permissions. This guidance does not replace any workflow's validation, review, confirmation, or promotion gate.
`.trim();

/**
 * Fragment: Element Definition semantics
 * Used in: build, explore, propose, snack
 */
export const ELEMENT_DEFINITION_SEMANTICS = `
**Element Definition Semantics**

- A Definition SHALL state what the Element is, why it is modeled as an independent Element, what it includes, what it excludes, and, where needed, how it differs from its parent, children, and siblings.
- A Definition MUST NOT be a rewrite of the title or a one-sentence "used for ..." summary; it expresses concept identity and scope boundary, not implementation files, symbols, call relationships, or the current approach.
- Responsibilities, guarantees, constraints, behavior, Sections, and acceptance cases belong to the Element Contract; approach and rationale belong to \`design.md\`; change motivation and migration history belong to \`proposal.md\`.
`.trim();

/**
 * Fragment: Element Contract semantics
 * Used in: build, propose, snack
 */
export const ELEMENT_CONTRACT_SEMANTICS = `
**Element Contract Semantics**

- An Element Contract SHALL express completely the responsibilities, guarantees, constraints, and behavior the host Element carries at its own abstraction level; children may further refine or jointly fulfill those commitments. A parent must independently state its complete commitments at that level without requiring readers to read child Contracts. Preserve necessary coverage across abstraction levels without copying child Contracts item by item.
- Scope states this Element's responsibilities and necessary exclusions, not every thing it does not do. Whole-Change goals and non-goals belong in \`proposal.md\`; implementation choices, rejected approaches, and reasons needed to understand the design belong in \`design.md\` (execution work belongs in \`tasks.md\`). For \`pi-native-markdown-preview\`, “自研 HTTP 预览服务” is an implementation approach exclusion: route it to \`design.md\`, not the Element Contract's Scope and Non-goals.
- State conditions, behavior, and results directly; remove explanations that add no meaning. For example, “系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。” can be shortened to “来源版本过期时，MUST 拒绝更新，记录保持不变。”
- State each rule once at the same abstraction level. Scope does not repeat the complete pipeline; Business Logic explains the mechanism; exceptions add distinct conditions and outcomes; acceptance uses concrete inputs and results to verify the commitment. Preserve complete commitments across parent/child levels rather than removing them as duplicates.
- Reuse accurate existing wording and change only affected behavior. Do not polish unrelated passages or repackage clear user-confirmed language merely to make it sound formal. Preserve conditions, numbers, exceptions, timing, and concrete examples. Keep implementation internals and process detail out of Contracts, and name Sections for enduring verifiable commitments, not one-time gap, recovery, or migration actions.
- A Section SHALL express one independently evolvable normative commitment under a stable identity. Its boundary is whether that commitment can be added, modified, or removed on its own; do not split mechanically by sentence, clause, \`SHALL\` count, or target Section count. Content that only restates the Declaration definition or the union of sibling Sections without adding a normative commitment does not form a Section; independent invariants, ordering, atomicity, consistency, or completion conditions are preserved. For business-specification Contracts, follow project-root file \`.xirang/references/xirang-business-specification-standard.md\` for the applicable grouping rules.
- A Section body is free-form: prose, lists, tables, decision tables, formulas, pseudocode blocks, event triples, or any other carrier that expresses the item completely. Do not force a carrier, require fixed sub-headings, or treat sub-headings as identity. \`### Section:\` headers are the only structural unit inside \`## Specification\`.
- \`#### Acceptance Case:\` is used only inside the key-acceptance-cases Section. It is not a general structural requirement; do not demand Acceptance Cases from other Sections, and do not let Acceptance Case count determine the number of persistent tests.
`.trim();

/**
 * Fragment: Test quality guidance
 * Used in: explore, propose, apply-change, reviewer
 */
export const TEST_QUALITY_GUIDANCE = `
**Test Quality Guidance**

Persistent tests protect observable behavior and provide fast, trustworthy feedback.

1. Repeatable in isolation. A test creates and cleans up its own state, does not depend on execution order, shared mutable state, or external mutable sources, and is fast enough for its intended feedback loop.
2. Coupled to behavior, decoupled from structure. A plausible behavioral mutation, such as changing a boundary comparison or deleting a required state update, must make the test fail. Refactoring, implementation replacement, prose changes, formatting changes, or semantic model prose changes must not fail the test when behavior is preserved.
3. One clear failure reason. A failing test identifies one broken behavior. Do not split one behavior merely to mirror multiple specification sentences, and do not combine unrelated behaviors in one test.

Design for testability: when behavior is difficult to test because of hidden global state, mixed responsibilities, or inaccessible results, improve the interface before writing the test. Do not compensate with internal mocks or implementation-coupled assertions.

Before adding a persistent test: inspect existing tests and prefer extending or replacing an existing test that already owns the behavior; choose the cheapest test boundary that can detect the intended defect; one test may cover multiple Acceptance Cases when they describe the same behavior and failure reason; add a boundary case only when it can expose a distinct plausible defect; keep slower integration or end-to-end tests only for cross-boundary behavior a cheaper test cannot prove; use one-time verification for build, typecheck, migration inspection, and other evidence that does not justify a maintained test; update or delete tests whose behavior changed, disappeared, became duplicated, or became coupled to obsolete structure.
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
| \`element-kind\` | \`identity\`, \`contract\`; optional \`contractFormat\`, \`root\`, \`parents\`, \`children\` |
| \`relationship-kind\` | \`identity\`; optional \`sourceKinds\`, \`targetKinds\` |
| \`authored-view\` | \`identity\`, \`include\`; optional \`exclude\`, \`of\`, \`title\`, \`autoLayout\` |

- \`parent: null\` marks the single Project Root. \`include\` is \`'*'\` or a list of element identities; \`exclude\` is a list of element identities whose whole descendant subtree is pruned, taking precedence over \`include\`; \`of\` is one element identity.
- A \`relationships/\` file is a container of \`{source, kind, target}\` entries. A Relationship's identity is its entire content and it carries no other field.
- An \`elements/\` unit body is exactly the \`## Specification\` section: \`### Section: <name>\` items, each with a free body and optionally \`#### Acceptance Case: <name>\` blocks inside the acceptance-cases Section. Concept identity and scope prose belongs to the Declaration's \`definition\` and MUST NOT be repeated in the Contract. Any other body content is a validation error.
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
- Resolve the absolute Project Root. The Semantic Model is stored in \`.xirang/model/{metamodel,elements,relationships,views}/\`; use the CLI projections below to load needed context, not a recursive read of all partitions. Locate the unique Project Root Element (\`parent: null\`) through outline and query its Declaration.
- Use \`identity\` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as \`## Specification\`, and whether a Contract is required comes from the \`contract\` field of its Element Kind.
- Prefer \`xirang arch outline --format markdown\` for reading the complete Element hierarchy; expand Definitions, Relationships or Metamodel only when needed. Use JSON when a program needs exact fields.
- Use \`xirang arch impact <identity> --depth <n> --json\` for identity-only refinement context and a relationship summary. Use \`--paths\` only when relationship paths are needed; impact never returns Element Definitions or Contracts.
- Use \`xirang arch query <identity> --json\` for the complete Declaration of a selected identity; add \`--contract\` only when that Element Contract is needed. Batch only the selected identities whose semantics answer the current question.
- Before expanding a read or issuing a batch, state the concrete question it must answer and include only the identities or file ranges required for that question. Start discovery with \`xirang arch search <query> --limit <n>\`.
- For code evidence, locate symbols or definitions first with LSP or \`rg\`, then read the smallest relevant implementation range. For tests, locate the test that owns the behavior before opening test files; do not read whole directories by default.
- Use concurrency only for bounded, independent reads. Do not emit or retain raw nested JSON when a concise projection or selected fields answer the question.
- If a tool truncates output, treat it as incomplete: narrow the query or split it into bounded reads, then retrieve and verify the missing portion before relying on the result.
- If specific semantic context is missing, query that identity rather than expanding every identity returned by impact. If global model understanding is lost after context compression or session switch, recover with \`xirang arch outline --format markdown\` and selected semantic reads. Use \`xirang arch snapshot --format json\` only when those reads cannot recover the needed global state or a model diagnostic requires the full Declaration/Relationship/Metamodel baseline; then query only required Contracts.
- Before authoring or revising artifacts, load \`.xirang/references/xirang-configuration-use.md\` once and follow its configuration-use protocol; reuse it while current.
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
| \`element-kind\` | \`identity\`, \`contract\`; optional \`contractFormat\`, \`root\`, \`parents\`, \`children\` |
| \`relationship-kind\` | \`identity\`; optional \`sourceKinds\`, \`targetKinds\` |
| \`authored-view\` | \`identity\`, \`include\`; optional \`exclude\`, \`of\`, \`title\`, \`autoLayout\` |

- \`identity\` uses \`[A-Za-z0-9._-]+\`, contains no path separator, and does not encode parent hierarchy
- Before writing, follow the matching artifact reference Guidance after reading its Definition; query status and selected configuration only when needed
- Read proposal \`Source Impact\` as compatible scaffolding for one Semantic Delta; use it to locate affected elements, refinement, Element Contracts, and relationships
- Read \`design.md\` for architecture decisions and the formal Xirang Semantic Model as current semantic state
- Treat proposal entries as scope declarations, not authoritative Semantic Delta records; derive exact target-state Declarations, Sections, Relationships, Kinds, and Views
- Write Delta units under \`.xirang/changes/<name>/{metamodel,elements,relationships,views}/\` using the same field structure as the model plus an \`operation\` of \`ADDED\`, \`MODIFIED\`, or \`REMOVED\`; each Entry carries its complete target state, and \`REMOVED\` carries identity only
- In an \`elements/\` unit, the frontmatter is the Element Declaration Entry and the body carries zero or more Section Entries under \`## ADDED Sections\`, \`## MODIFIED Sections\`, or \`## REMOVED Sections\`; when only the Contract changes, the frontmatter declares no \`operation\` and only locates the host Element
- A \`relationships/\` entry is \`{operation, source, kind, target}\` and nothing else: it has no \`MODIFIED\` and no description, because its identity is its whole content
- Reference every semantic object by \`identity\`; a Delta unit carries no path, position, or derived-name reference
- Leave a partition empty when it does not change; do not invent Declaration, Relationship, Kind, or View changes from Contract changes alone
- Run \`xirang arch validate --change "<name>" --json\`
- Use current code only as implementation evidence; it MUST NOT override the Xirang Semantic Model
`.trim();

/**
 * Fragment: Quality protocol guidance
 * Used in: apply-change, archive-change
 *
 * Rendered by `src/core/quality/protocol.ts` from the CLI's commandSchemas and
 * qualityOptionMetadata. Apply and Archive project the shared Review/Opt/Seal protocol.
 */
export const QUALITY_CLI_JSON_SCHEMA_REFERENCE = renderQualityCliReference();
export const QUALITY_ERROR_RECOVERY_GUIDE = renderQualityErrorRecovery();

/**
 * Fragment: Apply proseLanguage only to natural-language prose
 * Used in: propose, snack, apply-change
 */
export const ARTIFACT_DOC_LANGUAGE_CONTRACT = `
Before authoring, read \`.xirang/references/xirang-configuration-use.md\` unless already available and current; follow its effective configuration and document-language rules.
`.trim();
