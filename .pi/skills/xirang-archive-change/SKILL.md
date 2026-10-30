---
name: "xirang-archive-change"
description: "Archive a completed change in the Xirang change workflow. Use when the user wants to finalize and archive a completed change after implementation is complete."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.0"
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
   Run `xirang quality status "<change-name>" --json`. First check `optimization.terminal`: for `ABORTED_UNSAFE`, hard-stop for manual recovery and offer no automatic path, even when `state` is `dirty`. Treat `state` as the sole signal for rerunning the quality flow: only `dirty` enters Step 2.5 at Review. MUST NOT infer the code state from `changedFiles`, `information`, or the recorded review alone. A `clean` state after seal MUST reuse the recorded review even when Git HEAD information differs. If a `clean` state has an unfinished Optimization, continue the optimization loop instead of stopping: enter Step 2.5 at Optimization without rerunning Review; the shared protocol handles eligibility, limits, and finalization.

2.5. **Execute Full Quality**

   Use the standalone Apply `subagent-orchestrated` contract in the existing Apply workspace. Determine `changeName`, absolute `changeDir`, and absolute `projectRoot`; validate retained isolation through `.xirang/references/xirang-apply-step-1-preparation.md` before quality mutations. Do not reinitialize isolation or overwrite its evidence baseline; missing or invalid metadata requires manual recovery.
   Read and execute the complete shared references at each stage, rather than reconstructing a shortened quality loop:
   - Review: `.xirang/references/xirang-apply-step-3-review.md`
   - Optimization: `.xirang/references/xirang-apply-step-4-optimization.md`
   - Seal: `.xirang/references/xirang-apply-step-5-seal.md`
   For `dirty`, enter at Review. For `clean` with unfinished Optimization, reuse the recorded Review and enter at Optimization. These references own delegation, payload validation, CRITICAL write-back, checkpoints, attempt reporting, rollback, terminal handling, and sealing. Return corrections to the Apply implementation loop and require a fresh Review after edits; never treat `ABORTED_UNSAFE` as recoverable automatically. With explicit user authorization to restart verification and a fully stopped original flow, .xirang/references/xirang-quality-recovery.md owns the controlled record rotation and fresh Review before the normal dirty/clean routing resumes. Resume Archive only after the shared flow seals successfully.
   The top-level archive flow MUST NOT inline a current-agent review skeleton; archive MUST NOT silently downgrade to a review-only run.

3. **Check artifact completion status**
   Run `xirang status --change "<name>" --json`. Warn and confirm before proceeding if any artifact is not `done`.

4. **Check task completion status**
   Read `tasks.md`; warn and confirm before proceeding if incomplete checkboxes remain. Missing tasks are not a task-related blocker.

5. **Assess delta sync state**
   If any of `.xirang/changes/<name>/{metamodel,elements,relationships,views}/` is non-empty, assess whether sync is required. The archive CLI performs the quality gate, sync, and move-to-archive; do not duplicate sync writes manually.

6. **Run archive CLI**
   Run `xirang archive "<change-name>"` after the quality gate is clean and finalized. CLI only verifies, syncs, moves the change to archive, and prints the git handoff reminder. CLI MUST NOT create commits, merge branches, switch branches, delete branches, remove worktrees, or generate commit messages.

7. **Git handoff**
   Read the archive CLI output and the projected git policy from `xirang config project --json`. Summary fields include change name, schema, archive location, quality gate result, Semantic Model sync result, agent-owned git follow-up status, and merge strategy.

8. **Agent git flow**
   The agent continues the post-archive git flow. First handle the implementation boundary before Xirang/docs archive artifacts. If uncommitted real project implementation changes remain, create a normal implementation commit that contains only those changes. Then always create a semantic boundary commit with `git commit --allow-empty`; this boundary commit may be intentionally empty when the effective implementation diff is already carried by retained `wip: opt-*` checkpoint commits. If `git.commitMessage.boundary` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-boundary-commit-message.md`. Use that template to build the boundary commit message and run `git commit -F -` for the boundary commit. If `git.commitMessage.archive` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-archive-commit-message.md`. Use that template before creating the Xirang/docs archive commit, add only archive/synced paths, and run `git commit -F -`. If a merge or squash commit message is needed, prepare it from the configured or built-in merge template. If `git.commitMessage.merge` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-merge-summary-message.md`.

   Apply the retained isolation metadata after archive commits are complete. Map the projected strategy to `git merge --no-ff`, `git merge --ff-only`, or `git merge --squash`. For `method: "branch"`, switch to `originalBranch`, then merge `branchName` with the projected strategy. For `method: "worktree"`, keep commits in `worktreePath`; before merging, verify that `sourceRoot` is on `originalBranch`, then run the projected merge from `sourceRoot` using `git -C <sourceRoot>`. The agent MUST NOT reset, clean, stash, or commit unrelated source-workspace changes. After a successful merge, require the Apply worktree to be clean, run `git worktree remove <worktreePath>` from `sourceRoot`, and only then delete `branchName` when `git.branch.deleteAfterArchive` is true and `git branch --merged` confirms it is merged. For `method: "none"`, do not switch, merge, remove a worktree, or delete the current branch. Stop and report the retained metadata/current state mismatch instead of guessing. Build paths with `path.join()`, `path.resolve()`, and `path.normalize()`.

9. **Display summary**
   Include change, schema, archive location, quality gate result, Semantic Model sync result, agent-owned git follow-up status, Merge Strategy, cleanup responsibility, review reuse/reexecution, and warnings. Do not report that CLI created an archive commit, performed a merge, or deleted a feature branch.

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** .xirang/changes/archive/YYYY-MM-DD-<name>/
**Quality Gate:** clean PASS or PASS_WITH_WARNINGS review record confirmed
**Semantic Model:** ✓ Synced into `.xirang/model/`, rewriting only the units the Semantic Delta affects, all-or-nothing (or "No deltas" or "Sync gate bypassed with --no-sync")
**Agent Git Follow-up:** <completed / pending with reason>
**Merge Strategy:** <git.merge.strategy>
**Cleanup Responsibility:** <agent>

Archive completed after satisfying the unified quality gate.
```

**Guardrails**
- Always prompt for change selection if not provided
- Prioritize the standard quality gate; only pass `--no-verify` to the archive CLI when the user explicitly requests it (the CLI provides its own confirmation prompt)
- Show clearly whether the recorded review was reused or the quality flow was re-executed
- In `core`, use `xirang sync "<change-name>"` rather than manual inline sync
- If any of `.xirang/changes/<name>/{metamodel,elements,relationships,views}/` is non-empty, always run the shared sync assessment before moving the change directory
