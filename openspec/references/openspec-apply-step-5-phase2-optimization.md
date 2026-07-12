# Apply Step 5: Phase 2 Optimization

Use git commits as checkpoints; never use stash or tags.

1. Skip only for `--skip-optimization` or `optimization.enabled: false`; record `SKIPPED`.
2. Read `optimization.optRetries`; it limits failures of one finding direction. Successful findings do not consume optRetries.
3. Save the Phase 1 baseline:
   ```bash
   git add -A
   git commit -m "wip: opt-checkpoint-r0 (baseline)"
   ```
4. Delegate to fresh `openspec-optimizer` with changeName, absolute changeDir, and absolute projectRoot. Submit its strict optimizer reconciliation envelope:
   ```bash
   openspec verify phase2 "<change-name>" --type=optimization --input '<json>' --json
   ```
5. If optimizer returns blockingObservations, return to Phase 1 remediation. If no finding is selected, Phase 2 is terminal. Otherwise read selected finding evidence, keyDesign, preservationConstraints, validation, and priorityReason.
6. If project evidence contradicts the finding or keyDesign, submit masterChallenge and re-run fresh optimizer reconciliation. Do not skip or reject it yourself.
7. Before editing, enforce selected-target freshness:
   ```bash
   openspec verify phase2 "<change-name>" --type=optimization --input '{"status":"OPTIMIZATION_PROPOSED","mode":"begin-implementation","findingId":"<finding-id>"}' --json
   ```
8. Master implements only the selected finding with TDD. Preserve the finding's constraints and record any non-substantive implementation differences.
9. Delegate to fresh `openspec-reviewer` for speculative verification. It verifies specs and preservationConstraints, not optimization value. Persist its verdict:
   ```bash
   openspec verify phase2 "<change-name>" --type=verification --input '{"result":"PASS","findingId":"<finding-id>","issues":[]}' --json
   ```
10. On PASS, save the successful checkpoint, then re-run optimizer reconciliation against current code:
    ```bash
    git add -A
    git commit -m "wip: opt-r${N} (${findingId}: ${description})"
    ```
11. On FAIL, restore the latest successful checkpoint with `git reset --hard HEAD` and `git clean -fd`, then re-run optimizer reconciliation. A direction reaching optRetries becomes rejected; other findings continue.
12. Stop on no actionable findings, all remaining findings terminal/deferred, skip/disabled, or STALLED. Keep all `wip: opt-*` commits.

**Verify CLI JSON Schema Reference**:

| CLI call | `--input` JSON |
| --- | --- |
| Phase 1 | `{"result":"PASS","issues":[],"evidenceFiles":["..."]}` |
| Phase 2 reconcile | `{"status":"OPTIMIZATION_PROPOSED","envelope":{"blockingObservations":[],"actions":[],"findings":[]}}` |
| Begin implementation | `{"status":"OPTIMIZATION_PROPOSED","mode":"begin-implementation","findingId":"OPT-<timestamp>-01"}` |
| Skip | `{"status":"SKIPPED"}` |
| Finding verification | `{"result":"PASS","findingId":"OPT-<timestamp>-01","issues":[]}` |
**Verify CLI Error Recovery Guide**:
- Invalid JSON or envelope errors: fix the strict JSON structure and retry without editing persisted history
- OPTIMIZER_REQUIRED: delegate to fresh optimizer and submit its reconciliation envelope
- STALE_FINDING: do not edit; re-run optimizer reconciliation against current code
- SELECTED_FINDING_REQUIRED: use the current selected finding ID
- PENDING_VERIFICATION: complete reviewer verification or rollback before reconciliation
**Verify State Machine**:
```
Phase 1 PASS / PASS_WITH_WARNINGS
  |
  v
fresh optimizer reconciliation
  |-- blockingObservations --> Phase 1 remediation
  |-- no actionable finding --> NOT_NEEDED or IMPROVED
  |-- selected finding ------> freshness gate -> implemented
                                      |
                                      v
                              fresh reviewer verification
                                |-- PASS --> verified -> checkpoint -> reconcile
                                |-- FAIL --> rollback -> failed/rejected -> reconcile
  |-- unchanged reconciliation twice --> STALLED -> terminal
  |-- skipped / disabled ------------> SKIPPED

Archive accepts: SKIPPED | NOT_NEEDED | IMPROVED | DEGRADED
Archive rejects: PENDING_VERIFICATION | ABORTED_UNSAFE
```