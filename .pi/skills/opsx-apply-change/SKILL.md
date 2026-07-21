---
name: "opsx-apply-change"
description: "Implement tasks from an OPSX change. Use when the user wants to start implementing, continue implementation, or work through tasks."
license: "MIT"
compatibility: "Requires opsx CLI."
metadata:
  author: "opsx"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.5"
---

Implement tasks from an OPSX change.

**OPSX Philosophy**

OPSX is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and LikeC4 jointly form the durable semantic source. Specs define observable behavior; LikeC4 defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

For workflow-managed writes, read the resolved file definition before its instruction and template, and MUST NOT copy definitions, config projections, or reasoning into artifacts.

## Flow Outline

1. Step 1: Preparation — read `.opsx/references/opsx-apply-step-1-preparation.md`.
2. Step 2: Pre-flight scan — read `.opsx/references/opsx-apply-step-2-preflight-scan.md`.
3. Step 3: Isolation router — read the one method reference selected by Step 1; do not load mutually exclusive methods.
4. Phase 0 implementation — Master executes pending tasks serially with the implementation discipline below.
5. Step 4: Phase 1 verification — read `.opsx/references/opsx-apply-step-4-phase1-verification.md` and delegate to the clean-context `opsx-reviewer` agent.
6. Step 5: Phase 2 optimization — read `.opsx/references/opsx-apply-step-5-phase2-optimization.md` and delegate to the clean-context `opsx-optimizer` agent when eligible.
7. Step 6: Phase 3 seal — read `.opsx/references/opsx-apply-step-6-phase3-seal.md`.
8. Step 7: Output — read `.opsx/references/opsx-apply-step-7-output.md`.

## Implementation Discipline

- Before implementation, run `opsx arch query <capability-id> --relations --depth 2`, then read referenced specs and current code. In pseudocode, a LikeC4 element ID uses `domain_name.capability_name`; treat it as semantic location guidance, not a source path.
- Process unfinished `## Remediation` `[code_fix]` and `[artifact_fix]` items before pending tasks. Finish every Check in the current task before starting the next; never execute tasks in parallel.
- Assess interface testability before writing tests for each behavior/code Check: inject external dependencies, prefer returned results over hidden side effects, and keep the public interface minimal.
- Write or update a targeted test first. Exercise public behavior; mock only injected system boundaries, never internal collaborators.
- Run the declared or equivalent targeted command and confirm the expected RED before implementation; make the minimal fix, then rerun the same check for GREEN.
- Non-runtime text/artifact Checks do not require an artificial RED; run their declared command or inspect `Evidence:` and `Expect:` for final proof.
- Prefer deletion, standard library, native platform support, installed dependencies, direct expressions, then minimal new code. Add no abstraction, dependency, or file unless required.
- Update Check and remediation checkboxes only after their evidence passes. Preserve canonical headings, schema keys, IDs, commands, template tokens, and document-language projection.
- For unexpected failures, read the full error, classify the layer, compare a working pattern, state one hypothesis, change one variable, and rerun the same check. Pause after two consecutive identical normalized errors or three failed fixes in one task.

When Phase 3 seal passes, end with an explicit call-to-action: `Archive ready. Run /skill:opsx-archive-change <change-name> to complete the workflow.`
