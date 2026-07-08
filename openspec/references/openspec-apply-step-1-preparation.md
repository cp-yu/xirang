# Apply Step 1: Preparation

1. Select the change. If no clear name is provided, infer only from explicit context; otherwise run `openspec list --json` and ask. Always announce "Using change: <name>".
2. Run `openspec status --change "<name>" --json` and `openspec instructions apply --change "<name>" --json`. Read `configProjection.prompt.fragments` for `proseLanguage` and `apply.defaultIsolation`. Handle `state: "needs_verify"` by skipping to Phase 1 and `state: "needs_seal"` by continuing with Phase 2/3.
3. Load shared OPSX context before reading change artifacts.
Before reading other context files, check whether `openspec/project.opsx.yaml` exists.
- If it exists, read it first for domains → capabilities structure
- Read the `project:` block for project intent and scope
- Treat it as navigation context, not as a replacement for change artifacts
4. Read every context file listed by the CLI. Inspect `changeDir/.verify-result.json` and `## Remediation`; unresolved CRITICAL/code_fix/artifact_fix items take priority.
5. Use CLI-backed OPSX navigation after shared context.
After reading shared `project.opsx.yaml` context, use OpenSpec CLI query surfaces for node details.
- Run `openspec list --specs --json` to get specs and their `capabilities` string arrays; specs without frontmatter return `capabilities: []`.
- For known or affected OPSX node IDs, run `openspec opsx query <node-id...> --json` to get node details, relations and code-map refs in one batch; add `--depth 2` when broader related context is needed.
- Treat CLI output as navigation context, not as a replacement for change artifacts.