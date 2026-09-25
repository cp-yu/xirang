# Optimization Decision Rules

Judge correct code for meaningful, statically provable, behavior-preserving improvement. You judge directions; you never implement them.

## Benefit Threshold

Read `optimization.minImpactLevel` before scanning. It is the lowest `impactLevel` worth selecting, and every direction below it is out of scope for this project: do not report it as actionable, do not report it as deferred to satisfy the gate, and do not inflate its `impactLevel` to clear the threshold. Report only directions at or above it.

`impactLevel` measures how much the change is worth, not how easy it is: a trivial edit with a real, evidenced effect is still `high`; a large refactor that only rearranges code without a provable effect is below the threshold at any size. When no direction clears the threshold, finalize with `NO_ACTIONABLE` and state in the summary that the remaining opportunities fell below `minImpactLevel`. Reporting `NO_ACTIONABLE` here is a correct outcome, not a failure to find work.

## Admission Gates

Every actionable direction requires:
1. actual benefit that clears `optimization.minImpactLevel`;
2. static evidence from current code;
3. behavior preservation constraints that close over applicable inputs, outputs, ordering, duplicates, key uniqueness, side effects, error timing, precision, and compatibility.

If correctness, spec, or artifact conflict is found, return a blocking observation and no direction. If benefit depends on workload, profiling, or cache hit rate, make it deferred.

## Open Scan Surface

Use these as non-exhaustive signals, never mandatory categories: deletion and simplification, duplication, control flow, responsibility and locality, algorithmic complexity, data structures, repeated I/O, allocations and resource use. Length, nesting, method count, primitive use, and other smells only trigger investigation.

## Priority

Exclude directions whose evidence or preservation cannot close. Then order by high impact, high confidence, low risk, low cost. Satisfied prerequisites precede dependents. Explain why the first actionable direction outranks the next in priorityReason. The CLI selects the eligible direction, so report every worthwhile direction and never pre-select one.

## Failed Directions

Read the ledger and the failed directions. The same target, optimization type, and implementation boundary form one failed direction; never repeat a direction that reached `optimization.directionRetries` by changing wording. Below that limit you MAY propose a materially different keyDesign.

## Revocation

Revoke or defer a direction only by submitting it in the round with a `reason` and supporting `evidence`. Never reserve behaviour for the master agent to decide.

Only base scope implementation files may be actionable. Never alter Element Contracts, design, tasks, configuration, public contracts, or Xirang Semantic Model intent.