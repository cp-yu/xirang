---
name: "openspec-snack"
description: "Quick code-first artifact reconciliation: from already-written code, conditionally create or update proposal + specs + simplified design + OPSX delta using available code-change evidence. Use after iterative coding to back-fill OpenSpec artifacts without redoing propose→apply. Does not generate tasks.md."
license: "MIT"
compatibility: "Requires openspec CLI."
metadata:
  author: "openspec"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.1"
---

Reconcile OpenSpec artifacts from already-written code (code-first artifact reconciliation, reverse of propose/apply).

**OPSX Compilation Philosophy**:
OpenSpec treats human intent → running code as a compilation pipeline: change artifacts (proposal/specs/design/tasks) are the source code; the agent is the compiler; `openspec validate` is static analysis; verify Phase 1 (reviewer) is the semantic-check pass; verify Phase 2 (optimizer) is the optimization pass; sync + archive is linking and release; OPSX YAML is the symbol table and module graph; snack is decompilation. Rules that follow:
1. Artifacts are source code and MUST be elegant: every sentence is consumed downstream; redundant restatement is a code smell — state each fact exactly once.
2. Complete = faithful + elicited: key decisions the user never stated are undefined behavior in the source, and implementations deviate exactly in those silent gaps. Make them explicit — ask, or record them as explicit assumptions. Never guess silently.
3. Faithful translation: a compiler MUST NOT invent instructions. Do not exceed or deviate from specs; behavior not covered by specs goes back into specs first.
4. Syntax is contract: keep canonical headings, IDs, schema keys, and normative keywords verbatim, or downstream parsers fail.
5. No dead-code output: no placeholders, no empty template sections, no repeated narration — content either carries intent or does not exist.
6. Not compiled until gates pass: validate/verify/seal are pipeline stages, not optional extras.
A single compilation is faithful and deterministic; the source itself iterates freely and recompiles fast.

snack performs artifact reconciliation, not unconditional regeneration. Treat `proposal.md`, `design.md`, `specs/*/spec.md`, and `opsx-delta.yaml` as conditional artifacts: create them when missing, update them when stale or inconsistent, and leave them unchanged when current.

## Input

- Optional `<change-name>` (kebab-case).
- If omitted, run `openspec list --json` and reuse the single active change; if multiple or none, ask which change name to target.

## Flow

1. Resolve change name and reconcile mode.
   - If `openspec/changes/<name>/` does not exist (no matching change), run `openspec new change "<name>"`, then create only the artifacts required by the evidence.
   - If the change already exists (existing change, possibly stale), read its current `proposal.md`, `design.md`, `specs/`, and `opsx-delta.yaml` before writing anything; do not recreate a valid proposal.
   - Classify each artifact as **missing**, **stale**, **inconsistent**, or **current** against the collected evidence, and reconcile only the missing, stale, or inconsistent ones.
2. Load shared OPSX context before generating artifacts.
Before reading other context files, check whether `openspec/project.opsx.yaml` exists.
- If it exists, read it first for domains → capabilities structure
- Read the `project:` block for project intent and scope
- Treat it as navigation context, not as a replacement for change artifacts
3. Collect code-change evidence from all available sources (conversation-guided union).
   - Use conversation context to guide scope and intent; treat code evidence as concrete file and behavior facts.
   - Collect changed files and symbol-level changes from applicable git commands: `git diff --name-only`, `git diff`, `git diff --cached --name-only`, `git diff --cached`, `git diff HEAD --name-only`, and `git diff HEAD`.
   - `git diff` is one evidence source among several; it MUST NOT be treated as the only valid source.
   - A user-specified commit, commit range, or branch range given in natural language is an agent-parsed evidence selector (e.g. `git diff <range> --name-only`), not a formal OpenSpec CLI flag.
   - Exclude non-code files (`.md`, `.json`, `.yaml`, lock files) from spec inference.
   - Mark conflicts or uncertain mappings with `[REVIEW NEEDED]`.
4. Reverse-map files to capabilities via code-map.
   - Read `openspec/project.opsx.code-map.yaml` and map each modified path to its capability/domain node IDs.
   - Files without a code-map entry are [REVIEW NEEDED] candidates for new capabilities.
5. Map capabilities to existing specs via spec registry.
   - Run `openspec list --specs --json` to get all specs with their `capabilities` field.
   - For each capability ID from step 4 code-map reverse lookup:
     - If the capability ID appears in any spec's `capabilities` array → mark as **Modified Capability** and record the spec directory name.
     - If no existing spec covers it → mark as **New Capability**.
   - Use this mapping when reconciling the proposal's `## Capabilities` section.
6. Use CLI-backed OPSX navigation after code-map reverse lookup.
After reading shared `project.opsx.yaml` context, use OpenSpec CLI query surfaces for node details.
- Run `openspec list --specs --json` to get specs and their `capabilities` string arrays; specs without frontmatter return `capabilities: []`.
- For known or affected OPSX node IDs, run `openspec opsx query <node-id...> --json` to get node details, relations and code-map refs in one batch; add `--depth 2` when broader related context is needed.
- Treat CLI output as navigation context, not as a replacement for change artifacts.
7. Reconcile `proposal.md`.
   - Run `openspec instructions proposal --change "<name>" --json`.
   - Use the returned `template`, `instruction`, `outputPath`, and `configProjection`; do not invent non-template sections.
   - Determine the `## Capabilities` list before specs generation and reuse the same list as specs input.
   - Prefer code-map reverse lookup; files without code-map coverage may use evidence inference but MUST be marked `[REVIEW NEEDED]`.
   - Preserve the template headings including `## Why`, `## What Changes`, `## Capabilities`, and `## Impact`.
   - If an existing proposal already matches the evidence and capability mapping, leave it current and report that no reconciliation was needed.
8. Reconcile delta specs in `specs/<capability>/spec.md`.
   - Run `openspec instructions specs --change "<name>" --json`.
   - Use the returned `template`, `instruction`, `outputPath`, and `configProjection`; do not invent non-template sections.
   - Follow the returned `instruction` for ADDED/MODIFIED selection, spec directory naming, and MODIFIED requirement title matching.
   - Reuse an existing `openspec/specs/<capability>/` directory when the instruction says it applies; otherwise use the proposal capability name.
   - New concerns use `## ADDED Requirements`; changed existing behavior uses `## MODIFIED Requirements` with the exact existing Requirement title.
   - Requirement text MUST contain SHALL/MUST language and at least one `#### Scenario:` block with WHEN/THEN style.
   - Do not author scenario operation labels during reconciliation; they are generated only after final validation by the explicit CLI step below and remain change-local review metadata.
   - Preserve unrelated existing delta requirements unless the evidence makes them stale or inconsistent.
   - Mark uncertain inferences with `[REVIEW NEEDED]`.
9. Reconcile simplified `design.md`.
   - Run `openspec instructions design --change "<name>" --json`.
   - Use the returned `template`, `instruction`, `outputPath`, and `configProjection`; do not invent non-template sections.
   - Preserve the full template skeleton: Context, Goals / Non-Goals, Decisions, and Risks / Trade-offs.
   - Mark inferred content with `[INFERRED FROM CODE]`; mark unresolved risks or trade-offs with `[REVIEW NEEDED]`.
   - If an existing design is current against the evidence, leave unrelated design content unchanged and report that no reconciliation was needed.
10. Reconcile `opsx-delta.yaml` ONLY when evidence shows new/deleted exports or new files; otherwise skip and log "No architecture-level changes detected. Skipping OPSX delta reconciliation".
   **Generate opsx-delta.yaml**:
- Read `openspec instructions opsx-delta --change "<name>" --json`
- Use the returned `template`, `instruction`, and `outputPath` to generate `opsx-delta.yaml`
- Read `proposal.md` to extract the capability list
- Read all delta specs in `openspec/changes/<name>/specs/*/spec.md`
- For existing capability or domain IDs, run `openspec opsx query <node-id...> --json` for current-system context in one batch; add `--depth 2` when related context is needed
- Treat `ADDED`, `MODIFIED`, and `REMOVED` as YAML object keys, not Markdown headings
- Follow a concrete YAML object structure such as:
  ```yaml
  schema_version: 1
  ADDED:
    capabilities:
      - id: cap.example.feature
        type: capability
        intent: Describe the new capability
    relations:
      - from: cap.example.feature
        type: contains
        to: dom.example
  MODIFIED:
    capabilities:
      - id: cap.example.existing
        intent: Updated intent text
  REMOVED:
    capabilities:
      - id: cap.example.legacy
  ```
- Delta nodes contain only id, type, intent, status — no code_refs or spec_refs
- Keep this agent-driven: capture merge intent in the YAML, not in programmatic code
   - Distinguish delta spec Markdown headings (`## ADDED Requirements`, `## MODIFIED Requirements`) from OPSX delta YAML keys (`ADDED`, `MODIFIED`, `REMOVED`).
11. Do NOT generate `tasks.md` (code is already implemented).
12. Run `openspec validate "<name>" --type change --json` after all reconciled artifacts are written.
   - If validation returns ERROR or WARNING, run one repair pass using the relevant artifact `instruction` rules, then run `openspec validate "<name>" --type change --json` once more.
   - Treat the second validation result as final evidence.
   - Output validate result: if passed, indicate self-check passed; if ERROR/WARNING remain, list each and advise user review.
13. Run `openspec scenario-labels "<name>" --write` after validate to add deterministic change-local scenario operation labels. Treat this as trusted programmatic metadata generation and SHALL NOT run validate again only because scenario labels were added.
14. Finish with the output hints below, including the validate result.

## Output Hints

After artifacts are reconciled, output:

⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]

1. **Quick sync**: `openspec sync "<change-name>" --no-verify`
2. **Quick archive**: `openspec archive "<change-name>" --no-verify`
3. **Sync and archive**: `openspec sync "<change-name>" --no-verify && openspec archive "<change-name>" --no-verify`
4. **Continue development**: review change → modify code → run `/skill:openspec-snack` again → continue iterating

## Artifact Contract

**Document Language Contract**:
- Treat `openspec/config.yaml` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes `proseLanguage`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow `proseLanguage`
- If no `proseLanguage` projection is present, keep the default writing behavior for prose

Keep generated specs coarse and behavior-focused; preserve template headings, canonical IDs, schema keys, BDD keywords, paths, commands, and code identifiers.
