---
name: "openspec-apply-change"
description: "Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks."
license: "MIT"
compatibility: "Requires openspec CLI."
metadata:
  author: "openspec"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.1"
---

Implement tasks from an OpenSpec change.

**OPSX Compilation Philosophy**:
OpenSpec treats human intent → running code as a compilation pipeline: change artifacts (proposal/specs/design/tasks) are the source code; the agent is the compiler; `openspec validate` is static analysis; verify Phase 1 (reviewer) is the semantic-check pass; verify Phase 2 (optimizer) is the optimization pass; sync + archive is linking and release; OPSX YAML is the symbol table and module graph; snack is decompilation. Rules that follow:
1. Artifacts are source code and MUST be elegant: every sentence is consumed downstream; redundant restatement is a code smell — state each fact exactly once.
2. Complete = faithful + elicited: key decisions the user never stated are undefined behavior in the source, and implementations deviate exactly in those silent gaps. Make them explicit — ask, or record them as explicit assumptions. Never guess silently.
3. Faithful translation: a compiler MUST NOT invent instructions. Do not exceed or deviate from specs; behavior not covered by specs goes back into specs first.
4. Syntax is contract: keep canonical headings, IDs, schema keys, and normative keywords verbatim, or downstream parsers fail.
5. No dead-code output: no placeholders, no empty template sections, no repeated narration — content either carries intent or does not exist.
6. Not compiled until gates pass: validate/verify/seal are pipeline stages, not optional extras.
A single compilation is faithful and deterministic; the source itself iterates freely and recompiles fast.

## Flow Outline

1. Step 1: Preparation — read `openspec/references/openspec-apply-step-1-preparation.md`.
2. Step 2: Pre-flight scan — read `openspec/references/openspec-apply-step-2-preflight-scan.md`.
3. Step 3: Branch isolation — read `openspec/references/openspec-apply-step-3-branch-isolation.md`.
4. Execute tasks with the implementation discipline below.
5. Step 4: Phase 1 verification — read `openspec/references/openspec-apply-step-4-phase1-verification.md` and delegate to the clean-context `openspec-reviewer` agent.
6. Step 5: Phase 2 optimization — read `openspec/references/openspec-apply-step-5-phase2-optimization.md` and delegate to the clean-context `openspec-optimizer` agent when eligible.
7. Step 6: Phase 3 seal — read `openspec/references/openspec-apply-step-6-phase3-seal.md`.
8. Step 7: Output — read `openspec/references/openspec-apply-step-7-output.md`.

## Implementation Discipline

- Write or update targeted tests before behavior/code changes.
- Verify the expected failure before implementation, then rerun the same check after the minimal fix.
- Prefer deletion, standard library, native platform support, installed dependencies, and direct expressions before adding new code.
- Do not add abstractions, dependencies, or files unless the spec or failing test requires them.
- Exercise public behavior; mock only system boundaries injected through parameters.
- Preserve canonical artifact headings, schema keys, IDs, commands, and template tokens exactly.
- Treat failures as recovery feedback: read the full error, isolate the layer, compare a working pattern, state one hypothesis, change one variable, and rerun the same check.
- Pause after repeated identical failures or three failed fix attempts.

When Phase 3 seal passes, end with an explicit call-to-action: `Archive ready. Run /skill:openspec-archive-change <change-name> to complete the workflow.`
