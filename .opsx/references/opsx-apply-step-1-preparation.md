# Apply Step 1: Preparation

1. Select the change. If no clear name is provided, infer only from explicit context; otherwise run `opsx list --json` and ask. Always announce "Using change: <name>".
2. Run `opsx status --change "<name>" --json` and `opsx instructions apply --change "<name>" --json`. Read `configProjection.prompt.fragments` for `proseLanguage` and `apply.defaultIsolation`. Handle `state: "needs_verify"` by continuing at Phase 1 and `state: "needs_seal"` by continuing at Phase 2/3.
3. Load shared LikeC4 context before reading change artifacts.
Before reading implementation files, load the formal LikeC4 source under `.opsx/architecture/`.
- Use `opsx arch query <element-id> --relations --depth 2` for architecture navigation
- Read linked Specs from capability metadata
- Treat code paths, imports, calls, and symbols as implementation evidence only
- Do not read legacy OPSX YAML as active architecture source
4. Read every context file listed by the CLI. Inspect `changeDir/.verify-result.json` and `## Remediation`; unresolved CRITICAL/code_fix/artifact_fix items take priority.
5. Use CLI-backed LikeC4 navigation after shared context.
Use OPSX LikeC4 query surfaces for architecture details.
- Run `opsx list --specs --json` for Spec coverage.
- Run `opsx arch query <element-id> --relations --depth 2 --json` for affected elements and directed semantic relations.
- LikeC4 element IDs are semantic locations, not source paths.
- Use CodeGraph or ACE/`rg`/`read` only for current implementation evidence.
6. In a Git repository, run `git branch --show-current`, `git rev-parse HEAD`, and `git status --short`. Select branch, worktree, or current-branch isolation from explicit user input or `apply.defaultIsolation`; only `ask` prompts when no method was selected. If the provisional method is branch or current branch and the initial workspace is dirty, ask the user to switch to worktree isolation, include the existing dirty state in the baseline, or stop Apply. Never alter that state automatically. Finalize the isolation method only after this gate.
7. Record the selected method for Step 3. Do not read the selected reference during Preparation. At Step 3, read exactly one matching reference:
   - branch: `.opsx/references/opsx-apply-step-3-branch-isolation.md`
   - worktree: `.opsx/references/opsx-apply-step-3-worktree-isolation.md`
   - none/current branch: `.opsx/references/opsx-apply-step-3-current-branch.md`
   The selected reference is the complete method contract. You MUST NOT read the other two isolation references.