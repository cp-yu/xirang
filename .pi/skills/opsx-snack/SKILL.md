---
name: "opsx-snack"
description: "Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + specs + simplified design + architecture delta using available code-change evidence. Use after iterative coding to back-fill OPSX artifacts without redoing propose→apply. Does not generate tasks.md."
license: "MIT"
compatibility: "Requires opsx CLI."
metadata:
  author: "opsx"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.5"
---

Reconcile OPSX artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

**OPSX Philosophy**

OPSX is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and LikeC4 jointly form the durable semantic source. Specs define observable behavior; LikeC4 defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

Treat `proposal.md`, `design.md`, `specs/*/spec.md`, and `architecture-delta.c4` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional `<change-name>` (kebab-case).
- If omitted, run `opsx list --json` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If `.opsx/changes/<name>/` does not exist, run `opsx new change "<name>"` and create only artifacts required by evidence.
   - Otherwise read current proposal, design, Specs, and architecture delta; classify each as **missing**, **stale**, **inconsistent**, or **current** and preserve unrelated human-authored content.
2. Load shared LikeC4 context.
Before reading implementation files, load the formal LikeC4 source under `.opsx/architecture/`.
- Use `opsx arch query <element-id> --relations --depth 2` for architecture navigation
- Read linked Specs from capability metadata
- Treat code paths, imports, calls, and symbols as implementation evidence only
- Do not read legacy OPSX YAML as active architecture source
3. Collect code-change evidence from conversation context plus `git diff --cached`, `git diff HEAD`, other available working-tree/staged diffs, and user-selected commit/range diffs. `git diff` is one evidence source among several and MUST NOT be treated as the only valid source. Treat natural-language commit/range selectors as agent-parsed evidence selectors, not OPSX CLI flags. Mark conflicts or uncertainty `[REVIEW NEEDED]`.
4. Map changed symbols/files to current architecture context.
   - Use formal LikeC4 element IDs, intents, ownership, boundaries, and relations.
   - CodeGraph MAY accelerate symbol/call/import discovery; otherwise use ACE, `rg`, and `read`. Never read `.codegraph/codegraph.db`.
   - Treat code locations and call/import edges as implementation evidence, not as proof that LikeC4 must change. Do not create capabilities from uncertain file-name inference.
5. Determine Behavior Source impact.
   - Run `opsx list --specs --json` and keep each Spec ID separate from its `capabilities` string array.
   - Add an existing Spec ID to **Modified Specs** only when its observable requirements change. Add a **New Spec** only for genuinely new observable behavior not governed by an existing Spec.
   - A LikeC4 capability absent from every Spec's `capabilities` array does not by itself require a New Spec; mark missing coverage `[REVIEW NEEDED]`.
   - Behavior-preserving refactors create no delta Spec; later Checks use `Preserves:` against formal Specs.
6. Determine Architecture Source impact.
   - Declare impact only when durable capability responsibility, domain boundary, ownership, or semantic relation changes.
   - Implementation-only movement, symbol renaming, helper extraction, and mechanical call/import changes do not by themselves change LikeC4.
   - If no durable architecture fact changes, set Architecture Source to `None`. If impact remains unresolved, stop and ask one focused question; do not write `architecture-delta.c4` or claim reconciliation complete.
7. Use CLI-backed LikeC4 navigation.
Use OPSX LikeC4 query surfaces for architecture details.
- Run `opsx list --specs --json` for Spec coverage.
- Run `opsx arch query <element-id> --relations --depth 2 --json` for affected elements and directed semantic relations.
- LikeC4 element IDs are semantic locations, not source paths.
- Use CodeGraph or ACE/`rg`/`read` only for current implementation evidence.
8. Reconcile `proposal.md`.
   - Run `opsx instructions proposal --change "<name>" --json`. For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into the artifact.
   - Reconcile `## Source Impact` from independently determined Behavior Source and Architecture Source impact. Keep Spec IDs distinct from LikeC4 element IDs.
   - Reuse the confirmed Behavior Source list as the delta Spec input; preserve `## Why`, `## What Changes`, `## Source Impact`, and `## Impact`.
   - If the proposal already matches evidence and source impact, leave it unchanged.
9. Reconcile delta Specs in `specs/<spec-id>/spec.md`.
   - Run `opsx instructions specs --change "<name>" --json`. For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into the artifact.
   - Create or update only Specs declared under Behavior Source. Do not derive the directory name directly from an LikeC4 element ID.
   - Follow returned `## ADDED Requirements`, `## MODIFIED Requirements`, REMOVED/RENAMED rules, exact title matching, canonical Requirement/Scenario syntax, and label guidance. Preserve unrelated current delta content.
10. Reconcile simplified `design.md`.
   - Run `opsx instructions design --change "<name>" --json`. For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into the artifact.
   - Preserve Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs. Mark inferred content `[INFERRED FROM CODE]` and unresolved decisions `[REVIEW NEEDED]`.
11. Reconcile `architecture-delta.c4` only after Architecture Source is resolved. Omit the file when architecture is confirmed unchanged; author a validated LikeC4 delta otherwise.
   **Generate architecture-delta.c4**:
- Before writing, follow the authoring order in the returned `instruction`; keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs
- Read proposal `Source Impact`: use `Architecture Source` as declared scope and `Behavior Source` to locate related change-local Specs; Spec IDs are not LikeC4 element IDs
- Read completed change-local Specs as target behavior context, `design.md` for architecture decisions, and the formal LikeC4 model as current architecture state
- Treat proposal entries as scope declarations, not authoritative LikeC4 records; derive exact target-state elements and typed relations
- Read `.opsx/references/likec4-authoring.md`
- Extend existing domains with `extend <domain> { ... }`; define genuinely new domains directly
- Express ownership by nesting and relations with typed syntax such as `source -[invokes]-> target`
- Link new capabilities to change-local Specs paths
- If Architecture Source is `None`, omit `architecture-delta.c4`; do not invent architecture changes from behavior changes alone
- Run `opsx arch validate --delta .opsx/changes/<name>/architecture-delta.c4`
- Use current code only as implementation evidence; it MUST NOT override declared semantic source
   - Distinguish delta Spec Markdown headings from LikeC4 model declarations and typed relations.
12. Do NOT generate `tasks.md` (code is already implemented).
13. Run `opsx validate "<name>" --type change --json`. On ERROR/WARNING, repair once from artifact instructions, validate once more, and report the final result.
14. Run `opsx scenario-labels "<name>" --write` after validate to add deterministic change-local scenario operation labels. SHALL NOT run validate again only because scenario labels were added.
15. Finish with the output hints.

## Output Hints

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: `opsx sync "<change-name>" --no-verify`
2. **Quick archive**: `opsx archive "<change-name>" --no-verify`
3. **Sync and archive**: `opsx sync "<change-name>" --no-verify && opsx archive "<change-name>" --no-verify`
4. **Continue development**: review change → modify code → run `/skill:opsx-snack` again → continue iterating

## Artifact Contract

**Document Language Contract**:
- Treat `.opsx/config.yaml` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes `proseLanguage`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow `proseLanguage`
- If no `proseLanguage` projection is present, keep the default writing behavior for prose

Preserve canonical headings, IDs, schema keys, BDD keywords, paths, commands, and code identifiers.
