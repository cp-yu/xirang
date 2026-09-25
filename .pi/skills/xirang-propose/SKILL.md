---
name: "xirang-propose"
description: "Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.1.1"
---

Propose a new change or update an existing change, generating all artifacts needed for implementation.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Test Quality Guidance**

Persistent tests protect observable behavior and provide fast, trustworthy feedback.

1. Repeatable in isolation. A test creates and cleans up its own state, does not depend on execution order, shared mutable state, or external mutable sources, and is fast enough for its intended feedback loop.
2. Coupled to behavior, decoupled from structure. A plausible behavioral mutation, such as changing a boundary comparison or deleting a required state update, must make the test fail. Refactoring, implementation replacement, prose changes, formatting changes, or semantic model prose changes must not fail the test when behavior is preserved.
3. One clear failure reason. A failing test identifies one broken behavior. Do not split one behavior merely to mirror multiple specification sentences, and do not combine unrelated behaviors in one test.

Design for testability: when behavior is difficult to test because of hidden global state, mixed responsibilities, or inaccessible results, improve the interface before writing the test. Do not compensate with internal mocks or implementation-coupled assertions.

Before adding a persistent test: inspect existing tests and prefer extending or replacing an existing test that already owns the behavior; choose the cheapest test boundary that can detect the intended defect; one test may cover multiple Scenarios when they describe the same behavior and failure reason; add a boundary case only when it can expose a distinct plausible defect; keep slower integration or end-to-end tests only for cross-boundary behavior a cheaper test cannot prove; use one-time verification for build, typecheck, migration inspection, and other evidence that does not justify a maintained test; update or delete tests whose behavior changed, disappeared, became duplicated, or became coupled to obsolete structure.

**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the Semantic Model from `.xirang/model/{metamodel,elements,relationships,views}/` and locate the unique Project Root Element, whose `parent` is null.
- Use `identity` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as `## Requirements`, and whether a Contract is required comes from the `contract` field of its Element Kind.
- Run `xirang arch outline --format json` for the complete Element hierarchy, all Relationships, and complete Metamodel Kinds. `architecture.outline.elementDefinitionDepth` controls only which Element Definitions are loaded; it never hides Elements or loads Contracts.
- Use `xirang arch impact <identity> --depth <n> --json` to discover identity-only refinement context, directed Relationships, and canonical paths. Impact does not return Element Definitions or Contracts.
- Use one batch `xirang arch query <identities...> --contract --json` to read the complete Declarations and owned Contracts for only the explicit identities needed for the current decision.
- If overall Semantic Model understanding is unclear after context compression, a long session, or a context switch, re-run `xirang arch outline --format json`.
- If a specific Element Definition or Contract is unclear or may have been forgotten, re-run `xirang arch query <identity> --json`, adding `--contract` when needed. Reload multiple known Elements with one batch `arch query`; do not automatically query every identity returned by impact.
- The Agent MUST NOT guess missing Definition or Contract semantics from identity, title, an old summary, residual conversation context, or implementation evidence.
- Default unit naming is `elements/<identity>.md`, `metamodel/<kind identity>.md`, `views/<view identity>.md`, and `relationships/<relationship kind identity>.yaml` grouped by Relationship Kind; a change reuses these names under `.xirang/changes/<name>/`. Directory and file names carry no model semantics: every entry declares its own `entity` and `identity`, and loading locates entries by those, never by path.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.

**Element Definition Semantics**

- A Definition SHALL state what the Element is, why it is modeled as an independent Element, what it includes, what it excludes, and, where needed, how it differs from its parent, children, and siblings.
- A Definition MUST NOT be a rewrite of the title or a one-sentence "used for ..." summary; it expresses concept identity and scope boundary, not implementation files, symbols, call relationships, or the current approach.
- Responsibilities, guarantees, constraints, behavior, Requirements, Scenarios, and acceptance conditions belong to the Element Contract; approach and rationale belong to `design.md`; change motivation and migration history belong to `proposal.md`.

**Element Contract Semantics**

- An Element Contract SHALL express completely the responsibilities, guarantees, constraints, and behavior the host Element carries at its own abstraction level; children may further refine or jointly fulfill those commitments, and a parent and its children may each express the complete semantics they cover at their respective levels.
- A Requirement SHALL express one independently evolvable normative commitment under a stable identity. Its boundary is whether that commitment can be added, modified, or removed on its own; do not split mechanically by sentence, clause, `SHALL` count, or target Requirement count. Content that only restates the Declaration definition or the union of sibling Requirements without adding a normative commitment does not form a Requirement; independent invariants, ordering, atomicity, consistency, or completion conditions are preserved.
- A Scenario SHALL be a normatively binding component of a Requirement, concretizing only the host Requirement's observable behavior under specific conditions, and MUST NOT introduce an independently evolvable commitment. Scenarios do not by default exhaust every applicable case of a Requirement, a Scenario is not an independent Semantic Delta Entry, and its change is expressed by the complete target content of the host Requirement.
- A Scenario SHALL NOT prescribe implementation structure, document formatting, explanatory wording, heading order, or test splitting, unless that exact representation is itself an observable contract. Scenario count does not determine the number of persistent tests.

**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run `xirang config project --json` and read the normalized `decomposition` selection from its JSON output. Do not inspect or reinterpret the raw config.
- Before forming an Element hierarchy, read the guidance file at the path resolved from the normalized `decomposition` value in full. Do not inspect or reinterpret the raw config, and do not substitute another method. When that file is missing or unreadable, stop hierarchy formation and ask the user once.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | `PROPOSE` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, tasks, and the four-partition Semantic Delta units in .xirang/changes/<name>/ |
| **Forbidden** | Implement code, directly modify project files outside the selected change directory; the only external write is post-gate `framing consume` for the explicit reviewed source |

## Confirmed design inputs

MUST read `.xirang/references/xirang-definition-framing.md` when a record is available, before compiling it. Re-read on resume, record changes, and before source handoff; use its authorization, conflict, and reload protocol rather than reconstructing it. Propose MUST NOT create, update, rename, or discard records. If conflict resolution or drift requires a record revision, stop and return to Explore; its revised identity/version handoff must be rechecked before continuing. The shared protocol does not expand this stage boundary. A record is formation evidence, not a complete Semantic Delta. With no record, require the source to declare its record decision before compiling: an explicit user-granted exemption or a stated absence of normative content. An undeclared absence is a blocker, not an ordinary path, and MUST NOT be treated as an implicit exemption.

## Flow

1. Resolve a provisional kebab-case change ID. Ask one focused question when the requested change itself is unclear. Report status only at readiness, blocker, and final-summary points; do not emit per-artifact progress updates.
2. Gather read-only evidence before any write.
   - Run `xirang list --json` and inspect relevant existing change artifacts when present.
   - Run `xirang framing list --json`. Select a relevant Change-context record by immutable `explorationId`, then run `xirang framing show <explorationId> --json`, `xirang framing status <explorationId> --json`, and `xirang framing validate <explorationId> --json`. Read the complete current payload and retain `sourceVersion`; do not reconstruct it from Summary. Apply the shared reload/conflict gate to the record, Summary, and current context. Unresolved conflicts block Formation. A changed record invalidates affected Summary and coverage conclusions until reconciled and reconfirmed.
   - Load the formal Xirang Semantic Model through the shared context above.
   - Run `xirang arch search <query> --json` to locate the Elements a request touches.
   - For known or affected Elements, run `xirang arch impact <identities...> --depth 2 --json` to discover structural and Relationship context, then run one batch `xirang arch query <selected-identities...> --contract --json` for the selected complete semantics.
   - Use implementation evidence only where needed to resolve current behavior or lowering constraints.
3. Assess semantic readiness.
   - Reuse a confirmed, still-current `Design Summary` when the conversation contains one, and state that it is being reused. Route architecture decisions to proposal Architecture Source, `design.md`, and the Declaration, Relationship, Metamodel, and View Delta units; route testing strategy to `design.md` and concrete test work to `tasks.md`; route risk and trade-off decisions to `design.md`.
   - Otherwise require a clear problem, impact scope, approach, verification method, and no unresolved Semantic Delta decisions across Definition, Contract, or structural scope. Multi-subsystem scope is evidence, not an automatic Explore requirement; report a gap only when it cannot form one coherent change scope.
   - If readiness is incomplete, list the concrete missing items, recommend `/skill:xirang-explore`, and stop: do not create a change directory or modify project files.
   - If the user explicitly overrides the readiness recommendation, continue, but the override does not authorize guessing source decisions. Ask one focused question at a time for every unresolved behavior or architecture decision.
   - For an existing change, assess readiness from existing artifacts, current input, the confirmed Design Summary, formal source, and implementation evidence together.
   - Keep readiness, missing-item, and override state in the conversation only; do not copy it into change artifacts.
4. Resolve change identity after readiness passes or is explicitly overridden.
   - If the user explicitly requests a new change and the ID is unused, run `xirang new change "<name>"`.
   - If the user explicitly requests a new change and the ID already exists, stop and ask for a different ID. Do not overwrite, continue, or synthesize an alternative ID.
   - If the user explicitly requests an existing change, update that change in place without asking for another ID.
   - If intent is ambiguous and the ID exists, ask whether to update the existing change or create an independent new change; in non-interactive mode, fail and request an explicit choice.
   - Run `xirang status --change "<name>" --json` for `applyRequires`, artifact order, dependencies, and schema.
5. Determine source impact before writing `proposal.md`.
   - Compare requested observable behavior with formal Element Contracts. Reuse the Element whose Contract already governs the behavior; add a Contract to another Element only for genuinely new observable behavior. An optional-contract Element without a Contract does not by itself require a new one.
   - Compare structural impact with the formal Xirang Semantic Model. Identify affected Element Declarations, refinement, Relationships, Element Kinds, Relationship Kinds, and Authored Views. For every added or modified Declaration, write the complete target Definition, not a summary of what changed. Implementation movement or call/import evidence alone is not a structural change.
   - Do not redo confirmed structural decisions. A partial record leaves room for unconfirmed structure: when source impact requires a new or reorganized hierarchy, apply the Structural Decomposition Guidance to the unresolved scope before deciding target sibling sets. If the configured guidance is unavailable or insufficient, stop Formation and ask one focused question; do not fall back to another method or infer structure from implementation layout.
   - Compile normative confirmations into the appropriate complete Delta targets, preserving conditions, numbers, exceptions, and timing; retain informative material in Plan or provenance without inventing obligations. Confirm no-op when current semantics already satisfy an entry. Missing behavior belongs in the host Contract, not Tasks.
   - When Architecture Source is `None`, do not invoke decomposition guidance or invent hierarchy changes.
   - Determine the Contract and structural scopes of one Semantic Delta. Keep the compatible `Behavior Source` and `Architecture Source` proposal headings: `Behavior Source` lists `New Specs` or `Modified Specs` as the Element identities whose Element Contract is added or modified, and `Architecture Source` lists the identities whose Declaration, Relationship, Metamodel, or View semantics change. Both sections address the same identity space; they separate Contract impact from structural impact, not two kinds of identifier. Use `None` only when that scope truly does not change.
6. Generate ready artifacts in dependency order. For each artifact, run `xirang instructions <artifact-id> --change "<name>" --json`.
   - For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into artifacts.
   - For `proposal.md`, write `## Source Impact` with the compatible Behavior Source and Architecture Source sections, referencing Elements by `identity`.
   - When creating `specs`, write the Element Contract delta into `.xirang/changes/<name>/elements/<identity>.md` for exactly the identities declared under proposal `Behavior Source`; the frontmatter locates the host Element and the body carries the Requirement Entries. Read the exact Requirement titles from the formal Element Contract before authoring ADDED, MODIFIED, or REMOVED deltas. Express a rename as REMOVED old Requirement plus ADDED new complete Requirement. Author only canonical unlabeled `#### Scenario: <title>` headings. Rely on combined change validation for deterministic header compatibility. Follow the returned Specs authoring contract.
   - Route obsolete-test rationale from **Test Maintenance** to `design.md` and concrete test updates/removals to `tasks.md`. Route **One-time Verification** items to evidence-only `tasks.md` Checks with no persistent test file; absence assertions use `Verifies: <path> REMOVED Requirement`.
7. Continue until all `applyRequires` artifacts are done. If an Element's concept identity, independent modeling reason, scope, or hierarchy boundary remains unresolved, stop and ask one focused question instead of guessing the Definition. Ask one focused question when any other artifact decision remains unresolved.
8. After Specs and Design are complete, reconcile structural scope before writing the remaining Delta units.
   - Re-read proposal Architecture Source, `design.md`, the formal Xirang Semantic Model, and current implementation evidence.
   - If Design confirms a different structural impact across Declarations, refinement, Relationships, Kinds, or Views, update only proposal `Architecture Source` to declare final scope.
   - Write each affected Entry into its partition under `.xirang/changes/<name>/`: `elements/<identity>.md` frontmatter for a Declaration Entry, `relationships/<relationship kind identity>.yaml` for `{operation, source, kind, target}` entries, `metamodel/<kind identity>.md` for Kind Entries, and `views/<view identity>.md` for Authored View Entries. Every Entry carries `operation` and its complete target state; `REMOVED` carries identity only; `relationships/` has no `MODIFIED`.
   - If Architecture Source is `None`, leave those partitions empty; do not invent structural changes from Contract changes alone.
   - Validate the Expected Semantic Model with `xirang arch validate --change "<name>" --json` and fix all errors before continuing.
9. Check compilation scaffolding before semantic-source validation.
   - Run `xirang instructions proposal --change "<name>" --json` and `xirang instructions design --change "<name>" --json`; compare each file with its current resolved definition and template.
   - Run `xirang instructions tasks --change "<name>" --json`. Support Actions and coarse `### Task N:`, Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local `Verifies:` Element unit paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Apply Test Quality Guidance when compiling verification work. A Check is an evidence unit, not necessarily one test case. Group Scenarios that represent one observable behavior and failure reason into one Check. Do not create Checks solely to match Scenario count. Prefer modifying an existing test over adding a parallel test for the same behavior. Each Check SHALL declare Test action: reuse, modify, add, delete, or one-time. Route non-persistent evidence to one-time Checks without a test file. Task structure validation is owned by step 10's combined validation as a deterministic operation.
   - Make implementation work and dependencies concrete using Contract references, not a second behavior specification. Keep prompt source, managed projection, and its behavioral checks in the same loop as the behavior they deliver.
   - Before ready-for-apply, cross-check Goals, Files, Requirements, and Checks as independently implementable and verifiable end-to-end loops. Production code, configuration, generated surfaces, and tests that jointly deliver one behavior MUST remain in one task. Split only when each task reaches its own GREEN independently, or when it depends only on an earlier task that is already GREEN; a task's RED/GREEN cycle MUST NOT depend on a later task. Do not split tasks by component, module, directory, file type, Requirement count, or Scenario count. When a later task is required for GREEN, Checks are split 1:1 with Scenarios, or persistent tests only lock wording or cannot catch a real behavior mutation, reconcile those Checks and task boundaries before declaring the Change ready for Apply.
10. Run the closing consistency gate: first the plan consistency review, then the deterministic validation.
    - First review plan consistency: recheck `tasks.md` for semantic contradictions against the change-local Contracts, `design.md`, and the Semantic Delta. Fix the artifacts yourself when they contradict each other; when a contradiction reflects misalignment with user intent or a confirmed decision, present all findings at once and wait for the user to rule.
    - Perform two Agent coverage checks: record → Expected Semantic Model, then target semantics → implementation tasks and observable Checks. Compare against the actual current record, not merely agreement among Delta, design, and tasks: shared omissions still block completion. A valid Requirement/Scenario reference does not prove its command verifies the behavior. Repair missing normative detail in the Contract first, then reconcile Plan and Checks; ask the user when intent remains unresolved. Do not duplicate a permanent coverage ledger.
    - The first check is entry by entry against the record's own identities, not a narrative judgement. Walk every normative entry and mark each one placed in a Declaration, Contract, Relationship, or Metamodel target, or report it uncovered with the reason. An entry left unmarked counts as uncovered and blocks ready-for-apply. State the count of entries checked and the uncovered identities explicitly. When the source is an exemption or carries no normative content, state that instead of reporting a passing check by silence.
    - The second check stays outcome-oriented: every normative entry already placed in the target model must have a task and an observable Check that can falsify it, and no Check may exist without a target behavior behind it.
    - Then run the deterministic validation on the final artifacts after user rulings: `xirang validate --change "<name>" --json`, which owns combined validation, effective-diff review, and task structure validation. Do NOT run `xirang sync`.
    - Errors from deterministic validation or the scaffolding checks block ready-for-apply. Fix at most one round and recheck once; remaining errors stay blocking.
    - WARNING does not block ready-for-apply; retain it for the final summary.
11. Complete source handoff only when a confirmed design record exists.
    - Reload with `xirang framing show <explorationId> --json`, `xirang framing status <explorationId> --json`, and `xirang framing validate <explorationId> --json`. Changed source or relevant drift requires renewed conflict/coverage checks; do not hand off an old reviewed version.
    - After both coverage checks and combined Change validation succeed, run `xirang framing consume <explorationId> --change "<name>" --source-version <sourceVersion> --json`. The CLI rechecks source version, context, and target validation, not natural-language coverage. It freezes exact bytes at `.xirang/changes/<name>/framing-source.md` before removing the active source. Any failure blocks Formation; preserve source and existing destination and follow the shared recovery protocol.
    - Check the returned target and source cleanup. The frozen `framing-source.md` records Formation history only; do not parse it as a later semantic source or use it in Sync or Change Closure.
    - With no record, do not treat the source as covered by default. Require the Design Summary or current input to declare the record decision: an explicit user-granted exemption, or an absence of normative content. If neither is declared, stop Formation and return to Explore for the missing decision instead of compiling and consuming. Do not create an empty record.
12. Finish with `xirang status --change "<name>"`. Summarize artifacts created or updated, validation errors and warnings, and readiness for `/skill:xirang-apply-change`. Do NOT generate a presentation artifact or run a separate Diff command.

## Artifact Contract

**Document Language Contract**:
- Treat `.xirang/config.yaml` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes `proseLanguage`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow `proseLanguage`
- If no `proseLanguage` projection is present, keep the default writing behavior for prose

Keep tasks coarse and aligned to TDD closure: each `### Task N:` is one independently implementable and verifiable end-to-end loop with one `Goal`, `Files`, no more than 5 high-level `Requirements`, and nested Checks. Preserve canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.
