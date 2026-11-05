---
name: "xirang-archive-change"
description: "Archive a completed change in the Xirang change workflow. Use when the user wants to finalize and archive a completed change after implementation is complete."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.4"
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
   Require a recorded passing baseline Review, explicit Opt disposition and a successful Seal. For Archive's Quality sub-gate, the Seal commit must exist in Git; HEAD/workspace differences and Quality JSON commit status are irrelevant. Keep the current Quality status projection for the final summary. Preserve unsupported legacy records unchanged.

2.5. **Complete Required Quality Evidence**

   Review the shared Apply/Quality references only when status identifies an outstanding obligation. The baseline Review must be recorded in .quality.json and bind an existing Git commit. The main Agent records either delivered Opt opinions bound to baseCommit/resultCommit or a non-empty not_performed reason, then independently decides whether an Opt follow-up Review is needed. Only the main Agent writes Seal, declaring canRun and testsExpectedToPass for an existing commit. The CLI does not run tests, compare HEAD/workspace freshness or make these judgments. Preserve legacy Quality files unchanged. Do not run a completion review or modify the record during Archive; its Quality gate only checks that the Seal commit object exists.

3. **Check artifact completion status**
   Run `xirang status --change "<name>" --json`. Warn and confirm before proceeding if any artifact is not `done`.

4. **Check task completion status**
   Read `tasks.md`; warn and confirm before proceeding if incomplete checkboxes remain. Missing tasks are not a task-related blocker.

5. **Assess delta sync state**
   If any of `.xirang/changes/<name>/{metamodel,elements,relationships,views}/` is non-empty, assess whether sync is required. The archive CLI performs the quality gate, sync, and move-to-archive; do not duplicate sync writes manually.

6. **Run archive CLI**
   Run `xirang archive "<change-name>"` after the Seal commit exists. CLI checks the Seal commit object, performs the independent Sync/validation/task gates, moves the Change and prints the Git handoff reminder; it does not create commits, compare HEAD/workspace, alter Quality JSON, merge/switch/delete branches, or remove worktrees.

7. **Git handoff**
   Read the archive CLI output and projected Git policy from `xirang config project --json`. Use the retained Quality status for Review, Opt disposition and Seal evidence; do not infer that CLI ran tests or made a Git commit.

8. **Agent git flow**
   The agent continues the post-archive git flow. First handle the implementation boundary before Xirang/docs archive artifacts. If uncommitted real project implementation changes remain, create a normal implementation commit that contains only those changes. Then always create a semantic boundary commit with `git commit --allow-empty`; this boundary commit may be intentionally empty when the effective implementation diff is already carried by retained `wip: opt-*` checkpoint commits. If `git.commitMessage.boundary` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-boundary-commit-message.md`. Use that template to build the boundary commit message and run `git commit -F -` for the boundary commit. If `git.commitMessage.archive` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-archive-commit-message.md`. Use that template before creating the Xirang/docs archive commit, add only archive/synced paths, and run `git commit -F -`. If a merge or squash commit message is needed, prepare it from the configured or built-in merge template. If `git.commitMessage.merge` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-merge-summary-message.md`.

   Apply the retained isolation metadata after archive commits are complete. Map the projected strategy to `git merge --no-ff`, `git merge --ff-only`, or `git merge --squash`. For `method: "branch"`, switch to `originalBranch`, then merge `branchName` with the projected strategy. For `method: "worktree"`, keep commits in `worktreePath`; before merging, verify that `sourceRoot` is on `originalBranch`, then run the projected merge from `sourceRoot` using `git -C <sourceRoot>`. The agent MUST NOT reset, clean, stash, or commit unrelated source-workspace changes. After a successful merge, require the Apply worktree to be clean, run `git worktree remove <worktreePath>` from `sourceRoot`, and only then delete `branchName` when `git.branch.deleteAfterArchive` is true and `git branch --merged` confirms it is merged. For `method: "none"`, do not switch, merge, remove a worktree, or delete the current branch. Stop and report the retained metadata/current state mismatch instead of guessing. Build paths with `path.join()`, `path.resolve()`, and `path.normalize()`.

9. **Display summary**
   Include change, schema, archive location, quality gate result, Semantic Model sync result, agent-owned git follow-up status, Merge Strategy and cleanup responsibility. Distinguish baseline Review, additional independent Reviews actually performed, main reasons for omitted optional Review, actual test evidence and Seal commit assessment. Disclose abandoned optimization attempts/reasons/treatment and remaining warnings. Do not report that CLI created an archive commit, performed a merge or deleted a feature branch.

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** .xirang/changes/archive/YYYY-MM-DD-<name>/
**Quality Gate:** valid Seal commit exists; Archive independently completed Sync, validation and task gates
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
