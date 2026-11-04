# Diagnosing Optimization Failures

Use these methods when they help identify an optimization failure. They have no mandatory order, required bisection or automatic whole-group rollback; choose a better method when the evidence warrants it.

Start with the actual failing behavior, command output or independent Review finding and the state that produced it. Compare with the reviewed baseline or another known state when useful to distinguish an optimization regression from a defect already present. Preserve evidence before modifying what you need to understand.

When a local test or final Review identifies the problematic change, inspect it, repair or reverse that part, and run affected verification while retaining reliable improvements. When a merged group is unclear, possible methods include a smaller reproducer, data-flow tracing, boundary inputs, comparing individual changes, splitting or bisection. Individual tests may pass while the combination fails; inspect shared state, call ordering, assumptions and combined behavior.

Stop repetition without new evidence or substantive progress. An optional attempt may be abandoned: at that time save the item, reason and treatment through `quality delegation` action=save with its original delegationId and current global --version. Preserve the failed attempt separately from retained benefits and verify the restored state through `quality verification`. Deliver actual evidence and tell main so the user is informed.

If a partial reversal is unreliable, return to an identifiable baseline without discarding unrelated work, records or history. If reliable recovery cannot be established, stop and report the uncertainty to main. Never force a successful checkpoint.

A defect already present in this Change before optimization is not optional abandonment. Give the evidence to main; confirmed defects require repair and independent targeted Review of the problem and its impact before completion. Unrelated historical defects and requirement conflicts also return to main rather than silently expanding scope or changing intent.

The final decision still belongs to main: local success supports recovery and delivery, while completion depends on cumulative required verification, current evidence applicability and reliable recovery. Read `.xirang/references/xirang-quality-cli.md` for actual payloads and version handling.