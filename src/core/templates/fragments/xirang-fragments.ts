/** Shared architecture instruction fragments for workflow templates. */

import {
  renderQualityCheckpointStateMachine,
  renderQualityCliReference,
  renderQualityErrorRecovery,
  renderQualityFastPath,
  renderQualityStateDiagram,
} from '../../quality/protocol.js';

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

- Before forming or reorganizing an Element hierarchy, run \`xirang config project --json\` and read the normalized \`decomposition\` value from its JSON output. Do not inspect or reinterpret the raw config, and do not substitute another method.
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

Hand the confirmed identities, Kinds, complete Definitions, hierarchy, Contract detail, and Relationships back to the current workflow. Explore stays conversation-only, Build authors the authorized Candidate, and Propose compiles the Delta; persistence happens only through that workflow's separate authorization protocol. This guidance does not replace any workflow's validation, review, confirmation, or promotion gate.
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

- An Element Contract SHALL express completely the responsibilities, guarantees, constraints, and behavior the host Element carries at its own abstraction level; children may further refine or jointly fulfill those commitments, and a parent and its children may each express the complete semantics they cover at their respective levels.
- A Section SHALL express one independently evolvable normative commitment under a stable identity. Its boundary is whether that commitment can be added, modified, or removed on its own; do not split mechanically by sentence, clause, \`SHALL\` count, or target Section count. Content that only restates the Declaration definition or the union of sibling Sections without adding a normative commitment does not form a Section; independent invariants, ordering, atomicity, consistency, or completion conditions are preserved. Business-specification Contracts use the mandatory 4+N groups; related mechanism details remain inside Business Logic instead of becoming separate Sections.
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
- Resolve the absolute Project Root, then load the Semantic Model from \`.xirang/model/{metamodel,elements,relationships,views}/\` and locate the unique Project Root Element, whose \`parent\` is null.
- Use \`identity\` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as \`## Specification\`, and whether a Contract is required comes from the \`contract\` field of its Element Kind.
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
| \`element-kind\` | \`identity\`, \`contract\`; optional \`contractFormat\`, \`root\`, \`parents\`, \`children\` |
| \`relationship-kind\` | \`identity\`; optional \`sourceKinds\`, \`targetKinds\` |
| \`authored-view\` | \`identity\`, \`include\`; optional \`exclude\`, \`of\`, \`title\`, \`autoLayout\` |

- \`identity\` uses \`[A-Za-z0-9._-]+\`, contains no path separator, and does not encode parent hierarchy
- Before writing, follow the authoring order in the returned \`instruction\`; keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs
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
 * Every block is rendered by `src/core/quality/protocol.ts`, which also renders the
 * `xirang quality` help, so the reference projection and the CLI help share one source.
 */
export const QUALITY_STATE_MACHINE_DIAGRAM = renderQualityStateDiagram();
export const QUALITY_CLI_JSON_SCHEMA_REFERENCE = renderQualityCliReference();
export const QUALITY_ERROR_RECOVERY_GUIDE = renderQualityErrorRecovery();
export const QUALITY_SIMPLE_CHANGE_FAST_PATH = renderQualityFastPath();
export const QUALITY_CHECKPOINT_STATE_MACHINE = renderQualityCheckpointStateMachine();

/**
 * Fragment: Apply proseLanguage only to natural-language prose
 * Used in: propose, snack, apply-change
 */
export const ARTIFACT_DOC_LANGUAGE_CONTRACT = `
**Document Language Contract**:
- Treat \`.xirang/config.yaml\` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes \`proseLanguage\`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Section titles, Acceptance Case titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, \`### Section:\` and \`#### Acceptance Case:\` headers, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- The four business-specification Section titles are canonical English tokens: Scope and Non-goals, Business Logic, Edge Cases and Exception Handling, Key Acceptance Cases; do not translate them.
- Preserve exact existing Section titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow \`proseLanguage\`
- If no \`proseLanguage\` projection is present, keep the default writing behavior for prose
`.trim();
