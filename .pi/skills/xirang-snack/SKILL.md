---
name: "xirang-snack"
description: "Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + specs + simplified design + architecture delta using available code-change evidence. Use after iterative coding to back-fill Xirang artifacts without redoing propose→apply. Does not generate tasks.md."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.0.1"
---

Reconcile Xirang artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model consists of LikeC4 graph modules and element-owned Markdown contract modules; they are source modules of the same model, not two parallel sources.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

Treat `proposal.md`, `design.md`, `specs/*/spec.md`, and `architecture-delta.c4` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional `<change-name>` (kebab-case).
- If omitted, run `xirang list --json` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If `.xirang/changes/<name>/` does not exist, run `xirang new change "<name>"` and create only artifacts required by evidence.
   - Otherwise read current proposal, design, Specs, and architecture delta; classify each as **missing**, **stale**, **inconsistent**, or **current** and preserve unrelated human-authored content.
2. Load the shared Xirang Semantic Model context.
**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the LikeC4 graph modules under `.xirang/architecture/` and locate the unique Project Root element.
- Use stable `elementId` as canonical identity. FQN is the current source navigation path and may change when an element moves.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- Use `xirang list --specs --json` as the Element Contract registry; each Spec has one singular element owner binding.
- Use `xirang arch query <elementId> --relations --depth <n> --json` for parent, children, owned Specs, and incoming/outgoing semantic relationships.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, binding, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.
3. Collect code-change evidence from conversation context plus `git diff --cached`, `git diff HEAD`, other available working-tree/staged diffs, and user-selected commit/range diffs. `git diff` is one evidence source among several and MUST NOT be treated as the only valid source. Treat natural-language commit/range selectors as agent-parsed evidence selectors, not Xirang CLI flags. Mark conflicts or uncertainty `[REVIEW NEEDED]`.
4. Map changed symbols/files to current Semantic Model context.
   - Use stable `elementId` values, current FQNs, refinement, Element Contracts, and relationships.
   - CodeGraph MAY accelerate symbol/call/import discovery; otherwise use ACE, `rg`, and `read`. Never read `.codegraph/codegraph.db`.
   - Treat code locations and call/import edges as implementation evidence, not as proof that the Xirang Semantic Model must change. Do not create elements from uncertain file-name inference.
5. Determine Element Contract impact.
   - Run `xirang list --specs --json` and keep each Spec ID with its singular owner binding from the Element Contract registry.
   - Add an existing Spec ID to **Modified Specs** only when its observable requirements change. Add a **New Spec** only for genuinely new observable behavior not governed by an existing Spec.
   - An optional-contract element without a registered Spec does not by itself require a New Spec; mark missing coverage `[REVIEW NEEDED]`.
   - Behavior-preserving refactors create no contract module delta; later Checks use `Preserves:` against formal Specs.
6. Determine graph impact.
   - Declare impact only when elements, refinement, contracts, or relationships change.
   - Implementation-only movement, symbol renaming, helper extraction, and mechanical call/import changes do not by themselves change the graph modules.
   - If no graph fact changes, set the compatible Architecture Source module scope to `None`. If impact remains unresolved, stop and ask one focused question; do not write `architecture-delta.c4` or claim reconciliation complete.
7. Reconcile the contract and graph module scopes as one Semantic Delta; keep Spec IDs distinct from stable `elementId` values.
8. Reconcile `proposal.md`.
   - Run `xirang instructions proposal --change "<name>" --json`. For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into the artifact.
   - Reconcile `## Source Impact` from the contract and graph module scopes of one Semantic Delta. Keep the compatible Behavior Source and Architecture Source headings, Spec IDs, and stable `elementId` values distinct.
   - Reuse the confirmed contract module scope as the delta Spec input; preserve `## Why`, `## What Changes`, `## Source Impact`, and `## Impact`.
   - If the proposal already matches evidence and source impact, leave it unchanged.
9. Reconcile delta Specs in `specs/<spec-id>/spec.md`.
   - Run `xirang instructions specs --change "<name>" --json`. For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into the artifact.
   - Create or update only Specs declared by the contract module scope. Do not derive the directory name directly from an element FQN or `elementId`.
   - Follow returned `## ADDED Requirements`, `## MODIFIED Requirements`, and `## REMOVED Requirements` rules with exact title matching and canonical unlabeled Requirement/Scenario syntax. Express a rename as REMOVED old Requirement plus ADDED new complete Requirement. Preserve unrelated current delta content.
10. Reconcile simplified `design.md`.
   - Run `xirang instructions design --change "<name>" --json`. For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into the artifact.
   - Preserve Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs. Mark inferred content `[INFERRED FROM CODE]` and unresolved decisions `[REVIEW NEEDED]`.
11. Reconcile `architecture-delta.c4` only after graph impact is resolved. Omit the file when the graph modules are confirmed unchanged; author a validated LikeC4 delta otherwise.
   **Generate architecture-delta.c4**:
- Before writing, follow the authoring order in the returned `instruction`; keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs
- Read proposal `Source Impact` as compatible scaffolding for one Semantic Delta; use it to locate affected elements, refinement, Element Contracts, and relationships
- Read completed change-local Element Contracts as target contract context, `design.md` for architecture decisions, and the formal Xirang Semantic Model as current semantic state
- Treat proposal entries as scope declarations, not authoritative LikeC4 records; derive exact target-state elements, refinement, contract bindings, and typed relationships
- Read `.xirang/references/likec4-authoring.md`
- Extend existing elements by current FQN and preserve stable `elementId` metadata
- Express abstraction/refinement by nesting and collaboration with typed syntax such as `source -[invokes]-> target`
- Bind each change-local Spec to exactly one stable `elementId` through singular frontmatter
- If the graph module scope is `None`, omit `architecture-delta.c4`; do not invent graph changes from contract changes alone
- Run `xirang arch validate --delta .xirang/changes/<name>/architecture-delta.c4`
- Use current code only as implementation evidence; it MUST NOT override the Xirang Semantic Model
   - Distinguish delta Spec Markdown headings from LikeC4 model declarations and typed relations.
12. Do NOT generate `tasks.md` (code is already implemented).
13. Run `xirang validate --change "<name>" --json`. On ERROR/WARNING, repair once from artifact instructions, validate once more, and report the final result.
14. After validation passes, run `xirang diff --change "<name>" --write`. Treat `.xirang/changes/<name>/effective-change.md` as the only persistent effective-change report and require its status to be Passed before claiming reconciliation complete.
15. Finish with the output hints.

## Output Hints

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: `xirang sync "<change-name>" --no-verify`
2. **Quick archive**: `xirang archive "<change-name>" --no-verify`
3. **Sync and archive**: `xirang sync "<change-name>" --no-verify && xirang archive "<change-name>" --no-verify`
4. **Continue development**: review change → modify code → run `/skill:xirang-snack` again → continue iterating

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

Preserve canonical headings, IDs, schema keys, BDD keywords, paths, commands, and code identifiers.
