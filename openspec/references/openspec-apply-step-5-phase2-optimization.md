# Apply Step 5: Phase 2 Optimization

The checkpoint is a git commit, not a git stash entry or git tag. Do not create stash or tag checkpoints for apply optimization.

1. Skip Phase 2 only when the user requested `--skip-optimization` or `optimization.enabled: false`; record `SKIPPED` through `openspec verify phase2`.
2. Read `optimization.optRetries` from `openspec/config.yaml`; default to `2`.
3. Before the first optimization attempt, save the Phase 1 baseline:
   ```bash
   git add -A
   git commit -m "wip: opt-checkpoint-r0 (baseline)"
   ```
4. Delegate to the clean-context `openspec-optimizer` agent with `context: "fresh"`. Pass Phase 1 result, artifacts, file contents, config, and failedDirections. The optimizer proposes Search/Replace blocks only; it MUST NOT edit files.
5. Read the rationale tags (delete/stdlib/native/yagni/shrink) and Code Smell annotations on each proposed block. Understand the optimization rationale before proceeding.
6. For each proposed optimization, record pre-patch hashes before editing, while the working tree is still pre-patch:
   ```bash
   openspec verify phase2 "<change-name>" --type=optimization --files "<affected-files>" --input '<json>' --json
   ```
7. Apply Search/Replace blocks atomically, then spawn the reviewer agent for speculative Phase 1 re-verification.
8. On speculative PASS, record verification PASS and save the new successful state before deciding whether to continue. This verification call happens after patching:
   ```bash
   openspec verify phase2 "<change-name>" --type=verification --input '<json>' --json
   git add -A
   git commit -m "wip: opt-r${N} (${description})"
   ```
9. On speculative FAIL, restore the latest commit:
   ```bash
   git reset --hard HEAD
   git clean -fd
   ```
   Record the failed direction in `.verify-result.json`.
10. Each complete proposal + patch + reviewer re-verify loop consumes one `optRetries` budget, whether it passes or fails. Format or Search/Replace matching problems are handled by the main agent and do not consume retry budget.
11. When all attempts finish, keep all `wip: opt-*` commits as audit history.

**Verify CLI JSON Schema Reference**:

| CLI call | `--input` JSON |
| --- | --- |
| `openspec verify phase1 "<change-name>" --input '<json>' --json` | `{"result":"PASS","issues":[],"evidenceFiles":["..."],"executionMode":"..."}` |
| `openspec verify phase2 "<change-name>" --type=optimization --input '<json>' --json` | `{"status":"NO_OPTIMIZATION_NEEDED","summary":"..."}` (summary is required, must be non-empty) |
| `openspec verify phase2 "<change-name>" --type=optimization --files "<affected-files>" --input '<json>' --json` | `{"status":"OPTIMIZATION_PROPOSED","summary":"..."}` |
| `openspec verify phase2 "<change-name>" --type=optimization --input '<json>' --json` | `{"status":"SKIPPED"}` |
| `openspec verify phase2 "<change-name>" --type=verification --input '<json>' --json` | `{"result":"PASS","issues":[]}` |
| `openspec verify phase2 "<change-name>" --type=verification --input '<json>' --json` | `{"result":"FAIL_NEEDS_REMEDIATION","issues":[...],"behaviorRetryCounter":N}` |
**Verify CLI Error Recovery Guide**:
- If the CLI says `Invalid JSON input`: re-check that `--input` is a JSON string, not a file path; `issues` must be an array and `evidenceFiles` must be an array of strings
- If the CLI says `status must be NO_OPTIMIZATION_NEEDED, OPTIMIZATION_PROPOSED, ABORTED_UNSAFE, or SKIPPED`: fix the `--input.status` value and confirm whether `optimization.status` already has `affectedFileHashes`
- If the CLI says `result must be PASS, PASS_WITH_WARNINGS, or FAIL_NEEDS_REMEDIATION`: fix the `--input.result` value and keep `issues` as an array when provided
- If the CLI says `Optimization not yet submitted, call phase2 --type=optimization first`: call `phase2 --type=optimization` before retrying verification
- If the CLI says `FILES_REQUIRED`: add `--files "<affected-files>"` with the space-separated list of files the optimizer subagent declared as affected, then retry the same command
**Verify State Machine**:
```
Phase 1 PASS / PASS_WITH_WARNINGS
  |
  v
PENDING_VERIFICATION
  |-- no affectedFileHashes --> Phase 2 optimization analysis
  |                              |-- NO_OPTIMIZATION_NEEDED --> NOT_NEEDED
  |                              |-- SKIPPED / optimization.enabled=false --> SKIPPED
  |-- affectedFileHashes ------> PENDING_VERIFICATION (optimization proposed)
                                 |-- verification PASS --> IMPROVED
                                 |-- verification FAIL_NEEDS_REMEDIATION --> retry or DEGRADED
                                 |-- retries exhausted --> DEGRADED

Archive gate accepts: SKIPPED | NOT_NEEDED | IMPROVED | DEGRADED
Archive gate rejects: PENDING_VERIFICATION | ABORTED_UNSAFE
```