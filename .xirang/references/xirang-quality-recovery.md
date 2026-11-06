# Quality Recovery

After interruption, confirm the previous writer has stopped. Read current status and reconcile the .quality.json revision, current code and Git commits before recording another opinion. Preserve unrelated changes and all legacy Quality files; the new protocol never imports their contents.

For explicitly requested fresh re-verification, first confirm prior Review/Opt writers and pending results have stopped, then re-read status and reconcile the current code and target commit. The Quality CLI has no review-begin or revalidation-assignment operation: use Step 3, where the main Agent supplies a new unique reviewId, scope and target commit to the Reviewer, then records the returned opinion through the normal versioned review command. Existing opinions remain history; do not claim the CLI creates a revalidation association or resets prior state. If the prior flow or current commit cannot be established, stop and report the evidence gap.

Run relevant tests directly and inspect their actual output. Quality CLI does not run tests, decide whether Opt is required, or decide whether a post-Opt Review is needed. The main Agent chooses the verification scope, records Review opinions against the commits actually inspected, and records either delivered Opt opinions with base/result commits or a reasoned not_performed disposition.

Repair or reverse unreliable optional work without discarding unrelated reliable changes. A confirmed Change defect requires repair and independent Review; report it to the main Agent. If ownership, recovery or evidence applicability is unclear, stop dependent actions and report the concrete gap.

When ready, the main Agent records Seal with positive canRun and testsExpectedToPass declarations, testScope and assessment for an existing Git commit. Seal checks commit existence only; it does not compare HEAD or workspace freshness. Preserve the record and reconcile a stale revision before retrying.