# Quality Recovery: Restart Verification in the Active Change

Use this reference only when the user explicitly asks to re-verify the active change (for example "review and optimize from scratch") or to re-run verification after another finalized optimization terminal, and the original verification flow has fully stopped. Ordinary corrections after a failed Review, rollbacks after a failed optimization direction, and resumption after an interrupted session stay in the current round and keep their counters and progress; they are never a restart.

Serial preconditions (all required before any rotation):

- No Reviewer, Optimizer, implementation task, pending result, write-back, commit, or rollback from the previous round is still running. The CLI does not detect external subagent processes; verify this yourself from the known tasks and workspace state. Never restart while a Reviewer is still out.
- Keep `changeDir/.apply-isolation.json` unchanged: same workspace identity, immutable `baseCommit`, existing `wip: opt-*` checkpoints, and commits. Do not reinitialize isolation, do not revert or delete code, and do not delete checkpoints.
- An explicit user request authorizes this procedure. Do not ask again for the same restart intent and do not require the user to run the steps by hand; without that authorization stay stopped.

## Rotation procedure: save completely, verify, then rotate

Work from `changeDir` with the platform `path` APIs so macOS, Linux, and Windows behave identically.

1. Check `changeDir/.quality-history/` for an unfinished rotation (see the re-entry table). Finish or reconcile it before anything else.
2. Create one new unique history directory `changeDir/.quality-history/<timestamp>-<suffix>/`. Never write into an existing history directory.
3. Copy the raw bytes of `.quality-state.json` and `.quality-log.jsonl` into it under their original file names, and write `recovery.json` recording the restart reason, timestamp, source association, and the SHA-256 of both saved files. `recovery.json` serves recovery orchestration and human reading only; the quality state engine never parses it, and it is not a round-identity protocol.
4. Verify both saved copies byte-for-byte (size and SHA-256) against the originals. If any save or verification fails, stop: keep the originals, do not start a new Review, and do not fake a pass.
5. With both copies verified, remove the active files from the change root one at a time (snapshot first, then the log). After both are gone, re-verify the history copies and mark the rotation complete in `recovery.json`.
6. Keep the current code, commits, checkpoints, isolation identity, and evidence baseline untouched. The history directory stays readable for later failed-round rollbacks and the final archive.

## Re-entry after interruption

| Saved history | Active originals | Action |
| --- | --- | --- |
| Incomplete | both present and consistent with the save | keep the originals, complete the same save, re-verify; no Review before the rotation completes |
| Complete and hashes verified | both present and consistent | continue that rotation; never overwrite history |
| Complete and hashes verified | only one consistent original remains | finish the remaining rotation, then confirm the change root has no old active records |
| Complete, rotation marked done | a new active record exists | continue in the new round; never rotate the new record into this old round |
| Conflicting or unidentifiable content | any | keep every file, stop, and report the exact evidence gap; do not guess what to delete |

Do not treat a missing root record as a fresh start while an unfinished rotation exists. Apply preparation, the Optimization unsafe branch, and Archive must check `.quality-history/` before routing to Review.

## After the rotation

1. Run `xirang quality status "<change-name>" --json` and require `state: "dirty"`. A PASS in the history directory never satisfies the new round.
2. Delegate a fresh-context Reviewer; validate the payload, apply only CRITICAL write-back, then record with `xirang quality review`. On `FAIL_NEEDS_CORRECTIONS`, return to the normal correction loop and review again.
3. Only after the new Review passes, establish or verify this round's checkpoint and continue the normal Optimization loop. The new ledger starts at `directionsUsed: 0` with empty histories: old terminals, used direction slots, and per-direction failure counts never carry over; read the history only as navigation and judgment reference.
4. Seal and close with the normal rules.