# Apply Step 3: Branch Isolation

Run `git branch --show-current`. On main/master ask whether to Create branch `<change-name>`, Create worktree at `.worktrees/<change-name>`, or continue; config branch/worktree/none use that as the default choice without prompting; only `ask` is interactive and means prompt.

Persist `path.join(changeDir, '.apply-isolation.json')` with `method`, `branchName`, optional `worktreePath`, and `originalBranch`. Use using-git-worktrees when present.