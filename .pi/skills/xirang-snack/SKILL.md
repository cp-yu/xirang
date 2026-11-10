---
name: "xirang-snack"
description: "Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + simplified design + the four-partition Semantic Delta using available code-change evidence. Use after iterative coding to back-fill Xirang artifacts without redoing propose→apply. Does not generate tasks.md."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.8"
---

Reconcile Xirang artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Business Specification Standard (4+N)**

For business-specification Elements, prepare scope/non-goals, the complete business mechanism, exceptions, and key acceptance outcomes; add Sections only for independently maintained commitments. Before exploring such a Contract or authoring/revising its Kind or Contract, read `.xirang/references/xirang-business-specification-standard.md` for applicability, canonical structure and self-checks. Generic framework or organizational Elements do not trigger this format.

**Element Definition Semantics**

- A Definition SHALL state what the Element is, why it is modeled as an independent Element, what it includes, what it excludes, and, where needed, how it differs from its parent, children, and siblings.
- A Definition MUST NOT be a rewrite of the title or a one-sentence "used for ..." summary; it expresses concept identity and scope boundary, not implementation files, symbols, call relationships, or the current approach.
- Responsibilities, guarantees, constraints, behavior, Sections, and acceptance cases belong to the Element Contract; approach and rationale belong to `design.md`; change motivation and migration history belong to `proposal.md`.

**Element Contract Semantics**

- An Element Contract SHALL express completely the responsibilities, guarantees, constraints, and behavior the host Element carries at its own abstraction level; children may further refine or jointly fulfill those commitments. A parent must independently state its complete commitments at that level without requiring readers to read child Contracts. Preserve necessary coverage across abstraction levels without copying child Contracts item by item.
- Scope states this Element's responsibilities and necessary exclusions, not every thing it does not do. Whole-Change goals and non-goals belong in `proposal.md`; implementation choices, rejected approaches, and reasons needed to understand the design belong in `design.md` (execution work belongs in `tasks.md`). For `pi-native-markdown-preview`, “自研 HTTP 预览服务” is an implementation approach exclusion: route it to `design.md`, not the Element Contract's Scope and Non-goals.
- State conditions, behavior, and results directly; remove explanations that add no meaning. For example, “系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。” can be shortened to “来源版本过期时，MUST 拒绝更新，记录保持不变。”
- State each rule once at the same abstraction level. Scope does not repeat the complete pipeline; Business Logic explains the mechanism; exceptions add distinct conditions and outcomes; acceptance uses concrete inputs and results to verify the commitment. Preserve complete commitments across parent/child levels rather than removing them as duplicates.
- Reuse accurate existing wording and change only affected behavior. Do not polish unrelated passages or repackage clear user-confirmed language merely to make it sound formal. Preserve conditions, numbers, exceptions, timing, and concrete examples. Keep implementation internals and process detail out of Contracts, and name Sections for enduring verifiable commitments, not one-time gap, recovery, or migration actions.
- A Section SHALL express one independently evolvable normative commitment under a stable identity. Its boundary is whether that commitment can be added, modified, or removed on its own; do not split mechanically by sentence, clause, `SHALL` count, or target Section count. Content that only restates the Declaration definition or the union of sibling Sections without adding a normative commitment does not form a Section; independent invariants, ordering, atomicity, consistency, or completion conditions are preserved. Business-specification Contracts use the mandatory 4+N groups; related mechanism details remain inside Business Logic instead of becoming separate Sections.
- A Section body is free-form: prose, lists, tables, decision tables, formulas, pseudocode blocks, event triples, or any other carrier that expresses the item completely. Do not force a carrier, require fixed sub-headings, or treat sub-headings as identity. `### Section:` headers are the only structural unit inside `## Specification`.
- `#### Acceptance Case:` is used only inside the key-acceptance-cases Section. It is not a general structural requirement; do not demand Acceptance Cases from other Sections, and do not let Acceptance Case count determine the number of persistent tests.

**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run `xirang config project --select decomposition --json` and read the normalized `decomposition` value from its JSON output. Do not inspect or reinterpret the raw config, and do not substitute another method.
- Read the guidance file at that resolved path in full. When it is missing or unreadable, stop hierarchy formation and ask the user once.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

Treat `proposal.md`, `design.md`, and the Delta units under `{metamodel,elements,relationships,views}/` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional `<change-name>` (kebab-case).
- Default to creating a new change. If no name is supplied, derive a new kebab-case change ID from the implementation evidence; if the evidence cannot produce a clear ID, ask the user for a change ID instead of guessing. Confirm that the ID is unused with `xirang list --json`.
- Update an active change only when the user explicitly asks to update the current or an existing change. Supplying an existing change ID does not by itself select update mode.

## Flow

Use each artifact reference in Definition, Guidance, Template order. Keep static guidance, selected configuration, dependency status and target content separate; do not copy non-artifact inputs into artifacts.

1. Resolve change name and reconcile mode.
   - In the default new-change mode, if `.xirang/changes/<name>/` does not exist, run `xirang new change "<name>"` and create only artifacts required by evidence. If the ID already exists, stop and ask for a different ID; do not update it or synthesize an alternative ID.
   - In update mode, use the explicitly named change. If the user explicitly asks to update the current change without naming it, run `xirang list --json` and reuse the single active change; if multiple or none exist, ask which existing change to target.
   - Before updating, read the current proposal, design, and Delta units; classify each as **missing**, **stale**, **inconsistent**, or **current** and preserve unrelated human-authored content.
2. Load the shared Xirang Semantic Model context.
**Xirang Semantic Model Context**
- Resolve the absolute Project Root. The Semantic Model is stored in `.xirang/model/{metamodel,elements,relationships,views}/`; use the CLI projections below to load needed context, not a recursive read of all partitions. Locate the unique Project Root Element (`parent: null`) through outline and query its Declaration.
- Use `identity` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as `## Specification`, and whether a Contract is required comes from the `contract` field of its Element Kind.
- Prefer `xirang arch outline --format markdown` for reading the complete Element hierarchy; expand Definitions, Relationships or Metamodel only when needed. Use JSON when a program needs exact fields.
- Use `xirang arch impact <identity> --depth <n> --json` for identity-only refinement context and a relationship summary. Use `--paths` only when relationship paths are needed; impact never returns Element Definitions or Contracts.
- Use `xirang arch query <identity> --json` for the complete Declaration of a selected identity; add `--contract` only when that Element Contract is needed. Batch only the selected identities whose semantics answer the current question.
- Before expanding a read or issuing a batch, state the concrete question it must answer and include only the identities or file ranges required for that question. Start discovery with `xirang arch search <query> --limit <n>`.
- For code evidence, locate symbols or definitions first with LSP or `rg`, then read the smallest relevant implementation range. For tests, locate the test that owns the behavior before opening test files; do not read whole directories by default.
- Use concurrency only for bounded, independent reads. Do not emit or retain raw nested JSON when a concise projection or selected fields answer the question.
- If a tool truncates output, treat it as incomplete: narrow the query or split it into bounded reads, then retrieve and verify the missing portion before relying on the result.
- If specific semantic context is missing, query that identity rather than expanding every identity returned by impact. If global model understanding is lost after context compression or session switch, recover with `xirang arch outline --format markdown` and selected semantic reads. Use `xirang arch snapshot --format json` only when those reads cannot recover the needed global state or a model diagnostic requires the full Declaration/Relationship/Metamodel baseline; then query only required Contracts.
- Before authoring or revising artifacts, load `.xirang/references/xirang-configuration-use.md` once and follow its configuration-use protocol; reuse it while current.
- The Agent MUST NOT guess missing Definition or Contract semantics from identity, title, an old summary, residual conversation context, or implementation evidence.
- Default unit naming is `elements/<identity>.md`, `metamodel/<kind identity>.md`, `views/<view identity>.md`, and `relationships/<relationship kind identity>.yaml` grouped by Relationship Kind; a change reuses these names under `.xirang/changes/<name>/`. Directory and file names carry no model semantics: every entry declares its own `entity` and `identity`, and loading locates entries by those, never by path.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.
3. Collect code-change evidence from conversation context plus `git diff --cached`, `git diff HEAD`, other available working-tree/staged diffs, and user-selected commit/range diffs. `git diff` is one evidence source among several and MUST NOT be treated as the only valid source. Treat natural-language commit/range selectors as agent-parsed evidence selectors, not Xirang CLI flags. Mark conflicts or uncertainty `[REVIEW NEEDED]`.
4. Map changed symbols/files to current Semantic Model context.
   - Use Element `identity` values, refinement, Element Contracts, and relationships.
   - CodeGraph MAY accelerate symbol/call/import discovery; otherwise use ACE, `rg`, and `read`. Never read `.codegraph/codegraph.db`.
   - Treat code locations and call/import edges as implementation evidence, not as proof that the Xirang Semantic Model must change. Do not create elements from uncertain file-name inference.
5. Determine Element Contract impact.
   - Select only the candidate Element identities whose current Contracts are needed, then run one batch `xirang arch query <selected-identities...> --contract --json` and keep their current Sections.
   - Add an identity to **Modified Specs** only when the observable Sections of its Element Contract change. Add it to **New Specs** only for genuinely new observable behavior not governed by an existing Element Contract.
   - An optional-contract Element without a Contract does not by itself require a new one; mark missing coverage `[REVIEW NEEDED]`.
   - Behavior-preserving refactors create no Contract delta; later verification directions reference the responsible formal Contract Section.
6. Determine structural impact.
   - Declare impact only when Element Declarations, refinement, Relationships, Kinds, or Views change.
   - Reconcile a Definition only when user intent, existing semantic artifacts, or other authoritative evidence establishes its complete concept identity and scope boundary. Do not infer a Definition from file names, symbols, imports, or call relationships; when the required conceptual boundary is unresolved, stop and ask one focused question instead of guessing.
   - Implementation-only movement, symbol renaming, helper extraction, and mechanical call/import changes do not by themselves change the structure. Treat file moves, symbol renames, imports, or calls as mechanical evidence and do not invoke decomposition guidance for them.
   - Apply the Structural Decomposition Guidance only when conversation context, the Xirang Semantic Model, and authorized evidence requires a new or reorganized durable hierarchy.
   - If decomposition guidance suggests structure that exceeds user intent or authoritative evidence, do not write the suggested structure; mark the decision for user confirmation.
   - If required decomposition guidance is unavailable or insufficient, stop structural reconciliation and report its logical name instead of guessing or falling back.
   - If no structural fact changes, set the compatible Architecture Source scope to `None`. If impact remains unresolved, stop and ask one focused question; do not write structural Delta units or claim reconciliation complete.
7. Reconcile the Contract and structural scopes as one Semantic Delta; both address the same Element identity space.
8. Reconcile `proposal.md`.
   - Read `.xirang/references/xirang-artifact-proposal.md` (Definition, Guidance, Template), then query current authoring configuration with `xirang config project --artifact proposal --select proseLanguage --select context --select rules --json`.
   - Reconcile `## Source Impact` from the Contract and structural scopes of one Semantic Delta. Keep the compatible Behavior Source and Architecture Source headings and reference Elements by `identity`.
   - Reuse the confirmed Contract scope as the Element Contract delta input; preserve `## Why`, `## What Changes`, `## Source Impact`, and `## Impact`.
   - If the proposal already matches evidence and source impact, leave it unchanged.
9. Reconcile Element Contract deltas in `elements/<identity>.md`.
   - Read `.xirang/references/xirang-artifact-specs.md` (Definition, Guidance, Template), then query current authoring configuration with `xirang config project --artifact specs --select proseLanguage --select context --select rules --json`.
   - Create or update only the identities declared by the Contract scope. The default unit name is `<identity>.md`; a file name expresses nothing, so deviating from the default changes no model semantics.
   - Follow returned `## ADDED Sections`, `## MODIFIED Sections`, and `## REMOVED Sections` rules with exact title matching. Express a rename as REMOVED old Section plus ADDED new complete Section. Preserve unrelated current delta content.
10. Reconcile simplified `design.md`.
   - Read `.xirang/references/xirang-artifact-design.md` (Definition, Guidance, Template), then query current authoring configuration with `xirang config project --artifact design --select proseLanguage --select context --select rules --json`.
   - Preserve Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs. Mark inferred content `[INFERRED FROM CODE]` and unresolved decisions `[REVIEW NEEDED]`.
11. Reconcile the structural Delta units only after structural impact is resolved. Leave those partitions empty when the structure is confirmed unchanged; author validated Entries otherwise.
   **Write the Semantic Delta**:

Every Markdown unit declares its own `entity` in frontmatter. The partition does not determine the type.

| entity | frontmatter fields |
|---|---|
| `element-declaration` | `identity`, `kind`, `parent`, `title`, `definition` |
| `element-kind` | `identity`, `contract`; optional `contractFormat`, `root`, `parents`, `children` |
| `relationship-kind` | `identity`; optional `sourceKinds`, `targetKinds` |
| `authored-view` | `identity`, `include`; optional `exclude`, `of`, `title`, `autoLayout` |

- `identity` uses `[A-Za-z0-9._-]+`, contains no path separator, and does not encode parent hierarchy
- Before writing, follow the matching artifact reference Guidance after reading its Definition; query status and selected configuration only when needed
- Read proposal `Source Impact` as compatible scaffolding for one Semantic Delta; use it to locate affected elements, refinement, Element Contracts, and relationships
- Read `design.md` for architecture decisions and the formal Xirang Semantic Model as current semantic state
- Treat proposal entries as scope declarations, not authoritative Semantic Delta records; derive exact target-state Declarations, Sections, Relationships, Kinds, and Views
- Write Delta units under `.xirang/changes/<name>/{metamodel,elements,relationships,views}/` using the same field structure as the model plus an `operation` of `ADDED`, `MODIFIED`, or `REMOVED`; each Entry carries its complete target state, and `REMOVED` carries identity only
- In an `elements/` unit, the frontmatter is the Element Declaration Entry and the body carries zero or more Section Entries under `## ADDED Sections`, `## MODIFIED Sections`, or `## REMOVED Sections`; when only the Contract changes, the frontmatter declares no `operation` and only locates the host Element
- A `relationships/` entry is `{operation, source, kind, target}` and nothing else: it has no `MODIFIED` and no description, because its identity is its whole content
- Reference every semantic object by `identity`; a Delta unit carries no path, position, or derived-name reference
- Leave a partition empty when it does not change; do not invent Declaration, Relationship, Kind, or View changes from Contract changes alone
- Run `xirang arch validate --change "<name>" --json`
- Use current code only as implementation evidence; it MUST NOT override the Xirang Semantic Model
   - Distinguish Section Entries in an Element unit body from the Declaration Entry in its frontmatter.
12. Do NOT generate `tasks.md` (code is already implemented).
13. Run `xirang validate --change "<name>" --preview --json` and review the effective-diff entries against implementation evidence before completion. On ERROR/WARNING, repair once from artifact guidance, rerun the command, review the final preview, and report the final result.
14. Finish with the output hints. Do NOT generate a presentation artifact or run a separate Diff command.

## Output Hints

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: `xirang sync "<change-name>" --no-verify`
2. **Quick archive**: `xirang archive "<change-name>" --no-verify`
3. **Sync and archive**: `xirang sync "<change-name>" --no-verify && xirang archive "<change-name>" --no-verify`
4. **Continue development**: review change → modify code → run `/skill:xirang-snack` again → continue iterating

## Artifact Contract

**Document Language Contract**:
- Follow the shared configuration-use protocol in `.xirang/references/xirang-configuration-use.md`; load it once before authoring and reuse it while current.
- Query effective `proseLanguage` through `xirang config project --select proseLanguage --json` once and after relevant configuration changes. Use it for newly authored natural-language prose; preserve IDs, schema keys, paths, commands, SHALL/MUST and canonical template/Section headings.
- Keep the template structure unchanged. If no `proseLanguage` value is present, keep the default writing behavior for prose.

Preserve canonical headings, IDs, schema keys, paths, commands, and code identifiers.
