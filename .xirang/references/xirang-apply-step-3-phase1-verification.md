# Apply Step 3: Phase 1 Verification

1. Delegate to the clean-context `xirang-reviewer` agent with `context: "fresh"` and the current changeName, absolute changeDir, and absolute projectRoot.
2. Validate the reviewer payload against the Phase 1 input contract. Reject malformed or incomplete payloads rather than repairing them by inference.
3. Apply only CRITICAL `writeBackPlan` entries to `tasks.md`; do not write back WARNING or SUGGESTION items.
4. After writeback completes, persist the validated reviewer payload with `xirang verify phase1 "<change-name>" --input '<json>' --json`. This ordering ensures the CLI records `tasksFileHash` from the final written tasks file.
5. On FAIL_NEEDS_CORRECTIONS, return to Phase 0. On PASS or PASS_WITH_WARNINGS, continue to Phase 2.