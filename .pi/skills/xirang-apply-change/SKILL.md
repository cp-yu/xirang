---
name: "xirang-apply-change"
description: "Implement tasks from an Xirang change. Use when the user wants to start implementing, continue implementation, or work through tasks."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.1.1"
---

Implement tasks from an Xirang change.

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

For workflow-managed writes, read the resolved file definition before its instruction and template, and MUST NOT copy definitions, config projections, or reasoning into artifacts.

## Flow Outline

1. Step 1: Preparation — read `.xirang/references/xirang-apply-step-1-preparation.md`.
2. Step 2: Isolation router — read the one method reference selected by Step 1; do not load mutually exclusive methods.
3. Implementation loop — process all pending tasks and Required Corrections as task-level TDD loops until they are complete; completing one task does not leave the loop.
4. [Mode: Delegate Review] Step 3: Review — only after every pending task and Required Correction is complete, read `.xirang/references/xirang-apply-step-3-review.md` and delegate to the clean-context `xirang-reviewer` agent for one change-level review of that completed state. A failed Review or Seal may return corrections to the implementation loop; after those corrections are complete, the modified Change state requires another change-level Review.
5. [Mode: Checkpoint] Step 4: Optimization — read `.xirang/references/xirang-apply-step-4-optimization.md` and delegate to the clean-context `xirang-optimizer` agent when eligible.
6. Step 5: Seal — read `.xirang/references/xirang-apply-step-5-seal.md`.
7. Step 6: Output — read `.xirang/references/xirang-apply-step-6-output.md`.

## Quality Coordinator

You are the apply coordinator, not a judge. Four roles stay separate:
- Coordinator (you): locate `changeDir` and `projectRoot`, prepare the evidence paths, delegate, validate payloads, apply write-back, manage checkpoints, and persist results through the CLI.
- `xirang-reviewer` subagent: judges completeness, correctness, coherence, and cleanliness from its own reading in a fresh context.
- `xirang-optimizer` subagent: judges whether correct code is worth improving, and supplies key design plus preservation constraints, in a fresh context.
- CLI (`xirang quality`): assigns direction IDs, enforces entry conditions and counters, persists records, and derives the terminal state.

Rules:
- You MUST NOT substitute your own completeness, correctness, or coherence judgments for the reviewer's.
- For the quality steps you only determine `changeDir`, `projectRoot`, and the evidence paths to hand over; the subagents read candidate files, git evidence, and change artifacts themselves.
- You MUST NOT read or inline the `xirang-reviewer` or `xirang-optimizer` agent artifacts; their role definitions and output contracts belong to those agents.
- Wait for a complete subagent payload before validating it. A subagent that is slow is not a failed subagent: keep waiting, and ask the user before terminating one.

## Implementation Discipline

- Before implementation, run `xirang arch impact <identity> --depth 2 --json` to discover affected identities and relationships, then run `xirang arch query <selected-identities...> --contract --json` for the explicit Elements whose Contracts and Declarations are needed; read the returned Element Contracts and current code.
- Process unfinished `## Required Corrections` `[code_fix]` and `[artifact_fix]` items before pending tasks. Each task is one TDD loop. A task is complete only after its applicable Checks have passed with the required evidence. Completing one ordinary task MUST NOT trigger a change-level Review, an optimization round, or a workflow handoff. Only after every pending task and Required Correction is complete may Apply enter a change-level Review; any subsequent Review or Seal corrections modify the Change state and require another change-level Review after recovery completes.
- Assess interface testability before writing tests for each behavior/code Check: inject external dependencies, prefer returned results over hidden side effects, and keep the public interface minimal. If the behavior is hard to test, improve the interface first.
- Inspect existing tests first and honor the declared Test action: `reuse`, `modify`, `add`, `delete`, or `one-time`. Do not default to `add` when another action is declared. Exercise public behavior; mock only injected system boundaries, never internal collaborators. Split tests only when failure reasons are independent.
- For behavior/code Checks, run the declared or equivalent targeted command and confirm evidence that the target behavior is missing, incorrect, or otherwise requires the declared change before implementation. Make the minimal implementation, then rerun the same Check and confirm GREEN. Do not manufacture RED with syntax errors, wrong paths, broken fixtures, or unrelated failures.
- For `delete` actions, first confirm that the existing behavior or implementation is the one declared for removal, perform the deletion or replacement, then rerun the declared Check and confirm the required absence or replacement behavior.
- Non-runtime text or artifact Checks do not require an artificial RED; run the declared command or inspect `Evidence:` and `Expect:` as final proof.
- Config, schema, generated template, workflow template, and agent instruction template Checks default to behavior/code Checks unless the Check explicitly proves that the edited content has no runtime or generated-surface consumer.
- Prefer deletion, standard library, native platform support, installed dependencies, direct expressions, then minimal new code. Add no abstraction, dependency, or file unless required.
- Update Check and Required Corrections checkboxes only after their declared evidence passes. Preserve canonical headings, schema keys, IDs, commands, template tokens, and document-language projection.
- For unexpected failures, read the full error, classify the layer, compare a working pattern, state one hypothesis, change one variable, and rerun the same Check. Pause after two consecutive identical normalized errors or three failed fixes in one task.

When the seal passes, end with an explicit call-to-action: `Archive ready. Run /skill:xirang-archive-change <change-name> to complete the workflow.`
