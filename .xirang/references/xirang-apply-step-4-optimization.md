# Apply Step 4: Optimization

**Quality State Machine**:
```
dirty   no recorded review conclusion matches the current code evidence
  |
  v
xirang quality review <change-name> --input '<json>' --json
  |-- FAIL_NEEDS_CORRECTIONS --> fix the code and review again (state stays dirty)
  |-- PASS | PASS_WITH_WARNINGS --> clean
                                     |
                                     v
xirang quality optimize <change-name> --input '<json>' --json
  |   one round per call; accepted only while clean and not finalized
  |-- new directions ------> the CLI assigns OPT-… IDs and selects the highest priority eligible direction
  |                          the master implements the selected direction, then reviews it again
  |-- attempt verified ----> direction verified; the next round judges the remaining directions
  |-- attempt failed ------> failure count +1; rejected at optimization.directionRetries
  |-- stopReason ----------> the loop is finalized with a terminal state
                                     |
                                     v
xirang quality seal <change-name> --json
      requires clean + a finalized ledger + a terminal other than ABORTED_UNSAFE

stopReason -> terminal:  USER_DECLINED -> SKIPPED
                         NO_ACTIONABLE -> NOT_NEEDED
                         DIRECTION_REJECTED | DIRECTION_LIMIT_REACHED -> IMPROVED when a direction is verified, otherwise DEGRADED
                         UNSAFE -> ABORTED_UNSAFE

Archive accepts: SKIPPED | NOT_NEEDED | IMPROVED | DEGRADED
Archive rejects: an unfinalized ledger (NOT_FINALIZED) | ABORTED_UNSAFE
```

Use git commits as checkpoints; never use stash or tags. Ordinary implementation rounds create no commits. Each round follows the state machine above.

1. Skip optimization only through `optimization.enabled: false` or an explicit user decline, then finalize with `{"directions":[],"stopReason":"USER_DECLINED","summary":"<reason>"}` (terminal `SKIPPED`).
2. Read `optimization.directionLimit` (selected directions per run) and `optimization.directionRetries` (failures of one direction). A verified direction consumes neither budget, and a successful round never consumes the failure budget.
3. Establish the baseline. If the workspace contains this Apply's changes, save them as the first Apply commit:
   ```bash
   git add -A
   git commit -m "wip: opt-checkpoint-r0 (baseline)"
   ```
   Do not use an empty commit. If the workspace is clean, reuse only an already verified baseline or an explicitly recorded user-owned complete implementation commit; otherwise stop. Persist its SHA as `optimizationBaselineCommit` in `.apply-isolation.json`.
4. Delegate to a fresh `xirang-optimizer` with `context: "fresh"` and pass only the three locating strings plus the recorded review conclusion, the failed directions, and the optimization config; the optimizer owns read and bash capability and reads the base scope itself, so never pass file contents and never reuse an earlier conclusion. Wait for the complete round ledger before validating it: A slow subagent is not a failed subagent — keep waiting, and ask the user before terminating it. Submit the ledger:
   ```bash
   xirang quality optimize "<change-name>" --input '<json>' --json
   ```
   The CLI assigns every new direction ID, echoes the assigned IDs and `selected`, and rejects a selection that skips the highest priority eligible direction. Do not author IDs, counters, or selections.
5. If the optimizer reports a correctness, spec, or artifact conflict, finalize with `{"directions":[],"stopReason":"UNSAFE","summary":"<conflict>"}`, then return to the implementation loop with Required Corrections. Otherwise implement only the direction the CLI selected.
6. If project evidence contradicts the selected direction or its `keyDesign`, revoke it inside the round ledger with `reason` and `evidence`, then judge the remaining directions with a fresh optimizer. Do not skip or reject a direction silently.
7. Implement the selected direction with TDD, preserving its `preservationConstraints`, and record any non-substantive implementation difference from `keyDesign`.
8. Delegate to a fresh `xirang-reviewer` with `context: "fresh"` to verify the specs and the selected direction's `preservationConstraints`, not the optimization value. Record that verdict with the same `xirang quality review` call as Step 3; a passing review marks the direction `implemented` and refreshes the evidence fingerprint.
9. Report the round outcome on the next optimization call with `attempt`: `{"directionId":"<direction-id>","status":"verified"}` after a passing review, or `"failed"` after a failing review. Report the verdict before rolling back so history and failure counts stay durable. A direction whose attempt is never reported stays `implemented`, which means "reviewed, outcome unknown" and is not a successful landing.
10. On `verified`, save the successful checkpoint and judge the remaining directions:
    ```bash
    git add -A
    git commit -m "wip: opt-r${N} (${directionId}: ${description})"
    ```
11. On `failed`, copy `.quality-state.json`, `.quality-log.jsonl`, and `.apply-isolation.json` to repository-external temporary files and record each SHA-256. Confirm the workspace matches the selected isolation and that `HEAD` is the latest successful checkpoint, discard only speculative code with `git reset --hard HEAD` and `git clean -fd`, then restore all three files (`git clean` removes the untracked log) and verify each hash before the next round. Stop if restoration or hash verification fails, or if speculative files remain. A direction reaching `optimization.directionRetries` becomes `rejected`; other directions continue.
12. Finalize the loop with `{"directions":[],"attempt":{"directionId":"<direction-id>","status":"verified|failed"},"stopReason":"...","summary":"<optimizer conclusion>"}` when the optimizer finds no eligible direction (`NO_ACTIONABLE`), the direction limit blocks a new selection (`DIRECTION_LIMIT_REACHED`), the user declines (`USER_DECLINED`), or the workspace is unsafe (`UNSAFE`).
    When the loop closes right after a round finished, the finalizing call MUST carry that round's `attempt` in the same payload: `implemented` cannot be distinguished from a round whose review failed, so an unreported round makes the terminal `DEGRADED` instead of `IMPROVED`. Finalize with only a `stopReason` when no round is awaiting a report.
    Keep all `wip: opt-*` commits.

[Mode: Checkpoint]

| State | Trigger condition | Git operation |
| --- | --- | --- |
| CREATED | Optimization starts and the workspace carries this Apply's changes | `git add -A && git commit -m "wip: opt-checkpoint-r0 (baseline)"`; persist the SHA as `optimizationBaselineCommit` |
| BASELINE_RESTORED_FOR_RETRY | A round review returned FAIL_NEEDS_CORRECTIONS | `git reset --hard HEAD` and `git clean -fd` back to the latest successful checkpoint |
| TERMINAL_ACCEPTED | The ledger is finalized and the last round passed review | keep every `wip: opt-*` commit |
| TERMINAL_RESTORED | The ledger is finalized after a failed round | keep the restored checkpoint together with the recorded failure history |

**Hard rules**:
- Never use `--allow-empty` for the baseline or for a direction checkpoint; never use stash or tags.
- A successful direction checkpoint is `git commit -m "wip: opt-r${N} (${directionId}: ${description})"` after the round review passes.
- Snapshot and restore `.quality-state.json`, `.quality-log.jsonl`, and `.apply-isolation.json` together: `git clean -fd` removes the untracked log, and a snapshot without its log line is treated as `dirty` (fail-closed).
- Rollback only discards speculative code; the recorded review, the failure counts, and the failed directions stay durable, and the round outcome is reported on the next `optimize` call.
- Keep the isolation metadata authoritative: confirm `HEAD` is the latest successful checkpoint before discarding work, and stop if restoration or hash verification fails.
**Quality CLI JSON Schema Reference**:

| CLI call | `--input` JSON |
| --- | --- |
| Review | `{"result":"PASS","issues":[],"evidenceFiles":["src/..."]}` |
| Optimization round | `{"directions":[{"location":{"files":["src/a.ts"]},"opportunity":"...","impact":"...","evidence":["..."],"recommendation":"...","keyDesign":"...","preservationConstraints":["..."],"implementationOutline":["..."],"validation":["..."],"impactLevel":"high","confidence":"high","risk":"low","cost":"low","dependencies":[],"priorityReason":"..."}],"attempt":{"directionId":"OPT-…","status":"verified"}}` |
| Revoke a direction | `{"directions":[{"id":"OPT-…","status":"rejected","reason":"...","evidence":["..."]}]}` |
| Finalize the loop | `{"directions":[],"attempt":{"directionId":"OPT-…","status":"verified"},"stopReason":"NO_ACTIONABLE","summary":"optimizer conclusion"}` |
| Read the state | `xirang quality status "<change-name>" --json` (no `--input`) |

- The review `result` is PASS | PASS_WITH_WARNINGS | FAIL_NEEDS_CORRECTIONS; `issues` and `evidenceFiles` are required arrays.
- A new direction carries `location.files`, `opportunity`, `impact`, `evidence`, `recommendation`, `keyDesign`, `preservationConstraints`, `implementationOutline`, `validation`, `impactLevel`, `confidence`, `risk`, `cost`, `dependencies`, `priorityReason`; omit `id` so the CLI can assign it and echo it back.
- `impactLevel`, `confidence`, `risk`, and `cost` are high | medium | low.
- Direction statuses are pending | selected | implemented | verified | failed | rejected | deferred; the CLI owns selection, implementation, and verification, and an optimizer may only revoke a direction as `rejected` or `deferred` with `reason` and `evidence`.
- Stop reasons are USER_DECLINED | NO_ACTIONABLE | DIRECTION_REJECTED | DIRECTION_LIMIT_REACHED | UNSAFE; a round that sets one also carries `summary` with the optimizer conclusion.
- Depend on another direction of the same round with `{"actionIndex": n}`; the CLI replaces it with the assigned ID.
**Quality CLI Error Recovery Guide** (decide from `code`, `diagnostics`, and `allowedNextOperations` only):
- exit 2 `INVALID_INPUT`: read every `diagnostics[]` entry and follow its `path`, `expected`, `actual`, and `fix` before resubmitting.
- exit 2 `UNKNOWN_DIRECTION`, `DIRECTION_ORDER_VIOLATION`, `ILLEGAL_DIRECTION_TRANSITION`: use only direction IDs the CLI echoed, omit `selected` so the CLI selects, and move a direction only along its published transitions.
- exit 1 `REVIEW_REQUIRED`: the current code has no matching passing record; run `xirang quality review` before the next optimization round.
- exit 1 `REVIEW_NOT_REQUIRED`: the recorded review still matches; continue with `optimize` or `seal`.
- exit 1 `DIRECTION_LIMIT_REACHED`: finalize with `{"directions":[],"stopReason":"DIRECTION_LIMIT_REACHED","summary":"..."}` or raise `optimization.directionLimit`.
- exit 1 `OPTIMIZATION_DISABLED`: only `{"directions":[],"stopReason":"USER_DECLINED","summary":"..."}` is accepted while `optimization.enabled` is false.
- exit 1 `OPTIMIZATION_FINALIZED`: seal and archive; a new optimization requires a new change.
- exit 1 `ABORTED_UNSAFE`: restore the workspace to the recorded baseline; no automatic recovery.
- A `stopReason` always travels with `summary`; a finalize payload without it is rejected with exit 2.
- exit 1 `SEAL_NOT_READY`: read the listed conditions and record the missing review conclusion or stop reason first.
- Never edit `.quality-state.json` or `.quality-log.jsonl` by hand, and never infer the code state when no record exists.
- Fail closed when isolation metadata (`baseCommit`, `optimizationBaselineCommit`) is missing or invalid.
**Simple Change Fast Path**:
- Spawn a fresh optimizer for every round while `optimization.enabled` is true and the user has not declined, including changes that only delete, rename, or remove parameters.
- Master MUST NOT generate, skip, or revoke a direction on its own; it may revoke one only by submitting a reason and evidence inside the round ledger.
- Only an optimizer round may produce `NO_ACTIONABLE`; record the optimizer's actual conclusion in the round `summary`.
- The master MUST NOT read or inline the generated `xirang-reviewer` or `xirang-optimizer` agent artifacts.