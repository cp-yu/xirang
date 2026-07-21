---
name: "opsx-archive-change"
description: "Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a completed change after implementation is complete."
license: "MIT"
compatibility: "Requires opsx CLI."
metadata:
  author: "opsx"
  version: "1.0"
  generatedBy: "1.4.1-cpyu.5"
---

Archive a completed change in the experimental workflow.

**OPSX Philosophy**

OPSX is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and LikeC4 jointly form the durable semantic source. Specs define observable behavior; LikeC4 defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.

For workflow-managed writes, read the resolved file definition before its instruction and template, and MUST NOT copy definitions, config projections, or reasoning into artifacts.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

Before archiving, run `opsx config project --json` and consume git policy from its normalized project config: `git.commitMessage.archive`, `git.commitMessage.merge`, `git.merge.strategy`, and `git.branch.deleteAfterArchive`; do not parse raw YAML inside the skill.

**Steps**

1. **Select change**
   If no clear change name is provided, run `opsx list --json`, show active changes with schema, and ask. Do not guess. Read `.apply-isolation.json` before running the archive CLI and retain its validated `method`, `branchName`, `originalBranch`, `worktreePath`, and `sourceRoot` values because the CLI moves the active change directory.

2. **Unified Full Verify Gate**
   Run `opsx verify status "<change-name>" --json`. Treat `freshness.status` as the sole signal for rerunning full verify: only `MISSING` or `STALE` enters Step 2.5. MUST NOT infer staleness from `checks`, `details`, or `information`. A `FRESH` result after seal MUST reuse Phase 1 even when Git HEAD information differs. For a fresh result, resolve incompatible optimization states separately: complete `PENDING_VERIFICATION` through the appropriate `opsx verify phase2` call, and hard-stop `ABORTED_UNSAFE` for manual recovery.

2.5. **Execute Full Verify**

   When the verify result is missing or stale, execute the same verify contract as `/opsx:verify` using the `subagent-orchestrated` skeleton:
   - Determine `changeName`, absolute `changeDir`, and absolute `projectRoot`
   - Delegate to clean-context generated `opsx-reviewer` subagent with `context: "fresh"`; pass only `changeName`, `changeDir`, `projectRoot`, and the explicit evidence bundle required for canonical Phase 1
   - Validate the reviewer payload, apply only deterministic `tasks.md` write-back in the main workspace, and persist the canonical Phase 1 payload
   - Execute the verify workflow end-to-end; when Phase 2 is eligible, delegate to clean-context generated `opsx-optimizer` subagent with `context: "fresh"`, pass only `changeName`, `changeDir`, and `projectRoot`, validate its finding reconciliation envelope, and let the master implement only the selected finding with TDD
   - In `P1_SPECULATIVE_FENCE`, delegate to clean-context generated `opsx-reviewer` subagent again with `context: "fresh"` to verify specs and the selected finding's preservationConstraints, not optimization value
   - The top-level archive flow MUST NOT inline a current-agent review skeleton or silently downgrade to reread mode
   Continue through Phase 2 when eligible; `SKIPPED` is valid only for config/user skip. Persist fresh verify before archiving.

3. **Check artifact completion status**
   Run `opsx status --change "<name>" --json`. Warn and confirm before proceeding if any artifact is not `done`.

4. **Check task completion status**
   Read `tasks.md`; warn and confirm before proceeding if incomplete checkboxes remain. Missing tasks are not a task-related blocker.

5. **Assess delta sync state**
   If delta specs or `architecture-delta.c4` exist, assess whether sync is required. The archive CLI performs verify, sync, and move-to-archive; do not duplicate sync writes manually.

6. **Run archive CLI**
   Run `opsx archive "<change-name>"` after the verify gate is fresh. CLI only verifies, syncs, moves the change to archive, and prints the git handoff reminder. CLI MUST NOT create commits, merge branches, switch branches, delete branches, remove worktrees, or generate commit messages.

7. **Git handoff**
   Read the archive CLI output and the projected git policy from `opsx config project --json`. Summary fields include change name, schema, archive location, verify gate result, specs / architecture sync result, agent-owned git follow-up status, and merge strategy.

8. **Agent git flow**
   The agent continues the post-archive git flow. First handle the implementation boundary before OPSX/docs archive artifacts. If uncommitted real project implementation changes remain, create a normal implementation commit that contains only those changes. Then always create a semantic boundary commit with `git commit --allow-empty`; this boundary commit may be intentionally empty when the effective implementation diff is already carried by retained `wip: opt-*` checkpoint commits. If `git.commitMessage.boundary` is set, read that project-relative path; otherwise read the project-root file `.opsx/references/opsx-boundary-commit-message.md`. Use that template to build the boundary commit message and run `git commit -F -` for the boundary commit. If `git.commitMessage.archive` is set, read that project-relative path; otherwise read the project-root file `.opsx/references/opsx-archive-commit-message.md`. Use that template before creating the OPSX/docs archive commit, add only archive/synced paths, and run `git commit -F -`. If a merge or squash commit message is needed, prepare it from the configured or built-in merge template. If `git.commitMessage.merge` is set, read that project-relative path; otherwise read the project-root file `.opsx/references/opsx-merge-summary-message.md`.

   Apply the retained isolation metadata after archive commits are complete. Map the projected strategy to `git merge --no-ff`, `git merge --ff-only`, or `git merge --squash`. For `method: "branch"`, switch to `originalBranch`, then merge `branchName` with the projected strategy. For `method: "worktree"`, keep commits in `worktreePath`; before merging, verify that `sourceRoot` is on `originalBranch`, then run the projected merge from `sourceRoot` using `git -C <sourceRoot>`. The agent MUST NOT reset, clean, stash, or commit unrelated source-workspace changes. After a successful merge, require the Apply worktree to be clean, run `git worktree remove <worktreePath>` from `sourceRoot`, and only then delete `branchName` when `git.branch.deleteAfterArchive` is true and `git branch --merged` confirms it is merged. For `method: "none"`, do not switch, merge, remove a worktree, or delete the current branch. Stop and report the retained metadata/current state mismatch instead of guessing. Build paths with `path.join()`, `path.resolve()`, and `path.normalize()`.

9. **Display summary**
   Include change, schema, archive location, verify gate result, specs / architecture sync result, agent-owned git follow-up status, Merge Strategy, cleanup responsibility, verify reuse/reexecution, and warnings. Do not report that CLI created an archive commit, performed a merge, or deleted a feature branch.

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** .opsx/changes/archive/YYYY-MM-DD-<name>/
**Verify Gate:** Fresh PASS or PASS_WITH_WARNINGS result confirmed
**Specs / architecture:** ✓ Synced to main specs and formal LikeC4 architecture (or "No deltas" or "Sync gate bypassed with --no-sync")
**Agent Git Follow-up:** <completed / pending with reason>
**Merge Strategy:** <git.merge.strategy>
**Cleanup Responsibility:** <agent>

Archive completed after satisfying the unified full verify gate.
```

**Guardrails**
- Always prompt for change selection if not provided
- Prioritize the standard verify gate; only pass `--no-verify` to the archive CLI when the user explicitly requests it (the CLI provides its own confirmation prompt)
- Show clearly whether verify was reused or re-executed
- In `core`, use `opsx sync "<change-name>"` rather than manual inline sync
- If delta specs or `architecture-delta.c4` exist, always run the shared sync assessment before moving the change directory
