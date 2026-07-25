# Apply Step 1: Preparation

1. Select the change. If no clear name is provided, infer only from explicit context; otherwise run `xirang list --json` and ask. Always announce "Using change: <name>".
2. Run `xirang status --change "<name>" --json` and `xirang instructions apply --change "<name>" --json`. Read `configProjection.prompt.fragments` for `proseLanguage` and `apply.defaultIsolation`. Handle `state: "needs_verify"` by continuing at Phase 1 and `state: "needs_seal"` by continuing at Phase 2/3.
3. Load the shared Xirang Semantic Model context before reading change artifacts.
**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the LikeC4 graph modules under `.xirang/architecture/` and locate the unique Project Root element.
- Use stable `elementId` as canonical identity. FQN is the current source navigation path and may change when an element moves.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- Use `xirang list --specs --json` as the Element Contract registry; each Spec has one singular element owner binding.
- Use `xirang arch query <elementId> --relations --depth <n> --json` for parent, children, owned Specs, and incoming/outgoing semantic relationships.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, binding, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.
4. Read every context file listed by the CLI. Inspect `changeDir/.verify-result.json` and `## Remediation`; unresolved CRITICAL/code_fix/artifact_fix items take priority.
5. Use the shared query protocol to read affected elements, refinement, Element Contracts, and relationships.
6. In a Git repository, run `git branch --show-current`, `git rev-parse HEAD`, and `git status --short`. Select branch, worktree, or current-branch isolation from explicit user input or `apply.defaultIsolation`; only `ask` prompts when no method was selected. If the provisional method is branch or current branch and the initial workspace is dirty, ask the user to switch to worktree isolation, include the existing dirty state in the baseline, or stop Apply. Never alter that state automatically. Finalize the isolation method only after this gate.
7. Record the selected method for Step 3. Do not read the selected reference during Preparation. At Step 3, read exactly one matching reference:
   - branch: `.xirang/references/xirang-apply-step-3-branch-isolation.md`
   - worktree: `.xirang/references/xirang-apply-step-3-worktree-isolation.md`
   - none/current branch: `.xirang/references/xirang-apply-step-3-current-branch.md`
   The selected reference is the complete method contract. You MUST NOT read the other two isolation references.