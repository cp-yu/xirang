# Apply Step 2: Branch Isolation

Use this reference only after Step 1 selects branch isolation.

1. Require that Step 1 finalized branch isolation and the dirty-state gate is resolved. Stop before editing if either prerequisite is missing.
2. Record the current branch as `originalBranch` and resolve the current `HEAD` SHA as `baseCommit` before switching.
3. Check `git show-ref --verify --quiet refs/heads/<change-name>`. If the branch exists, require explicit confirmation before `git switch <change-name>`; otherwise create it with `git switch -c <change-name>`.
4. After switching, verify `git branch --show-current` equals `branchName`. Stop on mismatch.
5. Persist `path.join(changeDir, '.apply-isolation.json')` with `method: "branch"`, `branchName`, `originalBranch`, and `baseCommit`. `baseCommit` is the immutable evidence baseline; `originalBranch` is only for navigation and archive cleanup.
6. Keep `git status --short` files in verification scope in addition to `git diff <baseCommit>...HEAD --name-only`.