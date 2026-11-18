---
name: "xirang-archive-change"
description: "Deliver or abandon a Change in the Xirang change workflow. Use when the user wants to deliver a change or explicitly abandon it without applying its Delta."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.2.11"
---

Deliver or abandon a Change in the Xirang change workflow.

Before doing stage work, load the xirang-common skill from this tool's discovered skills or from ../xirang-common/SKILL.md relative to this skill file, unless its required guidance is already available and current in this Agent's project context. Keep the selected stage while loading it; do not route back or load this stage again. Follow common's on-demand guidance and reuse rules.

Read this stage's additional guidance with `xirang config project --select stageRules.archive --json`. Apply only this stage's rules under common's configuration scope.

For workflow-managed writes, read the resolved file definition before its instruction and template, and MUST NOT copy definitions, config projections, or reasoning into artifacts.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST ask for the exact name.

**Steps**

1. **Select change and mode**
   Default to delivery with Quality. Select quick or abandon only on explicit user instruction; the modes are mutually exclusive. Dispatch abandon to step 2 before any delivery checks. If the delivery name cannot be inferred, ask for the exact Change name; do not run `xirang list --json` because it reads Quality. Do not guess. If the explicitly named Change is no longer active, ask the CLI for its existing archive location and stop; do not resume Git handoff.

2. **Abandon without delivery**
   Run `xirang archive "<change-name>" --abandon --json` for a user-authorized abandonment. When the name is unknown, use `xirang archive --abandon --json` for interactive selection, or ask for the exact name if there is no interactive terminal; do not run `xirang list --json` as it reads Quality. Present any checked-goal progress without inferring implementation state. Let the CLI ask for confirmation, or pass `--yes` only when the user already confirmed proceeding without a prompt. Do not require completed artifacts, a valid Delta, or a Seal. Report the actual result and stop. MUST NOT apply the Delta, modify implementation, or run post-delivery Git commits, merge or cleanup.

3. **Prepare delivery**
   In a Git repository, read `.apply-isolation.json` before running the archive CLI and retain its validated `method`, `branchName`, `originalBranch`, `worktreePath`, and `sourceRoot` values. Use only `schemaName` and `artifacts` from `xirang status --change "<name>" --json`; ignore its Quality state and diagnostics. List incomplete artifacts and confirm before proceeding if any artifact is not `done`. The CLI handles incomplete goals; do not pass `--yes` to bypass that confirmation without user authorization.

4. **Run archive CLI**
   Run `xirang archive "<change-name>" --json` for default delivery or `xirang archive "<change-name>" --quick --json` for quick delivery. In default mode the CLI is the only Quality gate: the recorded Seal must be valid and its Seal commit must exist in Git. Do not preflight Quality, recheck Review or Opt eligibility, or compare the Seal to HEAD or the working tree. If the CLI rejects the Seal, relay its diagnostic and return to Apply; do not repair Quality in Archive. Quick skips the Seal check; do not create a Seal or report Quality as passed.

   A single call validates and applies the Delta before moving the Change. MUST NOT write Formal manually. If the CLI did not complete a new delivery, including cancellation, failure, or `alreadyArchived`, report the result and stop before Git handoff. Do not treat the presence of an old archive as a new delivery.

5. **Git handoff**
   If this is not a Git repository, report the result and stop before Git handoff. Otherwise read the archive CLI output and consume normalized Git policy (not raw YAML) from `xirang config project --select git --json`.

6. **Agent git flow**
   The agent continues the post-archive git flow. First handle the implementation boundary before Xirang/docs archive artifacts. If uncommitted real project implementation changes remain, create a normal implementation commit that contains only those changes. Then always create a semantic boundary commit with `git commit --allow-empty`; this boundary commit may be intentionally empty when the effective implementation diff is already carried by retained `wip: opt-*` checkpoint commits. If `git.commitMessage.boundary` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-boundary-commit-message.md`. Use that template to build the boundary commit message and run `git commit -F -` for the boundary commit. If `git.commitMessage.archive` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-archive-commit-message.md`. Use that template before creating the Xirang/docs archive commit, add only archive/synced paths, and run `git commit -F -`. If a merge or squash commit message is needed, prepare it from the configured or built-in merge template. If `git.commitMessage.merge` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-merge-summary-message.md`.

   Apply the retained isolation metadata after archive commits are complete. Map the projected strategy to `git merge --no-ff`, `git merge --ff-only`, or `git merge --squash`. For `method: "branch"`, switch to `originalBranch`, then merge `branchName` with the projected strategy. For `method: "worktree"`, keep commits in `worktreePath`; before merging, verify that `sourceRoot` is on `originalBranch`, then run the projected merge from `sourceRoot` using `git -C <sourceRoot>`. The agent MUST NOT reset, clean, stash, or commit unrelated source-workspace changes. After a successful merge, require the Apply worktree to be clean, run `git worktree remove <worktreePath>` from `sourceRoot`, and only then delete `branchName` when `git.branch.deleteAfterArchive` is true and `git branch --merged` confirms it is merged. For `method: "none"`, do not switch, merge, remove a worktree, or delete the current branch. Stop and report the retained metadata/current state mismatch instead of guessing. Build paths with `path.join()`, `path.resolve()`, and `path.normalize()`.

7. **Display summary**
   Include change, schema, archive location, quality gate result, Semantic Model sync result, agent-owned git follow-up status, Merge Strategy and cleanup responsibility. If reporting Review, Opt or Seal evidence, use the preserved archive record and previously observed evidence; never run a new Quality gate. Disclose known abandoned optimization attempts and remaining warnings. Do not report that CLI created an archive commit, performed a merge or deleted a feature branch.

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** .xirang/changes/archive/YYYY-MM-DD-<name>/
**Quality Gate:** <valid Seal commit / skipped by explicit quick request>
**Semantic Model:** <Delta applied or no model writes needed>
**Agent Git Follow-up:** <completed / pending with reason>
**Merge Strategy:** <git.merge.strategy>
**Cleanup Responsibility:** <agent>
```

**Guardrails**
- Keep the selected Change, archive destination, and Formal files it writes exclusive to Archive until the command returns; do not edit or move those paths concurrently.
- Show Review and test evidence only when observed; CLI does not run tests or make Git commits.
- Do not attempt cross-process recovery. If an interrupted execution left local changes, inspect Git diff and the actual model and Change paths before any corrective action; protect unrelated edits.
