---
name: "xirang-propose"
description: "Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.0.1"
---

Propose a new change or update an existing change, generating all artifacts needed for implementation.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model consists of LikeC4 graph modules and element-owned Markdown contract modules; they are source modules of the same model, not two parallel sources.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the LikeC4 graph modules under `.xirang/architecture/` and locate the unique Project Root element.
- Use stable `elementId` as canonical identity. FQN is the current source navigation path and may change when an element moves.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- Use `xirang list --specs --json` as the Element Contract registry; each Spec has one singular element owner binding.
- Use `xirang arch query <elementId> --relations --depth <n> --json` for parent, children, owned Specs, and incoming/outgoing semantic relationships.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, binding, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | `PROPOSE` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, specs, tasks, architecture-delta.c4 in .xirang/changes/<name>/ |
| **Forbidden** | Implement code, modify project files outside the selected change directory |

## Flow

1. Resolve a provisional kebab-case change ID. Ask one focused question when the requested change itself is unclear. Report status only at readiness, blocker, and final-summary points; do not emit per-artifact progress updates.
2. Gather read-only evidence before any write.
   - Run `xirang list --json` and inspect relevant existing change artifacts when present.
   - Load the formal Xirang Semantic Model through the shared context above.
   - Run `xirang list --specs --json`. A Spec ID identifies `.xirang/specs/<spec-id>/spec.md`; the Element Contract registry provides its singular owner binding to a stable `elementId`.
   - For known or affected elements, run `xirang arch query <elementId> --relations --depth 2 --json` and use FQN only for current source navigation.
   - Use implementation evidence only where needed to resolve current behavior or lowering constraints.
3. Assess semantic readiness.
   - Reuse a confirmed `Design Summary` when the conversation contains one, and state that it is being reused. Route architecture decisions to proposal Architecture Source, `design.md`, and `architecture-delta.c4`; route testing strategy to `design.md` and concrete test work to `tasks.md`; route risk and trade-off decisions to `design.md`.
   - Otherwise require a clear problem, impact scope, approach, verification method, and no unresolved Semantic Delta decisions across contract or graph module scope. Multi-subsystem scope is evidence, not an automatic Explore requirement; report a gap only when it cannot form one coherent change scope.
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
   - Compare requested observable behavior with formal Element Contracts. Reuse an existing Spec that owns the behavior; propose a New Spec only for genuinely new observable behavior. An optional-contract element without a registered Spec does not by itself require a New Spec.
   - Compare graph impact with the formal Xirang Semantic Model. Identify affected elements, refinement, Element Contracts, and relationships. Implementation movement or call/import evidence alone is not a graph change.
   - Determine the contract and graph module scopes of one Semantic Delta. Keep the compatible `Behavior Source` and `Architecture Source` proposal headings: the former lists `New Specs` or `Modified Specs` by Spec ID, and the latter lists stable `elementId` values. Use `None` only when that module scope truly does not change.
6. Generate ready artifacts in dependency order. For each artifact, run `xirang instructions <artifact-id> --change "<name>" --json`.
   - For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into artifacts.
   - For `proposal.md`, write `## Source Impact` with the compatible Behavior Source and Architecture Source module-scope sections. Keep Spec IDs distinct from stable `elementId` values.
   - When creating `specs`, create or modify only the Spec IDs declared under proposal `Behavior Source`. Read the exact Requirement titles from the formal Spec before authoring ADDED, MODIFIED, or REMOVED deltas. Express a rename as REMOVED old Requirement plus ADDED new complete Requirement. Author only canonical unlabeled `#### Scenario: <title>` headings. Rely on combined change validation for deterministic header compatibility. Follow the returned Specs authoring contract.
   - Route obsolete-test rationale from **Test Maintenance** to `design.md` and concrete test updates/removals to `tasks.md`. Route **One-time Verification** items to evidence-only `tasks.md` Checks with no persistent test file; absence assertions use `Verifies: <path> REMOVED Requirement`.
7. Continue until all `applyRequires` artifacts are done. Ask one focused question when an artifact decision remains unresolved.
8. After Specs and Design are complete, reconcile architecture scope before generating `architecture-delta.c4`.
   - Re-read proposal Architecture Source, `design.md`, the formal Xirang Semantic Model, and current implementation evidence.
   - If Design confirms a different graph impact across elements, refinement, contracts, or relationships, update only proposal `Architecture Source` to declare final scope.
   - Read `.xirang/references/likec4-authoring.md`. Extend an existing element by current FQN, preserve its stable `elementId`, and bind each change-local Spec through singular `element: <elementId>` frontmatter.
   - Encode semantic relationship kinds with LikeC4 kind syntax, for example `source -[invokes]-> target`; never encode a kind as a relationship title.
   - If Architecture Source is `None`, omit `architecture-delta.c4`; do not invent graph changes from contract changes alone.
   - Validate a generated delta with `xirang arch validate --delta .xirang/changes/<name>/architecture-delta.c4` and fix all errors before continuing.
9. Check compilation scaffolding before semantic-source validation.
   - Run `xirang instructions proposal --change "<name>" --json` and `xirang instructions design --change "<name>" --json`; compare each file with its current resolved definition and template.
   - Run `xirang instructions tasks --change "<name>" --json` and use deterministic `validateTaskStructure`. Support Actions and coarse `### Task N:`, Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local `Verifies:` spec paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Do NOT judge whether a check is semantically sufficient.
10. Run combined change validation exactly once with `xirang validate --change "<name>" --json`. Do NOT run `xirang sync`.
    - ERROR from either scaffolding checks or combined change validation blocks ready-for-apply. Perform at most one repair pass, re-check once, and stop with the remaining blockers if any ERROR remains.
    - WARNING does not block ready-for-apply; retain it for the final summary.
11. After validation passes, run `xirang diff --change "<name>" --write`.
    - Treat `.xirang/changes/<name>/effective-change.md` as the only persistent effective-change report.
    - Verify its recorded status is Passed and its source and target fingerprints match the validated compilation.
    - If report generation fails, keep the failed report as evidence and stop; do not claim ready-for-apply.
12. Finish with `xirang status --change "<name>"`. Summarize artifacts created or updated, validation errors and warnings, effective-change report status, and readiness for `/skill:xirang-apply-change`.

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

Keep tasks coarse: `### Task N:`, `Goal`, `Files`, `Requirements`, and nested Checks; at most 5 Requirements per task. Preserve canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.
