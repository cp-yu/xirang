# Apply Step 3: Current Branch

Use this reference only after Step 1 selects current-branch isolation.

1. Require that Step 1 finalized current-branch isolation and the dirty-state gate is resolved. Stop before editing if either prerequisite is missing.
2. Record the current branch as both `branchName` and `originalBranch`, and resolve current `HEAD` as `baseCommit`.
3. Persist `path.join(changeDir, '.apply-isolation.json')` with `method: "none"`, `branchName`, `originalBranch`, and `baseCommit`. `baseCommit` is the immutable evidence baseline; `originalBranch` is only for navigation and archive cleanup.
4. Keep `git status --short` files in verification scope in addition to `git diff <baseCommit>...HEAD --name-only`.