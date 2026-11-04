---
name: "xirang-archive-change"
description: "Archive a completed change in the Xirang change workflow. Use when the user wants to finalize and archive a completed change after implementation is complete."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.3"
---

Archive a completed change in the Xirang change workflow.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

For workflow-managed writes, read the resolved file definition before its instruction and template, and MUST NOT copy definitions, config projections, or reasoning into artifacts.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

Before archiving, run `xirang config project --json` and consume git policy from its normalized project config: `git.commitMessage.archive`, `git.commitMessage.merge`, `git.merge.strategy`, and `git.branch.deleteAfterArchive`; do not parse raw YAML inside the skill.

**Steps**

1. **Select change**
   If no clear change name is provided, run `xirang list --json`, show active changes with schema, and ask. Do not guess. Read `.apply-isolation.json` before running the archive CLI and retain its validated `method`, `branchName`, `originalBranch`, `worktreePath`, and `sourceRoot` values because the CLI moves the active change directory.

2. **Unified Quality Gate**
   Run `xirang quality status "<change-name>" --json`. If the user explicitly requested verification from the beginning, follow `.xirang/references/xirang-quality-recovery.md` before reusing this status, even when it reports all_done; preserve the existing workspace and history. Normal completion requires `status: "all_done"` and empty gaps, including current main conclusion and successful checkpoint. Read evidence associations and diagnostics to distinguish missing baseline/checkpoint, incomplete delegation, stale verification and uncertain recovery. Route the actual gap through Step 2.5; baseline PASS alone is not completion, and optimized-code differences alone do not require another full Review. HEAD-only changes are informational when contents and associations remain valid. Preserve unsupported legacy records and report their diagnosis; never automatically migrate/delete history. Keep the current status projection for the final summary before Archive moves the active directory: baselineReview, actual scoped reviews, delegation saves/reports, verifications with execution outputs, plans/conclusion reasons and checkpoints. The archive command does not yet provide a v2 verification-summary projection; assemble the human summary from these actual sources without relabeling main judgments as Review.

2.5. **Complete Required Quality Evidence**

   Use the standalone Apply `subagent-orchestrated` contract in the retained Apply workspace. Determine changeName, absolute changeDir/projectRoot; validate isolation through `.xirang/references/xirang-apply-step-1-preparation.md`. Preserve workspace identity, immutable baseCommit, code, commits/checkpoints and history. Report invalid workspace evidence rather than reconstructing it from HEAD.
   Read the complete shared reference for the diagnosed stage:
   - Independent Review: `.xirang/references/xirang-apply-step-3-review.md`
   - Delegation and final verification: `.xirang/references/xirang-apply-step-4-optimization.md`
   - Interruption/recovery: `.xirang/references/xirang-quality-recovery.md`
   - Actual schemas/options and diagnostics: `.xirang/references/xirang-quality-cli.md`
   - Seal: `.xirang/references/xirang-apply-step-5-seal.md`
   Inspect actual status evidence and gaps. Missing independent baseline Review requires that Review; a valid matching baseline Review with only a missing checkpoint needs the checkpoint. Unfinished/interrupted optimization continues the original delegation after the old writer stops. Missing/stale final validation requires main's reassessment and completion of affected verification. Do not force a whole-Change Review solely because optimization changed code.
   Initial optimization still requires Opt unless disabled or explicitly refused, even if Review writeback/runtime files left the workspace dirty. Final completion requires baseline Review/checkpoint, complete deliveries or explicit skip, actual successful applicable tests, main's final conclusion, every required independent Review and the current successful checkpoint. A confirmed baseline defect requires repair plus targeted independent Review. Main's no-extra-Review decision is not Reviewer PASS.
   Return ordinary implementation corrections to Apply under its existing rules. Optimization problems may be locally repaired/reversed while keeping sound work; abandoned optional attempts retain reasons, treatment and restored-state tests for user disclosure. Stop completion for unresolved correctness or recovery. Unsupported old input/records require diagnosis and main/user continuation decisions with history preserved, never automatic migration or deletion.
   Resume Archive only after the shared flow seals with all_done and no gaps. Never substitute an inline main-agent conformance review or silently omit outstanding obligations.

3. **Check artifact completion status**
   Run `xirang status --change "<name>" --json`. Warn and confirm before proceeding if any artifact is not `done`.

4. **Check task completion status**
   Read `tasks.md`; warn and confirm before proceeding if incomplete checkboxes remain. Missing tasks are not a task-related blocker.

5. **Assess delta sync state**
   If any of `.xirang/changes/<name>/{metamodel,elements,relationships,views}/` is non-empty, assess whether sync is required. The archive CLI performs the quality gate, sync, and move-to-archive; do not duplicate sync writes manually.

6. **Run archive CLI**
   Run `xirang archive "<change-name>"` after quality reports all_done without gaps and seal succeeds. CLI verifies, syncs, moves the Change and prints the git handoff reminder; it does not create commits, merge/switch/delete branches, remove worktrees or generate commit messages. Sync must preserve original test/Review execution manifests and associate only its actual deterministic model outputs; that association cannot cover unrelated implementation changes or later external edits. If model sync succeeds but quality association fails, report that partial result and resolve evidence before claiming closure. Do not manufacture an association command or rewrite old execution evidence.

7. **Git handoff**
   Read the archive CLI output and the projected git policy from `xirang config project --json`. Use the retained pre-archive quality status projection for baseline/scoped Review, delegation reports, actual verification and main conclusion evidence; do not assume the archive CLI emitted a v2 verification summary. Build the user summary with the change name, schema, actual archive location, quality and Semantic Model sync results, agent-owned git follow-up status and merge strategy.

8. **Agent git flow**
   The agent continues the post-archive git flow. First handle the implementation boundary before Xirang/docs archive artifacts. If uncommitted real project implementation changes remain, create a normal implementation commit that contains only those changes. Then always create a semantic boundary commit with `git commit --allow-empty`; this boundary commit may be intentionally empty when the effective implementation diff is already carried by retained `wip: opt-*` checkpoint commits. If `git.commitMessage.boundary` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-boundary-commit-message.md`. Use that template to build the boundary commit message and run `git commit -F -` for the boundary commit. If `git.commitMessage.archive` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-archive-commit-message.md`. Use that template before creating the Xirang/docs archive commit, add only archive/synced paths, and run `git commit -F -`. If a merge or squash commit message is needed, prepare it from the configured or built-in merge template. If `git.commitMessage.merge` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-merge-summary-message.md`.

   Apply the retained isolation metadata after archive commits are complete. Map the projected strategy to `git merge --no-ff`, `git merge --ff-only`, or `git merge --squash`. For `method: "branch"`, switch to `originalBranch`, then merge `branchName` with the projected strategy. For `method: "worktree"`, keep commits in `worktreePath`; before merging, verify that `sourceRoot` is on `originalBranch`, then run the projected merge from `sourceRoot` using `git -C <sourceRoot>`. The agent MUST NOT reset, clean, stash, or commit unrelated source-workspace changes. After a successful merge, require the Apply worktree to be clean, run `git worktree remove <worktreePath>` from `sourceRoot`, and only then delete `branchName` when `git.branch.deleteAfterArchive` is true and `git branch --merged` confirms it is merged. For `method: "none"`, do not switch, merge, remove a worktree, or delete the current branch. Stop and report the retained metadata/current state mismatch instead of guessing. Build paths with `path.join()`, `path.resolve()`, and `path.normalize()`.

9. **Display summary**
   Include change, schema, archive location, quality gate result, Semantic Model sync result, agent-owned git follow-up status, Merge Strategy and cleanup responsibility. Distinguish baseline Review, additional independent Reviews actually performed, main reasons for omitted optional Review, actual test evidence and final successful checkpoint. Disclose abandoned optimization attempts/reasons/treatment and remaining warnings. Do not report that CLI created an archive commit, performed a merge or deleted a feature branch.

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** .xirang/changes/archive/YYYY-MM-DD-<name>/
**Quality Gate:** all_done with no gaps; baseline Review, complete delivery or explicit skip, required applicable verification, main conclusion and final successful checkpoint confirmed
**Semantic Model:** ✓ Synced into `.xirang/model/`, rewriting only the units the Semantic Delta affects, all-or-nothing (or "No deltas" or "Sync gate bypassed with --no-sync")
**Agent Git Follow-up:** <completed / pending with reason>
**Merge Strategy:** <git.merge.strategy>
**Cleanup Responsibility:** <agent>

Archive completed after satisfying the unified quality gate.
```

**Guardrails**
- Always prompt for change selection if not provided
- Prioritize the standard quality gate; only pass `--no-verify` to the archive CLI when the user explicitly requests it (the CLI provides its own confirmation prompt)
- Show which baseline and scoped Review evidence was reused or newly obtained, and distinguish main-agent applicability/risk decisions from actual independent Review
- In `core`, use `xirang sync "<change-name>"` rather than manual inline sync
- If any of `.xirang/changes/<name>/{metamodel,elements,relationships,views}/` is non-empty, always run the shared sync assessment before moving the change directory
