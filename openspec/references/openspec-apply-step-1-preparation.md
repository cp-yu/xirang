# Apply Step 1: Preparation

1. Select the change. If no clear name is provided, infer only from explicit context; otherwise run `openspec list --json` and ask. Always announce "Using change: <name>".
2. Run `openspec status --change "<name>" --json` and `openspec instructions apply --change "<name>" --json`. Read `configProjection.prompt.fragments` for `proseLanguage` and `apply.defaultIsolation`. Handle `state: "needs_verify"` by continuing at Phase 1 and `state: "needs_seal"` by continuing at Phase 2/3.
3. Load shared OPSX context before reading change artifacts.
Before reading other context files, check whether the formal OPSX two-file bundle exists:
- `openspec/project.opsx.yaml` for project intent, domains, and capabilities
- `openspec/project.opsx.relations.yaml` for the complete canonical semantic relation set
- If the bundle exists, read both files as one architecture source; do not treat either file as complete alone
- Read the `project:` block for project intent and scope
- Treat the bundle as navigation context, not as a replacement for change artifacts
4. Read every context file listed by the CLI. Inspect `changeDir/.verify-result.json` and `## Remediation`; unresolved CRITICAL/code_fix/artifact_fix items take priority.
5. Use CLI-backed OPSX navigation after shared context.
After reading the formal OPSX two-file bundle, use OpenSpec CLI query surfaces for node details.
- Run `openspec list --specs --json` to get specs and their `capabilities` string arrays; specs without frontmatter return `capabilities: []`.
- For known or affected OPSX node IDs, run `openspec opsx query <node-id...> --json` to get node details and directed semantic relations in one batch; add `--depth 2` when broader related context is needed.
- Use optional CodeGraph or ACE/`rg`/`read` for current code locations; OPSX does not store code paths.
- Treat CLI output as navigation context, not as a replacement for change artifacts.
6. In a Git repository, run `git branch --show-current`, `git rev-parse HEAD`, and `git status --short`. Select branch, worktree, or current-branch isolation from explicit user input or `apply.defaultIsolation`; only `ask` prompts when no method was selected. If the provisional method is branch or current branch and the initial workspace is dirty, ask the user to switch to worktree isolation, include the existing dirty state in the baseline, or stop Apply. Never alter that state automatically. Finalize the isolation method only after this gate.
7. Record the selected method for Step 3. Do not read the selected reference during Preparation. At Step 3, read exactly one matching reference:
   - branch: `openspec/references/openspec-apply-step-3-branch-isolation.md`
   - worktree: `openspec/references/openspec-apply-step-3-worktree-isolation.md`
   - none/current branch: `openspec/references/openspec-apply-step-3-current-branch.md`
   The selected reference is the complete method contract. You MUST NOT read the other two isolation references.