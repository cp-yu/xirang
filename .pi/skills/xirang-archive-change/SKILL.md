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

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select change and mode**
   Default to delivery with Quality. Select quick or abandon only on explicit user instruction; the modes are mutually exclusive. Dispatch abandon to step 2 before any delivery checks. For delivery only, if no clear change name is provided, run `xirang list --json`, show active changes with schema, and ask. Do not guess. If the explicitly named Change is no longer active, ask the CLI for its existing archive location and stop; do not resume Git handoff.

2. **Abandon without delivery**
   Run `xirang archive "<change-name>" --abandon --json` for a user-authorized abandonment. When the name is unknown, use `xirang archive --abandon --json` for interactive selection, or ask for the exact name if there is no interactive terminal; do not run `xirang list --json` as it reads Quality. Present any checked-goal progress without inferring implementation state. Let the CLI ask for confirmation, or pass `--yes` only when the user already confirmed proceeding without a prompt. Do not require completed artifacts, a valid Delta, or a Seal. Report the actual result and stop. MUST NOT apply the Delta, modify implementation, or run post-delivery Git commits, merge or cleanup.

3. **Prepare delivery**
   Read `.apply-isolation.json` before running the archive CLI and retain its validated `method`, `branchName`, `originalBranch`, `worktreePath`, and `sourceRoot` values. Run `xirang status --change "<name>" --json`. Warn and confirm before proceeding if any artifact is not `done`. The CLI handles incomplete goals; do not pass `--yes` to bypass that confirmation without user authorization.

4. **Quality gate for standard delivery**
   In default mode only, require a recorded passing full-change Review, explicit Opt disposition and successful Seal. No latest incremental or supplemental Review may remain failed. The Seal commit must exist in Git; HEAD/workspace differences and Quality JSON commit status are irrelevant. Preserve unsupported legacy records unchanged.

   Review the shared Apply/Quality references only when status identifies an outstanding obligation. A passing full-change Review must be recorded in .quality.json and bind an existing Git commit. Apply records actual delivered Opt opinions, including no-change inspections, or a reason only when Opt did not run. Retained unreviewed changes require full-change or incremental Review before Seal; risk determines scope, not whether Review occurs. Baseline-defect repairs still require supplemental Review. The CLI checks recordedRevision order and Git result/descendant association to the reviewed Seal commit. Only the coordinating Apply Agent writes Seal, declaring canRun and testsExpectedToPass for an existing commit. The CLI does not run tests, compare HEAD/workspace freshness or make these judgments. Preserve legacy Quality files unchanged. Do not run a completion review or modify the record during Archive; its Quality gate only checks that the Seal commit object exists.

   In quick mode do not require or create a Seal. Do not report Quality as passed.

5. **Run archive CLI**
   Run `xirang archive "<change-name>" --json` for default delivery or `xirang archive "<change-name>" --quick --json` for quick delivery. A single call validates and applies the Delta before moving the Change. MUST NOT write Formal manually. If the CLI did not complete a new delivery, including cancellation, failure, or `alreadyArchived`, report the result and stop before Git handoff. Do not treat the presence of an old archive as a new delivery.

6. **Git handoff**
   Read the archive CLI output and consume normalized Git policy (not raw YAML) from `xirang config project --select git --json`. Use the retained Quality status for Review, Opt disposition and Seal evidence; do not infer that CLI ran tests or made a Git commit.

7. **Agent git flow**
   The agent continues the post-archive git flow. First handle the implementation boundary before Xirang/docs archive artifacts. If uncommitted real project implementation changes remain, create a normal implementation commit that contains only those changes. Then always create a semantic boundary commit with `git commit --allow-empty`; this boundary commit may be intentionally empty when the effective implementation diff is already carried by retained `wip: opt-*` checkpoint commits. If `git.commitMessage.boundary` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-boundary-commit-message.md`. Use that template to build the boundary commit message and run `git commit -F -` for the boundary commit. If `git.commitMessage.archive` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-archive-commit-message.md`. Use that template before creating the Xirang/docs archive commit, add only archive/synced paths, and run `git commit -F -`. If a merge or squash commit message is needed, prepare it from the configured or built-in merge template. If `git.commitMessage.merge` is set, read that project-relative path; otherwise read the project-root file `.xirang/references/xirang-merge-summary-message.md`.

   Apply the retained isolation metadata after archive commits are complete. Map the projected strategy to `git merge --no-ff`, `git merge --ff-only`, or `git merge --squash`. For `method: "branch"`, switch to `originalBranch`, then merge `branchName` with the projected strategy. For `method: "worktree"`, keep commits in `worktreePath`; before merging, verify that `sourceRoot` is on `originalBranch`, then run the projected merge from `sourceRoot` using `git -C <sourceRoot>`. The agent MUST NOT reset, clean, stash, or commit unrelated source-workspace changes. After a successful merge, require the Apply worktree to be clean, run `git worktree remove <worktreePath>` from `sourceRoot`, and only then delete `branchName` when `git.branch.deleteAfterArchive` is true and `git branch --merged` confirms it is merged. For `method: "none"`, do not switch, merge, remove a worktree, or delete the current branch. Stop and report the retained metadata/current state mismatch instead of guessing. Build paths with `path.join()`, `path.resolve()`, and `path.normalize()`.

8. **Display summary**
   Include change, schema, archive location, quality gate result, Semantic Model sync result, agent-owned git follow-up status, Merge Strategy and cleanup responsibility. Distinguish full-change Review, additional incremental or supplemental Reviews actually performed, no-change deliveries that added no Review obligation without clearing earlier cumulative obligations, actual test evidence and Seal commit assessment. Disclose abandoned optimization attempts/reasons/treatment and remaining warnings. Do not report that CLI created an archive commit, performed a merge or deleted a feature branch.

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
- Show Review and test evidence only when observed; CLI does not run tests or make Git commits.
- Do not attempt cross-process recovery. If an interrupted execution left local changes, inspect Git diff and the actual model and Change paths before any corrective action; protect unrelated edits.
