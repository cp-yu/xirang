# Optimization Decision Rules

Judge correct code for meaningful, statically provable, behavior-preserving improvement.

## Admission Gates

Every actionable finding requires:
1. actual benefit;
2. static evidence from current code;
3. behavior preservation constraints that close over applicable inputs, outputs, ordering, duplicates, key uniqueness, side effects, error timing, precision, and compatibility.

If correctness, spec, or artifact conflict is found, return blockingObservations and no selected optimization. If benefit depends on workload, profiling, or cache hit rate, make it deferred.

## Open Scan Surface

Use these as non-exhaustive signals, never mandatory categories: deletion and simplification, duplication, control flow, responsibility and locality, algorithmic complexity, data structures, repeated I/O, allocations and resource use. Length, nesting, method count, primitive use, and other smells only trigger investigation.

## Priority

Exclude findings whose evidence or preservation cannot close. Then order by high impact, high confidence, low risk, low cost. Satisfied prerequisites precede dependents. Explain why the first actionable finding outranks the next in priorityReason.

## Reconciliation

Read current code, findings, history, and failedDirections. Reconcile every non-terminal finding: retain, reprioritize, resolve, invalidate, reject, or merge it, and add newly discovered opportunities. Never repeat an exhausted failed direction by changing wording. Existing stable IDs belong to the CLI; new add actions omit IDs. Same-envelope dependencies may use actionIndex.

Only base scope implementation files may be actionable. Never alter Specs, design, tasks, configuration, public contracts, or OPSX Semantic Model intent.