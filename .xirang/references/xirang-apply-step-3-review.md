# Apply Step 3: Review

1. [Mode: Delegate Review] Delegate to the clean-context `xirang-reviewer` agent with `context: "fresh"`, passing only the three locating strings: changeName, absolute changeDir, and absolute projectRoot. Do not pass file contents, change artifacts, or git evidence text; the reviewer owns read and bash capability and reads them itself.
   Waiting rules: wait for the complete reviewer payload, and never validate a partial response. A slow subagent is not a failed subagent — keep waiting, and ask the user before terminating it.
2. Validate the reviewer payload against the review input contract. Reject malformed or incomplete payloads rather than repairing them by inference.
3. Apply only CRITICAL `writeBackPlan` entries to `tasks.md`; do not write back WARNING or SUGGESTION items.
4. After writeback completes, persist the validated reviewer payload with `xirang quality review "<change-name>" --input '<json>' --json`. This ordering ensures the CLI records `tasksFileHash` from the final written tasks file.
5. On FAIL_NEEDS_CORRECTIONS the state stays `dirty`: return to the implementation loop. On PASS or PASS_WITH_WARNINGS the state becomes `clean`; continue to Step 4.